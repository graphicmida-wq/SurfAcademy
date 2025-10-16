import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { Loader2, Save, ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomPage, PageBlock } from "@shared/schema";
import { RichTextEditor } from "@/components/RichTextEditor";
import { ImageBlockEditor } from "@/components/ImageBlockEditor";
import BannerBlockEditor from "@/components/BannerBlockEditor";
import ContainerBlockEditor from "@/components/ContainerBlockEditor";
import GalleryBlockEditor from "@/components/GalleryBlockEditor";

export default function CustomPageEditor() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isNew = !id || id === 'new';

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    headerImageUrl: '',
    headerTitle: '',
    headerSubtitle: '',
    published: false,
    seoTitle: '',
    seoDescription: ''
  });

  const [blocks, setBlocks] = useState<any[]>([]);
  const [editingBlock, setEditingBlock] = useState<number | null>(null);

  const { data: page, isLoading } = useQuery<CustomPage>({
    queryKey: id && id !== 'new' ? [`/api/admin/custom-pages/${id}`] : ['disabled'],
    enabled: !isNew,
  });

  const { data: existingBlocks } = useQuery<PageBlock[]>({
    queryKey: page?.id ? ['/api/custom-pages', page.id, 'blocks'] : ['disabled'],
    enabled: !!page?.id,
  });

  useEffect(() => {
    if (page) {
      setFormData({
        slug: page.slug,
        title: page.title,
        headerImageUrl: page.headerImageUrl || '',
        headerTitle: page.headerTitle || '',
        headerSubtitle: page.headerSubtitle || '',
        published: page.published === true,
        seoTitle: page.seoTitle || '',
        seoDescription: page.seoDescription || ''
      });
    }
  }, [page]);

  useEffect(() => {
    if (existingBlocks) {
      setBlocks(existingBlocks.map(b => ({
        id: b.id,
        type: b.type,
        order: b.orderIndex,
        content: b.contentJson
      })));
    }
  }, [existingBlocks]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let pageId = id;
      
      if (isNew) {
        const response = await apiRequest("POST", "/api/admin/custom-pages", formData);
        const newPage = await response.json();
        pageId = newPage.id;
        
        // Auto-create pageHeader for new custom page using NEW slug
        await apiRequest("PUT", `/api/admin/page-headers/${formData.slug}`, {
          imageUrl: formData.headerImageUrl || '',
          title: formData.headerTitle || formData.title,
          subtitle: formData.headerSubtitle || '',
          paddingTop: 'py-16',
          paddingBottom: 'py-24',
          minHeight: 'min-h-96'
        });
      } else {
        await apiRequest("PUT", `/api/admin/custom-pages/${id}`, formData);
        
        // If slug changed, delete old pageHeader and create new one
        if (page?.slug && page.slug !== formData.slug) {
          try {
            await apiRequest("DELETE", `/api/admin/page-headers/${page.slug}`);
          } catch (error) {
            console.warn("Could not delete old page header:", error);
            // Old header might not exist, continue anyway
          }
        }
        
        // Create/update pageHeader using NEW slug from formData
        await apiRequest("PUT", `/api/admin/page-headers/${formData.slug}`, {
          imageUrl: formData.headerImageUrl || '',
          title: formData.headerTitle || formData.title,
          subtitle: formData.headerSubtitle || '',
          paddingTop: 'py-16',
          paddingBottom: 'py-24',
          minHeight: 'min-h-96'
        });
      }

      // Delete all existing blocks
      if (!isNew && existingBlocks) {
        await Promise.all(
          existingBlocks.map(b => 
            apiRequest("DELETE", `/api/admin/page-blocks/${b.id}`)
          )
        );
      }

      // Create new blocks
      await Promise.all(
        blocks.map((block, index) =>
          apiRequest("POST", `/api/admin/custom-pages/${pageId}/blocks`, {
            type: block.type,
            orderIndex: index + 1,
            contentJson: block.content
          })
        )
      );

      return pageId;
    },
    onSuccess: (pageId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-pages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/page-headers'] });
      toast({
        title: "Salvato!",
        description: "La pagina è stata salvata con successo.",
      });
      if (isNew) {
        setLocation(`/admin/pages/${pageId}/edit`);
      }
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la pagina.",
        variant: "destructive",
      });
    },
  });

  const addBlock = (type: string) => {
    const newBlock = {
      id: `temp-${Date.now()}`,
      type,
      order: blocks.length + 1,
      content: getDefaultContent(type)
    };
    setBlocks([...blocks, newBlock]);
    setEditingBlock(blocks.length);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockContent = (index: number, content: any) => {
    const newBlocks = [...blocks];
    newBlocks[index].content = content;
    setBlocks(newBlocks);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/admin/pages')}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold font-display">
            {isNew ? 'Nuova Pagina Custom' : 'Modifica Pagina Custom'}
          </h1>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !formData.title || !formData.slug}
          data-testid="button-save"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvataggio...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salva Pagina
            </>
          )}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Pagina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titolo *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Chi Siamo"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug URL *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="chi-siamo"
                  required
                  data-testid="input-slug"
                />
                <p className="text-xs text-muted-foreground">
                  La pagina sarà disponibile su: /p/{formData.slug || 'slug'}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="published">Pubblicata</Label>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
                  data-testid="switch-published"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header Pagina</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headerImageUrl">Immagine Header</Label>
                <Input
                  id="headerImageUrl"
                  value={formData.headerImageUrl}
                  onChange={(e) => setFormData({ ...formData, headerImageUrl: e.target.value })}
                  placeholder="/objects/uploads/..."
                  data-testid="input-header-image"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerTitle">Titolo Header</Label>
                <Input
                  id="headerTitle"
                  value={formData.headerTitle}
                  onChange={(e) => setFormData({ ...formData, headerTitle: e.target.value })}
                  placeholder="Lascia vuoto per usare il titolo pagina"
                  data-testid="input-header-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="headerSubtitle">Sottotitolo Header</Label>
                <Textarea
                  id="headerSubtitle"
                  value={formData.headerSubtitle}
                  onChange={(e) => setFormData({ ...formData, headerSubtitle: e.target.value })}
                  rows={2}
                  data-testid="input-header-subtitle"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="Lascia vuoto per usare il titolo pagina"
                  data-testid="input-seo-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  rows={3}
                  data-testid="input-seo-description"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Blocks Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Blocchi Contenuto</CardTitle>
                <Select onValueChange={addBlock}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Aggiungi Blocco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Testo</SelectItem>
                    <SelectItem value="image">Immagine</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="container">Container/Layout</SelectItem>
                    <SelectItem value="cta">Call-to-Action</SelectItem>
                    <SelectItem value="gallery">Galleria</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {blocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nessun blocco aggiunto. Usa il menu sopra per aggiungere contenuti.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <BlockEditorItem
                      key={block.id}
                      block={block}
                      index={index}
                      isEditing={editingBlock === index}
                      onEdit={() => setEditingBlock(editingBlock === index ? null : index)}
                      onRemove={() => removeBlock(index)}
                      onMoveUp={() => moveBlock(index, 'up')}
                      onMoveDown={() => moveBlock(index, 'down')}
                      onUpdate={(content: any) => updateBlockContent(index, content)}
                      canMoveUp={index > 0}
                      canMoveDown={index < blocks.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BlockEditorItem({ block, index, isEditing, onEdit, onRemove, onMoveUp, onMoveDown, onUpdate, canMoveUp, canMoveDown }: any) {
  const blockTypeLabels = {
    text: 'Testo',
    image: 'Immagine',
    cta: 'Call-to-Action',
    gallery: 'Galleria',
    video: 'Video'
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{blockTypeLabels[block.type as keyof typeof blockTypeLabels]}</span>
            <span className="text-sm text-muted-foreground">#{index + 1}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onMoveUp} disabled={!canMoveUp}>
              ↑
            </Button>
            <Button variant="ghost" size="sm" onClick={onMoveDown} disabled={!canMoveDown}>
              ↓
            </Button>
            <Button variant="ghost" size="sm" onClick={onEdit}>
              {isEditing ? 'Chiudi' : 'Modifica'}
            </Button>
            <Button variant="ghost" size="sm" onClick={onRemove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isEditing && (
        <CardContent>
          <BlockForm type={block.type} content={block.content} onChange={onUpdate} />
        </CardContent>
      )}
    </Card>
  );
}

function BlockForm({ type, content, onChange }: { type: string; content: any; onChange: (content: any) => void }): JSX.Element | null {
  if (type === 'text') {
    return (
      <RichTextEditor
        html={content.html || ''}
        typography={content.typography}
        spacing={content.spacing}
        onChange={onChange}
      />
    );
  }

  if (type === 'image') {
    return <ImageBlockEditor content={content} onChange={onChange} />;
  }

  if (type === 'banner') {
    return <BannerBlockEditor content={content} onChange={onChange} />;
  }

  if (type === 'container') {
    return <ContainerBlockEditor content={content} onChange={onChange} />;
  }

  if (type === 'cta') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Titolo</Label>
          <Input
            value={content.title || ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            placeholder="Inizia Ora"
          />
        </div>
        <div className="space-y-2">
          <Label>Descrizione</Label>
          <Textarea
            value={content.description || ''}
            onChange={(e) => onChange({ ...content, description: e.target.value })}
            rows={2}
            placeholder="Testo descrittivo opzionale"
          />
        </div>
        <div className="space-y-2">
          <Label>Testo Pulsante</Label>
          <Input
            value={content.buttonText || ''}
            onChange={(e) => onChange({ ...content, buttonText: e.target.value })}
            placeholder="Scopri di più"
          />
        </div>
        <div className="space-y-2">
          <Label>Link Pulsante</Label>
          <Input
            value={content.buttonUrl || ''}
            onChange={(e) => onChange({ ...content, buttonUrl: e.target.value })}
            placeholder="/courses"
          />
        </div>
      </div>
    );
  }

  if (type === 'gallery') {
    return <GalleryBlockEditor content={content} onChange={onChange} />;
  }

  if (type === 'video') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>URL Video (YouTube/Vimeo)</Label>
          <Input
            value={content.url || ''}
            onChange={(e) => onChange({ ...content, url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
        <div className="space-y-2">
          <Label>Titolo</Label>
          <Input
            value={content.title || ''}
            onChange={(e) => onChange({ ...content, title: e.target.value })}
            placeholder="Titolo video"
          />
        </div>
      </div>
    );
  }

  return null;
}

function getDefaultContent(type: string): any {
  switch (type) {
    case 'text':
      return { html: '<p>Il tuo contenuto qui...</p>' };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'banner':
      return { variant: 'boxed', content: {}, cta: {} };
    case 'container':
      return { layout: 'columns', columns: 2, gap: '1rem', children: [] };
    case 'cta':
      return { title: '', description: '', buttonText: '', buttonUrl: '' };
    case 'gallery':
      return { images: [], variant: 'grid', columns: 3, gap: '1rem' };
    case 'video':
      return { url: '', title: '' };
    default:
      return {};
  }
}

import { useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { GalleryBlockContent } from '@shared/schema';

interface GalleryBlockEditorProps {
  content: GalleryBlockContent;
  onChange: (content: GalleryBlockContent) => void;
}

export default function GalleryBlockEditor({ content, onChange }: GalleryBlockEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateContent = (updates: Partial<GalleryBlockContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateSpacing = (field: string, value: any) => {
    updateContent({
      spacing: { ...(content.spacing ?? {}), [field]: value }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Errore',
        description: 'Seleziona un file immagine valido',
        variant: 'destructive'
      });
      return;
    }

    setIsUploading(true);

    try {
      const urlRes = await fetch('/api/object-storage/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      });

      if (!urlRes.ok) {
        throw new Error('Errore nel generare URL di upload');
      }

      const { uploadUrl, objectPath } = await urlRes.json();

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadRes.ok) {
        throw new Error('Errore durante upload del file');
      }

      const newImages = [...(content.images || []), { url: objectPath, alt: '', caption: '' }];
      updateContent({ images: newImages });

      toast({
        title: 'Successo',
        description: 'Immagine aggiunta alla galleria'
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore durante upload',
        variant: 'destructive'
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = content.images.filter((_, i) => i !== index);
    updateContent({ images: newImages });
  };

  const updateImage = (index: number, field: 'url' | 'alt' | 'caption', value: string) => {
    const newImages = [...content.images];
    newImages[index] = { ...newImages[index], [field]: value };
    updateContent({ images: newImages });
  };

  return (
    <Tabs defaultValue="images" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="images" data-testid="tab-gallery-images">Immagini</TabsTrigger>
        <TabsTrigger value="layout" data-testid="tab-gallery-layout">Layout</TabsTrigger>
        <TabsTrigger value="carousel" data-testid="tab-gallery-carousel">Carousel</TabsTrigger>
        <TabsTrigger value="spacing" data-testid="tab-gallery-spacing">Spaziatura</TabsTrigger>
      </TabsList>

      <TabsContent value="images" className="space-y-4">
        <div className="space-y-2">
          <Label>Carica Immagine</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              data-testid="button-gallery-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Caricamento...' : 'Aggiungi Immagine'}
            </Button>
          </div>
        </div>

        {content.images && content.images.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">{content.images.length} immagine/i in galleria</p>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {content.images.map((img, index) => (
                <div key={index} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div>
                        <Label className="text-xs">URL</Label>
                        <Input
                          type="url"
                          value={img.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          placeholder="https://..."
                          data-testid={`input-gallery-url-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Alt Text</Label>
                        <Input
                          value={img.alt || ''}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          placeholder="Descrizione immagine"
                          data-testid={`input-gallery-alt-${index}`}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Didascalia</Label>
                        <Input
                          value={img.caption || ''}
                          onChange={(e) => updateImage(index, 'caption', e.target.value)}
                          placeholder="Didascalia opzionale"
                          data-testid={`input-gallery-caption-${index}`}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {img.url && (
                        <div className="w-20 h-20 border rounded overflow-hidden bg-muted">
                          <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        data-testid={`button-gallery-remove-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna immagine caricata</p>
        )}
      </TabsContent>

      <TabsContent value="layout" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="gallery-variant">Variante Galleria</Label>
          <Select
            value={content.variant}
            onValueChange={(value) => updateContent({ variant: value as 'carousel' | 'masonry' | 'grid' })}
          >
            <SelectTrigger id="gallery-variant" data-testid="select-gallery-variant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="carousel">Carousel (slider)</SelectItem>
              <SelectItem value="masonry">Masonry (disposizione casuale)</SelectItem>
              <SelectItem value="grid">Grid (griglia regolare)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(content.variant === 'masonry' || content.variant === 'grid') && (
          <>
            <div className="space-y-2">
              <Label htmlFor="gallery-columns">Colonne Desktop</Label>
              <Select
                value={content.columns?.toString() || '3'}
                onValueChange={(value) => updateContent({ columns: parseInt(value) })}
              >
                <SelectTrigger id="gallery-columns" data-testid="select-gallery-columns">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Colonna</SelectItem>
                  <SelectItem value="2">2 Colonne</SelectItem>
                  <SelectItem value="3">3 Colonne</SelectItem>
                  <SelectItem value="4">4 Colonne</SelectItem>
                  <SelectItem value="5">5 Colonne</SelectItem>
                  <SelectItem value="6">6 Colonne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-columns-tablet">Colonne Tablet</Label>
              <Select
                value={content.columnsTablet?.toString() || '2'}
                onValueChange={(value) => updateContent({ columnsTablet: parseInt(value) })}
              >
                <SelectTrigger id="gallery-columns-tablet" data-testid="select-gallery-columns-tablet">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Colonna</SelectItem>
                  <SelectItem value="2">2 Colonne</SelectItem>
                  <SelectItem value="3">3 Colonne</SelectItem>
                  <SelectItem value="4">4 Colonne</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gallery-columns-mobile">Colonne Mobile</Label>
              <Select
                value={content.columnsMobile?.toString() || '1'}
                onValueChange={(value) => updateContent({ columnsMobile: parseInt(value) })}
              >
                <SelectTrigger id="gallery-columns-mobile" data-testid="select-gallery-columns-mobile">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Colonna</SelectItem>
                  <SelectItem value="2">2 Colonne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="gallery-gap">Gap (spaziatura tra elementi)</Label>
          <Input
            id="gallery-gap"
            type="text"
            placeholder="es. 1rem, 20px"
            value={content.gap || ''}
            onChange={(e) => updateContent({ gap: e.target.value })}
            data-testid="input-gallery-gap"
          />
        </div>
      </TabsContent>

      <TabsContent value="carousel" className="space-y-4">
        {content.variant === 'carousel' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="gallery-items-per-page">Elementi per pagina</Label>
              <Select
                value={content.itemsPerPage?.toString() || '1'}
                onValueChange={(value) => updateContent({ itemsPerPage: parseInt(value) })}
              >
                <SelectTrigger id="gallery-items-per-page" data-testid="select-gallery-items-per-page">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="gallery-autoplay">Autoplay</Label>
                <Switch
                  id="gallery-autoplay"
                  checked={content.autoplay || false}
                  onCheckedChange={(checked) => updateContent({ autoplay: checked })}
                  data-testid="switch-gallery-autoplay"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="gallery-loop">Loop infinito</Label>
                <Switch
                  id="gallery-loop"
                  checked={content.loop || false}
                  onCheckedChange={(checked) => updateContent({ loop: checked })}
                  data-testid="switch-gallery-loop"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="gallery-arrows">Mostra frecce</Label>
                <Switch
                  id="gallery-arrows"
                  checked={content.showArrows !== false}
                  onCheckedChange={(checked) => updateContent({ showArrows: checked })}
                  data-testid="switch-gallery-arrows"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="gallery-dots">Mostra puntini</Label>
                <Switch
                  id="gallery-dots"
                  checked={content.showDots !== false}
                  onCheckedChange={(checked) => updateContent({ showDots: checked })}
                  data-testid="switch-gallery-dots"
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Le impostazioni carousel sono disponibili solo per variante Carousel</p>
        )}
      </TabsContent>

      <TabsContent value="spacing" className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm font-medium">Padding</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Top</Label>
              <Input
                type="text"
                placeholder="es. 2rem"
                value={content.spacing?.paddingTop || ''}
                onChange={(e) => updateSpacing('paddingTop', e.target.value)}
                data-testid="input-gallery-padding-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 2rem"
                value={content.spacing?.paddingBottom || ''}
                onChange={(e) => updateSpacing('paddingBottom', e.target.value)}
                data-testid="input-gallery-padding-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingLeft || ''}
                onChange={(e) => updateSpacing('paddingLeft', e.target.value)}
                data-testid="input-gallery-padding-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingRight || ''}
                onChange={(e) => updateSpacing('paddingRight', e.target.value)}
                data-testid="input-gallery-padding-right"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Margin</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Top</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.marginTop || ''}
                onChange={(e) => updateSpacing('marginTop', e.target.value)}
                data-testid="input-gallery-margin-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.marginBottom || ''}
                onChange={(e) => updateSpacing('marginBottom', e.target.value)}
                data-testid="input-gallery-margin-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginLeft || ''}
                onChange={(e) => updateSpacing('marginLeft', e.target.value)}
                data-testid="input-gallery-margin-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginRight || ''}
                onChange={(e) => updateSpacing('marginRight', e.target.value)}
                data-testid="input-gallery-margin-right"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

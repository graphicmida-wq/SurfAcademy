import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ImageBlockContent } from "@shared/schema";

interface ImageBlockEditorProps {
  content: Partial<ImageBlockContent>;
  onChange: (content: Partial<ImageBlockContent>) => void;
}

export function ImageBlockEditor({ content, onChange }: ImageBlockEditorProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const updateContent = (key: keyof ImageBlockContent, value: any) => {
    onChange({ ...content, [key]: value });
  };

  const updateDimensions = (key: string, value: string) => {
    onChange({
      ...content,
      dimensions: { ...content.dimensions, [key]: value }
    });
  };

  const updateSpacing = (key: string, value: string) => {
    onChange({
      ...content,
      spacing: { ...content.spacing, [key]: value }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Errore",
        description: "Seleziona un file immagine valido",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Get upload URL
      const urlResponse = await fetch('/api/object-storage/upload-url', {
        method: 'POST',
        credentials: 'include'
      });

      if (!urlResponse.ok) {
        throw new Error('Impossibile ottenere URL di upload');
      }

      const { url: uploadUrl, objectPath } = await urlResponse.json();

      // Upload file to GCS
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Errore durante upload');
      }

      // Update content with image URL
      updateContent('url', objectPath);

      toast({
        title: "Successo!",
        description: "Immagine caricata con successo"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare l'immagine",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Tabs defaultValue="image" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="image" data-testid="tab-image">Immagine</TabsTrigger>
        <TabsTrigger value="dimensions" data-testid="tab-dimensions">Dimensioni</TabsTrigger>
        <TabsTrigger value="spacing" data-testid="tab-spacing">Spaziatura</TabsTrigger>
      </TabsList>

      <TabsContent value="image" className="space-y-4">
        <div className="space-y-2">
          <Label>Upload Immagine</Label>
          <div className="flex gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="flex-1"
              data-testid="input-file-upload"
            />
            {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
          <p className="text-xs text-muted-foreground">
            O inserisci URL manualmente sotto
          </p>
        </div>

        <div className="space-y-2">
          <Label>URL Immagine</Label>
          <Input
            value={content.url || ''}
            onChange={(e) => updateContent('url', e.target.value)}
            placeholder="/objects/uploads/... o https://..."
            data-testid="input-image-url"
          />
        </div>

        {content.url && (
          <div className="border rounded-md p-2">
            <img
              src={content.url}
              alt={content.alt || 'Preview'}
              className="max-w-full h-auto max-h-48 object-contain"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label>Alt Text (Accessibilità)</Label>
          <Input
            value={content.alt || ''}
            onChange={(e) => updateContent('alt', e.target.value)}
            placeholder="Descrizione immagine per screen reader"
            data-testid="input-alt-text"
          />
        </div>

        <div className="space-y-2">
          <Label>Didascalia</Label>
          <Input
            value={content.caption || ''}
            onChange={(e) => updateContent('caption', e.target.value)}
            placeholder="Didascalia opzionale"
            data-testid="input-caption"
          />
        </div>

        <div className="space-y-2">
          <Label>Link (opzionale)</Label>
          <div className="flex gap-2">
            <Input
              value={content.link || ''}
              onChange={(e) => updateContent('link', e.target.value)}
              placeholder="/courses, https://..."
              className="flex-1"
              data-testid="input-link"
            />
            {content.link && (
              <Button
                variant="outline"
                size="icon"
                asChild
                data-testid="button-test-link"
              >
                <a href={content.link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="dimensions" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width</Label>
            <Input
              type="text"
              value={content.dimensions?.width || ''}
              onChange={(e) => updateDimensions('width', e.target.value)}
              placeholder="100%, 500px, auto"
              data-testid="input-width"
            />
          </div>

          <div className="space-y-2">
            <Label>Height</Label>
            <Input
              type="text"
              value={content.dimensions?.height || ''}
              onChange={(e) => updateDimensions('height', e.target.value)}
              placeholder="auto, 300px, 50vh"
              data-testid="input-height"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Aspect Ratio</Label>
          <Select
            value={content.dimensions?.aspectRatio || ''}
            onValueChange={(value) => updateDimensions('aspectRatio', value)}
          >
            <SelectTrigger data-testid="select-aspect-ratio">
              <SelectValue placeholder="Auto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Auto</SelectItem>
              <SelectItem value="1/1">Quadrato (1:1)</SelectItem>
              <SelectItem value="4/3">Standard (4:3)</SelectItem>
              <SelectItem value="16/9">Widescreen (16:9)</SelectItem>
              <SelectItem value="21/9">Ultrawide (21:9)</SelectItem>
              <SelectItem value="3/2">Fotografico (3:2)</SelectItem>
              <SelectItem value="2/3">Ritratto (2:3)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Mantiene le proporzioni dell'immagine
          </p>
        </div>

        <div className="space-y-2">
          <Label>Allineamento</Label>
          <Select
            value={content.alignment || ''}
            onValueChange={(value) => updateContent('alignment', value as any)}
          >
            <SelectTrigger data-testid="select-alignment">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Default</SelectItem>
              <SelectItem value="left">Sinistra</SelectItem>
              <SelectItem value="center">Centro</SelectItem>
              <SelectItem value="right">Destra</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="spacing" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Margin Top</Label>
            <Input
              type="text"
              value={content.spacing?.marginTop || ''}
              onChange={(e) => updateSpacing('marginTop', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-margin-top"
            />
          </div>

          <div className="space-y-2">
            <Label>Margin Bottom</Label>
            <Input
              type="text"
              value={content.spacing?.marginBottom || ''}
              onChange={(e) => updateSpacing('marginBottom', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-margin-bottom"
            />
          </div>

          <div className="space-y-2">
            <Label>Margin Left</Label>
            <Input
              type="text"
              value={content.spacing?.marginLeft || ''}
              onChange={(e) => updateSpacing('marginLeft', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-margin-left"
            />
          </div>

          <div className="space-y-2">
            <Label>Margin Right</Label>
            <Input
              type="text"
              value={content.spacing?.marginRight || ''}
              onChange={(e) => updateSpacing('marginRight', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-margin-right"
            />
          </div>

          <div className="space-y-2">
            <Label>Padding Top</Label>
            <Input
              type="text"
              value={content.spacing?.paddingTop || ''}
              onChange={(e) => updateSpacing('paddingTop', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-padding-top"
            />
          </div>

          <div className="space-y-2">
            <Label>Padding Bottom</Label>
            <Input
              type="text"
              value={content.spacing?.paddingBottom || ''}
              onChange={(e) => updateSpacing('paddingBottom', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-padding-bottom"
            />
          </div>

          <div className="space-y-2">
            <Label>Padding Left</Label>
            <Input
              type="text"
              value={content.spacing?.paddingLeft || ''}
              onChange={(e) => updateSpacing('paddingLeft', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-padding-left"
            />
          </div>

          <div className="space-y-2">
            <Label>Padding Right</Label>
            <Input
              type="text"
              value={content.spacing?.paddingRight || ''}
              onChange={(e) => updateSpacing('paddingRight', e.target.value)}
              placeholder="0px, 1rem, 2em"
              data-testid="input-padding-right"
            />
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

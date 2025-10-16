import { useState, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BannerBlockContent } from '@shared/schema';

interface BannerBlockEditorProps {
  content: BannerBlockContent;
  onChange: (content: BannerBlockContent) => void;
}

const fontFamilies = [
  { value: 'inherit', label: 'Eredita' },
  { value: 'Montserrat', label: 'Montserrat (Titoli)' },
  { value: 'Inter', label: 'Inter (Corpo)' },
  { value: 'serif', label: 'Serif' },
  { value: 'monospace', label: 'Monospace' },
];

const buttonVariants = [
  { value: 'default', label: 'Default' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'outline', label: 'Outline' },
  { value: 'ghost', label: 'Ghost' },
];

const buttonSizes = [
  { value: 'default', label: 'Default' },
  { value: 'sm', label: 'Small' },
  { value: 'lg', label: 'Large' },
];

export default function BannerBlockEditor({ content, onChange }: BannerBlockEditorProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const updateContent = (updates: Partial<BannerBlockContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateContentField = (field: string, value: any) => {
    updateContent({
      content: { ...content.content, [field]: value }
    });
  };

  const updateTitleTypography = (field: string, value: any) => {
    updateContent({
      content: {
        ...content.content,
        titleTypography: { ...content.content?.titleTypography, [field]: value }
      }
    });
  };

  const updateSubtitleTypography = (field: string, value: any) => {
    updateContent({
      content: {
        ...content.content,
        subtitleTypography: { ...content.content?.subtitleTypography, [field]: value }
      }
    });
  };

  const updateCTA = (field: string, value: any) => {
    updateContent({
      cta: { ...content.cta, [field]: value }
    });
  };

  const updateButtonStyle = (field: string, value: any) => {
    updateContent({
      cta: {
        ...content.cta,
        buttonStyle: { ...content.cta?.buttonStyle, [field]: value }
      }
    });
  };

  const updateSpacing = (field: string, value: any) => {
    updateContent({
      spacing: { ...content.spacing, [field]: value }
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

      updateContent({ backgroundImage: objectPath });

      toast({
        title: 'Successo',
        description: 'Immagine caricata con successo'
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

  return (
    <Tabs defaultValue="layout" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="layout" data-testid="tab-banner-layout">Layout</TabsTrigger>
        <TabsTrigger value="content" data-testid="tab-banner-content">Contenuto</TabsTrigger>
        <TabsTrigger value="cta" data-testid="tab-banner-cta">CTA</TabsTrigger>
        <TabsTrigger value="spacing" data-testid="tab-banner-spacing">Spaziatura</TabsTrigger>
      </TabsList>

      <TabsContent value="layout" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="banner-variant">Variante</Label>
          <Select
            value={content.variant}
            onValueChange={(value) => updateContent({ variant: value as 'boxed' | 'fullwidth' })}
          >
            <SelectTrigger id="banner-variant" data-testid="select-banner-variant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="boxed">Boxed (contenuto limitato)</SelectItem>
              <SelectItem value="fullwidth">Fullwidth (larghezza intera)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Immagine di sfondo</Label>
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
              data-testid="button-banner-upload"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Caricamento...' : 'Carica Immagine'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-bg-image-url">URL Immagine Sfondo (manuale)</Label>
          <Input
            id="banner-bg-image-url"
            type="url"
            placeholder="https://esempio.com/immagine.jpg"
            value={content.backgroundImage || ''}
            onChange={(e) => updateContent({ backgroundImage: e.target.value })}
            data-testid="input-banner-bg-image"
          />
        </div>

        {content.backgroundImage && (
          <div className="space-y-2">
            <Label>Anteprima sfondo</Label>
            <div className="relative w-full h-32 border rounded-md overflow-hidden bg-muted">
              <img
                src={content.backgroundImage}
                alt="Preview sfondo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="banner-bg-color">Colore di sfondo</Label>
          <div className="flex gap-2">
            {content.backgroundColor ? (
              <Input
                id="banner-bg-color"
                type="color"
                value={content.backgroundColor}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                className="w-20 h-9"
                data-testid="input-banner-bg-color"
              />
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => updateContent({ backgroundColor: '#000000' })}
                data-testid="button-banner-add-bg-color"
              >
                Aggiungi colore
              </Button>
            )}
            {content.backgroundColor && (
              <>
                <Input
                  type="text"
                  value={content.backgroundColor}
                  onChange={(e) => updateContent({ backgroundColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                  data-testid="input-banner-bg-color-hex"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => updateContent({ backgroundColor: undefined })}
                  data-testid="button-banner-remove-bg-color"
                >
                  Rimuovi
                </Button>
              </>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="content" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="banner-title">Titolo</Label>
            <Input
              id="banner-title"
              value={content.content?.title || ''}
              onChange={(e) => updateContentField('title', e.target.value)}
              placeholder="Titolo del banner"
              data-testid="input-banner-title"
            />
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">Tipografia Titolo</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Font</Label>
                <Select
                  value={content.content?.titleTypography?.fontFamily || 'inherit'}
                  onValueChange={(value) => updateTitleTypography('fontFamily', value)}
                >
                  <SelectTrigger data-testid="select-banner-title-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(font => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dimensione</Label>
                <Input
                  type="text"
                  placeholder="es. 2rem"
                  value={content.content?.titleTypography?.fontSize || ''}
                  onChange={(e) => updateTitleTypography('fontSize', e.target.value)}
                  data-testid="input-banner-title-size"
                />
              </div>
              <div>
                <Label>Peso</Label>
                <Input
                  type="text"
                  placeholder="es. 700"
                  value={content.content?.titleTypography?.fontWeight || ''}
                  onChange={(e) => updateTitleTypography('fontWeight', e.target.value)}
                  data-testid="input-banner-title-weight"
                />
              </div>
              <div>
                <Label>Colore</Label>
                <div className="flex gap-2">
                  {content.content?.titleTypography?.color ? (
                    <>
                      <Input
                        type="color"
                        value={content.content.titleTypography.color}
                        onChange={(e) => updateTitleTypography('color', e.target.value)}
                        className="w-20 h-9"
                        data-testid="input-banner-title-color"
                      />
                      <Input
                        type="text"
                        value={content.content.titleTypography.color}
                        onChange={(e) => updateTitleTypography('color', e.target.value)}
                        className="flex-1"
                      />
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateTitleTypography('color', '#ffffff')}
                      data-testid="button-banner-title-add-color"
                    >
                      Aggiungi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-subtitle">Sottotitolo</Label>
            <Textarea
              id="banner-subtitle"
              value={content.content?.subtitle || ''}
              onChange={(e) => updateContentField('subtitle', e.target.value)}
              placeholder="Sottotitolo o descrizione"
              rows={3}
              data-testid="input-banner-subtitle"
            />
          </div>

          <div className="border rounded-md p-3 space-y-2">
            <p className="text-sm font-medium">Tipografia Sottotitolo</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Font</Label>
                <Select
                  value={content.content?.subtitleTypography?.fontFamily || 'inherit'}
                  onValueChange={(value) => updateSubtitleTypography('fontFamily', value)}
                >
                  <SelectTrigger data-testid="select-banner-subtitle-font">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map(font => (
                      <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Dimensione</Label>
                <Input
                  type="text"
                  placeholder="es. 1.2rem"
                  value={content.content?.subtitleTypography?.fontSize || ''}
                  onChange={(e) => updateSubtitleTypography('fontSize', e.target.value)}
                  data-testid="input-banner-subtitle-size"
                />
              </div>
              <div>
                <Label>Colore</Label>
                <div className="flex gap-2">
                  {content.content?.subtitleTypography?.color ? (
                    <>
                      <Input
                        type="color"
                        value={content.content.subtitleTypography.color}
                        onChange={(e) => updateSubtitleTypography('color', e.target.value)}
                        className="w-20 h-9"
                        data-testid="input-banner-subtitle-color"
                      />
                      <Input
                        type="text"
                        value={content.content.subtitleTypography.color}
                        onChange={(e) => updateSubtitleTypography('color', e.target.value)}
                        className="flex-1"
                      />
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateSubtitleTypography('color', '#ffffff')}
                      data-testid="button-banner-subtitle-add-color"
                    >
                      Aggiungi
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="cta" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="banner-cta-text">Testo pulsante</Label>
          <Input
            id="banner-cta-text"
            value={content.cta?.text || ''}
            onChange={(e) => updateCTA('text', e.target.value)}
            placeholder="es. Scopri di più"
            data-testid="input-banner-cta-text"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="banner-cta-link">Link pulsante</Label>
          <Input
            id="banner-cta-link"
            type="url"
            value={content.cta?.link || ''}
            onChange={(e) => updateCTA('link', e.target.value)}
            placeholder="https://esempio.com"
            data-testid="input-banner-cta-link"
          />
        </div>

        <div className="border rounded-md p-3 space-y-3">
          <p className="text-sm font-medium">Stile Pulsante</p>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Variante</Label>
              <Select
                value={content.cta?.buttonStyle?.variant || 'default'}
                onValueChange={(value) => updateButtonStyle('variant', value)}
              >
                <SelectTrigger data-testid="select-banner-cta-variant">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buttonVariants.map(variant => (
                    <SelectItem key={variant.value} value={variant.value}>{variant.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Dimensione</Label>
              <Select
                value={content.cta?.buttonStyle?.size || 'default'}
                onValueChange={(value) => updateButtonStyle('size', value)}
              >
                <SelectTrigger data-testid="select-banner-cta-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {buttonSizes.map(size => (
                    <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Colore sfondo</Label>
              <div className="flex gap-2">
                {content.cta?.buttonStyle?.backgroundColor ? (
                  <>
                    <Input
                      type="color"
                      value={content.cta.buttonStyle.backgroundColor}
                      onChange={(e) => updateButtonStyle('backgroundColor', e.target.value)}
                      className="w-20 h-9"
                      data-testid="input-banner-cta-bg-color"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateButtonStyle('backgroundColor', undefined)}
                    >
                      Rimuovi
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateButtonStyle('backgroundColor', '#000000')}
                    data-testid="button-banner-cta-add-bg"
                  >
                    Aggiungi
                  </Button>
                )}
              </div>
            </div>
            <div>
              <Label>Colore testo</Label>
              <div className="flex gap-2">
                {content.cta?.buttonStyle?.textColor ? (
                  <>
                    <Input
                      type="color"
                      value={content.cta.buttonStyle.textColor}
                      onChange={(e) => updateButtonStyle('textColor', e.target.value)}
                      className="w-20 h-9"
                      data-testid="input-banner-cta-text-color"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => updateButtonStyle('textColor', undefined)}
                    >
                      Rimuovi
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => updateButtonStyle('textColor', '#ffffff')}
                    data-testid="button-banner-cta-add-text-color"
                  >
                    Aggiungi
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
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
                data-testid="input-banner-padding-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 2rem"
                value={content.spacing?.paddingBottom || ''}
                onChange={(e) => updateSpacing('paddingBottom', e.target.value)}
                data-testid="input-banner-padding-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingLeft || ''}
                onChange={(e) => updateSpacing('paddingLeft', e.target.value)}
                data-testid="input-banner-padding-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingRight || ''}
                onChange={(e) => updateSpacing('paddingRight', e.target.value)}
                data-testid="input-banner-padding-right"
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
                data-testid="input-banner-margin-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.marginBottom || ''}
                onChange={(e) => updateSpacing('marginBottom', e.target.value)}
                data-testid="input-banner-margin-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginLeft || ''}
                onChange={(e) => updateSpacing('marginLeft', e.target.value)}
                data-testid="input-banner-margin-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginRight || ''}
                onChange={(e) => updateSpacing('marginRight', e.target.value)}
                data-testid="input-banner-margin-right"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

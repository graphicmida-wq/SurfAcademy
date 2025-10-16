import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { ContainerBlockContent } from '@shared/schema';

interface ContainerBlockEditorProps {
  content: Omit<ContainerBlockContent, 'children'> & { children?: any[] };
  onChange: (content: Omit<ContainerBlockContent, 'children'> & { children?: any[] }) => void;
}

export default function ContainerBlockEditor({ content, onChange }: ContainerBlockEditorProps) {
  const updateContent = (updates: Partial<ContainerBlockContent>) => {
    onChange({ ...content, ...updates });
  };

  const updateSpacing = (field: string, value: any) => {
    updateContent({
      spacing: { ...content.spacing, [field]: value }
    });
  };

  return (
    <Tabs defaultValue="layout" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="layout" data-testid="tab-container-layout">Layout</TabsTrigger>
        <TabsTrigger value="spacing" data-testid="tab-container-spacing">Spaziatura</TabsTrigger>
      </TabsList>

      <TabsContent value="layout" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="container-layout">Tipo Layout</Label>
          <Select
            value={content.layout}
            onValueChange={(value) => updateContent({ layout: value as 'columns' | 'rows' })}
          >
            <SelectTrigger id="container-layout" data-testid="select-container-layout">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="columns">Colonne (layout orizzontale)</SelectItem>
              <SelectItem value="rows">Righe (layout verticale)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {content.layout === 'columns' && (
          <div className="space-y-2">
            <Label htmlFor="container-columns">Numero Colonne</Label>
            <Select
              value={content.columns?.toString() || '2'}
              onValueChange={(value) => updateContent({ columns: parseInt(value) })}
            >
              <SelectTrigger id="container-columns" data-testid="select-container-columns">
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
        )}

        <div className="space-y-2">
          <Label htmlFor="container-gap">Gap (spaziatura tra elementi)</Label>
          <Input
            id="container-gap"
            type="text"
            placeholder="es. 1rem, 20px, 2em"
            value={content.gap || ''}
            onChange={(e) => updateContent({ gap: e.target.value })}
            data-testid="input-container-gap"
          />
          <p className="text-sm text-muted-foreground">
            Usa unità CSS (es. 1rem, 20px, 2em). Lascia vuoto per il gap predefinito.
          </p>
        </div>

        <div className="border rounded-md p-3 bg-muted/50">
          <p className="text-sm font-medium mb-2">Informazioni Container</p>
          <p className="text-sm text-muted-foreground">
            Questo container ha <strong>{content.children?.length || 0}</strong> elemento/i figlio.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Per aggiungere o rimuovere elementi dal container, usa l'editor principale dei blocchi.
            I blocchi inseriti dopo questo container verranno automaticamente posizionati dentro.
          </p>
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
                data-testid="input-container-padding-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 2rem"
                value={content.spacing?.paddingBottom || ''}
                onChange={(e) => updateSpacing('paddingBottom', e.target.value)}
                data-testid="input-container-padding-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingLeft || ''}
                onChange={(e) => updateSpacing('paddingLeft', e.target.value)}
                data-testid="input-container-padding-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.paddingRight || ''}
                onChange={(e) => updateSpacing('paddingRight', e.target.value)}
                data-testid="input-container-padding-right"
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
                data-testid="input-container-margin-top"
              />
            </div>
            <div>
              <Label>Bottom</Label>
              <Input
                type="text"
                placeholder="es. 1rem"
                value={content.spacing?.marginBottom || ''}
                onChange={(e) => updateSpacing('marginBottom', e.target.value)}
                data-testid="input-container-margin-bottom"
              />
            </div>
            <div>
              <Label>Left</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginLeft || ''}
                onChange={(e) => updateSpacing('marginLeft', e.target.value)}
                data-testid="input-container-margin-left"
              />
            </div>
            <div>
              <Label>Right</Label>
              <Input
                type="text"
                placeholder="es. 0"
                value={content.spacing?.marginRight || ''}
                onChange={(e) => updateSpacing('marginRight', e.target.value)}
                data-testid="input-container-margin-right"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

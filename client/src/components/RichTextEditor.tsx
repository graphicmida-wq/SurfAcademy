import { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlockTypography, BlockSpacing } from "@shared/schema";

interface RichTextEditorProps {
  html: string;
  typography?: BlockTypography;
  spacing?: BlockSpacing;
  onChange: (data: { html: string; typography?: BlockTypography; spacing?: BlockSpacing }) => void;
}

export function RichTextEditor({ html, typography = {}, spacing = {}, onChange }: RichTextEditorProps) {
  const [localHtml, setLocalHtml] = useState(html);
  const [localTypography, setLocalTypography] = useState<BlockTypography>(typography);
  const [localSpacing, setLocalSpacing] = useState<BlockSpacing>(spacing);
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);

  useEffect(() => {
    setLocalHtml(html);
  }, [html]);

  useEffect(() => {
    setLocalTypography(typography);
  }, [typography]);

  useEffect(() => {
    setLocalSpacing(spacing);
  }, [spacing]);

  useEffect(() => {
    if (editorRef.current && !isEditorFocused) {
      editorRef.current.innerHTML = localHtml;
    }
  }, [localHtml, isEditorFocused]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setLocalHtml(newHtml);
      onChange({ html: newHtml, typography: localTypography, spacing: localSpacing });
    }
  };

  const updateTypography = (key: keyof BlockTypography, value: string) => {
    const updated = { ...localTypography, [key]: value };
    setLocalTypography(updated);
    onChange({ html: localHtml, typography: updated, spacing: localSpacing });
  };

  const updateSpacing = (key: keyof BlockSpacing, value: string) => {
    const updated = { ...localSpacing, [key]: value };
    setLocalSpacing(updated);
    onChange({ html: localHtml, typography: localTypography, spacing: updated });
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleContentChange();
  };

  const applyTypographyStyles = () => {
    const styles: Record<string, string> = {};
    if (localTypography.fontFamily) styles.fontFamily = localTypography.fontFamily;
    if (localTypography.fontSize) styles.fontSize = localTypography.fontSize;
    if (localTypography.fontWeight) styles.fontWeight = localTypography.fontWeight;
    if (localTypography.lineHeight) styles.lineHeight = localTypography.lineHeight;
    if (localTypography.letterSpacing) styles.letterSpacing = localTypography.letterSpacing;
    if (localTypography.color) styles.color = localTypography.color;
    if (localTypography.textAlign) styles.textAlign = localTypography.textAlign;
    return styles;
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content" data-testid="tab-content">Contenuto</TabsTrigger>
          <TabsTrigger value="typography" data-testid="tab-typography">Tipografia</TabsTrigger>
          <TabsTrigger value="spacing" data-testid="tab-spacing">Spaziatura</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-4">
          <div className="space-y-2">
            <Label>Formattazione Testo</Label>
            <div className="flex gap-1 mb-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('bold')}
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('italic')}
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('justifyLeft')}
                data-testid="button-align-left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('justifyCenter')}
                data-testid="button-align-center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('justifyRight')}
                data-testid="button-align-right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => execCommand('justifyFull')}
                data-testid="button-align-justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
              <Select onValueChange={(value) => execCommand('formatBlock', value)}>
                <SelectTrigger className="w-32">
                  <Type className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Stile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="<p>">Paragrafo</SelectItem>
                  <SelectItem value="<h1>">Titolo 1</SelectItem>
                  <SelectItem value="<h2>">Titolo 2</SelectItem>
                  <SelectItem value="<h3>">Titolo 3</SelectItem>
                  <SelectItem value="<h4>">Titolo 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card className="p-4">
              <div
                ref={editorRef}
                contentEditable
                onInput={handleContentChange}
                onFocus={() => setIsEditorFocused(true)}
                onBlur={() => setIsEditorFocused(false)}
                className="min-h-[200px] outline-none prose max-w-none"
                style={applyTypographyStyles()}
                data-testid="editor-content"
              />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={localTypography.fontFamily || ''}
                onValueChange={(value) => updateTypography('fontFamily', value)}
              >
                <SelectTrigger data-testid="select-font-family">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Font Size</Label>
              <Input
                type="text"
                value={localTypography.fontSize || ''}
                onChange={(e) => updateTypography('fontSize', e.target.value)}
                placeholder="16px, 1rem, 1.2em"
                data-testid="input-font-size"
              />
            </div>

            <div className="space-y-2">
              <Label>Font Weight</Label>
              <Select
                value={localTypography.fontWeight || ''}
                onValueChange={(value) => updateTypography('fontWeight', value)}
              >
                <SelectTrigger data-testid="select-font-weight">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  <SelectItem value="300">Light (300)</SelectItem>
                  <SelectItem value="400">Normal (400)</SelectItem>
                  <SelectItem value="500">Medium (500)</SelectItem>
                  <SelectItem value="600">Semi-Bold (600)</SelectItem>
                  <SelectItem value="700">Bold (700)</SelectItem>
                  <SelectItem value="800">Extra Bold (800)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Line Height</Label>
              <Input
                type="text"
                value={localTypography.lineHeight || ''}
                onChange={(e) => updateTypography('lineHeight', e.target.value)}
                placeholder="1.5, 24px, 1.5rem"
                data-testid="input-line-height"
              />
            </div>

            <div className="space-y-2">
              <Label>Letter Spacing</Label>
              <Input
                type="text"
                value={localTypography.letterSpacing || ''}
                onChange={(e) => updateTypography('letterSpacing', e.target.value)}
                placeholder="0px, 0.05em, 1px"
                data-testid="input-letter-spacing"
              />
            </div>

            <div className="space-y-2">
              <Label>Text Color</Label>
              <div className="flex gap-2">
                {localTypography.color ? (
                  <Input
                    type="color"
                    value={localTypography.color}
                    onChange={(e) => updateTypography('color', e.target.value)}
                    className="w-16 h-10"
                    data-testid="input-color"
                  />
                ) : (
                  <div className="w-16 h-10 border rounded-md bg-muted flex items-center justify-center text-xs">
                    None
                  </div>
                )}
                <Input
                  type="text"
                  value={localTypography.color || ''}
                  onChange={(e) => updateTypography('color', e.target.value)}
                  placeholder="#000000, rgb(0,0,0), etc."
                  className="flex-1"
                  data-testid="input-color-text"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Text Align</Label>
              <Select
                value={localTypography.textAlign || ''}
                onValueChange={(value) => updateTypography('textAlign', value)}
              >
                <SelectTrigger data-testid="select-text-align">
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                  <SelectItem value="justify">Justify</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="spacing" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Margin Top</Label>
              <Input
                type="text"
                value={localSpacing.marginTop || ''}
                onChange={(e) => updateSpacing('marginTop', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-margin-top"
              />
            </div>

            <div className="space-y-2">
              <Label>Margin Bottom</Label>
              <Input
                type="text"
                value={localSpacing.marginBottom || ''}
                onChange={(e) => updateSpacing('marginBottom', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-margin-bottom"
              />
            </div>

            <div className="space-y-2">
              <Label>Margin Left</Label>
              <Input
                type="text"
                value={localSpacing.marginLeft || ''}
                onChange={(e) => updateSpacing('marginLeft', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-margin-left"
              />
            </div>

            <div className="space-y-2">
              <Label>Margin Right</Label>
              <Input
                type="text"
                value={localSpacing.marginRight || ''}
                onChange={(e) => updateSpacing('marginRight', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-margin-right"
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Top</Label>
              <Input
                type="text"
                value={localSpacing.paddingTop || ''}
                onChange={(e) => updateSpacing('paddingTop', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-padding-top"
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Bottom</Label>
              <Input
                type="text"
                value={localSpacing.paddingBottom || ''}
                onChange={(e) => updateSpacing('paddingBottom', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-padding-bottom"
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Left</Label>
              <Input
                type="text"
                value={localSpacing.paddingLeft || ''}
                onChange={(e) => updateSpacing('paddingLeft', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-padding-left"
              />
            </div>

            <div className="space-y-2">
              <Label>Padding Right</Label>
              <Input
                type="text"
                value={localSpacing.paddingRight || ''}
                onChange={(e) => updateSpacing('paddingRight', e.target.value)}
                placeholder="0px, 1rem, 2em"
                data-testid="input-padding-right"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

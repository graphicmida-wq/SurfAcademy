import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Unlink,
  Code,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface SimpleRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function SimpleRichTextEditor({ value, onChange, placeholder }: SimpleRichTextEditorProps) {
  const [mode, setMode] = useState<'visual' | 'html'>('visual');
  const [htmlContent, setHtmlContent] = useState(value || '');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      TextStyle,
      Color,
      FontFamily.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline',
        },
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setHtmlContent(html);
      onChange(html);
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
      setHtmlContent(value || '');
    }
  }, [value, editor]);

  const handleHtmlChange = (newHtml: string) => {
    setHtmlContent(newHtml);
  };

  const handleHtmlBlur = () => {
    if (editor) {
      editor.commands.setContent(htmlContent);
      onChange(htmlContent);
    }
  };

  const handleModeChange = (newMode: string) => {
    if (newMode === 'html' && editor) {
      setHtmlContent(editor.getHTML());
    } else if (newMode === 'visual' && editor) {
      editor.commands.setContent(htmlContent);
      onChange(htmlContent);
    }
    setMode(newMode as 'visual' | 'html');
  };

  const openLinkDialog = () => {
    const previousUrl = editor?.getAttributes('link').href || '';
    const { from, to } = editor?.state.selection || { from: 0, to: 0 };
    const selectedText = editor?.state.doc.textBetween(from, to, '') || '';
    
    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setLinkDialogOpen(true);
  };

  const setLink = () => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      if (linkText && !editor.state.selection.empty) {
        editor.chain().focus().deleteSelection().insertContent(linkText).setLink({ href: linkUrl }).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList>
          <TabsTrigger value="visual" data-testid="tab-visual">Visuale</TabsTrigger>
          <TabsTrigger value="html" data-testid="tab-html">HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-2">
          <div className="border rounded-md p-2 space-y-2">
            <div className="flex flex-wrap gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'bg-accent' : ''}
                data-testid="button-bold"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={editor.isActive('italic') ? 'bg-accent' : ''}
                data-testid="button-italic"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={editor.isActive('strike') ? 'bg-accent' : ''}
                data-testid="button-strike"
              >
                <Strikethrough className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                disabled={!editor.can().chain().focus().toggleCode().run()}
                className={editor.isActive('code') ? 'bg-accent' : ''}
                data-testid="button-code"
              >
                <Code className="h-4 w-4" />
              </Button>

              <div className="w-px h-8 bg-border mx-1" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}
                data-testid="button-heading1"
              >
                <Heading1 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}
                data-testid="button-heading2"
              >
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}
                data-testid="button-heading3"
              >
                <Heading3 className="h-4 w-4" />
              </Button>

              <div className="w-px h-8 bg-border mx-1" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'bg-accent' : ''}
                data-testid="button-bullet-list"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'bg-accent' : ''}
                data-testid="button-ordered-list"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>

              <div className="w-px h-8 bg-border mx-1" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                className={editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}
                data-testid="button-align-left"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                className={editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}
                data-testid="button-align-center"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                className={editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}
                data-testid="button-align-right"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                className={editor.isActive({ textAlign: 'justify' }) ? 'bg-accent' : ''}
                data-testid="button-align-justify"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>

              <div className="w-px h-8 bg-border mx-1" />

              <div className="flex items-center gap-2">
                <Label className="text-xs">Colore:</Label>
                <Input
                  type="color"
                  className="w-12 h-8 p-1"
                  value={editor.getAttributes('textStyle').color || '#000000'}
                  onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                  data-testid="input-text-color"
                />
              </div>

              <div className="w-px h-8 bg-border mx-1" />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openLinkDialog}
                className={editor.isActive('link') ? 'bg-accent' : ''}
                data-testid="button-link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              {editor.isActive('link') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  data-testid="button-unlink"
                >
                  <Unlink className="h-4 w-4" />
                </Button>
              )}
            </div>

            <EditorContent
              editor={editor}
              className="prose max-w-none min-h-[200px] p-3 border rounded-md focus-within:ring-2 focus-within:ring-ring"
              data-testid="editor-content"
            />
          </div>
        </TabsContent>

        <TabsContent value="html">
          <Textarea
            value={htmlContent}
            onChange={(e) => handleHtmlChange(e.target.value)}
            onBlur={handleHtmlBlur}
            className="min-h-[300px] font-mono text-sm"
            placeholder="<p>HTML content...</p>"
            data-testid="textarea-html"
          />
        </TabsContent>
      </Tabs>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inserisci Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                data-testid="input-link-url"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-text">Testo (opzionale)</Label>
              <Input
                id="link-text"
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Testo del link"
                data-testid="input-link-text"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)} data-testid="button-cancel-link">
              Annulla
            </Button>
            <Button onClick={setLink} data-testid="button-save-link">
              Inserisci
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

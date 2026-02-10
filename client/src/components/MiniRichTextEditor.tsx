import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { FontFamily } from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
} from 'lucide-react';
import { Extension } from '@tiptap/core';

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return { types: ['textStyle'] };
  },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
          renderHTML: attributes => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
});

interface MiniRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  singleLine?: boolean;
}

export function MiniRichTextEditor({ value, onChange, placeholder, minHeight = '40px', singleLine = false }: MiniRichTextEditorProps) {
  const [showToolbar, setShowToolbar] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: singleLine ? false : undefined,
      }),
      TextStyle,
      Color,
      Underline,
      FontFamily.configure({ types: ['textStyle'] }),
      TextAlign.configure({ types: ['paragraph'] }),
      FontSize,
      Placeholder.configure({ placeholder: placeholder || '' }),
    ],
    content: value || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: `outline-none ${singleLine ? 'whitespace-nowrap' : ''}`,
      },
      handleKeyDown: singleLine ? (_view, event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          return true;
        }
        return false;
      } : undefined,
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setMark('textStyle', { fontSize: size }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="space-y-1">
      <div
        className="border rounded-md focus-within:ring-2 focus-within:ring-ring"
        onFocus={() => setShowToolbar(true)}
      >
        {showToolbar && (
          <div className="flex flex-wrap items-center gap-1 p-1.5 border-b bg-muted/30">
            <Select onValueChange={setFontSize} defaultValue="">
              <SelectTrigger className="h-7 w-[90px] text-xs" data-testid="select-font-size">
                <Type className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Dim." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12px">12px</SelectItem>
                <SelectItem value="14px">14px</SelectItem>
                <SelectItem value="16px">16px</SelectItem>
                <SelectItem value="18px">18px</SelectItem>
                <SelectItem value="20px">20px</SelectItem>
                <SelectItem value="24px">24px</SelectItem>
                <SelectItem value="28px">28px</SelectItem>
                <SelectItem value="32px">32px</SelectItem>
                <SelectItem value="36px">36px</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(val) => editor.chain().focus().setFontFamily(val).run()} defaultValue="">
              <SelectTrigger className="h-7 w-[110px] text-xs" data-testid="select-font-family">
                <SelectValue placeholder="Font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
                <SelectItem value="Arial">Arial</SelectItem>
                <SelectItem value="Georgia">Georgia</SelectItem>
                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-border mx-0.5" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              data-testid="button-mini-bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              data-testid="button-mini-italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              data-testid="button-mini-underline"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </Button>

            <div className="w-px h-6 bg-border mx-0.5" />

            <Input
              type="color"
              className="w-7 h-7 p-0.5 cursor-pointer"
              value={editor.getAttributes('textStyle').color || '#ffffff'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              data-testid="input-mini-color"
            />

            <div className="w-px h-6 bg-border mx-0.5" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              data-testid="button-mini-align-left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              data-testid="button-mini-align-center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              data-testid="button-mini-align-right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        <EditorContent
          editor={editor}
          className={`px-3 py-2 prose prose-sm max-w-none dark:prose-invert`}
          style={{ minHeight }}
          data-testid="mini-editor-content"
        />
      </div>
    </div>
  );
}

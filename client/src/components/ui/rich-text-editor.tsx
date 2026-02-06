import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { Extension } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ImageIcon,
  LinkIcon,
  Highlighter,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Minus,
  Type,
  Palette,
  Code,
  Quote,
  Pilcrow,
  ArrowUpDown,
  Space,
} from "lucide-react";

const FontSize = Extension.create({
  name: "fontSize",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ""),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});

const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (element) => element.style.lineHeight || null,
            renderHTML: (attributes) => {
              if (!attributes.lineHeight) return {};
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
});

const SpacingExtension = Extension.create({
  name: "spacing",
  addOptions() {
    return { types: ["paragraph", "heading"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          marginTop: {
            default: null,
            parseHTML: (element) => element.style.marginTop || null,
            renderHTML: (attributes) => {
              if (!attributes.marginTop) return {};
              return { style: `margin-top: ${attributes.marginTop}` };
            },
          },
          marginBottom: {
            default: null,
            parseHTML: (element) => element.style.marginBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.marginBottom) return {};
              return { style: `margin-bottom: ${attributes.marginBottom}` };
            },
          },
          paddingTop: {
            default: null,
            parseHTML: (element) => element.style.paddingTop || null,
            renderHTML: (attributes) => {
              if (!attributes.paddingTop) return {};
              return { style: `padding-top: ${attributes.paddingTop}` };
            },
          },
          paddingBottom: {
            default: null,
            parseHTML: (element) => element.style.paddingBottom || null,
            renderHTML: (attributes) => {
              if (!attributes.paddingBottom) return {};
              return { style: `padding-bottom: ${attributes.paddingBottom}` };
            },
          },
        },
      },
    ];
  },
});

const FontWeight = Extension.create({
  name: "fontWeight",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontWeight: {
            default: null,
            parseHTML: (element) => element.style.fontWeight || null,
            renderHTML: (attributes) => {
              if (!attributes.fontWeight) return {};
              return { style: `font-weight: ${attributes.fontWeight}` };
            },
          },
        },
      },
    ];
  },
});

const LetterSpacing = Extension.create({
  name: "letterSpacing",
  addOptions() {
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (element) => element.style.letterSpacing || null,
            renderHTML: (attributes) => {
              if (!attributes.letterSpacing) return {};
              return { style: `letter-spacing: ${attributes.letterSpacing}` };
            },
          },
        },
      },
    ];
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const FONT_SIZES = [
  "10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "42px", "48px", "56px", "64px", "72px",
];

const LINE_HEIGHTS = [
  { label: "1.0", value: "1" },
  { label: "1.2", value: "1.2" },
  { label: "1.4", value: "1.4" },
  { label: "1.5", value: "1.5" },
  { label: "1.6", value: "1.6" },
  { label: "1.8", value: "1.8" },
  { label: "2.0", value: "2" },
  { label: "2.5", value: "2.5" },
];

const FONT_WEIGHTS = [
  { label: "Thin (100)", value: "100" },
  { label: "Light (300)", value: "300" },
  { label: "Normal (400)", value: "400" },
  { label: "Medium (500)", value: "500" },
  { label: "Semi Bold (600)", value: "600" },
  { label: "Bold (700)", value: "700" },
  { label: "Extra Bold (800)", value: "800" },
  { label: "Black (900)", value: "900" },
];

const SPACING_VALUES = [
  "0px", "4px", "8px", "12px", "16px", "20px", "24px", "32px", "40px", "48px", "64px",
];

const COLORS = [
  "#000000", "#434343", "#666666", "#999999", "#cccccc", "#ffffff",
  "#ff0000", "#ff4444", "#ff6600", "#ff9900", "#ffcc00", "#ffff00",
  "#00ff00", "#00cc00", "#009900", "#006600", "#00ffff", "#0099cc",
  "#0000ff", "#0044ff", "#6600cc", "#9900ff", "#ff00ff", "#ff0099",
  "#8B4513", "#D2691E", "#CD853F", "#DEB887", "#F5DEB3", "#FAEBD7",
  "#1a5276", "#2e86c1", "#3498db", "#85c1e9", "#d4e6f1", "#eaf2f8",
  "#0e6655", "#1abc9c", "#48c9b0", "#a3e4d7", "#d1f2eb", "#e8f8f5",
];

function ToolbarButton({
  onClick,
  isActive = false,
  title,
  children,
  disabled = false,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      data-testid={`rte-btn-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const prevContentRef = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextStyle,
      Color,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: true }),
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      FontSize,
      LineHeight,
      SpacingExtension,
      FontWeight,
      LetterSpacing,
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== prevContentRef.current) {
      const currentEditorContent = editor.getHTML();
      if (content !== currentEditorContent) {
        editor.commands.setContent(content || "");
      }
      prevContentRef.current = content;
    }
  }, [content, editor]);

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
    }
  }, [editor, imageUrl]);

  const setLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl, target: "_blank" }).run();
      setLinkUrl("");
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
  }, [editor]);

  if (!editor) return null;

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  const setLineHeight = (height: string) => {
    editor.chain().focus().updateAttributes("paragraph", { lineHeight: height }).run();
    editor.chain().focus().updateAttributes("heading", { lineHeight: height }).run();
  };

  const setFontWeight_ = (weight: string) => {
    editor.chain().focus().setMark("textStyle", { fontWeight: weight }).run();
  };

  const setLetterSpacing_ = (spacing: string) => {
    editor.chain().focus().setMark("textStyle", { letterSpacing: spacing }).run();
  };

  const setSpacing = (type: string, value: string) => {
    const attrs: Record<string, string> = {};
    attrs[type] = value;
    editor.chain().focus().updateAttributes("paragraph", attrs).run();
    editor.chain().focus().updateAttributes("heading", attrs).run();
  };

  return (
    <div className="border rounded-md bg-background" data-testid="rich-text-editor">
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-muted/30">
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Annulla">
          <Undo className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Ripeti">
          <Redo className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Select onValueChange={(v) => {
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(v) as 1 | 2 | 3 | 4 }).run();
        }}>
          <SelectTrigger className="w-[130px] h-8 text-xs" data-testid="rte-select-heading">
            <SelectValue placeholder="Paragrafo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="p">Paragrafo</SelectItem>
            <SelectItem value="1">Titolo H1</SelectItem>
            <SelectItem value="2">Titolo H2</SelectItem>
            <SelectItem value="3">Titolo H3</SelectItem>
            <SelectItem value="4">Titolo H4</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Dimensione carattere" data-testid="rte-btn-font-size">
              <Type className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Dimensione</Label>
            <div className="grid grid-cols-3 gap-1">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className="px-2 py-1 text-xs rounded hover:bg-muted text-center cursor-pointer"
                >
                  {size}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Peso carattere" data-testid="rte-btn-font-weight">
              <Bold className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Peso</Label>
            <div className="space-y-1">
              {FONT_WEIGHTS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => setFontWeight_(w.value)}
                  className="w-full px-2 py-1 text-xs rounded hover:bg-muted text-left cursor-pointer"
                  style={{ fontWeight: w.value }}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")} title="Grassetto">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")} title="Corsivo">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive("underline")} title="Sottolineato">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")} title="Barrato">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Colore testo" data-testid="rte-btn-color">
              <Palette className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Colore testo</Label>
            <div className="grid grid-cols-6 gap-1.5 mb-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().setColor(color).run()}
                  className="w-7 h-7 rounded-md border border-border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                className="w-8 h-8 p-0 border-0 cursor-pointer"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                data-testid="rte-input-custom-color"
              />
              <span className="text-xs text-muted-foreground">Colore personalizzato</span>
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetColor().run()}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Rimuovi colore
            </button>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Evidenzia" data-testid="rte-btn-highlight">
              <Highlighter className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Colore evidenziazione</Label>
            <div className="grid grid-cols-6 gap-1.5">
              {["#fef08a", "#bbf7d0", "#bfdbfe", "#e9d5ff", "#fecdd3", "#fed7aa", "#fde68a", "#d9f99d", "#a5f3fc", "#c4b5fd", "#fbcfe8", "#fca5a5"].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color }).run()}
                  className="w-7 h-7 rounded-md border border-border cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
              className="mt-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Rimuovi evidenziazione
            </button>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} isActive={editor.isActive({ textAlign: "left" })} title="Allinea a sinistra">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} isActive={editor.isActive({ textAlign: "center" })} title="Centra">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} isActive={editor.isActive({ textAlign: "right" })} title="Allinea a destra">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("justify").run()} isActive={editor.isActive({ textAlign: "justify" })} title="Giustifica">
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive("bulletList")} title="Elenco puntato">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive("orderedList")} title="Elenco numerato">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive("blockquote")} title="Citazione">
          <Quote className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive("codeBlock")} title="Blocco codice">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Linea orizzontale">
          <Minus className="w-4 h-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Interlinea" data-testid="rte-btn-line-height">
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Interlinea</Label>
            <div className="space-y-1">
              {LINE_HEIGHTS.map((lh) => (
                <button
                  key={lh.value}
                  type="button"
                  onClick={() => setLineHeight(lh.value)}
                  className="w-full px-2 py-1 text-xs rounded hover:bg-muted text-left cursor-pointer"
                >
                  {lh.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Spaziatura lettere" data-testid="rte-btn-letter-spacing">
              <Space className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-36 p-2" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">Spaziatura lettere</Label>
            <div className="space-y-1">
              {["0px", "0.5px", "1px", "1.5px", "2px", "3px", "4px", "5px"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setLetterSpacing_(v)}
                  className="w-full px-2 py-1 text-xs rounded hover:bg-muted text-left cursor-pointer"
                >
                  {v}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Margini e Padding" data-testid="rte-btn-spacing">
              <Pilcrow className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <Label className="text-xs text-muted-foreground mb-3 block">Margini e Padding del paragrafo</Label>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Margine superiore</Label>
                <Select onValueChange={(v) => setSpacing("marginTop", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {SPACING_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Margine inferiore</Label>
                <Select onValueChange={(v) => setSpacing("marginBottom", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {SPACING_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Padding superiore</Label>
                <Select onValueChange={(v) => setSpacing("paddingTop", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {SPACING_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Padding inferiore</Label>
                <Select onValueChange={(v) => setSpacing("paddingBottom", v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleziona" /></SelectTrigger>
                  <SelectContent>
                    {SPACING_VALUES.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Inserisci link" data-testid="rte-btn-link">
              <LinkIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">URL del link</Label>
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="h-8 text-xs"
                data-testid="rte-input-link-url"
              />
              <Button type="button" size="sm" onClick={setLink} data-testid="rte-btn-add-link">
                Aggiungi
              </Button>
            </div>
            {editor.isActive("link") && (
              <button
                type="button"
                onClick={removeLink}
                className="mt-2 text-xs text-destructive hover:underline cursor-pointer"
              >
                Rimuovi link
              </button>
            )}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" title="Inserisci immagine" data-testid="rte-btn-image">
              <ImageIcon className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <Label className="text-xs text-muted-foreground mb-2 block">URL dell'immagine</Label>
            <div className="flex gap-2">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... (.jpg, .png, .webp)"
                className="h-8 text-xs"
                data-testid="rte-input-image-url"
              />
              <Button type="button" size="sm" onClick={addImage} data-testid="rte-btn-add-image">
                Inserisci
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <EditorContent editor={editor} data-testid="rte-content-area" />
    </div>
  );
}

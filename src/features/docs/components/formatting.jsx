import { Fragment, useEffect, useState } from "react";
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Code, Eraser, Heading1, Heading2, Heading3, Heading4,
  IndentDecrease, IndentIncrease, Italic, List, ListOrdered, Minus, Pilcrow, Quote, Redo2, Strikethrough,
  Subscript, Superscript, Underline, Undo2,
} from "lucide-react";

/** Rich-text commands for the contentEditable editor. `onChange` receives the new innerHTML. */
export function useFormatting(editorRef, onChange) {
  const sync = () => setTimeout(() => editorRef.current && onChange(editorRef.current.innerHTML), 0);
  const focus = () => {
    const el = editorRef.current;
    if (el && document.activeElement !== el) el.focus();
  };

  const exec = (cmd, value = null) => {
    focus();
    document.execCommand(cmd, false, value);
    sync();
  };

  /** Toggle a block format: applying the same one twice goes back to a paragraph. */
  const block = (tag) => {
    focus();
    const sel = window.getSelection();
    let current = null;
    if (sel?.rangeCount) {
      const node = sel.getRangeAt(0).commonAncestorContainer;
      const el = node.nodeType === 3 ? node.parentElement : node;
      const found = el?.closest("h1,h2,h3,h4,blockquote,pre,p");
      if (found && editorRef.current?.contains(found)) current = found.tagName.toLowerCase();
    }
    document.execCommand("formatBlock", false, `<${current === tag ? "p" : tag}>`);
    sync();
  };

  return { exec, block };
}

const glyph = (size, text = "A") => <span style={{ fontSize: size, fontWeight: 700, lineHeight: 1 }}>{text}</span>;

const GROUPS = [
  [
    { label: "Bold", icon: Bold, run: (f) => f.exec("bold") },
    { label: "Italic", icon: Italic, run: (f) => f.exec("italic") },
    { label: "Underline", icon: Underline, run: (f) => f.exec("underline") },
    { label: "Strikethrough", icon: Strikethrough, run: (f) => f.exec("strikeThrough") },
    { label: "Superscript", icon: Superscript, run: (f) => f.exec("superscript") },
    { label: "Subscript", icon: Subscript, run: (f) => f.exec("subscript") },
  ],
  [
    { label: "Heading 1", icon: Heading1, run: (f) => f.block("h1") },
    { label: "Heading 2", icon: Heading2, run: (f) => f.block("h2") },
    { label: "Heading 3", icon: Heading3, run: (f) => f.block("h3") },
    { label: "Heading 4", icon: Heading4, run: (f) => f.block("h4") },
    { label: "Paragraph", icon: Pilcrow, run: (f) => f.block("p") },
  ],
  [
    { label: "Bulleted list", icon: List, run: (f) => f.exec("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, run: (f) => f.exec("insertOrderedList") },
    { label: "Indent", icon: IndentIncrease, run: (f) => f.exec("indent") },
    { label: "Outdent", icon: IndentDecrease, run: (f) => f.exec("outdent") },
  ],
  [
    { label: "Align left", icon: AlignLeft, run: (f) => f.exec("justifyLeft") },
    { label: "Align center", icon: AlignCenter, run: (f) => f.exec("justifyCenter") },
    { label: "Align right", icon: AlignRight, run: (f) => f.exec("justifyRight") },
    { label: "Justify", icon: AlignJustify, run: (f) => f.exec("justifyFull") },
  ],
  [
    { label: "Quote", icon: Quote, run: (f) => f.block("blockquote") },
    { label: "Code block", icon: Code, run: (f) => f.block("pre") },
    { label: "Divider", icon: Minus, run: (f) => f.exec("insertHorizontalRule") },
  ],
  [
    { label: "Smaller text", content: glyph(12), run: (f) => f.exec("fontSize", "2") },
    { label: "Normal text", content: glyph(16), run: (f) => f.exec("fontSize", "3") },
    { label: "Larger text", content: glyph(21), run: (f) => f.exec("fontSize", "5") },
  ],
  [
    { label: "Clear formatting", icon: Eraser, run: (f) => f.exec("removeFormat") },
    { label: "Undo", icon: Undo2, run: (f) => f.exec("undo") },
    { label: "Redo", icon: Redo2, run: (f) => f.exec("redo") },
  ],
];

const SELECTION_TOOLS = [
  { label: "Bold", icon: Bold, run: (f) => f.exec("bold") },
  { label: "Italic", icon: Italic, run: (f) => f.exec("italic") },
  { label: "Underline", icon: Underline, run: (f) => f.exec("underline") },
  { label: "Strikethrough", icon: Strikethrough, run: (f) => f.exec("strikeThrough") },
  null,
  { label: "Heading 1", icon: Heading1, run: (f) => f.block("h1") },
  { label: "Heading 2", icon: Heading2, run: (f) => f.block("h2") },
  { label: "Paragraph", icon: Pilcrow, run: (f) => f.block("p") },
  null,
  { label: "Quote", icon: Quote, run: (f) => f.block("blockquote") },
  { label: "Clear formatting", icon: Eraser, run: (f) => f.exec("removeFormat") },
];

// mousedown would move focus (and the selection) out of the editor, so it is cancelled
const keepSelection = (e) => e.preventDefault();

function ToolButton({ tool, format, className = "" }) {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      className={`icon-btn state ${className}`}
      aria-label={tool.label}
      title={tool.label}
      onMouseDown={keepSelection}
      onClick={() => tool.run(format)}
    >
      {Icon ? <Icon size={20} /> : tool.content}
    </button>
  );
}

/** Docked toolbar along the bottom of the screen while editing. */
export function FormattingDock({ format }) {
  return (
    <div className="dock" role="toolbar" aria-label="Formatting">
      <div className="dock-scroll">
        {GROUPS.map((group, gi) => (
          <Fragment key={gi}>
            {gi > 0 && <span className="dock-div" aria-hidden="true" />}
            {group.map((tool) => <ToolButton key={tool.label} tool={tool} format={format} className="dock-btn" />)}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/** Pill that floats above selected text (devices with a precise pointer). */
export function SelectionToolbar({ editorRef, enabled, format }) {
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!enabled) { setPos(null); return; }
    const update = () => {
      const sel = window.getSelection();
      const editor = editorRef.current;
      if (!sel || sel.isCollapsed || !sel.rangeCount || !editor || !editor.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        setPos(null);
        return;
      }
      const r = sel.getRangeAt(0).getBoundingClientRect();
      const half = 190;
      setPos({
        top: Math.max(72, r.top - 60),
        left: Math.min(Math.max(r.left + r.width / 2, half + 8), window.innerWidth - half - 8),
      });
    };
    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, [enabled, editorRef]);

  if (!enabled || !pos) return null;
  return (
    <div className="sel-bar" style={{ top: pos.top, left: pos.left }} role="toolbar" aria-label="Format selection" onMouseDown={keepSelection}>
      {SELECTION_TOOLS.map((tool, i) =>
        tool ? <ToolButton key={tool.label} tool={tool} format={format} className="sel-btn" /> : <span key={i} className="sel-div" aria-hidden="true" />
      )}
    </div>
  );
}

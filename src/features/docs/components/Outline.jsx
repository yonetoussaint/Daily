import { useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Pencil, Plus } from "lucide-react";
import { Button, IconButton, WavyProgress } from "../../../design/components";
import { circle, cookie } from "../../../design/shapes";
import { WORD_GOAL } from "../model";

const ACTIVE_SHAPE = cookie(8, 0.12);
const IDLE_SHAPE = circle();

/** Chapter / section tree with book progress. Used docked on wide screens and inside OutlineModal on phones. */
export function OutlinePanel({ book, type, words, activeChapterId, activeSubId, collapsed, onToggle, onSelect, onEditNode, onAddChapter, onEditBook }) {
  const TypeIcon = type.icon;
  const pct = Math.min(100, Math.round((words / WORD_GOAL) * 100));
  const readTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="outline">
      <header className="outline-head">
        <div className="outline-title-row">
          <span className="outline-type" style={{ clipPath: cookie(type.lobes, type.amp) }} aria-hidden="true"><TypeIcon size={22} /></span>
          <h2 className="title-lg outline-title">{book.title}</h2>
          <IconButton label="Edit details" onClick={onEditBook}><Pencil size={20} /></IconButton>
        </div>
        <WavyProgress value={Math.min(words, WORD_GOAL)} total={WORD_GOAL} label="Progress toward the word goal" />
        <p className="label-md muted outline-stats">
          <span>{words.toLocaleString()} words · ~{readTime} min read</span>
          <span>{pct}%</span>
        </p>
      </header>

      <p className="outline-section label-lg muted">Chapters</p>
      <ul className="ol-list">
        {book.chapters.map((ch, ci) => {
          const chActive = activeChapterId === ch.id && !activeSubId;
          const open = !collapsed[ch.id];
          const hasSubs = ch.subs.length > 0;
          return (
            <li key={ch.id}>
              <div className={`ol-row${chActive ? " is-active" : ""}`}>
                {hasSubs ? (
                  <button className="icon-btn state ol-icon" aria-label={`${open ? "Collapse" : "Expand"} ${ch.title}`} aria-expanded={open} onClick={() => onToggle(ch.id)}>
                    {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                ) : (
                  <span className="ol-icon" aria-hidden="true" />
                )}
                <button className="ol-main state" aria-current={chActive ? "true" : undefined} onClick={() => onSelect(ch.id, null)}>
                  <span className="ol-num" style={{ clipPath: chActive ? ACTIVE_SHAPE : IDLE_SHAPE }}>{ci + 1}</span>
                  <span className="ol-title label-lg">{ch.title}</span>
                </button>
                <button className="icon-btn state ol-icon" aria-label={`Options for ${ch.title}`} onClick={() => onEditNode(ch.id, null)}>
                  <MoreVertical size={18} />
                </button>
              </div>

              {open && hasSubs && (
                <ul className="ol-subs">
                  {ch.subs.map((sub, si) => {
                    const subActive = activeChapterId === ch.id && activeSubId === sub.id;
                    return (
                      <li key={sub.id} className={`ol-row ol-sub${subActive ? " is-active" : ""}`}>
                        <button className="ol-main state" aria-current={subActive ? "true" : undefined} onClick={() => onSelect(ch.id, sub.id)}>
                          <span className="ol-sub-num label-md">{ci + 1}.{si + 1}</span>
                          <span className="ol-title body-md">{sub.title}</span>
                        </button>
                        <button className="icon-btn state ol-icon" aria-label={`Options for ${sub.title}`} onClick={() => onEditNode(ch.id, sub.id)}>
                          <MoreVertical size={18} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="outline-foot">
        <Button variant="tonal" icon={<Plus size={20} />} onClick={onAddChapter}>New chapter</Button>
      </footer>
    </div>
  );
}

/** Modal side panel for phones: slides in from the left over a scrim. */
export function OutlineModal({ open, onClose, children }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("button")?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener instanceof HTMLElement && opener.focus?.({ preventScroll: true });
    };
  }, [open, onClose]);

  return (
    <div className={`outline-root${open ? " is-open" : ""}`} inert={open ? undefined : ""}>
      <div className="outline-scrim" onClick={onClose} />
      <aside ref={panelRef} className="outline-modal" role="dialog" aria-modal="true" aria-label="Outline">{children}</aside>
    </div>
  );
}

import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cookie } from "../../../design/shapes";
import { useSwipe } from "../../../design/useSwipe";
import { WORD_GOAL, relativeTime, typeInfo, wordsInChapters } from "../model";

const ACTIONS_WIDTH = 148; // two 60px round buttons + gap + padding

export default function BookRow({ book, swipeOpen, onSwipe, onOpen, onEdit, onDelete }) {
  const type = typeInfo(book.type);
  const Icon = type.icon;
  const swipe = useSwipe({ width: ACTIONS_WIDTH, open: swipeOpen, onOpenChange: (open) => onSwipe(open ? book.id : null) });

  const words = wordsInChapters(book.chapters);
  const pct = Math.min(100, Math.round((words / WORD_GOAL) * 100));
  const chapters = book.chapters.length;
  const sections = book.chapters.reduce((a, c) => a + (c.subs?.length || 0), 0);

  const open = () => {
    if (swipe.consumeClick()) return;
    if (swipeOpen) return onSwipe(null);
    onOpen(book);
  };

  return (
    <li className="lib-item">
      <div className="lib-clip">
        <div className="lib-actions" aria-hidden={!swipeOpen}>
          <button className="lib-action state" tabIndex={swipeOpen ? 0 : -1} aria-label={`Edit details of ${book.title}`} onClick={() => { onSwipe(null); onEdit(book); }}>
            <Pencil size={20} />
            <span>Edit</span>
          </button>
          <button className="lib-action lib-action-danger state" tabIndex={swipeOpen ? 0 : -1} aria-label={`Delete ${book.title}`} onClick={() => { onSwipe(null); onDelete(book); }}>
            <Trash2 size={20} />
            <span>Delete</span>
          </button>
        </div>

        <div
          className={`lib-row acc${swipe.dragging ? " is-dragging" : ""}`}
          style={{ "--hue": type.hue, transform: `translateX(${swipe.dx}px)` }}
          {...swipe.handlers}
        >
          <span className="lib-icon" style={{ clipPath: cookie(type.lobes, type.amp) }} aria-hidden="true">
            <Icon size={26} />
          </span>
          <button className="lib-main state" onClick={open}>
            <span className="title-md lib-title">{book.title}</span>
            <span className="body-md muted lib-meta">
              {type.label} · {chapters} chapter{chapters === 1 ? "" : "s"}
              {sections > 0 ? ` · ${sections} section${sections === 1 ? "" : "s"}` : ""} · {relativeTime(book.updatedAt)}
            </span>
            {book.tags?.length > 0 && (
              <span className="lib-tags">
                {book.tags.slice(0, 3).map((t) => <span key={t} className="tag label-md">#{t}</span>)}
                {book.tags.length > 3 && <span className="tag label-md">+{book.tags.length - 3}</span>}
              </span>
            )}
            <span className="lib-bar" role="img" aria-label={`${pct}% of the ${WORD_GOAL}-word goal`}><span style={{ width: `${pct}%` }} /></span>
          </button>
          <button
            className="icon-btn state"
            aria-label={`More actions for ${book.title}`}
            aria-expanded={swipeOpen}
            onClick={() => onSwipe(swipeOpen ? null : book.id)}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>
    </li>
  );
}

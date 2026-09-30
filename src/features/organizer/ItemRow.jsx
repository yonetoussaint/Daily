import { useEffect, useRef, useState } from "react";
import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { PRIORITIES, PRIORITY_META } from "./constants";

const ACTIONS_WIDTH = 192; // 3 priority actions × 64px

export default function ItemRow({ item, menuOpen, swipeOpen, onToggleMenu, onSwipeOpenChange, onToggle, onEdit, onDelete, onSetPriority }) {
  const menuRef = useRef(null);
  const drag = useRef({ active: false, startX: 0 });
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && onToggleMenu(null);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen, onToggleMenu]);

  useEffect(() => setDragX(swipeOpen ? -ACTIONS_WIDTH : 0), [swipeOpen]);

  const onDown = (e) => {
    if (menuOpen) return;
    drag.current = { active: true, startX: e.clientX };
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current.active) return;
    const base = swipeOpen ? -ACTIONS_WIDTH : 0;
    setDragX(Math.max(-ACTIONS_WIDTH, Math.min(0, base + e.clientX - drag.current.startX)));
  };
  const onUp = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    setDragging(false);
    const open = dragX <= -ACTIONS_WIDTH / 2;
    setDragX(open ? -ACTIONS_WIDTH : 0);
    onSwipeOpenChange(open ? item.id : null);
  };

  return (
    <div className="swipe">
      <div className="swipe-clip">
        <div className="swipe-actions">
          {PRIORITIES.map((p) => (
            <button key={p} className={`swipe-action ${PRIORITY_META[p].cls}`} aria-label={`Set ${PRIORITY_META[p].label}`} onClick={() => onSetPriority(item, p)}>
              {p}
            </button>
          ))}
        </div>
        <div
          className={`item${dragging ? " is-dragging" : ""}${item.checked ? " done" : ""}`}
          style={{ transform: `translateX(${dragX}px)` }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <button className="check state" role="checkbox" aria-checked={item.checked} aria-label={`Mark ${item.name} done`} onClick={() => onToggle(item)}>
            <span>{item.checked && <Check size={16} strokeWidth={3} />}</span>
          </button>
          <div className="item-text">
            <div className="title body-lg">{item.name}</div>
            <div className="body-md muted">{item.room}</div>
          </div>
          <button className="icon-btn state" aria-label={`Actions for ${item.name}`} aria-haspopup="menu" onClick={() => onToggleMenu(menuOpen ? null : item.id)}>
            <MoreVertical size={20} />
          </button>
          {swipeOpen && <div className="item-scrim" onClick={() => onSwipeOpenChange(null)} />}
        </div>
      </div>

      {menuOpen && (
        <div className="menu" role="menu" ref={menuRef}>
          <button className="state" role="menuitem" onClick={() => { onEdit(item); onToggleMenu(null); }}>
            <Pencil size={18} /> Edit
          </button>
          <button className="state danger" role="menuitem" onClick={() => { onDelete(item.id); onToggleMenu(null); }}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

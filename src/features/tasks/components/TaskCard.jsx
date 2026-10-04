import { useEffect, useRef } from "react";
import { Check, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { cookie, circle } from "../../../design/shapes";
import { PRIORITIES, PRIORITY_META, roomMeta } from "../model";
import { useSwipe } from "../useSwipe";

const ACTIONS_WIDTH = 216; // 3 round buttons (60px) + gaps + padding

function Checkbox({ checked, label, onChange, room }) {
  return (
    <button
      className="cb state"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(); }}
    >
      {/* unchecked: a circle; checked: it morphs into the room's scalloped shape */}
      <span className="cb-shape" style={{ clipPath: checked ? cookie(room.lobes, Math.max(room.amp, 0.1)) : circle() }}>
        <Check size={16} strokeWidth={3.4} />
      </span>
    </button>
  );
}

export default function TaskCard({ item, menuOpen, swipeOpen, onMenu, onSwipe, onToggle, onEdit, onDelete, onSetPriority }) {
  const room = roomMeta(item.room);
  const RoomIcon = room.icon;
  const menuRef = useRef(null);
  const swipe = useSwipe({ width: ACTIONS_WIDTH, open: swipeOpen, onOpenChange: (open) => onSwipe(open ? item.id : null) });

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => menuRef.current && !menuRef.current.contains(e.target) && onMenu(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen, onMenu]);

  const open = () => {
    if (swipe.consumeClick()) return;
    if (swipeOpen) return onSwipe(null);
    onEdit(item);
  };

  return (
    <li className="swipe">
      <div className="swipe-clip">
        <div className="swipe-actions" aria-hidden={!swipeOpen}>
          {PRIORITIES.map((p) => {
            const meta = PRIORITY_META[p];
            const Icon = meta.icon;
            return (
              <button
                key={p}
                className="swipe-action acc state"
                style={{ "--hue": meta.hue }}
                aria-label={`Set ${meta.label}`}
                aria-pressed={item.priority === p}
                tabIndex={swipeOpen ? 0 : -1}
                onClick={() => onSetPriority(item, p)}
              >
                <Icon size={20} />
                <span>{meta.short}</span>
              </button>
            );
          })}
        </div>

        <div
          className={`task acc state${swipe.dragging ? " is-dragging" : ""}${item.checked ? " done" : ""}`}
          style={{ "--hue": room.hue, transform: `translateX(${swipe.dx}px)` }}
          onClick={open}
          {...swipe.handlers}
        >
          <Checkbox checked={item.checked} room={room} label={`Mark “${item.name}” as done`} onChange={() => onToggle(item)} />
          <div className="task-body">
            <p className="task-title body-lg">{item.name}</p>
            <span className="room-tag">
              <RoomIcon size={14} /> {item.room}
            </span>
          </div>
          <button
            className="icon-btn state"
            aria-label={`More actions for ${item.name}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={(e) => { e.stopPropagation(); onMenu(menuOpen ? null : item.id); }}
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="menu" role="menu" ref={menuRef}>
          <button className="menu-item state" role="menuitem" onClick={() => { onMenu(null); onEdit(item); }}>
            <Pencil size={18} /> Edit
          </button>
          <button className="menu-item menu-danger state" role="menuitem" onClick={() => { onMenu(null); onDelete(item); }}>
            <Trash2 size={18} /> Delete
          </button>
        </div>
      )}
    </li>
  );
}

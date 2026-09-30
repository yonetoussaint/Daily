import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PRIORITIES, PRIORITY_META, ROOMS } from "./constants";

export default function ItemDialog({ initial, defaultRoom, onCancel, onSubmit }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [priority, setPriority] = useState(initial?.priority ?? "Medium");
  const [room, setRoom] = useState(initial?.room ?? defaultRoom ?? ROOMS[0]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSubmit({ name: name.trim(), priority, room });
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <form className="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title" onSubmit={submit}>
        <h2 id="dlg-title">{initial ? "Edit item" : "Add item"}</h2>

        <label className="field">
          <span className="label-md">Name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Desk organizer" />
        </label>

        <div className="field">
          <span className="label-md">Priority</span>
          <div className="seg">
            {PRIORITIES.map((p) => (
              <button type="button" key={p} className={`state ${PRIORITY_META[p].cls}`} aria-pressed={p === priority} onClick={() => setPriority(p)}>
                {p === priority && <Check size={16} />} {p}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label-md">Room</span>
          <div className="wrap">
            {ROOMS.map((r) => (
              <button type="button" key={r} className="chip state" aria-pressed={r === room} onClick={() => setRoom(r)}>
                {r === room && <Check size={16} />} {r}
              </button>
            ))}
          </div>
        </div>

        <div className="actions">
          <button type="button" className="btn btn-text state" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-filled state" disabled={!name.trim()}>{initial ? "Save changes" : "Add item"}</button>
        </div>
      </form>
    </div>
  );
}

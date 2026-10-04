import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { todayIso } from "../model";

const plusDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/** Add / edit a task. Mounted only while open, so the form always starts fresh. */
export default function TaskSheet({ task, lists, defaultListId, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => ({ title: "", listId: defaultListId ?? lists[0]?.id, askedBy: "", due: "", notes: "", ...task }));
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (title) onSave({ ...task, title, listId: f.listId, askedBy: f.askedBy.trim(), due: f.due, notes: f.notes.trim() });
  };

  return (
    <Sheet title={task ? "Edit task" : "New task"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="What needs doing?" value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus maxLength={160} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">List</legend>
          <div className="chip-wrap">
            {lists.map((l) => <Chip key={l.id} hue={l.hue} selected={f.listId === l.id} onClick={() => set({ listId: l.id })}>{l.name}</Chip>)}
          </div>
        </fieldset>

        <TextField label="Who asked? (optional)" value={f.askedBy} onChange={(e) => set({ askedBy: e.target.value })} maxLength={60} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Due</legend>
          <div className="chip-wrap">
            <Chip selected={!f.due} onClick={() => set({ due: "" })}>No date</Chip>
            <Chip selected={f.due === todayIso()} onClick={() => set({ due: todayIso() })}>Today</Chip>
            <Chip selected={f.due === plusDays(1)} onClick={() => set({ due: plusDays(1) })}>Tomorrow</Chip>
          </div>
          <TextField type="date" label="Pick a date" value={f.due} onChange={(e) => set({ due: e.target.value })} />
        </fieldset>

        <div className="field">
          <textarea className="field-input todo-textarea" placeholder=" " value={f.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} />
          <label className="field-label">Details (optional)</label>
        </div>

        <div className="sheet-actions">
          {task && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!f.title.trim()}>{task ? "Save changes" : "Add"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

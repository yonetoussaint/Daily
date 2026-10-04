import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { AREAS, NOTE_KINDS } from "../model";

function TextArea({ label, value, onChange }) {
  return (
    <div className="field">
      <textarea className="field-input proj-textarea" placeholder=" " value={value} onChange={onChange} rows={4} />
      <label className="field-label">{label}</label>
    </div>
  );
}

/** One sheet for adding / editing a task, a milestone or a note. */
export default function EntrySheet({ kind, item, project, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => ({
    title: "", area: "product", milestoneId: null, due: "", details: "", body: "", ...item,
    noteKind: kind === "note" ? item?.kind ?? "note" : "note",
  }));
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (!title) return;
    if (kind === "task") onSave({ ...item, title, area: f.area, milestoneId: f.milestoneId, due: f.due, details: f.details.trim(), status: item?.status ?? "todo" });
    else if (kind === "milestone") onSave({ ...item, title, due: f.due });
    else onSave({ ...item, title, kind: f.noteKind, body: f.body.trim(), createdAt: item?.createdAt ?? Date.now() });
  };

  return (
    <Sheet title={`${item ? "Edit" : "New"} ${kind}`} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Title" value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus maxLength={140} autoComplete="off" />

        {kind === "task" && (
          <>
            <fieldset className="sheet-section">
              <legend className="label-lg muted">Area</legend>
              <div className="chip-wrap">
                {AREAS.map((a) => <Chip key={a.id} hue={a.hue} icon={<a.icon size={18} />} selected={f.area === a.id} onClick={() => set({ area: a.id })}>{a.label}</Chip>)}
              </div>
            </fieldset>
            <fieldset className="sheet-section">
              <legend className="label-lg muted">Milestone</legend>
              <div className="chip-wrap">
                <Chip selected={!f.milestoneId} onClick={() => set({ milestoneId: null })}>None</Chip>
                {project.milestones.map((m) => <Chip key={m.id} selected={f.milestoneId === m.id} onClick={() => set({ milestoneId: m.id })}>{m.title}</Chip>)}
              </div>
            </fieldset>
          </>
        )}

        {kind === "note" && (
          <fieldset className="sheet-section">
            <legend className="label-lg muted">Type</legend>
            <div className="chip-wrap">
              {NOTE_KINDS.map((k) => <Chip key={k.id} hue={k.hue} icon={<k.icon size={18} />} selected={f.noteKind === k.id} onClick={() => set({ noteKind: k.id })}>{k.label}</Chip>)}
            </div>
          </fieldset>
        )}

        {kind !== "note" && <TextField type="date" label={kind === "task" ? "Due date" : "Target date"} value={f.due} onChange={(e) => set({ due: e.target.value })} />}
        {kind === "task" && <TextArea label="Details" value={f.details} onChange={(e) => set({ details: e.target.value })} />}
        {kind === "note" && <TextArea label="Write it down" value={f.body} onChange={(e) => set({ body: e.target.value })} />}

        <div className="sheet-actions">
          {item && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!f.title.trim()}>{item ? "Save changes" : "Add"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

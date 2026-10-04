import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { CATEGORIES, REFLECTION_KINDS } from "../model";

const COPY = {
  value: { name: "value", title: "Value", body: "What does it mean to you?" },
  principle: { name: "principle", title: "I will…", body: "Why does it matter?" },
  reflection: { name: "journal entry", title: "What happened?", body: "What did you notice?" },
};

function TextArea({ label, value, onChange }) {
  return (
    <div className="field">
      <textarea className="field-input vals-textarea" placeholder=" " value={value} onChange={onChange} rows={4} />
      <label className="field-label">{label}</label>
    </div>
  );
}

/** One sheet for adding / editing a value, a principle or a journal entry. */
export default function EntrySheet({ kind, item, values, onClose, onSave, onDelete }) {
  const copy = COPY[kind];
  const [f, setF] = useState(() => ({ title: item?.title ?? "", text: item?.meaning ?? item?.why ?? item?.body ?? "", category: item?.category ?? "character", valueId: item?.valueId ?? null, rKind: item?.kind ?? "lived" }));
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    const title = f.title.trim();
    if (!title) return;
    const text = f.text.trim();
    if (kind === "value") onSave({ ...item, title, meaning: text, category: f.category });
    else if (kind === "principle") onSave({ ...item, title, why: text, category: f.category, valueId: f.valueId });
    else onSave({ ...item, title, body: text, kind: f.rKind, valueId: f.valueId });
  };

  return (
    <Sheet title={`${item ? "Edit" : "New"} ${copy.name}`} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        {kind === "reflection" && (
          <fieldset className="sheet-section">
            <legend className="label-lg muted">Type</legend>
            <div className="chip-wrap">
              {REFLECTION_KINDS.map((k) => <Chip key={k.id} hue={k.hue} icon={<k.icon size={18} />} selected={f.rKind === k.id} onClick={() => set({ rKind: k.id })}>{k.label}</Chip>)}
            </div>
          </fieldset>
        )}

        <TextField label={copy.title} value={f.title} onChange={(e) => set({ title: e.target.value })} autoFocus maxLength={120} autoComplete="off" />
        <TextArea label={copy.body} value={f.text} onChange={(e) => set({ text: e.target.value })} />

        {kind !== "reflection" && (
          <fieldset className="sheet-section">
            <legend className="label-lg muted">Area of life</legend>
            <div className="chip-wrap">
              {CATEGORIES.map((c) => <Chip key={c.id} hue={c.hue} icon={<c.icon size={18} />} selected={f.category === c.id} onClick={() => set({ category: c.id })}>{c.label}</Chip>)}
            </div>
          </fieldset>
        )}

        {kind !== "value" && values.length > 0 && (
          <fieldset className="sheet-section">
            <legend className="label-lg muted">{kind === "principle" ? "Comes from the value" : "About the value"}</legend>
            <div className="chip-wrap">
              <Chip selected={!f.valueId} onClick={() => set({ valueId: null })}>None</Chip>
              {values.map((v) => <Chip key={v.id} selected={f.valueId === v.id} onClick={() => set({ valueId: v.id })}>{v.title}</Chip>)}
            </div>
          </fieldset>
        )}

        <div className="sheet-actions">
          {item && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!f.title.trim()}>{item ? "Save changes" : "Add"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

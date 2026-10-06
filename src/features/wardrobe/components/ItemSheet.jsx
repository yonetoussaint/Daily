import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { CATEGORIES, EMPTY_ITEM, SEASONS } from "../model";

/** Add / edit a piece of clothing. Mounted only while open, so the form always starts fresh. */
export default function ItemSheet({ item, defaultCategory, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => ({ ...EMPTY_ITEM, category: defaultCategory ?? EMPTY_ITEM.category, ...item }));
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const submit = (e) => {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    onSave({ ...item, name, category: f.category, color: f.color.trim(), brand: f.brand.trim(), size: f.size.trim(), season: f.season, notes: f.notes.trim() });
  };

  return (
    <Sheet title={item ? "Edit item" : "New item"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Name" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus maxLength={120} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Category</legend>
          <div className="chip-wrap">
            {CATEGORIES.map((c) => <Chip key={c.name} hue={c.hue} selected={f.category === c.name} onClick={() => set({ category: c.name })}>{c.name}</Chip>)}
          </div>
        </fieldset>

        <TextField label="Colour (optional)" value={f.color} onChange={(e) => set({ color: e.target.value })} maxLength={60} autoComplete="off" />
        <TextField label="Brand (optional)" value={f.brand} onChange={(e) => set({ brand: e.target.value })} maxLength={60} autoComplete="off" />
        <TextField label="Size (optional)" value={f.size} onChange={(e) => set({ size: e.target.value })} maxLength={30} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Season</legend>
          <div className="chip-wrap">
            {SEASONS.map((s) => <Chip key={s.id} selected={f.season === s.id} onClick={() => set({ season: s.id })}>{s.label}</Chip>)}
          </div>
        </fieldset>

        <div className="field">
          <textarea className="field-input wd-textarea" placeholder=" " value={f.notes} onChange={(e) => set({ notes: e.target.value })} rows={3} maxLength={1000} />
          <label className="field-label">Notes (optional)</label>
        </div>

        <div className="sheet-actions">
          {item && <Button variant="text" className="wd-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!f.name.trim()}>{item ? "Save changes" : "Add"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

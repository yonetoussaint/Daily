import { useRef, useState } from "react";
import { Camera, Plus, Star, X } from "lucide-react";
import { Button, Chip, Sheet, TextField, useSnackbar } from "../../../design/components";
import { fileToThumb, itemImages, MAX_IMAGES } from "../image";
import { CATEGORIES, EMPTY_ITEM, SEASONS, catMeta, typeChoices } from "../model";

/** Add / edit a piece of clothing. Mounted only while open, so the form always starts fresh. */
export default function ItemSheet({ item, defaultCategory, defaultType, onClose, onSave, onDelete }) {
  const [f, setF] = useState(() => ({ ...EMPTY_ITEM, category: defaultCategory ?? EMPTY_ITEM.category, type: defaultType ?? "", ...item, images: itemImages(item) }));
  const [custom, setCustom] = useState(false); // typing a type that isn't in the list
  const snackbar = useSnackbar();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const pick = async (e) => {
    const files = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!files.length) return;
    const room = MAX_IMAGES - f.images.length;
    if (room <= 0) return snackbar.show({ message: `Up to ${MAX_IMAGES} photos per item.` });
    setBusy(true);
    try {
      const added = [];
      let failed = 0;
      for (const file of files.slice(0, room)) {
        try { added.push(await fileToThumb(file)); } catch { failed += 1; }
      }
      if (added.length) setF((s) => ({ ...s, images: [...s.images, ...added].slice(0, MAX_IMAGES) }));
      if (failed) snackbar.show({ message: `${failed} file${failed === 1 ? "" : "s"} couldn’t be read as an image.` });
      else if (files.length > room) snackbar.show({ message: `Only the first ${room} were added (limit ${MAX_IMAGES}).` });
    } finally {
      setBusy(false);
    }
  };
  const removeAt = (n) => set({ images: f.images.filter((_, k) => k !== n) });
  const makeCover = (n) => set({ images: [f.images[n], ...f.images.filter((_, k) => k !== n)] });

  const submit = (e) => {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    onSave({ ...item, name, category: f.category, type: f.type.trim(), color: f.color.trim(), brand: f.brand.trim(), size: f.size.trim(), season: f.season, notes: f.notes.trim(), images: f.images, image: f.images[0] ?? "" });
  };

  return (
    <Sheet title={item ? "Edit item" : "New item"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <fieldset className="sheet-section">
          <legend className="label-lg muted">Photos <span className="wd-count">{f.images.length}/{MAX_IMAGES}</span></legend>
          <ul className="wd-photo-grid">
            {f.images.map((src, n) => (
              <li key={src.slice(-40) + n} className="wd-photo-tile">
                <img src={src} alt={`Photo ${n + 1}`} />
                {n === 0 && <span className="wd-photo-cover label-md">Cover</span>}
                <button type="button" className="wd-photo-x state" aria-label={`Remove photo ${n + 1}`} onClick={() => removeAt(n)}><X size={16} /></button>
                {n > 0 && <button type="button" className="wd-photo-star state" aria-label={`Make photo ${n + 1} the cover`} onClick={() => makeCover(n)}><Star size={16} /></button>}
              </li>
            ))}
            {f.images.length < MAX_IMAGES && (
              <li>
                <button type="button" className="wd-photo-add state" onClick={() => fileRef.current?.click()} aria-label="Add photos">
                  {busy ? <span className="label-lg">Processing…</span> : f.images.length ? <Plus size={28} /> : <span className="wd-photo-empty"><Camera size={28} /><span className="label-lg">Add photos</span></span>}
                </button>
              </li>
            )}
          </ul>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={pick} />
        </fieldset>

        <TextField label="Name" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus maxLength={120} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Category</legend>
          <div className="chip-wrap">
            {CATEGORIES.map((c) => <Chip key={c.name} hue={c.hue} selected={f.category === c.name} onClick={() => { set({ category: c.name, type: c.name === f.category ? f.type : "" }); setCustom(false); }}>{c.name}</Chip>)}
            {f.category === "Other" && <Chip hue={catMeta("Other").hue} selected>Other</Chip>}
          </div>
        </fieldset>

        {catMeta(f.category).types.length > 0 && (
          <fieldset className="sheet-section">
            <legend className="label-lg muted">Type</legend>
            <div className="chip-wrap">
              {typeChoices(f.category, custom ? "" : f.type).map((t) => <Chip key={t} hue={catMeta(f.category).hue} selected={!custom && f.type === t} onClick={() => { setCustom(false); set({ type: f.type === t ? "" : t }); }}>{t}</Chip>)}
              <Chip selected={custom} onClick={() => { setCustom(true); set({ type: catMeta(f.category).types.includes(f.type) ? "" : f.type }); }}>Other…</Chip>
            </div>
            {custom && <TextField label="Type" value={f.type} onChange={(e) => set({ type: e.target.value })} maxLength={40} autoComplete="off" />}
          </fieldset>
        )}

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
          <Button type="submit" disabled={!f.name.trim() || busy}>{item ? "Save changes" : "Add"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

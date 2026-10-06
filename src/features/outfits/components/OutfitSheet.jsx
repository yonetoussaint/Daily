import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { EMPTY_OUTFIT, OCCASIONS, SEASONS, catMeta, sortPieces } from "../model";
import { useOutfits } from "../OutfitsProvider";
import PiecePicker from "./PiecePicker";

/** Create / edit an outfit. Mounted only while open. Has two steps: the form, and the wardrobe picker. */
export default function OutfitSheet({ outfit, onClose, onSave, onDelete }) {
  const { pieces, pieceById, piecesError } = useOutfits();
  const [f, setF] = useState(() => ({ ...EMPTY_OUTFIT, ...outfit, itemIds: (outfit?.itemIds ?? []).filter((id) => pieceById.has(id)) }));
  const [step, setStep] = useState("form"); // form | pick
  const set = (patch) => setF((s) => ({ ...s, ...patch }));

  const chosen = sortPieces(f.itemIds.map((id) => pieceById.get(id)).filter(Boolean));

  const submit = (e) => {
    e.preventDefault();
    const name = f.name.trim();
    if (!name) return;
    onSave({ ...outfit, name, occasion: f.occasion, season: f.season, notes: f.notes.trim(), favorite: !!f.favorite, itemIds: chosen.map((p) => p.id) });
  };

  if (step === "pick") {
    return (
      <Sheet title="Choose pieces" onClose={() => setStep("form")}>
        <PiecePicker pieces={pieces} selected={f.itemIds} onChange={(itemIds) => set({ itemIds })} onDone={() => setStep("form")} />
      </Sheet>
    );
  }

  return (
    <Sheet title={outfit ? "Edit outfit" : "New outfit"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Name" value={f.name} onChange={(e) => set({ name: e.target.value })} autoFocus maxLength={120} autoComplete="off" />

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Pieces{chosen.length ? ` · ${chosen.length}` : ""}</legend>
          <ul className="of-chosen">
            {chosen.map((p) => {
              const meta = catMeta(p.category);
              return (
                <li key={p.id} className="of-chosen-item acc" style={{ "--hue": meta.hue }}>
                  <span className="of-chosen-thumb">{p.image ? <img src={p.image} alt={p.name} /> : <meta.icon size={22} />}</span>
                  <span className="label-md of-chosen-name">{p.name}</span>
                  <button type="button" className="of-remove state" aria-label={`Remove ${p.name}`} onClick={() => set({ itemIds: f.itemIds.filter((x) => x !== p.id) })}><X size={14} strokeWidth={3} /></button>
                </li>
              );
            })}
            <li>
              <button type="button" className="of-add state" onClick={() => setStep("pick")}>
                <Plus size={24} />
                <span className="label-md">Add from wardrobe</span>
              </button>
            </li>
          </ul>
          {piecesError && <p className="body-md wd-error" role="alert">Couldn’t load your wardrobe.</p>}
        </fieldset>

        <fieldset className="sheet-section">
          <legend className="label-lg muted">Occasion</legend>
          <div className="chip-wrap">
            {OCCASIONS.map((o) => <Chip key={o.id} hue={o.hue} selected={f.occasion === o.id} onClick={() => set({ occasion: o.id })}>{o.label}</Chip>)}
          </div>
        </fieldset>

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
          {outfit && <Button variant="text" className="wd-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!f.name.trim()}>{outfit ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

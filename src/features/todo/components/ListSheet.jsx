import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { HUES } from "../model";

/** New list / rename + recolour. */
export default function ListSheet({ list, onClose, onSave, onDelete }) {
  const [name, setName] = useState(list?.name ?? "");
  const [hue, setHue] = useState(list?.hue ?? HUES[2]);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSave({ ...list, name: name.trim(), hue });
  };

  return (
    <Sheet title={list ? "Edit list" : "New list"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={40} autoComplete="off" />
        <fieldset className="sheet-section">
          <legend className="label-lg muted">Colour</legend>
          <div className="chip-wrap">
            {HUES.map((h) => <Chip key={h} hue={h} selected={hue === h} onClick={() => setHue(h)} aria-label={`Colour ${h}`}><span className="swatch acc" style={{ "--hue": h }} /></Chip>)}
          </div>
        </fieldset>
        {list && <p className="body-md muted">Deleting a list also deletes its tasks (you can undo for a few seconds).</p>}
        <div className="sheet-actions">
          {list && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>{list ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

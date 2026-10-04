import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { STAGES } from "../model";

const HUES = [25, 285, 155, 235, 350, 85];

/** New project / edit details. Mounted only while open, so the form always starts fresh. */
export default function ProjectSheet({ project, onClose, onSave, onDelete }) {
  const [name, setName] = useState(project?.name ?? "");
  const [tagline, setTagline] = useState(project?.tagline ?? "");
  const [stage, setStage] = useState(project?.stage ?? "Idea");
  const [hue, setHue] = useState(project?.hue ?? HUES[0]);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSave({ name: name.trim(), tagline: tagline.trim(), stage, hue });
  };

  return (
    <Sheet title={project ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} autoComplete="off" />
        <TextField label="What is it?" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={140} autoComplete="off" />
        <fieldset className="sheet-section">
          <legend className="label-lg muted">Stage</legend>
          <div className="chip-wrap">
            {STAGES.map((s) => <Chip key={s} selected={stage === s} onClick={() => setStage(s)}>{s}</Chip>)}
          </div>
        </fieldset>
        <fieldset className="sheet-section">
          <legend className="label-lg muted">Colour</legend>
          <div className="chip-wrap">
            {HUES.map((h) => <Chip key={h} hue={h} selected={hue === h} onClick={() => setHue(h)} aria-label={`Colour ${h}`}><span className="swatch acc" style={{ "--hue": h }} /></Chip>)}
          </div>
        </fieldset>
        <div className="sheet-actions">
          {project && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>{project ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

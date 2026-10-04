import { useState } from "react";
import { Button, Chip, Sheet, TextField } from "../../../design/components";
import { CONTENT_TYPES } from "../model";

/** New / edit-details sheet. Mounted only while open, so its form always starts fresh. */
export default function BookSheet({ book, onClose, onSave }) {
  const [title, setTitle] = useState(book?.title ?? "");
  const [type, setType] = useState(book?.type ?? "book");
  const [tags, setTags] = useState((book?.tags ?? []).join(", "));

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      type,
      tags: [...new Set(tags.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean))],
    });
  };

  return (
    <Sheet title={book ? "Edit details" : "New doc"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <fieldset className="sheet-section">
          <legend className="label-lg muted">Type</legend>
          <div className="chip-wrap">
            {CONTENT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <Chip key={t.id} hue={t.hue} selected={type === t.id} icon={<Icon size={18} />} onClick={() => setType(t.id)}>
                  {t.label}
                </Chip>
              );
            })}
          </div>
        </fieldset>

        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus maxLength={120} autoComplete="off" />
        <TextField label="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} autoComplete="off" />

        <div className="sheet-actions">
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim()}>{book ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

import { useState } from "react";
import { Button, Sheet, TextField } from "../../../design/components";
import { flattenFolders } from "../model";

/** Folder picker used by the folder and task sheets: every folder, indented by depth. */
export function FolderSelect({ label, folders, value, onChange, exclude = null, rootLabel = "No folder" }) {
  return (
    <div className="field">
      <select className="field-input proj-select" value={value ?? ""} onChange={(e) => onChange(e.target.value || null)} aria-label={label}>
        <option value="">{rootLabel}</option>
        {flattenFolders(folders, exclude).map(({ folder, depth }) => (
          <option key={folder.id} value={folder.id}>{`${"\u2003".repeat(depth)}${depth ? "↳ " : ""}${folder.name}`}</option>
        ))}
      </select>
      <label className="field-label proj-select-label">{label}</label>
    </div>
  );
}

/** New folder / rename / move. A folder can't be moved into itself or into anything below it. */
export default function FolderSheet({ folder, parentId = null, folders, onClose, onSave, onDelete }) {
  const [name, setName] = useState(folder?.name ?? "");
  const [parent, setParent] = useState(folder ? folder.parentId ?? null : parentId);

  const submit = (e) => {
    e.preventDefault();
    if (name.trim()) onSave({ ...folder, name: name.trim(), parentId: parent });
  };

  return (
    <Sheet title={folder ? "Edit folder" : "New folder"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus maxLength={60} autoComplete="off" />
        <FolderSelect label="Inside" folders={folders} value={parent} onChange={setParent} exclude={folder?.id ?? null} rootLabel="Top level" />
        <div className="sheet-actions">
          {folder && <Button variant="text" className="btn-danger" onClick={onDelete}>Delete</Button>}
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!name.trim()}>{folder ? "Save changes" : "Create"}</Button>
        </div>
      </form>
    </Sheet>
  );
}

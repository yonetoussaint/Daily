import { useState } from "react";
import { ArrowDown, ArrowUp, CornerDownRight, Trash2 } from "lucide-react";
import { Button, Sheet, TextField } from "../../../design/components";

/** Rename / reorder / delete a chapter or section. Mounted only while open. */
export default function NodeSheet({ node, isSection, canMoveUp, canMoveDown, canDelete, onClose, onRename, onAddSub, onMove, onDelete }) {
  const [title, setTitle] = useState(node.title);

  const submit = (e) => {
    e.preventDefault();
    onRename(title.trim() || (isSection ? "Untitled section" : "Untitled chapter"));
    onClose();
  };
  const act = (fn) => () => { onClose(); fn(); };

  return (
    <Sheet title={isSection ? "Section" : "Chapter"} onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus maxLength={120} autoComplete="off" />

        <div className="sheet-list">
          {!isSection && (
            <button type="button" className="sheet-action state" onClick={act(onAddSub)}>
              <CornerDownRight size={20} /> Add a section
            </button>
          )}
          <button type="button" className="sheet-action state" disabled={!canMoveUp} onClick={act(() => onMove(-1))}>
            <ArrowUp size={20} /> Move up
          </button>
          <button type="button" className="sheet-action state" disabled={!canMoveDown} onClick={act(() => onMove(1))}>
            <ArrowDown size={20} /> Move down
          </button>
          <button type="button" className="sheet-action sheet-action-danger state" disabled={!canDelete} onClick={act(onDelete)}>
            <Trash2 size={20} /> Delete {isSection ? "section" : "chapter"}
          </button>
        </div>

        <div className="sheet-actions">
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Sheet>
  );
}

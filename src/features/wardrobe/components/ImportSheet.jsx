import { useRef, useState } from "react";
import { ClipboardCopy, FileUp } from "lucide-react";
import { Button, Sheet, useSnackbar } from "../../../design/components";
import { AI_PROMPT, EXAMPLE_JSON, parseWardrobeJson } from "../importer";

/** Paste (or load) JSON and add it to the wardrobe. Mounted only while open. */
export default function ImportSheet({ onClose, onImport }) {
  const snackbar = useSnackbar();
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    try {
      onImport(parseWardrobeJson(text));
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async (value, message) => {
    try {
      await navigator.clipboard.writeText(value);
      snackbar.show({ message });
    } catch {
      snackbar.show({ message: "Couldn’t copy. Select the text manually." });
    }
  };

  const loadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setText(await file.text());
      setError("");
    } catch {
      setError("Couldn’t read that file.");
    }
  };

  return (
    <Sheet title="Import from JSON" onClose={onClose}>
      <form onSubmit={submit} className="sheet-form">
        <p className="body-md muted">
          Paste a list of clothes as JSON. Items with an <code>id</code> that already exists are updated; everything else is added. You can ask an AI to write it from a list or photo of your clothes.
        </p>

        <div className="chip-wrap">
          <Button variant="tonal" icon={<ClipboardCopy size={18} />} onClick={() => copy(AI_PROMPT, "AI prompt copied")}>Copy AI prompt</Button>
          <Button variant="tonal" icon={<FileUp size={18} />} onClick={() => fileRef.current?.click()}>Load .json file</Button>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={loadFile} />
        </div>

        <div>
          <textarea
            className="wd-json"
            aria-label="Wardrobe JSON"
            aria-invalid={!!error}
            aria-describedby={error ? "wd-import-error" : undefined}
            placeholder={EXAMPLE_JSON}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
          />
          {error && <p id="wd-import-error" role="alert" className="body-md wd-error">{error}</p>}
        </div>

        <div className="sheet-actions">
          <Button variant="text" onClick={() => setText(EXAMPLE_JSON)}>Use example</Button>
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!text.trim()}>Import</Button>
        </div>
      </form>
    </Sheet>
  );
}

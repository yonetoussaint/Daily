import { useRef, useState } from "react";
import { ClipboardCopy, FileUp } from "lucide-react";
import { Button, Sheet, useSnackbar } from "../../../design/components";
import { AI_PROMPT, parseDocJson } from "../importer";

/** Paste (or load) JSON written by an AI and turn it into a doc. Mounted only while open. */
export default function ImportSheet({ onClose, onImport }) {
  const snackbar = useSnackbar();
  const fileRef = useRef(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const submit = (e) => {
    e.preventDefault();
    try {
      onImport(parseDocJson(text));
    } catch (err) {
      setError(err.message);
    }
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT);
      snackbar.show({ message: "AI prompt copied" });
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
          Ask an AI to write your documentation as JSON, then paste its reply here. Each chapter becomes a page, and its sections nest inside.
        </p>

        <div className="chip-wrap">
          <Button variant="tonal" icon={<ClipboardCopy size={18} />} onClick={copyPrompt}>Copy AI prompt</Button>
          <Button variant="tonal" icon={<FileUp size={18} />} onClick={() => fileRef.current?.click()}>Load .json file</Button>
          <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={loadFile} />
        </div>

        <div>
          <textarea
            className="json-input"
            aria-label="Documentation JSON"
            aria-invalid={!!error}
            aria-describedby={error ? "import-error" : undefined}
            placeholder={'{\n  "title": "My Docs",\n  "chapters": [ … ]\n}'}
            value={text}
            onChange={(e) => { setText(e.target.value); setError(""); }}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            autoFocus
          />
          {error && <p id="import-error" role="alert" className="body-md import-error">{error}</p>}
        </div>

        <div className="sheet-actions">
          <Button variant="text" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!text.trim()}>Import</Button>
        </div>
      </form>
    </Sheet>
  );
}

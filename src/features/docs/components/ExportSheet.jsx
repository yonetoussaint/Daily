import { useMemo } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { Button, Sheet, useSnackbar } from "../../../design/components";
import { downloadJson, exportFilename, exportJson } from "../exporter";

/** Export one or more docs as JSON (download or copy) to hand to an AI. Mounted only while open. */
export default function ExportSheet({ books, onClose }) {
  const snackbar = useSnackbar();
  const text = useMemo(() => exportJson(books), [books]);
  const kb = Math.max(1, Math.round(text.length / 1024));
  const label = books.length === 1 ? `“${books[0].title}”` : `${books.length} docs`;

  const download = () => {
    downloadJson(text, exportFilename(books));
    snackbar.show({ message: "JSON file saved" });
    onClose();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      snackbar.show({ message: "JSON copied" });
      onClose();
    } catch {
      snackbar.show({ message: "Couldn’t copy. Try downloading instead." });
    }
  };

  return (
    <Sheet title="Export as JSON" onClose={onClose}>
      <div className="sheet-form">
        <p className="body-md muted">
          {label} · about {kb} KB. Upload the file to an AI (or paste it into the chat), then bring its reply back through Import.
        </p>
        <div className="chip-wrap">
          <Button icon={<Download size={18} />} onClick={download}>Download .json</Button>
          <Button variant="tonal" icon={<ClipboardCopy size={18} />} onClick={copy}>Copy JSON</Button>
        </div>
        <div className="sheet-actions">
          <Button variant="text" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Sheet>
  );
}

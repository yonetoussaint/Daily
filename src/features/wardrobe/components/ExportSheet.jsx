import { useMemo, useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { Button, Chip, Sheet, useSnackbar } from "../../../design/components";
import { exportJson } from "../importer";

/** Shows the wardrobe as JSON to copy or download. Mounted only while open. */
export default function ExportSheet({ items, onClose }) {
  const snackbar = useSnackbar();
  const [photos, setPhotos] = useState(false);
  const withPhotos = items.filter((i) => i.image).length;
  const json = useMemo(() => exportJson(items, { photos }), [items, photos]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      snackbar.show({ message: "JSON copied" });
    } catch {
      snackbar.show({ message: "Couldn’t copy. Select the text manually." });
    }
  };

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `wardrobe${photos ? "-photos" : ""}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <Sheet title="Export JSON" onClose={onClose}>
      <div className="sheet-form">
        <p className="body-md muted">{items.length} item{items.length === 1 ? "" : "s"}. Import this file again later to restore or edit in bulk.</p>
        {withPhotos > 0 && (
          <div className="chip-wrap">
            <Chip selected={photos} onClick={() => setPhotos((p) => !p)}>Include {withPhotos} photo{withPhotos === 1 ? "" : "s"} (large file)</Chip>
          </div>
        )}
        <div className="chip-wrap">
          <Button variant="tonal" icon={<ClipboardCopy size={18} />} onClick={copy}>Copy</Button>
          <Button variant="tonal" icon={<Download size={18} />} onClick={download}>Download .json</Button>
        </div>
        <textarea className="wd-json" aria-label="Wardrobe JSON" readOnly value={json} spellCheck={false} />
        <div className="sheet-actions"><Button variant="text" onClick={onClose}>Done</Button></div>
      </div>
    </Sheet>
  );
}

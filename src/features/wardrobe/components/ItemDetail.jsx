import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, Chip, IconButton, TopAppBar } from "../../../design/components";
import { catMeta, seasonLabel } from "../model";

const fmtAdded = (ms) => (ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "");

/** Full-screen detail page for one piece of clothing. */
export default function ItemDetail({ item, onBack, onEdit, onDelete }) {
  const cat = catMeta(item.category);
  const rows = [
    ["Colour", item.color],
    ["Brand", item.brand],
    ["Size", item.size],
    ["Season", seasonLabel(item.season)],
    ["Added", fmtAdded(item.createdAt)],
  ].filter(([, v]) => v);

  return (
    <>
      <TopAppBar
        title="Item"
        leading={<IconButton label="Back to wardrobe" onClick={onBack}><ArrowLeft size={24} /></IconButton>}
        actions={<IconButton label="Edit item" onClick={onEdit}><Pencil size={22} /></IconButton>}
      />
      <main className="wd-page wd-detail">
        <div className="wd-detail-photo">
          {item.image && <img src={item.image} alt={item.name} decoding="async" />}
        </div>

        <header className="wd-detail-head">
          {item.brand && <p className="wd-brand label-md">{item.brand}</p>}
          <h1 className="display wd-detail-name">{item.name}</h1>
          <div className="chip-wrap"><Chip hue={cat.hue} selected>{item.category}</Chip></div>
        </header>

        <dl className="wd-facts">
          {rows.map(([k, v]) => (
            <div key={k} className="wd-fact">
              <dt className="label-lg muted">{k}</dt>
              <dd className="title-md">{v}</dd>
            </div>
          ))}
        </dl>

        {item.notes && (
          <section className="wd-detail-notes" aria-label="Notes">
            <h3 className="label-lg muted">Notes</h3>
            <p className="body-lg">{item.notes}</p>
          </section>
        )}

        <div className="wd-detail-actions">
          <Button icon={<Pencil size={18} />} onClick={onEdit}>Edit</Button>
          <Button variant="text" className="wd-danger-inline" icon={<Trash2 size={18} />} onClick={onDelete}>Delete</Button>
        </div>
      </main>
    </>
  );
}

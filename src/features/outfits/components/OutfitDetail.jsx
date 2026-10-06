import { ArrowLeft, CalendarCheck, Heart, Pencil, Trash2 } from "lucide-react";
import { Button, Chip, IconButton, TopAppBar } from "../../../design/components";
import { catMeta, fmtDate, occasionMeta, seasonLabel, sortPieces } from "../model";
import { useOutfits } from "../OutfitsProvider";

/** Full-screen page for one outfit: its pieces (live from the wardrobe) and wear log. */
export default function OutfitDetail({ outfit, onBack, onEdit, onDelete }) {
  const { pieceById, toggleFavorite, markWorn } = useOutfits();
  const pieces = sortPieces(outfit.itemIds.map((id) => pieceById.get(id)).filter(Boolean));
  const occ = occasionMeta(outfit.occasion);
  const worn = outfit.wearCount ? `Worn ${outfit.wearCount} time${outfit.wearCount === 1 ? "" : "s"}${outfit.lastWorn ? ` · last ${fmtDate(outfit.lastWorn)}` : ""}` : "Not worn yet";

  return (
    <>
      <TopAppBar
        title={outfit.name}
        leading={<IconButton label="Back to outfits" onClick={onBack}><ArrowLeft size={24} /></IconButton>}
        actions={
          <>
            <IconButton label={outfit.favorite ? "Remove from favourites" : "Add to favourites"} className={outfit.favorite ? "is-on" : ""} aria-pressed={!!outfit.favorite} onClick={() => toggleFavorite(outfit.id)}><Heart size={22} fill={outfit.favorite ? "currentColor" : "none"} /></IconButton>
            <IconButton label="Edit outfit" onClick={onEdit}><Pencil size={22} /></IconButton>
          </>
        }
      />
      <main className="wd-page of-detail">
        <header className="wd-detail-head">
          <p className="overline muted">{pieces.length} piece{pieces.length === 1 ? "" : "s"}</p>
          <h1 className="display wd-detail-name">{outfit.name}</h1>
          <div className="chip-wrap">
            <Chip hue={occ.hue} selected>{occ.label}</Chip>
            {outfit.season !== "all" && <Chip selected>{seasonLabel(outfit.season)}</Chip>}
          </div>
        </header>

        {pieces.length === 0 ? (
          <p className="body-lg muted of-empty-pieces">No pieces yet — edit the outfit to add some from your wardrobe.</p>
        ) : (
          <ul className="wd-grid of-pieces">
            {pieces.map((p) => {
              const meta = catMeta(p.category);
              const details = [p.color, p.size && `Size ${p.size}`].filter(Boolean);
              return (
                <li key={p.id}>
                  <div className="wd-card acc" style={{ "--hue": meta.hue }}>
                    <span className="wd-thumb">{p.image ? <img src={p.image} alt={p.name} decoding="async" /> : <span className="of-thumb-icon"><meta.icon size={36} /></span>}</span>
                    <span className="wd-cap">
                      <span className="wd-brand label-md">{p.brand || p.category}</span>
                      <span className="title-md wd-name">{p.name}</span>
                      {details.length > 0 && <span className="wd-meta">{details.join(" · ")}</span>}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <dl className="wd-facts">
          <div className="wd-fact"><dt className="label-lg muted">Wear log</dt><dd className="title-md">{worn}</dd></div>
        </dl>

        {outfit.notes && (
          <section className="wd-detail-notes" aria-label="Notes">
            <h3 className="label-lg muted">Notes</h3>
            <p className="body-lg">{outfit.notes}</p>
          </section>
        )}

        <div className="wd-detail-actions">
          <Button icon={<CalendarCheck size={18} />} onClick={() => markWorn(outfit.id)}>Wore it today</Button>
          <Button variant="tonal" icon={<Pencil size={18} />} onClick={onEdit}>Edit</Button>
          <Button variant="text" className="wd-danger-inline" icon={<Trash2 size={18} />} onClick={onDelete}>Delete</Button>
        </div>
      </main>
    </>
  );
}

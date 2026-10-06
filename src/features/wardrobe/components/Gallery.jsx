import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { IconButton } from "../../../design/components";

/** Swipeable photo gallery (scroll-snap) with thumbnails and a tap-to-zoom viewer. */
export default function Gallery({ images, alt }) {
  const track = useRef(null);
  const [index, setIndex] = useState(0);
  const [viewer, setViewer] = useState(null); // index being viewed full-screen, or null

  const goTo = (n, smooth = true) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? "smooth" : "auto" });
  };
  const onScroll = (e) => {
    const el = e.currentTarget;
    const n = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
    setIndex((cur) => (cur === n ? cur : n));
  };

  useEffect(() => { if (index >= images.length) { setIndex(0); goTo(0, false); } }, [images.length, index]);

  if (!images.length) return <div className="wd-detail-photo" />;

  return (
    <div className="wd-gallery">
      <div className="wd-detail-photo wd-gallery-frame">
        <div className="wd-gallery-track" ref={track} onScroll={onScroll} role="group" aria-roledescription="carousel" aria-label={`${alt} photos`}>
          {images.map((src, n) => (
            <button key={src.slice(-40) + n} type="button" className="wd-gallery-slide" onClick={() => setViewer(n)} aria-label={`Open photo ${n + 1} of ${images.length}`}>
              <img src={src} alt={`${alt} (${n + 1} of ${images.length})`} decoding="async" loading={n === 0 ? "eager" : "lazy"} draggable={false} />
            </button>
          ))}
        </div>
        {images.length > 1 && <span className="wd-gallery-count label-md" aria-hidden="true">{index + 1} / {images.length}</span>}
      </div>

      {images.length > 1 && (
        <div className="wd-gallery-thumbs" role="tablist" aria-label="Photos">
          {images.map((src, n) => (
            <button key={src.slice(-40) + n} type="button" role="tab" aria-selected={n === index} aria-label={`Photo ${n + 1}`} className={`wd-gallery-thumb state${n === index ? " is-on" : ""}`} onClick={() => goTo(n)}>
              <img src={src} alt="" decoding="async" />
            </button>
          ))}
        </div>
      )}

      {viewer !== null && <Viewer images={images} alt={alt} start={viewer} onClose={(last) => { setViewer(null); setIndex(last); requestAnimationFrame(() => goTo(last, false)); }} />}
    </div>
  );
}

function Viewer({ images, alt, start, onClose }) {
  const [n, setN] = useState(start);
  const touch = useRef(null);
  const prev = () => setN((v) => (v + images.length - 1) % images.length);
  const next = () => setN((v) => (v + 1) % images.length);

  useEffect(() => {
    const key = (e) => {
      if (e.key === "Escape") onClose(n);
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = overflow; };
  });

  const down = (e) => { touch.current = e.clientX; };
  const up = (e) => {
    if (touch.current == null) return;
    const dx = e.clientX - touch.current;
    touch.current = null;
    if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
  };

  return (
    <div className="wd-viewer" role="dialog" aria-modal="true" aria-label={`${alt} photo ${n + 1} of ${images.length}`}>
      <div className="wd-viewer-bar">
        <span className="label-lg">{n + 1} / {images.length}</span>
        <IconButton label="Close photo viewer" onClick={() => onClose(n)}><X size={24} /></IconButton>
      </div>
      <div className="wd-viewer-stage" onPointerDown={down} onPointerUp={up}>
        <img src={images[n]} alt={`${alt} (${n + 1} of ${images.length})`} draggable={false} />
      </div>
      {images.length > 1 && (
        <>
          <button type="button" className="wd-viewer-nav is-prev state" aria-label="Previous photo" onClick={prev}><ChevronLeft size={28} /></button>
          <button type="button" className="wd-viewer-nav is-next state" aria-label="Next photo" onClick={next}><ChevronRight size={28} /></button>
        </>
      )}
    </div>
  );
}

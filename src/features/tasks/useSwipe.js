import { useEffect, useRef, useState } from "react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Horizontal swipe-to-reveal for a row. Pointer capture only starts after a real drag,
 * so taps on inner buttons and vertical scrolling keep working.
 */
export function useSwipe({ width, open, onOpenChange }) {
  const [dx, setDx] = useState(open ? -width : 0);
  const [dragging, setDragging] = useState(false);
  const dxRef = useRef(dx);
  const gesture = useRef(null);
  const swallowClick = useRef(false);

  const move = (v) => { dxRef.current = v; setDx(v); };

  useEffect(() => { if (!gesture.current) move(open ? -width : 0); }, [open, width]);

  const onPointerDown = (e) => {
    if (e.button > 0) return;
    gesture.current = { x: e.clientX, base: open ? -width : 0, moved: false };
  };

  const onPointerMove = (e) => {
    const g = gesture.current;
    if (!g) return;
    const delta = e.clientX - g.x;
    if (!g.moved) {
      if (Math.abs(delta) < 8) return;
      g.moved = true;
      setDragging(true);
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    move(clamp(g.base + delta, -width, 0));
  };

  const end = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g?.moved) return;
    setDragging(false);
    swallowClick.current = true;
    setTimeout(() => { swallowClick.current = false; }, 0);
    const shouldOpen = dxRef.current <= -width / 2;
    move(shouldOpen ? -width : 0);
    onOpenChange(shouldOpen);
  };

  return {
    dx,
    dragging,
    /** true once, right after a drag, so the click that follows can be ignored */
    consumeClick: () => swallowClick.current,
    handlers: { onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end },
  };
}

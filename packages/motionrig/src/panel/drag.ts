import { clamp } from './dom';

export interface Point {
  x: number;
  y: number;
}

/** Keeps a `w`×`h` box inside the viewport. */
export const fit = (p: Point, w: number, h: number): Point => ({
  x: clamp(p.x, 0, innerWidth - w),
  y: clamp(p.y, 0, innerHeight - h),
});

interface Options {
  handle: HTMLElement;
  /** Position and size at gesture start (the only layout read); `undefined` = not draggable now. */
  start(e: PointerEvent): { at: Point; w: number; h: number } | undefined;
  move(p: Point): void;
  /** After a real drag only (≥ 3 px). */
  end(p: Point): void;
}

/** Pointer-event drag with a 3 px threshold; returns a disposer. */
export function draggable(o: Options): () => void {
  let g: { id: number; x: number; y: number; at: Point; w: number; h: number; last?: Point } | undefined;
  // Only the pointer that pressed last drives the drag: another finger's moves and lifts are ignored.
  const end = (e: PointerEvent): void => {
    if (g?.id !== e.pointerId) return;
    if (g.last) o.end(g.last);
    g = undefined;
  };
  const on: Record<string, (e: PointerEvent) => void> = {
    pointerdown: (e) => {
      if (e.button) return;
      const s = o.start(e);
      if (!s) return;
      g = { id: e.pointerId, x: e.clientX, y: e.clientY, ...s };
      try {
        o.handle.setPointerCapture(e.pointerId);
      } catch {}
    },
    pointermove: (e) => {
      if (g?.id !== e.pointerId) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      if (!g.last && Math.hypot(dx, dy) < 3) return;
      g.last = fit({ x: g.at.x + dx, y: g.at.y + dy }, g.w, g.h);
      o.move(g.last);
    },
    pointerup: end,
    pointercancel: end,
  };
  for (const [type, fn] of Object.entries(on)) o.handle.addEventListener(type, fn as EventListener);
  return () => {
    for (const [type, fn] of Object.entries(on)) o.handle.removeEventListener(type, fn as EventListener);
  };
}

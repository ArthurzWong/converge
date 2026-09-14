import { bbox, inkLength, type VisualElement } from "./elements";

export interface TimelineEntry {
  element: VisualElement;
  start: number; // seconds
  duration: number; // seconds
}

export interface Timeline {
  entries: TimelineEntry[];
  total: number;
}

/**
 * Order elements the way a hand would draw them:
 * dependencies (containers/anchors) first, then top-down / left-right reading
 * order, with labels drawn immediately after the shape they belong to.
 * This is an original implementation inspired by the ordering strategy of
 * masihsultani/whiteboard-animator (see ATTRIBUTION.md).
 */
export function orderElements(elements: VisualElement[]): VisualElement[] {
  const byId = new Map(elements.map((e) => [e.id, e]));
  const visited = new Set<string>();
  const out: VisualElement[] = [];

  const readingOrder = [...elements].sort((a, b) => {
    const ba = bbox(a);
    const bb = bbox(b);
    const rowA = Math.round(ba.y / 90);
    const rowB = Math.round(bb.y / 90);
    if (rowA !== rowB) return rowA - rowB;
    return ba.x - bb.x;
  });

  const visit = (el: VisualElement) => {
    if (visited.has(el.id)) return;
    visited.add(el.id);
    for (const dep of el.after ?? []) {
      const d = byId.get(dep);
      if (d) visit(d);
    }
    out.push(el);
    // labels grouped with this shape follow immediately
    for (const child of elements) {
      if (child.group === el.id) visit(child);
    }
  };

  // shapes and arrows first in reading order, then any leftover text
  for (const el of readingOrder) if (el.type !== "text") visit(el);
  for (const el of readingOrder) visit(el);
  return out;
}

/**
 * Give each element a time slot proportional to sqrt(ink length) so large
 * shapes do not hog the timeline, then scale everything to fit `totalSec`.
 */
export function buildTimeline(elements: VisualElement[], totalSec: number): Timeline {
  const ordered = orderElements(elements);
  const weights = ordered.map((el) => {
    const base = Math.sqrt(Math.max(inkLength(el), 20));
    return el.type === "text" ? base * 0.9 : base;
  });
  const gapWeight = 1.1;
  const sum = weights.reduce((a, b) => a + b, 0) + gapWeight * Math.max(ordered.length - 1, 0);
  const drawable = Math.max(totalSec - 0.4, 1);
  const unit = drawable / sum;
  let t = 0.2;
  const entries: TimelineEntry[] = ordered.map((element, i) => {
    const duration = weights[i] * unit;
    const entry = { element, start: t, duration };
    t += duration + gapWeight * unit;
    return entry;
  });
  return { entries, total: totalSec };
}

/** Fraction (0..1) of an entry that should be drawn at time `t`. */
export function progressAt(entry: TimelineEntry, t: number): number {
  if (t <= entry.start) return 0;
  if (t >= entry.start + entry.duration) return 1;
  const p = (t - entry.start) / entry.duration;
  // ease so strokes start quickly and settle
  return 1 - Math.pow(1 - p, 1.6);
}

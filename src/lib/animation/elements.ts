/**
 * Visual element model: the intermediate representation between a Scene's
 * VisualSpec (semantic) and the renderer (pixels). Coordinates are in a fixed
 * 960x540 canvas so scenes scale uniformly.
 */
export const CANVAS_W = 960;
export const CANVAS_H = 540;

export type Point = { x: number; y: number };

interface BaseElement {
  id: string;
  /** Element ids that must be drawn before this one (containers, anchors). */
  after?: string[];
  /** Semantic group so text is drawn right after its shape. */
  group?: string;
  color?: string;
}

export interface StrokeElement extends BaseElement {
  type: "stroke";
  points: Point[];
  closed?: boolean;
  width?: number;
  dashed?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  x: number;
  y: number;
  text: string;
  size: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  maxWidth?: number;
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  from: Point;
  to: Point;
  /** control offset for a slight curve */
  bend?: number;
  broken?: boolean;
  label?: string;
}

export interface FillElement extends BaseElement {
  type: "fill";
  points: Point[];
  fill: string;
}

export type VisualElement = StrokeElement | TextElement | ArrowElement | FillElement;

export function bbox(el: VisualElement): { x: number; y: number; w: number; h: number } {
  if (el.type === "text") {
    const w = el.maxWidth ?? el.text.length * el.size * 0.55;
    return { x: el.anchor === "middle" ? el.x - w / 2 : el.x, y: el.y - el.size, w, h: el.size * 1.2 };
  }
  const pts = el.type === "arrow" ? [el.from, el.to] : el.points;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

/** Path length used to weight draw time for stroke-like elements. */
export function inkLength(el: VisualElement): number {
  if (el.type === "text") return el.text.length * el.size * 0.6;
  if (el.type === "arrow") return Math.hypot(el.to.x - el.from.x, el.to.y - el.from.y) + 30;
  let len = 0;
  for (let i = 1; i < el.points.length; i++) {
    len += Math.hypot(el.points[i].x - el.points[i - 1].x, el.points[i].y - el.points[i - 1].y);
  }
  if (el.type === "stroke" && el.closed && el.points.length > 1) {
    const a = el.points[0];
    const b = el.points[el.points.length - 1];
    len += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return len;
}

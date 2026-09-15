import type { ArrowElement, Point, StrokeElement } from "./elements";

const f = (n: number) => n.toFixed(1);

/**
 * Smooth a polyline into a Catmull-Rom spline rendered as cubic Béziers, so
 * hand-wobbled points read as a confident marker stroke rather than a jagged
 * polygon. Closed paths wrap around so the seam is invisible.
 */
export function pointsToPath(points: Point[], closed?: boolean, tension = 0.5): string {
  if (points.length === 0) return "";
  if (points.length < 3) {
    let d = `M ${f(points[0].x)} ${f(points[0].y)}`;
    for (const p of points.slice(1)) d += ` L ${f(p.x)} ${f(p.y)}`;
    return closed ? d + " Z" : d;
  }
  const pts = closed && dist(points[0], points[points.length - 1]) < 0.5 ? points.slice(0, -1) : points;
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const c1 = { x: p1.x + ((p2.x - p0.x) / 6) * tension * 2, y: p1.y + ((p2.y - p0.y) / 6) * tension * 2 };
    const c2 = { x: p2.x - ((p3.x - p1.x) / 6) * tension * 2, y: p2.y - ((p3.y - p1.y) / 6) * tension * 2 };
    d += ` C ${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return closed ? d + " Z" : d;
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function strokePath(el: StrokeElement): string {
  return pointsToPath(el.points, el.closed);
}

export function arrowGeometry(el: ArrowElement) {
  const { from, to } = el;
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const bend = el.bend ?? 0;
  const c = { x: mx + nx * bend, y: my + ny * bend };
  // tangent at end of quadratic = to - c
  const tx = to.x - c.x;
  const ty = to.y - c.y;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const size = 12;
  // stop the shaft just short of the tip so the filled head sits cleanly on it
  const end = { x: to.x - ux * size * 0.7, y: to.y - uy * size * 0.7 };
  const shaft = `M ${f(from.x)} ${f(from.y)} Q ${f(c.x)} ${f(c.y)} ${f(end.x)} ${f(end.y)}`;
  const left = { x: to.x - ux * size + -uy * size * 0.5, y: to.y - uy * size + ux * size * 0.5 };
  const right = { x: to.x - ux * size - -uy * size * 0.5, y: to.y - uy * size - ux * size * 0.5 };
  const back = { x: to.x - ux * size * 0.7, y: to.y - uy * size * 0.7 };
  const head = `M ${f(left.x)} ${f(left.y)} L ${f(to.x)} ${f(to.y)} L ${f(right.x)} ${f(right.y)} Q ${f(back.x)} ${f(back.y)} ${f(left.x)} ${f(left.y)} Z`;
  const labelPos = { x: c.x + nx * 16, y: c.y + ny * 16 - 4 };
  return { shaft, head, labelPos, length: len + size * 2, tip: to };
}

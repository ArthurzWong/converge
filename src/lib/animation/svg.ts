import type { ArrowElement, Point, StrokeElement } from "./elements";

export function pointsToPath(points: Point[], closed?: boolean): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first.x.toFixed(1)} ${first.y.toFixed(1)}`;
  for (const p of rest) d += ` L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  if (closed) d += " Z";
  return d;
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
  const shaft = `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${c.x.toFixed(1)} ${c.y.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
  // tangent at end of quadratic = to - c
  const tx = to.x - c.x;
  const ty = to.y - c.y;
  const tl = Math.hypot(tx, ty) || 1;
  const ux = tx / tl;
  const uy = ty / tl;
  const size = 11;
  const left = { x: to.x - ux * size + -uy * size * 0.55, y: to.y - uy * size + ux * size * 0.55 };
  const right = { x: to.x - ux * size - -uy * size * 0.55, y: to.y - uy * size - ux * size * 0.55 };
  const head = `M ${left.x.toFixed(1)} ${left.y.toFixed(1)} L ${to.x.toFixed(1)} ${to.y.toFixed(1)} L ${right.x.toFixed(1)} ${right.y.toFixed(1)}`;
  const labelPos = { x: c.x + nx * 14, y: c.y + ny * 14 - 4 };
  return { shaft, head, labelPos, length: len + size * 2 };
}

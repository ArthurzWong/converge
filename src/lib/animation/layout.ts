import type { NodeStyle, VisualNode, VisualSpec } from "../types";
import { CANVAS_H, CANVAS_W, type Point, type VisualElement } from "./elements";

/** Deterministic pseudo-random jitter so a scene always draws the same way. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

function wobble(points: Point[], amount: number, r: () => number): Point[] {
  return points.map((p) => ({ x: p.x + (r() - 0.5) * amount, y: p.y + (r() - 0.5) * amount }));
}

/** Sample a straight segment into wobbly points so it looks hand-drawn. */
function segment(a: Point, b: Point, r: () => number, amount = 1.8): Point[] {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(2, Math.round(len / 28));
  const pts: Point[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  const w = wobble(pts, amount, r);
  w[0] = a;
  w[w.length - 1] = b;
  return w;
}

function polyline(corners: Point[], r: () => number, closed = true): Point[] {
  const out: Point[] = [];
  const n = corners.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const seg = segment(corners[i], corners[(i + 1) % n], r);
    out.push(...(i === 0 ? seg : seg.slice(1)));
  }
  return out;
}

function ellipse(cx: number, cy: number, rx: number, ry: number, r: () => number): Point[] {
  const pts: Point[] = [];
  const n = 36;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2 - Math.PI / 2;
    pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
  }
  return wobble(pts, Math.min(0.9, Math.min(rx, ry) * 0.1), r);
}

interface Placed {
  node: VisualNode;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

const INK = "#1f2937";
const ACCENT = "#0d9488";
const WARN = "#ea580c";
const SOFT = "#6b7280";

/** Marker-highlighter tints laid behind each shape once its outline is inked. */
const TINT: Record<NodeStyle, string | null> = {
  box: "#fff4c7",
  pill: "#e9e4ff",
  cloud: "#e3f2ff",
  cylinder: "#dcfce7",
  person: null,
  warning: "#ffe4d1",
  spark: "#ccfbf1",
};

/** Slightly shrunken, offset copy of an outline so the tint looks like a marker pass. */
function tintPoints(points: Point[], cx: number, cy: number, r: () => number): Point[] {
  const ox = (r() - 0.5) * 6;
  const oy = (r() - 0.5) * 6 + 2;
  return points.map((p) => ({ x: cx + (p.x - cx) * 0.94 + ox, y: cy + (p.y - cy) * 0.9 + oy }));
}

function wrap(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function drawNode(p: Placed, r: () => number, out: VisualElement[]) {
  const { node, cx, cy, w, h } = p;
  const style: NodeStyle = node.style ?? "box";
  const shapeId = `n-${node.id}`;
  const color = style === "warning" ? WARN : style === "spark" ? ACCENT : INK;
  const before = out.length;

  if (style === "person") {
    const headR = Math.min(w, h) * 0.18;
    out.push({ id: shapeId, type: "stroke", points: ellipse(cx, cy - h * 0.22, headR, headR, r), closed: true, color });
    const body: Point[] = [
      { x: cx - w * 0.22, y: cy + h * 0.2 },
      { x: cx - w * 0.14, y: cy - h * 0.02 },
      { x: cx + w * 0.14, y: cy - h * 0.02 },
      { x: cx + w * 0.22, y: cy + h * 0.2 },
    ];
    out.push({ id: `${shapeId}-body`, type: "stroke", points: polyline(body, r, false), after: [shapeId], color });
  } else if (style === "cloud") {
    const pts: Point[] = [];
    const bumps = 7;
    for (let i = 0; i <= bumps * 6; i++) {
      const t = (i / (bumps * 6)) * Math.PI * 2;
      const rad = 1 + 0.12 * Math.sin(t * bumps);
      pts.push({ x: cx + Math.cos(t) * (w / 2) * rad, y: cy + Math.sin(t) * (h / 2) * rad });
    }
    out.push({ id: shapeId, type: "stroke", points: wobble(pts, 0.8, r), closed: true, color });
  } else if (style === "cylinder") {
    const ry = h * 0.14;
    out.push({ id: shapeId, type: "stroke", points: ellipse(cx, cy - h / 2 + ry, w / 2, ry, r), closed: true, color });
    out.push({
      id: `${shapeId}-side`,
      type: "stroke",
      points: [
        ...segment({ x: cx - w / 2, y: cy - h / 2 + ry }, { x: cx - w / 2, y: cy + h / 2 - ry }, r),
        ...ellipse(cx, cy + h / 2 - ry, w / 2, ry, r).slice(9, 28).reverse(),
        ...segment({ x: cx + w / 2, y: cy + h / 2 - ry }, { x: cx + w / 2, y: cy - h / 2 + ry }, r),
      ],
      after: [shapeId],
      color,
    });
  } else if (style === "pill") {
    out.push({ id: shapeId, type: "stroke", points: ellipse(cx, cy, w / 2, h / 2, r), closed: true, color });
  } else if (style === "warning") {
    const tri: Point[] = [
      { x: cx, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];
    out.push({ id: shapeId, type: "stroke", points: polyline(tri, r), closed: true, color, width: 2.4 });
    out.push({
      id: `${shapeId}-bang`,
      type: "text",
      x: cx,
      y: cy + h * 0.32,
      text: "!",
      size: h * 0.5,
      weight: 700,
      anchor: "middle",
      after: [shapeId],
      color,
    });
  } else if (style === "spark") {
    const pts: Point[] = [];
    for (let i = 0; i < 16; i++) {
      const t = (i / 16) * Math.PI * 2;
      const rad = i % 2 === 0 ? 1 : 0.62;
      pts.push({ x: cx + Math.cos(t) * (w / 2) * rad, y: cy + Math.sin(t) * (h / 2) * rad });
    }
    out.push({ id: shapeId, type: "stroke", points: wobble(pts, 1.5, r), closed: true, color, width: 2.2 });
  } else {
    const corners: Point[] = [
      { x: cx - w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy - h / 2 },
      { x: cx + w / 2, y: cy + h / 2 },
      { x: cx - w / 2, y: cy + h / 2 },
    ];
    out.push({ id: shapeId, type: "stroke", points: polyline(corners, r), closed: true, color });
  }

  const tint = TINT[style];
  const outline = style === "cylinder" ? out[before + 1] : out[before];
  if (tint && outline && outline.type === "stroke") {
    out.push({ id: `${shapeId}-tint`, type: "fill", points: tintPoints(outline.points, cx, cy, r), fill: tint, group: shapeId, after: [outline.id] });
  }
  if (style === "spark") {
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + r() * 0.8;
      const d = Math.max(w, h) * 0.62 + r() * 10;
      const sx = cx + Math.cos(a) * d;
      const sy = cy + Math.sin(a) * d * 0.8;
      const s = 5 + r() * 4;
      out.push({
        id: `${shapeId}-sparkle-${i}`,
        type: "stroke",
        points: [
          { x: sx, y: sy - s },
          { x: sx + s * 0.3, y: sy - s * 0.3 },
          { x: sx + s, y: sy },
          { x: sx + s * 0.3, y: sy + s * 0.3 },
          { x: sx, y: sy + s },
          { x: sx - s * 0.3, y: sy + s * 0.3 },
          { x: sx - s, y: sy },
          { x: sx - s * 0.3, y: sy - s * 0.3 },
        ],
        closed: true,
        width: 1.8,
        color: "#f59e0b",
        group: shapeId,
        after: [shapeId],
      });
    }
  }

  const labelBelow = style === "person" || style === "warning" || style === "spark";
  const maxChars = Math.max(8, Math.floor(w / 9));
  const lines = wrap(node.label, labelBelow ? 18 : maxChars);
  const size = labelBelow ? 17 : lines.length > 1 ? 16 : 18;
  const startY = labelBelow ? cy + h / 2 + 22 : cy - ((lines.length - 1) * size * 1.15) / 2 + size * 0.35;
  lines.forEach((line, i) => {
    out.push({
      id: `t-${node.id}-${i}`,
      type: "text",
      x: cx,
      y: startY + i * size * 1.15,
      text: line,
      size,
      weight: 600,
      anchor: "middle",
      group: shapeId,
      after: [shapeId],
      color: style === "warning" ? WARN : INK,
    });
  });
  if (node.note) {
    out.push({
      id: `note-${node.id}`,
      type: "text",
      x: cx,
      y: (labelBelow ? startY + lines.length * size * 1.15 : cy + h / 2 + 20) + 2,
      text: node.note,
      size: 13,
      anchor: "middle",
      after: [`t-${node.id}-0`],
      color: SOFT,
    });
  }
}

function edgePoint(p: Placed, toward: Point): Point {
  const dx = toward.x - p.cx;
  const dy = toward.y - p.cy;
  const style = p.node.style ?? "box";
  const labelBelow = style === "person" || style === "warning" || style === "spark";
  // connectors leaving downward must clear the label drawn under these shapes
  const below =
    labelBelow && dy > 0
      ? 22 + wrap(p.node.label, 18).length * 17 * 1.15 + (p.node.note ? 18 : 0)
      : 0;
  const sx = dx === 0 ? Infinity : (p.w / 2 + 6) / Math.abs(dx);
  const sy = dy === 0 ? Infinity : (p.h / 2 + 6 + below) / Math.abs(dy);
  const s = Math.min(sx, sy);
  return { x: p.cx + dx * s, y: p.cy + dy * s };
}

/** Convert a semantic VisualSpec into positioned drawable elements. */
export function layoutScene(spec: VisualSpec, seed: string): VisualElement[] {
  const r = rng(seed);
  const out: VisualElement[] = [];
  const nodes = spec.nodes.slice(0, 8);
  const placed = new Map<string, Placed>();
  const margin = 70;
  const captionSpace = spec.caption ? 70 : 30;
  const usableH = CANVAS_H - captionSpace - 40;

  const place = (node: VisualNode, cx: number, cy: number, w: number, h: number) => {
    const p = { node, cx, cy, w, h };
    placed.set(node.id, p);
  };

  switch (spec.layout) {
    case "flow": {
      const n = nodes.length;
      const gap = (CANVAS_W - margin * 2) / Math.max(n, 1);
      const w = Math.min(150, gap - 40);
      nodes.forEach((node, i) => {
        const cx = margin + gap * (i + 0.5);
        const cy = 40 + usableH / 2 + (n > 4 ? (i % 2 === 0 ? -55 : 55) : 0);
        place(node, cx, cy, w, node.style === "person" ? 110 : 76);
      });
      break;
    }
    case "hub":
    case "breakdown": {
      const [center, ...sats] = nodes;
      const cx = CANVAS_W / 2;
      const cy = 40 + usableH / 2;
      if (center) place(center, cx, cy, 190, 90);
      const radius = Math.min(usableH / 2 - 60, 290);
      sats.forEach((node, i) => {
        const t = (i / Math.max(sats.length, 1)) * Math.PI * 2 - Math.PI / 2;
        place(node, cx + Math.cos(t) * radius * 1.35, cy + Math.sin(t) * radius, 150, node.style === "warning" ? 60 : 64);
      });
      break;
    }
    case "timeline": {
      const y = 40 + usableH * 0.5;
      const x0 = margin;
      const x1 = CANVAS_W - margin;
      out.push({ id: "tl-axis", type: "arrow", from: { x: x0, y }, to: { x: x1, y }, color: INK });
      const n = nodes.length;
      nodes.forEach((node, i) => {
        const cx = x0 + ((x1 - x0) / Math.max(n, 1)) * (i + 0.5);
        const above = i % 2 === 0;
        const cy = above ? y - 105 : y + 105;
        place(node, cx, cy, Math.min(190, (x1 - x0) / n - 24), 84);
        out.push({
          id: `tick-${node.id}`,
          type: "stroke",
          points: segment({ x: cx, y }, { x: cx, y: above ? cy + 42 : cy - 42 }, r),
          after: ["tl-axis"],
          color: SOFT,
          dashed: true,
        });
        out.push({
          id: `dot-${node.id}`,
          type: "stroke",
          points: ellipse(cx, y, 6, 6, r),
          closed: true,
          after: ["tl-axis"],
          color: ACCENT,
          width: 3,
        });
      });
      break;
    }
    case "list":
    default: {
      const n = nodes.length;
      const rowH = Math.min(78, usableH / Math.max(n, 1));
      nodes.forEach((node, i) => {
        const cy = 40 + rowH * (i + 0.5) + (usableH - rowH * n) / 2;
        place(node, CANVAS_W / 2, cy, 520, rowH - 18);
        out.push({
          id: `num-${node.id}`,
          type: "text",
          x: CANVAS_W / 2 - 290,
          y: cy + 8,
          text: String(i + 1),
          size: 24,
          weight: 700,
          anchor: "middle",
          color: ACCENT,
        });
      });
    }
  }

  placed.forEach((p) => drawNode(p, r, out));

  spec.edges.forEach((edge, i) => {
    const a = placed.get(edge.from);
    const b = placed.get(edge.to);
    if (!a || !b) return;
    const from = edgePoint(a, { x: b.cx, y: b.cy });
    const to = edgePoint(b, { x: a.cx, y: a.cy });
    out.push({
      id: `e-${i}`,
      type: "arrow",
      from,
      to,
      bend: spec.layout === "flow" ? 0 : (r() - 0.5) * 30,
      broken: edge.broken,
      label: edge.label,
      after: [`n-${a.node.id}`, `n-${b.node.id}`],
      color: edge.broken ? WARN : INK,
    });
  });

  if (spec.caption) {
    out.push({
      id: "caption",
      type: "text",
      x: CANVAS_W / 2,
      y: CANVAS_H - 28,
      text: spec.caption,
      size: 17,
      anchor: "middle",
      color: SOFT,
      after: out.filter((e) => e.type !== "text").map((e) => e.id),
    });
  }
  return out;
}

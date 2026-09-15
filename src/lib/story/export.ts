"use client";

import { CANVAS_H, CANVAS_W } from "../animation/elements";

function inlineFonts(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(CANVAS_W));
  clone.setAttribute("height", String(CANVAS_H));
  // Replace class-based font with an explicit family so the rasteriser can resolve it.
  clone.querySelectorAll("text").forEach((t) => {
    t.removeAttribute("class");
    t.setAttribute("font-family", "Kalam, 'Segoe Print', 'Bradley Hand', cursive");
  });
  return new XMLSerializer().serializeToString(clone);
}

export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = inlineFonts(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
    if ("fonts" in document) await document.fonts.load("18px Kalam").catch(() => undefined);
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not rasterise scene"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W * scale;
    canvas.height = CANVAS_H * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.fillStyle = "#fbfbf9";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("PNG encoding failed"))), "image/png"),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function download(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

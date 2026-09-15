"use client";

import { CANVAS_H, CANVAS_W } from "../animation/elements";

const EXPORT_FAMILY = "ConvergeHand";
let fontCssPromise: Promise<string> | null = null;

async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/** Collect the self-hosted handwritten @font-face rules (from next/font) as inline data URLs. */
function handFontCss(): Promise<string> {
  if (fontCssPromise) return fontCssPromise;
  fontCssPromise = (async () => {
    const families = new Set(
      getComputedStyle(document.documentElement)
        .getPropertyValue("--font-hand")
        .split(",")
        .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
        .filter((f) => f && !/fallback/i.test(f)),
    );
    const rules: CSSFontFaceRule[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let list: CSSRuleList;
      try {
        list = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(list)) {
        if (rule instanceof CSSFontFaceRule && families.has(rule.style.getPropertyValue("font-family").trim().replace(/['"]/g, ""))) {
          rules.push(rule);
        }
      }
    }
    const parts = await Promise.all(
      rules.map(async (rule) => {
        const src = rule.style.getPropertyValue("src");
        const m = /url\((['"]?)([^'")]+)\1\)/.exec(src);
        if (!m) return "";
        const data = await toDataUrl(m[2]);
        const weight = rule.style.getPropertyValue("font-weight") || "400";
        return `@font-face{font-family:'${EXPORT_FAMILY}';font-weight:${weight};src:url(${data});}`;
      }),
    );
    return parts.join("");
  })().catch(() => "");
  return fontCssPromise;
}

async function inlineFonts(svg: SVGSVGElement): Promise<string> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(CANVAS_W));
  clone.setAttribute("height", String(CANVAS_H));
  const css = await handFontCss();
  if (css) {
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = css;
    clone.insertBefore(style, clone.firstChild);
  }
  clone.querySelectorAll("text").forEach((t) => {
    t.removeAttribute("class");
    t.setAttribute("font-family", `'${EXPORT_FAMILY}', Kalam, 'Segoe Print', 'Bradley Hand', cursive`);
  });
  return new XMLSerializer().serializeToString(clone);
}

export async function svgToPngBlob(svg: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = await inlineFonts(svg);
  const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
  try {
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

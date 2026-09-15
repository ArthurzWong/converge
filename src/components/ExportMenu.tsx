"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import type { Story } from "@/lib/types";
import { encodeShare } from "@/lib/story/storage";
import { download, slug, svgToPngBlob } from "@/lib/story/export";
import SceneCanvas from "./SceneCanvas";

interface Props {
  story: Story;
  sceneIndex: number;
}

/** Render a scene fully-drawn off-screen and rasterise it. */
async function renderScenePng(story: Story, index: number): Promise<Blob> {
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.left = "-10000px";
  host.style.width = "960px";
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    root.render(<SceneCanvas scene={story.scenes[index]} />);
    await new Promise((r) => setTimeout(r, 50));
    const svg = host.querySelector("svg");
    if (!svg) throw new Error("Scene did not render");
    return await svgToPngBlob(svg);
  } finally {
    root.unmount();
    host.remove();
  }
}

export default function ExportMenu({ story, sceneIndex }: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 2200);
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/share#${encodeShare(story)}`;
    try {
      await navigator.clipboard.writeText(url);
      flash("Share link copied");
    } catch {
      window.prompt("Copy this share link", url);
    }
    setOpen(false);
  };

  const pngScene = async () => {
    setOpen(false);
    try {
      flash("Rendering…");
      const blob = await renderScenePng(story, sceneIndex);
      download(blob, `${slug(story.analysis.title)}-scene-${sceneIndex + 1}.png`);
      flash("Scene downloaded");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Export failed");
    }
  };

  const pngAll = async () => {
    setOpen(false);
    try {
      for (let i = 0; i < story.scenes.length; i++) {
        flash(`Rendering scene ${i + 1} of ${story.scenes.length}…`);
        const blob = await renderScenePng(story, i);
        download(blob, `${slug(story.analysis.title)}-scene-${i + 1}.png`);
        await new Promise((r) => setTimeout(r, 250));
      }
      flash("Storyboard downloaded");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Export failed");
    }
  };

  const pdf = () => {
    setOpen(false);
    window.print();
  };

  const json = () => {
    setOpen(false);
    download(new Blob([JSON.stringify(story, null, 2)], { type: "application/json" }), `${slug(story.analysis.title)}.converge.json`);
  };

  return (
    <div className="relative" ref={ref}>
      <button className="btn-primary !py-2" onClick={() => setOpen((o) => !o)}>
        {status ?? "Share & export"}
      </button>
      {open && (
        <div className="card absolute right-0 top-full z-30 mt-2 w-60 overflow-hidden p-1 text-sm fade-up">
          <MenuItem onClick={copyLink} title="Copy share link" hint="Read-only link, no account needed" />
          <MenuItem onClick={pngScene} title="Download this scene (PNG)" hint="Fully drawn, 1920×1080" />
          <MenuItem onClick={pngAll} title="Download all scenes (PNG)" hint="One image per scene" />
          <MenuItem onClick={pdf} title="Save as PDF" hint="Storyboard, logic and actions" />
          <MenuItem onClick={json} title="Export story data (JSON)" hint="Re-import or reuse later" />
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, title, hint }: { onClick: () => void; title: string; hint: string }) {
  return (
    <button onClick={onClick} className="block w-full rounded-xl px-3 py-2 text-left transition hover:bg-ink/5">
      <span className="block font-medium">{title}</span>
      <span className="block text-xs text-ink/50">{hint}</span>
    </button>
  );
}

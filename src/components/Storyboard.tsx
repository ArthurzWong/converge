"use client";

import { useState } from "react";
import type { Scene, Story } from "@/lib/types";
import { uid } from "@/lib/id";
import SceneCanvas from "./SceneCanvas";

interface Props {
  story: Story;
  activeIndex: number;
  onSelect: (i: number) => void;
  /** Omit to render read-only. */
  onChange?: (scenes: Scene[]) => void;
}

export default function Storyboard({ story, activeIndex, onSelect, onChange }: Props) {
  const scenes = story.scenes;
  const [editing, setEditing] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const editable = Boolean(onChange);

  const replace = (id: string, patch: Partial<Scene>) => onChange?.(scenes.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= scenes.length || from === to) return;
    const next = [...scenes];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    onChange?.(next);
    onSelect(to);
  };

  const remove = (i: number) => {
    if (scenes.length <= 1) return;
    onChange?.(scenes.filter((_, j) => j !== i));
    onSelect(Math.max(0, Math.min(i, scenes.length - 2)));
  };

  const add = () => {
    const scene: Scene = {
      id: uid("scene"),
      number: scenes.length + 1,
      title: "New scene",
      purpose: "Add a step to the story.",
      narration: "Describe what this scene should explain.",
      visualConcept: "A simple list of key points.",
      visual: {
        layout: "list",
        nodes: [
          { id: "n1", label: "First point", style: "box" },
          { id: "n2", label: "Second point", style: "box" },
          { id: "n3", label: "Third point", style: "box" },
        ],
        edges: [],
      },
      durationSec: 7,
    };
    onChange?.([...scenes, scene]);
    onSelect(scenes.length);
    setEditing(scene.id);
  };

  const regenerate = async (scene: Scene) => {
    setError(null);
    setRegenerating(scene.id);
    try {
      const res = await fetch("/api/scene", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ analysis: story.analysis, mode: story.mode, scene }),
      });
      if (!res.ok) throw new Error("Could not regenerate this scene");
      const next = (await res.json()) as Scene;
      replace(scene.id, { ...next, id: scene.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not regenerate this scene");
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Storyboard</h2>
        {editable && (
          <button className="text-xs font-medium text-accent hover:underline" onClick={add}>
            + Add scene
          </button>
        )}
      </div>
      {error && <p className="mb-3 text-xs text-warn">{error}</p>}
      <ol className="space-y-3">
        {scenes.map((scene, i) => {
          const active = i === activeIndex;
          const isEditing = editing === scene.id;
          return (
            <li
              key={scene.id}
              draggable={editable && !isEditing}
              onDragStart={() => setDragId(scene.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (!dragId) return;
                const from = scenes.findIndex((s) => s.id === dragId);
                move(from, i);
                setDragId(null);
              }}
              className={`card overflow-hidden transition ${active ? "ring-2 ring-accent/60" : "hover:border-ink/25"} ${
                dragId === scene.id ? "opacity-50" : ""
              }`}
            >
              <button className="flex w-full items-stretch text-left" onClick={() => onSelect(i)}>
                <div className="w-28 shrink-0 border-r border-ink/5 bg-[#fbfbf9]">
                  <SceneCanvas scene={scene} className="h-full w-full" />
                </div>
                <div className="min-w-0 flex-1 p-3">
                  <p className="text-[11px] font-medium text-ink/45">Scene {i + 1}</p>
                  <p className="truncate text-sm font-semibold">{scene.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink/60">{scene.narration}</p>
                </div>
              </button>

              {editable && (
                <div className="flex items-center gap-1 border-t border-ink/5 px-2 py-1.5">
                  <button className="btn-icon" title="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}>
                    ↑
                  </button>
                  <button className="btn-icon" title="Move down" onClick={() => move(i, i + 1)} disabled={i === scenes.length - 1}>
                    ↓
                  </button>
                  <button className="btn-icon" title="Edit" onClick={() => setEditing(isEditing ? null : scene.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 17.25V21h3.75L17.8 9.94l-3.75-3.75L3 17.25zM20.7 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                  </button>
                  <button className="btn-icon" title="Regenerate" onClick={() => regenerate(scene)} disabled={regenerating === scene.id}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={regenerating === scene.id ? "animate-spin" : ""}>
                      <path d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                    </svg>
                  </button>
                  <span className="flex-1" />
                  <button className="btn-icon hover:!text-warn" title="Delete" onClick={() => remove(i)} disabled={scenes.length <= 1}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              )}

              {isEditing && editable && (
                <div className="space-y-2 border-t border-ink/5 bg-ink/[0.02] p-3">
                  <label className="block text-[11px] font-medium text-ink/50">
                    Title
                    <input className="field mt-1" value={scene.title} onChange={(e) => replace(scene.id, { title: e.target.value })} />
                  </label>
                  <label className="block text-[11px] font-medium text-ink/50">
                    Narration
                    <textarea
                      className="field mt-1"
                      rows={4}
                      value={scene.narration}
                      onChange={(e) => replace(scene.id, { narration: e.target.value })}
                    />
                  </label>
                  <label className="block text-[11px] font-medium text-ink/50">
                    Duration: {scene.durationSec}s
                    <input
                      type="range"
                      min={4}
                      max={16}
                      value={scene.durationSec}
                      onChange={(e) => replace(scene.id, { durationSec: Number(e.target.value) })}
                      className="mt-1 w-full accent-accent"
                    />
                  </label>
                  <div className="text-right">
                    <button className="text-xs font-medium text-accent hover:underline" onClick={() => setEditing(null)}>
                      Done
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import type { Scene, Story } from "@/lib/types";
import { MODE_LABELS } from "@/lib/types";
import SiteHeader from "./SiteHeader";
import StoryPlayer from "./StoryPlayer";
import Storyboard from "./Storyboard";
import LogicView from "./LogicView";
import ActionView from "./ActionView";
import ExportMenu from "./ExportMenu";
import PrintLayout from "./PrintLayout";

type Tab = "story" | "logic" | "action";

interface Props {
  story: Story;
  onChange?: (story: Story) => void;
  readOnly?: boolean;
  onDuplicate?: () => void;
}

export default function StoryWorkspace({ story, onChange, readOnly = false, onDuplicate }: Props) {
  const [tab, setTab] = useState<Tab>("story");
  const [sceneIndex, setSceneIndex] = useState(0);

  const updateScenes = (scenes: Scene[]) => {
    onChange?.({ ...story, scenes: scenes.map((s, i) => ({ ...s, number: i + 1 })) });
  };

  return (
    <>
      <SiteHeader
        right={
          <div className="flex items-center gap-2">
            {readOnly ? (
              <button className="btn-ghost !py-2" onClick={onDuplicate}>
                Edit a copy
              </button>
            ) : (
              <Link href="/new" className="btn-ghost !py-2">
                New story
              </Link>
            )}
            <ExportMenu story={story} sceneIndex={sceneIndex} />
          </div>
        }
      />

      <main className="mx-auto max-w-6xl px-5 pb-24 pt-8">
        <div className="no-print flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-ink/50">
              <span className="rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">{MODE_LABELS[story.mode].label}</span>
              <span>{story.scenes.length} scenes</span>
              <span>·</span>
              <span title="Reasoning engine">{story.provider}</span>
              {readOnly && <span className="rounded-full bg-ink/5 px-2 py-0.5">Shared · read only</span>}
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{story.analysis.title}</h1>
            <p className="mt-1 max-w-2xl text-ink/65">{story.analysis.problem}</p>
          </div>

          <div className="flex rounded-full border border-ink/15 bg-white p-1 text-sm">
            {(["story", "logic", "action"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 capitalize transition ${tab === t ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="no-print mt-8">
          {tab === "story" && (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <StoryPlayer key={story.scenes.map((s) => s.id).join("|")} scenes={story.scenes} initialIndex={sceneIndex} onIndexChange={setSceneIndex} />
              </div>
              <aside>
                <Storyboard
                  story={story}
                  activeIndex={sceneIndex}
                  onSelect={setSceneIndex}
                  onChange={readOnly ? undefined : updateScenes}
                />
              </aside>
            </div>
          )}
          {tab === "logic" && <LogicView story={story} />}
          {tab === "action" && <ActionView story={story} />}
        </div>

        <PrintLayout story={story} />
      </main>
    </>
  );
}

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

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "story", label: "Story", icon: <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" /> },
  {
    id: "logic",
    label: "Logic",
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="12" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8.5 6.8 15.6 11M8.5 17.2 15.6 13" />
      </>
    ),
  },
  { id: "action", label: "Action", icon: <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" /> },
];

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
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
              <span className="rounded-full bg-accent-soft px-2.5 py-0.5 font-medium text-accent">{MODE_LABELS[story.mode].label}</span>
              <span className="rounded-full border border-ink/10 bg-white px-2.5 py-0.5">{story.scenes.length} scenes</span>
              <span className="rounded-full border border-ink/10 bg-white px-2.5 py-0.5" title="Reasoning engine">
                {story.provider}
              </span>
              {readOnly && <span className="rounded-full bg-ink/5 px-2.5 py-0.5">Shared · read only</span>}
            </div>
            <h1 className="font-display mt-3 text-3xl font-semibold md:text-[2.6rem] md:leading-[1.1]">{story.analysis.title}</h1>
            <p className="mt-2 max-w-2xl text-ink/65">{story.analysis.problem}</p>
          </div>

          <div className="segmented" role="tablist" aria-label="Views">
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                  {t.icon}
                </svg>
                {t.label}
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

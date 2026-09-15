"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { Story } from "@/lib/types";
import { loadStory, saveStory } from "@/lib/story/storage";
import StoryWorkspace from "@/components/StoryWorkspace";
import SiteHeader from "@/components/SiteHeader";

export default function StoryPage() {
  const params = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null | undefined>(undefined);

  useEffect(() => {
    setStory(loadStory(params.id));
  }, [params.id]);

  if (story === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-20 text-center text-sm text-ink/50">Opening story…</main>
      </>
    );
  }
  if (story === null) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-2xl font-semibold">Story not found</h1>
          <p className="mt-2 text-ink/60">Stories are saved in this browser. If this link was shared with you, ask for the share link instead.</p>
          <Link href="/new" className="btn-primary mt-6">
            Create a new story
          </Link>
        </main>
      </>
    );
  }
  return (
    <StoryWorkspace
      story={story}
      onChange={(next) => {
        saveStory(next);
        setStory(next);
      }}
    />
  );
}

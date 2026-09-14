"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Story } from "@/lib/types";
import { decodeShare, saveStory } from "@/lib/story/storage";
import StoryWorkspace from "@/components/StoryWorkspace";
import SiteHeader from "@/components/SiteHeader";
import { uid } from "@/lib/id";

export default function SharePage() {
  const [story, setStory] = useState<Story | null | undefined>(undefined);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    setStory(hash ? decodeShare(hash) : null);
  }, []);

  if (story === undefined) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-5 py-20 text-center text-sm text-ink/50">Opening shared story…</main>
      </>
    );
  }
  if (story === null) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="text-2xl font-semibold">This share link is incomplete</h1>
          <p className="mt-2 text-ink/60">Make sure the whole link was copied, including the part after the #.</p>
          <Link href="/" className="btn-primary mt-6">
            Back to CONVERGE
          </Link>
        </main>
      </>
    );
  }
  return (
    <StoryWorkspace
      story={story}
      readOnly
      onDuplicate={() => {
        const copy: Story = { ...story, id: uid("story"), createdAt: new Date().toISOString() };
        saveStory(copy);
        window.location.href = `/story/${copy.id}`;
      }}
    />
  );
}

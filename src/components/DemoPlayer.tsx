"use client";

import Link from "next/link";
import type { Story } from "@/lib/types";
import StoryPlayer from "./StoryPlayer";

export default function DemoPlayer({ story }: { story: Story }) {
  return (
    <div>
      <StoryPlayer scenes={story.scenes} autoplay loop compact />
      <div className="mt-3 flex items-center justify-between text-xs text-ink/50">
        <span>
          Demo · <span className="font-medium text-ink/70">{story.analysis.title}</span>
        </span>
        <Link href={`/story/${story.id}`} className="font-medium text-accent hover:underline">
          Open in workspace →
        </Link>
      </div>
    </div>
  );
}

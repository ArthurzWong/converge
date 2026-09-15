"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MODES, MODE_LABELS, type Mode, type Story } from "@/lib/types";
import { saveStory } from "@/lib/story/storage";

const EXAMPLE =
  "Our company has 30 employees. Sales enquiries come mainly through WhatsApp. Salespeople manually prepare quotations and follow up with customers. We are losing opportunities because follow-ups are inconsistent.";

const STAGES = ["Understanding the situation", "Finding structure", "Writing the story", "Sketching scenes", "Preparing actions"];

export default function NewStoryForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("general");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busy) return;
    setStage(0);
    const t = window.setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 1400);
    return () => window.clearInterval(t);
  }, [busy]);

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/converge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = (await res.json()) as Story | { error: string };
      if (!res.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Something went wrong");
      }
      saveStory(data);
      router.push(`/story/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  const tooShort = text.trim().length < 20;

  return (
    <div className="fade-up">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">What’s on your mind?</h1>
      <p className="mt-2 text-ink/60">Paste an idea, a problem, meeting notes or a document. Messy is fine.</p>

      <div className="card mt-8 p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your idea, problem, opportunity or topic..."
          rows={9}
          disabled={busy}
          className="w-full resize-y rounded-xl bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-ink/35"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 px-3 py-2 text-xs text-ink/50">
          <button type="button" className="hover:text-accent" onClick={() => setText(EXAMPLE)} disabled={busy}>
            Use an example
          </button>
          <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
        </div>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Lens</p>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              disabled={busy}
              title={MODE_LABELS[m].hint}
              className={`rounded-full border px-4 py-1.5 text-sm transition ${
                mode === m ? "border-ink bg-ink text-white" : "border-ink/15 bg-white text-ink/70 hover:border-ink/40"
              }`}
            >
              {MODE_LABELS[m].label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-ink/50">{MODE_LABELS[mode].hint}</p>
      </div>

      {error && <p className="mt-6 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">{error}</p>}

      <div className="mt-8 flex items-center gap-4">
        <button type="button" className="btn-primary !px-8 !py-3 !text-base" onClick={submit} disabled={busy || tooShort}>
          {busy ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Converging…
            </>
          ) : (
            "Converge"
          )}
        </button>
        {busy && <span className="text-sm text-ink/60">{STAGES[stage]}</span>}
        {!busy && tooShort && text.length > 0 && <span className="text-sm text-ink/50">A sentence or two more helps.</span>}
      </div>
    </div>
  );
}

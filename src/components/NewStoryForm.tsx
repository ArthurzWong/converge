"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MODES, MODE_LABELS, type Mode, type Story } from "@/lib/types";
import { saveStory } from "@/lib/story/storage";

const EXAMPLE =
  "Our company has 30 employees. Sales enquiries come mainly through WhatsApp. Salespeople manually prepare quotations and follow up with customers. We are losing opportunities because follow-ups are inconsistent.";

const STAGES = ["Understanding the situation", "Finding structure", "Writing the story", "Sketching scenes", "Preparing actions"];

function isMode(v: string | null): v is Mode {
  return v !== null && (MODES as readonly string[]).includes(v);
}

export default function NewStoryForm() {
  const router = useRouter();
  const params = useSearchParams();
  const initialMode = params.get("mode");
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>(isMode(initialMode) ? initialMode : "general");
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

  const words = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="fade-up">
      <div className="text-center">
        <span className="eyebrow">Step 1 of 2 · Describe</span>
        <h1 className="font-display mt-5 text-4xl font-semibold md:text-6xl">What’s on your <span className="display-italic scribble text-accent">mind?</span></h1>
        <p className="mx-auto mt-3 max-w-lg text-ink/60">Paste an idea, a problem, meeting notes or a document. Messy is fine.</p>
      </div>

      <div className="card mt-10 p-2 transition focus-within:border-accent/50 focus-within:shadow-[0_0_0_4px_rgba(15,118,110,0.12)]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe your idea, problem, opportunity or topic..."
          rows={9}
          disabled={busy}
          autoFocus
          className="w-full resize-y rounded-xl bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-ink/35"
        />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/5 px-3 py-2 text-xs text-ink/50">
          <button type="button" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition hover:bg-accent-soft hover:text-accent" onClick={() => setText(EXAMPLE)} disabled={busy}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" strokeLinecap="round" />
            </svg>
            Use an example
          </button>
          <span className={tooShort && text.length > 0 ? "text-warn" : ""}>
            {words} {words === 1 ? "word" : "words"}
            {tooShort && text.length > 0 && " · a sentence or two more helps"}
          </span>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Choose a lens</p>
          <p className="text-xs text-ink/45">Shapes the analysis, scenes and actions</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Lens">
          {MODES.map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setMode(m)}
                disabled={busy}
                className={`rounded-xl border p-3.5 text-left transition duration-150 ${
                  active
                    ? "border-ink bg-ink text-white shadow-md -rotate-1 scale-[1.02]"
                    : "border-ink/10 bg-white text-ink hover:-translate-y-px hover:border-ink/30 hover:shadow-sm"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{MODE_LABELS[m].label}</span>
                  <span className={`h-2 w-2 rounded-full ${active ? "bg-accent" : "bg-ink/10"}`} />
                </div>
                <p className={`mt-1 text-xs leading-relaxed ${active ? "text-white/70" : "text-ink/55"}`}>{MODE_LABELS[m].hint}</p>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="mt-6 rounded-xl border border-warn/30 bg-warn/5 px-4 py-3 text-sm text-warn">{error}</p>}

      <div className="mt-10 flex flex-col items-center gap-4">
        <button type="button" className="btn-primary !px-10 !py-3.5 !text-base" onClick={submit} disabled={busy || tooShort}>
          {busy ? (
            <>
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              Converging…
            </>
          ) : (
            <>
              Converge
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </>
          )}
        </button>
        {busy ? (
          <ol className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs" aria-live="polite">
            {STAGES.map((s, i) => (
              <li key={s} className={`flex items-center gap-1.5 transition ${i < stage ? "text-accent" : i === stage ? "text-ink" : "text-ink/35"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${i < stage ? "bg-accent" : i === stage ? "animate-pulse bg-ink" : "bg-ink/20"}`} />
                {s}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-ink/45">Takes a few seconds · Your text stays in your browser unless an AI key is configured</p>
        )}
      </div>
    </div>
  );
}

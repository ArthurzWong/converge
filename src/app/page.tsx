import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import DemoPlayer from "@/components/DemoPlayer";
import { DEMO_STORY } from "@/lib/story/demo";
import { MODES, MODE_LABELS } from "@/lib/types";

const STEPS = [
  ["Input", "Paste a problem, idea, meeting notes or a document. Messy is fine."],
  ["Understand", "CONVERGE finds the concepts, relationships, causes and assumptions."],
  ["Structure", "The mess becomes a chain: problem → cause → consequence → opportunity."],
  ["Story", "The structure is told as a short, 4–6 scene visual narrative."],
  ["Visualize", "Each scene is drawn by hand as the narration unfolds."],
  ["Action", "You leave with 3–5 concrete, prioritised next steps."],
];

const OUTPUTS = [
  {
    title: "Story",
    body: "A hand-drawn storyboard you can play, edit, reorder and regenerate scene by scene.",
    icon: (
      <path d="M4 6h16M4 12h10M4 18h7" strokeLinecap="round" />
    ),
  },
  {
    title: "Logic",
    body: "The reasoning laid bare — entities, relationships and the chain from problem to action.",
    icon: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="12" r="2.5" />
        <circle cx="6" cy="18" r="2.5" />
        <path d="M8.5 6.8 15.6 11M8.5 17.2 15.6 13" />
      </>
    ),
  },
  {
    title: "Action",
    body: "A prioritised plan: what to do, why, and the outcome to expect.",
    icon: (
      <>
        <path d="M5 12.5 9.5 17 19 7" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero-glow">
          <div className="mx-auto max-w-6xl px-5 pb-16 pt-16 md:pt-24">
            <div className="mx-auto max-w-3xl text-center fade-up">
              <span className="eyebrow">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                AI reasoning · Visual storytelling · Action
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] tracking-tight md:text-7xl">
                Turn complexity
                <br />
                into <span className="text-accent">clarity.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg text-ink/65 md:text-xl">
                Give CONVERGE a messy idea, problem or document. It thinks it through, draws it as a short visual story, and hands
                you an action plan.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/new" className="btn-primary !px-6 !py-3 !text-base">
                  Create your first visual story
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M3 8h10M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link href={`/story/${DEMO_STORY.id}`} className="btn-ghost !px-6 !py-3 !text-base">
                  Explore the demo
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink/50">No sign-up · Runs in your browser · Works without an API key</p>
            </div>

            <div className="mx-auto mt-14 max-w-4xl fade-up" style={{ animationDelay: "120ms" }}>
              <div className="window">
                <div className="window-bar">
                  <i />
                  <i />
                  <i />
                  <span className="ml-3 truncate text-[11px] text-ink/45">converge · {DEMO_STORY.analysis.title}</span>
                </div>
                <div className="p-3 md:p-5">
                  <DemoPlayer story={DEMO_STORY} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">What you get</p>
            <h2 className="section-title mt-3">Three views of one problem</h2>
            <p className="mt-4 text-ink/65">The animation is the communication layer. Underneath is structured reasoning you can inspect and act on.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {OUTPUTS.map((o) => (
              <div key={o.title} className="card card-hover p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    {o.icon}
                  </svg>
                </div>
                <h3 className="mt-5 text-lg font-semibold">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{o.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-ink/10 bg-white/60">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:items-start">
              <div>
                <p className="section-kicker">How it thinks</p>
                <h2 className="section-title mt-3">From ambiguity to a plan, in six steps</h2>
                <p className="mt-4 text-ink/65">
                  Every story is built the same way, so the output is consistent whether you paste two sentences or two pages.
                </p>
                <Link href="/new" className="btn-accent mt-8">
                  Try it with your own problem
                </Link>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {STEPS.map(([title, body], i) => (
                  <li key={title} className="card card-hover flex gap-4 p-5">
                    <span className="font-hand text-2xl leading-none text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-ink/65">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Lenses</p>
            <h2 className="section-title mt-3">One engine, six ways of looking</h2>
            <p className="mt-4 text-ink/65">Pick a lens and the analysis, scenes and actions are shaped for that purpose.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <Link key={m} href={`/new?mode=${m}`} className="card card-hover group flex items-start justify-between gap-4 p-5">
                <div>
                  <h3 className="font-semibold">{MODE_LABELS[m].label}</h3>
                  <p className="mt-1 text-sm text-ink/65">{MODE_LABELS[m].hint}</p>
                </div>
                <span className="mt-0.5 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-accent">→</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-16 text-center text-white md:px-16">
            <div className="paper-grid absolute inset-0 opacity-[0.12]" />
            <div className="relative">
              <blockquote className="mx-auto max-w-2xl font-hand text-3xl leading-snug text-white/90 md:text-4xl">
                “Don’t just answer the question. Help people see the problem.”
              </blockquote>
              <div className="mt-8">
                <Link href="/new" className="btn !bg-white !px-6 !py-3 !text-base !text-ink hover:!bg-paper">
                  Start converging
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-ink/50">
          <span>CONVERGE V1 · Ambiguity → Visual story → Action</span>
          <div className="flex gap-5">
            <Link href="/new" className="hover:text-ink">
              New story
            </Link>
            <Link href={`/story/${DEMO_STORY.id}`} className="hover:text-ink">
              Demo
            </Link>
            <a href="https://github.com/ArthurzWong/converge" className="hover:text-ink" target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

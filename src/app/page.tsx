import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import DemoPlayer from "@/components/DemoPlayer";
import { DEMO_STORY } from "@/lib/story/demo";

const STEPS = [
  ["Input", "Paste a problem, idea, meeting notes or a document."],
  ["Understand", "CONVERGE finds the concepts, relationships and assumptions."],
  ["Structure", "The mess becomes a logical chain: problem → cause → opportunity."],
  ["Story", "The structure is told as a short visual narrative."],
  ["Visualize", "Each scene is drawn by hand as the narration unfolds."],
  ["Action", "You leave with 3–5 concrete, prioritised next steps."],
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid items-center gap-12 py-16 md:grid-cols-2 md:py-24">
          <div className="fade-up">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Visual thinking, assisted</p>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Turn complexity
              <br />
              into clarity.
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink/70">
              Give CONVERGE a messy idea, problem or document. It thinks it through, draws it as a short visual story, and hands
              you an action plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/new" className="btn-primary !px-6 !py-3 !text-base">
                Create your first visual story
              </Link>
              <Link href={`/story/${DEMO_STORY.id}`} className="btn-ghost !px-6 !py-3 !text-base">
                Explore the demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink/50">No sign-up. Works in your browser.</p>
          </div>
          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <DemoPlayer story={DEMO_STORY} />
          </div>
        </section>

        <section className="border-t border-ink/10 py-16">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-ink/50">How it thinks</h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="card relative p-5">
                <span className="font-hand text-2xl text-accent">{i + 1}</span>
                <h3 className="mt-1 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-ink/65">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-ink/10 py-16 text-center">
          <blockquote className="mx-auto max-w-2xl font-hand text-3xl leading-snug text-ink/80">
            “Don’t just answer the question. Help people see the problem.”
          </blockquote>
          <div className="mt-8">
            <Link href="/new" className="btn-primary !px-6 !py-3 !text-base">
              Start converging
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-ink/10 py-8 text-center text-xs text-ink/45">
        CONVERGE V1 · Ambiguity → Visual story → Action
      </footer>
    </>
  );
}

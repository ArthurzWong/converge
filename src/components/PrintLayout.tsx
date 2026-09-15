import type { Story } from "@/lib/types";
import SceneCanvas from "./SceneCanvas";

/** Only visible when printing (Save as PDF). */
export default function PrintLayout({ story }: { story: Story }) {
  return (
    <div className="hidden print:block">
      <header className="mb-8 border-b border-ink/20 pb-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-ink/50">CONVERGE · VISUAL STORY</p>
        <h1 className="mt-2 text-3xl font-semibold">{story.analysis.title}</h1>
        <p className="mt-1 text-ink/70">{story.analysis.problem}</p>
      </header>

      {story.scenes.map((scene, i) => (
        <section key={scene.id} className="print-page mb-8">
          <h2 className="text-lg font-semibold">
            Scene {i + 1} · {scene.title}
          </h2>
          <div className="mt-2 overflow-hidden rounded-xl border border-ink/15">
            <SceneCanvas scene={scene} className="block w-full" />
          </div>
          <p className="mt-2 text-sm text-ink/80">{scene.narration}</p>
        </section>
      ))}

      <section className="print-page mb-8">
        <h2 className="text-lg font-semibold">Reasoning</h2>
        <ol className="mt-2 space-y-2 text-sm">
          {story.logic.map((s, i) => (
            <li key={i}>
              <span className="font-semibold capitalize">{s.stage}:</span> {s.title}
              <ul className="ml-4 list-disc text-ink/75">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="print-page">
        <h2 className="text-lg font-semibold">What should happen next?</h2>
        <ol className="mt-2 space-y-2 text-sm">
          {story.analysis.actions.map((a, i) => (
            <li key={a.id}>
              <span className="font-semibold">
                {i + 1}. {a.action}
              </span>{" "}
              <span className="text-ink/50">({a.priority})</span>
              <div className="text-ink/75">Why: {a.reason}</div>
              <div className="text-ink/75">Outcome: {a.outcome}</div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

import type { Priority, Story } from "@/lib/types";

const PRIORITY: Record<Priority, { label: string; cls: string }> = {
  high: { label: "High priority", cls: "bg-coral-soft text-coral" },
  medium: { label: "Medium", cls: "bg-accent-soft text-accent" },
  low: { label: "Later", cls: "bg-ink/5 text-ink/60" },
};

const ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function ActionView({ story }: { story: Story }) {
  const actions = [...story.analysis.actions].sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);
  return (
    <div className="mx-auto max-w-3xl">
      <h2 className="font-display text-3xl font-semibold md:text-4xl">What should happen <span className="display-italic text-accent">next?</span></h2>
      <p className="mt-1 text-ink/60">{actions.length} practical steps, ordered by priority.</p>
      <ol className="mt-8 space-y-4">
        {actions.map((a, i) => {
          const p = PRIORITY[a.priority] ?? PRIORITY.medium;
          return (
            <li key={a.id} className="card flex gap-5 p-5 fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-hand text-xl font-bold text-white ${["bg-coral","bg-accent","bg-violet","bg-sun","bg-ink"][i % 5]}`} style={{ transform: `rotate(${(i % 2 ? 4 : -4)}deg)` }}>{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{a.action}</h3>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${p.cls}`}>{p.label}</span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Why</dt>
                    <dd className="mt-0.5 text-ink/75">{a.reason}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink/45">Expected outcome</dt>
                    <dd className="mt-0.5 text-ink/75">{a.outcome}</dd>
                  </div>
                </dl>
              </div>
            </li>
          );
        })}
      </ol>
      {story.analysis.opportunities.length > 0 && (
        <section className="mt-10 rounded-2xl border border-dashed border-accent/40 bg-accent-soft/40 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Opportunities to keep in view</h3>
          <ul className="mt-2 space-y-1 text-sm text-ink/75">
            {story.analysis.opportunities.map((o) => (
              <li key={o}>• {o}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

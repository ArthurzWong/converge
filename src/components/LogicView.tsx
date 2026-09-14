import type { Story } from "@/lib/types";

const STAGE_META: Record<string, { label: string; tone: string }> = {
  problem: { label: "Problem", tone: "text-warn bg-warn/10" },
  cause: { label: "Cause", tone: "text-ink/70 bg-ink/5" },
  consequence: { label: "Consequence", tone: "text-ink/70 bg-ink/5" },
  opportunity: { label: "Opportunity", tone: "text-accent bg-accent-soft" },
  solution: { label: "Solution", tone: "text-accent bg-accent-soft" },
  action: { label: "Action", tone: "text-white bg-ink" },
};

export default function LogicView({ story }: { story: Story }) {
  const { analysis, logic } = story;
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
      <ol className="relative">
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-ink/15" aria-hidden />
        {logic.map((step, i) => {
          const meta = STAGE_META[step.stage] ?? STAGE_META.cause;
          return (
            <li key={`${step.stage}-${i}`} className="relative flex gap-5 pb-8 fade-up" style={{ animationDelay: `${i * 70}ms` }}>
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white font-hand text-lg text-ink/70">
                {i + 1}
              </div>
              <div className="card flex-1 p-5">
                <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${meta.tone}`}>
                  {meta.label}
                </span>
                <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
                <ul className="mt-2 space-y-1.5">
                  {step.points.map((p) => (
                    <li key={p} className="flex gap-2 text-sm text-ink/75">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-ink/30" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          );
        })}
      </ol>

      <aside className="space-y-6">
        <section className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Key entities</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {analysis.entities.map((e) => (
              <span key={e.id} className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs">
                {e.label} <span className="text-ink/40">· {e.kind}</span>
              </span>
            ))}
          </div>
        </section>
        {analysis.relationships.length > 0 && (
          <section className="card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Relationships</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {analysis.relationships.slice(0, 10).map((r, i) => {
                const from = analysis.entities.find((e) => e.id === r.from)?.label ?? r.from;
                const to = analysis.entities.find((e) => e.id === r.to)?.label ?? r.to;
                return (
                  <li key={i} className="flex items-center gap-2 text-ink/75">
                    <span className="font-medium text-ink">{from}</span>
                    <span className="font-hand text-ink/50">→</span>
                    <span className="font-medium text-ink">{to}</span>
                    {r.label && <span className="text-xs text-ink/45">({r.label})</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        <section className="card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">Insights & assumptions</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {analysis.insights.map((ins, i) => (
              <li key={i} className="text-ink/75">
                <span className="mr-2 rounded bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/55">{ins.type}</span>
                {ins.text}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

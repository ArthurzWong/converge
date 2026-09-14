import type { Action, Analysis, Entity, EntityKind, Insight, LogicStep, Mode, Relationship, Scene, VisualNode } from "../types";
import type { AIProvider, AnalyzeInput } from "./provider";
import { uid } from "../id";

/**
 * Deterministic, offline reasoning engine. It is intentionally simple: keyword
 * dictionaries + sentence heuristics. It guarantees CONVERGE works with no API
 * key and gives a stable fallback when a hosted model fails.
 */

const ENTITY_LEXICON: Array<{ match: RegExp; label: string; kind: EntityKind }> = [
  { match: /\bwhatsapp\b/i, label: "WhatsApp", kind: "channel" },
  { match: /\be-?mails?\b/i, label: "Email", kind: "channel" },
  { match: /\bphone( calls?)?\b/i, label: "Phone", kind: "channel" },
  { match: /\bwebsite|web form|landing page\b/i, label: "Website", kind: "channel" },
  { match: /\bsocial media|instagram|facebook|tiktok|linkedin\b/i, label: "Social media", kind: "channel" },
  { match: /\bcustomers?|clients?|buyers?\b/i, label: "Customer", kind: "person" },
  { match: /\bsales ?(people|person|team|reps?)?\b/i, label: "Sales team", kind: "team" },
  { match: /\bmanagers?|management|leadership|founders?|owners?\b/i, label: "Management", kind: "person" },
  { match: /\bstudents?|learners?\b/i, label: "Students", kind: "person" },
  { match: /\bteachers?|lecturers?|instructors?\b/i, label: "Teacher", kind: "person" },
  { match: /\bresearchers?|scientists?|lab\b/i, label: "Researchers", kind: "team" },
  { match: /\binvestors?\b/i, label: "Investors", kind: "person" },
  { match: /\bemployees?|staff|workers?|team members?\b/i, label: "Staff", kind: "team" },
  { match: /\bsuppliers?|vendors?\b/i, label: "Suppliers", kind: "organisation" },
  { match: /\bquotations?|quotes?|proposals?\b/i, label: "Quotation", kind: "document" },
  { match: /\binvoices?|billing\b/i, label: "Invoice", kind: "document" },
  { match: /\bexcel|spreadsheets?|google sheets?\b/i, label: "Spreadsheet", kind: "system" },
  { match: /\bcrm\b/i, label: "CRM", kind: "system" },
  { match: /\berp\b/i, label: "ERP", kind: "system" },
  { match: /\bdatabase|data ?base\b/i, label: "Database", kind: "system" },
  { match: /\bfollow[- ]?ups?\b/i, label: "Follow-up", kind: "process" },
  { match: /\bonboarding\b/i, label: "Onboarding", kind: "process" },
  { match: /\bpipeline\b/i, label: "Sales pipeline", kind: "concept" },
  { match: /\bleads?|enquir(y|ies)|inquir(y|ies)\b/i, label: "Enquiries", kind: "concept" },
  { match: /\bmarket\b/i, label: "Market", kind: "concept" },
  { match: /\bcompetitors?\b/i, label: "Competitors", kind: "organisation" },
  { match: /\brevenue|sales growth|conversion\b/i, label: "Revenue", kind: "metric" },
  { match: /\bcosts?|expenses?|budget\b/i, label: "Cost", kind: "metric" },
  { match: /\bdata\b/i, label: "Data", kind: "concept" },
  { match: /\bai|artificial intelligence|automation|agents?\b/i, label: "AI assistant", kind: "system" },
];

const PAIN = /\b(manual(ly)?|inconsistent|losing|lost|delay|slow|duplicate|no visibility|little visibility|unclear|missed|error|forget|scattered|fragmented|bottleneck|struggl|difficult|hard to|can't|cannot|lack|problem|issue|risk|churn|expensive|overwhelm)/i;
const OPPORTUNITY = /\b(could|opportunity|potential|want to|goal|aim|improve|grow|scale|automate|expand|launch|new|faster|better)\b/i;
const ASSUMPTION = /\b(assume|assuming|expect|believe|probably|likely|should|we think)\b/i;
const CAUSE = /\b(because|since|due to|caused by|as a result of|leads? to|so that)\b/i;

function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function clip(s: string, n = 90): string {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractEntities(text: string): Entity[] {
  const found: Entity[] = [];
  for (const lex of ENTITY_LEXICON) {
    if (lex.match.test(text) && !found.some((f) => f.label === lex.label)) {
      found.push({ id: lex.label.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: lex.label, kind: lex.kind });
    }
  }
  // Proper nouns not in lexicon
  const proper = text.match(/\b[A-Z][a-zA-Z]{2,}(?:\s[A-Z][a-zA-Z]{2,})?\b/g) ?? [];
  const stop = new Set(["The", "Our", "We", "Their", "They", "This", "That", "When", "Today", "Currently", "However", "Because"]);
  for (const p of proper) {
    if (stop.has(p) || found.some((f) => f.label.toLowerCase() === p.toLowerCase())) continue;
    if (found.length >= 10) break;
    found.push({ id: p.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: p, kind: "concept" });
  }
  return found.slice(0, 10);
}

function inferTitle(text: string, mode: Mode, entities: Entity[]): string {
  const key = entities.filter((e) => e.kind !== "person").slice(0, 2).map((e) => e.label);
  const base = key.length ? key.join(" & ") : clip(sentences(text)[0] ?? "Untitled", 40);
  const suffix: Record<Mode, string> = {
    general: "Clarified",
    business: "Transformation",
    pitch: "Pitch",
    foresight: "Outlook",
    education: "Explained",
    research: "Pathway",
  };
  return `${titleCase(base)} ${suffix[mode]}`;
}

const MODE_ACTIONS: Record<Mode, Array<Omit<Action, "id">>> = {
  business: [
    { action: "Map the current end-to-end workflow", reason: "You cannot fix what you cannot see.", priority: "high", outcome: "Shared picture of handoffs and delays" },
    { action: "Centralise incoming requests into one queue", reason: "Fragmented channels cause misses and duplicates.", priority: "high", outcome: "Nothing falls between channels" },
    { action: "Automate the most repetitive step first", reason: "Quick, visible win that frees people for judgement work.", priority: "medium", outcome: "Hours saved per week, faster response" },
    { action: "Add reminders and ownership for follow-ups", reason: "Consistency beats heroics.", priority: "medium", outcome: "Higher conversion from the same demand" },
    { action: "Define 3 metrics and review weekly", reason: "Visibility turns activity into improvement.", priority: "low", outcome: "Management can steer with data" },
  ],
  pitch: [
    { action: "Sharpen the one-sentence problem statement", reason: "Investors buy clarity first.", priority: "high", outcome: "A hook everyone can repeat" },
    { action: "Quantify the market with a bottom-up estimate", reason: "Top-down numbers are not believed.", priority: "high", outcome: "Credible TAM/SAM/SOM" },
    { action: "Show one unfair advantage with evidence", reason: "Differentiation needs proof, not adjectives.", priority: "medium", outcome: "Defensible positioning" },
    { action: "State the ask and what it unlocks", reason: "A pitch without an ask has no next step.", priority: "medium", outcome: "Clear decision for the audience" },
  ],
  foresight: [
    { action: "List the signals you are already seeing", reason: "Foresight starts with observation, not prediction.", priority: "high", outcome: "Evidence base for trends" },
    { action: "Sketch two plausible scenarios (best / disruptive)", reason: "Scenarios stretch thinking beyond the default future.", priority: "high", outcome: "Strategic options surfaced" },
    { action: "Identify no-regret moves valid in every scenario", reason: "Act on certainty, hedge on uncertainty.", priority: "medium", outcome: "Robust near-term plan" },
    { action: "Set trigger points to revisit the plan", reason: "The future arrives unevenly.", priority: "low", outcome: "Adaptive strategy" },
  ],
  education: [
    { action: "Define the core idea in one sentence", reason: "Every explanation needs an anchor.", priority: "high", outcome: "Learners know what matters" },
    { action: "Build one concrete worked example", reason: "Abstractions land through examples.", priority: "high", outcome: "Understanding, not memorising" },
    { action: "Surface the most common misconception", reason: "Learning is often un-learning.", priority: "medium", outcome: "Fewer repeated mistakes" },
    { action: "Add a 3-question self-check", reason: "Retrieval strengthens memory.", priority: "low", outcome: "Confidence and retention" },
  ],
  research: [
    { action: "State the discovery and why it matters", reason: "Impact starts with a plain-language claim.", priority: "high", outcome: "Non-experts understand the value" },
    { action: "Identify one concrete application", reason: "Applications attract partners and funding.", priority: "high", outcome: "A path from lab to use" },
    { action: "Map stakeholders who benefit or block", reason: "Commercialisation is a people problem too.", priority: "medium", outcome: "Early allies identified" },
    { action: "Define the next validation milestone", reason: "Momentum comes from small proofs.", priority: "medium", outcome: "Clear go / no-go point" },
  ],
  general: [
    { action: "Write the problem in one clear sentence", reason: "Clarity of problem is half the solution.", priority: "high", outcome: "Everyone aligned on what to solve" },
    { action: "Separate facts from assumptions", reason: "Most disagreements hide untested assumptions.", priority: "high", outcome: "A shorter list of real unknowns" },
    { action: "Pick the smallest experiment that reduces uncertainty", reason: "Action produces information.", priority: "medium", outcome: "Learning within days, not months" },
    { action: "Decide who owns the next step and by when", reason: "Ideas without owners stall.", priority: "medium", outcome: "Momentum" },
  ],
};

function nodeStyleFor(kind: EntityKind): VisualNode["style"] {
  switch (kind) {
    case "person":
    case "team":
      return "person";
    case "system":
      return "cylinder";
    case "channel":
      return "pill";
    case "document":
      return "box";
    case "concept":
      return "cloud";
    default:
      return "box";
  }
}

export class LocalProvider implements AIProvider {
  readonly name = "local";

  async analyze({ text, mode }: AnalyzeInput): Promise<Analysis> {
    const sents = sentences(text);
    const entities = extractEntities(text);
    const insights: Insight[] = [];
    const opportunities: string[] = [];

    for (const s of sents) {
      if (PAIN.test(s)) insights.push({ type: "problem", text: clip(s, 140) });
      else if (CAUSE.test(s)) insights.push({ type: "cause", text: clip(s, 140) });
      else if (ASSUMPTION.test(s)) insights.push({ type: "assumption", text: clip(s, 140) });
      else if (OPPORTUNITY.test(s)) opportunities.push(clip(s, 140));
      else insights.push({ type: "observation", text: clip(s, 140) });
    }
    if (opportunities.length === 0) {
      opportunities.push(
        mode === "education"
          ? "Explain the topic through one memorable visual model."
          : "Remove the most repetitive manual step and make progress visible.",
      );
    }

    const problemSentence = insights.find((i) => i.type === "problem")?.text ?? sents[0] ?? "Unclear situation";
    const relationships: Relationship[] = [];
    const flowish = entities.filter((e) => ["person", "channel", "team", "system", "document"].includes(e.kind));
    for (let i = 0; i < flowish.length - 1 && i < 5; i++) {
      relationships.push({ from: flowish[i].id, to: flowish[i + 1].id, kind: "flow" });
    }

    const actions: Action[] = MODE_ACTIONS[mode].map((a) => ({ id: uid("act"), ...a }));

    return {
      title: inferTitle(text, mode, entities),
      problem: clip(problemSentence, 120),
      summary: clip(sents.slice(0, 2).join(" "), 220),
      entities,
      relationships,
      insights: insights.slice(0, 8),
      opportunities: opportunities.slice(0, 4),
      actions,
    };
  }

  async generateStory(analysis: Analysis): Promise<LogicStep[]> {
    const problems = analysis.insights.filter((i) => i.type === "problem").map((i) => i.text);
    const causes = analysis.insights.filter((i) => i.type === "cause" || i.type === "observation").map((i) => i.text);
    return [
      { stage: "problem", title: analysis.problem, points: problems.slice(0, 3) },
      { stage: "cause", title: "Why it happens", points: (causes.length ? causes : ["Work depends on individual effort rather than a shared system."]).slice(0, 3) },
      {
        stage: "consequence",
        title: "What it costs",
        points: ["Lost or delayed opportunities", "Duplicate effort and rework", "Leaders decide without visibility"],
      },
      { stage: "opportunity", title: "The opening", points: analysis.opportunities.slice(0, 3) },
      {
        stage: "solution",
        title: "A clearer way of working",
        points: ["One shared flow for incoming work", "Assistance for repetitive steps", "Humans keep the decisions"],
      },
      { stage: "action", title: "What to do next", points: analysis.actions.slice(0, 3).map((a) => a.action) },
    ];
  }

  async generateScenes(analysis: Analysis, mode: Mode): Promise<Scene[]> {
    const ents = analysis.entities;
    const flowEnts = ents.filter((e) => ["person", "channel", "team", "system", "document"].includes(e.kind)).slice(0, 5);
    const flowNodes: VisualNode[] = (flowEnts.length >= 2 ? flowEnts : ents.slice(0, 4)).map((e) => ({
      id: e.id,
      label: e.label,
      style: nodeStyleFor(e.kind),
    }));
    const problems = analysis.insights.filter((i) => i.type === "problem");

    const scenes: Array<Omit<Scene, "id" | "number">> = [
      {
        title: "The Current Situation",
        purpose: "Establish how things work today.",
        narration: `Today, ${analysis.summary.charAt(0).toLowerCase()}${analysis.summary.slice(1)}`,
        visualConcept: "Actors and systems connected in the order work flows between them.",
        visual: {
          layout: "flow",
          nodes: flowNodes.length ? flowNodes : [{ id: "situation", label: analysis.title, style: "cloud" }],
          edges: flowNodes.slice(1).map((n, i) => ({ from: flowNodes[i].id, to: n.id })),
          caption: "How work moves today",
        },
        durationSec: 9,
      },
      {
        title: "Where Things Break",
        purpose: "Make the friction visible.",
        narration: problems.length
          ? `Look closer and the cracks appear. ${problems.map((p) => p.text).slice(0, 2).join(" ")}`
          : "Look closer and the cracks appear: steps depend on memory, effort and luck rather than a shared system.",
        visualConcept: "The central problem surrounded by concrete breakdowns.",
        visual: {
          layout: "breakdown",
          nodes: [
            { id: "core", label: analysis.problem, style: "warning" },
            ...(problems.length ? problems : [{ text: "Manual, repeated effort" }, { text: "Inconsistent follow-through" }, { text: "No shared visibility" }])
              .slice(0, 4)
              .map((p, i) => ({ id: `p${i}`, label: clip(p.text, 42), style: "box" as const })),
          ],
          edges: (problems.length ? problems : [1, 2, 3]).slice(0, 4).map((_, i) => ({ from: "core", to: `p${i}`, broken: true })),
          caption: "Friction compounds quietly",
        },
        durationSec: 9,
      },
      {
        title: "The Opportunity",
        purpose: "Reframe the problem as an opening.",
        narration: `Every one of those cracks is also an opening. ${analysis.opportunities[0] ?? ""}`,
        visualConcept: "A spark at the centre radiating to the opportunities it unlocks.",
        visual: {
          layout: "hub",
          nodes: [
            { id: "spark", label: "Opportunity", style: "spark" },
            ...analysis.opportunities.slice(0, 4).map((o, i) => ({ id: `o${i}`, label: clip(o, 44), style: "cloud" as const })),
          ],
          edges: analysis.opportunities.slice(0, 4).map((_, i) => ({ from: "spark", to: `o${i}` })),
          caption: "Where the upside lives",
        },
        durationSec: 8,
      },
      {
        title: "The Future State",
        purpose: "Show the target way of working.",
        narration: "Imagine the same demand flowing through one clear path, with assistance for the repetitive steps and people focused on judgement and relationships.",
        visualConcept: "A clean, single flow with an assistant in the middle and a human approval step.",
        visual: {
          layout: "flow",
          nodes: [
            { id: "in", label: flowNodes[0]?.label ?? "Input", style: flowNodes[0]?.style ?? "person" },
            { id: "assist", label: "AI assistant", style: "cylinder", note: "captures, drafts, reminds" },
            { id: "system", label: "Shared system", style: "box" },
            { id: "human", label: "Human review", style: "person" },
            { id: "out", label: "Outcome", style: "pill" },
          ],
          edges: [
            { from: "in", to: "assist" },
            { from: "assist", to: "system" },
            { from: "system", to: "human" },
            { from: "human", to: "out" },
          ],
          caption: "One path, visible to everyone",
        },
        durationSec: 9,
      },
      {
        title: "The Action Plan",
        purpose: "Turn the story into steps.",
        narration: `Start small and build momentum. ${analysis.actions.slice(0, 3).map((a, i) => `${["First", "Then", "Finally"][i]}, ${a.action.charAt(0).toLowerCase()}${a.action.slice(1)}.`).join(" ")}`,
        visualConcept: "A 30 / 60 / 90 day roadmap.",
        visual: {
          layout: "timeline",
          nodes: analysis.actions.slice(0, 3).map((a, i) => ({ id: `a${i}`, label: clip(a.action, 40), note: ["Days 1–30", "Days 31–60", "Days 61–90"][i], style: "box" as const })),
          edges: [],
          caption: mode === "education" ? "Learn, practise, apply" : "30 / 60 / 90 day roadmap",
        },
        durationSec: 8,
      },
    ];

    return scenes.map((s, i) => ({ id: uid("scene"), number: i + 1, ...s }));
  }

  async generateActions(analysis: Analysis): Promise<Action[]> {
    return analysis.actions;
  }

  async regenerateScene(analysis: Analysis, mode: Mode, scene: Scene, instruction?: string): Promise<Scene> {
    void instruction;
    const rotate: Record<Scene["visual"]["layout"], Scene["visual"]["layout"]> = {
      flow: "list",
      list: "hub",
      hub: "breakdown",
      breakdown: "flow",
      timeline: "list",
    };
    const layout = rotate[scene.visual.layout];
    const nodes = scene.visual.nodes.map((n) => ({ ...n, style: layout === "flow" ? n.style : n.style === "warning" ? "warning" : "box" }));
    return {
      ...scene,
      visualConcept: `${scene.visualConcept} (alternative ${layout} arrangement)`,
      narration: scene.narration.replace(/^Today, /, "Right now, ").replace(/^Imagine /, "Picture "),
      visual: { ...scene.visual, layout, nodes, edges: layout === "list" ? [] : scene.visual.edges },
    };
  }
}

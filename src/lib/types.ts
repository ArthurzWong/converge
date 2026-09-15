export const MODES = [
  "general",
  "business",
  "pitch",
  "foresight",
  "education",
  "research",
] as const;
export type Mode = (typeof MODES)[number];

export const MODE_LABELS: Record<Mode, { label: string; hint: string }> = {
  general: { label: "General", hint: "Any idea, problem or topic" },
  business: { label: "Business", hint: "Operations, growth, transformation" },
  pitch: { label: "Pitch", hint: "Problem → solution → market → ask" },
  foresight: { label: "Foresight", hint: "Signals → trends → scenarios" },
  education: { label: "Education", hint: "Explain a complex topic simply" },
  research: { label: "Research", hint: "Discovery → application → impact" },
};

export type EntityKind =
  | "person"
  | "team"
  | "system"
  | "channel"
  | "document"
  | "process"
  | "concept"
  | "metric"
  | "organisation";

export interface Entity {
  id: string;
  label: string;
  kind: EntityKind;
}

export interface Relationship {
  from: string;
  to: string;
  label?: string;
  kind?: "flow" | "causes" | "depends" | "blocks" | "enables";
}

export interface Insight {
  type: "cause" | "effect" | "assumption" | "problem" | "observation";
  text: string;
}

export interface Analysis {
  title: string;
  problem: string;
  summary: string;
  entities: Entity[];
  relationships: Relationship[];
  insights: Insight[];
  opportunities: string[];
  actions: Action[];
}

export type Priority = "high" | "medium" | "low";

export interface Action {
  id: string;
  action: string;
  reason: string;
  priority: Priority;
  outcome: string;
}

/** Layout-level description of a scene's picture. The LLM never emits coordinates. */
export type SceneLayout =
  | "flow" // left→right chain of nodes
  | "breakdown" // central node with problems around it
  | "hub" // central node radiating to satellites
  | "timeline" // horizontal timeline with milestones
  | "list"; // stacked list of items

export type NodeStyle = "box" | "person" | "cloud" | "cylinder" | "pill" | "warning" | "spark";

export interface VisualNode {
  id: string;
  label: string;
  style?: NodeStyle;
  note?: string;
}

export interface VisualEdge {
  from: string;
  to: string;
  label?: string;
  broken?: boolean;
}

export interface VisualSpec {
  layout: SceneLayout;
  nodes: VisualNode[];
  edges: VisualEdge[];
  caption?: string;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  purpose: string;
  narration: string;
  visualConcept: string;
  visual: VisualSpec;
  durationSec: number;
}

export interface LogicStep {
  stage: "problem" | "cause" | "consequence" | "opportunity" | "solution" | "action";
  title: string;
  points: string[];
}

export interface Story {
  id: string;
  createdAt: string;
  mode: Mode;
  input: string;
  analysis: Analysis;
  scenes: Scene[];
  logic: LogicStep[];
  provider: string;
}

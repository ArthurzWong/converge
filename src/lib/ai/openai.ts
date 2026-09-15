import type { Action, Analysis, LogicStep, Mode, Scene, VisualSpec } from "../types";
import { MODE_LABELS } from "../types";
import type { AIProvider, AnalyzeInput } from "./provider";
import { uid } from "../id";

/**
 * Works with any OpenAI-compatible chat completions endpoint (OpenAI, Azure
 * gateway, OpenRouter, local servers) via plain fetch: no SDK dependency.
 */
export interface OpenAIConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

const SYSTEM = `You are CONVERGE, a senior strategist and visual thinker. You turn messy input into clear structure, a visual story, and practical action. Be concrete, plain-spoken and business-friendly. Never use developer jargon. Always answer with strict JSON matching the requested shape and nothing else.`;

const VISUAL_RULES = `A "visual" describes a hand-drawn whiteboard picture using ONLY this shape:
{"layout":"flow"|"breakdown"|"hub"|"timeline"|"list","nodes":[{"id":string,"label":string (<=40 chars),"style":"box"|"person"|"cloud"|"cylinder"|"pill"|"warning"|"spark","note"?:string (<=30 chars)}],"edges":[{"from":id,"to":id,"label"?:string (<=18 chars),"broken"?:boolean}],"caption"?:string (<=60 chars)}
- flow: 3-5 nodes left to right, edges connect neighbours.
- breakdown: first node is the central problem (style "warning"), 3-4 satellites, edges from centre with broken:true.
- hub: first node is the centre (style "spark" or "cloud"), 3-4 satellites.
- timeline: 3-4 nodes as milestones, notes like "Days 1-30"; no edges.
- list: 3-5 nodes stacked; no edges.
Use "person" for people/teams, "cylinder" for systems/data, "pill" for channels, "cloud" for ideas.`;

export class OpenAIProvider implements AIProvider {
  readonly name: string;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(cfg: OpenAIConfig) {
    this.apiKey = cfg.apiKey;
    this.baseUrl = (cfg.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
    this.model = cfg.model ?? "gpt-4o-mini";
    this.name = `openai:${this.model}`;
  }

  private async json<T>(user: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`AI provider error ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned an empty response");
    return JSON.parse(content) as T;
  }

  async analyze({ text, mode }: AnalyzeInput): Promise<Analysis> {
    const raw = await this.json<Omit<Analysis, "actions"> & { actions: Array<Omit<Action, "id">> }>(
      `Mode: ${MODE_LABELS[mode].label} (${MODE_LABELS[mode].hint}).
Analyse the input and return JSON:
{"title":string (<=6 words),"problem":string (one sentence),"summary":string (<=2 sentences),
"entities":[{"id":kebab-case,"label":string,"kind":"person"|"team"|"system"|"channel"|"document"|"process"|"concept"|"metric"|"organisation"}] (4-10),
"relationships":[{"from":id,"to":id,"label"?:string,"kind":"flow"|"causes"|"depends"|"blocks"|"enables"}],
"insights":[{"type":"cause"|"effect"|"assumption"|"problem"|"observation","text":string}] (4-8),
"opportunities":[string] (2-4),
"actions":[{"action":string,"reason":string,"priority":"high"|"medium"|"low","outcome":string}] (3-5)}

INPUT:
"""${text.slice(0, 6000)}"""`,
    );
    return { ...raw, actions: (raw.actions ?? []).map((a) => ({ id: uid("act"), ...a })) };
  }

  async generateStory(analysis: Analysis, mode: Mode): Promise<LogicStep[]> {
    const raw = await this.json<{ steps: LogicStep[] }>(
      `Mode: ${MODE_LABELS[mode].label}. Build the reasoning chain behind this analysis as JSON:
{"steps":[{"stage":"problem"|"cause"|"consequence"|"opportunity"|"solution"|"action","title":string (<=8 words),"points":[string] (2-3, <=90 chars each)}]}
Include all six stages in that order.
ANALYSIS: ${JSON.stringify(analysis)}`,
    );
    return raw.steps;
  }

  async generateScenes(analysis: Analysis, mode: Mode, count = 5): Promise<Scene[]> {
    const raw = await this.json<{ scenes: Array<Omit<Scene, "id" | "number">> }>(
      `Mode: ${MODE_LABELS[mode].label}. Create ${count} scenes (4-6 allowed) that tell this as a visual story: current situation → where it breaks → the opportunity → the future state → the action plan (adapt the arc to the mode, e.g. Pitch: problem → solution → market → advantage → ask; Education: concept → why it matters → how it works → example → summary).
Return JSON: {"scenes":[{"title":string (<=5 words),"purpose":string,"narration":string (2-3 spoken sentences, 25-45 words),"visualConcept":string,"visual":VISUAL,"durationSec":number (7-10)}]}
${VISUAL_RULES}
ANALYSIS: ${JSON.stringify(analysis)}`,
    );
    return raw.scenes.map((s, i) => ({ ...s, id: uid("scene"), number: i + 1, visual: sanitizeVisual(s.visual) }));
  }

  async generateActions(analysis: Analysis, mode: Mode): Promise<Action[]> {
    if (analysis.actions.length >= 3) return analysis.actions;
    const raw = await this.json<{ actions: Array<Omit<Action, "id">> }>(
      `Mode: ${MODE_LABELS[mode].label}. Propose 3-5 practical next actions as JSON {"actions":[{"action","reason","priority":"high"|"medium"|"low","outcome"}]}.
ANALYSIS: ${JSON.stringify(analysis)}`,
    );
    return raw.actions.map((a) => ({ id: uid("act"), ...a }));
  }

  async regenerateScene(analysis: Analysis, mode: Mode, scene: Scene, instruction?: string): Promise<Scene> {
    const raw = await this.json<Omit<Scene, "id" | "number">>(
      `Mode: ${MODE_LABELS[mode].label}. Rewrite ONE scene of a visual story with a fresh visual idea and narration. Keep its role in the story (${scene.purpose}).${instruction ? ` Instruction: ${instruction}` : ""}
Return JSON: {"title","purpose","narration","visualConcept","visual":VISUAL,"durationSec"}
${VISUAL_RULES}
CURRENT SCENE: ${JSON.stringify(scene)}
ANALYSIS: ${JSON.stringify(analysis)}`,
    );
    return { ...raw, id: scene.id, number: scene.number, visual: sanitizeVisual(raw.visual) };
  }
}

function sanitizeVisual(v: VisualSpec | undefined): VisualSpec {
  if (!v || !Array.isArray(v.nodes) || v.nodes.length === 0) {
    return { layout: "list", nodes: [{ id: "n0", label: "Scene", style: "box" }], edges: [] };
  }
  const ids = new Set(v.nodes.map((n) => n.id));
  return {
    layout: ["flow", "breakdown", "hub", "timeline", "list"].includes(v.layout) ? v.layout : "flow",
    nodes: v.nodes.slice(0, 8).map((n) => ({ ...n, label: String(n.label ?? "").slice(0, 48) })),
    edges: (v.edges ?? []).filter((e) => ids.has(e.from) && ids.has(e.to)),
    caption: v.caption,
  };
}

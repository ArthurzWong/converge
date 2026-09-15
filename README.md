# CONVERGE

**Turn complexity into clarity.**

CONVERGE turns messy ideas, business problems, documents or notes into a clear
visual story and actionable next steps. Paste a problem, pick a mode, press
**Converge** — and get a hand-drawn storyboard, the reasoning chain behind it,
and a prioritised action plan.

```
Landing → New story → Enter text → AI analysis → 4–6 scenes
       → Review / edit storyboard → Play animation → Export / share
```

CONVERGE is **not** a whiteboard-animation tool. The animation is only the
communication layer; the product is reasoning + visual storytelling + action.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # optional — the app runs without any keys
npm run dev                  # http://localhost:3000
```

Without `OPENAI_API_KEY` the app uses a built-in deterministic reasoning
engine, so everything (including the demo) works fully offline.

Other scripts: `npm run build`, `npm run lint`, `npm start`.

---

## Environment variables

| Variable          | Required | Default        | Purpose |
|-------------------|----------|----------------|---------|
| `OPENAI_API_KEY`  | no       | —              | Enables the hosted LLM provider. If absent (or the call fails), CONVERGE falls back to the local engine. |
| `OPENAI_BASE_URL` | no       | `https://api.openai.com/v1` | Any OpenAI-compatible endpoint (Azure gateway, OpenRouter, Groq, Ollama, …). |
| `OPENAI_MODEL`    | no       | `gpt-4o-mini`  | Model name passed to `/chat/completions`. |

No database, auth or storage service is needed. Stories live in the browser
(`localStorage`) and share links carry the story compressed inside the URL hash.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. In Vercel, **Add New → Project**, import the repo. The Next.js preset needs
   no changes (framework auto-detected, `npm run build`).
3. Optionally add `OPENAI_API_KEY` (and `OPENAI_BASE_URL` / `OPENAI_MODEL`)
   under *Settings → Environment Variables*.
4. Deploy. The API routes run as serverless functions; everything else is static/client.

CLI alternative: `npx vercel --prod`.

---

## Architecture

```
src/
├─ app/
│  ├─ page.tsx                Landing page (+ live demo player)
│  ├─ new/                    "What's on your mind?" input + mode selector
│  ├─ story/[id]/             Story workspace (Story / Logic / Action)
│  ├─ share/                  Read-only view for share links (#hash payload)
│  └─ api/
│     ├─ converge/route.ts    POST text+mode → full Story JSON
│     └─ scene/route.ts       POST scene → regenerated scene
├─ components/
│  ├─ StoryWorkspace.tsx      Tab shell, header, export menu
│  ├─ StoryPlayer.tsx         Playback, seek, narration (Web Speech)
│  ├─ Storyboard.tsx          Reorder / edit / regenerate / delete / add
│  ├─ SceneCanvas.tsx         SVG progressive-draw renderer
│  ├─ LogicView.tsx           Problem → Cause → … → Action chain
│  ├─ ActionView.tsx          Prioritised action cards
│  ├─ ExportMenu.tsx / PrintLayout.tsx
├─ lib/
│  ├─ types.ts                Story, Analysis, Scene, VisualSpec, Action …
│  ├─ ai/
│  │  ├─ provider.ts          AIProvider interface
│  │  ├─ openai.ts            OpenAI-compatible provider (fetch, JSON mode)
│  │  ├─ local.ts             Deterministic offline reasoning engine
│  │  └─ index.ts             Provider selection + full pipeline + fallback
│  ├─ animation/
│  │  ├─ elements.ts          VisualElement primitives (stroke/text/arrow/fill)
│  │  ├─ layout.ts            VisualSpec → positioned hand-drawn elements
│  │  ├─ timeline.ts          Draw order + time allocation
│  │  └─ svg.ts               Path helpers
│  └─ story/
│     ├─ demo.ts              Curated SME sales demo
│     ├─ storage.ts           localStorage + share-link encode/decode
│     └─ export.ts            SVG → PNG, JSON download
```

### The pipeline

1. **Analyze** — the provider turns free text into a structured `Analysis`:
   central problem, entities (people/teams/systems/channels/…), relationships,
   causes, effects, assumptions, opportunities and recommended actions.
2. **Story** — a `LogicStep[]` chain: Problem → Cause → Consequence →
   Opportunity → Solution → Action.
3. **Scenes** — 4–6 `Scene`s, each with title, purpose, narration and a
   *semantic* `VisualSpec` (`layout` + `nodes` + `edges`), not pixel coordinates.
4. **Actions** — 3–5 practical actions with reason, priority, expected outcome.

The three generation steps run in parallel after analysis.

### Semantic → visual → animation

```
Scene.visual (VisualSpec)          layout: flow | breakdown | hub | timeline | list
      ↓ layout.ts                  places nodes, picks glyphs (box, cloud, person,
                                   cylinder, pill, warning, spark…), adds wobble
VisualElement[]                    strokes, text, arrows, fills with `after` deps
      ↓ timeline.ts                dependency-aware reading order, sqrt-weighted
Timeline { entries, total }        time slots, small gaps between elements
      ↓ SceneCanvas.tsx            per-frame progress → partial paths, text reveal
<svg>                              960×540, scaled with CSS
```

Because scenes are stored semantically, the same story can be re-styled,
re-laid-out or exported to a different renderer in V2 without regenerating.

### AI provider abstraction

`AIProvider` (`src/lib/ai/provider.ts`) has five methods: `analyze`,
`generateStory`, `generateScenes`, `generateActions`, `regenerateScene`.
Adding Anthropic, Gemini or a self-hosted model means implementing this
interface — no UI changes. The OpenAI provider uses plain `fetch` (no SDK) and
sanitises the model's JSON before it reaches the renderer.

---

## What was reused or adapted from the reference project

The open-source project
[masihsultani/whiteboard-animator](https://github.com/masihsultani/whiteboard-animator)
(MIT) was used **only as a technical reference** for how diagram elements can be
progressively revealed as a hand-drawn animation. Ideas adapted (re-implemented
in TypeScript/SVG, no code copied):

- Grouping strokes into components and drawing a container before its contents.
- Reading-order scheduling (top-to-bottom, left-to-right) for the remaining
  components.
- Allocating draw time proportional to the **square root** of a component's
  size so small labels don't flash and big shapes don't drag.
- Revealing each stroke from its start ("pen front") rather than fading in.

Not reused: its UI, branding, product concept, README, video/raster pipeline,
image tracing, or any Python source. See `ATTRIBUTION.md`.

---

## Known limitations (V1)

- **Persistence is browser-local.** Stories live in `localStorage`; share links
  embed the whole story in the URL (fine for typical stories, long for very large ones).
- **No video export.** Export is PNG (per scene / all scenes), PDF via the
  browser print dialog, JSON, and share links.
- **Narration uses the browser's Web Speech API** — voice quality varies by
  OS/browser, and there is no server-side TTS.
- **The local engine is heuristic.** Without an LLM key it produces sensible,
  structured output from keyword/sentence classification, not deep reasoning.
- **Document upload is not yet supported** — paste text instead.
- **Five layout archetypes** (flow, breakdown, hub, timeline, list). Charts and
  images are not rendered.
- The hosted provider is called once per story with no streaming; long inputs
  take a few seconds.

---

## V2 roadmap

1. **Accounts + persistence** (Postgres/Vercel KV) with story history and teams.
2. **Document ingestion**: PDF/DOCX/URL upload, chunking and multi-document synthesis.
3. **Video export** (MP4/WebM) rendered server-side from the same timeline, with TTS voice-over.
4. **Richer visual grammar**: charts, images, icons, comparison tables, before/after splits.
5. **Deeper reasoning modes**: Foresight (scenario trees), Decision (option scoring),
   Research (evidence graph), Pitch (narrative arc) as first-class engines.
6. **Editable canvas**: drag nodes, rename entities, and re-render instantly.
7. **Provider plug-ins**: Anthropic / Gemini / local models via the `AIProvider` interface; streaming generation.
8. **Collaboration**: comments, versioning, presentation mode.

---

## License

MIT — see `LICENSE`. Third-party notices in `ATTRIBUTION.md`.

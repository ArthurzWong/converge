# Attribution and third-party notices

## Reference project: whiteboard-animator

**Project:** https://github.com/masihsultani/whiteboard-animator
**Author:** Masih Sultani
**License:** MIT (Copyright (c) 2026 Masih Sultani)

whiteboard-animator was consulted as a *technical reference only*, to
understand how image/diagram elements can be progressively revealed and rendered
as a hand-drawn animation.

### What was adapted (conceptually, re-implemented from scratch)

CONVERGE contains no code copied from whiteboard-animator. Its renderer is an
original TypeScript/SVG implementation (`src/lib/animation/*`,
`src/components/SceneCanvas.tsx`). The following *ideas* were adapted:

| Idea in whiteboard-animator | How CONVERGE implements it |
|---|---|
| Group pixels/strokes into connected components; draw a containing shape before the components inside it | `VisualElement.after` dependencies; `orderElements()` in `timeline.ts` emits a shape, then its grouped text, before continuing |
| Order remaining components in reading order (top → bottom, left → right) | Row-bucketed sort on element bounding boxes in `orderElements()` |
| Give each component a time slot proportional to the square root of its size | `buildTimeline()` weights each element by `sqrt(inkLength)` |
| Reveal strokes progressively from a moving pen front | Per-frame partial polylines / `stroke-dasharray` reveal in `SceneCanvas.tsx` |

### What was **not** reused

- User interface, branding, name, product concept or user experience
- README, documentation text or examples
- The raster/video pipeline (OpenCV, MoviePy, image tracing, hand overlay)
- Any Python source code

## Other dependencies

| Package | License |
|---|---|
| Next.js, React, React DOM | MIT |
| Tailwind CSS | MIT |
| lz-string | MIT |
| Inter, Kalam (via `next/font/google`) | SIL Open Font License 1.1 |

Full dependency licences are available via `npx license-checker` or in each
package's `node_modules/<pkg>/LICENSE`.

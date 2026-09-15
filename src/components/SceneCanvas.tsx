"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Scene } from "@/lib/types";
import { CANVAS_H, CANVAS_W, bbox, inkLength, type VisualElement } from "@/lib/animation/elements";
import { layoutScene } from "@/lib/animation/layout";
import { buildTimeline, progressAt, type TimelineEntry } from "@/lib/animation/timeline";
import { arrowGeometry, strokePath } from "@/lib/animation/svg";

interface Props {
  scene: Scene;
  /** 0..1 playback position; when omitted the scene is drawn fully. */
  progress?: number;
  className?: string;
  id?: string;
}

const INK = "#1f2937";
const PAPER = "#fffdf8";

/** Ease-out with a small overshoot, for the "pop" when something lands. */
function popEase(p: number) {
  const c = 1.4;
  const x = p - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
}

function ElementView({ entry, t, uid }: { entry: TimelineEntry; t: number; uid: string }) {
  const el = entry.element;
  const p = progressAt(entry, t);
  if (p <= 0) return null;
  const color = el.color ?? INK;

  if (el.type === "stroke") {
    const len = inkLength(el) + 14;
    const width = el.width ?? 2.6;
    return (
      <path
        d={strokePath(el)}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={el.dashed ? `6 7` : `${len} ${len}`}
        strokeDashoffset={el.dashed ? 0 : len * (1 - p)}
        opacity={el.dashed ? p : 1}
      />
    );
  }
  if (el.type === "fill") {
    // marker sweep: wipe the tint in left-to-right with a soft edge
    const b = bbox(el);
    const x = b.x - 6 + (b.w + 12) * p;
    return (
      <g>
        <defs>
          <clipPath id={`${uid}-clip-${el.id}`}>
            <rect x={b.x - 6} y={b.y - 6} width={Math.max(0, x - (b.x - 6))} height={b.h + 12} />
          </clipPath>
        </defs>
        <path d={strokePath({ ...el, type: "stroke", closed: true })} fill={el.fill} clipPath={`url(#${uid}-clip-${el.id})`} style={{ mixBlendMode: "multiply" }} />
      </g>
    );
  }
  if (el.type === "arrow") {
    const g = arrowGeometry(el);
    const shaftP = Math.min(1, p / 0.75);
    const headP = Math.max(0, (p - 0.75) / 0.25);
    const headScale = headP > 0 ? popEase(headP) : 0;
    return (
      <g>
        <path
          d={g.shaft}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeDasharray={el.broken ? "8 7" : `${g.length} ${g.length}`}
          strokeDashoffset={el.broken ? 0 : g.length * (1 - shaftP)}
          opacity={el.broken ? shaftP : 1}
        />
        {headP > 0 && (
          <path
            d={g.head}
            fill={color}
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            transform={`translate(${g.tip.x} ${g.tip.y}) scale(${headScale}) translate(${-g.tip.x} ${-g.tip.y})`}
          />
        )}
        {el.label && headP > 0.3 && (
          <text
            x={g.labelPos.x}
            y={g.labelPos.y}
            fontSize={14}
            fontWeight={600}
            textAnchor="middle"
            fill="#6b7280"
            opacity={Math.min(1, (headP - 0.3) / 0.7)}
            className="font-hand"
          >
            {el.label}
          </text>
        )}
        {el.broken && headP > 0 && (
          <g stroke={color} strokeWidth={2.6} opacity={headP} strokeLinecap="round" transform={`translate(${g.labelPos.x} ${g.labelPos.y + 13}) scale(${headScale}) translate(${-g.labelPos.x} ${-(g.labelPos.y + 13)})`}>
            <line x1={g.labelPos.x - 7} y1={g.labelPos.y + 6} x2={g.labelPos.x + 7} y2={g.labelPos.y + 20} />
            <line x1={g.labelPos.x + 7} y1={g.labelPos.y + 6} x2={g.labelPos.x - 7} y2={g.labelPos.y + 20} />
          </g>
        )}
      </g>
    );
  }
  // text: characters land one by one with a tiny upward settle
  const chars = Math.ceil(el.text.length * p);
  const lift = (1 - Math.min(1, p * 1.6)) * 3;
  return (
    <text
      x={el.x}
      y={el.y + lift}
      fontSize={el.size}
      fontWeight={el.weight ?? 500}
      textAnchor={el.anchor ?? "start"}
      fill={color}
      className="font-hand"
      opacity={Math.min(1, p * 3)}
    >
      {el.text.slice(0, chars)}
    </text>
  );
}

export function sceneElements(scene: Scene): VisualElement[] {
  return layoutScene(scene.visual, scene.id + scene.title);
}

export default function SceneCanvas({ scene, progress, className, id }: Props) {
  const timeline = useMemo(() => buildTimeline(sceneElements(scene), scene.durationSec), [scene]);
  const t = progress === undefined ? timeline.total + 1 : progress * timeline.total;
  const fills = timeline.entries.filter((e) => e.element.type === "fill");
  const ink = timeline.entries.filter((e) => e.element.type !== "fill");
  const uid = useId().replace(/:/g, "");
  const gridId = `${uid}-grid`;
  return (
    <svg
      id={id}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: PAPER }}
    >
      <defs>
        <pattern id={gridId} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="0.9" fill="#1f2937" opacity="0.08" />
        </pattern>
      </defs>
      <rect width={CANVAS_W} height={CANVAS_H} fill={PAPER} />
      <rect width={CANVAS_W} height={CANVAS_H} fill={`url(#${gridId})`} />
      <g>
        {fills.map((entry) => (
          <ElementView key={entry.element.id} entry={entry} t={t} uid={uid} />
        ))}
      </g>
      <g>
        {ink.map((entry) => (
          <ElementView key={entry.element.id} entry={entry} t={t} uid={uid} />
        ))}
      </g>
    </svg>
  );
}

/** Drives a 0..1 progress value over a scene's duration. */
export function useScenePlayback(durationSec: number, playing: boolean, onEnd?: () => void, resetKey?: string) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef<number | null>(null);
  const progressRef = useRef(0);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  useEffect(() => {
    setProgress(0);
    progressRef.current = 0;
    startRef.current = null;
  }, [resetKey]);

  useEffect(() => {
    if (!playing) {
      startRef.current = null;
      return;
    }
    let raf = 0;
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now - progressRef.current * durationSec * 1000;
      const p = Math.min(1, (now - startRef.current) / (durationSec * 1000));
      progressRef.current = p;
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else onEndRef.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, durationSec, resetKey]);

  const seek = (p: number) => {
    progressRef.current = p;
    startRef.current = null;
    setProgress(p);
  };
  return { progress, seek };
}

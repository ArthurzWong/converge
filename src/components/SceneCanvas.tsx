"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Scene } from "@/lib/types";
import { CANVAS_H, CANVAS_W, inkLength, type VisualElement } from "@/lib/animation/elements";
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

function ElementView({ entry, t }: { entry: TimelineEntry; t: number }) {
  const el = entry.element;
  const p = progressAt(entry, t);
  if (p <= 0) return null;
  const color = el.color ?? "#1d2433";

  if (el.type === "stroke") {
    const len = inkLength(el) + 10;
    return (
      <path
        d={strokePath(el)}
        fill="none"
        stroke={color}
        strokeWidth={el.width ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={el.dashed ? `6 6` : `${len} ${len}`}
        strokeDashoffset={el.dashed ? 0 : len * (1 - p)}
        opacity={el.dashed ? p : 1}
      />
    );
  }
  if (el.type === "fill") {
    return <path d={strokePath({ ...el, type: "stroke", closed: true })} fill={el.fill} opacity={p * 0.9} />;
  }
  if (el.type === "arrow") {
    const g = arrowGeometry(el);
    const shaftP = Math.min(1, p / 0.8);
    const headP = Math.max(0, (p - 0.8) / 0.2);
    return (
      <g>
        <path
          d={g.shaft}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray={el.broken ? `${g.length} ${g.length}` : `${g.length} ${g.length}`}
          strokeDashoffset={g.length * (1 - shaftP)}
          style={el.broken ? { strokeDasharray: "7 6", opacity: shaftP } : undefined}
        />
        {headP > 0 && (
          <path d={g.head} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={headP} />
        )}
        {el.label && headP > 0.5 && (
          <text x={g.labelPos.x} y={g.labelPos.y} fontSize={13} textAnchor="middle" fill="#64748b" opacity={(headP - 0.5) * 2} className="font-hand">
            {el.label}
          </text>
        )}
        {el.broken && headP > 0 && (
          <g stroke={color} strokeWidth={2.2} opacity={headP} strokeLinecap="round">
            <line x1={g.labelPos.x - 7} y1={g.labelPos.y + 6} x2={g.labelPos.x + 7} y2={g.labelPos.y + 20} />
            <line x1={g.labelPos.x + 7} y1={g.labelPos.y + 6} x2={g.labelPos.x - 7} y2={g.labelPos.y + 20} />
          </g>
        )}
      </g>
    );
  }
  // text: reveal character by character
  const chars = Math.ceil(el.text.length * p);
  return (
    <text
      x={el.x}
      y={el.y}
      fontSize={el.size}
      fontWeight={el.weight ?? 500}
      textAnchor={el.anchor ?? "start"}
      fill={color}
      className="font-hand"
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
  return (
    <svg
      id={id}
      viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      style={{ background: "#fbfbf9" }}
    >
      <rect width={CANVAS_W} height={CANVAS_H} fill="#fbfbf9" />
      {timeline.entries.map((entry) => (
        <ElementView key={entry.element.id} entry={entry} t={t} />
      ))}
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

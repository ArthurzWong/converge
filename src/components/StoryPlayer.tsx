"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Scene } from "@/lib/types";
import SceneCanvas, { useScenePlayback } from "./SceneCanvas";
import { speak, stopSpeaking, ttsAvailable } from "@/lib/tts";

interface Props {
  scenes: Scene[];
  initialIndex?: number;
  autoplay?: boolean;
  loop?: boolean;
  compact?: boolean;
  onIndexChange?: (i: number) => void;
}

const CONFETTI_COLORS = ["#0d9488", "#f97362", "#f5b82e", "#7c6cf0"];
const CONFETTI = Array.from({ length: 18 }, (_, i) => ({
  left: `${8 + ((i * 37) % 84)}%`,
  top: `${20 + ((i * 53) % 50)}%`,
  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  animationDelay: `${(i % 6) * 40}ms`,
  transform: `rotate(${(i * 47) % 360}deg)`,
  borderRadius: i % 3 === 0 ? "999px" : "2px",
}));

export default function StoryPlayer({ scenes, initialIndex = 0, autoplay = false, loop = false, compact = false, onIndexChange }: Props) {
  const [index, setIndex] = useState(Math.min(initialIndex, scenes.length - 1));
  const [playing, setPlaying] = useState(autoplay);
  const [voice, setVoice] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  useEffect(() => setCanSpeak(ttsAvailable()), []);
  const scene = scenes[index];
  const indexRef = useRef(index);
  indexRef.current = index;

  useEffect(() => {
    if (initialIndex !== indexRef.current && initialIndex < scenes.length) {
      setIndex(initialIndex);
    }
  }, [initialIndex, scenes.length]);

  useEffect(() => {
    if (index > scenes.length - 1) setIndex(Math.max(0, scenes.length - 1));
  }, [scenes.length, index]);

  const goTo = useCallback(
    (i: number, keepPlaying = true) => {
      stopSpeaking();
      const next = (i + scenes.length) % scenes.length;
      setIndex(next);
      onIndexChange?.(next);
      if (!keepPlaying) setPlaying(false);
    },
    [scenes.length, onIndexChange],
  );

  const onEnd = useCallback(() => {
    const isLast = indexRef.current >= scenes.length - 1;
    if (isLast && !loop) {
      setPlaying(false);
      return;
    }
    // small pause so the finished drawing can be read
    window.setTimeout(() => goTo(indexRef.current + 1), 900);
  }, [scenes.length, loop, goTo]);

  const { progress, seek } = useScenePlayback(scene?.durationSec ?? 8, playing, onEnd, scene?.id);

  // confetti outlives `playing` so the final scene's burst can finish its animation
  const [burst, setBurst] = useState(false);
  const atEnd = progress >= 0.97;
  useEffect(() => {
    if (!playing || !atEnd) return;
    setBurst(true);
    window.setTimeout(() => setBurst(false), 1400);
  }, [playing, atEnd]);
  useEffect(() => setBurst(false), [scene?.id]);

  useEffect(() => {
    if (playing && voice && scene) speak(scene.narration);
    if (!playing) stopSpeaking();
  }, [playing, voice, scene]);

  useEffect(() => () => stopSpeaking(), []);

  if (!scene) return null;

  return (
    <div className={compact ? "overflow-hidden rounded-xl border border-ink/10 bg-white" : "card overflow-hidden"}>
      <div className="relative">
        <SceneCanvas scene={scene} progress={progress} className="block h-auto w-full" />
        {burst && (
          <div className="confetti pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {CONFETTI.map((c, i) => (
              <span key={i} style={c} />
            ))}
          </div>
        )}
        <div className="pointer-events-none absolute left-4 top-3 flex items-center gap-2 text-xs text-ink/50">
          <span className="rounded-full bg-white/80 px-2 py-0.5 font-medium backdrop-blur">
            Scene {index + 1} / {scenes.length}
          </span>
        </div>
        {!playing && (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex items-end justify-end p-4 transition hover:bg-white/20"
            aria-label="Play"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/90 text-white shadow-lg transition group-hover:scale-110">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="border-t border-ink/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <button className="btn-icon" onClick={() => goTo(index - 1)} aria-label="Previous scene">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>
          <button className="btn-icon" onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pause" : "Play"}>
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button className="btn-icon" onClick={() => goTo(index + 1)} aria-label="Next scene">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
            </svg>
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => seek(Number(e.target.value) / 1000)}
            className="h-1 flex-1 accent-accent"
            aria-label="Scene progress"
          />
          {canSpeak && (
            <button
              className={`btn-icon ${voice ? "!text-accent" : ""}`}
              onClick={() => setVoice((v) => !v)}
              aria-label={voice ? "Mute narration" : "Read narration aloud"}
              title={voice ? "Narration on" : "Narration off"}
            >
              {voice ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.4-2.4-1.4-1.4L15.2 10.6 12.8 8.2l-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {!compact && (
          <div className="mt-3 flex items-start gap-3">
            <span className="mt-0.5 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
              Narration
            </span>
            <p className="text-sm leading-relaxed text-ink/80">
              <span className="font-semibold text-ink">{scene.title}. </span>
              {scene.narration}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

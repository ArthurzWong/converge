"use client";

import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { Story } from "../types";
import { DEMO_STORY } from "./demo";

const KEY = "converge.stories.v1";

function readAll(): Record<string, Story> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}") as Record<string, Story>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, Story>) {
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function saveStory(story: Story) {
  const all = readAll();
  all[story.id] = story;
  writeAll(all);
}

export function loadStory(id: string): Story | null {
  if (id === DEMO_STORY.id) {
    return readAll()[id] ?? DEMO_STORY;
  }
  return readAll()[id] ?? null;
}

export function deleteStory(id: string) {
  const all = readAll();
  delete all[id];
  writeAll(all);
}

export function listStories(): Story[] {
  const all = readAll();
  const list = Object.values(all).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (!all[DEMO_STORY.id]) list.push(DEMO_STORY);
  return list;
}

export function encodeShare(story: Story): string {
  return compressToEncodedURIComponent(JSON.stringify(story));
}

export function decodeShare(hash: string): Story | null {
  try {
    const json = decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    const story = JSON.parse(json) as Story;
    if (!story.scenes || !story.analysis) return null;
    return story;
  } catch {
    return null;
  }
}

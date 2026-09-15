import { NextResponse } from "next/server";
import { getProvider, localProvider } from "@/lib/ai";
import type { Analysis, Mode, Scene } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  let body: { analysis?: Analysis; mode?: Mode; scene?: Scene; instruction?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.analysis || !body.scene) {
    return NextResponse.json({ error: "analysis and scene are required" }, { status: 400 });
  }
  const mode = body.mode ?? "general";
  const provider = getProvider();
  try {
    const scene = await provider.regenerateScene(body.analysis, mode, body.scene, body.instruction);
    return NextResponse.json(scene);
  } catch (err) {
    console.error("[api/scene] provider failed, using local engine:", err);
    const scene = await localProvider.regenerateScene(body.analysis, mode, body.scene);
    return NextResponse.json(scene);
  }
}

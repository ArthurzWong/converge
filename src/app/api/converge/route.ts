import { NextResponse } from "next/server";
import { converge } from "@/lib/ai";
import { MODES, type Mode } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { text?: string; mode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (text.length < 20) {
    return NextResponse.json({ error: "Please describe your idea or problem in a little more detail (at least 20 characters)." }, { status: 400 });
  }
  const mode: Mode = MODES.includes(body.mode as Mode) ? (body.mode as Mode) : "general";
  try {
    const story = await converge(text, mode);
    return NextResponse.json(story);
  } catch (err) {
    console.error("[api/converge]", err);
    return NextResponse.json({ error: "CONVERGE could not analyse this input. Please try again." }, { status: 500 });
  }
}

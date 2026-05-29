import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateReport } from "@/lib/openai/report";
import type { PracticeSession, Presentation, SlideTiming } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("id", sessionId)
    .single<PracticeSession>();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: presentation } = await supabase
    .from("presentations")
    .select("*")
    .eq("id", session.presentation_id)
    .single<Presentation>();
  if (!presentation) {
    return NextResponse.json({ error: "Presentation missing" }, { status: 404 });
  }

  let report;
  try {
    report = await generateReport({
      title: presentation.title,
      context: presentation.context,
      targetDurationMinutes: presentation.target_duration_minutes,
      slideTexts: presentation.slide_texts,
      transcript: session.transcript,
      slideTimings: (session.slide_timings || []) as SlideTiming[],
      totalDurationSeconds: session.total_duration_seconds || 0,
    });
  } catch (e) {
    console.error("Report generation failed", e);
    await supabase
      .from("practice_sessions")
      .update({ status: "failed" })
      .eq("id", sessionId);
    return NextResponse.json(
      { error: "Could not generate report" },
      { status: 502 },
    );
  }

  // Upsert (replaces any prior report for this session).
  const { error: upsertError } = await supabase.from("ai_reports").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      coverage: report.coverage,
      timing: report.timing,
      delivery: report.delivery,
      structure: report.structure,
      questions: report.questions,
      overall_summary: report.overall_summary,
    },
    { onConflict: "session_id" },
  );
  if (upsertError) {
    console.error("Upsert report failed", upsertError);
    return NextResponse.json({ error: "Could not save report" }, { status: 500 });
  }

  await supabase
    .from("practice_sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  return NextResponse.json({ ok: true });
}

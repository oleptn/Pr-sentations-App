import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({
  slideTimings: z.array(
    z.object({
      slide: z.number().int().positive(),
      startMs: z.number().nonnegative(),
      endMs: z.number().nonnegative(),
      durationMs: z.number().nonnegative(),
    }),
  ),
  totalDurationSeconds: z.number().int().nonnegative(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id, status")
    .eq("id", sessionId)
    .single();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("practice_sessions")
    .update({
      slide_timings: parsed.data.slideTimings,
      total_duration_seconds: parsed.data.totalDurationSeconds,
      ended_at: new Date().toISOString(),
      status: "processing",
    })
    .eq("id", sessionId);
  if (error) {
    console.error("Finalize failed", error);
    return NextResponse.json({ error: "Could not save session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudio } from "@/lib/openai/transcribe";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // Whisper's hard limit.

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

  // Verify ownership.
  const { data: session } = await supabase
    .from("practice_sessions")
    .select("id, user_id")
    .eq("id", sessionId)
    .single();
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio" }, { status: 400 });
  }
  if (audio.size === 0) {
    return NextResponse.json({ error: "Empty audio" }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json(
      { error: "Audio too large (max 25MB)" },
      { status: 400 },
    );
  }

  const arrayBuffer = await audio.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filename = (audio as File).name || `session-${sessionId}.webm`;

  // Save audio to storage (best-effort — Whisper is the must-have).
  const audioPath = `${user.id}/${sessionId}-${Date.now()}.${
    filename.split(".").pop() || "webm"
  }`;
  const { error: storageError } = await supabase.storage
    .from("recordings")
    .upload(audioPath, buffer, {
      contentType: audio.type || "audio/webm",
      upsert: false,
    });
  if (storageError) {
    console.warn("Audio upload failed (continuing):", storageError);
  }

  let transcript: string;
  try {
    transcript = await transcribeAudio(buffer, filename);
  } catch (e) {
    // Log full error details for debugging
    const errMsg = e instanceof Error ? e.message : String(e);
    const errStatus = (e as { status?: number }).status;
    console.error(`Whisper failed [${errStatus ?? "?"}]: ${errMsg}`, {
      filename,
      mimeType: audio.type,
      sizeBytes: audio.size,
    });
    // Don't mark as "failed" — finalize will set status to "processing"
    // and the report will generate with timing data only.
    return NextResponse.json(
      { error: "Could not transcribe audio" },
      { status: 502 },
    );
  }

  const { error: updateError } = await supabase
    .from("practice_sessions")
    .update({
      transcript,
      audio_path: storageError ? null : audioPath,
    })
    .eq("id", sessionId);
  if (updateError) {
    console.error("Update failed", updateError);
    return NextResponse.json(
      { error: "Could not save transcript" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

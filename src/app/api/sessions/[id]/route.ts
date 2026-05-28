import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
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
    .select("id, user_id, audio_path")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (session.audio_path) {
    await supabase.storage.from("recordings").remove([session.audio_path]);
  }

  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: "Could not delete session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

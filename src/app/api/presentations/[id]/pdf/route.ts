import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: presentation, error } = await supabase
    .from("presentations")
    .select("pdf_path, user_id")
    .eq("id", id)
    .single();
  if (error || !presentation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (presentation.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: blob, error: dlError } = await supabase.storage
    .from("presentations")
    .download(presentation.pdf_path);
  if (dlError || !blob) {
    return NextResponse.json({ error: "Could not load PDF" }, { status: 500 });
  }
  const buffer = await blob.arrayBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=300",
    },
  });
}

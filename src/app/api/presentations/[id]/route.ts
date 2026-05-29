import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: presentation } = await supabase
    .from("presentations")
    .select("id, user_id, pdf_path")
    .eq("id", id)
    .single();

  if (!presentation || presentation.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Delete PDF from storage
  if (presentation.pdf_path) {
    await supabase.storage.from("presentations").remove([presentation.pdf_path]);
  }

  // Cascade deletes sessions + reports via DB foreign keys
  const { error } = await supabase
    .from("presentations")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Could not delete presentation" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

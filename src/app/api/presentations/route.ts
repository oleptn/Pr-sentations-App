import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { extractSlideTexts } from "@/lib/pdf/extract-text";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 25 * 1024 * 1024;

const schema = z.object({
  title: z.string().min(1).max(200),
  context: z.string().max(2000).optional().nullable(),
  targetDurationMinutes: z.coerce.number().int().min(1).max(240),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const parsed = schema.safeParse({
    title: form.get("title"),
    context: form.get("context"),
    targetDurationMinutes: form.get("targetDurationMinutes"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 25MB)" }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Extract slide texts up front — needed for the report.
  let slideTexts: string[];
  try {
    slideTexts = await extractSlideTexts(buffer);
  } catch (e) {
    console.error("PDF parse failed", e);
    return NextResponse.json({ error: "Could not read PDF" }, { status: 400 });
  }
  if (slideTexts.length === 0) {
    return NextResponse.json({ error: "PDF has no pages" }, { status: 400 });
  }

  // Upload to Supabase Storage at "<uid>/<presentation-id>.pdf".
  const presentationId = crypto.randomUUID();
  const pdfPath = `${user.id}/${presentationId}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("presentations")
    .upload(pdfPath, buffer, {
      contentType: "application/pdf",
      upsert: false,
    });
  if (uploadError) {
    console.error("Upload failed", uploadError);
    return NextResponse.json({ error: "Could not save PDF" }, { status: 500 });
  }

  const { error: insertError, data: inserted } = await supabase
    .from("presentations")
    .insert({
      id: presentationId,
      user_id: user.id,
      title: parsed.data.title,
      context: parsed.data.context || null,
      target_duration_minutes: parsed.data.targetDurationMinutes,
      pdf_path: pdfPath,
      slide_count: slideTexts.length,
      slide_texts: slideTexts,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("DB insert failed", insertError);
    // Best-effort cleanup so we don't leave orphaned PDFs.
    await supabase.storage.from("presentations").remove([pdfPath]);
    return NextResponse.json({ error: "Could not save presentation" }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id });
}

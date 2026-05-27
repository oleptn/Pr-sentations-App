import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PracticeRoom } from "@/components/practice/practice-room";
import type { Presentation } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: presentation } = await supabase
    .from("presentations")
    .select("*")
    .eq("id", id)
    .single();
  if (!presentation) notFound();
  const p = presentation as Presentation;

  const { data: session, error } = await supabase
    .from("practice_sessions")
    .insert({
      presentation_id: p.id,
      user_id: user.id,
    })
    .select("id")
    .single();
  if (error || !session) {
    throw new Error("Could not start session");
  }

  return (
    <PracticeRoom
      presentationId={p.id}
      sessionId={session.id}
      slideCount={p.slide_count}
      targetMinutes={p.target_duration_minutes}
    />
  );
}

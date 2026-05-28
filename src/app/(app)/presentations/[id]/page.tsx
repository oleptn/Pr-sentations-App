import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, FileText, Play, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, formatSeconds } from "@/lib/utils";
import { DeleteSessionButton } from "@/components/session/DeleteSessionButton";
import type { Presentation, PracticeSession } from "@/types/database";

export default async function PresentationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: presentation } = await supabase
    .from("presentations")
    .select("*")
    .eq("id", id)
    .single();
  if (!presentation) notFound();
  const p = presentation as Presentation;

  const { data: sessions } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("presentation_id", id)
    .order("created_at", { ascending: false });
  const ss = (sessions ?? []) as PracticeSession[];

  return (
    <div className="space-y-10">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{p.title}</h1>
            {p.context && (
              <p className="mt-1 text-sm text-muted-foreground">{p.context}</p>
            )}
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <FileText className="size-3" />
                {p.slide_count} slides
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                Target {p.target_duration_minutes} min
              </span>
              <span>Uploaded {formatRelativeDate(p.created_at)}</span>
            </div>
          </div>
          <Link href={`/presentations/${p.id}/practice`}>
            <Button size="lg" className="gap-2">
              <Play className="size-4" />
              Start practice
            </Button>
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Practice sessions
          </h2>
        </div>
        {ss.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
            <Sparkles className="mx-auto mb-3 size-5 text-muted-foreground" />
            <div className="text-sm font-medium">No practice sessions yet</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Press &quot;Start practice&quot; when you&apos;re ready.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {ss.map((s) => (
              <SessionRow key={s.id} session={s} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SessionRow({ session }: { session: PracticeSession }) {
  const info = (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="font-medium">
          {new Date(session.started_at).toLocaleString()}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {session.total_duration_seconds
            ? `${formatSeconds(session.total_duration_seconds)} duration`
            : "—"}
        </div>
      </div>
    </div>
  );

  const row = (
    <div className="group flex items-center justify-between px-5 py-4 transition-colors hover:bg-accent/50">
      {info}
      <div className="flex items-center gap-3">
        <SessionBadge status={session.status} />
        <DeleteSessionButton sessionId={session.id} />
      </div>
    </div>
  );

  if (session.status === "completed") {
    return (
      <li>
        <Link href={`/sessions/${session.id}`}>{row}</Link>
      </li>
    );
  }
  return <li>{row}</li>;
}

function SessionBadge({ status }: { status: PracticeSession["status"] }) {
  if (status === "completed") return <Badge variant="success">Report ready</Badge>;
  if (status === "processing") return <Badge variant="warning">Processing…</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">In progress</Badge>;
}

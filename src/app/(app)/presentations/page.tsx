import Link from "next/link";
import { Plus, Play, BarChart2, Layers, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeletePresentationButton } from "@/components/presentation/DeletePresentationButton";
import { formatRelativeDate } from "@/lib/utils";
import type { Presentation, PracticeSession } from "@/types/database";

export default async function PresentationsPage() {
  const supabase = await createClient();

  const { data: presentationsRaw } = await supabase
    .from("presentations")
    .select("*")
    .order("created_at", { ascending: false });
  const presentations = (presentationsRaw ?? []) as Presentation[];

  const { data: sessionsRaw } = await supabase
    .from("practice_sessions")
    .select("id, presentation_id, status, started_at")
    .order("started_at", { ascending: false });
  const sessions = (sessionsRaw ?? []) as Pick<PracticeSession, "id" | "presentation_id" | "status" | "started_at">[];

  const sessionsByPresentation = new Map<string, typeof sessions>();
  for (const s of sessions) {
    const arr = sessionsByPresentation.get(s.presentation_id) ?? [];
    arr.push(s);
    sessionsByPresentation.set(s.presentation_id, arr);
  }

  function getStatus(pSessions: typeof sessions) {
    if (pSessions.length === 0) return { label: "New", variant: "secondary" as const };
    if (pSessions.some((s) => s.status === "completed")) return { label: "Practiced", variant: "success" as const };
    if (pSessions.some((s) => s.status === "in_progress" || s.status === "processing"))
      return { label: "In progress", variant: "warning" as const };
    return { label: "Needs work", variant: "destructive" as const };
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Presentations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {presentations.length} deck{presentations.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
        <Link href="/presentations/new">
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="size-4" />
            New presentation
          </Button>
        </Link>
      </div>

      {presentations.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-12 text-center">
          <p className="text-base font-semibold text-indigo-700">No presentations yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your slides to start practicing with AI feedback.
          </p>
          <Link href="/presentations/new" className="mt-4 inline-block">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Upload presentation
            </Button>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {presentations.map((p) => {
            const pSessions = sessionsByPresentation.get(p.id) ?? [];
            const status = getStatus(pSessions);
            const lastSession = pSessions[0] ?? null;
            const completedSessionId = pSessions.find((s) => s.status === "completed")?.id ?? null;

            return (
              <li key={p.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/presentations/${p.id}`} className="font-medium text-foreground hover:text-indigo-600 transition-colors truncate">
                      {p.title}
                    </Link>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Layers className="size-3" />{p.slide_count} slides
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3" />{p.target_duration_minutes} min
                    </span>
                    <span>
                      {lastSession ? `Last practiced ${formatRelativeDate(lastSession.started_at)}` : "Not practiced yet"}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {completedSessionId && (
                    <Link href={`/sessions/${completedSessionId}`}>
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <BarChart2 className="size-3.5" />
                        Feedback
                      </Button>
                    </Link>
                  )}
                  <Link href={`/presentations/${p.id}/practice`}>
                    <Button size="sm" className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
                      <Play className="size-3.5" />
                      Practice
                    </Button>
                  </Link>
                  <DeletePresentationButton presentationId={p.id} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

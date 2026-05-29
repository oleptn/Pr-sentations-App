import Link from "next/link";
import { BarChart2, Layers, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, formatSeconds } from "@/lib/utils";
import type { Presentation, PracticeSession } from "@/types/database";

export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: sessionsRaw } = await supabase
    .from("practice_sessions")
    .select("*")
    .order("started_at", { ascending: false });
  const sessions = (sessionsRaw ?? []) as PracticeSession[];

  const { data: presentationsRaw } = await supabase
    .from("presentations")
    .select("id, title")
    .order("created_at", { ascending: false });
  const presentations = (presentationsRaw ?? []) as Pick<Presentation, "id" | "title">[];
  const presentationMap = new Map(presentations.map((p) => [p.id, p]));

  function StatusBadge({ status }: { status: PracticeSession["status"] }) {
    if (status === "completed") return <Badge variant="success">Completed</Badge>;
    if (status === "processing") return <Badge variant="warning">Processing</Badge>;
    if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
    return <Badge variant="secondary">In progress</Badge>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Practice History</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-12 text-center">
          <p className="text-base font-semibold text-indigo-700">No sessions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice once to unlock your history, timing analysis, and AI insights.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {sessions.map((s) => {
            const presentation = presentationMap.get(s.presentation_id);
            return (
              <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-accent/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground truncate">
                    {presentation?.title ?? "Deleted presentation"}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatRelativeDate(s.started_at)}</span>
                    {s.total_duration_seconds && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatSeconds(s.total_duration_seconds)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={s.status} />
                  {s.status === "completed" && (
                    <Link
                      href={`/sessions/${s.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                    >
                      <BarChart2 className="size-3.5" />
                      View feedback
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

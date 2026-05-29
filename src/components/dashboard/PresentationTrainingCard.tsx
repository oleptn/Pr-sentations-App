import Link from "next/link";
import { Clock, Layers, Play, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeletePresentationButton } from "@/components/presentation/DeletePresentationButton";
import { formatRelativeDate } from "@/lib/utils";
import type { Presentation, PracticeSession } from "@/types/database";

interface PresentationTrainingCardProps {
  presentation: Presentation;
  sessions: PracticeSession[];
  latestCompletedSessionId: string | null;
}

function getStatus(sessions: PracticeSession[]): {
  label: string;
  variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
} {
  if (sessions.length === 0) return { label: "New", variant: "secondary" };
  const hasCompleted = sessions.some((s) => s.status === "completed");
  if (hasCompleted) return { label: "Practiced", variant: "success" };
  const hasActive = sessions.some(
    (s) => s.status === "in_progress" || s.status === "processing",
  );
  if (hasActive) return { label: "In progress", variant: "warning" };
  return { label: "Needs work", variant: "destructive" };
}

export function PresentationTrainingCard({
  presentation,
  sessions,
  latestCompletedSessionId,
}: PresentationTrainingCardProps) {
  const status = getStatus(sessions);
  const lastSession = sessions[0] ?? null;

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        <DeletePresentationButton presentationId={presentation.id} />
      </div>

      {/* Title */}
      <Link href={`/presentations/${presentation.id}`} className="mt-3 block">
        <h3 className="font-semibold leading-snug text-foreground hover:text-indigo-600 transition-colors">
          {presentation.title}
        </h3>
      </Link>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Layers className="size-3" />
          {presentation.slide_count} slides
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          {presentation.target_duration_minutes} min
        </span>
      </div>
      <div className="mt-1.5 text-xs text-muted-foreground">
        {lastSession
          ? `Last practiced ${formatRelativeDate(lastSession.started_at)}`
          : "Not practiced yet"}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 pt-3 border-t border-border">
        <Link href={`/presentations/${presentation.id}/practice`} className="flex-1">
          <Button size="sm" className="w-full gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white">
            <Play className="size-3.5" />
            Practice
          </Button>
        </Link>
        {latestCompletedSessionId ? (
          <Link href={`/sessions/${latestCompletedSessionId}`}>
            <Button size="sm" variant="outline" className="gap-1.5">
              <BarChart2 className="size-3.5" />
              Feedback
            </Button>
          </Link>
        ) : (
          <Button size="sm" variant="outline" disabled className="gap-1.5 opacity-40">
            <BarChart2 className="size-3.5" />
            Feedback
          </Button>
        )}
      </div>
    </div>
  );
}

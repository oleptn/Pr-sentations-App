import Link from "next/link";
import { ArrowRight, Clock, FileText, Layers, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";
import type { Presentation, PracticeSession } from "@/types/database";

interface NextPracticeCardProps {
  presentation: Presentation;
  lastSession: PracticeSession | null;
  latestCompletedSessionId: string | null;
}

export function NextPracticeCard({
  presentation,
  lastSession,
  latestCompletedSessionId,
}: NextPracticeCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 text-white shadow-lg sm:p-8">
      {/* Background decoration */}
      <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 opacity-10">
        <div className="absolute right-8 top-8 size-40 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-4 right-4 size-24 rounded-full bg-white blur-2xl" />
      </div>

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-200">
          Next up
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {presentation.title}
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-indigo-200">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3.5" />
            {presentation.slide_count} slides
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            Target {presentation.target_duration_minutes} min
          </span>
          {lastSession ? (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Last practiced {formatRelativeDate(lastSession.started_at)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5" />
              Not practiced yet
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href={`/presentations/${presentation.id}/practice`}>
            <Button size="lg" className="gap-2 bg-white text-indigo-700 hover:bg-indigo-50 font-semibold shadow-sm">
              <Play className="size-4" />
              Practice now
            </Button>
          </Link>
          {latestCompletedSessionId && (
            <Link href={`/sessions/${latestCompletedSessionId}`}>
              <Button size="lg" variant="ghost" className="gap-2 text-white hover:bg-white/15 hover:text-white">
                View feedback
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

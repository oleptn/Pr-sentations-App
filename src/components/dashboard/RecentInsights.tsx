import { Sparkles } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";

interface Insight {
  summary: string;
  presentationTitle: string;
  createdAt: string;
}

interface RecentInsightsProps {
  insights: Insight[];
}

export function RecentInsights({ insights }: RecentInsightsProps) {
  if (insights.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          <Sparkles className="size-5" />
        </div>
        <div className="font-medium text-foreground">No insights yet</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice once to unlock AI insights on your delivery, timing, and coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="mt-0.5 shrink-0 inline-flex size-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Sparkles className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm leading-relaxed text-foreground line-clamp-2">
              {insight.summary}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {insight.presentationTitle} · {formatRelativeDate(insight.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

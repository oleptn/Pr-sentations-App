import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, formatSeconds } from "@/lib/utils";
import type { PracticeSession } from "@/types/database";

interface HistoryItem {
  session: PracticeSession;
  presentationTitle: string;
}

interface PracticeHistoryListProps {
  items: HistoryItem[];
}

function StatusBadge({ status }: { status: PracticeSession["status"] }) {
  if (status === "completed") return <Badge variant="success">Done</Badge>;
  if (status === "processing") return <Badge variant="warning">Processing</Badge>;
  if (status === "failed") return <Badge variant="destructive">Failed</Badge>;
  return <Badge variant="secondary">In progress</Badge>;
}

export function PracticeHistoryList({ items }: PracticeHistoryListProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
        <div className="font-medium text-foreground">No sessions yet</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Your practice history will appear here after your first session.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {items.map(({ session, presentationTitle }) => (
        <li key={session.id} className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground truncate">
              {presentationTitle}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {formatRelativeDate(session.started_at)}
              {session.total_duration_seconds
                ? ` · ${formatSeconds(session.total_duration_seconds)}`
                : ""}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge status={session.status} />
            {session.status === "completed" && (
              <Link
                href={`/sessions/${session.id}`}
                className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
              >
                <BarChart2 className="size-3.5" />
                Feedback
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

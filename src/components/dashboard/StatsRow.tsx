import { Clock, Layers, Mic, Zap } from "lucide-react";

interface StatsRowProps {
  totalSessions: number;
  totalSeconds: number;
  presentationCount: number;
  sessionsThisWeek: number;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}

function StatCard({ icon, label, value, sub }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="inline-flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        <div className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsRow({ totalSessions, totalSeconds, presentationCount, sessionsThisWeek }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        icon={<Mic className="size-4" />}
        label="Practice sessions"
        value={String(totalSessions)}
        sub={totalSessions === 1 ? "session total" : "sessions total"}
      />
      <StatCard
        icon={<Clock className="size-4" />}
        label="Total practice time"
        value={totalSeconds > 0 ? formatDuration(totalSeconds) : "—"}
        sub="across all sessions"
      />
      <StatCard
        icon={<Layers className="size-4" />}
        label="Presentations"
        value={String(presentationCount)}
        sub={presentationCount === 1 ? "deck uploaded" : "decks uploaded"}
      />
      <StatCard
        icon={<Zap className="size-4" />}
        label="This week"
        value={String(sessionsThisWeek)}
        sub={sessionsThisWeek === 1 ? "session" : "sessions"}
      />
    </div>
  );
}

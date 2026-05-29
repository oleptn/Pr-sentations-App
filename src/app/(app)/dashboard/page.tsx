import { createClient } from "@/lib/supabase/server";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NextPracticeCard } from "@/components/dashboard/NextPracticeCard";
import { StatsRow } from "@/components/dashboard/StatsRow";
import { PresentationTrainingCard } from "@/components/dashboard/PresentationTrainingCard";
import { RecentInsights } from "@/components/dashboard/RecentInsights";
import { PracticeHistoryList } from "@/components/dashboard/PracticeHistoryList";
import type { Presentation, PracticeSession, AIReport } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  const emailPrefix = (user?.email ?? "there").split("@")[0];

  // Fetch all presentations
  const { data: presentationsRaw } = await supabase
    .from("presentations")
    .select("*")
    .order("created_at", { ascending: false });
  const presentations = (presentationsRaw ?? []) as Presentation[];

  // Fetch all sessions
  const { data: sessionsRaw } = await supabase
    .from("practice_sessions")
    .select("*")
    .order("started_at", { ascending: false });
  const sessions = (sessionsRaw ?? []) as PracticeSession[];

  // Fetch recent ai_reports (last 3) with session info
  const { data: reportsRaw } = await supabase
    .from("ai_reports")
    .select("id, session_id, overall_summary, created_at")
    .not("overall_summary", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);
  const reports = (reportsRaw ?? []) as Pick<AIReport, "id" | "session_id" | "overall_summary" | "created_at">[];

  // --- Derived data ---

  // Map sessions by presentation id
  const sessionsByPresentation = new Map<string, PracticeSession[]>();
  for (const s of sessions) {
    const arr = sessionsByPresentation.get(s.presentation_id) ?? [];
    arr.push(s);
    sessionsByPresentation.set(s.presentation_id, arr);
  }

  // Stats
  const totalSessions = sessions.length;
  const totalSeconds = sessions.reduce((acc, s) => acc + (s.total_duration_seconds ?? 0), 0);
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const sessionsThisWeek = sessions.filter(
    (s) => new Date(s.started_at) >= oneWeekAgo,
  ).length;

  // Next practice — most recently updated presentation (first in list)
  const nextPresentation = presentations[0] ?? null;
  const nextPresentationSessions = nextPresentation
    ? (sessionsByPresentation.get(nextPresentation.id) ?? [])
    : [];
  const nextLastSession = nextPresentationSessions[0] ?? null;
  const nextCompletedSession =
    nextPresentationSessions.find((s) => s.status === "completed") ?? null;

  // Primary CTA href
  const primaryHref = nextPresentation
    ? `/presentations/${nextPresentation.id}/practice`
    : "/presentations/new";

  // Latest completed session id per presentation
  function latestCompleted(presentationId: string): string | null {
    const ps = sessionsByPresentation.get(presentationId) ?? [];
    return ps.find((s) => s.status === "completed")?.id ?? null;
  }

  // Recent insights: map report session_id → presentation title
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const presentationMap = new Map(presentations.map((p) => [p.id, p]));
  const insights = reports.map((r) => {
    const session = sessionMap.get(r.session_id);
    const presentation = session ? presentationMap.get(session.presentation_id) : null;
    return {
      summary: (r.overall_summary ?? "").slice(0, 140),
      presentationTitle: presentation?.title ?? "Unknown",
      createdAt: r.created_at,
    };
  });

  // Practice history — last 5 sessions
  const historyItems = sessions.slice(0, 5).map((s) => ({
    session: s,
    presentationTitle:
      presentationMap.get(s.presentation_id)?.title ?? "Deleted presentation",
  }));

  return (
    <div className="space-y-10">
      {/* 1. Header */}
      <DashboardHeader emailPrefix={emailPrefix} primaryHref={primaryHref} />

      {/* 2. Next up card */}
      {nextPresentation ? (
        <NextPracticeCard
          presentation={nextPresentation}
          lastSession={nextLastSession}
          latestCompletedSessionId={nextCompletedSession?.id ?? null}
        />
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-10 text-center">
          <p className="text-base font-semibold text-indigo-700">Start your first training session</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload your slides and practice with AI feedback.
          </p>
          <a
            href="/presentations/new"
            className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            Upload presentation
          </a>
        </div>
      )}

      {/* 3. Stats */}
      <StatsRow
        totalSessions={totalSessions}
        totalSeconds={totalSeconds}
        presentationCount={presentations.length}
        sessionsThisWeek={sessionsThisWeek}
      />

      {/* 4. Presentations grid */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Your presentations
        </h2>
        {presentations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            No presentations yet. Upload your first deck to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {presentations.map((p) => (
              <PresentationTrainingCard
                key={p.id}
                presentation={p}
                sessions={sessionsByPresentation.get(p.id) ?? []}
                latestCompletedSessionId={latestCompleted(p.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5 + 6. Insights & History side by side on desktop */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Recent insights
          </h2>
          <RecentInsights insights={insights} />
        </section>

        <section id="history">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Practice history
          </h2>
          <PracticeHistoryList items={historyItems} />
        </section>
      </div>
    </div>
  );
}

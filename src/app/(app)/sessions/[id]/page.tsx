import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import {
  CoverageSection,
  DeliverySection,
  QuestionsSection,
  StructureSection,
  TimingSection,
} from "@/components/report/sections";
import { formatSeconds } from "@/lib/utils";
import type {
  AIReport,
  PracticeSession,
  Presentation,
} from "@/types/database";

export default async function SessionReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: session } = await supabase
    .from("practice_sessions")
    .select("*")
    .eq("id", id)
    .single<PracticeSession>();
  if (!session) notFound();

  const { data: presentation } = await supabase
    .from("presentations")
    .select("*")
    .eq("id", session.presentation_id)
    .single<Presentation>();
  if (!presentation) notFound();

  const { data: report } = await supabase
    .from("ai_reports")
    .select("*")
    .eq("session_id", id)
    .maybeSingle<AIReport>();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/presentations/${presentation.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to presentation
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {presentation.title} — feedback
        </h1>
        <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{new Date(session.started_at).toLocaleString()}</span>
          {session.total_duration_seconds !== null && (
            <span>{formatSeconds(session.total_duration_seconds)} spoken</span>
          )}
          <span>{session.status}</span>
        </div>
      </div>

      {session.status === "failed" ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm">
              This session failed to process. The most common cause is a missing
              transcript — please try practicing again with your microphone on.
            </p>
          </CardContent>
        </Card>
      ) : !report || session.status === "processing" ? (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Report is still being generated. Refresh in a moment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {report.overall_summary && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Overall
                </div>
                <p className="text-sm leading-relaxed">
                  {report.overall_summary}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {report.coverage && (
              <CoverageSection
                items={report.coverage.items}
                summary={report.coverage.summary}
              />
            )}
            {report.timing && (
              <TimingSection
                items={report.timing.items}
                totalActual={report.timing.total_actual_seconds}
                totalTarget={report.timing.total_target_seconds}
                overallAssessment={report.timing.overall_assessment}
              />
            )}
            {report.delivery && <DeliverySection analysis={report.delivery} />}
            {report.structure && (
              <StructureSection analysis={report.structure} />
            )}
          </div>

          {report.questions && report.questions.length > 0 && (
            <QuestionsSection items={report.questions} />
          )}

          {session.transcript && (
            <Card>
              <CardContent className="p-6">
                <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Transcript
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                  {session.transcript}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

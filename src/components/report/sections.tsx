import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatSeconds } from "@/lib/utils";
import {
  CheckCircle2,
  CircleAlert,
  CircleOff,
  Clock3,
  Mic,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import type {
  CoverageItem,
  DeliveryAnalysis,
  StructureAnalysis,
  TimingItem,
} from "@/types/database";

export function CoverageSection({
  items,
  summary,
}: {
  items: CoverageItem[];
  summary: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Information coverage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={item.slide}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Slide {item.slide}</div>
                <CoverageBadge status={item.status} />
              </div>
              {item.comment && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.comment}
                </p>
              )}
              {item.covered_points.length > 0 && (
                <PointList
                  label="Covered"
                  icon={<CheckCircle2 className="size-3 text-emerald-600" />}
                  items={item.covered_points}
                />
              )}
              {item.missed_points.length > 0 && (
                <PointList
                  label="Missed or weak"
                  icon={<CircleAlert className="size-3 text-amber-600" />}
                  items={item.missed_points}
                />
              )}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CoverageBadge({ status }: { status: CoverageItem["status"] }) {
  if (status === "well_covered")
    return <Badge variant="success">Well covered</Badge>;
  if (status === "briefly_mentioned")
    return <Badge variant="warning">Briefly mentioned</Badge>;
  return <Badge variant="destructive">Skipped</Badge>;
}

function PointList({
  label,
  icon,
  items,
}: {
  label: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <ul className="space-y-1">
        {items.map((p, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1">{icon}</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TimingSection({
  items,
  totalActual,
  totalTarget,
  overallAssessment,
}: {
  items: TimingItem[];
  totalActual: number;
  totalTarget: number;
  overallAssessment: string;
}) {
  const overPct = Math.min(
    200,
    Math.round((totalActual / Math.max(1, totalTarget)) * 100),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock3 className="size-4" />
          Time management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-2xl font-semibold tabular-nums">
                {formatSeconds(totalActual)}
              </div>
              <div className="text-xs text-muted-foreground">
                Target {formatSeconds(totalTarget)}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">{overPct}% of target</div>
          </div>
          <Progress value={Math.min(100, overPct)} className="mt-3" />
          <p className="mt-3 text-sm">{overallAssessment}</p>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.slide}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
            >
              <div className="w-12 shrink-0 font-mono text-xs text-muted-foreground">
                Slide {item.slide}
              </div>
              <div className="w-20 shrink-0 font-mono text-sm tabular-nums">
                {item.duration_seconds.toFixed(1)}s
              </div>
              <TimingBadge assessment={item.assessment} />
              <div className="text-sm text-muted-foreground">{item.comment}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TimingBadge({ assessment }: { assessment: TimingItem["assessment"] }) {
  if (assessment === "balanced")
    return <Badge variant="success">Balanced</Badge>;
  if (assessment === "too_long") return <Badge variant="warning">Too long</Badge>;
  return <Badge variant="destructive">Too short</Badge>;
}

export function DeliverySection({ analysis }: { analysis: DeliveryAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="size-4" />
          Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Filler words"
            value={String(analysis.filler_word_count)}
            sub={analysis.filler_examples.slice(0, 3).join(", ") || "—"}
          />
          <Stat
            label="Pace"
            value={`${Math.round(analysis.pace_words_per_minute)} wpm`}
            sub={paceLabel(analysis.pace_assessment)}
          />
        </div>
        {analysis.repetition_notes && (
          <Block title="Repetition" text={analysis.repetition_notes} />
        )}
        {analysis.clarity_notes && (
          <Block title="Clarity" text={analysis.clarity_notes} />
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {sub && (
        <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{sub}</div>
      )}
    </div>
  );
}

function paceLabel(p: DeliveryAnalysis["pace_assessment"]) {
  if (p === "good") return "Good pace";
  if (p === "too_fast") return "A bit fast";
  return "A bit slow";
}

function Block({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <p className="mt-1 text-sm">{text}</p>
    </div>
  );
}

export function StructureSection({ analysis }: { analysis: StructureAnalysis }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" />
          Structure
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <ScoreCard label="Flow" value={analysis.flow_score} />
          <ScoreCard
            label="Main argument clarity"
            value={analysis.main_argument_clarity}
          />
        </div>
        {analysis.strengths.length > 0 && (
          <PointList
            label="Strengths"
            icon={<CheckCircle2 className="size-3 text-emerald-600" />}
            items={analysis.strengths}
          />
        )}
        {analysis.weaknesses.length > 0 && (
          <PointList
            label="Weaknesses"
            icon={<CircleAlert className="size-3 text-amber-600" />}
            items={analysis.weaknesses}
          />
        )}
        {analysis.improvement_suggestions.length > 0 && (
          <PointList
            label="Improve next time"
            icon={<CircleOff className="size-3 text-sky-600" />}
            items={analysis.improvement_suggestions}
          />
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(10, value)) * 10;
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-xl font-semibold tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">/ 10</span>
      </div>
      <Progress value={pct} className="mt-2" />
    </div>
  );
}

export function QuestionsSection({
  items,
}: {
  items: { question: string; rationale: string }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="size-4" />
          Audience questions to prepare for
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {items.map((q, i) => (
            <li key={i} className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-mono text-muted-foreground">
                  Q{i + 1}
                </span>
                <p className="text-sm font-medium leading-snug">{q.question}</p>
              </div>
              {q.rationale && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {q.rationale}
                </p>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

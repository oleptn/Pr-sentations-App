import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FileText, Clock } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import type { Presentation } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: presentations } = await supabase
    .from("presentations")
    .select("*")
    .order("created_at", { ascending: false });

  const items = (presentations ?? []) as Presentation[];

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Your presentations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload slides, practice, and review your feedback.
          </p>
        </div>
        <Link href="/presentations/new">
          <Button className="gap-2">
            <Plus className="size-4" />
            New presentation
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PresentationCard key={p.id} presentation={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function PresentationCard({ presentation }: { presentation: Presentation }) {
  return (
    <Link href={`/presentations/${presentation.id}`}>
      <Card className="transition-colors hover:border-foreground/20">
        <CardContent className="p-5">
          <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-secondary">
            <FileText className="size-4" />
          </div>
          <div className="font-medium leading-tight">{presentation.title}</div>
          {presentation.context && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {presentation.context}
            </p>
          )}
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileText className="size-3" />
              {presentation.slide_count} slides
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" />
              {presentation.target_duration_minutes} min
            </span>
            <span>{formatRelativeDate(presentation.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-secondary">
        <FileText className="size-5" />
      </div>
      <div className="text-base font-medium">No presentations yet</div>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        Upload your first PDF and start practicing. Your sessions and feedback will
        live here.
      </p>
      <Link href="/presentations/new" className="mt-6 inline-block">
        <Button>Upload a presentation</Button>
      </Link>
    </div>
  );
}

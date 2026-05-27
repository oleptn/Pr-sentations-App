import Link from "next/link";
import { ArrowRight, Mic, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-base font-semibold tracking-tight">PresentAI</div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 pt-24 pb-16 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="size-3" />
          AI-powered presentation coach
        </div>
        <h1 className="text-5xl font-semibold tracking-tight leading-[1.05] text-foreground sm:text-6xl">
          Practice your presentation.
          <br />
          <span className="text-muted-foreground">Get feedback that matters.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          Upload your slides, practice out loud, and receive specific, actionable
          feedback on coverage, timing, delivery, and structure.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/signup">
            <Button size="lg" className="gap-2">
              Start practicing <ArrowRight className="size-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          <Feature
            icon={<FileText className="size-5" />}
            title="Upload your slides"
            body="Drop in a PDF. We'll render your deck and extract the content."
          />
          <Feature
            icon={<Mic className="size-5" />}
            title="Practice naturally"
            body="A distraction-free room records your voice while you click through slides."
          />
          <Feature
            icon={<Sparkles className="size-5" />}
            title="Specific feedback"
            body="Coverage gaps, pacing, filler words, and the questions a tough audience would ask."
          />
        </div>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 inline-flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground">
        {icon}
      </div>
      <div className="font-medium">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{body}</div>
    </div>
  );
}

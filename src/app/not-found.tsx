import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        404
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        It may have been removed, or the link is wrong.
      </p>
      <Link href="/dashboard" className="mt-6">
        <Button>Back to dashboard</Button>
      </Link>
    </main>
  );
}

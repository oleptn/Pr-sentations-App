"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppNav({ email }: { email: string | null }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
          PresentAI
        </Link>
        <div className="flex items-center gap-3">
          {email && (
            <span className="hidden text-xs text-muted-foreground sm:block">
              {email}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

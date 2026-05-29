import Link from "next/link";
import { Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  emailPrefix: string;
  primaryHref: string;
}

export function DashboardHeader({ emailPrefix, primaryHref }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-indigo-600">Training Dashboard</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {emailPrefix}
        </h1>
        <p className="mt-1.5 text-base text-muted-foreground">
          Ready for your next practice session?
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/presentations/new">
          <Button variant="outline" className="gap-2">
            <Upload className="size-4" />
            Upload slides
          </Button>
        </Link>
        <Link href={primaryHref}>
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Play className="size-4" />
            Start practice
          </Button>
        </Link>
      </div>
    </div>
  );
}

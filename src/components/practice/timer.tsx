"use client";

import { useEffect, useState } from "react";
import { formatSeconds } from "@/lib/utils";

type Props = {
  startedAt: number | null;
  isPaused: boolean;
  pausedElapsedMs: number;
  targetMinutes: number;
};

export function Timer({ startedAt, isPaused, pausedElapsedMs, targetMinutes }: Props) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isPaused || startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [isPaused, startedAt]);

  const elapsedMs =
    startedAt === null ? pausedElapsedMs : isPaused ? pausedElapsedMs : pausedElapsedMs + (now - startedAt);
  const seconds = Math.floor(elapsedMs / 1000);
  const targetSeconds = targetMinutes * 60;
  const over = seconds > targetSeconds;
  const remaining = Math.max(0, targetSeconds - seconds);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`font-mono text-3xl font-semibold tabular-nums ${
          over ? "text-amber-500" : "text-foreground"
        }`}
      >
        {formatSeconds(seconds)}
      </div>
      <div className="text-xs text-muted-foreground">
        {over ? "over target" : `${formatSeconds(remaining)} remaining`}
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatSeconds(totalSeconds: number) {
  const mm = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mm}:${ss}`;
}

export function formatRelativeDate(iso: string) {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return date.toLocaleDateString();
}

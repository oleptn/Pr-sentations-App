"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Square,
  Mic,
  MicOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Timer } from "@/components/practice/timer";
import type { SlideTiming } from "@/types/database";

const PDFViewer = dynamic(
  () => import("@/components/practice/pdf-viewer").then((m) => m.PDFViewer),
  { ssr: false },
);

type Props = {
  presentationId: string;
  sessionId: string;
  slideCount: number;
  targetMinutes: number;
};

type Phase = "ready" | "running" | "paused" | "ending";

export function PracticeRoom({
  presentationId,
  sessionId,
  slideCount,
  targetMinutes,
}: Props) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("ready");
  const [slide, setSlide] = useState(1);
  const [micReady, setMicReady] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  // Timer state: pausedElapsedMs = time accumulated before the current "running" segment.
  // When running, startedAt is set; total = pausedElapsedMs + (now - startedAt).
  // When paused, startedAt is null and pausedElapsedMs holds the snapshot.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedElapsedMs, setPausedElapsedMs] = useState(0);

  // Slide timings — kept in a ref to avoid stale closures.
  const timingsRef = useRef<SlideTiming[]>([]);
  // Cursor tracks where the current slide segment started, in elapsed-ms terms.
  const segmentStartElapsedRef = useRef(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const pdfUrl = useMemo(
    () => `/api/presentations/${presentationId}/pdf`,
    [presentationId],
  );

  // Helper — current elapsed ms (live).
  const currentElapsedMs = useCallback(() => {
    if (startedAt === null) return pausedElapsedMs;
    return pausedElapsedMs + (Date.now() - startedAt);
  }, [startedAt, pausedElapsedMs]);

  // -- Mic permission upfront -----------------------------------------------
  const requestMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setMicReady(true);
      setMicError(null);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not access microphone";
      setMicError(msg);
      setMicReady(false);
    }
  }, []);

  useEffect(() => {
    requestMic();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -- Slide change recording -----------------------------------------------
  const recordSegmentBoundary = useCallback(
    (newSlide: number) => {
      const elapsedNow = currentElapsedMs();
      const startMs = segmentStartElapsedRef.current;
      const endMs = elapsedNow;
      timingsRef.current.push({
        slide,
        startMs,
        endMs,
        durationMs: Math.max(0, endMs - startMs),
      });
      segmentStartElapsedRef.current = elapsedNow;
      setSlide(newSlide);
    },
    [slide, currentElapsedMs],
  );

  // -- Start ----------------------------------------------------------------
  const start = useCallback(() => {
    if (!streamRef.current) {
      toast.error("Microphone not ready");
      return;
    }
    try {
      const mr = new MediaRecorder(streamRef.current, {
        mimeType: pickMimeType(),
      });
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      mr.start(1000); // gather a chunk every second
      mediaRecorderRef.current = mr;
    } catch (e) {
      console.error(e);
      toast.error("Could not start recording");
      return;
    }
    setStartedAt(Date.now());
    setPhase("running");
  }, []);

  // -- Pause / Resume -------------------------------------------------------
  const pause = useCallback(() => {
    if (phase !== "running" || startedAt === null) return;
    const elapsed = pausedElapsedMs + (Date.now() - startedAt);
    setPausedElapsedMs(elapsed);
    setStartedAt(null);
    setPhase("paused");
    mediaRecorderRef.current?.pause();
  }, [phase, startedAt, pausedElapsedMs]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    setStartedAt(Date.now());
    setPhase("running");
    mediaRecorderRef.current?.resume();
  }, [phase]);

  // -- Navigation -----------------------------------------------------------
  const next = useCallback(() => {
    if (phase !== "running") return;
    if (slide >= slideCount) return;
    recordSegmentBoundary(slide + 1);
  }, [phase, slide, slideCount, recordSegmentBoundary]);

  const prev = useCallback(() => {
    if (phase !== "running") return;
    if (slide <= 1) return;
    recordSegmentBoundary(slide - 1);
  }, [phase, slide, recordSegmentBoundary]);

  // Keyboard shortcuts: arrows + space (pause).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.code === "Space") {
        e.preventDefault();
        if (phase === "running") pause();
        else if (phase === "paused") resume();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, pause, resume, phase]);

  // -- End ------------------------------------------------------------------
  const end = useCallback(async () => {
    if (phase === "ready" || phase === "ending") return;

    // Close out the final slide segment.
    const elapsedFinal = currentElapsedMs();
    timingsRef.current.push({
      slide,
      startMs: segmentStartElapsedRef.current,
      endMs: elapsedFinal,
      durationMs: Math.max(0, elapsedFinal - segmentStartElapsedRef.current),
    });

    setPhase("ending");
    if (startedAt !== null) {
      setPausedElapsedMs(elapsedFinal);
      setStartedAt(null);
    }

    // Stop the recorder & wait for final blob.
    const mr = mediaRecorderRef.current;
    const audioBlob = await new Promise<Blob | null>((resolve) => {
      if (!mr || mr.state === "inactive") {
        resolve(buildBlob());
        return;
      }
      mr.onstop = () => resolve(buildBlob());
      try {
        mr.stop();
      } catch {
        resolve(buildBlob());
      }
    });
    streamRef.current?.getTracks().forEach((t) => t.stop());

    const totalSeconds = Math.round(elapsedFinal / 1000);

    try {
      // 1. Upload audio for Whisper transcription.
      if (audioBlob && audioBlob.size > 0) {
        const fd = new FormData();
        fd.append(
          "audio",
          audioBlob,
          `session-${sessionId}.${mr?.mimeType.includes("mp4") ? "m4a" : "webm"}`,
        );
        const r = await fetch(`/api/sessions/${sessionId}/transcribe`, {
          method: "POST",
          body: fd,
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Transcription failed");
        }
      }

      // 2. Finalize timings + duration.
      const finalizeRes = await fetch(`/api/sessions/${sessionId}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideTimings: timingsRef.current,
          totalDurationSeconds: totalSeconds,
        }),
      });
      if (!finalizeRes.ok) {
        const body = await finalizeRes.json().catch(() => ({}));
        throw new Error(body.error || "Could not save session");
      }

      // 3. Generate the AI report.
      const reportRes = await fetch(`/api/sessions/${sessionId}/report`, {
        method: "POST",
      });
      if (!reportRes.ok) {
        const body = await reportRes.json().catch(() => ({}));
        throw new Error(body.error || "Could not generate report");
      }

      router.push(`/sessions/${sessionId}`);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
      setPhase("paused");
    }

    function buildBlob() {
      if (audioChunksRef.current.length === 0) return null;
      const mime = mr?.mimeType || "audio/webm";
      return new Blob(audioChunksRef.current, { type: mime });
    }
  }, [phase, slide, sessionId, startedAt, currentElapsedMs, router]);

  // ---- UI -----------------------------------------------------------------
  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-3">
        <div className="flex items-center gap-2">
          {phase === "running" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
              <span className="size-2 animate-pulse rounded-full bg-red-500" />
              Recording
            </span>
          ) : phase === "paused" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400">
              <Pause className="size-3" />
              Paused
            </span>
          ) : phase === "ending" ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              <Loader2 className="size-3 animate-spin" />
              Generating report…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
              {micReady ? (
                <>
                  <Mic className="size-3" />
                  Ready
                </>
              ) : micError ? (
                <>
                  <MicOff className="size-3 text-red-400" />
                  Mic blocked
                </>
              ) : (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Requesting mic…
                </>
              )}
            </span>
          )}
        </div>
        <Timer
          startedAt={startedAt}
          isPaused={phase !== "running"}
          pausedElapsedMs={pausedElapsedMs}
          targetMinutes={targetMinutes}
        />
        <div className="w-24" />
      </div>

      {/* Main row */}
      <div className="flex min-h-0 flex-1">
        {/* Left rail: slide indicator */}
        <aside className="hidden w-32 flex-col items-center justify-center border-r border-zinc-800 px-4 sm:flex">
          <div className="text-xs uppercase tracking-wider text-zinc-500">Slide</div>
          <div className="mt-1 font-mono text-4xl font-semibold tabular-nums">
            {slide}
          </div>
          <div className="text-xs text-zinc-500">of {slideCount}</div>
        </aside>

        {/* Slide viewer */}
        <div className="flex flex-1 items-center justify-center overflow-hidden bg-zinc-950 p-6">
          <div className="w-full max-w-5xl">
            <PDFViewer fileUrl={pdfUrl} pageNumber={slide} />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-zinc-800 bg-zinc-900/60 px-6 py-4">
        {phase === "ready" ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              size="xl"
              onClick={start}
              disabled={!micReady}
              className="bg-white text-zinc-900 hover:bg-zinc-200"
            >
              <Play className="size-4" />
              Start presentation
            </Button>
            {micError && (
              <span className="text-xs text-red-400">
                Mic access required: {micError}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="lg"
                onClick={prev}
                disabled={phase !== "running" || slide <= 1}
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={next}
                disabled={phase !== "running" || slide >= slideCount}
                className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {phase === "paused" ? (
                <Button
                  size="lg"
                  onClick={resume}
                  className="bg-white text-zinc-900 hover:bg-zinc-200"
                >
                  <Play className="size-4" />
                  Resume
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={pause}
                  disabled={phase !== "running"}
                  className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                  <Pause className="size-4" />
                  Pause
                </Button>
              )}
              <Button
                variant="destructive"
                size="lg"
                onClick={end}
                disabled={phase === "ending"}
              >
                {phase === "ending" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Square className="size-4" />
                )}
                End session
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) {
      return c;
    }
  }
  return "";
}

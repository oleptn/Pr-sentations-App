"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeletePresentationButton({ presentationId }: { presentationId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await fetch(`/api/presentations/${presentationId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div
        className="flex items-center gap-2"
        onClick={(e) => e.preventDefault()}
      >
        <span className="text-xs text-muted-foreground">Löschen?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {loading ? "…" : "Ja"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-muted-foreground hover:underline"
        >
          Nein
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirming(true); }}
      className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
      aria-label="Präsentation löschen"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

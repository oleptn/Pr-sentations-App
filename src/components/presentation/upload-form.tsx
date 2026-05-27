"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText } from "lucide-react";

const MAX_BYTES = 25 * 1024 * 1024;

export function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [duration, setDuration] = useState(10);
  const [file, setFile] = useState<File | null>(null);
  const [pending, startTransition] = useTransition();

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) return setFile(null);
    if (f.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      e.target.value = "";
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("PDF must be 25MB or smaller for the MVP.");
      e.target.value = "";
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.pdf$/i, ""));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Pick a PDF first.");
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("context", context);
      fd.append("targetDurationMinutes", String(duration));

      const res = await fetch("/api/presentations", { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.error || "Upload failed");
        return;
      }
      const { id } = await res.json();
      toast.success("Presentation uploaded.");
      router.push(`/presentations/${id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="file">Slides (PDF)</Label>
        <label
          htmlFor="file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-card px-6 py-10 text-center transition-colors hover:border-foreground/30"
        >
          {file ? (
            <>
              <FileText className="size-6 text-foreground" />
              <div className="text-sm font-medium">{file.name}</div>
              <div className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(1)} MB · click to change
              </div>
            </>
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground" />
              <div className="text-sm font-medium">Click to upload</div>
              <div className="text-xs text-muted-foreground">PDF up to 25MB</div>
            </>
          )}
          <input
            id="file"
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={onFileChange}
          />
        </label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Q3 Marketing Strategy"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">Context (optional)</Label>
        <Textarea
          id="context"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g. University presentation for economics seminar"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Helps the AI tailor feedback to your audience.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Target duration</Label>
        <div className="flex items-center gap-3">
          <Input
            id="duration"
            type="number"
            min={1}
            max={240}
            required
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-24"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
      </div>

      <Button type="submit" disabled={pending || !file} className="w-full">
        {pending ? "Uploading…" : "Create presentation"}
      </Button>
    </form>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadForm } from "@/components/presentation/upload-form";

export default function NewPresentationPage() {
  return (
    <div className="mx-auto max-w-xl space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          New presentation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF and give us a bit of context.
        </p>
      </div>
      <UploadForm />
    </div>
  );
}

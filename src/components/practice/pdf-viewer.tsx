"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// The worker file is copied into /public by scripts/copy-pdf-worker.mjs.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type Props = {
  fileUrl: string;
  pageNumber: number;
  onLoad?: (numPages: number) => void;
};

export function PDFViewer({ fileUrl, pageNumber, onLoad }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(800);

  useEffect(() => {
    function update() {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        setWidth(Math.min(w, 1200));
      }
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <div ref={containerRef} className="flex w-full items-center justify-center">
      <Document
        file={fileUrl}
        loading={<DocLoading />}
        error={<DocError />}
        onLoadSuccess={(doc) => onLoad?.(doc.numPages)}
      >
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          loading={<DocLoading />}
        />
      </Document>
    </div>
  );
}

function DocLoading() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center text-sm text-muted-foreground">
      Loading slides…
    </div>
  );
}

function DocError() {
  return (
    <div className="flex h-[60vh] w-full items-center justify-center text-sm text-destructive">
      Could not load PDF
    </div>
  );
}

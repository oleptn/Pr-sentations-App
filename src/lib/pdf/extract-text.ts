import "server-only";

type TextItem = { str?: string };

/**
 * Extract text from a PDF buffer, returning one string per page.
 * Uses the legacy build of pdfjs-dist which runs in Node without a DOM.
 */
export async function extractSlideTexts(buffer: Buffer): Promise<string[]> {
  // Dynamic import — pdfjs is ESM-only.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // Disable the worker — we run in a single Node process.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (pdfjs as any).GlobalWorkerOptions.workerSrc = "";

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
  });
  const doc = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = (content.items as TextItem[])
      .map((item) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    pages.push(text);
  }
  await doc.destroy();
  return pages;
}

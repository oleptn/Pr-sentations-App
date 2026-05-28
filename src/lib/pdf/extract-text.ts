import "server-only";

type TextItem = { str?: string };

export async function extractSlideTexts(buffer: Buffer): Promise<string[]> {
  // Try pdfjs first (per-page extraction)
  try {
    return await extractWithPdfjs(buffer);
  } catch {
    // Fall back to pdf-parse if pdfjs fails
    return await extractWithPdfParse(buffer);
  }
}

async function extractWithPdfjs(buffer: Buffer): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // pdfjs 4.x: point workerSrc at the bundled worker file
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = pdfjs as any;
  if (!g.GlobalWorkerOptions.workerSrc) {
    const { fileURLToPath } = await import("url");
    const { resolve } = await import("path");
    const workerPath = resolve("node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
    g.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;
  }

  const data = new Uint8Array(buffer);
  const doc = await pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: false,
    isEvalSupported: false,
  }).promise;

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

async function extractWithPdfParse(buffer: Buffer): Promise<string[]> {
  // pdf-parse doesn't natively split per-page, but we can use its pagerender callback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const pages: string[] = [];

  await pdfParse(buffer, {
    pagerender: async (pageData: { getTextContent: () => Promise<{ items: TextItem[] }> }) => {
      const content = await pageData.getTextContent();
      const text = content.items
        .map((item) => item.str ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push(text);
      return text;
    },
  });

  return pages.length > 0 ? pages : [""];
}

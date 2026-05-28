import "server-only";

export async function extractSlideTexts(buffer: Buffer): Promise<string[]> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { totalPages, text } = await extractText(pdf, { mergePages: false });
  if (totalPages === 0) return [];
  return (text as string[]).map((t) => t.replace(/\s+/g, " ").trim());
}

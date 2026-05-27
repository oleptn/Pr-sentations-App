#!/usr/bin/env node
// Copies the pdfjs worker into /public so the browser can load it as a static asset.
// react-pdf needs the worker URL at runtime; bundling it as an ES module breaks
// on the Next.js webpack/Turbopack server build, so we serve it as a public file.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const src = join(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = join(root, "public");
const dest = join(destDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.warn(`[setup:pdfworker] source missing: ${src}`);
  process.exit(0);
}
mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[setup:pdfworker] copied ${src} → ${dest}`);

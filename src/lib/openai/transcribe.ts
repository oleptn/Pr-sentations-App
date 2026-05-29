import { toFile } from "openai/uploads";
import { getOpenAI, WHISPER_MODEL } from "./client";

const EXT_TO_MIME: Record<string, string> = {
  webm: "audio/webm",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  mpga: "audio/mpeg",
};

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
): Promise<string> {
  const openai = getOpenAI();
  const ext = filename.split(".").pop()?.toLowerCase() ?? "webm";
  const mimeType = EXT_TO_MIME[ext] ?? "audio/webm";
  const file = await toFile(audioBuffer, filename, { type: mimeType });
  const result = await openai.audio.transcriptions.create({
    model: WHISPER_MODEL,
    file,
    response_format: "text",
  });
  // SDK returns the raw string when response_format is "text".
  return typeof result === "string" ? result : (result as { text: string }).text;
}

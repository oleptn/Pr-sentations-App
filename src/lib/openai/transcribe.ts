import { toFile } from "openai/uploads";
import { getOpenAI, WHISPER_MODEL } from "./client";

export async function transcribeAudio(
  audioBuffer: Buffer,
  filename: string,
): Promise<string> {
  const openai = getOpenAI();
  const file = await toFile(audioBuffer, filename);
  const result = await openai.audio.transcriptions.create({
    model: WHISPER_MODEL,
    file,
    response_format: "text",
  });
  // SDK returns the raw string when response_format is "text".
  return typeof result === "string" ? result : (result as { text: string }).text;
}

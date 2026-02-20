import { Readable } from "stream";
import { toFile } from "groq-sdk";
import { env } from "../config/env";
import { groq } from "../config/groq";

export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  const file = await toFile(Readable.from(audioBuffer), "audio.webm", {
    type: "audio/webm",
  });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: env.GROQ_STT_MODEL,
    language: "en",
  });

  return transcription.text;
};

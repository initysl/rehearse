import OpenAI from "openai";
import { env } from "../config/env";
import { Readable } from "stream";
import { toFile } from "openai";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const transcribeAudio = async (audioBuffer: Buffer): Promise<string> => {
  const file = await toFile(Readable.from(audioBuffer), "audio.webm", {
    type: "audio/webm",
  });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
  });

  return transcription.text;
};

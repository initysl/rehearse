import OpenAI from "openai";
import { env } from "../config/env";

const groqTts = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export const convertToSpeech = async (text: string): Promise<Buffer> => {
  const response = await groqTts.audio.speech.create({
    model: env.GROQ_TTS_MODEL,
    voice: env.GROQ_TTS_VOICE,
    input: text,
    response_format: "wav",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
};

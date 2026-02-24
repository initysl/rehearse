import { Readable } from "stream";
import { toFile } from "groq-sdk";
import { env } from "../config/env";
import { groq } from "../config/groq";
import { consumeGroqQuota, estimateAudioSeconds } from "../ai/groq-quota.service";

const resolveAudioFileMeta = (
  mimeType: string | undefined
): { filename: string; mimeType: string } => {
  const normalized = (mimeType || "audio/webm").toLowerCase();

  if (normalized.includes("ogg")) {
    return { filename: "audio.ogg", mimeType: "audio/ogg" };
  }

  if (normalized.includes("mpeg") || normalized.includes("mp3")) {
    return { filename: "audio.mp3", mimeType: "audio/mpeg" };
  }

  if (normalized.includes("wav")) {
    return { filename: "audio.wav", mimeType: "audio/wav" };
  }

  if (normalized.includes("mp4") || normalized.includes("m4a")) {
    return { filename: "audio.m4a", mimeType: "audio/mp4" };
  }

  return { filename: "audio.webm", mimeType: "audio/webm" };
};

export const transcribeAudio = async (
  audioBuffer: Buffer,
  mimeType?: string
): Promise<string> => {
  const estimatedAudioSeconds = estimateAudioSeconds(audioBuffer.length, mimeType);
  await consumeGroqQuota({
    model: env.GROQ_STT_MODEL,
    increments: {
      rpm: 1,
      rpd: 1,
      ash: estimatedAudioSeconds,
      asd: estimatedAudioSeconds,
    },
    context: {
      route: "voice.stt",
      mimeType: mimeType || "audio/webm",
      estimatedAudioSeconds,
    },
  });

  const fileMeta = resolveAudioFileMeta(mimeType);
  const file = await toFile(Readable.from(audioBuffer), fileMeta.filename, {
    type: fileMeta.mimeType,
  });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: env.GROQ_STT_MODEL,
    language: "en",
  });

  return transcription.text;
};

import OpenAI from "openai";
import { env } from "../config/env";
import { consumeGroqQuota, estimateTextTokens } from "../ai/groq-quota.service";
import { findProfileByUserId } from "../modules/users/users.service";
import { logInfo, logWarn } from "../utils/logger";

type VoiceGender = "male" | "female";
const LEGACY_KOKORO_VOICE_ID_PATTERN = /^(?:a|b)[fm]_[a-z0-9_]+$/i;

const groqTts = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface TtsVoiceSelection {
  gender: VoiceGender;
  voiceId?: string;
}

const normalizeGender = (value: unknown): VoiceGender | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  return null;
};

export const resolveTtsVoiceSelection = async (
  userId?: string
): Promise<TtsVoiceSelection> => {
  if (!userId) return { gender: "female" };

  let profile = null;
  try {
    profile = await findProfileByUserId(userId);
  } catch (error) {
    logWarn("voice.tts.profile_lookup_failed", {
      userId,
      error: (error as Error).message,
    });
  }
  if (!profile) return { gender: "female" };

  const preferences = profile.preferences || {};
  const preferenceGender =
    normalizeGender(preferences.ttsGender) ||
    normalizeGender(preferences.voiceGender) ||
    "female";

  const preferredVoiceId =
    typeof preferences.ttsVoiceId === "string" && preferences.ttsVoiceId.trim()
      ? preferences.ttsVoiceId.trim()
      : undefined;

  return {
    gender: preferenceGender,
    voiceId: preferredVoiceId,
  };
};

const normalizeTextForTts = (text: string): string => {
  const withoutMarkdown = text
    .replace(/`{1,3}[^`]*`{1,3}/g, " ")
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1")
    .replace(/[_~#>]/g, " ");

  const collapsed = withoutMarkdown.replace(/\s+/g, " ").trim();
  return collapsed || "Okay.";
};

const groqVoiceForSelection = (selection: TtsVoiceSelection): string => {
  if (selection.voiceId) {
    // Ignore stale legacy Kokoro IDs.
    if (LEGACY_KOKORO_VOICE_ID_PATTERN.test(selection.voiceId)) {
      logWarn("voice.tts.invalid_groq_voice_id", {
        providedVoiceId: selection.voiceId,
        fallbackVoice:
          selection.gender === "male"
            ? env.GROQ_TTS_VOICE_MALE
            : env.GROQ_TTS_VOICE_FEMALE,
      });
    } else {
      return selection.voiceId;
    }
  }

  return selection.gender === "male"
    ? env.GROQ_TTS_VOICE_MALE
    : env.GROQ_TTS_VOICE_FEMALE;
};

export const convertToSpeech = async (
  text: string,
  selection: TtsVoiceSelection = { gender: "female" }
): Promise<Buffer> => {
  const normalizedText = normalizeTextForTts(text);
  const voice = groqVoiceForSelection(selection);
  const estimatedTokens = estimateTextTokens(normalizedText);

  logInfo("voice.tts.providers_selected", {
    providers: ["groq"],
    textChars: normalizedText.length,
    model: env.GROQ_TTS_MODEL,
    voice,
  });

  await consumeGroqQuota({
    model: env.GROQ_TTS_MODEL,
    increments: {
      rpm: 1,
      rpd: 1,
      tpm: estimatedTokens,
      tpd: estimatedTokens,
    },
    context: {
      route: "voice.tts",
      provider: "groq",
      model: env.GROQ_TTS_MODEL,
      voice,
      estimatedTokens,
    },
  });

  const startedAt = Date.now();
  try {
    const response = await groqTts.audio.speech.create({
      model: env.GROQ_TTS_MODEL,
      voice,
      input: normalizedText,
      response_format: "wav",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new Error("Groq TTS returned an empty audio payload.");
    }

    logInfo("voice.tts.provider_succeeded", {
      provider: "groq",
      model: env.GROQ_TTS_MODEL,
      voice,
      latencyMs: Date.now() - startedAt,
      bytes: buffer.length,
    });
    return buffer;
  } catch (error) {
    const message = (error as Error).message || "Unknown Groq TTS failure";
    logWarn("voice.tts.provider_failed", {
      provider: "groq",
      model: env.GROQ_TTS_MODEL,
      voice,
      latencyMs: Date.now() - startedAt,
      error: message,
    });
    throw new Error(message);
  }
};

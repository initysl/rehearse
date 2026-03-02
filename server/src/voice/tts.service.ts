import OpenAI from "openai";
import { env } from "../config/env";
import { consumeGroqQuota, estimateTextTokens } from "../ai/groq-quota.service";
import { db } from "../config/db";
import { findProfileByUserId } from "../modules/users/users.service";
import { logInfo, logWarn } from "../utils/logger";

type VoiceGender = "male" | "female";
const MALE_VOICE_IDS = ["austin", "daniel", "troy"] as const;
const FEMALE_VOICE_IDS = ["autumn", "diana", "hannah"] as const;
const ALL_VOICE_IDS = [...FEMALE_VOICE_IDS, ...MALE_VOICE_IDS] as const;
type VoiceId = (typeof ALL_VOICE_IDS)[number];
type TtsProvider = "groq" | "elevenlabs";
type TtsErrorCode =
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "NETWORK"
  | "MISCONFIG"
  | "PROVIDER_FAILURE";

export interface TtsAudioResult {
  audioBuffer: Buffer;
  mimeType: string;
  provider: TtsProvider;
}

const maleVoiceSet = new Set<string>(MALE_VOICE_IDS);
const femaleVoiceSet = new Set<string>(FEMALE_VOICE_IDS);
const allVoiceSet = new Set<string>(ALL_VOICE_IDS);

const groqTts = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export interface TtsVoiceSelection {
  gender: VoiceGender;
  voiceId?: VoiceId;
}

const normalizeGender = (value: unknown): VoiceGender | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "male") return "male";
  if (normalized === "female") return "female";
  return null;
};

const normalizeVoiceId = (value: unknown): VoiceId | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return allVoiceSet.has(normalized) ? (normalized as VoiceId) : null;
};

const isVoiceAllowedForGender = (voiceId: VoiceId, gender: VoiceGender): boolean => {
  return gender === "male"
    ? maleVoiceSet.has(voiceId)
    : femaleVoiceSet.has(voiceId);
};

const inferGenderFromVoice = (voiceId: VoiceId): VoiceGender => {
  return maleVoiceSet.has(voiceId) ? "male" : "female";
};

const defaultGroqVoiceForGender = (gender: VoiceGender): VoiceId => {
  if (gender === "male") {
    const configured = normalizeVoiceId(env.GROQ_TTS_VOICE_MALE);
    return configured && maleVoiceSet.has(configured) ? configured : "troy";
  }

  const configured = normalizeVoiceId(env.GROQ_TTS_VOICE_FEMALE);
  return configured && femaleVoiceSet.has(configured) ? configured : "autumn";
};

const defaultElevenLabsVoiceForGender = (gender: VoiceGender): string => {
  const configured =
    gender === "male"
      ? env.ELEVENLABS_VOICE_MALE.trim()
      : env.ELEVENLABS_VOICE_FEMALE.trim();
  if (configured) return configured;
  throw new Error(
    `ElevenLabs voice ID is not configured for ${gender}. Set ELEVENLABS_VOICE_${gender.toUpperCase()}.`
  );
};

interface SessionScenarioVoiceRow {
  character_profile: {
    gender?: unknown;
    voiceId?: unknown;
  } | null;
}

const resolveSessionScenarioVoiceSelection = async (
  sessionId: string,
  userId: string
): Promise<TtsVoiceSelection | null> => {
  const result = await db.query<SessionScenarioVoiceRow>(
    `SELECT sc.character_profile
     FROM public.sessions s
     JOIN public.scenarios sc ON sc.id = s.scenario_id
     WHERE s.id = $1
       AND s.user_id = $2
     LIMIT 1`,
    [sessionId, userId]
  );

  const profile = result.rows[0]?.character_profile;
  if (!profile) return null;

  const gender = normalizeGender(profile.gender);
  const voiceId = normalizeVoiceId(profile.voiceId);

  if (!gender && !voiceId) return null;
  if (!voiceId && gender) return { gender };
  if (!voiceId) return null;
  if (!gender) {
    return { gender: inferGenderFromVoice(voiceId), voiceId };
  }

  if (!isVoiceAllowedForGender(voiceId, gender)) {
    logWarn("voice.tts.scenario_voice_mismatch", {
      sessionId,
      userId,
      gender,
      voiceId,
    });
    return { gender };
  }

  return { gender, voiceId };
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

  const preferredVoiceId = normalizeVoiceId(preferences.ttsVoiceId);
  const preferredVoiceByGender = preferredVoiceId
    ? isVoiceAllowedForGender(preferredVoiceId, preferenceGender)
      ? preferredVoiceId
      : undefined
    : undefined;

  if (preferredVoiceId && !preferredVoiceByGender) {
    logWarn("voice.tts.profile_voice_mismatch", {
      userId,
      requestedVoiceId: preferredVoiceId,
      gender: preferenceGender,
    });
  }

  return {
    gender: preferenceGender,
    voiceId: preferredVoiceByGender,
  };
};

export const resolveTtsVoiceSelectionForSession = async (
  sessionId: string,
  userId: string
): Promise<TtsVoiceSelection> => {
  try {
    const sessionSelection = await resolveSessionScenarioVoiceSelection(
      sessionId,
      userId
    );
    if (sessionSelection) return sessionSelection;
  } catch (error) {
    logWarn("voice.tts.session_voice_lookup_failed", {
      sessionId,
      userId,
      error: (error as Error).message,
    });
  }

  return resolveTtsVoiceSelection(userId);
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
    if (!isVoiceAllowedForGender(selection.voiceId, selection.gender)) {
      logWarn("voice.tts.invalid_groq_voice_id", {
        providedVoiceId: selection.voiceId,
        gender: selection.gender,
        fallbackVoice: defaultGroqVoiceForGender(selection.gender),
      });
      return defaultGroqVoiceForGender(selection.gender);
    }

    return selection.voiceId;
  }

  return defaultGroqVoiceForGender(selection.gender);
};

const elevenLabsVoiceForSelection = (selection: TtsVoiceSelection): string => {
  return defaultElevenLabsVoiceForGender(selection.gender);
};

class TtsProviderError extends Error {
  provider: TtsProvider;
  code: TtsErrorCode;

  constructor(provider: TtsProvider, code: TtsErrorCode, message: string) {
    super(message);
    this.provider = provider;
    this.code = code;
  }
}

const classifyTtsError = (message: string): TtsErrorCode => {
  const normalized = message.toLowerCase();
  if (
    /(rate limit|429|quota|token[s ]per day|tpm|tpd|rpd|rpm|billing|service tier|org_)/i.test(
      normalized
    )
  ) {
    return "RATE_LIMIT";
  }
  if (/(timed out|timeout|aborted|aborterror)/i.test(normalized)) {
    return "TIMEOUT";
  }
  if (
    /(connection|econnreset|econnrefused|enotfound|enetunreach|fetch failed|network)/i.test(
      normalized
    )
  ) {
    return "NETWORK";
  }
  if (/(not configured|misconfig|missing)/i.test(normalized)) {
    return "MISCONFIG";
  }
  return "PROVIDER_FAILURE";
};

const groqProvider = async (
  normalizedText: string,
  selection: TtsVoiceSelection
): Promise<TtsAudioResult> => {
  const voice = groqVoiceForSelection(selection);
  const estimatedTokens = estimateTextTokens(normalizedText);

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
    return {
      audioBuffer: buffer,
      mimeType: "audio/wav",
      provider: "groq",
    };
  } catch (error) {
    const message = (error as Error).message || "Unknown Groq TTS failure";
    logWarn("voice.tts.provider_failed", {
      provider: "groq",
      model: env.GROQ_TTS_MODEL,
      voice,
      latencyMs: Date.now() - startedAt,
      error: message,
    });
    throw new TtsProviderError("groq", classifyTtsError(message), message);
  }
};

const elevenLabsProvider = async (
  normalizedText: string,
  selection: TtsVoiceSelection
): Promise<TtsAudioResult> => {
  const apiKey = env.ELEVENLABS_API_KEY.trim();
  if (!apiKey) {
    throw new TtsProviderError(
      "elevenlabs",
      "MISCONFIG",
      "ElevenLabs API key is not configured."
    );
  }

  const voiceId = elevenLabsVoiceForSelection(selection);
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), env.TTS_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
        voiceId
      )}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: normalizedText,
          model_id: env.ELEVENLABS_MODEL_ID,
        }),
        signal: timeoutController.signal,
      }
    );

    if (!response.ok) {
      const rawErrorBody = await response.text();
      const errorBody = rawErrorBody.trim().slice(0, 240);
      throw new Error(
        `ElevenLabs TTS request failed with ${response.status}${
          errorBody ? `: ${errorBody}` : ""
        }`
      );
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length) {
      throw new Error("ElevenLabs TTS returned an empty audio payload.");
    }

    logInfo("voice.tts.provider_succeeded", {
      provider: "elevenlabs",
      model: env.ELEVENLABS_MODEL_ID,
      voice: voiceId,
      latencyMs: Date.now() - startedAt,
      bytes: buffer.length,
    });
    return {
      audioBuffer: buffer,
      mimeType: "audio/mpeg",
      provider: "elevenlabs",
    };
  } catch (error) {
    const message =
      (error as Error).name === "AbortError"
        ? `ElevenLabs TTS request timed out after ${env.TTS_TIMEOUT_MS}ms`
        : (error as Error).message || "Unknown ElevenLabs TTS failure";
    logWarn("voice.tts.provider_failed", {
      provider: "elevenlabs",
      model: env.ELEVENLABS_MODEL_ID,
      voice: voiceId,
      latencyMs: Date.now() - startedAt,
      error: message,
    });
    throw new TtsProviderError("elevenlabs", classifyTtsError(message), message);
  } finally {
    clearTimeout(timeoutId);
  }
};

const providerChain = (): TtsProvider[] => {
  const providers: TtsProvider[] = [];

  if (env.TTS_PROVIDER !== "none") providers.push(env.TTS_PROVIDER);
  if (
    env.TTS_FALLBACK_PROVIDER !== "none" &&
    !providers.includes(env.TTS_FALLBACK_PROVIDER)
  ) {
    providers.push(env.TTS_FALLBACK_PROVIDER);
  }

  return providers;
};

const shouldAttemptFallback = (
  failedProvider: TtsProvider,
  error: Error
): boolean => {
  if (env.TTS_FALLBACK_POLICY === "always") {
    return true;
  }

  if (env.TTS_FALLBACK_POLICY === "rate_limit_only") {
    if (failedProvider !== "groq") return false;
    if (error instanceof TtsProviderError) {
      return error.code === "RATE_LIMIT";
    }
    return classifyTtsError(error.message || "") === "RATE_LIMIT";
  }

  return false;
};

export const convertToSpeech = async (
  text: string,
  selection: TtsVoiceSelection = { gender: "female" }
): Promise<TtsAudioResult> => {
  const normalizedText = normalizeTextForTts(text);
  const providers = providerChain();

  if (!providers.length) {
    throw new Error(
      "No TTS provider configured. Set TTS_PROVIDER to groq or elevenlabs."
    );
  }

  logInfo("voice.tts.providers_selected", {
    providers,
    textChars: normalizedText.length,
    primaryProvider: providers[0],
  });

  let lastError: Error | null = null;

  for (const provider of providers) {
    try {
      if (provider === "elevenlabs") {
        return await elevenLabsProvider(normalizedText, selection);
      }
      return await groqProvider(normalizedText, selection);
    } catch (error) {
      lastError = error as Error;
      const hasNextProvider = provider !== providers[providers.length - 1];
      if (hasNextProvider && shouldAttemptFallback(provider, lastError)) {
        logWarn("voice.tts.fallback_attempt", {
          failedProvider: provider,
          nextProvider: providers[providers.indexOf(provider) + 1],
          error: lastError.message,
        });
        continue;
      }
      if (hasNextProvider) {
        logWarn("voice.tts.fallback_skipped", {
          failedProvider: provider,
          nextProvider: providers[providers.indexOf(provider) + 1],
          policy: env.TTS_FALLBACK_POLICY,
          error: lastError.message,
        });
      }
      throw new Error(lastError.message);
    }
  }

  throw new Error(lastError?.message || "All TTS providers failed.");
};

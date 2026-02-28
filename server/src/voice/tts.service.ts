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
type TtsProvider = "groq" | "kokoro";

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

const defaultKokoroVoiceForGender = (gender: VoiceGender): string => {
  if (gender === "male") return env.KOKORO_TTS_VOICE_MALE;
  return env.KOKORO_TTS_VOICE_FEMALE;
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

const kokoroVoiceForSelection = (selection: TtsVoiceSelection): string => {
  // Kokoro uses its own voice IDs. App-level voiceId (autumn/diana/...) is Groq Orpheus-specific.
  // For Kokoro, only gender determines default voice.
  return defaultKokoroVoiceForGender(selection.gender);
};

const groqProvider = async (
  normalizedText: string,
  selection: TtsVoiceSelection
): Promise<Buffer> => {
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

type KokoroResponse = {
  audio_base64?: string;
};

const kokoroProvider = async (
  normalizedText: string,
  selection: TtsVoiceSelection
): Promise<Buffer> => {
  const voice = kokoroVoiceForSelection(selection);
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), env.TTS_TIMEOUT_MS);
  const startedAt = Date.now();

  try {
    const response = await fetch(env.KOKORO_TTS_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "audio/wav,application/json",
      },
      body: JSON.stringify({
        text: normalizedText,
        voice,
        lang_code: env.KOKORO_TTS_LANG_CODE,
        speed: env.KOKORO_TTS_SPEED,
      }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      const rawErrorBody = await response.text();
      const errorBody = rawErrorBody.trim().slice(0, 240);
      throw new Error(
        `Kokoro TTS request failed with ${response.status}${
          errorBody ? `: ${errorBody}` : ""
        }`
      );
    }

    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    let buffer: Buffer;
    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as KokoroResponse;
      if (!payload.audio_base64) {
        throw new Error("Kokoro JSON response did not include audio_base64.");
      }
      buffer = Buffer.from(payload.audio_base64, "base64");
    } else {
      buffer = Buffer.from(await response.arrayBuffer());
    }

    if (!buffer.length) {
      throw new Error("Kokoro TTS returned an empty audio payload.");
    }

    logInfo("voice.tts.provider_succeeded", {
      provider: "kokoro",
      voice,
      latencyMs: Date.now() - startedAt,
      bytes: buffer.length,
    });
    return buffer;
  } catch (error) {
    const message =
      (error as Error).name === "AbortError"
        ? `Kokoro TTS request timed out after ${env.TTS_TIMEOUT_MS}ms`
        : (error as Error).message || "Unknown Kokoro TTS failure";

    logWarn("voice.tts.provider_failed", {
      provider: "kokoro",
      voice,
      latencyMs: Date.now() - startedAt,
      error: message,
    });
    throw new Error(message);
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

export const convertToSpeech = async (
  text: string,
  selection: TtsVoiceSelection = { gender: "female" }
): Promise<Buffer> => {
  const normalizedText = normalizeTextForTts(text);
  const providers = providerChain();

  if (!providers.length) {
    throw new Error(
      "No TTS provider configured. Set TTS_PROVIDER to kokoro or groq."
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
      if (provider === "kokoro") {
        return await kokoroProvider(normalizedText, selection);
      }
      return await groqProvider(normalizedText, selection);
    } catch (error) {
      lastError = error as Error;
      if (provider !== providers[providers.length - 1]) {
        logWarn("voice.tts.fallback_attempt", {
          failedProvider: provider,
          nextProvider: providers[providers.indexOf(provider) + 1],
          error: lastError.message,
        });
      }
    }
  }

  throw new Error(lastError?.message || "All TTS providers failed.");
};

import { ApiError } from "../api/client";

const apiCodeMessages: Record<string, string> = {
  VALIDATION_ERROR: "Some inputs are invalid. Please review and try again.",
  UNAUTHORIZED: "Please sign in to continue.",
  FORBIDDEN: "You do not have permission to do this.",
  NOT_FOUND: "The requested item was not found.",
  CONFLICT: "This request conflicts with existing data. Refresh and try again.",
  RATE_LIMITED: "Too many requests. Please wait a bit and try again.",
  INTERNAL_ERROR: "Server error. Please try again later.",
  REQUEST_FAILED: "Request failed. Please try again.",
};

const voiceCodeMessages: Record<string, string> = {
  AUDIO_RATE_LIMIT:
    "Audio is temporarily unavailable due to service limits. Please try again soon.",
  AUDIO_TIMEOUT: "Audio service timed out. Please try again.",
  AUDIO_NETWORK: "Audio service is temporarily unreachable. Please try again.",
  AUDIO_UNAVAILABLE: "Audio is unavailable right now. Showing text only.",
  VOICE_PROCESSING_FAILED: "Voice processing failed. Please try again.",
  NO_AUDIO_RECEIVED: "No voice input detected. Please try speaking again.",
};

export const mapApiErrorToUserMessage = (
  error: unknown,
  fallback = "Request failed."
): string => {
  if (!(error instanceof ApiError)) {
    if (error instanceof Error) return error.message || fallback;
    if (typeof error === "string" && error.trim()) return error;
    return fallback;
  }

  if (error.code && apiCodeMessages[error.code]) {
    return apiCodeMessages[error.code];
  }

  if (error.status === 400) return "Invalid request.";
  if (error.status === 401) return "Please sign in to continue.";
  if (error.status === 403) return "You do not have permission to do this.";
  if (error.status === 404) return "The requested item was not found.";
  if (error.status === 409) return "Request conflict. Refresh and try again.";
  if (error.status === 429) return "Too many requests. Please wait and try again.";
  if (error.status >= 500) return "Server error. Please try again later.";

  return fallback;
};

export const mapVoiceErrorToUserMessage = (input: {
  code?: string;
  fallback?: string;
}): string => {
  if (input.code && voiceCodeMessages[input.code]) {
    return voiceCodeMessages[input.code];
  }

  const fallback = (input.fallback || "").trim();
  if (!fallback) {
    return "Audio is unavailable right now. Showing text only.";
  }

  if (
    /(rate limit|429|quota|token[s ]per day|tpm|tpd|rpd|rpm|billing|service tier|org_)/i.test(
      fallback
    )
  ) {
    return voiceCodeMessages.AUDIO_RATE_LIMIT;
  }

  if (/(timed out|timeout|aborted|aborterror)/i.test(fallback)) {
    return voiceCodeMessages.AUDIO_TIMEOUT;
  }

  if (
    /(connection|econnreset|econnrefused|enotfound|enetunreach|fetch failed|network)/i.test(
      fallback
    )
  ) {
    return voiceCodeMessages.AUDIO_NETWORK;
  }

  return voiceCodeMessages.AUDIO_UNAVAILABLE;
};

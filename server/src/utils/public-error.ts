const normalizeMessage = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

const contains = (text: string, pattern: RegExp): boolean => pattern.test(text);

export type VoicePublicCode =
  | "AUDIO_RATE_LIMIT"
  | "AUDIO_TIMEOUT"
  | "AUDIO_NETWORK"
  | "AUDIO_UNAVAILABLE"
  | "VOICE_PROCESSING_FAILED"
  | "NO_AUDIO_RECEIVED";

export type HttpPublicCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "REQUEST_FAILED";

type PublicErrorPayload<TCode extends string> = {
  code: TCode;
  message: string;
};

export const toSafeVoiceUnavailableReason = (
  raw: unknown
): PublicErrorPayload<VoicePublicCode> => {
  const message = normalizeMessage(raw);
  if (!message) {
    return {
      code: "AUDIO_UNAVAILABLE",
      message: "Audio is unavailable right now. Showing text only.",
    };
  }

  if (
    contains(
      message,
      /(rate limit|429|quota|token[s ]per day|tpm|tpd|rpd|rpm|billing|service tier|org_)/i
    )
  ) {
    return {
      code: "AUDIO_RATE_LIMIT",
      message:
        "Audio is temporarily unavailable due to provider limits. Please try again soon.",
    };
  }

  if (contains(message, /(timed out|timeout|aborted|aborterror)/i)) {
    return {
      code: "AUDIO_TIMEOUT",
      message: "Audio service timed out. Please try again shortly.",
    };
  }

  if (
    contains(
      message,
      /(connection|econnreset|econnrefused|enotfound|enetunreach|fetch failed|network)/i
    )
  ) {
    return {
      code: "AUDIO_NETWORK",
      message: "Audio service is temporarily unreachable. Please try again.",
    };
  }

  return {
    code: "AUDIO_UNAVAILABLE",
    message: "Audio is unavailable right now. Showing text only.",
  };
};

export const toSafeVoiceProcessingMessage = (): PublicErrorPayload<VoicePublicCode> => {
  return {
    code: "VOICE_PROCESSING_FAILED",
    message: "Voice processing failed. Please try again.",
  };
};

export const toSafeHttpErrorMessage = (
  statusCode: number,
  rawMessage: unknown
): PublicErrorPayload<HttpPublicCode> => {
  if (statusCode === 400) {
    const message = normalizeMessage(rawMessage);
    if (message.startsWith("Invalid request payload")) {
      return {
        code: "VALIDATION_ERROR",
        message,
      };
    }
    return {
      code: "VALIDATION_ERROR",
      message: "Invalid request.",
    };
  }

  if (statusCode === 401) {
    return { code: "UNAUTHORIZED", message: "Unauthorized." };
  }
  if (statusCode === 403) {
    return { code: "FORBIDDEN", message: "Forbidden." };
  }
  if (statusCode === 404) {
    return { code: "NOT_FOUND", message: "Resource not found." };
  }
  if (statusCode === 409) {
    return { code: "CONFLICT", message: "Request conflict." };
  }
  if (statusCode === 429) {
    return {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    };
  }

  if (statusCode >= 500) {
    return { code: "INTERNAL_ERROR", message: "Internal server error." };
  }

  return { code: "REQUEST_FAILED", message: "Request failed." };
};

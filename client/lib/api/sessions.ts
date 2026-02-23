import { getStoredAccessToken } from "../auth-token";
import { apiRequest, getApiBaseUrl, ApiError } from "./client";
import {
  ClearSessionHistoryResponse,
  EndSessionInput,
  EndSessionResponse,
  SessionDetailResponse,
  SessionHistoryResponse,
  StartSessionInput,
  StartSessionResponse,
} from "./types";

export interface SessionHistoryQuery {
  status?: "active" | "completed" | "abandoned";
  limit?: number;
  offset?: number;
}

export interface ClearSessionHistoryQuery {
  scope?: "non_active" | "completed" | "abandoned" | "all";
  limit?: number;
}

export const startSession = (
  payload: StartSessionInput,
  accessToken?: string | null
) => {
  return apiRequest<StartSessionResponse>("/sessions/start", {
    method: "POST",
    body: payload,
    accessToken,
  });
};

export const getSessionHistory = (
  query: SessionHistoryQuery = {},
  accessToken?: string | null
) => {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    ...query,
  };

  return apiRequest<SessionHistoryResponse>("/sessions/history", {
    query: queryParams,
    accessToken,
  });
};

export const clearSessionHistory = (
  query: ClearSessionHistoryQuery = {},
  accessToken?: string | null
) => {
  const queryParams: Record<string, string | number | boolean | undefined> = {
    ...query,
  };

  return apiRequest<ClearSessionHistoryResponse>("/sessions/history", {
    method: "DELETE",
    query: queryParams,
    accessToken,
  });
};

export const getSessionDetail = (sessionId: string, accessToken?: string | null) => {
  return apiRequest<SessionDetailResponse>(`/sessions/${sessionId}`, {
    accessToken,
  });
};

export const endSession = (
  sessionId: string,
  payload: EndSessionInput,
  accessToken?: string | null
) => {
  return apiRequest<EndSessionResponse>(`/sessions/${sessionId}/end`, {
    method: "POST",
    body: payload,
    accessToken,
  });
};

interface StreamSessionMessageOptions {
  sessionId: string;
  content: string;
  accessToken?: string | null;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (error: string) => void;
}

export const streamSessionMessage = async (
  options: StreamSessionMessageOptions
): Promise<string> => {
  const token = options.accessToken ?? getStoredAccessToken();
  const response = await fetch(new URL(`/sessions/${options.sessionId}/message`, getApiBaseUrl()), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({ content: options.content }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(body || "Failed to stream message", response.status, body || null);
  }

  if (!response.body) {
    throw new Error("Missing response stream body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullAssistantText = "";

  const handleChunk = (chunk: string): void => {
    buffer += chunk;

    while (true) {
      const delimiterIndex = buffer.indexOf("\n\n");
      if (delimiterIndex < 0) break;

      const rawEvent = buffer.slice(0, delimiterIndex);
      buffer = buffer.slice(delimiterIndex + 2);

      const dataLines = rawEvent
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);

      for (const line of dataLines) {
        try {
          const payload = JSON.parse(line) as {
            token?: string;
            done?: boolean;
            error?: string;
          };

          if (payload.error) {
            options.onError?.(payload.error);
            continue;
          }

          if (payload.token) {
            fullAssistantText += payload.token;
            options.onToken?.(payload.token);
          }

          if (payload.done) {
            options.onDone?.();
          }
        } catch {
          // ignore malformed event frames
        }
      }
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    handleChunk(decoder.decode(value, { stream: true }));
  }

  handleChunk(decoder.decode());

  return fullAssistantText;
};

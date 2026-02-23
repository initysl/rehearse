"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearSessionHistory,
  endSession,
  getSessionDetail,
  getSessionHistory,
  startSession,
  streamSessionMessage,
  type ClearSessionHistoryQuery,
  type SessionHistoryQuery,
} from "../api/sessions";
import type { EndSessionInput, StartSessionInput } from "../api/types";
import { queryKeys } from "../query/keys";

export const useSessionHistoryQuery = (
  accessToken: string | null,
  query: SessionHistoryQuery = {},
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.sessions.history(query),
    queryFn: () => getSessionHistory(query, accessToken),
    enabled,
  });
};

export const useSessionDetailQuery = (
  accessToken: string | null,
  sessionId: string | null,
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId || ""),
    queryFn: () => getSessionDetail(sessionId || "", accessToken),
    enabled: Boolean(enabled && sessionId),
  });
};

export const useStartSessionMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: StartSessionInput) => startSession(payload, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
};

export const useEndSessionMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { sessionId: string; payload: EndSessionInput }) =>
      endSession(input.sessionId, input.payload, accessToken),
    onSuccess: (_result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.bySession(variables.sessionId),
      });
    },
  });
};

export const useClearSessionHistoryMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (query: ClearSessionHistoryQuery = {}) =>
      clearSessionHistory(query, accessToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["feedback"] });
    },
  });
};

export const useSendMessageStreamMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      sessionId: string;
      content: string;
      onToken?: (token: string) => void;
      onDone?: () => void;
      onError?: (error: string) => void;
    }) =>
      streamSessionMessage({
        sessionId: input.sessionId,
        content: input.content,
        accessToken,
        onToken: input.onToken,
        onDone: input.onDone,
        onError: input.onError,
      }),
    onSuccess: (_assistantReply, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(variables.sessionId),
      });
    },
  });
};

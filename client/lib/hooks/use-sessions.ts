"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endSession,
  getSessionDetail,
  getSessionHistory,
  startSession,
  streamSessionMessage,
  type SessionHistoryQuery,
} from "../api/sessions";
import type { EndSessionInput, StartSessionInput } from "../api/types";
import { queryKeys } from "../query/keys";

export const useSessionHistoryQuery = (
  accessToken: string | null,
  query: SessionHistoryQuery = {}
) => {
  return useQuery({
    queryKey: queryKeys.sessions.history(query),
    queryFn: () => getSessionHistory(query, accessToken),
    enabled: Boolean(accessToken),
  });
};

export const useSessionDetailQuery = (
  accessToken: string | null,
  sessionId: string | null
) => {
  return useQuery({
    queryKey: queryKeys.sessions.detail(sessionId || ""),
    queryFn: () => getSessionDetail(sessionId || "", accessToken),
    enabled: Boolean(accessToken && sessionId),
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

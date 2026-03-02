"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  clearSessionHistory,
  deleteSession,
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

export const useSessionHistoryInfiniteQuery = (
  accessToken: string | null,
  query: { status?: SessionHistoryQuery["status"]; pageSize?: number } = {},
  enabled = true
) => {
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);

  return useInfiniteQuery({
    queryKey: queryKeys.sessions.historyInfinite({
      status: query.status,
      pageSize,
    }),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      getSessionHistory(
        {
          status: query.status,
          limit: pageSize,
          offset: Number(pageParam) || 0,
        },
        accessToken
      ),
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.sessions.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
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

export const useDeleteSessionMutation = (accessToken: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => deleteSession(sessionId, accessToken),
    onSuccess: (_result, sessionId) => {
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sessions.detail(sessionId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.feedback.bySession(sessionId),
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

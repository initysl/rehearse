"use client";

import { useQuery } from "@tanstack/react-query";
import { getFeedbackForSession } from "../api/feedback";
import { queryKeys } from "../query/keys";

export const useSessionFeedbackQuery = (
  accessToken: string | null,
  sessionId: string | null,
  enabled = true
) => {
  return useQuery({
    queryKey: queryKeys.feedback.bySession(sessionId || ""),
    queryFn: () => getFeedbackForSession(sessionId || "", accessToken),
    enabled: Boolean(enabled && sessionId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.kind === "pending") return 3_000;
      return false;
    },
  });
};

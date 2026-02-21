import { apiRequestWithMeta } from "./client";
import {
  FeedbackPendingPayload,
  FeedbackReadyPayload,
  FeedbackResponse,
} from "./types";

export const getFeedbackForSession = async (
  sessionId: string,
  accessToken?: string | null
): Promise<FeedbackResponse> => {
  const response = await apiRequestWithMeta<
    FeedbackReadyPayload | FeedbackPendingPayload
  >(`/feedback/${sessionId}`, {
    accessToken,
  });

  if (response.status === 202) {
    return {
      kind: "pending",
      data: response.data as FeedbackPendingPayload,
    };
  }

  return {
    kind: "ready",
    data: response.data as FeedbackReadyPayload,
  };
};

import { ListScenariosQuery } from "../api/scenarios";
import { SessionHistoryQuery } from "../api/sessions";

export const queryKeys = {
  auth: {
    me: (tokenState: "authed" | "anon") => ["auth", "me", tokenState] as const,
  },
  scenarios: {
    list: (query: ListScenariosQuery) => ["scenarios", "list", query] as const,
  },
  sessions: {
    history: (query: SessionHistoryQuery) => ["sessions", "history", query] as const,
    historyInfinite: (query: { status?: SessionHistoryQuery["status"]; pageSize: number }) =>
      ["sessions", "history", "infinite", query] as const,
    detail: (sessionId: string) => ["sessions", "detail", sessionId] as const,
  },
  feedback: {
    bySession: (sessionId: string) => ["feedback", "session", sessionId] as const,
  },
};

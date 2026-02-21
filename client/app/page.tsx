"use client";

import { FormEvent, useMemo, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { beginGoogleOAuth, useLoginMutation, useLogoutMutation, useMeQuery, useRefreshMutation, useRegisterMutation } from "@/lib/hooks/use-auth";
import { useAccessToken } from "@/lib/hooks/use-access-token";
import { useScenariosQuery } from "@/lib/hooks/use-scenarios";
import { useEndSessionMutation, useSendMessageStreamMutation, useSessionHistoryQuery, useStartSessionMutation } from "@/lib/hooks/use-sessions";
import { useSessionFeedbackQuery } from "@/lib/hooks/use-feedback";
import type { DifficultyLevel } from "@/lib/api/types";

const formatError = (error: unknown): string => {
  if (!error) return "Unknown error";
  if (error instanceof ApiError) return `${error.message} (${error.status})`;
  if (error instanceof Error) return error.message;
  return String(error);
};

export default function Home() {
  const { accessToken, setAccessToken } = useAccessToken();

  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [fullName, setFullName] = useState("Rehearse User");
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>("neutral");
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [assistantStream, setAssistantStream] = useState("");
  const [lastActionMessage, setLastActionMessage] = useState("");

  const meQuery = useMeQuery(accessToken);
  const scenariosQuery = useScenariosQuery(accessToken, { limit: 10, offset: 0 });
  const historyQuery = useSessionHistoryQuery(accessToken, { limit: 10, offset: 0 });
  const feedbackQuery = useSessionFeedbackQuery(accessToken, feedbackSessionId);

  const registerMutation = useRegisterMutation(setAccessToken);
  const loginMutation = useLoginMutation(setAccessToken);
  const refreshMutation = useRefreshMutation(setAccessToken);
  const logoutMutation = useLogoutMutation(setAccessToken);
  const startSessionMutation = useStartSessionMutation(accessToken);
  const endSessionMutation = useEndSessionMutation(accessToken);
  const sendMessageMutation = useSendMessageStreamMutation(accessToken);

  const authError =
    registerMutation.error ||
    loginMutation.error ||
    refreshMutation.error ||
    logoutMutation.error;

  const sessionError =
    startSessionMutation.error || endSessionMutation.error || sendMessageMutation.error;

  const scenarioOptions = scenariosQuery.data?.scenarios || [];

  const activeUserSummary = useMemo(() => {
    if (!meQuery.data?.user) return "Not authenticated";
    return `${meQuery.data.user.email || meQuery.data.user.userId} (${meQuery.data.user.role})`;
  }, [meQuery.data]);

  const handleRegister = async () => {
    setLastActionMessage("");

    try {
      const result = await registerMutation.mutateAsync({
        email,
        password,
        fullName,
      });

      if (result.requiresEmailConfirmation) {
        setLastActionMessage("Registration successful. Check your inbox to confirm email.");
      } else {
        setLastActionMessage("Registration successful and authenticated.");
      }
    } catch {
      // mutation state handles errors
    }
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setLastActionMessage("");

    try {
      await loginMutation.mutateAsync({ email, password });
      setLastActionMessage("Login successful.");
    } catch {
      // mutation state handles errors
    }
  };

  const handleStartSession = async () => {
    if (!selectedScenarioId) {
      setLastActionMessage("Select a scenario before starting a session.");
      return;
    }

    setLastActionMessage("");

    try {
      const result = await startSessionMutation.mutateAsync({
        scenarioId: selectedScenarioId,
        difficultyLevel,
      });
      setActiveSessionId(result.session.id);
      setFeedbackSessionId(null);
      setAssistantStream("");
      setLastActionMessage(`Session started: ${result.session.id}`);
    } catch {
      // mutation state handles errors
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) {
      setLastActionMessage("No active session selected.");
      return;
    }

    setLastActionMessage("");

    try {
      const result = await endSessionMutation.mutateAsync({
        sessionId: activeSessionId,
        payload: { status: "completed" },
      });
      setFeedbackSessionId(result.session.id);
      setLastActionMessage("Session ended. Feedback polling started.");
    } catch {
      // mutation state handles errors
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!activeSessionId || !messageInput.trim()) {
      setLastActionMessage("Set an active session and message content first.");
      return;
    }

    setAssistantStream("");
    setLastActionMessage("");

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: activeSessionId,
        content: messageInput,
        onToken: (token) => {
          setAssistantStream((prev) => prev + token);
        },
      });
      setMessageInput("");
    } catch {
      // mutation state handles errors
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 p-6">
      <section className="rounded-xl border border-black/10 p-4">
        <h1 className="text-2xl font-semibold">Rehearse Integration Console</h1>
        <p className="text-sm text-black/60">
          API base: <code>{process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"}</code>
        </p>
      </section>

      <section className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-lg font-semibold">Auth</h2>
        <form className="grid gap-2 sm:grid-cols-2" onSubmit={handleLogin}>
          <input
            className="rounded border border-black/20 px-3 py-2"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            type="email"
          />
          <input
            className="rounded border border-black/20 px-3 py-2"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
          />
          <input
            className="rounded border border-black/20 px-3 py-2 sm:col-span-2"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Full name (for registration)"
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button className="rounded bg-black px-3 py-2 text-white" type="submit">
              Login
            </button>
            <button
              className="rounded border border-black/30 px-3 py-2"
              type="button"
              onClick={() => {
                void handleRegister();
              }}
            >
              Register
            </button>
            <button
              className="rounded border border-black/30 px-3 py-2"
              type="button"
              onClick={() => refreshMutation.mutate()}
            >
              Refresh Session
            </button>
            <button
              className="rounded border border-black/30 px-3 py-2"
              type="button"
              onClick={() => logoutMutation.mutate()}
            >
              Logout
            </button>
            <button
              className="rounded border border-black/30 px-3 py-2"
              type="button"
              onClick={() => beginGoogleOAuth("/")}
            >
              Continue with Google
            </button>
          </div>
        </form>
        <p className="mt-2 text-sm">Current user: {activeUserSummary}</p>
        <p className="mt-1 text-xs text-black/60 break-all">Access token: {accessToken || "none"}</p>
        {authError ? (
          <p className="mt-2 text-sm text-red-700">Auth error: {formatError(authError)}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-black/10 p-4">
        <h2 className="mb-3 text-lg font-semibold">Scenarios & Sessions</h2>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <select
            className="rounded border border-black/20 px-3 py-2"
            value={selectedScenarioId}
            onChange={(event) => setSelectedScenarioId(event.target.value)}
          >
            <option value="">Select scenario</option>
            {scenarioOptions.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.title} ({scenario.category})
              </option>
            ))}
          </select>
          <select
            className="rounded border border-black/20 px-3 py-2"
            value={difficultyLevel}
            onChange={(event) => setDifficultyLevel(event.target.value as DifficultyLevel)}
          >
            <option value="cooperative">cooperative</option>
            <option value="neutral">neutral</option>
            <option value="resistant">resistant</option>
            <option value="hostile">hostile</option>
          </select>
          <button className="rounded bg-black px-3 py-2 text-white" type="button" onClick={handleStartSession}>
            Start Session
          </button>
          <button className="rounded border border-black/30 px-3 py-2" type="button" onClick={handleEndSession}>
            End Session
          </button>
        </div>

        <form className="mb-3 flex flex-col gap-2" onSubmit={handleSendMessage}>
          <textarea
            className="min-h-20 rounded border border-black/20 px-3 py-2"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Send message to POST /sessions/:id/message (SSE)."
          />
          <button className="w-fit rounded border border-black/30 px-3 py-2" type="submit">
            Send Message
          </button>
        </form>

        <p className="text-sm">Active session: {activeSessionId || "none"}</p>
        <p className="text-sm">Feedback session: {feedbackSessionId || "none"}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-black/10 p-3">
            <h3 className="font-medium">Assistant Stream Output</h3>
            <pre className="mt-2 whitespace-pre-wrap text-xs">{assistantStream || "(empty)"}</pre>
          </div>

          <div className="rounded border border-black/10 p-3">
            <h3 className="font-medium">Feedback Polling</h3>
            {feedbackQuery.data?.kind === "pending" ? (
              <p className="mt-2 text-sm">
                Pending ({feedbackQuery.data.data.queueStatus.state}) - polling every 3s
              </p>
            ) : null}
            {feedbackQuery.data?.kind === "ready" ? (
              <pre className="mt-2 whitespace-pre-wrap text-xs">
                {JSON.stringify(feedbackQuery.data.data.feedback.fullFeedback, null, 2)}
              </pre>
            ) : null}
            {!feedbackQuery.data ? <p className="mt-2 text-sm">No feedback request yet.</p> : null}
          </div>
        </div>

        <div className="mt-3 rounded border border-black/10 p-3">
          <h3 className="font-medium">Recent Sessions</h3>
          <pre className="mt-2 overflow-x-auto text-xs">
            {JSON.stringify(historyQuery.data?.sessions || [], null, 2)}
          </pre>
        </div>

        {sessionError ? (
          <p className="mt-2 text-sm text-red-700">Session error: {formatError(sessionError)}</p>
        ) : null}
      </section>

      {lastActionMessage ? (
        <section className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm">
          {lastActionMessage}
        </section>
      ) : null}
    </main>
  );
}

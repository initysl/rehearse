'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiAlertCircle,
  FiClock,
  FiLogOut,
  FiMessageSquare,
  FiPlayCircle,
  FiRefreshCw,
  FiSend,
  FiTrendingUp,
  FiUser,
} from 'react-icons/fi';
import { ApiError } from '@/lib/api/client';
import type { DifficultyLevel } from '@/lib/api/types';
import { useAccessToken } from '@/lib/hooks/use-access-token';
import { useLogoutMutation, useMeQuery } from '@/lib/hooks/use-auth';
import { useSessionFeedbackQuery } from '@/lib/hooks/use-feedback';
import { useScenariosQuery } from '@/lib/hooks/use-scenarios';
import {
  useEndSessionMutation,
  useSendMessageStreamMutation,
  useSessionDetailQuery,
  useSessionHistoryQuery,
  useStartSessionMutation,
} from '@/lib/hooks/use-sessions';

const difficultyOptions: DifficultyLevel[] = [
  'cooperative',
  'neutral',
  'resistant',
  'hostile',
];

const formatError = (error: unknown): string => {
  if (!error) return 'Unknown error';
  if (error instanceof ApiError) return `${error.message} (${error.status})`;
  if (error instanceof Error) return error.message;
  return String(error);
};

export default function ConsolePage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAccessToken();

  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>('neutral');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(
    null,
  );
  const [messageInput, setMessageInput] = useState('');
  const [assistantStream, setAssistantStream] = useState('');
  const [lastActionMessage, setLastActionMessage] = useState('');

  const meQuery = useMeQuery(accessToken);
  const isAuthResolved = !meQuery.isLoading && !meQuery.isFetching;
  const isAuthenticated = Boolean(meQuery.data?.user);

  const scenariosQuery = useScenariosQuery(
    accessToken,
    { limit: 50, offset: 0 },
    isAuthenticated,
  );
  const historyQuery = useSessionHistoryQuery(
    accessToken,
    { limit: 8, offset: 0 },
    isAuthenticated,
  );
  const detailQuery = useSessionDetailQuery(
    accessToken,
    activeSessionId,
    isAuthenticated,
  );
  const feedbackQuery = useSessionFeedbackQuery(
    accessToken,
    feedbackSessionId,
    isAuthenticated && Boolean(feedbackSessionId),
  );

  const logoutMutation = useLogoutMutation(setAccessToken);
  const startSessionMutation = useStartSessionMutation(accessToken);
  const endSessionMutation = useEndSessionMutation(accessToken);
  const sendMessageMutation = useSendMessageStreamMutation(accessToken);

  const scenarioOptions = scenariosQuery.data?.scenarios || [];
  const historyItems = historyQuery.data?.sessions || [];
  const messages = detailQuery.data?.messages || [];

  const sessionError =
    startSessionMutation.error ||
    endSessionMutation.error ||
    sendMessageMutation.error ||
    detailQuery.error;

  const feedbackStatus = useMemo(() => {
    if (!feedbackSessionId) return 'No report requested';
    if (feedbackQuery.data?.kind === 'pending') return 'Report processing';
    if (feedbackQuery.data?.kind === 'ready') return 'Report ready';
    return 'Checking report status';
  }, [feedbackQuery.data, feedbackSessionId]);

  useEffect(() => {
    if (isAuthResolved && !isAuthenticated) {
      router.replace('/auth?mode=signin');
    }
  }, [isAuthResolved, isAuthenticated, router]);

  useEffect(() => {
    if (!scenarioOptions.length) return;

    if (!selectedScenarioId) {
      setSelectedScenarioId(scenarioOptions[0].id);
      return;
    }

    const stillExists = scenarioOptions.some((s) => s.id === selectedScenarioId);
    if (!stillExists) {
      setSelectedScenarioId(scenarioOptions[0].id);
    }
  }, [selectedScenarioId, scenarioOptions]);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      router.replace('/auth?mode=signin');
    }
  };

  const handleStartSession = async () => {
    if (!selectedScenarioId) {
      setLastActionMessage('No scenario selected yet.');
      return;
    }

    setLastActionMessage('');
    setAssistantStream('');

    try {
      const result = await startSessionMutation.mutateAsync({
        scenarioId: selectedScenarioId,
        difficultyLevel,
      });

      setActiveSessionId(result.session.id);
      setFeedbackSessionId(null);
      setLastActionMessage('Session started.');
    } catch {
      // handled by mutation state
    }
  };

  const handleEndSession = async () => {
    if (!activeSessionId) {
      setLastActionMessage('No active session to end.');
      return;
    }

    setLastActionMessage('');

    try {
      const result = await endSessionMutation.mutateAsync({
        sessionId: activeSessionId,
        payload: { status: 'completed' },
      });
      setFeedbackSessionId(result.session.id);
      setLastActionMessage('Session ended. Feedback generation started.');
    } catch {
      // handled by mutation state
    }
  };

  const handleSendMessage = async (event: FormEvent) => {
    event.preventDefault();

    if (!activeSessionId || !messageInput.trim()) {
      setLastActionMessage('Start a session and type a message first.');
      return;
    }

    setAssistantStream('');

    try {
      await sendMessageMutation.mutateAsync({
        sessionId: activeSessionId,
        content: messageInput.trim(),
        onToken: (token) => {
          setAssistantStream((prev) => prev + token);
        },
      });
      setMessageInput('');
    } catch {
      // handled by mutation state
    }
  };

  if (!isAuthResolved) {
    return (
      <main className='relative z-10 flex min-h-screen items-center justify-center px-6 text-white'>
        <div className='rounded-2xl border border-white/10 bg-black/35 px-6 py-5 text-sm text-white/80 backdrop-blur-xl'>
          Checking your session...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className='relative z-10 flex min-h-screen items-center justify-center px-6 text-white'>
        <div className='rounded-2xl border border-white/10 bg-black/35 px-6 py-5 text-sm text-white/80 backdrop-blur-xl'>
          Redirecting to sign in...
        </div>
      </main>
    );
  }

  return (
    <main className='relative z-10 min-h-screen px-4 py-6 text-white sm:px-6'>
      <div className='mx-auto max-w-7xl space-y-5'>
        <header className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl'>
          <div>
            <p className='text-xs uppercase tracking-[0.14em] text-white/55'>
              Rehearse Console
            </p>
            <p className='mt-1 inline-flex items-center gap-2 text-sm text-white/85'>
              <FiUser className='text-amber-300' />
              {meQuery.data?.user?.email || meQuery.data?.user?.userId}
            </p>
          </div>

          <div className='flex flex-wrap items-center gap-2'>
            <Link
              href='/'
              className='rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75 no-underline transition hover:text-white'
            >
              Landing
            </Link>
            <button
              type='button'
              onClick={handleLogout}
              className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07]'
            >
              <FiLogOut size={13} />
              Sign out
            </button>
          </div>
        </header>

        <section className='grid gap-4 xl:grid-cols-[1.05fr_0.95fr]'>
          <article className='rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl'>
            <div className='mb-4 flex flex-wrap items-center justify-between gap-2'>
              <h2 className='text-lg font-semibold'>Session Setup</h2>
              <button
                type='button'
                onClick={() => void scenariosQuery.refetch()}
                className='inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75'
              >
                <FiRefreshCw size={12} />
                Refresh scenarios
              </button>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              <label className='block'>
                <span className='mb-1.5 inline-block text-xs uppercase tracking-[0.08em] text-white/50'>
                  Scenario
                </span>
                <select
                  className='w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none focus:border-amber-400/45'
                  value={selectedScenarioId}
                  onChange={(event) => setSelectedScenarioId(event.target.value)}
                >
                  <option value=''>
                    {scenariosQuery.isLoading
                      ? 'Loading scenarios...'
                      : 'Select scenario'}
                  </option>
                  {scenarioOptions.map((scenario) => (
                    <option key={scenario.id} value={scenario.id}>
                      {scenario.title} ({scenario.category})
                    </option>
                  ))}
                </select>
              </label>

              <label className='block'>
                <span className='mb-1.5 inline-block text-xs uppercase tracking-[0.08em] text-white/50'>
                  Difficulty
                </span>
                <select
                  className='w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none focus:border-amber-400/45'
                  value={difficultyLevel}
                  onChange={(event) =>
                    setDifficultyLevel(event.target.value as DifficultyLevel)
                  }
                >
                  {difficultyOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {scenarioOptions.length === 0 && !scenariosQuery.isLoading ? (
              <p className='mt-3 text-xs text-amber-200'>
                No scenarios available yet. If your DB is empty, run
                `npm run seed:scenarios` in `server/` and refresh.
              </p>
            ) : null}

            {scenariosQuery.error ? (
              <p className='mt-3 text-xs text-rose-300'>
                Scenario fetch error: {formatError(scenariosQuery.error)}
              </p>
            ) : null}

            <div className='mt-4 flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={handleStartSession}
                disabled={startSessionMutation.isPending || !selectedScenarioId}
                className='inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#120f07] disabled:cursor-not-allowed disabled:opacity-60'
              >
                <FiPlayCircle size={13} />
                {startSessionMutation.isPending ? 'Starting...' : 'Start Session'}
              </button>

              <button
                type='button'
                onClick={handleEndSession}
                disabled={endSessionMutation.isPending || !activeSessionId}
                className='rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/75 disabled:cursor-not-allowed disabled:opacity-60'
              >
                {endSessionMutation.isPending ? 'Ending...' : 'End Session'}
              </button>
            </div>
          </article>

          <article className='rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl'>
            <h2 className='text-lg font-semibold'>Feedback</h2>
            <p className='mt-1 text-sm text-white/60'>{feedbackStatus}</p>
            <div className='mt-3 rounded-xl border border-white/15 bg-[#141414] p-3 text-sm text-white/75'>
              {feedbackQuery.data?.kind === 'pending' ? (
                <p>
                  Processing ({feedbackQuery.data.data.queueStatus.state}) and
                  checking automatically.
                </p>
              ) : null}

              {feedbackQuery.data?.kind === 'ready' ? (
                <div className='space-y-2'>
                  <p>
                    Confidence score:{' '}
                    <span className='font-semibold text-amber-300'>
                      {feedbackQuery.data.data.feedback.confidenceScore}
                    </span>
                  </p>
                  <p className='text-xs text-white/55'>
                    {feedbackQuery.data.data.feedback.fullFeedback.overallSummary ||
                      'Feedback generated successfully.'}
                  </p>
                </div>
              ) : null}

              {!feedbackQuery.data ? (
                <p>No feedback yet. End a session to generate one.</p>
              ) : null}
            </div>
          </article>
        </section>

        <section className='grid gap-4 xl:grid-cols-[1.2fr_0.8fr]'>
          <article className='rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl'>
            <div className='mb-3 flex items-center justify-between'>
              <h2 className='text-lg font-semibold'>Live Conversation</h2>
              <p className='text-xs uppercase tracking-wider text-white/50'>
                {activeSessionId ? 'Active' : 'Idle'}
              </p>
            </div>

            <div className='max-h-72 space-y-2 overflow-auto rounded-xl border border-white/15 bg-[#141414] p-3'>
              {messages.length ? (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`max-w-[90%] rounded-xl px-3 py-2 text-sm ${
                      message.role === 'user'
                        ? 'ml-auto border border-amber-400/25 bg-amber-400/10 text-amber-100'
                        : 'border border-white/15 bg-white/5 text-white/85'
                    }`}
                  >
                    {message.content}
                  </div>
                ))
              ) : (
                <p className='text-sm text-white/45'>
                  No messages yet. Start a session and send your first message.
                </p>
              )}

              {assistantStream ? (
                <div className='max-w-[90%] rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-100'>
                  {assistantStream}
                </div>
              ) : null}
            </div>

            <form className='mt-3 flex flex-col gap-2' onSubmit={handleSendMessage}>
              <textarea
                className='min-h-24 w-full rounded-xl border border-white/15 bg-[#141414] px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-400/45'
                placeholder='Type your next message...'
                value={messageInput}
                onChange={(event) => setMessageInput(event.target.value)}
              />

              <button
                type='submit'
                disabled={sendMessageMutation.isPending || !activeSessionId}
                className='inline-flex w-fit items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white/80 disabled:cursor-not-allowed disabled:opacity-60'
              >
                <FiSend size={12} />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </article>

          <article className='rounded-2xl border border-white/15 bg-black/30 p-4 backdrop-blur-xl'>
            <h2 className='text-lg font-semibold'>Recent Sessions</h2>
            <div className='mt-3 space-y-2'>
              {historyItems.length ? (
                historyItems.map((session) => (
                  <button
                    key={session.id}
                    type='button'
                    onClick={() => {
                      setActiveSessionId(session.id);
                      setFeedbackSessionId(session.id);
                    }}
                    className='flex w-full items-center justify-between rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-left transition hover:border-amber-400/35'
                  >
                    <div>
                      <p className='text-sm text-white'>{session.scenarioTitle}</p>
                      <p className='text-xs uppercase tracking-wider text-white/45'>
                        {session.scenarioCategory} · {session.status}
                      </p>
                    </div>
                    <FiTrendingUp className='text-white/40' size={14} />
                  </button>
                ))
              ) : (
                <p className='rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-white/45'>
                  No recent sessions yet.
                </p>
              )}
            </div>
          </article>
        </section>

        {lastActionMessage ? (
          <section className='inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200'>
            <FiMessageSquare className='text-emerald-300' />
            {lastActionMessage}
          </section>
        ) : null}

        {sessionError ? (
          <section className='inline-flex w-fit items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200'>
            <FiAlertCircle className='text-rose-300' />
            {formatError(sessionError)}
          </section>
        ) : null}

        <section className='inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/65'>
          <FiClock />
          Scenario count: {scenarioOptions.length}
          {scenariosQuery.isFetching ? ' • refreshing...' : ''}
        </section>
      </div>
    </main>
  );
}

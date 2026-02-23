'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiLoader,
  FiZap,
} from 'react-icons/fi';
import { ApiError } from '@/lib/api/client';
import type {
  CreateCustomScenarioInput,
  DifficultyLevel,
} from '@/lib/api/types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type {
  DashboardView,
  ScenarioCategoryFilter,
} from '@/components/dashboard/types';
import { ConversationView } from '@/components/dashboard/views/conversation-view';
import { FeedbackView } from '@/components/dashboard/views/feedback-view';
import { ProfileHistoryView } from '@/components/dashboard/views/profile-history-view';
import { ScenarioBrowserView } from '@/components/dashboard/views/scenario-browser-view';
import { SessionSetupView } from '@/components/dashboard/views/session-setup-view';
import { useAccessToken } from '@/lib/hooks/use-access-token';
import { useLogoutMutation, useMeQuery } from '@/lib/hooks/use-auth';
import { useSessionFeedbackQuery } from '@/lib/hooks/use-feedback';
import {
  useCreateScenarioMutation,
  useDeleteScenarioMutation,
  useScenariosQuery,
  useUpdateScenarioMutation,
} from '@/lib/hooks/use-scenarios';
import {
  useClearSessionHistoryMutation,
  useEndSessionMutation,
  useSessionDetailQuery,
  useSessionHistoryQuery,
  useStartSessionMutation,
} from '@/lib/hooks/use-sessions';
import { useVoiceSession } from '@/lib/hooks/use-voice-session';

const formatError = (error: unknown): string => {
  if (!error) return 'Unknown error';
  if (error instanceof ApiError) return `${error.message} (${error.status})`;
  if (error instanceof Error) return error.message;
  return String(error);
};

export default function ConsolePage() {
  const router = useRouter();
  const { accessToken, setAccessToken } = useAccessToken();

  const [activeView, setActiveView] = useState<DashboardView>('conversation');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [difficultyLevel, setDifficultyLevel] =
    useState<DifficultyLevel>('neutral');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [feedbackSessionId, setFeedbackSessionId] = useState<string | null>(
    null,
  );
  const [lastActionMessage, setLastActionMessage] = useState('');

  const [scenarioSearch, setScenarioSearch] = useState('');
  const [scenarioCategory, setScenarioCategory] =
    useState<ScenarioCategoryFilter>('all');
  const [scenarioCustomOnly, setScenarioCustomOnly] = useState(false);
  const [pendingClearRecent, setPendingClearRecent] = useState<{
    secondsLeft: number;
  } | null>(null);
  const clearRecentTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const clearRecentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const meQuery = useMeQuery(accessToken);
  const isAuthResolved = !meQuery.isLoading && !meQuery.isFetching;
  const isAuthenticated = Boolean(meQuery.data?.user);

  const scenariosQuery = useScenariosQuery(
    accessToken,
    { limit: 100, offset: 0 },
    isAuthenticated,
  );
  const historyQuery = useSessionHistoryQuery(
    accessToken,
    { limit: 12, offset: 0 },
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
  const createScenarioMutation = useCreateScenarioMutation(accessToken);
  const updateScenarioMutation = useUpdateScenarioMutation(accessToken);
  const deleteScenarioMutation = useDeleteScenarioMutation(accessToken);
  const clearSessionHistoryMutation =
    useClearSessionHistoryMutation(accessToken);

  const scenarioOptions = scenariosQuery.data?.scenarios || [];
  const historyItems = historyQuery.data?.sessions || [];
  const messages = detailQuery.data?.messages || [];
  const selectedScenario =
    scenarioOptions.find((scenario) => scenario.id === selectedScenarioId) ||
    null;
  const currentSessionStatus = detailQuery.data?.session.status;
  const isVoiceEnabled = Boolean(
    isAuthenticated &&
    activeSessionId &&
    activeView === 'conversation' &&
    currentSessionStatus !== 'completed' &&
    currentSessionStatus !== 'abandoned',
  );

  const voiceSession = useVoiceSession({
    sessionId: activeSessionId,
    accessToken,
    enabled: isVoiceEnabled,
    onTranscript: () => {
      void detailQuery.refetch();
    },
    onAssistantText: () => {
      void detailQuery.refetch();
    },
    onResponseComplete: () => {
      void detailQuery.refetch();
      void historyQuery.refetch();
    },
    onError: (message) => {
      setLastActionMessage(`Voice: ${message}`);
    },
  });

  const filteredScenarios = useMemo(() => {
    return scenarioOptions.filter((scenario) => {
      if (scenarioCustomOnly && !scenario.isCustom) return false;
      if (scenarioCategory !== 'all' && scenario.category !== scenarioCategory)
        return false;
      if (scenarioSearch.trim()) {
        const haystack =
          `${scenario.title} ${scenario.description}`.toLowerCase();
        if (!haystack.includes(scenarioSearch.trim().toLowerCase()))
          return false;
      }
      return true;
    });
  }, [scenarioCategory, scenarioCustomOnly, scenarioOptions, scenarioSearch]);

  const sessionError =
    startSessionMutation.error || endSessionMutation.error || detailQuery.error;

  const completedSessions = useMemo(
    () =>
      historyItems.filter((session) => session.status === 'completed').length,
    [historyItems],
  );

  const feedbackStatus = useMemo(() => {
    if (!feedbackSessionId) return 'No report requested';
    if (feedbackQuery.data?.kind === 'pending') return 'Report processing';
    if (feedbackQuery.data?.kind === 'ready') return 'Report ready';
    return 'Checking report status';
  }, [feedbackQuery.data, feedbackSessionId]);

  const userSummary = useMemo(() => {
    if (!meQuery.data?.user) return 'Loading user...';
    return meQuery.data.user.email || meQuery.data.user.userId;
  }, [meQuery.data]);

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

    const stillExists = scenarioOptions.some(
      (s) => s.id === selectedScenarioId,
    );
    if (!stillExists) {
      setSelectedScenarioId(scenarioOptions[0].id);
    }
  }, [selectedScenarioId, scenarioOptions]);

  useEffect(() => {
    if (activeSessionId) return;
    if (voiceSession.isRecording) {
      voiceSession.stopRecording();
    }
  }, [activeSessionId, voiceSession.isRecording, voiceSession.stopRecording]);

  const clearPendingClearRecentTimers = () => {
    if (clearRecentTimeoutRef.current) {
      clearTimeout(clearRecentTimeoutRef.current);
      clearRecentTimeoutRef.current = null;
    }
    if (clearRecentIntervalRef.current) {
      clearInterval(clearRecentIntervalRef.current);
      clearRecentIntervalRef.current = null;
    }
  };

  useEffect(
    () => () => {
      if (clearRecentTimeoutRef.current) {
        clearTimeout(clearRecentTimeoutRef.current);
      }
      if (clearRecentIntervalRef.current) {
        clearInterval(clearRecentIntervalRef.current);
      }
    },
    [],
  );

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

    try {
      const result = await startSessionMutation.mutateAsync({
        scenarioId: selectedScenarioId,
        difficultyLevel,
      });

      setActiveSessionId(result.session.id);
      setFeedbackSessionId(null);
      setActiveView('conversation');
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
      setActiveView('feedback');
      setLastActionMessage('Session ended. Feedback generation started.');
    } catch {
      // handled by mutation state
    }
  };

  const handleCreateCustomScenario = async (
    payload: CreateCustomScenarioInput,
  ): Promise<void> => {
    const created = await createScenarioMutation.mutateAsync(payload);
    setSelectedScenarioId(created.scenario.id);
    setScenarioCustomOnly(false);
    setScenarioCategory('all');
    setLastActionMessage('Custom scenario created.');
    void scenariosQuery.refetch();
  };

  const handleUpdateCustomScenario = async (input: {
    scenarioId: string;
    payload: CreateCustomScenarioInput;
  }): Promise<void> => {
    const updated = await updateScenarioMutation.mutateAsync(input);
    setSelectedScenarioId(updated.scenario.id);
    setLastActionMessage('Custom scenario updated.');
    void scenariosQuery.refetch();
  };

  const handleDeleteCustomScenario = async (
    scenarioId: string,
  ): Promise<void> => {
    await deleteScenarioMutation.mutateAsync(scenarioId);
    if (selectedScenarioId === scenarioId) {
      const fallback = filteredScenarios.find(
        (scenario) => scenario.id !== scenarioId,
      );
      setSelectedScenarioId(fallback?.id || '');
    }
    setLastActionMessage('Custom scenario deleted.');
    void scenariosQuery.refetch();
  };

  const handleClearRecent = async (): Promise<void> => {
    if (clearSessionHistoryMutation.isPending) return;
    clearPendingClearRecentTimers();
    setLastActionMessage('');
    setPendingClearRecent({ secondsLeft: 5 });

    clearRecentIntervalRef.current = setInterval(() => {
      setPendingClearRecent((previous) => {
        if (!previous) return null;
        return {
          secondsLeft: previous.secondsLeft > 1 ? previous.secondsLeft - 1 : 1,
        };
      });
    }, 1000);

    clearRecentTimeoutRef.current = setTimeout(() => {
      clearPendingClearRecentTimers();
      setPendingClearRecent(null);

      void (async () => {
        try {
          const result = await clearSessionHistoryMutation.mutateAsync({
            scope: 'non_active',
            limit: 200,
          });
          if (result.deletedCount > 0) {
            setFeedbackSessionId(null);
          }
          setLastActionMessage(
            `Cleared ${result.deletedCount} recent sessions.`,
          );
        } catch {
          setLastActionMessage('Could not clear recent sessions right now.');
        }
      })();
    }, 5000);
  };

  const handleUndoClearRecent = () => {
    clearPendingClearRecentTimers();
    setPendingClearRecent(null);
    setLastActionMessage('Clear recent canceled.');
  };

  const scenarioErrorMessage = scenariosQuery.error
    ? `Scenario fetch error: ${formatError(scenariosQuery.error)}`
    : undefined;
  const createScenarioErrorMessage = createScenarioMutation.error
    ? `Create scenario error: ${formatError(createScenarioMutation.error)}`
    : updateScenarioMutation.error
      ? `Update scenario error: ${formatError(updateScenarioMutation.error)}`
      : deleteScenarioMutation.error
        ? `Delete scenario error: ${formatError(deleteScenarioMutation.error)}`
        : undefined;

  const sessionErrorMessage = sessionError
    ? formatError(sessionError)
    : undefined;

  const scenarioBrowserView = (
    <ScenarioBrowserView
      scenarios={filteredScenarios}
      selectedScenarioId={selectedScenarioId}
      search={scenarioSearch}
      category={scenarioCategory}
      customOnly={scenarioCustomOnly}
      isLoading={scenariosQuery.isLoading}
      isFetching={scenariosQuery.isFetching}
      isCreatingScenario={createScenarioMutation.isPending}
      isUpdatingScenario={updateScenarioMutation.isPending}
      isDeletingScenario={deleteScenarioMutation.isPending}
      errorMessage={scenarioErrorMessage}
      createScenarioErrorMessage={createScenarioErrorMessage}
      onSearchChange={setScenarioSearch}
      onCategoryChange={setScenarioCategory}
      onCustomOnlyChange={setScenarioCustomOnly}
      onRefresh={() => void scenariosQuery.refetch()}
      onSelectScenario={setSelectedScenarioId}
      onStartPractice={() => setActiveView('session-setup')}
      onCreateScenario={handleCreateCustomScenario}
      onUpdateScenario={handleUpdateCustomScenario}
      onDeleteScenario={handleDeleteCustomScenario}
    />
  );

  const setupView = (
    <SessionSetupView
      scenarios={scenarioOptions}
      selectedScenarioId={selectedScenarioId}
      difficultyLevel={difficultyLevel}
      onScenarioChange={setSelectedScenarioId}
      onDifficultyChange={setDifficultyLevel}
      onStartSession={handleStartSession}
      onEndSession={handleEndSession}
      isStarting={startSessionMutation.isPending}
      isEnding={endSessionMutation.isPending}
      activeSessionId={activeSessionId}
      errorMessage={sessionErrorMessage}
    />
  );

  const conversationView = (
    <ConversationView
      activeSessionId={activeSessionId}
      messages={messages}
      voiceSupported={voiceSession.isSupported}
      voiceConnectionState={voiceSession.connectionState}
      voiceStatus={voiceSession.status}
      isRecording={voiceSession.isRecording}
      isPlayingAudio={voiceSession.isPlayingAudio}
      isAudioPaused={voiceSession.isAudioPaused}
      voiceTranscript={voiceSession.lastTranscript}
      voiceAssistantText={voiceSession.lastAssistantText}
      voiceErrorMessage={voiceSession.lastError || undefined}
      aiCharacterName={selectedScenario?.characterProfile.name}
      onToggleRecording={voiceSession.toggleRecording}
      onToggleAudioPlayback={voiceSession.toggleAudioPlayback}
    />
  );

  const feedbackView = (
    <FeedbackView
      feedbackStatus={feedbackStatus}
      feedback={feedbackQuery.data}
    />
  );

  const profileHistoryView = (
    <ProfileHistoryView
      userSummary={userSummary}
      completedSessions={completedSessions}
      totalScenarios={scenarioOptions.length}
      historyItems={historyItems}
      onClearRecent={handleClearRecent}
      isClearingRecent={
        clearSessionHistoryMutation.isPending || Boolean(pendingClearRecent)
      }
      onSelectSession={(sessionId) => {
        setActiveSessionId(sessionId);
        setFeedbackSessionId(sessionId);
        setActiveView('conversation');
      }}
    />
  );

  let primaryOutlet = conversationView;
  if (activeView === 'scenario-browser') primaryOutlet = scenarioBrowserView;
  if (activeView === 'session-setup') primaryOutlet = setupView;
  if (activeView === 'feedback') primaryOutlet = feedbackView;
  if (activeView === 'history-profile') primaryOutlet = profileHistoryView;

  const secondaryRail = [
    activeView === 'session-setup' ? feedbackView : setupView,
    activeView === 'feedback' ? profileHistoryView : feedbackView,
  ];

  if (!isAuthResolved) {
    return (
      <main className='relative z-10 flex min-h-screen items-center justify-center px-6 text-white'>
        <FiLoader
          className='animate-spin rounded-full border-2 text-white border-white border-t-[#e77212]'
          aria-hidden='true'
          size={40}
        />
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
    <DashboardShell
      activeView={activeView}
      onSelectView={(view) => {
        setActiveView(view);
      }}
      sidebarOpen={sidebarOpen}
      onOpenSidebar={() => setSidebarOpen(true)}
      onCloseSidebar={() => setSidebarOpen(false)}
      userSummary={userSummary}
      scenarioCount={scenarioOptions.length}
      completedSessions={completedSessions}
      activeSessionId={activeSessionId}
      onLogout={handleLogout}
    >
      <div className='grid gap-4 xl:grid-cols-[1.25fr_0.75fr]'>
        <div className='space-y-4'>
          {primaryOutlet}

          {pendingClearRecent ? (
            <section className='inline-flex w-fit items-center gap-2 rounded-xl border border-sky-300/25 bg-sky-300/10 px-3 py-2 text-sm text-sky-100'>
              <FiClock className='text-sky-200' />
              Clearing recent in {pendingClearRecent.secondsLeft}s.
              <button
                type='button'
                onClick={handleUndoClearRecent}
                className='rounded-md border border-sky-200/30 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-100 transition hover:bg-sky-300/15'
              >
                Undo
              </button>
            </section>
          ) : null}

          {lastActionMessage ? (
            <section className='inline-flex w-fit items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200'>
              <FiCheckCircle className='text-emerald-300' />
              {lastActionMessage}
            </section>
          ) : null}

          {sessionErrorMessage ? (
            <section className='inline-flex w-fit items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200'>
              <FiAlertCircle className='text-rose-300' />
              {sessionErrorMessage}
            </section>
          ) : null}
        </div>

        <div className='space-y-4'>
          {secondaryRail[0]}
          {secondaryRail[1]}

          <section className='rounded-xl border border-white/15 bg-black/25 px-3 py-2 text-xs text-white/65'>
            <p className='inline-flex items-center gap-2'>
              <FiClock />
              Scenarios: {scenarioOptions.length}
              {scenariosQuery.isFetching ? ' • refreshing...' : ''}
            </p>
            <p className='mt-1 inline-flex items-center gap-2'>
              <FiZap />
              Session status: {activeSessionId ? 'Active' : 'Idle'}
            </p>
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}

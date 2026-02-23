'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiAlertCircle, FiCheckCircle, FiClock, FiZap } from 'react-icons/fi';
import { ApiError } from '@/lib/api/client';
import type { DifficultyLevel } from '@/lib/api/types';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { DashboardView, ScenarioCategoryFilter } from '@/components/dashboard/types';
import { ConversationView } from '@/components/dashboard/views/conversation-view';
import { FeedbackView } from '@/components/dashboard/views/feedback-view';
import { ProfileHistoryView } from '@/components/dashboard/views/profile-history-view';
import { ScenarioBrowserView } from '@/components/dashboard/views/scenario-browser-view';
import { SessionSetupView } from '@/components/dashboard/views/session-setup-view';
import { useAccessToken } from '@/lib/hooks/use-access-token';
import { useLogoutMutation, useMeQuery } from '@/lib/hooks/use-auth';
import { useSessionFeedbackQuery } from '@/lib/hooks/use-feedback';
import { useScenariosQuery } from '@/lib/hooks/use-scenarios';
import {
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

  const scenarioOptions = scenariosQuery.data?.scenarios || [];
  const historyItems = historyQuery.data?.sessions || [];
  const messages = detailQuery.data?.messages || [];
  const selectedScenario =
    scenarioOptions.find((scenario) => scenario.id === selectedScenarioId) || null;
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
        const haystack = `${scenario.title} ${scenario.description}`.toLowerCase();
        if (!haystack.includes(scenarioSearch.trim().toLowerCase())) return false;
      }
      return true;
    });
  }, [scenarioCategory, scenarioCustomOnly, scenarioOptions, scenarioSearch]);

  const sessionError =
    startSessionMutation.error ||
    endSessionMutation.error ||
    detailQuery.error;

  const completedSessions = useMemo(
    () => historyItems.filter((session) => session.status === 'completed').length,
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

    const stillExists = scenarioOptions.some((s) => s.id === selectedScenarioId);
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

  const scenarioErrorMessage = scenariosQuery.error
    ? `Scenario fetch error: ${formatError(scenariosQuery.error)}`
    : undefined;

  const sessionErrorMessage = sessionError ? formatError(sessionError) : undefined;

  const scenarioBrowserView = (
    <ScenarioBrowserView
      scenarios={filteredScenarios}
      selectedScenarioId={selectedScenarioId}
      search={scenarioSearch}
      category={scenarioCategory}
      customOnly={scenarioCustomOnly}
      isLoading={scenariosQuery.isLoading}
      isFetching={scenariosQuery.isFetching}
      errorMessage={scenarioErrorMessage}
      onSearchChange={setScenarioSearch}
      onCategoryChange={setScenarioCategory}
      onCustomOnlyChange={setScenarioCustomOnly}
      onRefresh={() => void scenariosQuery.refetch()}
      onSelectScenario={setSelectedScenarioId}
      onStartPractice={() => setActiveView('session-setup')}
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
    <FeedbackView feedbackStatus={feedbackStatus} feedback={feedbackQuery.data} />
  );

  const profileHistoryView = (
    <ProfileHistoryView
      userSummary={userSummary}
      completedSessions={completedSessions}
      totalScenarios={scenarioOptions.length}
      historyItems={historyItems}
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

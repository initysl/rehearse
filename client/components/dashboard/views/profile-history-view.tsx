import type { SessionHistoryItem } from '@/lib/api/types';
import {
  FiArrowRight,
  FiBarChart2,
  FiClock,
  FiTrendingUp,
  FiUser,
  FiX,
} from 'react-icons/fi';
import { Panel } from '../panel';

type ProfileHistoryViewProps = {
  userSummary: string;
  completedSessions: number;
  totalScenarios: number;
  historyItems: SessionHistoryItem[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (
    sessionId: string,
    status: SessionHistoryItem['status'],
  ) => Promise<void>;
  onClearRecentSessions: () => Promise<void>;
  onLoadMoreHistory: () => void;
  deletingSessionId: string | null;
  isClearingRecentSessions: boolean;
  hasMoreHistory: boolean;
  isLoadingMoreHistory: boolean;
  isHistoryLoading: boolean;
};

export function ProfileHistoryView({
  userSummary,
  completedSessions,
  totalScenarios,
  historyItems,
  onSelectSession,
  onDeleteSession,
  onClearRecentSessions,
  onLoadMoreHistory,
  deletingSessionId,
  isClearingRecentSessions,
  hasMoreHistory,
  isLoadingMoreHistory,
  isHistoryLoading,
}: ProfileHistoryViewProps) {
  return (
    <Panel
      title='User Profile & History'
      description='Session timeline and growth snapshot.'
    >
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='min-w-0 rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiUser />
            Account
          </p>
          <p className='mt-1 truncate text-xs text-white/75'>{userSummary}</p>
        </div>

        <div className='min-w-0 rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiTrendingUp />
            Completed
          </p>
          <p className='mt-1 text-xl font-semibold text-white'>
            {completedSessions}
          </p>
        </div>

        <div className='min-w-0 rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiBarChart2 />
            Scenarios
          </p>
          <p className='mt-1 text-xl font-semibold text-white'>
            {totalScenarios}
          </p>
        </div>
      </div>

      <div className='mt-4'>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-3'>
          <p className='inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/45'>
            <FiClock size={12} />
            Recent Sessions
          </p>
          <div className='flex w-full items-center justify-start gap-2 sm:w-auto'>
            <button
              type='button'
              onClick={() => {
                void onClearRecentSessions();
              }}
              disabled={isClearingRecentSessions || historyItems.length === 0}
              className='w-full rounded-md border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-widest text-white/60 transition hover:border-amber-300/40 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto'
            >
              {isClearingRecentSessions ? 'Clearing...' : 'Clear recent'}
            </button>
          </div>
        </div>

        <div className='max-h-96 space-y-2 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin]'>
          {isHistoryLoading ? (
            <p className='rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-white/45'>
              Loading history...
            </p>
          ) : historyItems.length ? (
            historyItems.map((session) => (
              <div
                key={session.id}
                className='min-w-0 flex items-center gap-2 rounded-xl border border-white/15 bg-[#141414] px-3 py-2 transition hover:border-amber-400/35'
              >
                <button
                  type='button'
                  onClick={() => onSelectSession(session.id)}
                  className='flex min-w-0 flex-1 items-center justify-between text-left'
                >
                  <div className='min-w-0'>
                    <p className='truncate text-sm text-white'>
                      {session.scenarioTitle}
                    </p>
                    <p className='truncate text-xs uppercase tracking-[0.08em] text-white/45'>
                      {session.scenarioCategory} · {session.status}
                    </p>
                  </div>
                  <FiArrowRight className='ml-2 shrink-0 text-white/35' />
                </button>

                <button
                  type='button'
                  onClick={() => {
                    void onDeleteSession(session.id, session.status);
                  }}
                  disabled={deletingSessionId === session.id}
                  aria-label={`Delete ${session.scenarioTitle}`}
                  className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white/60 transition hover:border-rose-300/50 hover:bg-rose-400/10 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  <FiX size={13} />
                </button>
              </div>
            ))
          ) : (
            <p className='rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-white/45'>
              No recent sessions yet.
            </p>
          )}

          {historyItems.length ? (
            <div className='pt-1'>
              <button
                type='button'
                onClick={onLoadMoreHistory}
                disabled={!hasMoreHistory || isLoadingMoreHistory}
                className='w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-xs uppercase tracking-widest text-white/65 transition hover:border-amber-300/40 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-45'
              >
                {isLoadingMoreHistory
                  ? 'Loading more...'
                  : hasMoreHistory
                    ? 'Load older sessions'
                    : 'All loaded'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

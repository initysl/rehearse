import type { SessionHistoryItem } from '@/lib/api/types';
import { FiArrowRight, FiBarChart2, FiClock, FiTrendingUp, FiUser } from 'react-icons/fi';
import { Panel } from '../panel';

type ProfileHistoryViewProps = {
  userSummary: string;
  completedSessions: number;
  totalScenarios: number;
  historyItems: SessionHistoryItem[];
  onSelectSession: (sessionId: string) => void;
  onClearRecent: () => Promise<void>;
  isClearingRecent: boolean;
};

export function ProfileHistoryView({
  userSummary,
  completedSessions,
  totalScenarios,
  historyItems,
  onSelectSession,
  onClearRecent,
  isClearingRecent,
}: ProfileHistoryViewProps) {
  return (
    <Panel
      title='User Profile & History'
      description='Session timeline and growth snapshot.'
    >
      <div className='grid gap-3 sm:grid-cols-3'>
        <div className='rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiUser />
            Account
          </p>
          <p className='mt-1 truncate text-xs text-white/75'>{userSummary}</p>
        </div>

        <div className='rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiTrendingUp />
            Completed
          </p>
          <p className='mt-1 text-xl font-semibold text-white'>{completedSessions}</p>
        </div>

        <div className='rounded-xl border border-white/15 bg-[#141414] p-3'>
          <p className='inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-white/45'>
            <FiBarChart2 />
            Scenarios
          </p>
          <p className='mt-1 text-xl font-semibold text-white'>{totalScenarios}</p>
        </div>
      </div>

      <div className='mt-4'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <p className='inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/45'>
            <FiClock size={12} />
            Recent Sessions
          </p>
          <button
            type='button'
            onClick={() => {
              void onClearRecent();
            }}
            disabled={isClearingRecent || historyItems.length === 0}
            className='rounded-lg border border-white/20 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isClearingRecent ? 'Clearing...' : 'Clear recent'}
          </button>
        </div>

        <div className='space-y-2'>
          {historyItems.length ? (
            historyItems.map((session) => (
              <button
                key={session.id}
                type='button'
                onClick={() => onSelectSession(session.id)}
                className='flex w-full items-center justify-between rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-left transition hover:border-amber-400/35'
              >
                <div>
                  <p className='text-sm text-white'>{session.scenarioTitle}</p>
                  <p className='text-xs uppercase tracking-[0.08em] text-white/45'>
                    {session.scenarioCategory} · {session.status}
                  </p>
                </div>
                <FiArrowRight className='text-white/35' />
              </button>
            ))
          ) : (
            <p className='rounded-xl border border-white/15 bg-[#141414] px-3 py-2 text-sm text-white/45'>
              No recent sessions yet.
            </p>
          )}
        </div>
      </div>
    </Panel>
  );
}

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
  onDeleteSession: (sessionId: string) => Promise<void>;
  deletingSessionId: string | null;
};

export function ProfileHistoryView({
  userSummary,
  completedSessions,
  totalScenarios,
  historyItems,
  onSelectSession,
  onDeleteSession,
  deletingSessionId,
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
          <p className='text-[10px] uppercase tracking-[0.1em] text-white/35'>
            Tap <FiX className='mx-1 inline-block' size={10} /> to remove one
          </p>
        </div>

        <div className='space-y-2'>
          {historyItems.length ? (
            historyItems.map((session) => (
              <div
                key={session.id}
                className='flex items-center gap-2 rounded-xl border border-white/15 bg-[#141414] px-3 py-2 transition hover:border-amber-400/35'
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
                    <p className='text-xs uppercase tracking-[0.08em] text-white/45'>
                      {session.scenarioCategory} · {session.status}
                    </p>
                  </div>
                  <FiArrowRight className='ml-2 shrink-0 text-white/35' />
                </button>

                <button
                  type='button'
                  onClick={() => {
                    void onDeleteSession(session.id);
                  }}
                  disabled={
                    deletingSessionId === session.id || session.status === 'active'
                  }
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
        </div>
      </div>
    </Panel>
  );
}

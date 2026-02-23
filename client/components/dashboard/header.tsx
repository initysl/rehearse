import { FiMenu } from 'react-icons/fi';
import type { DashboardView } from './types';

type DashboardHeaderProps = {
  activeView: DashboardView;
  userSummary: string;
  activeSessionId: string | null;
  onOpenSidebar: () => void;
};

const viewTitleMap: Record<DashboardView, string> = {
  'scenario-browser': 'Scenario Browser',
  'session-setup': 'Session Setup',
  conversation: 'Conversation Workspace',
  feedback: 'Feedback Dashboard',
  'history-profile': 'Profile & History',
};

export function DashboardHeader({
  activeView,
  userSummary,
  activeSessionId,
  onOpenSidebar,
}: DashboardHeaderProps) {
  return (
    <header className='sticky top-3 z-20 rounded-2xl border border-white/15 bg-black/30 p-3 backdrop-blur-xl sm:p-4'>
      <div className='flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <button
            type='button'
            onClick={onOpenSidebar}
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/6 text-white lg:hidden'
            aria-label='Open sidebar'
          >
            <FiMenu size={16} />
          </button>

          <div className='min-w-0'>
            <p className='truncate text-xs uppercase tracking-[0.12em] text-white/50'>
              {viewTitleMap[activeView]}
            </p>
            <p className='truncate text-sm text-white/85'>
              {userSummary}
              {activeSessionId ? ` • Active session` : ''}
            </p>
          </div>
        </div>

        <div className='hidden items-center gap-2 rounded-xl border border-white/15 bg-white/6 px-3 py-2 text-xs text-white/70 sm:flex'>
          <span className='h-2 w-2 rounded-full bg-emerald-400' />
          System healthy
        </div>
      </div>
    </header>
  );
}

import type { ReactNode } from 'react';
import { DashboardHeader } from './header';
import { DashboardSidebar } from './sidebar';
import type { DashboardView } from './types';

type DashboardShellProps = {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  sidebarOpen: boolean;
  onOpenSidebar: () => void;
  onCloseSidebar: () => void;
  userSummary: string;
  scenarioCount: number;
  completedSessions: number;
  activeSessionId: string | null;
  onLogout: () => void;
  children: ReactNode;
};

export function DashboardShell({
  activeView,
  onSelectView,
  sidebarOpen,
  onOpenSidebar,
  onCloseSidebar,
  userSummary,
  scenarioCount,
  completedSessions,
  activeSessionId,
  onLogout,
  children,
}: DashboardShellProps) {
  return (
    <main className='relative z-10 h-dvh overflow-hidden px-3 py-3 text-white sm:px-4 sm:py-4'>
      <div
        onClick={onCloseSidebar}
        className={`fixed inset-0 z-40 bg-black/60 transition lg:hidden ${
          sidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        className={`fixed inset-y-3 left-3 z-50 transition duration-300 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-[108%]'
        }`}
      >
        <DashboardSidebar
          mobile
          activeView={activeView}
          onSelectView={onSelectView}
          onLogout={onLogout}
          onNavigate={onCloseSidebar}
          userSummary={userSummary}
          scenarioCount={scenarioCount}
          completedSessions={completedSessions}
          activeSession={Boolean(activeSessionId)}
          className='h-[calc(100dvh-1.5rem)]'
        />
      </div>

      <div className='mx-auto flex h-full w-full max-w-350 gap-4 overflow-hidden'>
        <div className='hidden h-full shrink-0 lg:block'>
          <div className='h-full'>
            <DashboardSidebar
              activeView={activeView}
              onSelectView={onSelectView}
              onLogout={onLogout}
              userSummary={userSummary}
              scenarioCount={scenarioCount}
              completedSessions={completedSessions}
              activeSession={Boolean(activeSessionId)}
              className='h-full'
            />
          </div>
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-4 overflow-hidden'>
          {/* <DashboardHeader
            activeView={activeView}
            userSummary={userSummary}
            activeSessionId={activeSessionId}
            onOpenSidebar={onOpenSidebar}
          /> */}

          <div className='min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]'>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

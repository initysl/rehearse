import { useEffect, useRef, type ReactNode } from 'react';
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
  const mobileSidebarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!sidebarOpen || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) onCloseSidebar();
    };

    if (mediaQuery.matches) {
      onCloseSidebar();
      return;
    }

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => {
      mediaQuery.removeEventListener('change', handleViewportChange);
    };
  }, [sidebarOpen, onCloseSidebar]);

  useEffect(() => {
    if (!sidebarOpen || typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 768px)').matches) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen || typeof window === 'undefined') return;
    if (window.matchMedia('(min-width: 768px)').matches) return;

    const container = mobileSidebarRef.current;
    if (!container) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const getFocusableElements = () =>
      Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('disabled'),
      );

    const initialFocusable = getFocusableElements()[0];
    (initialFocusable || container).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseSidebar();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) {
        event.preventDefault();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [sidebarOpen, onCloseSidebar]);

  return (
    <main className='relative z-10 h-dvh overflow-hidden px-3 py-3 text-white sm:px-4 sm:py-4'>
      <div
        onClick={onCloseSidebar}
        className={`fixed inset-0 z-40 bg-black/60 transition md:hidden ${
          sidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        ref={mobileSidebarRef}
        tabIndex={-1}
        role='dialog'
        aria-modal='true'
        aria-label='Navigation menu'
        className={`fixed inset-y-3 left-3 z-50 transition duration-300 md:hidden ${
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
        <div className='hidden h-full shrink-0 md:block lg:hidden'>
          <div className='h-full'>
            <DashboardSidebar
              compact
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
          <DashboardHeader
            onOpenSidebar={onOpenSidebar}
            sidebarOpen={sidebarOpen}
          />

          <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto pr-1 [scrollbar-color:rgba(255,255,255,0.22)_transparent] [scrollbar-width:thin]'>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

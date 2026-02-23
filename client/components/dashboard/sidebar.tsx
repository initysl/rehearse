import Link from 'next/link';
import { FiLogOut } from 'react-icons/fi';
import { dashboardNavItems } from './nav';
import type { DashboardView } from './types';
import { GiSparkles } from 'react-icons/gi';

type DashboardSidebarProps = {
  activeView: DashboardView;
  onSelectView: (view: DashboardView) => void;
  onLogout: () => void;
  onNavigate?: () => void;
  userSummary: string;
  scenarioCount: number;
  completedSessions: number;
  activeSession: boolean;
  mobile?: boolean;
  className?: string;
};

export function DashboardSidebar({
  activeView,
  onSelectView,
  onLogout,
  onNavigate,
  userSummary,
  scenarioCount,
  completedSessions,
  activeSession,
  mobile = false,
  className,
}: DashboardSidebarProps) {
  const avatarLabel = userSummary?.[0]?.toUpperCase() || 'U';
  const expanded = mobile;

  return (
    <aside
      className={`group/sidebar flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#121212]/92 p-3 backdrop-blur-xl transition-[width] duration-300 ${
        mobile ? 'w-75' : 'w-18.5 hover:w-[288px]'
      } ${className || ''}`}
    >
      <div className='mb-4 flex items-center gap-2'>
        <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/90 text-[#111]'>
          <GiSparkles size={14} />
        </span>
        <div
          className={`min-w-0 transition ${
            expanded
              ? 'opacity-100'
              : 'max-w-0 opacity-0 group-hover/sidebar:max-w-45 group-hover/sidebar:opacity-100'
          }`}
        >
          <p className='whitespace-nowrap text-xs font-semibold uppercase tracking-[0.12em] text-white/85'>
            Rehearse
          </p>
          <p className='truncate text-[11px] text-white/45'>Training Console</p>
        </div>
      </div>

      <nav className='flex-1 space-y-1.5'>
        {dashboardNavItems.map((item) => {
          const isActive = activeView === item.view;
          return (
            <button
              key={item.view}
              type='button'
              title={item.label}
              aria-label={item.label}
              onClick={() => {
                onSelectView(item.view);
                onNavigate?.();
              }}
              className={`inline-flex h-10 w-full items-center rounded-lg border px-2.5 text-left transition ${
                isActive
                  ? 'border-white/35 bg-white/14 text-white'
                  : 'border-transparent text-white/70 hover:border-white/20 hover:bg-white/8 hover:text-white'
              }`}
            >
              <item.icon size={15} className='shrink-0' />
              <div
                className={`ml-2 min-w-0 transition ${
                  expanded
                    ? 'opacity-100'
                    : 'max-w-0 opacity-0 group-hover/sidebar:max-w-45 group-hover/sidebar:opacity-100'
                }`}
              >
                <p className='whitespace-nowrap text-xs font-semibold'>
                  {item.label}
                </p>
                <p className='truncate text-[10px] text-white/45'>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      <div
        className={`mt-3 rounded-xl border border-white/12 bg-white/6 p-3 transition ${
          expanded
            ? 'opacity-100'
            : 'max-h-0 overflow-hidden p-0 opacity-0 group-hover/sidebar:max-h-40 group-hover/sidebar:p-3 group-hover/sidebar:opacity-100'
        }`}
      >
        <p className='text-[10px] uppercase tracking-[0.12em] text-white/45'>
          Quick Stats
        </p>
        <p className='mt-2 text-xs text-white/80'>Scenarios: {scenarioCount}</p>
        <p className='text-xs text-white/80'>Completed: {completedSessions}</p>
        <p className='text-xs text-white/80'>
          Status: {activeSession ? 'Live' : 'Idle'}
        </p>
      </div>

      <div className='mt-3 space-y-2'>
        <Link
          href='/'
          className='inline-flex h-10 w-full items-center rounded-lg border border-white/15 bg-white/5 px-2.5 text-white/75 no-underline transition hover:text-white'
          onClick={onNavigate}
        >
          <span className='shrink-0 text-xs font-semibold uppercase tracking-[0.08em]'>
            Home
          </span>
          <span
            className={`ml-2 truncate text-xs transition ${
              expanded
                ? 'opacity-100'
                : 'max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100'
            }`}
          >
            Landing page
          </span>
        </Link>

        <button
          type='button'
          onClick={onLogout}
          className='inline-flex h-10 w-full items-center rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-2.5 text-[#120f07] transition hover:brightness-105'
        >
          <FiLogOut size={14} className='shrink-0' />
          <span
            className={`ml-2 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.08em] transition ${
              expanded
                ? 'opacity-100'
                : 'max-w-0 opacity-0 group-hover/sidebar:max-w-35 group-hover/sidebar:opacity-100'
            }`}
          >
            Sign out
          </span>
        </button>

        <div className='flex items-center gap-2 px-1'>
          <span className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/90 text-xs font-bold text-[#111]'>
            {avatarLabel}
          </span>
          <span
            className={`truncate text-xs text-white/70 transition ${
              expanded
                ? 'opacity-100'
                : 'max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100'
            }`}
          >
            {userSummary}
          </span>
        </div>
      </div>
    </aside>
  );
}

import { FiHeart, FiLogOut } from 'react-icons/fi';
import { dashboardNavItems } from './nav';
import type { DashboardView } from './types';
import Image from 'next/image';

const showLoveUrl = 'https://selar.com/showlove/initysl';

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
  compact?: boolean;
  className?: string;
};

export function DashboardSidebar({
  activeView,
  onSelectView,
  onLogout,
  onNavigate,
  userSummary,
  mobile = false,
  compact = false,
  className,
}: DashboardSidebarProps) {
  const avatarLabel = userSummary?.[0]?.toUpperCase() || 'U';
  const expanded = mobile;
  const hoverExpandable = !mobile && !compact;
  const sidebarWidthClass = mobile
    ? 'w-75'
    : compact
      ? 'w-18.5'
      : 'w-18.5 hover:w-[288px]';
  const revealClass = expanded
    ? 'opacity-100'
    : hoverExpandable
      ? 'max-w-0 opacity-0 group-hover/sidebar:max-w-45 group-hover/sidebar:opacity-100'
      : 'max-w-0 opacity-0';

  return (
    <aside
      className={`group/sidebar flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#121212]/92 p-3 backdrop-blur-xl transition-[width] duration-300 ${sidebarWidthClass} ${className || ''}`}
    >
      <div className='mb-4 flex items-center gap-2'>
        <span className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#111]'>
          <Image
            src='/rehearse.svg'
            alt='Rehearse logo'
            width={60}
            height={50}
          />
        </span>
        <div className={`min-w-0 transition ${revealClass}`}>
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
              <div className={`ml-2 min-w-0 transition ${revealClass}`}>
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

      <div className='mt-3 space-y-2'>
        <a
          href={showLoveUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex h-10 w-full items-center rounded-lg  px-2.5 text-amber-100 transition hover:bg-amber-500/20'
        >
          <FiHeart size={20} className='shrink-0' />
          <span
            className={`ml-2 whitespace-nowrap text-xs font-semibold tracking-[0.08em] transition ${
              expanded
                ? 'opacity-100'
                : hoverExpandable
                  ? 'max-w-0 opacity-0 group-hover/sidebar:max-w-35 group-hover/sidebar:opacity-100'
                  : 'max-w-0 opacity-0'
            }`}
          >
            Show Love
          </span>
        </a>

        <button
          type='button'
          onClick={onLogout}
          className='inline-flex h-10 w-full items-center rounded-lg bg-linear-to-r from-amber-500 to-orange-600 px-2.5 text-[#120f07] transition hover:brightness-105'
        >
          <FiLogOut size={20} className='shrink-0' />
          <span
            className={`ml-2 whitespace-nowrap text-xs font-semibold tracking-[0.08em] transition ${
              expanded
                ? 'opacity-100'
                : hoverExpandable
                  ? 'max-w-0 opacity-0 group-hover/sidebar:max-w-35 group-hover/sidebar:opacity-100'
                  : 'max-w-0 opacity-0'
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
                : hoverExpandable
                  ? 'max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100'
                  : 'max-w-0 opacity-0'
            }`}
          >
            {userSummary}
          </span>
        </div>
      </div>
    </aside>
  );
}

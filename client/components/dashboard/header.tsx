import { FiMenu } from 'react-icons/fi';

type DashboardHeaderProps = {
  onOpenSidebar: () => void;
  sidebarOpen: boolean;
};

export function DashboardHeader({
  onOpenSidebar,
  sidebarOpen,
}: DashboardHeaderProps) {
  return (
    <header className='sticky top-3 z-20 backdrop-blur-xl'>
      <div className='flex min-w-0 items-center gap-2'>
        {!sidebarOpen ? (
          <button
            type='button'
            onClick={onOpenSidebar}
            className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/6 text-white md:hidden'
            aria-label='Open sidebar'
            aria-expanded={sidebarOpen}
          >
            <FiMenu size={16} />
          </button>
        ) : null}
      </div>
    </header>
  );
}

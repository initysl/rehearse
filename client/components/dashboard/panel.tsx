import type { ReactNode } from 'react';

type PanelProps = {
  title?: string;
  description?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Panel({
  title,
  description,
  rightSlot,
  children,
  className,
}: PanelProps) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-white/15 bg-black/30 p-4 shadow-[0_8px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:p-5 ${className || ''}`}
    >
      <div className='mb-4 flex flex-wrap items-start justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <h2 className='break-words text-base font-semibold text-white sm:text-lg'>
            {title}
          </h2>
          {description ? (
            <p className='mt-1 break-words text-xs text-white/55 sm:text-sm'>
              {description}
            </p>
          ) : null}
        </div>
        {rightSlot ? <div className='max-w-full'>{rightSlot}</div> : null}
      </div>
      {children}
    </section>
  );
}

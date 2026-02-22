type ScoreRingProps = {
  score: number;
  label: string;
  color: string;
};

export function ScoreRing({ score, label, color }: ScoreRingProps) {
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <div
        className='flex h-14 w-14 items-center justify-center rounded-full'
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
          padding: '3px',
        }}
      >
        <div className='flex h-full w-full items-center justify-center rounded-full bg-[#1a1a0e]'>
          <span className="font-['Syne'] text-sm font-bold text-white">
            {score}
          </span>
        </div>
      </div>
      <span className='text-[9px] uppercase tracking-widest text-white/40'>
        {label}
      </span>
    </div>
  );
}

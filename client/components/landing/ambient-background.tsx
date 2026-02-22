export function AmbientBackground() {
  return (
    <div className='pointer-events-none fixed inset-0 z-0 overflow-hidden'>
      <div
        className='absolute -top-32 left-1/2 h-160 w-250 -translate-x-1/2 opacity-25'
        style={{
          background:
            'radial-gradient(ellipse, #d97706 0%, #92400e 40%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className='absolute bottom-0 left-0 h-100 w-125 opacity-10'
        style={{
          background: 'radial-gradient(ellipse, #b45309 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className='absolute right-0 top-1/2 h-75 w-100 opacity-10'
        style={{
          background: 'radial-gradient(ellipse, #78350f 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <div
        className='absolute inset-0 opacity-[0.035]'
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,200,80,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,200,80,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

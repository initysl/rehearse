export function ConsoleSkeleton() {
  return (
    <main className='relative z-10 h-dvh overflow-hidden px-3 py-3 text-white sm:px-4 sm:py-4'>
      <div className='mx-auto flex h-full w-full max-w-350 gap-4 overflow-hidden'>
        <div className='hidden h-full shrink-0 md:block lg:hidden'>
          <aside className='flex h-full w-18.5 flex-col rounded-2xl border border-white/15 bg-[#121212]/92 p-3 backdrop-blur-xl'>
            <div className='mb-5 h-9 w-9 animate-pulse rounded-lg bg-white/18' />
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className='h-10 animate-pulse rounded-lg bg-white/8'
                />
              ))}
            </div>
            <div className='mt-auto h-10 animate-pulse rounded-lg bg-amber-500/45' />
          </aside>
        </div>

        <div className='hidden h-full shrink-0 lg:block'>
          <aside className='flex h-full w-18.5 flex-col rounded-2xl border border-white/15 bg-[#121212]/92 p-3 backdrop-blur-xl'>
            <div className='mb-5 h-9 w-9 animate-pulse rounded-lg bg-white/18' />
            <div className='space-y-2'>
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className='h-10 animate-pulse rounded-lg bg-white/8'
                />
              ))}
            </div>
            <div className='mt-auto h-10 animate-pulse rounded-lg bg-amber-500/45' />
          </aside>
        </div>

        <div className='flex min-w-0 flex-1 flex-col gap-4 overflow-hidden'>
          <section className='rounded-2xl border border-white/15 bg-black/30 p-3 backdrop-blur-xl sm:p-4'>
            <div className='flex items-center justify-between gap-3'>
              <div className='h-8 w-46 animate-pulse rounded-md bg-white/12' />
              <div className='hidden h-8 w-28 animate-pulse rounded-md bg-white/10 sm:block' />
            </div>
          </section>

          <div className='min-h-0 flex-1 overflow-y-auto pr-1'>
            <div className='grid gap-4 xl:grid-cols-[1.25fr_0.75fr]'>
              <div className='space-y-4'>
                <section className='rounded-2xl border border-white/15 bg-black/25 p-4'>
                  <div className='h-6 w-40 animate-pulse rounded-md bg-white/14' />
                  <div className='mt-4 space-y-3'>
                    <div className='h-20 animate-pulse rounded-xl bg-white/7' />
                    <div className='h-16 animate-pulse rounded-xl bg-white/6' />
                    <div className='h-16 animate-pulse rounded-xl bg-white/6' />
                  </div>
                </section>

                <section className='rounded-2xl border border-white/15 bg-black/25 p-4'>
                  <div className='h-5 w-32 animate-pulse rounded-md bg-white/14' />
                  <div className='mt-3 grid gap-3 sm:grid-cols-2'>
                    <div className='h-18 animate-pulse rounded-xl bg-white/8' />
                    <div className='h-18 animate-pulse rounded-xl bg-white/8' />
                  </div>
                </section>
              </div>

              <div className='space-y-4'>
                <section className='rounded-2xl border border-white/15 bg-black/25 p-4'>
                  <div className='h-5 w-28 animate-pulse rounded-md bg-white/14' />
                  <div className='mt-3 space-y-2'>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className='h-14 animate-pulse rounded-xl bg-white/7'
                      />
                    ))}
                  </div>
                </section>

                <section className='rounded-2xl border border-white/15 bg-black/25 p-4'>
                  <div className='h-5 w-24 animate-pulse rounded-md bg-white/14' />
                  <div className='mt-3 h-24 animate-pulse rounded-xl bg-white/7' />
                </section>

                <section className='rounded-xl border border-white/15 bg-black/25 p-3'>
                  <div className='h-4 w-30 animate-pulse rounded-md bg-white/12' />
                  <div className='mt-2 h-4 w-36 animate-pulse rounded-md bg-white/10' />
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

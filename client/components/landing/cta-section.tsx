'use client';

import { Reveal } from '@/components/landing/reveal';

export function CtaSection() {
  return (
    <section className='px-3 py-20'>
      <div className='mx-auto max-w-7xl'>
        <Reveal>
          <div
            className='relative overflow-hidden rounded-3xl border border-white/[0.07] px-8 py-20 text-center'
            style={{
              background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
            }}
          >
            <div
              className='pointer-events-none absolute inset-0'
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(180,90,10,0.22) 0%, transparent 60%)',
              }}
            />
            <p className='relative mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
              Ready to start?
            </p>
            <h2 className='aldrich relative mb-4 text-3xl font-semibold text-white md:text-4xl'>
              Run your first rehearsal now.
            </h2>
            <p className='relative mx-auto mb-8 max-w-md text-[15px] text-white/40'>
              Sign in with Google. Pick or customize a conversation. Start
              practicing — no setup, no friction.
            </p>
            {/* <div className='relative flex flex-wrap items-center justify-center gap-4'>
              <motion.a
                href='/auth'
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='rounded-full px-7 py-3.5 text-[13px] font-semibold text-[#0f0e06] no-underline shadow-xl shadow-amber-900/30'
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                }}
              >
                Sign In
              </motion.a>
            </div> */}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

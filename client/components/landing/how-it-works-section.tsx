'use client';

import { motion } from 'framer-motion';
import { FiMic } from 'react-icons/fi';
import { Reveal } from '@/components/landing/reveal';

type Step = {
  n: string;
  title: string;
  desc: string;
};

const steps: Step[] = [
  {
    n: '01',
    title: 'Choose a Scenario',
    desc: 'Browse salary talks, medical appointments, family conversations, and more.',
  },
  {
    n: '02',
    title: 'Set the Scene',
    desc: 'Define the character personality, add personal context, and pick difficulty.',
  },
  {
    n: '03',
    title: 'Practice',
    desc: 'Speak or type. The AI character responds authentically — not helpfully.',
  },
  {
    n: '04',
    title: 'Get Your Report',
    desc: 'Receive a structured coaching breakdown the moment the session ends.',
  },
];

export function HowItWorksSection() {
  return (
    <section id='how-to-use' className='scroll-mt-20 px-3 py-16'>
      <div className='mx-auto max-w-7xl'>
        <div className='grid items-center gap-12 lg:grid-cols-2'>
          <div>
            <Reveal>
              <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
                How it works
              </p>
              <h2 className='aldrich mb-4 text-3xl font-semibold text-white md:text-4xl'>
                Ready in under
                <br />2 minutes.
              </h2>
              <p className='mb-8 text-[15px] leading-relaxed text-white/40'>
                No setup. No friction. Pick a scenario, set the character, and
                start practicing — by voice or text.
              </p>
            </Reveal>
            <div className='flex flex-col gap-5'>
              {steps.map((step, i) => (
                <Reveal key={step.n} delay={i}>
                  <div className='flex gap-4'>
                    <div
                      className='aldrich flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-[13px] font-semibold text-white/40'
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                      }}
                    >
                      {step.n}
                    </div>
                    <div>
                      <h4 className='aldrich mb-0.5 text-[15px] font-semibold text-white'>
                        {step.title}
                      </h4>
                      <p className='text-[13px] text-white/40'>{step.desc}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          <Reveal delay={2}>
            <div
              className='overflow-hidden rounded-2xl border border-white/[0.07]'
              style={{
                background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
              }}
            >
              <div
                className='flex items-center justify-between border-b border-white/6 px-5 py-3'
                style={{ background: 'rgba(0,0,0,0.25)' }}
              >
                <div className='flex gap-1.5'>
                  <div className='h-2.5 w-2.5 rounded-full bg-red-500/50' />
                  <div className='h-2.5 w-2.5 rounded-full bg-yellow-500/50' />
                  <div className='h-2.5 w-2.5 rounded-full bg-green-500/50' />
                </div>
                <span className='text-[11px] text-white/25'>
                  Rehearse — Active Session
                </span>
                <div />
              </div>
              <div className='p-5'>
                <div className='mb-4 inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-semibold text-amber-300'>
                  🏢 Salary Negotiation · Resistant
                </div>
                <div className='mb-5 flex flex-col gap-3'>
                  <div className='flex flex-col items-start gap-1'>
                    <div
                      className='max-w-[80%] rounded-[10px_10px_10px_2px] border border-white/6 px-3.5 py-2.5 text-[13px] text-white/80'
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      I only have 15 minutes — what did you want to discuss?
                    </div>
                    <span className='text-[9px] uppercase tracking-widest text-white/25'>
                      Your Manager · Just now
                    </span>
                  </div>
                  <div className='flex flex-col items-end gap-1'>
                    <div className='max-w-[80%] rounded-[10px_10px_2px_10px] border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-[13px] text-amber-100'>
                      I&apos;d like to talk about my compensation...
                    </div>
                    <span className='text-[9px] uppercase tracking-widest text-white/25'>
                      You · Just now
                    </span>
                  </div>
                </div>
                <div className='flex flex-col items-center gap-3 pt-2'>
                  <motion.div
                    className='flex h-14 w-14 items-center justify-center rounded-full text-white'
                    style={{
                      background: 'linear-gradient(135deg, #d97706, #ea580c)',
                    }}
                    animate={{
                      boxShadow: [
                        '0 0 0 8px rgba(217,119,6,0.12), 0 0 0 16px rgba(217,119,6,0.05)',
                        '0 0 0 12px rgba(234,88,12,0.14), 0 0 0 22px rgba(234,88,12,0.04)',
                        '0 0 0 8px rgba(217,119,6,0.12), 0 0 0 16px rgba(217,119,6,0.05)',
                      ],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                  >
                    <FiMic size={20} />
                  </motion.div>
                  <span className='text-[10px] uppercase tracking-widest text-white/25'>
                    Hold to speak
                  </span>
                  <div
                    className='inline-flex items-center gap-2 rounded-full border border-white/[0.07] px-3.5 py-2 text-[12px] text-white/35'
                    style={{ background: 'rgba(0,0,0,0.3)' }}
                  >
                    <span className='h-3 w-3 animate-spin rounded-full border-2 border-amber-500/25 border-t-amber-500' />
                    AI is responding...
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

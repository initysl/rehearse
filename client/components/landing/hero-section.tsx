'use client';

import { motion } from 'framer-motion';
import {
  FiArrowRight,
  FiAtSign,
  FiCheck,
  FiLogIn,
  FiMic,
  FiPlay,
  FiStar,
  FiZap,
} from 'react-icons/fi';
import { Reveal, fadeUp } from '@/components/landing/reveal';
import { Waveform } from '@/components/landing/waveform';
import { ScoreRing } from '@/components/landing/score-ring';

export function HeroSection() {
  return (
    <section id='home' className='relative scroll-mt-20 px-6 pb-10 pt-28'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-12 grid items-center gap-10 lg:grid-cols-[1fr_auto]'>
          <div>
            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={0}
              className='mb-5 inline-flex items-center gap-2.5 rounded-full border border-amber-400/20 bg-amber-400/6 px-4 py-2'
            >
              <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]' />
              <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300/80'>
                AI-Powered Conversation Simulator
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={1}
              className='aldrich mb-5 text-2xl leading-[1.01] text-white md:text-[58px] lg:text-[66px]'
            >
              Practice conversations
              <br />
              <span
                className='bg-clip-text text-transparent'
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%)',
                }}
              >
                before they happen.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={2}
              className='mb-8 max-w-130 text-[16px] leading-[1.7] text-white/45'
              style={{ fontWeight: 300 }}
            >
              Rehearse is an AI conversation simulator for high-stakes real-life
              situations — interviews, salary negotiations, difficult family
              talks, medical appointments. Role-play with a realistic AI
              character, then get structured coaching feedback after every
              session.
            </motion.p>

            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={3}
              className='mb-7 flex flex-wrap items-center gap-3'
            >
              <motion.a
                href='/auth'
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className='inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-[#0f0e06] no-underline shadow-xl shadow-amber-900/30'
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                }}
              >
                Start practicing
                <FiArrowRight size={14} />
              </motion.a>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={4}
              className='flex flex-wrap items-center gap-5'
            >
              {[
                'Free',
                'Voice & text modes',
                'AI coaching after every session',
              ].map((point) => (
                <div
                  key={point}
                  className='flex items-center gap-1.5 text-[12px] text-white/30'
                >
                  <FiCheck size={11} className='text-amber-500' />
                  {point}
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial='hidden'
            animate='show'
            custom={5}
            className='hidden lg:flex'
          >
            <div
              className='flex flex-col items-center gap-3 rounded-2xl border border-white/[0.07] px-6 py-5'
              style={{
                background: 'rgba(28,26,11,0.8)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div className='flex -space-x-2'>
                {['#f59e0b', '#ea580c', '#d97706', '#b45309'].map(
                  (color, i) => (
                    <div
                      key={i}
                      className='flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#0f0e06] text-[12px] font-bold text-white'
                      style={{ background: color }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  ),
                )}
              </div>
              <div className='flex gap-0.5'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <FiStar
                    key={i}
                    size={12}
                    className='fill-amber-400 text-amber-400'
                  />
                ))}
              </div>
              <div className='text-center'>
                <p className='text-[15px] font-semibold text-white'>2,400+</p>
                <p className='text-[11px] text-white/35'>
                  professionals practicing
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[1fr_320px]'>
          <motion.div
            variants={fadeUp}
            initial='hidden'
            animate='show'
            custom={1}
            className='relative overflow-hidden rounded-2xl border border-white/[0.07]'
            style={{
              background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
            }}
          >
            <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-2xl'>
              <div
                className='absolute right-0 top-0 h-full w-3/5'
                style={{
                  background:
                    'radial-gradient(ellipse at 80% 40%, rgba(180,80,10,0.4) 0%, rgba(100,45,5,0.2) 35%, transparent 65%)',
                  filter: 'blur(20px)',
                }}
              />
            </div>

            <div className='relative z-10 p-6'>
              <div className='mb-5 inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300'>
                <FiMic size={11} />
                AI Conversation Simulator
              </div>

              <div className='grid gap-5 md:grid-cols-[1.1fr_0.9fr]'>
                <div
                  className='rounded-xl border border-white/6 p-5'
                  style={{
                    background: 'rgba(10,9,3,0.65)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className='mb-1 flex items-center gap-2'>
                    <div className='flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400'>
                      <FiMic size={13} />
                    </div>
                    <span className='aldrich text-[14px] font-semibold text-white'>
                      Voice Practice
                    </span>
                  </div>
                  <p className='mb-4 text-[12px] leading-relaxed text-white/35'>
                    Simulate any real-life conversation with AI
                  </p>

                  <div className='mb-4 flex flex-col gap-2.5'>
                    <div className='flex flex-col items-start gap-1'>
                      <div
                        className='max-w-[85%] rounded-[10px_10px_10px_2px] border border-white/6 px-3.5 py-2.5 text-[13px] text-white/80'
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        I only have 15 minutes — what did you want to discuss?
                      </div>
                      <span className='text-[9px] uppercase tracking-widest text-white/25'>
                        Your Manager · Just now
                      </span>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      <div className='max-w-[85%] rounded-[10px_10px_2px_10px] border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-[13px] text-amber-100'>
                        I&apos;d like to talk about my compensation...
                      </div>
                      <span className='text-[9px] uppercase tracking-widest text-white/25'>
                        You · Just now
                      </span>
                    </div>
                  </div>

                  <div className='mb-4 flex justify-center rounded-lg border border-white/5 bg-white/2 p-3'>
                    <Waveform />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className='flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-[#0f0e06] shadow-lg shadow-amber-900/30'
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                    }}
                  >
                    <FiMic size={14} />
                    Start practice session
                  </motion.button>
                </div>

                <div className='flex flex-col gap-3'>
                  <div
                    className='rounded-xl border border-white/6 p-4'
                    style={{
                      background: 'rgba(10,9,3,0.65)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <p className='mb-2 text-[10px] uppercase tracking-widest text-white/35'>
                      Session Score
                    </p>
                    <div className='mb-2 flex items-end gap-1'>
                      <span className='aldrich text-[36px] leading-none font-bold text-white'>
                        74
                      </span>
                      <span className='mb-1 text-sm text-white/35'>/100</span>
                    </div>
                    <div className='mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/5'>
                      <motion.div
                        className='h-full rounded-full'
                        style={{
                          background:
                            'linear-gradient(90deg, #f59e0b, #ea580c)',
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: '74%' }}
                        transition={{
                          duration: 1.2,
                          delay: 0.5,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                    <p className='text-[10px] text-white/25'>
                      Confidence score
                    </p>
                  </div>

                  <div
                    className='flex items-center justify-around rounded-xl border border-white/6 p-4'
                    style={{
                      background: 'rgba(10,9,3,0.65)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <ScoreRing score={72} label='Assert.' color='#f59e0b' />
                    <ScoreRing score={81} label='Clarity' color='#10b981' />
                    <ScoreRing score={68} label='Control' color='#8b5cf6' />
                  </div>

                  <div
                    className='rounded-xl border border-white/6 p-4'
                    style={{
                      background: 'rgba(10,9,3,0.65)',
                      backdropFilter: 'blur(16px)',
                    }}
                  >
                    <div className='mb-2 flex items-center justify-between'>
                      <span className='text-[12px] text-white/50'>
                        Difficulty
                      </span>
                      <span className='text-[12px] font-semibold text-amber-400'>
                        Resistant
                      </span>
                    </div>
                    <div className='flex gap-1.5'>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <div
                          key={n}
                          className='h-1.5 flex-1 rounded-full'
                          style={{
                            background:
                              n <= 4
                                ? 'linear-gradient(90deg, #f59e0b, #ea580c)'
                                : 'rgba(255,255,255,0.06)',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className='flex flex-col gap-3'>
            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={2}
            >
              <div className='flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/3 px-4 py-2.5'>
                <svg
                  className='h-4 w-4 shrink-0 text-white/25'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
                <span className='text-[13px] text-white/25'>
                  Search scenarios...
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={3}
              className='flex-1 rounded-2xl border border-white/[0.07] p-5'
              style={{
                background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
              }}
            >
              <h3 className='aldrich mb-1 text-[15px] font-semibold text-white'>
                Browse Scenarios
              </h3>
              <p className='mb-4 text-[12px] text-white/35'>
                Pick a real situation and start practicing immediately.
              </p>

              <div className='mb-4 flex flex-wrap gap-2'>
                {[
                  {
                    label: 'Work',
                    cls: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
                  },
                  {
                    label: 'Health',
                    cls: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
                  },
                  {
                    label: 'Family',
                    cls: 'border-purple-500/20 bg-purple-500/10 text-purple-300',
                  },
                  {
                    label: 'Social',
                    cls: 'border-blue-500/20 bg-blue-500/10 text-blue-300',
                  },
                ].map((cat) => (
                  <button
                    key={cat.label}
                    className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition hover:opacity-80 ${cat.cls}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className='mb-4 flex gap-2'>
                {['Voice', 'Text', 'Both'].map((f, i) => (
                  <button
                    key={f}
                    className={`flex-1 rounded-lg py-2 text-[11px] font-semibold uppercase tracking-wider transition ${
                      i === 0
                        ? 'bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-900/20'
                        : 'border border-white/6 bg-white/3 text-white/35 hover:text-white/55'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className='mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/8 bg-white/2 py-6'>
                <div className='flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/4 text-white/35'>
                  <FiPlay size={14} />
                </div>
                <p className='text-[12px] text-white/25'>
                  Select a scenario to begin
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className='flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-[#0f0e06] shadow-lg shadow-amber-900/20'
                style={{
                  background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
                }}
              >
                <FiZap size={14} />
                Start Session
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={4}
              className='rounded-2xl border border-white/[0.07] p-4'
              style={{
                background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
              }}
            >
              <div className='mb-3 flex items-center justify-between'>
                <span className='text-[12px] font-medium text-white/55'>
                  Audio Adjust
                </span>
                <span className='text-[12px] font-semibold text-amber-400'>
                  85%
                </span>
              </div>
              <div className='flex h-6 items-end gap-0.5'>
                {Array.from({ length: 30 }).map((_, i) => {
                  const h =
                    20 + Math.abs(Math.sin(i * 0.75) * 50) + (i % 3) * 8;
                  return (
                    <div
                      key={i}
                      className='flex-1 rounded-sm'
                      style={{
                        height: `${Math.min(h, 100)}%`,
                        background:
                          i < 25
                            ? 'linear-gradient(to top, #f59e0b, #fbbf24)'
                            : 'rgba(255,255,255,0.07)',
                      }}
                    />
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

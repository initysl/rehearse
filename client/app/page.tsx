'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  FiMic,
  FiMessageSquare,
  FiTrendingUp,
  FiZap,
  FiShield,
  FiChevronRight,
  FiPlay,
  FiStar,
  FiArrowRight,
  FiCheck,
  FiFacebook,
  FiLinkedin,
  FiSend,
  FiTwitter,
} from 'react-icons/fi';

// ── Types ───────────────────────────────────────────────────
interface FeatureCard {
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
}

interface Step {
  n: string;
  title: string;
  desc: string;
}

// ── Animation variants ──────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
} satisfies Variants;

// ── Reveal wrapper ──────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      custom={delay}
      initial='hidden'
      animate={inView ? 'show' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── Animated waveform ───────────────────────────────────────
function Waveform({ active = true }: { active?: boolean }) {
  const heights = [
    30, 60, 45, 80, 55, 100, 70, 40, 85, 50, 65, 35, 75, 45, 90, 60, 30, 70, 50,
    40,
  ];
  return (
    <div className='flex h-8 items-end gap-0.5'>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className='w-0.75 rounded-full bg-linear-to-t from-amber-500 to-amber-300'
          style={{ height: `${h}%` }}
          animate={active ? { scaleY: [1, 0.3, 1] } : { scaleY: 0.3 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.06,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Score ring ──────────────────────────────────────────────
function ScoreRing({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <div
        className='flex h-14 w-14 items-center justify-center rounded-full'
        style={{
          background: `conic-linear(${color} ${score * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
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

// ── Animated progress bar ───────────────────────────────────
function ProgressBar({
  label,
  icon: Icon,
  value,
  color,
  sublabel,
}: {
  label: string;
  icon: React.ElementType;
  value: number;
  color: string;
  sublabel: string;
}) {
  return (
    <Reveal>
      <div
        className='rounded-2xl border border-white/[0.07] p-5'
        style={{
          background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
        }}
      >
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Icon size={14} className={color} />
            <span className='text-[13px] font-semibold text-white'>
              {label}
            </span>
          </div>
          <span className={`text-[13px] font-semibold ${color}`}>{value}%</span>
        </div>
        <div className='relative h-2 overflow-hidden rounded-full bg-white/6'>
          <motion.div
            className='h-full rounded-full'
            style={{
              background: `linear-linear(90deg, ${color === 'text-amber-400' ? '#f59e0b, #ea580c' : '#f97316, #ef4444'})`,
            }}
            initial={{ width: 0 }}
            whileInView={{ width: `${value}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          />
          <div
            className='absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-[#1c1a0b]'
            style={{
              right: `${100 - value - 1}%`,
              borderColor: color === 'text-amber-400' ? '#f59e0b' : '#f97316',
            }}
          />
        </div>
        <p className='mt-2 text-[11px] text-white/30'>{sublabel}</p>
      </div>
    </Reveal>
  );
}

// ══════════════════════════════════════════════════════════════
//  PAGE
// ══════════════════════════════════════════════════════════════
export default function LandingPage() {
  const features: FeatureCard[] = [
    {
      icon: FiMic,
      title: 'Voice Mode',
      desc: 'Speak naturally. AI responds in real time via sentence-level streaming — latency under 1.5 seconds.',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10 border-amber-400/20',
    },
    {
      icon: FiMessageSquare,
      title: 'Text Mode',
      desc: 'Type your messages. AI streams token by token for a natural conversation feel.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10 border-emerald-400/20',
    },
    {
      icon: FiTrendingUp,
      title: 'Smart Feedback',
      desc: 'Structured coaching report after every session — key moments, scores, and phrases to try.',
      color: 'text-purple-400',
      bg: 'bg-purple-400/10 border-purple-400/20',
    },
    {
      icon: FiShield,
      title: 'Private & Safe',
      desc: 'All conversations are encrypted. Voice audio is never stored. Your practice stays yours.',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20',
    },
  ];

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

  const navItems = ['Home', 'Features', 'How to use'];

  return (
    <div
      className='relative min-h-screen overflow-x-hidden'
      style={{ background: '#0f0e06', fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f0e06; }
        ::-webkit-scrollbar-thumb { background: #3a3a20; border-radius: 2px; }
      `}</style>

      {/* ── AMBIENT BACKGROUND ── */}
      <div className='pointer-events-none fixed inset-0 overflow-hidden'>
        <div
          className='absolute -top-32 left-1/2 h-160 w-250 -translate-x-1/2 opacity-25'
          style={{
            background:
              'radial-linear(ellipse, #d97706 0%, #92400e 40%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className='absolute bottom-0 left-0 h-100 w-125 opacity-10'
          style={{
            background: 'radial-linear(ellipse, #b45309 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className='absolute right-0 top-1/2 h-75 w-100 opacity-10'
          style={{
            background: 'radial-linear(ellipse, #78350f 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className='absolute inset-0 opacity-[0.035]'
          style={{
            backgroundImage:
              'linear-linear(rgba(255,200,80,0.5) 1px, transparent 1px), linear-linear(90deg, rgba(255,200,80,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ══════════════════════════════════════
          NAV
      ══════════════════════════════════════ */}
      <nav
        className='fixed left-0 right-0 top-0 z-50 border-b border-white/6 backdrop-blur-xl'
        style={{ background: 'rgba(15,14,6,0.85)' }}
      >
        <div className='mx-auto flex h-14 max-w-7xl items-center justify-between px-6'>
          {/* Logo */}
          <Link href='/' className='flex items-center gap-2.5 no-underline'>
            <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-600 text-sm shadow-lg shadow-amber-900/30'>
              🎙️
            </div>
            <span
              style={{
                fontFamily: 'Syne',
                fontWeight: 700,
                fontSize: 17,
                color: '#fff',
              }}
            >
              Rehearse
            </span>
          </Link>

          {/* Center nav — pill container like SpeechLab */}
          <div className='hidden items-center gap-0.5 rounded-full border border-white/8 bg-white/3 px-1 py-1 md:flex'>
            {navItems.map((item, i) => (
              <Link
                key={item}
                href='#'
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium no-underline transition-all ${
                  i === 0
                    ? 'bg-white text-[#0f0e06] shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Right */}
          <div className='flex items-center gap-3'>
            <Link
              href='#'
              className='text-[13px] font-medium text-white/50 no-underline transition hover:text-white'
            >
              Sign in
            </Link>
            <motion.a
              href='#'
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className='rounded-full px-4 py-2 text-[13px] font-semibold text-white no-underline shadow-lg shadow-amber-900/30'
              style={{ background: 'linear-linear(90deg, #f59e0b, #ea580c)' }}
            >
              Sign up
            </motion.a>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section className='relative px-6 pb-10 pt-28'>
        <div className='mx-auto max-w-7xl'>
          {/* ── Professional hero copy ── */}
          <div className='mb-12 grid items-center gap-10 lg:grid-cols-[1fr_auto]'>
            <div>
              {/* Eyebrow */}
              <motion.div
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={0}
                className='mb-5 inline-flex items-center gap-2.5 rounded-full border border-amber-400/20 bg-amber-400/6 px-4 py-2'
              >
                <span className='h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]' />
                <span className='text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-300/80'>
                  AI-Powered Conversation Training
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={1}
                style={{
                  fontFamily: 'Syne',
                  fontWeight: 800,
                  letterSpacing: '-1.5px',
                }}
                className='mb-5 text-[44px] leading-[1.01] text-white md:text-[58px] lg:text-[66px]'
              >
                Practice the conversations
                <br />
                <span
                  className='bg-clip-text text-transparent'
                  style={{
                    backgroundImage:
                      'linear-linear(90deg, #fbbf24 0%, #f59e0b 45%, #ea580c 100%)',
                  }}
                >
                  that change everything.
                </span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={2}
                className='mb-8 max-w-130 text-[16px] leading-[1.7] text-white/45'
                style={{ fontWeight: 300 }}
              >
                Rehearse is an AI conversation simulator for high-stakes
                real-life situations — salary negotiations, difficult family
                talks, medical appointments. Role-play with a realistic AI
                character, then get structured coaching feedback after every
                session.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={3}
                className='mb-7 flex flex-wrap items-center gap-3'
              >
                <motion.a
                  href='#'
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className='inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[13px] font-semibold text-[#0f0e06] no-underline shadow-xl shadow-amber-900/30'
                  style={{
                    background: 'linear-linear(90deg, #f59e0b, #ea580c)',
                  }}
                >
                  Start Practicing Free
                  <FiArrowRight size={14} />
                </motion.a>
                <motion.a
                  href='#'
                  whileHover={{ scale: 1.02 }}
                  className='inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-6 py-3.5 text-[13px] font-medium text-white no-underline transition hover:bg-white/[0.07]'
                >
                  <FiPlay size={12} />
                  See how it works
                </motion.a>
              </motion.div>

              {/* Trust points */}
              <motion.div
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={4}
                className='flex flex-wrap items-center gap-5'
              >
                {[
                  'No credit card required',
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

            {/* Social proof pill */}
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

          {/* ── Dashboard preview grid ── */}
          <div className='grid gap-4 lg:grid-cols-[1fr_320px]'>
            {/* ── Main hero card ── */}
            <motion.div
              variants={fadeUp}
              initial='hidden'
              animate='show'
              custom={1}
              className='relative overflow-hidden rounded-2xl border border-white/[0.07]'
              style={{
                background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
              }}
            >
              {/* Amber portrait glow */}
              <div className='pointer-events-none absolute inset-0 overflow-hidden rounded-2xl'>
                <div
                  className='absolute right-0 top-0 h-full w-3/5'
                  style={{
                    background:
                      'radial-linear(ellipse at 80% 40%, rgba(180,80,10,0.4) 0%, rgba(100,45,5,0.2) 35%, transparent 65%)',
                    filter: 'blur(20px)',
                  }}
                />
              </div>

              <div className='relative z-10 p-6'>
                {/* Badge */}
                <div className='mb-5 inline-flex items-center gap-2 rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-300'>
                  <FiMic size={11} />
                  AI Conversation Simulator
                </div>

                {/* Two columns */}
                <div className='grid gap-5 md:grid-cols-[1.1fr_0.9fr]'>
                  {/* Left: conversation panel */}
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
                      <span
                        style={{
                          fontFamily: 'Syne',
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                        className='text-white'
                      >
                        Voice Practice
                      </span>
                    </div>
                    <p className='mb-4 text-[12px] leading-relaxed text-white/35'>
                      Simulate any real-life conversation with AI
                    </p>

                    {/* Chat bubbles */}
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

                    {/* Waveform */}
                    <div className='mb-4 rounded-lg border border-white/5 bg-white/2 p-3'>
                      <Waveform />
                    </div>

                    {/* CTA */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className='flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-[#0f0e06] shadow-lg shadow-amber-900/30'
                      style={{
                        background: 'linear-linear(90deg, #f59e0b, #ea580c)',
                      }}
                    >
                      <FiMic size={14} />
                      Start Practice Session
                    </motion.button>
                  </div>

                  {/* Right: score panels */}
                  <div className='flex flex-col gap-3'>
                    {/* Confidence score */}
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
                        <span
                          style={{
                            fontFamily: 'Syne',
                            fontWeight: 800,
                            fontSize: 36,
                          }}
                          className='text-white leading-none'
                        >
                          74
                        </span>
                        <span className='mb-1 text-sm text-white/35'>/100</span>
                      </div>
                      <div className='mb-1.5 h-1.5 overflow-hidden rounded-full bg-white/5'>
                        <motion.div
                          className='h-full rounded-full'
                          style={{
                            background:
                              'linear-linear(90deg, #f59e0b, #ea580c)',
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

                    {/* Three rings */}
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

                    {/* Difficulty */}
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
                                  ? 'linear-linear(90deg, #f59e0b, #ea580c)'
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

            {/* ── Right sidebar ── */}
            <div className='flex flex-col gap-3'>
              {/* Search */}
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

              {/* Browse panel */}
              <motion.div
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={3}
                className='flex-1 rounded-2xl border border-white/[0.07] p-5'
                style={{
                  background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
                }}
              >
                <h3
                  style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}
                  className='mb-1 text-white'
                >
                  Browse Scenarios
                </h3>
                <p className='mb-4 text-[12px] text-white/35'>
                  Pick a real situation and start practicing immediately.
                </p>

                {/* Category pills */}
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

                {/* Mode toggle */}
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

                {/* Drop zone */}
                <div className='mb-4 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/8 bg-white/2 py-6'>
                  <div className='flex h-9 w-9 items-center justify-center rounded-full border border-white/8 bg-white/4 text-white/35'>
                    <FiPlay size={14} />
                  </div>
                  <p className='text-[12px] text-white/25'>
                    Select a scenario to begin
                  </p>
                </div>

                {/* Start btn */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className='flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-[#0f0e06] shadow-lg shadow-amber-900/20'
                  style={{
                    background: 'linear-linear(90deg, #f59e0b, #ea580c)',
                  }}
                >
                  <FiZap size={14} />
                  Start Session
                </motion.button>
              </motion.div>

              {/* Audio adjust mini */}
              <motion.div
                variants={fadeUp}
                initial='hidden'
                animate='show'
                custom={4}
                className='rounded-2xl border border-white/[0.07] p-4'
                style={{
                  background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
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
                              ? 'linear-linear(to top, #f59e0b, #fbbf24)'
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

      {/* ══════════════════════════════════════
          SLIDERS
      ══════════════════════════════════════ */}
      <section className='px-6 pb-10'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid gap-4 md:grid-cols-2'>
            <ProgressBar
              label='Assertiveness'
              icon={FiMic}
              value={50}
              color='text-amber-400'
              sublabel='How assertive you are when making requests'
            />
            <ProgressBar
              label='Clarity Boost'
              icon={FiStar}
              value={75}
              color='text-orange-400'
              sublabel='How clearly your message lands in conversation'
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
      ══════════════════════════════════════ */}
      <section className='px-6 py-16'>
        <div className='mx-auto max-w-7xl'>
          <Reveal>
            <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
              What Rehearse does
            </p>
            <h2
              style={{ fontFamily: 'Syne', fontWeight: 700 }}
              className='mb-10 text-3xl text-white md:text-4xl'
            >
              Practice smarter.{' '}
              <span className='bg-linear-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent'>
                Speak with confidence.
              </span>
            </h2>
          </Reveal>

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {features.map((feat, i) => (
              <Reveal key={feat.title} delay={i}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className='group h-full cursor-default rounded-2xl border border-white/6 p-5 transition-colors hover:border-white/10'
                  style={{
                    background:
                      'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
                  }}
                >
                  <div
                    className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${feat.bg} ${feat.color}`}
                  >
                    <feat.icon size={18} />
                  </div>
                  <h3
                    style={{ fontFamily: 'Syne', fontWeight: 700 }}
                    className='mb-2 text-[15px] text-white'
                  >
                    {feat.title}
                  </h3>
                  <p className='mb-4 text-[13px] leading-relaxed text-white/40'>
                    {feat.desc}
                  </p>
                  <div className='flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-white/20 transition-colors group-hover:text-amber-400/60'>
                    Explore <FiChevronRight size={12} />
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section className='px-6 py-16'>
        <div className='mx-auto max-w-7xl'>
          <div className='grid items-center gap-12 lg:grid-cols-2'>
            <div>
              <Reveal>
                <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
                  How it works
                </p>
                <h2
                  style={{ fontFamily: 'Syne', fontWeight: 700 }}
                  className='mb-4 text-3xl text-white md:text-4xl'
                >
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
                        className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] text-[13px] text-white/40'
                        style={{
                          fontFamily: 'Syne',
                          fontWeight: 700,
                          background: 'rgba(255,255,255,0.02)',
                        }}
                      >
                        {step.n}
                      </div>
                      <div>
                        <h4
                          style={{ fontFamily: 'Syne', fontWeight: 700 }}
                          className='mb-0.5 text-[15px] text-white'
                        >
                          {step.title}
                        </h4>
                        <p className='text-[13px] text-white/40'>{step.desc}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>

            {/* App mockup */}
            <Reveal delay={2}>
              <div
                className='overflow-hidden rounded-2xl border border-white/[0.07]'
                style={{
                  background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
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
                        background: 'linear-linear(135deg, #d97706, #ea580c)',
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

      {/* ══════════════════════════════════════
          CTA
      ══════════════════════════════════════ */}
      <section className='px-6 py-20'>
        <div className='mx-auto max-w-7xl'>
          <Reveal>
            <div
              className='relative overflow-hidden rounded-3xl border border-white/[0.07] px-8 py-20 text-center'
              style={{
                background: 'linear-linear(135deg, #1c1a0b 0%, #141208 100%)',
              }}
            >
              <div
                className='pointer-events-none absolute inset-0'
                style={{
                  background:
                    'radial-linear(ellipse at 50% 0%, rgba(180,90,10,0.22) 0%, transparent 60%)',
                }}
              />
              <p className='relative mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
                Ready to start?
              </p>
              <h2
                style={{ fontFamily: 'Syne', fontWeight: 700 }}
                className='relative mb-4 text-3xl text-white md:text-4xl'
              >
                Run your first rehearsal now.
              </h2>
              <p className='relative mx-auto mb-8 max-w-md text-[15px] text-white/40'>
                Log in with email or Google. Pick a conversation. Start
                practicing — no setup, no friction.
              </p>
              <div className='relative flex flex-wrap items-center justify-center gap-4'>
                <motion.a
                  href='#'
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className='rounded-full px-7 py-3.5 text-[13px] font-semibold text-[#0f0e06] no-underline shadow-xl shadow-amber-900/30'
                  style={{
                    background: 'linear-linear(90deg, #f59e0b, #ea580c)',
                  }}
                >
                  Sign In
                </motion.a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className='border-t border-white/5 px-6 py-8'>
        <div className='mx-auto flex  max-w-7xl flex-wrap items-center justify-between gap-5'>
          <div className='flex flex-wrap gap-6'>
            {[
              { label: 'Terms', href: '/terms' },
              { label: 'Privacy', href: '/privacy' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className='text-[12px] font-medium uppercase tracking-wider text-white/25 no-underline transition hover:text-white/55'
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className='flex gap-2.5'>
            {[
              { label: 'X', href: 'https://x.com', icon: FiTwitter },
              {
                label: 'LinkedIn',
                href: 'https://www.linkedin.com',
                icon: FiLinkedin,
              },
              { label: 'Telegram', href: 'https://t.me', icon: FiSend },
              {
                label: 'Facebook',
                href: 'https://www.facebook.com',
                icon: FiFacebook,
              },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target='_blank'
                rel='noreferrer noopener'
                aria-label={social.label}
                className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/2 text-[13px] text-white/25 no-underline transition hover:border-white/12 hover:text-white/55'
              >
                <social.icon />
              </a>
            ))}
          </div>
          <p className='w-full text-center text-[11px] text-white/18 md:w-auto'>
            © 2026 Rehearse. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

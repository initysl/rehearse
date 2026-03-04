'use client';

import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import {
  FiChevronRight,
  FiMessageSquare,
  FiMic,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import { Reveal } from '@/components/landing/reveal';

type FeatureCard = {
  icon: ElementType;
  title: string;
  desc: string;
  color: string;
  bg: string;
};

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

export function FeaturesSection() {
  return (
    <section id='features' className='scroll-mt-20 px-3 py-16'>
      <div className='mx-auto max-w-7xl'>
        <Reveal>
          <p className='mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/30'>
            What Rehearse does
          </p>
          <h2 className='aldrich mb-10 text-3xl font-semibold text-white md:text-4xl'>
            Practice smarter.{` `}
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
                    'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
                }}
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${feat.bg} ${feat.color}`}
                >
                  <feat.icon size={18} />
                </div>
                <h3 className='aldrich mb-2 text-[15px] font-semibold text-white'>
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
  );
}

'use client';

import { motion } from 'framer-motion';
import type { ElementType } from 'react';
import { Reveal } from '@/components/landing/reveal';

type ProgressBarProps = {
  label: string;
  icon: ElementType;
  value: number;
  color: string;
  sublabel: string;
};

export function ProgressBar({
  label,
  icon: Icon,
  value,
  color,
  sublabel,
}: ProgressBarProps) {
  return (
    <Reveal>
      <div
        className='rounded-2xl border border-white/[0.07] p-5'
        style={{
          background: 'linear-gradient(135deg, #1c1a0b 0%, #141208 100%)',
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
              background: `linear-gradient(90deg, ${color === 'text-amber-400' ? '#f59e0b, #ea580c' : '#f97316, #ef4444'})`,
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

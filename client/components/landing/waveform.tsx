'use client';

import { motion } from 'framer-motion';

type WaveformProps = {
  active?: boolean;
};

export function Waveform({ active = true }: WaveformProps) {
  const heights = [
    30, 60, 45, 80, 55, 100, 70, 40, 85, 50, 65, 35, 75, 45, 90, 60, 30, 70,
    50, 40,
  ];

  return (
    <div className='flex h-8 items-end gap-0.5'>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          className='w-0.75 origin-bottom rounded-full bg-linear-to-t from-amber-500 to-amber-300'
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

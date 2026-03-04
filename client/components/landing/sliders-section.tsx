'use client';

import { FiMic, FiStar } from 'react-icons/fi';
import { ProgressBar } from '@/components/landing/progress-bar';

export function SlidersSection() {
  return (
    <section className='px-3 pb-10'>
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
  );
}

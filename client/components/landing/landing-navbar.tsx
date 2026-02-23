'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const navItems = ['Home', 'Features', 'How to use'];

export function LandingNavbar() {
  return (
    <nav
      className='fixed left-0 right-0 top-0 z-50 border-b border-white/6 backdrop-blur-xl'
      style={{ background: 'rgba(15,14,6,0.85)' }}
    >
      <div className='mx-auto flex h-14 max-w-7xl items-center justify-between'>
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

        <div className='flex items-center gap-3'>
          <Link
            href='/auth'
            className='text-[13px] font-medium text-white/50 no-underline transition hover:text-white'
          >
            Sign in
          </Link>
          <motion.a
            href='/auth?mode=signup'
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='rounded-full px-4 py-2 text-[13px] font-semibold text-white no-underline shadow-lg shadow-amber-900/30'
            style={{ background: 'linear-gradient(90deg, #f59e0b, #ea580c)' }}
          >
            Sign up
          </motion.a>
        </div>
      </div>
    </nav>
  );
}

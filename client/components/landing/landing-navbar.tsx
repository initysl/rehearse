'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiMenu, FiX } from 'react-icons/fi';

const navItems = [
  { label: 'Home', href: '/#home' },
  { label: 'Features', href: '/#features' },
  { label: 'How to use', href: '/#how-to-use' },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow;
    }
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    mediaQuery.addEventListener('change', closeOnDesktop);
    return () => {
      mediaQuery.removeEventListener('change', closeOnDesktop);
    };
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className='fixed left-0 right-0 top-0 z-50 border-b border-white/6 backdrop-blur-xl'
        style={{ background: 'rgba(15,14,6,0.85)' }}
      >
        <div className='mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6'>
          <Link href='/' className='flex items-center gap-2.5 no-underline'>
            <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-amber-400 to-orange-600 text-sm shadow-lg shadow-amber-900/30'>
              🎙️
            </div>
            <span className='aldrich text-[17px] font-semibold text-white'>
              Rehearse
            </span>
          </Link>

          <div className='hidden items-center gap-0.5 rounded-full border border-white/8 bg-white/3 px-1 py-1 md:flex'>
            {navItems.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium no-underline transition-all ${
                  i === 0
                    ? 'bg-white text-[#0f0e06] shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className='flex items-center gap-2.5'>
            <motion.a
              href='/auth'
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className='hidden rounded-full px-4 py-2 text-[13px] font-semibold text-white no-underline shadow-lg shadow-amber-900/30 sm:inline-flex'
              style={{
                background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
              }}
            >
              Sign in
            </motion.a>

            <button
              type='button'
              onClick={() => setMobileOpen((open) => !open)}
              className='inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/6 text-white md:hidden'
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls='landing-mobile-menu'
            >
              {mobileOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>
        </div>
      </nav>

      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 top-14 z-40 bg-black/55 transition md:hidden ${
          mobileOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      <div
        id='landing-mobile-menu'
        className={`fixed left-3 right-3 top-16 z-50 rounded-2xl border border-white/10 bg-[#131007]/96 p-3 backdrop-blur-xl transition md:hidden ${
          mobileOpen
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className='space-y-1.5'>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className='block rounded-lg border border-transparent bg-white/5 px-3 py-2 text-sm font-medium text-white/85 no-underline transition hover:border-white/15 hover:bg-white/10'
            >
              {item.label}
            </Link>
          ))}
        </div>

        <motion.a
          href='/auth'
          whileTap={{ scale: 0.98 }}
          onClick={() => setMobileOpen(false)}
          className='mt-3 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white no-underline'
          style={{
            background: 'linear-gradient(90deg, #f59e0b, #ea580c)',
          }}
        >
          Sign in
        </motion.a>
      </div>
    </>
  );
}

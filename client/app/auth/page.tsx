'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaArrowLeft, FaGoogle } from 'react-icons/fa';
import { FiAlertCircle, FiLoader } from 'react-icons/fi';
import { useAccessToken } from '@/lib/hooks/use-access-token';
import { beginGoogleOAuth, useMeQuery } from '@/lib/hooks/use-auth';

export default function AuthPage() {
  const { accessToken } = useAccessToken();
  const meQuery = useMeQuery(accessToken);

  const [googleError, setGoogleError] = useState('');

  const handleGoogle = () => {
    try {
      setGoogleError('');
      beginGoogleOAuth('/console');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Google sign-in is unavailable right now.';
      setGoogleError(message);
    }
  };

  if (meQuery.isLoading || meQuery.isFetching) {
    return (
      <main className='relative min-h-screen overflow-x-hidden'>
        <div className='relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6'>
          <FiLoader
            size={34}
            className='animate-spin text-amber-300'
            aria-label='Loading authentication status'
          />
        </div>
      </main>
    );
  }

  return (
    <main className='relative min-h-screen overflow-x-hidden'>
      <div className='relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6'>
        <section className='w-full max-w-md rounded-3xl border border-white/8 bg-[#131108]/80 p-6 backdrop-blur-xl sm:p-8'>
          <div className='mb-6 flex items-center justify-between'>
            <Link
              href='/'
              className='inline-flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-white/40 no-underline transition hover:text-white/70'
            >
              <FaArrowLeft />
              Home
            </Link>
            <p className='aldrich text-xs uppercase tracking-[0.12em] text-amber-300/70'>
              Rehearse
            </p>
          </div>

          <button
            onClick={handleGoogle}
            type='button'
            className='cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/3 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/6 hover:text-white'
          >
            <FaGoogle />
            Continue with Google
          </button>

          {googleError ? (
            <p
              role='alert'
              className='mt-3 inline-flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200'
            >
              <FiAlertCircle className='mt-0.5 shrink-0' aria-hidden='true' />
              {googleError}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

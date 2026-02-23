'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiLoader,
  FiUser,
} from 'react-icons/fi';
import { z } from 'zod';
import { ApiError } from '@/lib/api/client';
import { useAccessToken } from '@/lib/hooks/use-access-token';
import {
  beginGoogleOAuth,
  useLoginMutation,
  useLogoutMutation,
  useMeQuery,
  useRegisterMutation,
} from '@/lib/hooks/use-auth';
import { FaGoogle } from 'react-icons/fa';

type AuthMode = 'signin' | 'signup';

const authSchema = z.object({
  fullName: z
    .string()
    .trim()
    .max(120, 'Full name is too long.')
    .optional(),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(254, 'Email address is too long.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(128, 'Password is too long.'),
});

type AuthFormValues = z.infer<typeof authSchema>;

const formatError = (error: unknown): string => {
  if (!error) return 'Something went wrong. Please try again.';
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return 'Invalid email or password.';
    }
    if (error.status === 409) {
      return 'An account with this email already exists.';
    }
    if (error.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error.message || 'Something went wrong. Please try again.';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
};

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60_000;

function useSubmitRateLimit() {
  const attempts = useRef<number[]>([]);

  const isRateLimited = () => {
    const now = Date.now();
    attempts.current = attempts.current.filter(
      (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
    );
    return attempts.current.length >= RATE_LIMIT_MAX;
  };

  const recordAttempt = () => {
    attempts.current.push(Date.now());
  };

  return { isRateLimited, recordAttempt };
}

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { accessToken, setAccessToken } = useAccessToken();
  const meQuery = useMeQuery(accessToken);

  const loginMutation = useLoginMutation(setAccessToken);
  const registerMutation = useRegisterMutation(setAccessToken);
  const logoutMutation = useLogoutMutation(setAccessToken);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [notice, setNotice] = useState('');
  const [googleError, setGoogleError] = useState('');

  const { isRateLimited, recordAttempt } = useSubmitRateLimit();

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      fullName: '',
      email: 'you@gmail.com',
      password: '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const isAuthenticated = Boolean(accessToken && meQuery.data?.user);
  const isSubmitting = loginMutation.isPending || registerMutation.isPending;

  const authError = useMemo(
    () => registerMutation.error || loginMutation.error,
    [registerMutation.error, loginMutation.error],
  );

  useEffect(() => {
    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'signup') {
      setMode('signup');
    } else if (requestedMode === 'signin') {
      setMode('signin');
    }
  }, [searchParams]);

  useEffect(() => {
    setNotice('');
    setGoogleError('');
    clearErrors();
    loginMutation.reset();
    registerMutation.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const onSubmit = async (values: AuthFormValues) => {
    setNotice('');

    if (isRateLimited()) {
      setError('email', {
        type: 'manual',
        message: 'Too many attempts. Please wait a moment before trying again.',
      });
      return;
    }

    try {
      if (mode === 'signin') {
        recordAttempt();
        await loginMutation.mutateAsync({
          email: values.email,
          password: values.password,
        });
        router.push('/console');
        return;
      }

      const fullName = values.fullName?.trim() || '';
      if (!fullName) {
        setError('fullName', {
          type: 'manual',
          message: 'Full name is required for sign up.',
        });
        return;
      }

      if (fullName.length < 2) {
        setError('fullName', {
          type: 'manual',
          message: 'Full name must be at least 2 characters.',
        });
        return;
      }

      recordAttempt();
      const registerResult = await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        fullName,
      });

      if (registerResult.requiresEmailConfirmation) {
        setNotice(
          'Account created. Check your inbox and confirm your email before signing in.',
        );
        setMode('signin');
        return;
      }

      router.push('/console');
    } catch {
      // mutation errors are shown from state
    }
  };

  const handleGoogle = () => {
    try {
      setGoogleError('');
      beginGoogleOAuth('/console');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Google sign-in unavailable.';
      setGoogleError(message);
    }
  };

  if (isAuthenticated && meQuery.data?.user) {
    return (
      <main
        className='relative min-h-screen overflow-x-hidden'
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className='relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-14 sm:px-6'>
          <div className='w-full max-w-xl rounded-3xl border border-white/8 bg-[#131108]/80 p-8 text-center backdrop-blur-xl'>
            <p className='mb-3 text-xs uppercase tracking-[0.12em] text-amber-300/70'>
              Signed in
            </p>
            <h1
              className='mb-3 text-3xl text-white'
              style={{ fontFamily: 'Syne', fontWeight: 700 }}
            >
              Welcome back
            </h1>
            <p className='mb-8 text-sm text-white/45'>
              You are signed in as{' '}
              <span className='text-white/70'>
                {meQuery.data.user.email ?? meQuery.data.user.userId}
              </span>
              .
            </p>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
              <button
                onClick={() => router.push('/console')}
                className='inline-flex items-center justify-center gap-2 rounded-full bg-linear-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-[#0f0e06]'
                type='button'
              >
                Open Console <FiArrowRight />
              </button>

              <button
                onClick={() => void logoutMutation.mutateAsync()}
                className='rounded-full border border-white/12 bg-white/3 px-6 py-3 text-sm font-medium text-white/70 transition hover:text-white'
                type='button'
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className='relative min-h-screen overflow-x-hidden'
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className='relative z-10 mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 py-12 sm:px-6'>
        <section
          className='w-full max-w-md rounded-3xl border border-white/8 bg-[#131108]/80 p-6 backdrop-blur-xl sm:p-8'
          aria-label={
            mode === 'signin' ? 'Sign in form' : 'Create account form'
          }
        >
          <div className='mb-6 flex items-center justify-between'>
            <Link
              href='/'
              className='text-xs uppercase tracking-[0.12em] text-white/40 no-underline transition hover:text-white/70'
            >
              ← Home
            </Link>
            <p className='text-xs uppercase tracking-[0.12em] text-amber-300/70'>
              Rehearse
            </p>
          </div>

          <h1
            className='mb-2 text-3xl text-white'
            style={{ fontFamily: 'Syne', fontWeight: 700 }}
          >
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </h1>
          <p className='mb-6 text-sm text-white/45'>
            {mode === 'signin'
              ? 'Continue your AI practice sessions.'
              : 'Start practicing difficult conversations with AI.'}
          </p>

          <div
            className='mb-6 grid grid-cols-2 rounded-full border border-white/8 bg-white/3 p-1'
            role='tablist'
            aria-label='Authentication mode'
          >
            <button
              type='button'
              role='tab'
              aria-selected={mode === 'signin'}
              onClick={() => setMode('signin')}
              className={`relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 ${
                mode === 'signin'
                  ? 'text-[#0f0e06]'
                  : 'text-white/55 hover:text-white/80'
              }`}
            >
              {mode === 'signin' ? (
                <motion.span
                  layoutId='auth-mode-pill'
                  className='absolute inset-0 rounded-full bg-white'
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 34,
                  }}
                />
              ) : null}
              <span className='relative z-10'>Sign in</span>
            </button>
            <button
              type='button'
              role='tab'
              aria-selected={mode === 'signup'}
              onClick={() => setMode('signup')}
              className={`relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-colors duration-200 ${
                mode === 'signup'
                  ? 'text-[#0f0e06]'
                  : 'text-white/55 hover:text-white/80'
              }`}
            >
              {mode === 'signup' ? (
                <motion.span
                  layoutId='auth-mode-pill'
                  className='absolute inset-0 rounded-full bg-white'
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 34,
                  }}
                />
              ) : null}
              <span className='relative z-10'>Sign up</span>
            </button>
          </div>

          <form
            className='space-y-3'
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {mode === 'signup' ? (
              <label className='block'>
                <span className='mb-1.5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-white/35'>
                  <FiUser size={11} /> Full name
                </span>
                <input
                  className={`w-full rounded-xl border bg-[#0f0d06] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 transition ${
                    errors.fullName
                      ? 'border-rose-400/60 focus:border-rose-400/70'
                      : 'border-white/10 focus:border-amber-400/45'
                  }`}
                  type='text'
                  placeholder='Ada Lovelace'
                  autoComplete='name'
                  maxLength={120}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'error-fullName' : undefined}
                  {...register('fullName')}
                />
                {errors.fullName ? (
                  <p
                    id='error-fullName'
                    role='alert'
                    className='mt-1.5 text-xs text-rose-300'
                  >
                    {errors.fullName.message}
                  </p>
                ) : null}
              </label>
            ) : null}

            <label className='block'>
              <span className='mb-1.5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-white/35'>
                <FiMail size={11} /> Email
              </span>
              <input
                className={`w-full rounded-xl border bg-[#0f0d06] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 transition ${
                  errors.email
                    ? 'border-rose-400/60 focus:border-rose-400/70'
                    : 'border-white/10 focus:border-amber-400/45'
                }`}
                type='email'
                autoComplete='email'
                maxLength={254}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'error-email' : undefined}
                {...register('email')}
              />
              {errors.email ? (
                <p
                  id='error-email'
                  role='alert'
                  className='mt-1.5 text-xs text-rose-300'
                >
                  {errors.email.message}
                </p>
              ) : null}
            </label>

            <label className='block'>
              <span className='mb-1.5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.08em] text-white/35'>
                <FiLock size={11} /> Password
              </span>
              <input
                className={`w-full rounded-xl border bg-[#0f0d06] px-3.5 py-3 text-sm text-white outline-none placeholder:text-white/25 transition ${
                  errors.password
                    ? 'border-rose-400/60 focus:border-rose-400/70'
                    : 'border-white/10 focus:border-amber-400/45'
                }`}
                type='password'
                placeholder={
                  mode === 'signup' ? 'Min. 8 characters' : 'Your password'
                }
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                minLength={8}
                maxLength={128}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={
                  errors.password ? 'error-password' : undefined
                }
                {...register('password')}
              />
              {errors.password ? (
                <p
                  id='error-password'
                  role='alert'
                  className='mt-1.5 text-xs text-rose-300'
                >
                  {errors.password.message}
                </p>
              ) : null}
            </label>

            <button
              className='cursor-pointer mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-linear-to-r from-amber-500 to-orange-600 px-6 py-3 text-sm font-semibold text-[#0f0e06] transition disabled:cursor-not-allowed disabled:opacity-50'
              type='submit'
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FiLoader
                    size={20}
                    className='animate-spin rounded-full border-2 text-white border-[#0f0e06]/30 border-t-[#0f0e06]'
                    aria-hidden='true'
                  />
                </>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className='my-5 flex items-center gap-3' aria-hidden='true'>
            <div className='h-px flex-1 bg-white/10' />
            <span className='text-[10px] uppercase tracking-[0.12em] text-white/30'>
              or continue with
            </span>
            <div className='h-px flex-1 bg-white/10' />
          </div>

          <button
            onClick={handleGoogle}
            type='button'
            className='cursor-pointer  inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/12 bg-white/3 px-6 py-3 text-sm font-medium text-white/80 transition hover:bg-white/6 hover:text-white'
          >
            <FaGoogle />
            Continue with Google
          </button>

          {googleError ? (
            <p
              role='alert'
              className='mt-3 inline-flex justify-center items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200'
            >
              <FiAlertCircle className='mt-0.5 shrink-0' aria-hidden='true' />
              {googleError}
            </p>
          ) : null}

          {notice ? (
            <p
              role='status'
              className='mt-4 inline-flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200'
            >
              <FiCheckCircle className='mt-0.5 shrink-0' aria-hidden='true' />
              {notice}
            </p>
          ) : null}

          {authError ? (
            <p
              role='alert'
              className='mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200'
            >
              <FiAlertCircle className='mt-0.5 shrink-0' aria-hidden='true' />
              {formatError(authError)}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

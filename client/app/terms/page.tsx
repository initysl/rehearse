import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className='mx-auto min-h-screen w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8 text-white'>
      <div className='rounded-3xl p-4'>
        <p className='text-xs font-semibold uppercase tracking-[0.08em]'>
          Legal
        </p>
        <h1 className='mt-2 text-3xl sm:text-4xl'>Terms of Use</h1>
        <p className='mt-4 text-sm leading-relaxed'>
          This is a starter terms page for Rehearse. Replace this text with your
          final legal terms before production launch.
        </p>

        <h2 className='mt-8 text-xl'>Acceptable Use</h2>
        <p className='mt-2 text-sm leading-relaxed'>
          Use Rehearse lawfully and do not attempt to abuse, overload, reverse
          engineer, or disrupt the platform.
        </p>

        <h2 className='mt-8 text-xl'>Accounts</h2>
        <p className='mt-2 text-sm leading-relaxed'>
          You are responsible for keeping your account credentials secure and
          for all activity on your account.
        </p>

        <h2 className='mt-8 text-xl'>Service Changes</h2>
        <p className='mt-2 text-sm leading-relaxed'>
          Features may change over time as we improve rehearsal quality and
          system reliability.
        </p>

        <div className='mt-10'>
          <Link
            href='/'
            className='rounded-full border border-(--line-soft) px-4 py-2 text-sm font-medium text-orange-600 hover:bg-white'
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';

export default function TermsPage() {
  return (
    <main className='mx-auto min-h-screen w-full max-w-4xl px-4 py-16 text-white sm:px-6 lg:px-8'>
      <p className='text-xs font-semibold uppercase tracking-widest text-white/65'>
        Legal
      </p>
      <h1 className='mt-2 text-3xl sm:text-4xl'>Terms of Use</h1>
      <p className='mt-2 text-sm text-white/60'>Last updated: March 2, 2026</p>

      <p className='mt-5 text-sm leading-relaxed text-white/85'>
        These Terms of Use govern your access to and use of Rehearse. By using
        Rehearse, you agree to these terms.
      </p>

      <section className='mt-8'>
        <h2 className='text-xl'>1. Eligibility and Account</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            You must be legally able to enter a binding agreement in your
            jurisdiction.
          </li>
          <li>
            You are responsible for account activity and for keeping your
            credentials secure.
          </li>
          <li>
            You must provide accurate account information and keep it updated.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>2. Acceptable Use</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>Use Rehearse lawfully and in good faith.</li>
          <li>
            Do not abuse, probe, reverse engineer, or disrupt the platform or
            its infrastructure.
          </li>
          <li>
            Do not use the service to create, share, or automate harmful,
            illegal, or abusive behavior.
          </li>
          <li>
            Do not attempt to bypass quotas, authentication controls, or rate
            limits.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>3. AI Output and Safety</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Rehearse provides AI-generated conversation and coaching output.
          Outputs may be inaccurate, incomplete, or unsuitable for your context.
          Rehearse is a training tool, not a substitute for legal, medical,
          financial, mental-health, or other professional advice.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>4. Sessions, Content, and Ownership</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            You retain rights to your original content to the extent allowed by
            law.
          </li>
          <li>
            You grant us the rights necessary to host, process, and deliver the
            service (including AI processing and feedback generation).
          </li>
          <li>
            We may remove content that violates these terms or creates
            security/legal risk.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>5.Limits and Availability</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            Features and provider availability (voice, transcription, text
            generation) may be limited by third-party infrastructure.
          </li>
          <li>
            We may modify, suspend, or discontinue features as the product
            evolves.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>6. Third-Party Services</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Rehearse integrates with third-party providers for authentication and
          AI processing. Your use of those underlying services may also be
          subject to their terms and policies.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>7. Termination and Suspension</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          We may suspend or terminate access if these terms are violated, if
          required by law, or to protect system security and reliability.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>8. Disclaimer of Warranties</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Rehearse is provided &quot;as is&quot; and &quot;as available,&quot;
          without warranties of uninterrupted service, accuracy, or fitness for
          a particular purpose.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>9. Limitation of Liability</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          To the fullest extent permitted by law, Rehearse and its operators are
          not liable for indirect, incidental, special, consequential, or
          punitive damages arising from your use of the service.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>10. Changes to These Terms</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          We may update these terms from time to time. Continued use after an
          update means you accept the revised terms.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>11. Contact</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Questions about these terms: legal@rehearse.app
        </p>
      </section>

      <div className='mt-10'>
        <Link
          href='/'
          className='inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/85 no-underline transition hover:bg-white/10'
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}

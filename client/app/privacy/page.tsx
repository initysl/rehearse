import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read how Rehearse collects, uses, protects, and retains account, session, transcript, and voice-processing data.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPage() {
  return (
    <main className='mx-auto min-h-screen w-full max-w-4xl px-4 py-16 text-white sm:px-6 lg:px-8'>
      <p className='text-xs font-semibold uppercase tracking-widest text-white/65'>
        Legal
      </p>
      <h1 className='mt-2 text-3xl sm:text-4xl'>Privacy Policy</h1>
      <p className='mt-2 text-sm text-white/60'>Last updated: March 2, 2026</p>

      <p className='mt-5 text-sm leading-relaxed text-white/85'>
        Rehearse (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is an AI
        conversation training platform. This policy explains what information we
        collect, how we use it, and your choices when using our web app and API.
      </p>

      <section className='mt-8'>
        <h2 className='text-xl'>1. Information We Collect</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            Account and profile data: email, full name, and account metadata
            from our authentication provider.
          </li>
          <li>
            Session data: selected scenarios, custom scenario content,
            difficulty settings, session status, and timestamps.
          </li>
          <li>
            Conversation data: text messages/transcripts and generated feedback
            reports tied to sessions.
          </li>
          <li>
            Voice processing data: audio is processed to generate transcripts
            and responses. Rehearse does not intentionally persist raw voice
            recordings in application storage.
          </li>
          <li>
            Technical and usage data: request logs (such as request ID,
            endpoint, status, duration, and IP) for security and operations.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>2. How We Use Information</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>Authenticate users and maintain secure sessions.</li>
          <li>
            Run conversation simulations, including text and voice workflows.
          </li>
          <li>Generate AI responses and post-session coaching feedback.</li>
          <li>
            Enforce limits, prevent abuse, troubleshoot incidents, and improve
            reliability/performance.
          </li>
          <li>Provide support and communicate important service updates.</li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>3. Service Providers and AI Processing</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          We use third-party services to operate Rehearse, including hosted
          authentication and AI infrastructure. Depending on feature usage, your
          text and/or audio may be processed by providers. Their handling of
          data is governed by their own terms and privacy policies.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>4. Cookies and Session Security</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Rehearse uses essential HTTP-only authentication cookies.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>5. Data Retention</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            Session history, transcripts, and feedback remain in your account
            until deleted by you or removed under our operational policies.
          </li>
          <li>Cache data is temporary and expires automatically.</li>
          <li>
            Operational logs are retained for a limited period needed for
            monitoring, abuse prevention, and incident response.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>6. Your Controls and Rights</h2>
        <ul className='mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/80'>
          <li>
            You can edit profile fields and remove session history from within
            the product.
          </li>
          <li>
            You may request account-level data access, correction, or deletion
            by contacting us.
          </li>
          <li>
            Where local law applies, you may have additional privacy rights.
          </li>
        </ul>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>7. Security</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          We apply reasonable technical and organizational safeguards to protect
          data. No online system can be guaranteed 100% secure, so you should
          also protect your account credentials and devices.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>8. Children&apos;s Privacy</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Rehearse is not intended for children under 13, and we do not
          knowingly collect personal data from children under 13.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>9. Policy Updates</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          We may update this policy when the service or legal requirements
          change. We will update the &quot;Last updated&quot; date above.
        </p>
      </section>

      <section className='mt-8'>
        <h2 className='text-xl'>10. Contact</h2>
        <p className='mt-2 text-sm leading-relaxed text-white/80'>
          Privacy questions or requests: legal@rehearse.app
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

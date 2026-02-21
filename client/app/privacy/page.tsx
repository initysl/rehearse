import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-(--ink-soft)">
          Legal
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm leading-relaxed text-(--ink-soft)">
          This is a starter privacy page for Rehearse. Replace this text with your final policy before production launch.
        </p>

        <h2 className="mt-8 text-xl">What We Collect</h2>
        <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">
          We may store account details, session transcripts, and feedback results needed to provide practice and coaching.
        </p>

        <h2 className="mt-8 text-xl">How We Use Data</h2>
        <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">
          Data is used to run simulations, generate feedback, improve reliability, and support user requests.
        </p>

        <h2 className="mt-8 text-xl">Your Controls</h2>
        <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">
          You can request account-level data deletion and access requests according to your final policy and jurisdiction requirements.
        </p>

        <div className="mt-10">
          <Link
            href="/"
            className="rounded-full border border-(--line-soft) px-4 py-2 text-sm font-medium text-foreground hover:bg-white"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}

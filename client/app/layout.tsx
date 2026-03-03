import type { Metadata } from 'next';
import { Aldrich, Nova_Square } from 'next/font/google';
import './globals.css';
import { AmbientBackground } from '@/components/landing/ambient-background';
import { Providers } from './providers';

const nova = Nova_Square({
  variable: '--nova-square',
  subsets: ['latin'],
  weight: '400',
});

const aldrich = Aldrich({
  variable: '--aldrich',
  subsets: ['latin'],
  weight: '400',
});

const defaultSiteUrl = 'http://localhost:3000';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || defaultSiteUrl;
const metadataBase = (() => {
  try {
    return new URL(appUrl);
  } catch {
    return new URL(defaultSiteUrl);
  }
})();

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: 'Rehearse | AI Conversation Simulator',
    template: '%s | Rehearse',
  },
  description:
    'Practice high-stakes real-life conversations with AI role-play, voice and text simulation, and structured coaching feedback.',
  applicationName: 'Rehearse',
  keywords: [
    'AI conversation simulator',
    'conversation practice',
    'role play training',
    'communication coaching',
    'salary negotiation practice',
    'interview simulation',
    'difficult conversations',
    'interpersonal skills training',
  ],
  authors: [{ name: 'Rehearse Team' }],
  creator: 'Rehearse',
  publisher: 'Rehearse',
  category: 'education',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Rehearse',
    title: 'Rehearse | AI Conversation Simulator',
    description:
      'Build confidence for salary negotiations, difficult family talks, medical appointments, and other high-stakes conversations.',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Rehearse | AI Conversation Simulator',
    description:
      'Practice real-life conversations with AI and get actionable feedback after every session.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${nova.variable} ${aldrich.variable} relative min-h-screen bg-[#0f0e06] antialiased`}
      >
        <AmbientBackground />
        <div className='relative z-10'>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

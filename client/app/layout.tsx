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

export const metadata: Metadata = {
  title: 'Rehearse- AI converstion simulator',
  description: 'Rehearse frontend integration shell',
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

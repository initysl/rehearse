import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AmbientBackground } from '@/components/landing/ambient-background';

export const metadata: Metadata = {
  title: 'Rehearse Client',
  description: 'Rehearse frontend integration shell',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='relative min-h-screen bg-[#0f0e06] antialiased'>
        <AmbientBackground />
        <div className='relative z-10'>
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}

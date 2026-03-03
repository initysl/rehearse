import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Console',
  description: 'Authenticated Rehearse user console.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

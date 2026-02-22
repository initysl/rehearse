import Link from 'next/link';
import { FiFacebook, FiLinkedin, FiSend, FiTwitter } from 'react-icons/fi';

const legalLinks = [
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
];

const socialLinks = [
  { label: 'X', href: 'https://x.com', icon: FiTwitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: FiLinkedin },
  { label: 'Telegram', href: 'https://t.me', icon: FiSend },
  { label: 'Facebook', href: 'https://www.facebook.com', icon: FiFacebook },
];

export function LandingFooter() {
  return (
    <footer className='border-t border-white/5 px-6 py-8'>
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5'>
        <div className='flex flex-wrap gap-6'>
          {legalLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className='text-[12px] font-medium uppercase tracking-wider text-white/25 no-underline transition hover:text-white/55'
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className='flex gap-2.5'>
          {socialLinks.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target='_blank'
              rel='noreferrer noopener'
              aria-label={social.label}
              className='flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/2 text-[13px] text-white/25 no-underline transition hover:border-white/12 hover:text-white/55'
            >
              <social.icon />
            </a>
          ))}
        </div>

        <p className='w-full text-center text-[11px] text-white/18 md:w-auto'>
          © 2026 Rehearse. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

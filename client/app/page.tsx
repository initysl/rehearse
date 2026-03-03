import type { Metadata } from 'next';
import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { SlidersSection } from '@/components/landing/sliders-section';

export const metadata: Metadata = {
  title: 'Rehearse | AI Conversation Simulator',
  description:
    'Rehearse helps you practice high-stakes conversations with realistic AI characters across work, family, health, and social scenarios.',
  alternates: {
    canonical: '/',
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Rehearse',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  description:
    'AI-powered conversation simulator for practicing high-stakes real-life conversations with coaching feedback.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type='application/ld+json'
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className='relative min-h-screen overflow-x-hidden'>
        <LandingNavbar />
        <HeroSection />
        <SlidersSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CtaSection />
        <LandingFooter />
      </div>
    </>
  );
}

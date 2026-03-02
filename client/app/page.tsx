'use client';
import { CtaSection } from '@/components/landing/cta-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorksSection } from '@/components/landing/how-it-works-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { LandingNavbar } from '@/components/landing/landing-navbar';
import { SlidersSection } from '@/components/landing/sliders-section';

export default function LandingPage() {
  return (
    <div className='relative min-h-screen overflow-x-hidden'>
      <LandingNavbar />
      <HeroSection />
      <SlidersSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
      <LandingFooter />
    </div>
  );
}

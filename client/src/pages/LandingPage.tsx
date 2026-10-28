import React from 'react';
import '../styles/landing.css';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ProblemPivotSection } from '../components/landing/ProblemPivotSection';
import { CapabilitiesSection } from '../components/landing/CapabilitiesSection';
import { ProductTourSection } from '../components/landing/ProductTourSection';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { ArchitectureSection } from '../components/landing/ArchitectureSection';
import { RoleLaunchpadSection } from '../components/landing/RoleLaunchpadSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  onDemoPersona?: (persona: 'SUPERVISOR' | 'TECHNICIAN' | 'WORKER') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onSignIn,
  onSignUp,
  isAuthenticated = false,
  userName,
  onDemoPersona,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ margin:0, padding:0, background:'#F8F7F4', overflowX:'hidden' }}>
      {/* Sticky Navbar — fixed z-50, never overlaps sections */}
      <Navbar
        onLaunchStudio={onLaunchStudio}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        isAuthenticated={isAuthenticated}
        userName={userName}
      />

      {/* Architectural hairline container */}
      <div style={{ maxWidth:'1280px', margin:'0 auto', borderLeft:'1px solid rgba(0,0,0,0.05)', borderRight:'1px solid rgba(0,0,0,0.05)', position:'relative' }}>

        {/* Section A — Hero */}
        <HeroSection
          onLaunchStudio={onLaunchStudio}
          onExploreTour={() => scrollTo('capabilities')}
          onDemoPersona={onDemoPersona}
        />

        {/* Section B — Problem vs Pivot */}
        <ProblemPivotSection />

        {/* Section C — Capabilities Bento (01–04) */}
        <CapabilitiesSection />

        {/* Section D — Interactive Evidence Graph & Case Explorer */}
        <ProductTourSection onLaunchStudio={onLaunchStudio} />

        {/* Section E — I–IV Workflow Split + Engine Inspector */}
        <WorkflowSection />

        {/* Section F — Architecture & Ingestion Marquee */}
        <ArchitectureSection />

        {/* Section G — Role Experience Launchpad */}
        <RoleLaunchpadSection
          onDemoPersona={onDemoPersona}
          onLaunchStudio={onLaunchStudio}
        />

        {/* Section H — Final CTA */}
        <FinalCTASection
          onLaunchStudio={onLaunchStudio}
          onExploreCapabilities={() => scrollTo('capabilities')}
          onSignIn={onSignIn}
        />
      </div>

      {/* Footer — full bleed */}
      <Footer onLaunchStudio={onLaunchStudio} onSignIn={onSignIn} />
    </div>
  );
};

import React from 'react';
import '../styles/landing.css';
import { Navbar } from '../components/landing/Navbar';
import { HeroSection } from '../components/landing/HeroSection';
import { ProductTourSection } from '../components/landing/ProductTourSection';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { CapabilitiesSection } from '../components/landing/CapabilitiesSection';
import { ArchitectureSection } from '../components/landing/ArchitectureSection';
import { FinalCTASection } from '../components/landing/FinalCTASection';
import { Footer } from '../components/landing/Footer';

interface LandingPageProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLaunchStudio,
  onSignIn,
  onSignUp,
  isAuthenticated = false,
  userName,
}) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-body">
      {/* Floating Pill Navigation */}
      <Navbar
        onLaunchStudio={onLaunchStudio}
        onSignIn={onSignIn}
        onSignUp={onSignUp}
        isAuthenticated={isAuthenticated}
        userName={userName}
      />

      {/* Section A — Hero Section */}
      <HeroSection
        onLaunchStudio={onLaunchStudio}
        onExploreTour={() => scrollTo('tour')}
      />

      {/* Section B — Interactive Product Tour */}
      <ProductTourSection onLaunchStudio={onLaunchStudio} />

      {/* Section C — Workflow Demonstration */}
      <WorkflowSection />

      {/* Section D — Product Capabilities */}
      <CapabilitiesSection />

      {/* Section E — Architecture & Deep Tech */}
      <ArchitectureSection />

      {/* Section F — Final Call to Action */}
      <FinalCTASection
        onLaunchStudio={onLaunchStudio}
        onExploreCapabilities={() => scrollTo('capabilities')}
      />

      {/* Section G — Footer */}
      <Footer
        onLaunchStudio={onLaunchStudio}
        onSignIn={onSignIn}
      />
    </div>
  );
};

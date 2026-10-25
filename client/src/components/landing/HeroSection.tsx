import React from 'react';

interface HeroSectionProps {
  onLaunchStudio: () => void;
  onExploreTour: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onLaunchStudio,
  onExploreTour,
}) => {
  return (
    <section className="hero-section">
      <div className="hero-glow" />

      <div className="hero-content">
        {/* Eyebrow */}
        <div className="hero-eyebrow">
          <span className="hero-eyebrow-sparkle">✨</span>
          <span>EVIDENCE-DRIVEN MAINTENANCE INTELLIGENCE</span>
        </div>

        {/* Editorial Serif Display Headline with Italic */}
        <h1 className="hero-heading">
          Every machine fault has a history. <br />
          <em className="serif-italic">Kirova helps you use it.</em>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtext">
          Connect worker-reported faults with historical maintenance records, traceable evidence,
          and explainable repair options—so teams can understand recurring failures and make better-informed maintenance decisions.
        </p>

        {/* Action Buttons */}
        <div className="hero-cta-group">
          <button
            type="button"
            className="btn-hero-primary"
            onClick={onLaunchStudio}
          >
            <span>▷</span>
            <span>Explore Maintenance Intelligence</span>
          </button>

          <button
            type="button"
            className="btn-hero-secondary"
            onClick={onExploreTour}
          >
            <span>See How It Works</span>
            <span>↓</span>
          </button>
        </div>

        {/* Capability Line */}
        <div className="hero-capability-line">
          Fault reporting · Historical evidence · Repair vs replace analysis · Verified outcomes
        </div>

        {/* Audio Waveform Capsule (Matching Reference Screenshot 1) */}
        <div>
          <div className="hero-waveform-capsule" title="Interactive Voice Ingestion Waveform">
            <div className="waveform-bars">
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
              <div className="waveform-bar" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

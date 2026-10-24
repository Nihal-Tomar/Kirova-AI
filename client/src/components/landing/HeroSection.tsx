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
          <span>YOUR AI-POWERED WORKSPACE</span>
        </div>

        {/* Editorial Serif Display Headline with Italic */}
        <h1 className="hero-heading">
          From voice to <br />
          <em className="serif-italic">verified action.</em>
        </h1>

        {/* Subtitle */}
        <p className="hero-subtext">
          Turn conversations, operational knowledge, and everyday requests into clear,
          structured actions with Kirova AI.
        </p>

        {/* Action Buttons */}
        <div className="hero-cta-group">
          <button
            type="button"
            className="btn-hero-primary"
            onClick={onLaunchStudio}
          >
            <span>▷</span>
            <span>Launch Studio</span>
          </button>

          <button
            type="button"
            className="btn-hero-secondary"
            onClick={onExploreTour}
          >
            <span>Explore Product Tour</span>
            <span>↓</span>
          </button>
        </div>

        {/* Capability Line */}
        <div className="hero-capability-line">
          Voice input · Intelligent workflows · Verified actions · Team collaboration
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

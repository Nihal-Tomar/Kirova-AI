import React from 'react';

interface FinalCTASectionProps {
  onLaunchStudio: () => void;
  onExploreCapabilities: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onLaunchStudio,
  onExploreCapabilities,
}) => {
  return (
    <section className="final-cta-section">
      <div className="final-cta-content">
        <h2 className="final-cta-heading">
          Ready to turn intent into <br />
          <em className="serif-italic">verified action?</em>
        </h2>

        <p className="final-cta-subtext">
          Bring your maintenance workflow into a structured, accountable, and transparent workspace.
          Zero lost reports. 100% human-verified closure.
        </p>

        <div className="final-cta-buttons">
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
            style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFF', borderColor: 'rgba(255, 255, 255, 0.2)' }}
            onClick={onExploreCapabilities}
          >
            <span>Explore Capabilities</span>
            <span>↓</span>
          </button>
        </div>
      </div>
    </section>
  );
};

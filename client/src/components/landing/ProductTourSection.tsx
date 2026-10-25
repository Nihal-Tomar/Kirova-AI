import React, { useState } from 'react';

interface ProductTourSectionProps {
  onLaunchStudio: () => void;
}

export const ProductTourSection: React.FC<ProductTourSectionProps> = ({
  onLaunchStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'studio' | 'multilingual' | 'audit'>('voice');
  const [verifiedState, setVerifiedState] = useState(false);

  const tabContent = {
    voice: {
      query: '"MCH-006 screw compressor & pump tripping above 95°C under continuous line pressure."',
      machine: 'MCH-006 • Screw Compressor Alpha & Pump',
      subsystem: 'Air-Oil Separator & Heat Exchanger',
      severity: 'HIGH',
      tech: 'Rajesh Kumar (Technician)',
      evidence: [
        { label: 'REPORTED', field: 'Symptom', val: 'Overheating above 95°C', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Asset Tag', val: 'MCH-006 (Utility Room)', color: 'retrieved' },
        { label: 'RETRIEVED', field: 'History Match', val: 'WO-2026-0006: Filter choked', color: 'grounded' },
        { label: 'SUGGESTED', field: 'Decision Support', val: 'Replace filter (PT-FL-707)', color: 'extracted' },
      ],
    },
    studio: {
      query: '"Hydraulic press cylinder slow descent and pressure drop below 30 bar"',
      machine: 'MCH-005 • 50-Ton Hydraulic Press',
      subsystem: 'Hydraulic Cylinder Seal Kit',
      severity: 'CRITICAL',
      tech: 'Amit Verma (Line Tech)',
      evidence: [
        { label: 'REPORTED', field: 'Fault', val: 'Pressure loss below 30 bar', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Equipment ID', val: 'MCH-005 (Stamping Area)', color: 'retrieved' },
        { label: 'RETRIEVED', field: 'Verified History', val: 'Seal replacement held 50T hold test', color: 'grounded' },
        { label: 'SUGGESTED', field: 'Required Part', val: 'PT-HC-606 (Seal Kit)', color: 'grounded' },
      ],
    },
    multilingual: {
      query: '"Machine chaar me se ajeeb awaaz aa rahi hai aur belt slip ho raha hai"',
      machine: 'MCH-004 • Main Conveyor Belt 4',
      subsystem: 'Belt Tensioner Roller (PT-TR-505)',
      severity: 'MEDIUM',
      tech: 'Suresh Patil (Line Tech)',
      evidence: [
        { label: 'REPORTED', field: 'Dialect', val: 'Hinglish (Hindi + English)', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Disambiguation', val: 'MCH-004 Conveyor vs MCH-014 Lathe', color: 'retrieved' },
        { label: 'SUGGESTED', field: 'Decision', val: 'Inspect tensioner bearing play', color: 'grounded' },
      ],
    },
    audit: {
      query: '"Tensioner replaced and 2-hour full load test verified with 0 drift."',
      machine: 'MCH-004 • Main Conveyor Belt 4',
      subsystem: 'Drive Assembly Verification',
      severity: 'VERIFIED_CLOSED',
      tech: 'Priya Sharma (Supervisor)',
      evidence: [
        { label: 'REPORTED', field: 'Resolution', val: 'Installed PT-TR-505 roller', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Audit Hash', val: 'Append-Only PostgreSQL Log', color: 'retrieved' },
        { label: 'RETRIEVED', field: 'History Feedback', val: 'Enriched verified asset dataset', color: 'grounded' },
      ],
    },
  };

  const current = tabContent[activeTab];

  return (
    <section id="tour" className="tour-section">
      <div className="landing-container">
        {/* Top Tab Pills matching reference screenshot 2 */}
        <div className="tour-subnav-wrapper">
          <div className="tour-subnav">
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'voice' ? 'active' : ''}`}
              onClick={() => { setActiveTab('voice'); setVerifiedState(false); }}
            >
              <span>🌡️ Overheating Pump & Compressor</span>
              <span className="tour-tab-badge">CASE STUDY</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => { setActiveTab('studio'); setVerifiedState(false); }}
            >
              <span>⚖️ Repair vs Replace</span>
              <span className="tour-tab-badge">DECISION ENGINE</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'multilingual' ? 'active' : ''}`}
              onClick={() => { setActiveTab('multilingual'); setVerifiedState(false); }}
            >
              <span>🌐 Multilingual Intake</span>
              <span className="tour-tab-badge">SARVAM STT</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => { setActiveTab('audit'); setVerifiedState(false); }}
            >
              <span>🔒 Verified History Loop</span>
              <span className="tour-tab-badge">PG-TRIGGER</span>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="tour-header">
          <div className="tour-eyebrow">
            <span>NOT JUST AN AI ANSWER • SHOW THE EVIDENCE</span>
          </div>

          <h2 className="tour-heading">
            From repeated machine faults to <br />
            <em className="serif-italic">evidence-backed repair options.</em>
          </h2>

          <p className="tour-subtext">
            Every recommendation links directly to verified historical work orders and original records, while ambiguous matches and missing diagnostic information remain completely visible. The case data shown below is illustrative demonstration data for product walkthrough, not live factory output.
          </p>
        </div>

        {/* 2-Column Comparison Grid (Traditional 15+ mins vs Kirova 2 seconds) */}
        <div className="tour-comparison-grid">
          {/* Left Card: Traditional Manual Scrubbing */}
          <div className="tour-card-traditional">
            <div>
              <div className="tour-card-badge-row">
                <span className="tour-tag-traditional">TRADITIONAL REACTIVE FIXES</span>
              </div>
              <div className="tour-card-stat">Repeat Guesswork</div>
              <p className="tour-card-desc">
                Workers repeatedly report recurring breakdown symptoms without history. Technicians apply temporary patches without knowing past parts failed, leading to chronic downtime.
              </p>
            </div>

            <div className="scrubbing-bar-wrapper">
              <span>00:00</span>
              <div className="scrubbing-progress-line" />
              <span>Unverified records · No audit</span>
            </div>
          </div>

          {/* Right Card: Kirova AI Flow */}
          <div className="tour-card-future">
            <div>
              <div className="tour-card-badge-row">
                <span className="tour-tag-future">
                  <span>⚡</span>
                  <span>KIROVA EVIDENCE FLOW</span>
                </span>
                <span className="tour-pill-rag">EVIDENCE-GROUNDED</span>
              </div>
              <div className="tour-card-stat">4-Way Comparison</div>
              <p className="tour-card-desc">
                Retrieves verified machine history, shows past parts replaced, highlights missing symptoms, and generates an explainable comparison: inspect, repair, replace component, or replace unit.
              </p>
            </div>

            <div className="future-ingest-bar">
              <div className="future-live-audio">
                <span>••••••••••</span>
                <span>Verified Historical Grounding</span>
              </div>
              <button
                type="button"
                className="btn-card-launch"
                onClick={onLaunchStudio}
              >
                <span>Launch Studio</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Interactive Product UI Mockup (Matching Screenshot 2) */}
        <div className="tour-mockup-container">
          <div className="mockup-inner-grid">
            {/* Left Column: Machine Incident Simulation */}
            <div className="mockup-media-card">
              <div className="mockup-media-header">
                <div className="mockup-media-dots">
                  <div className="mockup-dot red" />
                  <div className="mockup-dot yellow" />
                  <div className="mockup-dot green" />
                </div>
                <div className="mockup-media-title">plant_floor_sensor_feed // {current.machine}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>1080p HD</div>
              </div>

              <div className="mockup-media-player">
                <div className="mockup-play-circle" title="Simulated audio/video sensor stream">
                  ▶
                </div>
                <div className="mockup-video-title">{current.machine}</div>
                <div className="mockup-video-meta">Simulated Telemetry · 1,800 RPM · Current Draw: 14.2A</div>
              </div>
            </div>

            {/* Right Column: Kirova AI Side Panel */}
            <div className="mockup-side-panel">
              <div className="side-panel-header">
                <div className="side-panel-title">
                  <span style={{ color: 'var(--accent-mint)' }}>⚙️</span>
                  <span>Kirova Verification Panel</span>
                </div>
                <span className="side-panel-badge">
                  {verifiedState ? 'APPROVED & ASSIGNED' : 'AWAITING APPROVAL'}
                </span>
              </div>

              {/* Spoken Query */}
              <div className="mockup-query-box">
                <div className="mockup-query-label">OPERATOR SPOKEN REPORT</div>
                <div className="mockup-query-text">{current.query}</div>
              </div>

              {/* AI Grounded Extraction Box */}
              <div className="mockup-response-box">
                <div className="response-header">
                  <div className="response-engine">
                    <span>🧠</span>
                    <span>Sarvam Saaras + Anti-Hallucination Guardrail</span>
                  </div>
                  <span className="response-match-score">history match</span>
                </div>

                <div className="response-text">
                  Extracted <strong>{current.subsystem}</strong> on <strong>{current.machine}</strong>.
                  Severity evaluated as <strong style={{ color: current.severity === 'CRITICAL' ? '#FF7575' : '#FFBD2E' }}>{current.severity}</strong>.
                  Suggested assigned technician: <strong>{current.tech}</strong>.
                </div>

                <div className="response-evidence-tags">
                  {current.evidence.map((ev, i) => (
                    <span key={i} className={`evidence-tag ${ev.color}`}>
                      {ev.label}: {ev.field} → {ev.val}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {!verifiedState ? (
                  <button
                    type="button"
                    className="btn-card-launch"
                    style={{ flex: 1, justifyContent: 'center', background: 'var(--accent-mint)' }}
                    onClick={() => setVerifiedState(true)}
                  >
                    <span>✓</span>
                    <span>Verify & Approve Work Order</span>
                  </button>
                ) : (
                  <div style={{ flex: 1, background: 'rgba(201, 184, 255, 0.15)', border: '1px solid var(--accent-mint)', borderRadius: '9999px', padding: '10px', textAlign: 'center', color: 'var(--accent-mint)', fontWeight: 600, fontSize: '0.875rem' }}>
                    ✅ Work Order Verified & Stamped into Audit Log
                  </div>
                )}
                <button
                  type="button"
                  className="btn-card-launch"
                  style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#FFF' }}
                  onClick={onLaunchStudio}
                  title="Open in full workspace"
                >
                  Open Studio →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

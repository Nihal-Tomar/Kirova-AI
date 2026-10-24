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
      query: '"Main spindle bearing overheating and vibrating at 1800 RPM. Motor drawing 14A."',
      machine: 'MCH-001 • Primary CNC Milling Center',
      subsystem: 'Spindle Drive Assembly',
      severity: 'HIGH',
      tech: 'Rajesh Kumar (Technician)',
      evidence: [
        { label: 'EXTRACTED', field: 'Symptom', val: 'Overheating & Vibration', color: 'extracted' },
        { label: 'EXTRACTED', field: 'Subsystem', val: 'Spindle Bearing', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Machine Registry', val: 'MCH-001 (Bay 3)', color: 'retrieved' },
        { label: 'INFERRED', field: 'Safety Impact', val: 'Bearing seizure hazard', color: 'grounded' },
      ],
    },
    studio: {
      query: '"Hydraulic hose leaking oil under conveyor 2 near packing line"',
      machine: 'MCH-004 • Secondary Conveyor Line',
      subsystem: 'Hydraulic Pressure Loop',
      severity: 'CRITICAL',
      tech: 'Amit Verma (Hydraulics Specialist)',
      evidence: [
        { label: 'EXTRACTED', field: 'Fault', val: 'Oil leakage / pressure loss', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Equipment ID', val: 'MCH-004', color: 'retrieved' },
        { label: 'INFERRED', field: 'Required Part', val: 'High-pressure ISO hydraulic seal', color: 'grounded' },
      ],
    },
    multilingual: {
      query: '"Machine chaar me se ajeeb awaaz aa rahi hai aur belt slip ho raha hai"',
      machine: 'MCH-002 • Stamping Press Unit',
      subsystem: 'Drive Belt Tensioner',
      severity: 'MEDIUM',
      tech: 'Suresh Patil (Line Tech)',
      evidence: [
        { label: 'EXTRACTED', field: 'Dialect', val: 'Hinglish (Hindi + English)', color: 'extracted' },
        { label: 'RETRIEVED', field: 'STT Engine', val: 'Sarvam Saaras STT (Vernacular)', color: 'retrieved' },
        { label: 'INFERRED', field: 'Tension Metric', val: 'Retension or replace 48V belt', color: 'grounded' },
      ],
    },
    audit: {
      query: '"Inspection passed and spindle re-calibrated. Ready for verification closing."',
      machine: 'MCH-001 • Primary CNC Milling Center',
      subsystem: 'Spindle Calibration',
      severity: 'RESOLVED',
      tech: 'Priya Sharma (Supervisor Reviewer)',
      evidence: [
        { label: 'EXTRACTED', field: 'Action', val: 'Work Order Resolution Submission', color: 'extracted' },
        { label: 'RETRIEVED', field: 'Audit Hash', val: '0x8f2d...c3a9 (Immutable PG Log)', color: 'retrieved' },
        { label: 'INFERRED', field: 'PostgreSQL Defense', val: 'SQL UPDATE/DELETE blocked by trigger', color: 'grounded' },
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
              <span>🎙️ Voice Reporting</span>
              <span className="tour-tab-badge">IN-BROWSER</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => { setActiveTab('studio'); setVerifiedState(false); }}
            >
              <span>⚙️ Studio AI</span>
              <span className="tour-tab-badge">MOST POPULAR</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'multilingual' ? 'active' : ''}`}
              onClick={() => { setActiveTab('multilingual'); setVerifiedState(false); }}
            >
              <span>🌐 Multilingual & Hinglish</span>
              <span className="tour-tab-badge">DUAL-ENGINE</span>
            </button>
            <button
              type="button"
              className={`tour-tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
              onClick={() => { setActiveTab('audit'); setVerifiedState(false); }}
            >
              <span>🔒 Verified Audit</span>
              <span className="tour-tab-badge">PG-TRIGGER</span>
            </button>
          </div>
        </div>

        {/* Section Header */}
        <div className="tour-header">
          <div className="tour-eyebrow">
            <span>KIROVA AI CORE PIPELINE • VERIFIED WORKFLOW</span>
          </div>

          <h2 className="tour-heading">
            Less manual work. <br />
            <em className="serif-italic">More meaningful action.</em>
          </h2>

          <p className="tour-subtext">
            See how Kirova AI transforms natural language input into structured, reviewable workflows.
          </p>
        </div>

        {/* 2-Column Comparison Grid (Traditional 15+ mins vs Kirova 2 seconds) */}
        <div className="tour-comparison-grid">
          {/* Left Card: Traditional Manual Scrubbing */}
          <div className="tour-card-traditional">
            <div>
              <div className="tour-card-badge-row">
                <span className="tour-tag-traditional">TRADITIONAL MANUAL WORKFLOW</span>
              </div>
              <div className="tour-card-stat">15+ mins</div>
              <p className="tour-card-desc">
                Verbal handoffs over noisy shop floors, scribble notes on paper clipboards,
                misidentified machine tags, and supervisor phone tags delaying repairs.
              </p>
            </div>

            <div className="scrubbing-bar-wrapper">
              <span>00:00</span>
              <div className="scrubbing-progress-line" />
              <span>Searching... 45:30</span>
            </div>
          </div>

          {/* Right Card: Kirova AI Flow */}
          <div className="tour-card-future">
            <div>
              <div className="tour-card-badge-row">
                <span className="tour-tag-future">
                  <span>⚡</span>
                  <span>KIROVA FLOW</span>
                </span>
                <span className="tour-pill-rag">SUB-10MS EXTRACTION</span>
              </div>
              <div className="tour-card-stat">2 seconds</div>
              <p className="tour-card-desc">
                Type or speak in Hindi, Hinglish, or English. Faster-Whisper & Sarvam AI extract
                machine IDs, symptoms, and severity with grounded evidence and supervisor sign-off.
              </p>
            </div>

            <div className="future-ingest-bar">
              <div className="future-live-audio">
                <span>••••••••••</span>
                <span>Live 16kHz Ingestion</span>
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
                <div className="mockup-video-meta">Live Telemetry · 1,800 RPM · Current Draw: 14.2A</div>
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
                  <span className="response-match-score">98.6% match</span>
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
                  <div style={{ flex: 1, background: 'rgba(85, 231, 176, 0.15)', border: '1px solid var(--accent-mint)', borderRadius: '9999px', padding: '10px', textAlign: 'center', color: 'var(--accent-mint)', fontWeight: 600, fontSize: '0.875rem' }}>
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

import React, { useState } from 'react';

export const ArchitectureSection: React.FC = () => {
  const [selectedEngine, setSelectedEngine] = useState<'whisper' | 'sarvam'>('whisper');

  return (
    <section id="architecture" className="arch-section">
      <div className="landing-container">
        <div className="arch-header">
          <div className="arch-eyebrow-capsule">
            <span>✨</span>
            <span>DEEP ARCHITECTURAL CAPABILITIES</span>
          </div>

          <h2 className="arch-heading">
            Built for serious scale. <br />
            <em className="serif-italic">Engineered for zero waste.</em>
          </h2>

          <p className="arch-subtext">
            From zero-token deterministic fallbacks to sub-10ms localized vector lookups, explore the deep-tech foundations powering Kirova AI.
          </p>
        </div>

        {/* 2 Big Feature Cards matching Reference Screenshot 3 */}
        <div className="arch-cards-grid">
          {/* Card 1: Speech Architecture */}
          <div className="arch-card">
            <div className="arch-card-top">
              <div className="arch-icon-pill">🎙️</div>
              <span className="arch-chip-badge">4-8x Faster Inference</span>
            </div>

            <div className="arch-card-category">SPEECH ARCHITECTURE</div>
            <h3 className="arch-card-title">Dual-Engine Speech Recognition</h3>
            <p className="arch-card-body">
              Intelligently switches between local CTranslate2 Faster-Whisper and Sarvam AI dialect processing to deliver flawless English and Hinglish recognition.
            </p>

            <div className="arch-engine-pills">
              <button
                type="button"
                className={`engine-pill ${selectedEngine === 'whisper' ? '' : 'alt'}`}
                onClick={() => setSelectedEngine('whisper')}
              >
                <span>⚡</span>
                <span>Faster-Whisper (Local)</span>
              </button>
              <button
                type="button"
                className={`engine-pill ${selectedEngine === 'sarvam' ? '' : 'alt'}`}
                onClick={() => setSelectedEngine('sarvam')}
              >
                <span>🔊</span>
                <span>Sarvam AI (Hinglish)</span>
              </button>
            </div>

            <div className="arch-spec-box">
              <span className="arch-spec-name">
                {selectedEngine === 'whisper' ? 'CTranslate2 INT8 Engine' : 'Sarvam Saaras Dialect Engine'}
              </span>
              <span className="arch-spec-badge">
                {selectedEngine === 'whisper' ? 'Zero Cloud Latency' : 'Sub-500ms Streaming'}
              </span>
            </div>
          </div>

          {/* Card 2: Cost & Latency Optimization */}
          <div className="arch-card">
            <div className="arch-card-top">
              <div className="arch-icon-pill">⚡</div>
              <span className="arch-chip-badge" style={{ background: '#DCFCE7', color: '#15803D' }}>
                0 Ingestion Tokens
              </span>
            </div>

            <div className="arch-card-category">COST & LATENCY OPTIMIZATION</div>
            <h3 className="arch-card-title">Zero-LLM Cost Ingestion</h3>
            <p className="arch-card-body">
              Traditional maintenance bots burn expensive LLM tokens summarizing hours of raw transcripts. Kirova AI ingests and indexes directly into embedded PostgreSQL vectors with zero token burn.
            </p>

            <div style={{ margin: 'auto 0 20px', background: 'var(--background-card-warm)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Deterministic Extraction Fallback</span>
                <span style={{ color: '#15803D', fontWeight: 700 }}>100% Guaranteed Uptime</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', background: 'var(--accent-mint)' }} />
              </div>
            </div>

            <div className="arch-spec-box">
              <span className="arch-spec-name">PGlite Embedded Storage</span>
              <span className="arch-spec-badge">Append-Only Audit</span>
            </div>
          </div>
        </div>

        {/* Small Architecture Flow Diagram */}
        <div className="arch-diagram-card">
          <div className="arch-diagram-title">END-TO-END VERIFIED PIPELINE</div>
          <div className="arch-pipeline-flow">
            <div className="pipeline-node">
              <div className="pipeline-node-icon">🎙️</div>
              <div className="pipeline-node-label">OPERATOR INPUT</div>
              <div className="pipeline-node-sub">Voice or Text</div>
            </div>

            <div className="pipeline-arrow">→</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">🧠</div>
              <div className="pipeline-node-label">INTENT & CONTEXT</div>
              <div className="pipeline-node-sub">Sarvam / Whisper</div>
            </div>

            <div className="pipeline-arrow">→</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">🔍</div>
              <div className="pipeline-node-label">VALIDATION GATE</div>
              <div className="pipeline-node-sub">Evidence Grounding</div>
            </div>

            <div className="pipeline-arrow">→</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">✅</div>
              <div className="pipeline-node-label">SUPERVISOR SIGN-OFF</div>
              <div className="pipeline-node-sub">Approval Gate</div>
            </div>

            <div className="pipeline-arrow">→</div>

            <div className="pipeline-node">
              <div className="pipeline-node-icon">📦</div>
              <div className="pipeline-node-label">WORK ORDER FSM</div>
              <div className="pipeline-node-sub">Assigned to Tech</div>
            </div>

            <div className="pipeline-arrow">→</div>

            <div className="pipeline-node" style={{ borderColor: 'var(--accent-mint)' }}>
              <div className="pipeline-node-icon">🔒</div>
              <div className="pipeline-node-label">IMMUTABLE LOG</div>
              <div className="pipeline-node-sub">PostgreSQL Trigger</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

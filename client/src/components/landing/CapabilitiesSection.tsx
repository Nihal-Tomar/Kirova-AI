import React from 'react';

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: '🎙️',
      title: 'Voice-First Industrial Reporting',
      desc: 'Record equipment failures in colloquial Hindi, Hinglish, Tamil, Telugu, or English. Designed specifically for noisy factory environments.',
      tech: 'SARVAM SAARAS + LOCAL WHISPER',
    },
    {
      icon: '🎯',
      title: 'Anti-Hallucination Guardrails',
      desc: 'Strict evidence tagging: every extracted symptom and part is tagged as EXTRACTED, RETRIEVED, or INFERRED with zero fabrication.',
      tech: 'GROUNDED EXTRACTION PIPELINE',
    },
    {
      icon: '🔒',
      title: 'Supervisor Approval Gating',
      desc: 'Work orders cannot be assigned to technicians until an authorized supervisor reviews, approves, and validates the incident.',
      tech: 'RBAC ENFORCED PROTOCOL',
    },
    {
      icon: '📊',
      title: 'Recurring-Fault Intelligence',
      desc: 'Automatically clusters repeat machine breakdowns by symptom and subsystem to identify systemic root causes before catastrophic downtime.',
      tech: 'CLUSTER MATCHING ENGINE',
    },
    {
      icon: '⚙️',
      title: 'Deterministic Work Order FSM',
      desc: 'Rigid state machine prevents illegal status transitions. Tracks time to acknowledge, assign, repair, and verify closure.',
      tech: 'FINITE STATE MACHINE',
    },
    {
      icon: '🛡️',
      title: 'Immutable PostgreSQL Audit Trail',
      desc: 'Every approval, assignment, edit, and status change is recorded append-only with database triggers forbidding UPDATE or DELETE.',
      tech: 'PGLITE PERSISTENCE WITH SQL TRIGGERS',
    },
  ];

  return (
    <section id="capabilities" className="capabilities-section">
      <div className="landing-container">
        <div className="capabilities-header">
          <div className="capabilities-eyebrow">
            <span>WHAT POWERS KIROVA AI</span>
          </div>

          <h2 className="capabilities-heading">
            Built for work that <br />
            <em className="serif-italic" style={{ fontStyle: 'italic' }}>matters.</em>
          </h2>
        </div>

        <div className="capabilities-grid">
          {capabilities.map((cap, i) => (
            <div key={i} className="cap-card">
              <div className="cap-icon-box">{cap.icon}</div>
              <div className="cap-title">{cap.title}</div>
              <div className="cap-desc">{cap.desc}</div>
              <div className="cap-badge-row">
                <span style={{ color: 'var(--accent-purple)' }}>•</span>
                <span>{cap.tech}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';

export const CapabilitiesSection: React.FC = () => {
  const capabilities = [
    {
      icon: '🕸️',
      title: 'Source-Linked Evidence Graph',
      desc: 'Trace relationships from asset to component, symptom, past work orders, and recorded outcomes—every finding cites original records.',
      tech: 'DETERMINISTIC GRAPH PROVENANCE',
    },
    {
      icon: '⚖️',
      title: 'Explainable Repair vs Replace',
      desc: 'Compare inspection, component repair, part replacement, and machine replacement with explicit downtime, cost, and historical evidence.',
      tech: '4-WAY DECISION SUPPORT ENGINE',
    },
    {
      icon: '🔒',
      title: 'Case-Level RBAC & Assignment Gate',
      desc: 'Supervisors review and assign cases. Technicians gain case history only after official assignment—no URL or API bypass.',
      tech: 'STRICT CASE-LEVEL ACCESS CONTROL',
    },
    {
      icon: '🎯',
      title: 'Anti-Hallucination & Explicit Uncertainty',
      desc: 'Never guesses machine IDs or past fixes. If records are ambiguous or missing, the system highlights unknowns rather than fabricating data.',
      tech: 'GROUNDED VERIFICATION PIPELINE',
    },
    {
      icon: '📊',
      title: 'Recurring-Fault Pattern Analysis',
      desc: 'Clusters repeat breakdowns across similar equipment classes to uncover recurring failure modes before catastrophic plant outages.',
      tech: 'EQUIPMENT CLUSTERING ENGINE',
    },
    {
      icon: '🛡️',
      title: 'Immutable Outcome Feedback Loop',
      desc: 'Every supervisor verification writes to an append-only audit trail and enriches the historical evidence base for future maintenance decisions.',
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

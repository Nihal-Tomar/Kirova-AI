import React from 'react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'UNDERSTAND THE FAULT',
      desc: 'Capture structured worker voice or text reports and connect them deterministically to the correct asset without hallucinating IDs.',
      detail: 'Ambient noise filter · Ambiguity detection',
    },
    {
      num: '02',
      title: 'FIND THE HISTORY',
      desc: 'Retrieve verified maintenance records, previous failure frequency, past repair actions, and parts replaced on that exact equipment.',
      detail: 'Grounded retrieval · Source record linkage',
    },
    {
      num: '03',
      title: 'COMPARE THE OPTIONS',
      desc: 'Evaluate diagnostic inspection, component repair, component replacement, and machine replacement using explainable evidence and explicit assumptions.',
      detail: '4-way decision support · No black-box scores',
    },
    {
      num: '04',
      title: 'VERIFY THE OUTCOME',
      desc: 'Supervisor approves assignment, technician records actual findings and parts, and verified closure feeds into future intelligence.',
      detail: 'Case-level access · Append-only audit trail',
    },
  ];

  return (
    <section className="workflow-section">
      <div className="landing-container">
        <div className="workflow-header">
          <div className="workflow-eyebrow">
            <span>FROM FAULT REPORT TO EVIDENCE-BACKED DECISION</span>
          </div>

          <h2 className="workflow-heading">
            Every decision backed by <br />
            <em className="serif-italic" style={{ fontStyle: 'italic' }}>traceable evidence.</em>
          </h2>

          <p className="hero-subtext" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Most maintenance workflows start with a reported fault. Kirova connects that fault with historical maintenance records, helps compare repair options, and captures the actual outcome so the next decision can be better informed.
          </p>
        </div>

        <div className="workflow-grid">
          {steps.map(step => (
            <div key={step.num} className="workflow-card">
              <div className="workflow-step-num">{step.num}</div>
              <div className="workflow-step-title">{step.title}</div>
              <div className="workflow-step-desc">{step.desc}</div>
              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', fontSize: '0.71875rem', fontWeight: 600, color: 'var(--foreground-subtle)' }}>
                ⚡ {step.detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

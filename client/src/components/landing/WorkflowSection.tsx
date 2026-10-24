import React from 'react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'CAPTURE',
      desc: 'Enter an operational incident or machine fault using native voice or text across Hindi, Hinglish, Tamil, Telugu, or English.',
      detail: 'Ambient noise filter · 16kHz audio streaming',
    },
    {
      num: '02',
      title: 'UNDERSTAND',
      desc: 'Interpret the equipment context, symptoms, severity, and parts required with grounded evidence and zero hallucination.',
      detail: 'Machine registry lookup · Ambiguity detection',
    },
    {
      num: '03',
      title: 'VALIDATE',
      desc: 'Supervisors review the proposed action and required information. Incomplete or ambiguous reports trigger clarification before assignment.',
      detail: 'Supervisor sign-off gate · Evidence tagging',
    },
    {
      num: '04',
      title: 'COMPLETE',
      desc: 'Technicians execute the maintenance repair, update work order status, and close the loop into an append-only, tamper-proof audit trail.',
      detail: 'FSM transitions · PostgreSQL triggers',
    },
  ];

  return (
    <section className="workflow-section">
      <div className="landing-container">
        <div className="workflow-header">
          <div className="workflow-eyebrow">
            <span>HOW IT WORKS</span>
          </div>

          <h2 className="workflow-heading">
            From a simple request to a <br />
            <em className="serif-italic" style={{ fontStyle: 'italic' }}>structured result.</em>
          </h2>

          <p className="hero-subtext" style={{ margin: '0 auto', maxWidth: '640px' }}>
            Four deterministic, human-in-the-loop phases ensure shop-floor reports transform into accountable, verified actions.
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

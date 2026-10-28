import React, { useState } from 'react';

const STEPS = [
  {
    roman: 'I',
    title: 'Capture & Structure Without Hallucination',
    desc: 'Worker reports via voice or text in Hindi, Hinglish, Tamil, Telugu, or English. Kirova extracts known entities (asset tag, component, symptom) and explicitly flags missing diagnostic fields—it never guesses or fabricates machine IDs.',
    tags: ['Sarvam AI STT', 'Deterministic Entity Resolution', 'Missing Field Detection'],
    payload: `// Stage I · Evidence Extraction
{
  "asset_id": "MCH-005",
  "asset_name": "50-Ton Hydraulic Press",
  "component": "Cylinder Seal Assembly",
  "symptom": "Pressure drop + visible oil leak",
  "language_detected": "Hinglish",
  "confidence": 0.94,
  "missing_fields": [
    "current_pressure_reading",
    "leak_volume_estimate"
  ],
  "epistemic_label": "OBSERVED_FACT",
  "source": "Voice Report · Amit Verma · 09:14 AM"
}`,
  },
  {
    roman: 'II',
    title: 'Normalize & Query the Evidence Graph',
    desc: 'Retrieves comparable historical incidents on the same machine and component class from PGlite. Separates verified fixes from failed temporary patches and flags any contradictions between log records.',
    tags: ['PGlite Embedded Graph', 'Historical Incident Matching', 'Contradiction Detection'],
    payload: `// Stage II · Evidence Graph Query
{
  "query_asset": "MCH-005",
  "query_component": "Cylinder Seal",
  "retrieved_incidents": [
    {
      "id": "INC-2026-0002",
      "action": "Valve fitting tightened",
      "outcome": "FAILED",
      "days_to_recurrence": 9
    },
    {
      "id": "INC-2026-0005",
      "action": "Primary piston seal replaced",
      "outcome": "VERIFIED",
      "days_trouble_free": 143
    },
    {
      "id": "LOG-2025-089",
      "action": "Shift note only",
      "outcome": "UNVERIFIED",
      "conflict_flag": true
    }
  ],
  "epistemic_separation": "HISTORICAL_EVIDENCE"
}`,
  },
  {
    roman: 'III',
    title: 'Compare 4 Actions & Route for Approval',
    desc: 'Technicians and Supervisors review the 4-way trade-off matrix with full source provenance. The system surfaces which action is defensible today—and explicitly states the conditions that would change its recommendation.',
    tags: ['4-Way Decision Engine', 'Source Provenance', 'Supervisor Approval Gate'],
    payload: `// Stage III · 4-Way Decision Matrix
{
  "recommended_option": "REPLACE_COMPONENT",
  "recommendation_basis": "INC-2026-0005",
  "options": {
    "INSPECT":           { "score": 35, "feasibility": "LOW"    },
    "REPAIR":            { "score": 55, "feasibility": "MEDIUM" },
    "REPLACE_COMPONENT": { "score": 91, "feasibility": "HIGH",
                           "backed_by": "INC-2026-0005"         },
    "REPLACE_MACHINE":   { "score": 18, "feasibility": "LOW"    }
  },
  "uncertainty_flags": ["Pressure reading not reported"],
  "advisory_disclaimer": "Decision support only. Requires supervisor authorization.",
  "epistemic_label": "INFERENCE"
}`,
  },
  {
    roman: 'IV',
    title: 'Verify Outcome & Enrich Reusable Knowledge',
    desc: 'Post-repair verification by both technician and supervisor updates the append-only PGlite audit ledger. Only supervisor-verified outcomes upgrade historical confidence in the Evidence Graph for future decisions.',
    tags: ['Immutable Audit Trail', 'Closed-Loop Verification', 'PGlite SQL Trigger'],
    payload: `// Stage IV · Verified Outcome Record
{
  "incident_id": "INC-2026-0005",
  "work_order": "WO-2026-0009",
  "technician": "Rajesh Kumar",
  "supervisor": "Priya Sharma",
  "action_taken": "Replaced primary piston seal kit",
  "parts_used": ["PT-HC-606"],
  "post_repair_check": "Pressure restored to 85 bar",
  "outcome_status": "VERIFIED_CLOSED",
  "audit_timestamp": "2026-10-28T09:02:36Z",
  "audit_type": "APPEND_ONLY",
  "epistemic_label": "VERIFIED_OUTCOME",
  "enriches_evidence_graph": true
}`,
  },
];

export const WorkflowSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const step = STEPS[activeStep];

  return (
    <section id="workflow" style={{ background:'#F8F7F4', borderTop:'1px solid rgba(0,0,0,0.07)', scrollMarginTop:'112px' }}>
      {/* Section header */}
      <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'76px 24px 0', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
          <span style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>E / Four-Step Evidence Pipeline</span>
        </div>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'24px', paddingBottom:'44px', flexWrap:'wrap' }}>
          <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.2rem,4vw,3.4rem)', fontWeight:400, color:'#0F172A', margin:0, lineHeight:1.1 }}>
            Four steps.<br /><em>Infinite defensibility.</em>
          </h2>
          <p style={{ fontSize:'1.05rem', color:'#4B5563', maxWidth:'480px', margin:0, lineHeight:1.65 }}>
            Every maintenance decision is traceable to an original record, a verified outcome, or an explicit acknowledgment of diagnostic uncertainty.
          </p>
        </div>
      </div>

      {/* Split screen */}
      <div style={{ maxWidth:'1180px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', minHeight:'540px' }} className="workflow-split-grid">
        {/* Left: Step selector */}
        <div style={{ borderRight:'1px solid rgba(0,0,0,0.07)', padding:'0' }}>
          {STEPS.map((s, i) => (
            <button key={i} type="button" onClick={()=>setActiveStep(i)}
              style={{ width:'100%', textAlign:'left', padding:'30px 36px', border:'none', borderBottom:'1px solid rgba(0,0,0,0.06)', background: i===activeStep ? '#FFFFFF' : 'transparent', cursor:'pointer', transition:'all 0.2s', borderLeft: i===activeStep ? '4px solid #0F172A' : '4px solid transparent', display:'flex', alignItems:'flex-start', gap:'22px' }}>
              <span style={{ fontFamily:"'Instrument Serif',Georgia,serif", fontSize:'2.2rem', fontWeight:400, color: i===activeStep ? '#0F172A' : 'rgba(0,0,0,0.22)', lineHeight:1, flexShrink:0, minWidth:'32px' }}>{s.roman}</span>
              <div>
                <div style={{ fontSize:'1.05rem', fontWeight: i===activeStep ? 700 : 600, color: i===activeStep ? '#0F172A' : '#4B5563', marginBottom:'6px', lineHeight:1.35 }}>{s.title}</div>
                {i===activeStep && <div style={{ fontSize:'0.95rem', color:'#4B5563', lineHeight:1.6 }}>{s.desc}</div>}
                {i===activeStep && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'7px', marginTop:'14px' }}>
                    {s.tags.map(t=>(
                      <span key={t} style={{ fontFamily:'monospace', fontSize:'11px', color:'#1D4ED8', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.22)', borderRadius:'5px', padding:'3px 9px', letterSpacing:'0.04em', fontWeight:600 }}>{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Right: Code inspector */}
        <div style={{ background:'#0D1117', display:'flex', flexDirection:'column' }}>
          {/* Inspector header */}
          <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'2px', fontWeight:600 }}>evidence-pipeline.ts · Stage {step.roman}</div>
              <div style={{ fontSize:'13.5px', color:'rgba(255,255,255,0.85)', fontWeight:600 }}>{step.title}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'9999px', padding:'5px 12px' }}>
              <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out' }} />
              <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#34D399', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>Deterministic Fallback + PGlite Ready</span>
            </div>
          </div>

          {/* Code block */}
          <div style={{ flex:1, padding:'26px 24px', overflowY:'auto' }}>
            <pre style={{ margin:0, fontFamily:"'JetBrains Mono','Fira Code',monospace", fontSize:'12.5px', lineHeight:1.75, color:'rgba(255,255,255,0.8)', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
              {step.payload.split('\n').map((line, i) => {
                const isComment = line.trim().startsWith('//');
                const isKey = /^\s+"\w/.test(line);
                const isStr = /"[^"]*":\s*"/.test(line);
                return (
                  <span key={i} style={{ display:'block', color: isComment ? '#6EE7B7' : isStr ? '#93C5FD' : isKey ? '#FCD34D' : 'rgba(255,255,255,0.7)' }}>
                    {line}
                  </span>
                );
              })}
            </pre>
          </div>

          {/* Step nav */}
          <div style={{ padding:'16px 24px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <button type="button" onClick={()=>setActiveStep(Math.max(0,activeStep-1))} disabled={activeStep===0}
              style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', borderRadius:'8px', padding:'7px 16px', fontSize:'12.5px', cursor: activeStep===0 ? 'not-allowed':'pointer', opacity: activeStep===0 ? 0.35:1, fontWeight:600 }}>
              ← Previous Stage
            </button>
            <div style={{ display:'flex', gap:'6px' }}>
              {STEPS.map((_,i)=>(
                <div key={i} style={{ width: i===activeStep ? '20px':'7px', height:'7px', borderRadius:'9999px', background: i===activeStep ? '#60A5FA':'rgba(255,255,255,0.2)', transition:'all 0.3s', cursor:'pointer' }} onClick={()=>setActiveStep(i)} />
              ))}
            </div>
            <button type="button" onClick={()=>setActiveStep(Math.min(STEPS.length-1,activeStep+1))} disabled={activeStep===STEPS.length-1}
              style={{ background:'none', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.7)', borderRadius:'8px', padding:'7px 16px', fontSize:'12.5px', cursor: activeStep===STEPS.length-1 ? 'not-allowed':'pointer', opacity: activeStep===STEPS.length-1 ? 0.35:1, fontWeight:600 }}>
              Next Stage →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kpulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.28)}}
        @media(max-width:760px){.workflow-split-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  );
};

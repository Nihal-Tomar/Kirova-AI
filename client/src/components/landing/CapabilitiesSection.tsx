import React, { useState } from 'react';

const CAPABILITIES = [
  {
    num: '01',
    title: 'Multilingual Voice & Messy Record Ingestion',
    desc: 'Ingest worker fault reports in Hindi, Hinglish, Tamil, Telugu, or English. Normalizes messy free-text into structured diagnostic fields—and always explicitly flags missing information rather than guessing.',
    micro: 'voice',
  },
  {
    num: '02',
    title: 'Epistemic Separation & Contradiction Detection',
    desc: 'Kirova AI never confuses an operator observation with an AI inference or a verified outcome. Five epistemic layers keep every claim categorized and conflicting records highlighted.',
    micro: 'epistemic',
  },
  {
    num: '03',
    title: 'Interactive Four-Way Decision Support',
    desc: 'Maintenance options evaluated side-by-side: Inspect Further, Repair Component, Replace Component, and Replace Machine—each backed by traceable evidence, not opaque scores.',
    micro: 'decision',
  },
  {
    num: '04',
    title: 'Closed-Loop Outcome Verification',
    desc: '"Work Marked Complete" is NOT "Outcome Verified." Only post-repair supervisor validation enriches the historical Evidence Graph to prevent future repeat guesswork.',
    micro: 'outcome',
  },
];

const LANGS = ['Hinglish', 'Hindi', 'Tamil', 'English', 'Telugu'];

function VoiceMicro() {
  const [lang, setLang] = useState('Hinglish');
  const transcripts: Record<string, { raw: string; fields: string[][] }> = {
    Hinglish: { raw: '"MCH-005 ka pressure drop ho raha hai, oil leak dikh raha hai cylinder seal se"', fields: [['Asset','MCH-005 · 50-Ton Hydraulic Press'],['Component','Cylinder Seal Assembly'],['Symptom','Pressure Drop + Oil Leak'],['Missing Info','Current pressure gauge reading']] },
    Hindi:    { raw: '"मशीन चार में से पट्टे में समस्या हो रही है और फिसलन हो रही है"', fields: [['Asset','MCH-004 · Main Conveyor Belt 4'],['Component','Drive Belt Tensioner'],['Symptom','Intermittent Stoppage & Slippage'],['Missing Info','Belt tension sensor measurement']] },
    Tamil:    { raw: '"MCH-002 Y-axis jam aayirukirathu, movement illai"', fields: [['Asset','MCH-002 · CNC Vertical Milling 2'],['Component','Y-Axis Ball Screw Assembly'],['Symptom','Mechanical Jam · Motion Halted'],['Missing Info','Last lubrication service log']] },
    English:  { raw: '"High pressure compressor 2 overheating past 95°C under continuous line load"', fields: [['Asset','MCH-006 · Air Compressor 2'],['Component','Heat Exchanger & Oil Separator'],['Symptom','Overheating > 95°C'],['Missing Info','Oil separator last replacement date']] },
    Telugu:   { raw: '"Machine lo vibration ekkuva ga undi, bearing sound vastundi"', fields: [['Asset','MCH-003 · Precision Lathe CNC'],['Component','Spindle Bearing Assembly'],['Symptom','Abnormal Vibration & High-Pitch Sound'],['Missing Info','Spindle RPM at fault onset']] },
  };
  const t = transcripts[lang];

  return (
    <div>
      <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'14px' }}>
        {LANGS.map(l => (
          <button key={l} type="button" onClick={()=>setLang(l)}
            style={{ fontSize:'12px', fontWeight:600, padding:'6px 13px', borderRadius:'9999px', border:`1.5px solid ${l===lang ? '#2563EB' : 'rgba(0,0,0,0.12)'}`, background: l===lang ? 'rgba(37,99,235,0.08)' : 'transparent', color: l===lang ? '#1D4ED8' : '#6B7280', cursor:'pointer', transition:'all 0.18s' }}>
            {l}
          </button>
        ))}
      </div>
      <div style={{ background:'rgba(0,0,0,0.035)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'10px', padding:'12px 14px', fontSize:'13.5px', color:'#374151', fontStyle:'italic', lineHeight:1.6, marginBottom:'12px' }}>
        {t.raw}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:'7px' }}>
        {t.fields.map(([k,v]) => (
          <div key={k} style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
            <span style={{ fontFamily:'monospace', fontSize:'11px', fontWeight:700, color: k==='Missing Info' ? '#D97706' : '#2563EB', background: k==='Missing Info' ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.08)', border:`1px solid ${k==='Missing Info' ? 'rgba(245,158,11,0.3)' : 'rgba(37,99,235,0.25)'}`, borderRadius:'5px', padding:'2.5px 8px', flexShrink:0, marginTop:'1px', letterSpacing:'0.04em', textTransform:'uppercase' }}>{k}</span>
            <span style={{ fontSize:'13px', color:'#1F2937', fontWeight:500 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const EPIS_BADGES = [
  { label:'OBSERVED FACT', color:'#2563EB', bg:'rgba(37,99,235,0.09)', border:'rgba(37,99,235,0.28)', desc:'Direct operator spoken statement or sensor stream · Pressure drop noted' },
  { label:'HISTORICAL EVIDENCE', color:'#059669', bg:'rgba(5,150,105,0.09)', border:'rgba(5,150,105,0.28)', desc:'Past work order WO-2026-0004 · Seal replacement verified by Priya Sharma' },
  { label:'INFERENCE', color:'#7C3AED', bg:'rgba(124,58,237,0.09)', border:'rgba(124,58,237,0.28)', desc:'Suspected cylinder seal lip degradation · AI hypothesis, not yet verified' },
  { label:'CONTRADICTION', color:'#EA580C', bg:'rgba(234,88,12,0.09)', border:'rgba(234,88,12,0.28)', desc:'Shift log claims valve cleared, but pressure drop recurred 48h later' },
  { label:'VERIFIED OUTCOME', color:'#10B981', bg:'rgba(16,185,129,0.09)', border:'rgba(16,185,129,0.28)', desc:'Post-repair 72-hour pressure check held steady at 85 bar · Audit locked' },
];

function EpistemicMicro() {
  const [active, setActive] = useState(0);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {EPIS_BADGES.map((b,i) => (
        <button key={b.label} type="button" onClick={()=>setActive(i)}
          style={{ textAlign:'left', border:`1.5px solid ${i===active ? b.border : 'rgba(0,0,0,0.07)'}`, background: i===active ? b.bg : 'transparent', borderRadius:'9px', padding:'10px 14px', cursor:'pointer', transition:'all 0.18s' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom: i===active ? '4px' : 0 }}>
            <span style={{ fontFamily:'monospace', fontSize:'11.5px', fontWeight:700, color:b.color, letterSpacing:'0.06em' }}>{b.label}</span>
          </div>
          {i===active && <div style={{ fontSize:'13px', color:'#4B5563', lineHeight:1.55 }}>{b.desc}</div>}
        </button>
      ))}
    </div>
  );
}

const DECISION_OPTIONS = [
  { label:'Inspect Further', score:35, color:'#6B7280', when:'Evidence is weak, missing diagnostic telemetry, or contradicted', isRec:false },
  { label:'Repair Component', score:55, color:'#D97706', when:'Minor seal fitting patch; temporary fix history showed rapid recurrence', isRec:false },
  { label:'Replace Component', score:91, color:'#059669', when:'Pattern of recurring wear on primary seal; backed by INC-2026-0005', isRec:true },
  { label:'Replace Machine', score:18, color:'#DC2626', when:'Asset lifetime integrity intact; full replacement economically unviable', isRec:false },
];

function DecisionMicro() {
  const [sel, setSel] = useState(2);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
      {DECISION_OPTIONS.map((o,i) => (
        <button key={o.label} type="button" onClick={()=>setSel(i)}
          style={{ textAlign:'left', border:`1.5px solid ${i===sel ? o.color+'60' : 'rgba(0,0,0,0.08)'}`, background: i===sel ? `${o.color}0d` : 'transparent', borderRadius:'10px', padding:'11px 14px', cursor:'pointer', transition:'all 0.18s', display:'flex', alignItems:'center', gap:'12px' }}>
          <div style={{ width:'40px', height:'34px', background:`${o.color}18`, border:`1.5px solid ${o.color}50`, borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'monospace', fontSize:'13.5px', fontWeight:700, color:o.color, flexShrink:0 }}>{o.score}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'14px', fontWeight: i===sel ? 700 : 600, color: i===sel ? '#0F172A' : '#4B5563', marginBottom: i===sel ? '3px':0 }}>
              {o.label} {o.isRec && <span style={{ fontSize:'11px', color:'#059669', fontFamily:'monospace', fontWeight:700, marginLeft:'6px' }}>← Recommended</span>}
            </div>
            {i===sel && <div style={{ fontSize:'12.5px', color:'#6B7280', lineHeight:1.45 }}>Condition: {o.when}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

function OutcomeMicro() {
  const [verified, setVerified] = useState(false);
  return (
    <div>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'14px' }}>
        <div style={{ background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'10px', padding:'12px 16px' }}>
          <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#B45309', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'4px', fontWeight:700 }}>Stage 1 · Work Marked Complete</div>
          <div style={{ fontSize:'13.5px', color:'#1F2937', fontWeight:500 }}>Rajesh Kumar · "Seal replaced, system running" · WO-2026-0009</div>
          <div style={{ fontSize:'12px', color:'#B45309', marginTop:'4px', fontWeight:500 }}>⚠ Evidence Graph NOT yet enriched — waiting on supervisory audit</div>
        </div>
        <div style={{ textAlign:'center', fontSize:'14px', color:'rgba(0,0,0,0.3)', fontFamily:'monospace', fontWeight:700 }}>≠</div>
        <div style={{ background: verified ? 'rgba(16,185,129,0.09)' : 'rgba(0,0,0,0.03)', border:`1.5px solid ${verified ? 'rgba(16,185,129,0.35)' : 'rgba(0,0,0,0.08)'}`, borderRadius:'10px', padding:'12px 16px', transition:'all 0.3s' }}>
          <div style={{ fontFamily:'monospace', fontSize:'11px', color: verified ? '#059669' : '#9CA3AF', letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'4px', fontWeight:700 }}>Stage 2 · Outcome Verified & Stamped</div>
          <div style={{ fontSize:'13.5px', color: verified ? '#0F172A' : '#9CA3AF', fontWeight:500 }}>{verified ? 'Priya Sharma · 72h post-repair hold test · Pressure locked at 85 bar' : 'Awaiting supervisor validation…'}</div>
          {verified && <div style={{ fontSize:'12px', color:'#059669', marginTop:'4px', fontWeight:600 }}>✓ Evidence Graph enriched · Append-only PGlite ledger updated</div>}
        </div>
      </div>
      <button type="button" onClick={()=>setVerified(!verified)}
        style={{ width:'100%', padding:'12px 16px', borderRadius:'10px', border:`1.5px solid ${verified ? 'rgba(16,185,129,0.35)' : 'rgba(0,0,0,0.1)'}`, background: verified ? 'rgba(16,185,129,0.1)' : '#0F172A', color: verified ? '#059669' : '#FFFFFF', fontWeight:700, fontSize:'13.5px', cursor:'pointer', transition:'all 0.2s' }}>
        {verified ? '↩ Reset Demonstration' : '✓ Supervisor Verify & Close Work Order'}
      </button>
    </div>
  );
}

const MICRO: Record<string, React.ReactNode> = {
  voice: <VoiceMicro />,
  epistemic: <EpistemicMicro />,
  decision: <DecisionMicro />,
  outcome: <OutcomeMicro />,
};

export const CapabilitiesSection: React.FC = () => (
  <section id="capabilities" style={{ background:'#F8F7F4', borderTop:'1px solid rgba(0,0,0,0.07)', scrollMarginTop:'112px' }}>
    {/* Header */}
    <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'76px 24px 48px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'14px' }}>
        <span style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>C / Capabilities · 01 — 04</span>
      </div>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:'24px', flexWrap:'wrap' }}>
        <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.4rem,4.5vw,3.6rem)', fontWeight:400, color:'#0F172A', margin:0, lineHeight:1.1 }}>
          Everything needed to<br /><em>defend a decision.</em>
        </h2>
        <p style={{ fontSize:'1.05rem', color:'#4B5563', maxWidth:'480px', margin:0, lineHeight:1.65 }}>
          Each capability below is an interactive micro-UI demonstrating the underlying seed architecture (PGlite + Sarvam AI + 4-Way Decision Engine).
        </p>
      </div>
    </div>

    {/* 2x2 Bento Grid */}
    <div style={{ maxWidth:'1180px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', borderBottom:'1px solid rgba(0,0,0,0.07)' }} className="cap-bento-grid">
      {CAPABILITIES.map((cap, i) => (
        <div key={cap.num} style={{ padding:'48px 42px', borderRight: i%2===0 ? '1px solid rgba(0,0,0,0.07)' : 'none', borderBottom: i<2 ? '1px solid rgba(0,0,0,0.07)' : 'none', background: i===1 ? '#FFFFFF' : 'transparent', position:'relative' }}>
          {/* Crosshair */}
          {i===0 && <span style={{ position:'absolute', top:'12px', left:'12px', fontFamily:'monospace', fontSize:'12px', color:'rgba(0,0,0,0.18)', lineHeight:1 }}>+</span>}

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'16px', gap:'10px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'3.4rem', fontWeight:400, color:'rgba(0,0,0,0.1)', lineHeight:1 }}>{cap.num}</span>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'6px', padding:'4px 10px', letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:600, flexShrink:0, marginTop:'4px' }}>INTERACTIVE DEMO</span>
          </div>

          <h3 style={{ fontSize:'1.25rem', fontWeight:700, color:'#0F172A', margin:'0 0 10px', lineHeight:1.35 }}>{cap.title}</h3>
          <p style={{ fontSize:'0.95rem', color:'#4B5563', lineHeight:1.65, margin:'0 0 24px' }}>{cap.desc}</p>

          {/* Micro-UI */}
          <div style={{ background:'rgba(0,0,0,0.025)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'14px', padding:'20px' }}>
            {MICRO[cap.micro]}
          </div>
        </div>
      ))}
    </div>
  </section>
);

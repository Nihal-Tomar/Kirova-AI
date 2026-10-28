import React from 'react';

const PROBLEM_STEPS = [
  { icon:'💬', label:'Verbal Report', desc:'Worker reports "weird noise / oil leak" verbally to the nearest technician without asset reference' },
  { icon:'📋', label:'Scattered Spreadsheet', desc:'Technician searches a fragmented Excel file with no verified machine history or prior repair status' },
  { icon:'🔧', label:'Repeated Patch', desc:'Applies the same temporary fix that already failed last month—no one has record that it failed' },
  { icon:'✅', label:'False "Closed"', desc:'Supervisor approves expensive replacement without historical proof · ticket marked closed with zero outcome verification' },
];

export const ProblemPivotSection: React.FC = () => (
  <section id="problem" style={{ background:'#FFFFFF', borderTop:'1px solid rgba(0,0,0,0.07)', scrollMarginTop:'112px' }}>
    <div style={{ maxWidth:'1180px', margin:'0 auto' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr' }} className="problem-pivot-grid">

        {/* Left: The Fragmented Reality */}
        <div style={{ padding:'72px 52px 72px 32px', borderRight:'1px solid rgba(0,0,0,0.07)' }}>
          <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px', fontWeight:600 }}>00 / The Fragmented Reality</div>
          <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(1.9rem,3.2vw,2.75rem)', fontWeight:400, color:'#0F172A', margin:'0 0 16px', lineHeight:1.15 }}>
            Why traditional maintenance<br />repeats failed fixes.
          </h2>
          <p style={{ fontSize:'1.05rem', color:'#4B5563', lineHeight:1.7, margin:'0 0 36px' }}>
            Without a shared, verified evidence base, maintenance teams are condemned to rediscover the same failures—wasting technician hours, inflating spare part costs, and losing plant uptime.
          </p>

          <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
            {PROBLEM_STEPS.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'18px', alignItems:'flex-start', position:'relative', paddingBottom: i < PROBLEM_STEPS.length-1 ? '28px' : 0 }}>
                {/* Connector line */}
                {i < PROBLEM_STEPS.length-1 && (
                  <div style={{ position:'absolute', left:'21px', top:'44px', bottom:0, width:'1.5px', background:'rgba(239,68,68,0.22)' }} />
                )}
                <div style={{ width:'44px', height:'44px', background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0, zIndex:1 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'3px' }}>{s.label}</div>
                  <div style={{ fontSize:'13.5px', color:'#4B5563', lineHeight:1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop:'32px', background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'12px', padding:'16px 18px' }}>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#DC2626', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px', fontWeight:700 }}>The Real-World Result</div>
            <div style={{ fontSize:'13.5px', color:'#374151', lineHeight:1.6 }}>Chronic recurring breakdowns, bloated inventory budgets, and zero defensible proof of whether past actions were effective.</div>
          </div>
        </div>

        {/* Right: The Kirova Evidence Pivot */}
        <div style={{ padding:'72px 32px 72px 52px' }}>
          <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'16px', fontWeight:600 }}>01 / The Kirova Evidence Pivot</div>
          <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(1.9rem,3.2vw,2.75rem)', fontWeight:400, color:'#0F172A', margin:'0 0 16px', lineHeight:1.15 }}>
            An intelligence layer<br />alongside your existing CMMS.
          </h2>
          <p style={{ fontSize:'1.05rem', color:'#4B5563', lineHeight:1.7, margin:'0 0 28px' }}>
            Conventional CMMS platforms (like UpKeep, Fiix, and IBM Maximo) track work orders and parts inventory. <strong style={{ color:'#0F172A' }}>Kirova AI works alongside them</strong> as a vendor-neutral Maintenance Evidence Engine—answering:
          </p>

          {[
            { q:'What do we actually know?', a:'Rigorous epistemic separation: direct worker observations vs. AI inferences vs. verified outcomes.' },
            { q:'Which past repairs genuinely worked?', a:'Evidence Graph correlates past work orders with verified operational longevity—not just "ticket closed".' },
            { q:'Where do records conflict?', a:'Contradiction detection flags incomplete, missing, or contradicted shift log entries before ordering parts.' },
            { q:'Which action is defensible today?', a:'Explainable 4-Way Decision Support comparing Inspect, Repair, Replace Part, or Replace Machine.' },
          ].map(item => (
            <div key={item.q} style={{ display:'flex', gap:'14px', alignItems:'flex-start', padding:'14px 0', borderBottom:'1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', marginTop:'7px', flexShrink:0, boxShadow:'0 0 6px rgba(16,185,129,0.4)' }} />
              <div>
                <div style={{ fontSize:'15px', fontWeight:700, color:'#0F172A', marginBottom:'3px' }}>{item.q}</div>
                <div style={{ fontSize:'13.5px', color:'#4B5563', lineHeight:1.6 }}>{item.a}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop:'28px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.22)', borderRadius:'12px', padding:'16px 18px' }}>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#059669', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px', fontWeight:700 }}>Zero Rip-And-Replace Architecture</div>
            <div style={{ fontSize:'13.5px', color:'#374151', lineHeight:1.6 }}>Kirova AI does not replace your CMMS. It is the evidence and decision intelligence layer that turns historical records into defensible maintenance choices.</div>
          </div>
        </div>
      </div>
    </div>

    <style>{`@media(max-width:760px){.problem-pivot-grid{grid-template-columns:1fr!important}.problem-pivot-grid>div{padding:44px 24px!important;border-right:none!important;border-bottom:1px solid rgba(0,0,0,0.07)!important}}`}</style>
  </section>
);

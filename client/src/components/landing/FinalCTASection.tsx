import React from 'react';

interface FinalCTASectionProps {
  onLaunchStudio: () => void;
  onExploreCapabilities: () => void;
  onSignIn?: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onLaunchStudio,
  onExploreCapabilities,
  onSignIn,
}) => (
  <section style={{ background:'#090D16', padding:'0', borderTop:'1px solid rgba(255,255,255,0.08)', scrollMarginTop:'112px' }}>
    <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'108px 24px 108px' }}>
      {/* Crosshairs */}
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', top:'-12px', left:'-12px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.15)', userSelect:'none' }}>+</span>
        <span style={{ position:'absolute', top:'-12px', right:'-12px', fontFamily:'monospace', fontSize:'13px', color:'rgba(255,255,255,0.15)', userSelect:'none' }}>+</span>

        <div style={{ textAlign:'center' }}>
          {/* Section index */}
          <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'24px', fontWeight:600 }}>H / Final Call to Action</div>

          {/* Ambient glow */}
          <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-60%)', width:'640px', height:'320px', background:'radial-gradient(ellipse,rgba(37,99,235,0.15) 0%,transparent 70%)', pointerEvents:'none', zIndex:0 }} />

          <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.4rem,5vw,4.2rem)', fontWeight:400, color:'#FFFFFF', margin:'0 0 22px', lineHeight:1.06, position:'relative', zIndex:1 }}>
            Move from unstructured fault reports to<br />
            <em style={{ color:'#60A5FA' }}>verified maintenance decisions.</em>
          </h2>

          <p style={{ fontSize:'1.1rem', color:'rgba(255,255,255,0.65)', maxWidth:'640px', margin:'0 auto 44px', lineHeight:1.75, position:'relative', zIndex:1 }}>
            Connect worker voice reports, fragmented maintenance history, and 4-way decision analysis into a single source-traceable Evidence Graph. Built for India's industrial shop floors.
          </p>

          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', flexWrap:'wrap', position:'relative', zIndex:1 }}>
            <button type="button" onClick={onLaunchStudio}
              style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'#FFFFFF', color:'#0F172A', padding:'15px 36px', borderRadius:'9999px', fontSize:'1.05rem', fontWeight:700, border:'none', cursor:'pointer', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', transition:'all 0.2s ease' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.4)';}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';(e.currentTarget as HTMLElement).style.boxShadow='0 4px 24px rgba(0,0,0,0.3)';}}>
              <span>▷</span><span>Open Operations Studio</span>
            </button>

            <button type="button" onClick={onSignIn || onExploreCapabilities}
              style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.9)', padding:'15px 30px', borderRadius:'9999px', fontSize:'1rem', fontWeight:600, border:'1px solid rgba(255,255,255,0.18)', cursor:'pointer', transition:'all 0.2s ease' }}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.14)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.08)'}>
              <span>Sign In with Demo Persona →</span>
            </button>
          </div>

          {/* Tech stack badges */}
          <div style={{ marginTop:'52px', display:'flex', gap:'12px', justifyContent:'center', flexWrap:'wrap', position:'relative', zIndex:1 }}>
            {['PGlite Embedded Graph','Sarvam AI STT','4-Way Decision Engine','Anti-Hallucination Guardrails','Google OAuth 2.0','Immutable Audit Trail'].map(b => (
              <span key={b} style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.5)', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'9999px', padding:'6px 15px', letterSpacing:'0.04em', fontWeight:600 }}>{b}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

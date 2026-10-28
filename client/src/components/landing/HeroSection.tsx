import React, { useState, useEffect, useRef } from 'react';

interface HeroSectionProps {
  onLaunchStudio: () => void;
  onExploreTour: () => void;
  onDemoPersona?: (persona: 'SUPERVISOR' | 'TECHNICIAN' | 'WORKER') => void;
}

const PIPELINE_STAGES = [
  {
    id: 'voice',
    num: '01',
    label: 'Multilingual Voice Intake',
    badge: 'OBSERVED FACT',
    badgeColor: '#2563EB',
    badgeBg: 'rgba(37,99,235,0.15)',
  },
  {
    id: 'evidence',
    num: '02',
    label: 'Evidence Graph Retrieval',
    badge: 'HISTORICAL EVIDENCE',
    badgeColor: '#059669',
    badgeBg: 'rgba(5,150,105,0.15)',
  },
  {
    id: 'decision',
    num: '03',
    label: '4-Way Decision Engine',
    badge: 'RECOMMENDATION',
    badgeColor: '#7C3AED',
    badgeBg: 'rgba(124,58,237,0.15)',
  },
  {
    id: 'outcome',
    num: '04',
    label: 'Outcome Verification',
    badge: 'VERIFIED OUTCOME',
    badgeColor: '#059669',
    badgeBg: 'rgba(5,150,105,0.15)',
  },
];

function CanvasDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const draw = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spacing = 32;
      const cols = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);
      const cx = canvas.width / 2, cy = canvas.height / 2;
      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          const x = i * spacing, y = j * spacing;
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const maxDist = Math.sqrt(cx ** 2 + cy ** 2);
          const alpha = 0.22 * (1 - dist / maxDist);
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(37,99,235,${alpha})`;
          ctx.fill();
        }
      }
      const grad = ctx.createRadialGradient(cx, cy * 0.55, 0, cx, cy * 0.55, Math.min(canvas.width, canvas.height) * 0.6);
      grad.addColorStop(0, 'rgba(37,99,235,0.07)');
      grad.addColorStop(0.5, 'rgba(16,185,129,0.05)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    window.addEventListener('resize', draw);
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('resize', draw); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:0 }} />;
}

function WaveformBars({ active }: { active?: boolean }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'3px', height:'32px' }}>
      {[12,20,30,22,34,26,16,28,14,24,32,18,26,12,20].map((h, i) => (
        <div key={i} style={{
          width:'3.5px', borderRadius:'9999px',
          background: active ? '#60A5FA' : 'rgba(96,165,250,0.4)',
          height:`${h}px`,
          animation: active ? `wave-anim 1.3s ease-in-out infinite alternate` : 'none',
          animationDelay:`${i * 0.08}s`,
        }} />
      ))}
    </div>
  );
}

function PipelineStageContent({ stageId }: { stageId: string }) {
  if (stageId === 'voice') return (
    <div style={{ padding:'12px 0' }}>
      <div style={{ fontSize:'11.5px', color:'#9CA3AF', fontFamily:'monospace', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'10px', fontWeight:600 }}>MCH-005 · 50-Ton Hydraulic Press · Stamping Area</div>
      <WaveformBars active />
      <div style={{ marginTop:'12px', fontSize:'13.5px', color:'#E5E7EB', lineHeight:1.6, fontStyle:'italic' }}>
        "Machine 5 hydraulic press ka pressure drop ho raha hai aur cylinder seal se oil leak hai..."
      </div>
      <div style={{ marginTop:'12px', display:'flex', gap:'8px', flexWrap:'wrap' }}>
        {['Asset: MCH-005','Symptom: Pressure Drop','Component: Cylinder Seal','Language: Hinglish'].map(t => (
          <span key={t} style={{ fontSize:'11px', fontFamily:'monospace', background:'rgba(37,99,235,0.18)', color:'#93C5FD', border:'1px solid rgba(37,99,235,0.3)', borderRadius:'5px', padding:'3px 9px', fontWeight:600 }}>{t}</span>
        ))}
      </div>
    </div>
  );

  if (stageId === 'evidence') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'8px', padding:'10px 0' }}>
      {[
        { id:'INC-2026-0002', action:'Tightened valve fitting', result:'Failed: Recurred in 9 days', rc:'#EF4444', rb:'rgba(239,68,68,0.15)' },
        { id:'INC-2026-0005', action:'Replaced primary piston seal', result:'Verified: 140+ days trouble-free', rc:'#10B981', rb:'rgba(16,185,129,0.15)' },
        { id:'LOG-2025-089',  action:'Unverified shift note', result:'Flagged: Incomplete / Conflicting Record', rc:'#F59E0B', rb:'rgba(245,158,11,0.15)' },
      ].map(c => (
        <div key={c.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'9px', padding:'10px 14px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF', letterSpacing:'0.06em', fontWeight:600 }}>{c.id}</span>
            <span style={{ fontSize:'10.5px', background:c.rb, color:c.rc, border:`1px solid ${c.rc}40`, borderRadius:'5px', padding:'2px 8px', fontWeight:700 }}>{c.result}</span>
          </div>
          <div style={{ fontSize:'13px', color:'#E5E7EB', fontWeight:500 }}>{c.action}</div>
        </div>
      ))}
    </div>
  );

  if (stageId === 'decision') return (
    <div style={{ display:'flex', flexDirection:'column', gap:'7px', padding:'10px 0' }}>
      {[
        { label:'Inspect Further', score: 35, color:'#9CA3AF', isRec:false },
        { label:'Repair Component', score: 55, color:'#F59E0B', isRec:false },
        { label:'Replace Component', score: 91, color:'#10B981', isRec:true },
        { label:'Replace Machine', score: 20, color:'#EF4444', isRec:false },
      ].map(o => (
        <div key={o.label} style={{ display:'flex', alignItems:'center', gap:'12px', background: o.isRec ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)', border:`1px solid ${o.isRec ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'8px', padding:'8px 12px' }}>
          <div style={{ width:'34px', height:'30px', borderRadius:'7px', background:`${o.color}25`, border:`1.5px solid ${o.color}60`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', color:o.color, fontWeight:700, fontFamily:'monospace' }}>{o.score}</div>
          <div style={{ flex:1, fontSize:'13px', color: o.isRec ? '#6EE7B7' : '#D1D5DB', fontWeight: o.isRec ? 700 : 500 }}>{o.label}</div>
          {o.isRec && <span style={{ fontSize:'10px', background:'rgba(16,185,129,0.22)', color:'#34D399', border:'1px solid rgba(16,185,129,0.4)', borderRadius:'5px', padding:'2px 8px', fontFamily:'monospace', letterSpacing:'0.05em', fontWeight:700 }}>RECOMMENDED</span>}
        </div>
      ))}
      <div style={{ fontSize:'11px', color:'#9CA3AF', fontFamily:'monospace', marginTop:'4px' }}>← Backed by INC-2026-0005 (140+ days verified trouble-free)</div>
    </div>
  );

  if (stageId === 'outcome') return (
    <div style={{ padding:'10px 0' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:'10px', background:'rgba(16,185,129,0.09)', border:'1px solid rgba(16,185,129,0.28)', borderRadius:'9px', padding:'11px 14px' }}>
          <div>
            <div style={{ fontSize:'12.5px', color:'#6EE7B7', fontWeight:700, marginBottom:'2px' }}>✓ Supervisor Approval</div>
            <div style={{ fontSize:'12px', color:'#D1D5DB' }}>Priya Sharma · INC-2026-0005 · Seal Kit Replacement Authorized</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'10px', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.25)', borderRadius:'9px', padding:'11px 14px' }}>
          <div>
            <div style={{ fontSize:'12.5px', color:'#93C5FD', fontWeight:700, marginBottom:'2px' }}>✓ Technician Completion Verification</div>
            <div style={{ fontSize:'12px', color:'#D1D5DB' }}>Rajesh Kumar · Primary seal replaced · Hydraulic pressure restored to 85 bar</div>
          </div>
        </div>
        <div style={{ background:'rgba(16,185,129,0.18)', border:'1px solid rgba(16,185,129,0.45)', borderRadius:'9px', padding:'11px 14px', textAlign:'center' }}>
          <div style={{ fontSize:'12.5px', color:'#34D399', fontWeight:700, fontFamily:'monospace', letterSpacing:'0.05em' }}>VERIFIED OUTCOME WRITTEN TO AUDIT TRAIL</div>
          <div style={{ fontSize:'11px', color:'#9CA3AF', marginTop:'3px', fontFamily:'monospace' }}>Append-only PGlite ledger · Immutable record</div>
        </div>
      </div>
    </div>
  );
  return null;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onLaunchStudio, onExploreTour, onDemoPersona }) => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveStage(s => (s + 1) % 4), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <section id="hero" style={{ position:'relative', background:'#F8F7F4', display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'88px', paddingBottom:'68px', paddingLeft:'24px', paddingRight:'24px', overflow:'hidden', scrollMarginTop:'80px' }}>
      <CanvasDotGrid />

      {/* Architectural hairline grid crosshairs */}
      <span style={{ position:'absolute', top:'84px', left:'24px', color:'rgba(0,0,0,0.18)', fontFamily:'monospace', fontSize:'13px', userSelect:'none', lineHeight:1, zIndex:1 }}>+</span>
      <span style={{ position:'absolute', top:'84px', right:'24px', color:'rgba(0,0,0,0.18)', fontFamily:'monospace', fontSize:'13px', userSelect:'none', lineHeight:1, zIndex:1 }}>+</span>

      <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:'1140px', margin:'0 auto', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

        {/* Eyebrow pill */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'9999px', padding:'6px 18px', marginBottom:'20px' }}>
          <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out' }} />
          <span style={{ fontFamily:'monospace', fontSize:'11.5px', fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:'#4B5563' }}>
            Evidence-Driven Industrial Maintenance Intelligence · From Voice to Verified Action
          </span>
        </div>

        {/* Hero Headline */}
        <h1 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.8rem,6.2vw,5.2rem)', fontWeight:400, lineHeight:1.06, letterSpacing:'-0.02em', color:'#0F172A', margin:'0 0 18px', maxWidth:'960px' }}>
          Every machine fault has a history.<br />
          <em style={{ fontStyle:'italic' }}>Kirova turns it into evidence-backed action.</em>
        </h1>

        {/* Subheadline */}
        <p style={{ fontSize:'clamp(1.05rem,1.8vw,1.25rem)', color:'#4B5563', lineHeight:1.7, maxWidth:'780px', margin:'0 auto 28px' }}>
          Connect multilingual shop-floor fault reports, fragmented repair logs, and verified historical outcomes into an explainable Evidence Graph—so maintenance teams can compare Inspect, Repair, Replace Component, or Replace Machine with full source traceability.
        </p>

        {/* CTAs */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'16px', flexWrap:'wrap', marginBottom:'16px' }}>
          <button type="button" onClick={onLaunchStudio}
            style={{ display:'inline-flex', alignItems:'center', gap:'10px', background:'#0F172A', color:'#FFF', padding:'14px 34px', borderRadius:'9999px', fontSize:'1.05rem', fontWeight:600, border:'none', cursor:'pointer', boxShadow:'0 4px 18px rgba(0,0,0,0.18)', transition:'all 0.2s ease' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='#1E293B';(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='#0F172A';(e.currentTarget as HTMLElement).style.transform='none';}}>
            <span>▷</span><span>Launch Operations Studio</span>
          </button>
          <button type="button" onClick={onExploreTour}
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#FFFFFF', color:'#0F172A', padding:'14px 28px', borderRadius:'9999px', fontSize:'1rem', fontWeight:600, border:'1px solid rgba(0,0,0,0.12)', cursor:'pointer', boxShadow:'0 2px 8px rgba(0,0,0,0.06)', transition:'all 0.2s ease' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-1px)';}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='none';}}>
            <span>Explore Interactive Evidence Graph</span><span>↓</span>
          </button>
        </div>

        {/* Demo Persona Bar */}
        {onDemoPersona && (
          <div style={{ display:'flex', alignItems:'center', gap:'10px', flexWrap:'wrap', justifyContent:'center', marginBottom:'32px' }}>
            <span style={{ fontSize:'12.5px', color:'#6B7280', fontWeight:600 }}>Instant Judge Demo Access:</span>
            {([['SUPERVISOR','Supervisor · Priya'],['TECHNICIAN','Technician · Rajesh'],['WORKER','Worker · Amit']] as ['SUPERVISOR'|'TECHNICIAN'|'WORKER', string][]).map(([role, label]) => (
              <button key={role} type="button" onClick={()=>onDemoPersona(role)}
                style={{ fontSize:'12px', fontWeight:600, color:'#1D4ED8', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.22)', borderRadius:'9999px', padding:'5px 15px', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(37,99,235,0.16)';}}
                onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(37,99,235,0.08)';}}>
                {label} →
              </button>
            ))}
          </div>
        )}
        {!onDemoPersona && <div style={{ marginBottom:'32px' }} />}

        {/* ── Hero Interactive Pipeline Card ── */}
        <div style={{ width:'100%', background:'#0D1117', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', boxShadow:'0 32px 80px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.15)', overflow:'hidden' }}>
          {/* Window chrome */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.03)' }}>
            <div style={{ display:'flex', gap:'7px' }}>
              {['#FF5F56','#FFBD2E','#27C93F'].map(c => <div key={c} style={{ width:'11px', height:'11px', borderRadius:'50%', background:c }} />)}
            </div>
            <span style={{ fontFamily:'monospace', fontSize:'12px', color:'rgba(255,255,255,0.5)', letterSpacing:'0.04em', fontWeight:500 }}>kirova-evidence-pipeline // MCH-005 · From Voice to Verified Action</span>
            <div style={{ display:'flex', gap:'8px' }}>
              <span style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>⤢</span>
              <span style={{ fontFamily:'monospace', fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>✕</span>
            </div>
          </div>

          {/* Stage tab headers */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
            {PIPELINE_STAGES.map((s, i) => (
              <button key={s.id} type="button" onClick={()=>setActiveStage(i)}
                style={{ padding:'12px 10px', border:'none', borderBottom: i === activeStage ? `2.5px solid ${s.badgeColor}` : '2.5px solid transparent', background: i === activeStage ? 'rgba(255,255,255,0.05)' : 'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.2s' }}>
                <div style={{ fontFamily:'monospace', fontSize:'11px', color: i === activeStage ? s.badgeColor : 'rgba(255,255,255,0.4)', fontWeight:700, letterSpacing:'0.06em', marginBottom:'4px' }}>{s.num} / {s.label.split(' ').slice(0,2).join(' ')}</div>
                <span style={{ fontSize:'10px', fontFamily:'monospace', background: i === activeStage ? s.badgeBg : 'transparent', color: i === activeStage ? s.badgeColor : 'rgba(255,255,255,0.3)', border:`1px solid ${i === activeStage ? s.badgeColor + '60' : 'transparent'}`, borderRadius:'4px', padding:'2px 7px', letterSpacing:'0.05em', textTransform:'uppercase', fontWeight:600 }}>{s.badge}</span>
              </button>
            ))}
          </div>

          {/* Stage content */}
          <div style={{ padding:'20px 24px', minHeight:'190px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'16px' }}>
              <div style={{ fontFamily:'monospace', fontSize:'32px', fontWeight:700, color:'rgba(255,255,255,0.1)', lineHeight:1, flexShrink:0, paddingTop:'6px' }}>
                {PIPELINE_STAGES[activeStage].num}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:'14px', fontWeight:700, color:'#FFFFFF', marginBottom:'4px' }}>{PIPELINE_STAGES[activeStage].label}</div>
                <PipelineStageContent stageId={PIPELINE_STAGES[activeStage].id} />
              </div>
            </div>
          </div>

          {/* Stage progress dots */}
          <div style={{ display:'flex', gap:'7px', justifyContent:'center', padding:'10px 0 16px', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            {PIPELINE_STAGES.map((_s, i) => (
              <button key={i} type="button" onClick={()=>setActiveStage(i)}
                style={{ width: i === activeStage ? '24px' : '7px', height:'7px', borderRadius:'9999px', border:'none', background: i === activeStage ? PIPELINE_STAGES[i].badgeColor : 'rgba(255,255,255,0.2)', cursor:'pointer', transition:'all 0.3s ease', padding:0 }} />
            ))}
          </div>
        </div>

        {/* ── Metrics Bar ── */}
        <div style={{ width:'100%', display:'grid', gridTemplateColumns:'repeat(2,1fr)', marginTop:'1px', border:'1px solid rgba(0,0,0,0.09)', borderRadius:'0 0 16px 16px', background:'rgba(255,255,255,0.75)', backdropFilter:'blur(10px)' } as React.CSSProperties} className="metrics-bar-grid">
          {[
            { val:'4', unit:'-Way', title:'Decision Space', sub:'Inspect · Repair · Replace Part · Replace Asset' },
            { val:'5', unit:' Layers', title:'Epistemic Separation', sub:'Fact · Evidence · Inference · Option · Outcome' },
            { val:'5', unit:' Languages', title:'Shop-Floor Voice Intake', sub:'Hindi · Hinglish · Tamil · Telugu · English' },
            { val:'100', unit:'%', title:'Source Traceability', sub:'Every claim linked to an underlying record ID' },
          ].map((m, i) => (
            <div key={i} style={{ padding:'24px 28px', borderRight: i % 2 === 0 ? '1px solid rgba(0,0,0,0.07)' : 'none', borderTop: i >= 2 ? '1px solid rgba(0,0,0,0.07)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:'2px', marginBottom:'4px' }}>
                <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:'2.8rem', fontWeight:400, color:'#0F172A', lineHeight:1 }}>{m.val}</span>
                <span style={{ fontSize:'1.2rem', color:'#4B5563', fontWeight:600, marginLeft:'2px' }}>{m.unit}</span>
              </div>
              <div style={{ fontSize:'1rem', fontWeight:700, color:'#0F172A', marginBottom:'3px' }}>{m.title}</div>
              <div style={{ fontSize:'0.82rem', color:'#6B7280', fontFamily:'monospace', letterSpacing:'0.02em', fontWeight:500 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes kpulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.28)}}
        @keyframes wave-anim{0%{height:8px}100%{height:100%}}
        @media(max-width:760px){.metrics-bar-grid{grid-template-columns:1fr!important}}
      `}</style>
    </section>
  );
};

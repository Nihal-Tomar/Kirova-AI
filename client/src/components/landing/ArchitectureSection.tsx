import React, { useEffect, useRef } from 'react';

const MARQUEE_ROW1 = [
  'CSV Maintenance Logs', 'Excel Repair Trackers', 'UpKeep CMMS Exports',
  'Fiix Work Order History', 'IBM Maximo Asset Logs', 'PDF Equipment Manuals',
  'Shift Handover Notes', 'SAP PM Export CSV', 'Preventive Maintenance Sheets',
];
const MARQUEE_ROW2 = [
  'Sarvam AI Multilingual STT', 'Hindi & Hinglish Voice', 'Tamil & Telugu Audio',
  'PGlite Embedded Graph', 'Immutable SQL Audit Triggers', 'Google OAuth 2.0 Role Security',
  'Deterministic Entity Resolution', 'Anti-Hallucination Guardrail', '4-Way Decision Engine',
];

function MarqueeRow({ items, reverse }: { items: string[]; reverse?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pos = reverse ? -el.scrollWidth / 2 : 0;
    let raf: number;
    const step = () => {
      pos += reverse ? -0.45 : 0.45;
      if (!reverse && pos > el.scrollWidth / 2) pos = 0;
      if (reverse && pos < -el.scrollWidth / 2) pos = 0;
      el.style.transform = `translateX(${pos}px)`;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reverse]);

  const doubled = [...items, ...items];
  return (
    <div style={{ overflow:'hidden', width:'100%' }}>
      <div ref={ref} style={{ display:'flex', gap:'14px', willChange:'transform', whiteSpace:'nowrap' }}>
        {doubled.map((item, i) => (
          <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:'9px', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.11)', borderRadius:'9999px', padding:'9px 20px', flexShrink:0 }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#60A5FA', display:'inline-block', flexShrink:0, boxShadow:'0 0 6px rgba(96,165,250,0.5)' }} />
            <span style={{ fontFamily:'monospace', fontSize:'12.5px', color:'rgba(255,255,255,0.7)', letterSpacing:'0.03em', fontWeight:600 }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ArchitectureSection: React.FC = () => (
  <section id="architecture" style={{ background:'#090D16', borderTop:'1px solid rgba(255,255,255,0.08)', scrollMarginTop:'112px' }}>
    {/* Marquee Header */}
    <div style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'76px 0 60px' }}>
      <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'0 24px', marginBottom:'44px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
          <span style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', fontWeight:600 }}>F / Ingestion Ecosystem</span>
        </div>
        <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.2rem,4vw,3.4rem)', fontWeight:400, color:'#FFFFFF', margin:'0 0 14px', lineHeight:1.1 }}>
          Vendor-neutral intelligence.<br /><em>Zero rip-and-replace.</em>
        </h2>
        <p style={{ fontSize:'1.05rem', color:'rgba(255,255,255,0.6)', margin:0, maxWidth:'600px', lineHeight:1.68 }}>
          Ingest maintenance history from existing spreadsheets, CMMS exports, and shop-floor voice notes. Operates alongside your current enterprise tooling.
        </p>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
        <MarqueeRow items={MARQUEE_ROW1} />
        <MarqueeRow items={MARQUEE_ROW2} reverse />
      </div>
    </div>

    {/* Architecture deep tech cards */}
    <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'64px 24px 80px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'28px' }} className="arch-tech-grid">
      {[
        {
          icon:'🎙️',
          badge:'Multilingual STT',
          badgeColor:'#60A5FA',
          title:'Dual-Engine Speech Recognition',
          body:'Switches intelligently between local CTranslate2 Faster-Whisper and Sarvam AI dialect processing—delivering robust Hindi, Hinglish, Tamil, Telugu, and English recognition with sub-500ms streaming latency.',
          specs:[{ k:'CTranslate2 INT8 Engine', v:'Zero Cloud Latency' }, { k:'Sarvam Saaras Dialect', v:'Sub-500ms Streaming' }],
          accentColor:'#3B82F6',
        },
        {
          icon:'⚡',
          badge:'Zero-LLM Cost Pipeline',
          badgeColor:'#34D399',
          title:'Deterministic Fallback + PGlite Persistence',
          body:'Ingests directly into embedded PostgreSQL vectors. Zero token burn on structured record retrieval. The 4-Way Decision Engine runs entirely on deterministic SQL logic with complete uptime predictability.',
          specs:[{ k:'PGlite Embedded Storage', v:'Append-Only Audit' }, { k:'Deterministic Fallback', v:'100% Uptime Guaranteed' }],
          accentColor:'#10B981',
        },
        {
          icon:'🔒',
          badge:'Case-Level RBAC',
          badgeColor:'#A78BFA',
          title:'Strict Role-Based Access Control',
          body:'Supervisors review and assign cases. Technicians gain case history access only after official dispatch assignment—with zero URL or API bypass. Secured via JWT and Google OAuth 2.0.',
          specs:[{ k:'Google OAuth 2.0', v:'JWT Token Security' }, { k:'Case-Level Gate', v:'No Unauthorized Bypass' }],
          accentColor:'#8B5CF6',
        },
        {
          icon:'🕸️',
          badge:'Evidence Graph',
          badgeColor:'#FCD34D',
          title:'Source-Linked Evidence Provenance',
          body:'Every finding, inference, and recommendation cites the original record ID that supports it. Relationships between assets, components, faults, work orders, and verified outcomes are stored as a queryable graph.',
          specs:[{ k:'PGlite Graph Storage', v:'Deterministic Provenance' }, { k:'Node-Link Traversal', v:'Sub-10ms Local Lookup' }],
          accentColor:'#F59E0B',
        },
      ].map(card => (
        <div key={card.title} style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'18px', padding:'32px', display:'flex', flexDirection:'column', gap:'18px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:'48px', height:'48px', background:`${card.accentColor}18`, border:`1px solid ${card.accentColor}35`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px' }}>{card.icon}</div>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:card.badgeColor, background:`${card.badgeColor}18`, border:`1px solid ${card.badgeColor}35`, borderRadius:'9999px', padding:'4px 12px', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>{card.badge}</span>
          </div>
          <div>
            <h3 style={{ fontSize:'1.2rem', fontWeight:700, color:'#FFFFFF', margin:'0 0 10px', lineHeight:1.35 }}>{card.title}</h3>
            <p style={{ fontSize:'0.95rem', color:'rgba(255,255,255,0.6)', lineHeight:1.68, margin:0 }}>{card.body}</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginTop:'auto' }}>
            {card.specs.map(sp => (
              <div key={sp.k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'8px', padding:'9px 14px' }}>
                <span style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(255,255,255,0.6)', letterSpacing:'0.04em' }}>{sp.k}</span>
                <span style={{ fontFamily:'monospace', fontSize:'11px', color:card.badgeColor, background:`${card.badgeColor}15`, border:`1px solid ${card.badgeColor}30`, borderRadius:'5px', padding:'3px 9px', fontWeight:600 }}>{sp.v}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

    <style>{`@media(max-width:760px){.arch-tech-grid{grid-template-columns:1fr!important}}`}</style>
  </section>
);

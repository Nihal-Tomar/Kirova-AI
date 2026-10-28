import React from 'react';

const ROLES = [
  {
    num: '01',
    persona: 'WORKER' as const,
    name: 'Amit Verma',
    role: 'Worker / Line Operator',
    focus: '15-second multilingual voice or text fault reporting, visual machine selection, and live 5-stage status tracking.',
    tags: ['Voice Reporting', 'Machine Selection', 'Live Status Tracking'],
    color: '#D97706',
    accentBg: 'rgba(245,158,11,0.08)',
    accentBorder: 'rgba(245,158,11,0.25)',
    preview: (
      <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', background:'rgba(245,158,11,0.09)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:'9px', padding:'10px 14px' }}>
          <span style={{ fontSize:'16px' }}>🎙️</span>
          <div>
            <div style={{ fontSize:'11px', fontFamily:'monospace', color:'#B45309', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:700 }}>Voice Stream Active</div>
            <div style={{ fontSize:'13px', color:'#1F2937', fontWeight:500 }}>"MCH-004 belt slip ho raha hai…"</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:'7px' }}>
          {['MCH-004','MCH-005','MCH-006'].map(m => (
            <span key={m} style={{ fontSize:'11px', fontFamily:'monospace', background:'rgba(0,0,0,0.05)', border:'1px solid rgba(0,0,0,0.1)', borderRadius:'6px', padding:'4px 10px', color:'#374151', fontWeight:600 }}>{m}</span>
          ))}
        </div>
        <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
          {['Report','Triage','Assign','Execute','Verified'].map((s,i)=>(
            <React.Fragment key={s}>
              <div style={{ fontSize:'10px', color: i<=1 ? '#059669' : '#9CA3AF', fontWeight:700, fontFamily:'monospace' }}>{s}</div>
              {i<4 && <div style={{ width:'14px', height:'1.5px', background: i<1 ? '#059669' : 'rgba(0,0,0,0.15)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    ),
    ctaLabel: 'Try Worker Demo (Amit) →',
  },
  {
    num: '02',
    persona: 'TECHNICIAN' as const,
    name: 'Rajesh Kumar',
    role: 'Maintenance Technician',
    focus: 'Assigned incident queue, machine repair history, Evidence Graph traversal, and explainable 4-Way Decision comparison.',
    tags: ['Evidence Graph', '4-Way Decision', 'Repair History'],
    color: '#2563EB',
    accentBg: 'rgba(37,99,235,0.08)',
    accentBorder: 'rgba(37,99,235,0.25)',
    isHighlighted: true,
    preview: (
      <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
        <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', letterSpacing:'0.07em', textTransform:'uppercase', fontWeight:700 }}>Assigned Dispatch · MCH-005</div>
        {[['Replace Component','91','#059669',true],['Repair Component','55','#D97706',false],['Inspect Further','35','#6B7280',false]].map(([l,s,c,rec])=>(
          <div key={String(l)} style={{ display:'flex', alignItems:'center', gap:'10px', background: rec ? 'rgba(16,185,129,0.09)' : 'rgba(0,0,0,0.035)', border:`1px solid ${rec ? 'rgba(16,185,129,0.25)' : 'rgba(0,0,0,0.08)'}`, borderRadius:'7px', padding:'7px 11px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'12px', fontWeight:700, color:String(c) }}>{s}</span>
            <span style={{ fontSize:'12.5px', color:'#1F2937', fontWeight: rec ? 700:500 }}>{l}</span>
            {rec && <span style={{ fontSize:'9.5px', color:'#059669', fontFamily:'monospace', marginLeft:'auto', fontWeight:700 }}>RECOMMENDED</span>}
          </div>
        ))}
        <div style={{ fontFamily:'monospace', fontSize:'10.5px', color:'#6B7280' }}>← Grounded in INC-2026-0005</div>
      </div>
    ),
    ctaLabel: 'Try Technician Demo (Rajesh) →',
  },
  {
    num: '03',
    persona: 'SUPERVISOR' as const,
    name: 'Priya Sharma',
    role: 'Maintenance Supervisor',
    focus: 'Plant-wide risk overview, contradiction review, 4-way decision approval gate, and verified closure audit trail.',
    tags: ['Approval Gate', 'Audit Trail', 'Risk Overview'],
    color: '#7C3AED',
    accentBg: 'rgba(124,58,237,0.08)',
    accentBorder: 'rgba(124,58,237,0.25)',
    preview: (
      <div style={{ display:'flex', flexDirection:'column', gap:'9px' }}>
        <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
          {[{ l:'3 Awaiting Review', c:'#D97706', bc:'rgba(245,158,11,0.12)' },{ l:'1 Conflict Flag', c:'#DC2626', bc:'rgba(239,68,68,0.12)' },{ l:'2 Pending Closure', c:'#2563EB', bc:'rgba(37,99,235,0.1)' }].map(b=>(
            <span key={b.l} style={{ fontSize:'10.5px', fontFamily:'monospace', color:b.c, background:b.bc, border:`1px solid ${b.c}35`, borderRadius:'5px', padding:'3px 9px', fontWeight:600 }}>{b.l}</span>
          ))}
        </div>
        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'9px', padding:'10px 14px' }}>
          <div style={{ fontSize:'12px', fontWeight:700, color:'#059669', marginBottom:'2px' }}>✓ Authorize & Dispatch</div>
          <div style={{ fontSize:'12.5px', color:'#1F2937' }}>INC-2026-0005 · Replace Component · Rajesh Kumar</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'7px', background:'rgba(0,0,0,0.035)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'7px', padding:'7px 12px' }}>
          <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', fontWeight:500 }}>🔒 Append-Only Audit · Timestamp Locked</span>
        </div>
      </div>
    ),
    ctaLabel: 'Try Supervisor Demo (Priya) →',
  },
];

interface RoleLaunchpadProps {
  onDemoPersona?: (persona: 'SUPERVISOR' | 'TECHNICIAN' | 'WORKER') => void;
  onLaunchStudio: () => void;
}

export const RoleLaunchpadSection: React.FC<RoleLaunchpadProps> = ({ onDemoPersona, onLaunchStudio }) => (
  <section id="roles" style={{ background:'#F8F7F4', borderTop:'1px solid rgba(0,0,0,0.07)', scrollMarginTop:'112px' }}>
    {/* Header */}
    <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'76px 24px 48px', borderBottom:'1px solid rgba(0,0,0,0.07)' }}>
      <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:'rgba(0,0,0,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'14px', fontWeight:600 }}>G / Role Experience Launchpad · 01 — 03</div>
      <h2 style={{ fontFamily:"'Instrument Serif','DM Serif Display',Georgia,serif", fontSize:'clamp(2.2rem,3.8vw,3.4rem)', fontWeight:400, color:'#0F172A', margin:'0 0 14px', lineHeight:1.1 }}>
        One evidence chain.<br /><em>Three role-specific workspaces.</em>
      </h2>
      <p style={{ fontSize:'1.05rem', color:'#4B5563', maxWidth:'520px', margin:0, lineHeight:1.68 }}>
        Each persona sees only what they need to execute their job—while every action directly enriches the same shared Evidence Graph.
      </p>
    </div>

    {/* 3-column card grid */}
    <div style={{ maxWidth:'1180px', margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(3,1fr)', borderBottom:'1px solid rgba(0,0,0,0.07)' }} className="role-cards-grid">
      {ROLES.map((role, i) => (
        <div key={role.num} style={{
          padding:'42px 32px',
          borderRight: i < 2 ? '1px solid rgba(0,0,0,0.07)' : 'none',
          background: role.isHighlighted ? '#FFFFFF' : 'transparent',
          boxShadow: role.isHighlighted ? '0 4px 24px rgba(0,0,0,0.06)' : 'none',
          position:'relative',
          display:'flex', flexDirection:'column', gap:'22px',
        }}>
          {role.isHighlighted && (
            <div style={{ position:'absolute', top:'-1px', left:'32px', right:'32px', height:'3px', background:'linear-gradient(90deg,#2563EB,#7C3AED)', borderRadius:'0 0 3px 3px' }} />
          )}

          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
            <span style={{ fontFamily:'monospace', fontSize:'3rem', fontWeight:400, color:'rgba(0,0,0,0.1)', lineHeight:1 }}>{role.num}</span>
            {role.isHighlighted && (
              <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#2563EB', background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.22)', borderRadius:'9999px', padding:'4px 12px', letterSpacing:'0.05em', fontWeight:700 }}>PRIMARY WORKBENCH</span>
            )}
          </div>

          <div>
            <div style={{ fontFamily:'monospace', fontSize:'11.5px', color:role.color, letterSpacing:'0.07em', textTransform:'uppercase', marginBottom:'6px', fontWeight:700 }}>{role.role}</div>
            <div style={{ fontSize:'1.3rem', fontWeight:700, color:'#0F172A', marginBottom:'8px' }}>{role.name}</div>
            <div style={{ fontSize:'0.95rem', color:'#4B5563', lineHeight:1.65 }}>{role.focus}</div>
          </div>

          {/* Tags */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'7px' }}>
            {role.tags.map(t => (
              <span key={t} style={{ fontFamily:'monospace', fontSize:'11px', color:role.color, background:role.accentBg, border:`1px solid ${role.accentBorder}`, borderRadius:'5px', padding:'3px 9px', letterSpacing:'0.04em', fontWeight:600 }}>{t}</span>
            ))}
          </div>

          {/* Micro preview */}
          <div style={{ background:'rgba(0,0,0,0.025)', border:'1px solid rgba(0,0,0,0.08)', borderRadius:'12px', padding:'16px' }}>
            {role.preview}
          </div>

          {/* CTA */}
          <button type="button"
            onClick={() => onDemoPersona ? onDemoPersona(role.persona) : onLaunchStudio()}
            style={{ width:'100%', padding:'13px 18px', border:`1.5px solid ${role.isHighlighted ? '#2563EB' : 'rgba(0,0,0,0.15)'}`, borderRadius:'11px', background: role.isHighlighted ? '#2563EB' : 'transparent', color: role.isHighlighted ? '#FFFFFF' : '#0F172A', fontWeight:700, fontSize:'13.5px', cursor:'pointer', transition:'all 0.2s', textAlign:'center', marginTop:'auto' }}
            onMouseEnter={e=>{ if(!role.isHighlighted)(e.currentTarget as HTMLElement).style.background='rgba(0,0,0,0.04)'; }}
            onMouseLeave={e=>{ if(!role.isHighlighted)(e.currentTarget as HTMLElement).style.background='transparent'; }}>
            {role.ctaLabel}
          </button>
        </div>
      ))}
    </div>

    <style>{`@media(max-width:760px){.role-cards-grid{grid-template-columns:1fr!important}.role-cards-grid>div{border-right:none!important;border-bottom:1px solid rgba(0,0,0,0.07)!important}}`}</style>
  </section>
);

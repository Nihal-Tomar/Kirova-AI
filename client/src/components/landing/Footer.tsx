import React from 'react';

interface FooterProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onLaunchStudio, onSignIn }) => {
  const year = new Date().getFullYear();
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer style={{ background:'#FFFFFF', borderTop:'1px solid rgba(0,0,0,0.08)' }}>
      {/* Hairline grid top border */}
      <div style={{ maxWidth:'1180px', margin:'0 auto', padding:'64px 24px 36px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1.8fr 1fr 1fr 1fr', gap:'48px', paddingBottom:'48px', borderBottom:'1px solid rgba(0,0,0,0.07)' }} className="footer-cols-grid">

          {/* Brand column */}
          <div>
            <a href="#" onClick={e=>{ e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); }}
              style={{ display:'inline-flex', alignItems:'center', gap:'9px', textDecoration:'none', color:'#0F172A', fontWeight:700, fontSize:'1.3rem', letterSpacing:'-0.02em', marginBottom:'16px' }}>
              <span>kirova<span style={{ fontWeight:500, color:'#71717A', marginLeft:'2px' }}>AI</span></span>
              <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', boxShadow:'0 0 10px rgba(16,185,129,0.6)', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out' }} />
            </a>
            <p style={{ fontSize:'0.92rem', color:'#4B5563', lineHeight:1.75, margin:'0 0 18px', maxWidth:'320px' }}>
              Evidence-driven industrial maintenance intelligence. Connecting shop-floor voice reports with historical records and verified outcomes.
            </p>
            <div style={{ fontSize:'0.85rem', color:'#6B7280' }}>
              Crafted with ❤️ by <strong style={{ color:'#0F172A' }}>Team Sudarshan</strong>
            </div>
          </div>

          {/* Product links */}
          <div>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'18px', fontWeight:700 }}>Product</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['tour','Product Tour'],['capabilities','Capabilities'],['architecture','Architecture'],['workflow','Workflow Pipeline']].map(([id,label])=>(
                <a key={id} href={`#${id}`} onClick={e=>{ e.preventDefault(); scrollTo(id); }}
                  style={{ textDecoration:'none', color:'#4B5563', fontSize:'0.92rem', fontWeight:500, transition:'color 0.2s' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#0F172A')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#4B5563')}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Workspace links */}
          <div>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'18px', fontWeight:700 }}>Workspace</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[['Launch Studio',onLaunchStudio],['Supervisor Sign In',onSignIn],['Technician Portal',onSignIn],['Demo Accounts',onSignIn]].map(([label,fn])=>(
                <button key={String(label)} type="button" onClick={fn as ()=>void}
                  style={{ background:'none', border:'none', padding:0, textAlign:'left', textDecoration:'none', color:'#4B5563', fontSize:'0.92rem', fontWeight:500, transition:'color 0.2s', cursor:'pointer' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#0F172A')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#4B5563')}>
                  {String(label)}
                </button>
              ))}
            </div>
          </div>

          {/* Project info */}
          <div>
            <div style={{ fontFamily:'monospace', fontSize:'11px', color:'#9CA3AF', letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:'18px', fontWeight:700 }}>Project</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {['HackFront India 2026','Open Source & Innovation','Kirova AI v2.0'].map(s=>(
                <span key={s} style={{ color:'#6B7280', fontSize:'0.92rem', fontWeight:500 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer bottom bar */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'28px', flexWrap:'wrap', gap:'14px' }}>
          <div style={{ fontSize:'0.85rem', color:'#6B7280', fontFamily:'monospace' }}>
            © {year} Kirova AI — From Voice to Verified Action. Team Sudarshan.
          </div>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'9999px', padding:'6px 15px' }}>
            <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out' }} />
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#059669', letterSpacing:'0.05em', fontWeight:600 }}>All Systems Operational (PGlite + Sarvam AI)</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kpulse{0%,100%{opacity:.85;transform:scale(1)}50%{opacity:1;transform:scale(1.28)}}
        @media(max-width:760px){.footer-cols-grid{grid-template-columns:1fr 1fr!important}}
        @media(max-width:480px){.footer-cols-grid{grid-template-columns:1fr!important}}
      `}</style>
    </footer>
  );
};

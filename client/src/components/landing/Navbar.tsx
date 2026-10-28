import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
  onSignUp?: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLaunchStudio,
  onSignIn,
  isAuthenticated = false,
  userName,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }
  };

  return (
    <header style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, pointerEvents:'none', paddingTop:'14px', paddingLeft:'16px', paddingRight:'16px' }}>
      <nav style={{
        pointerEvents:'auto', maxWidth:'1140px', margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px',
        background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)',
        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        border:'1px solid rgba(24,24,27,0.12)', borderRadius:'9999px',
        padding:'8px 12px 8px 24px',
        boxShadow: scrolled ? '0 12px 40px rgba(0,0,0,0.10),0 1px 3px rgba(0,0,0,0.05)' : '0 4px 24px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.03)',
        transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Brand Group */}
        <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
          <a href="#" onClick={e=>{ e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); }}
            style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', color:'#0F172A', fontWeight:700, fontSize:'1.25rem', letterSpacing:'-0.022em' }}>
            <span>kirova<span style={{ fontWeight:500, color:'#71717A', marginLeft:'2px' }}>AI</span></span>
            <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', boxShadow:'0 0 10px rgba(16,185,129,0.5)', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out' }} />
          </a>

          <div style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.05)', padding:'3px', borderRadius:'9999px', gap:'2px' }}>
            <button type="button" style={{ border:'none', background:'#FFFFFF', color:'#0F172A', padding:'5px 14px', borderRadius:'9999px', fontSize:'0.84rem', fontWeight:600, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}>Overview</button>
            <button type="button" onClick={onLaunchStudio}
              style={{ border:'none', background:'transparent', color:'#4B5563', padding:'5px 14px', borderRadius:'9999px', fontSize:'0.84rem', fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px' }}>
              Studio
              <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', background:'#E0E7FF', color:'#3730A3', padding:'2px 6px', borderRadius:'9999px', letterSpacing:'0.04em' }}>AI</span>
            </button>
          </div>
        </div>

        {/* Center Nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'26px' }} className="knav-desktop">
          {([['tour','Product Tour'],['capabilities','Capabilities'],['architecture','Architecture']] as [string,string][]).map(([id,label]) => (
            <a key={id} href={`#${id}`} onClick={e=>scrollToSection(e,id)}
              style={{ textDecoration:'none', color:'#374151', fontSize:'0.84rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', transition:'color 0.2s' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#2563EB')}
              onMouseLeave={e=>(e.currentTarget.style.color='#374151')}>
              {label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <button type="button" onClick={onLaunchStudio}
            className="knav-launch-btn"
            style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#0F172A', color:'#FFFFFF', padding:'8px 20px', borderRadius:'9999px', fontSize:'0.88rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s ease' }}>
            <span>▷</span>
            <span>{isAuthenticated ? 'Open Studio' : 'Launch Studio'}</span>
          </button>

          {!isAuthenticated ? (
            <button type="button" onClick={onSignIn}
              style={{ background:'transparent', border:'none', color:'#4B5563', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'8px 12px' }}>
              Sign In
            </button>
          ) : (
            <span style={{ fontSize:'0.88rem', fontWeight:600, color:'#374151' }}>👋 {userName?.split(' ')[0] || 'User'}</span>
          )}

          <button type="button" onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation" className="knav-mobile-toggle"
            style={{ display:'none', background:'transparent', border:'none', fontSize:'1.4rem', color:'#0F172A', cursor:'pointer', padding:'4px' }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div style={{ pointerEvents:'auto', position:'absolute', top:'72px', left:'16px', right:'16px', background:'#FFFFFF', borderRadius:'20px', padding:'22px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', gap:'14px', zIndex:100 }}>
          {([['tour','Product Tour'],['capabilities','Capabilities'],['architecture','Architecture']] as [string,string][]).map(([id,label]) => (
            <a key={id} href={`#${id}`} onClick={e=>scrollToSection(e as any,id)} style={{ textDecoration:'none', color:'#0F172A', fontSize:'1rem', fontWeight:600, padding:'8px 0' }}>{label}</a>
          ))}
          <hr style={{ border:'none', borderTop:'1px solid rgba(0,0,0,0.07)', margin:'4px 0' }} />
          <button type="button" style={{ background:'#0F172A', color:'#FFF', border:'none', borderRadius:'12px', padding:'12px', fontWeight:600, cursor:'pointer', fontSize:'0.95rem' }} onClick={()=>{ setMobileMenuOpen(false); onLaunchStudio(); }}>▷ Launch Studio</button>
          {!isAuthenticated && <button type="button" style={{ background:'#F4F4F5', color:'#0F172A', border:'none', borderRadius:'12px', padding:'12px', fontWeight:600, cursor:'pointer', fontSize:'0.95rem' }} onClick={()=>{ setMobileMenuOpen(false); onSignIn(); }}>Sign In / Quick Demo</button>}
        </div>
      )}
    </header>
  );
};

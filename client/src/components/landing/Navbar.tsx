import React, { useState, useEffect, useRef } from 'react';

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
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer on click outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) { el.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }
  };

  return (
    <header ref={navRef} style={{ position:'fixed', top:0, left:0, right:0, zIndex:50, pointerEvents:'none', paddingTop:'12px', paddingLeft:'12px', paddingRight:'12px', width:'100%', boxSizing:'border-box' }}>
      <nav className="knav-pill" style={{
        pointerEvents:'auto', width:'94%', maxWidth:'1140px', margin:'0 auto',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:'16px',
        background: scrolled ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.92)',
        backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)',
        border:'1px solid rgba(24,24,27,0.12)', borderRadius:'9999px',
        padding:'8px 12px 8px 24px',
        boxShadow: scrolled ? '0 12px 40px rgba(0,0,0,0.10),0 1px 3px rgba(0,0,0,0.05)' : '0 4px 24px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.03)',
        transition:'all 0.25s cubic-bezier(0.16,1,0.3,1)',
        boxSizing:'border-box',
      }}>

        {/* Brand Group — Always visible on mobile & desktop */}
        <div className="knav-brand-group" style={{ display:'flex', alignItems:'center', gap:'16px', flexShrink:0 }}>
          <a href="#" onClick={e=>{ e.preventDefault(); window.scrollTo({ top:0, behavior:'smooth' }); }}
            className="knav-brand-title"
            style={{ display:'flex', alignItems:'center', gap:'8px', textDecoration:'none', color:'#0F172A', fontWeight:700, fontSize:'1.25rem', letterSpacing:'-0.022em', whiteSpace:'nowrap' }}>
            <span>kirova<span style={{ fontWeight:500, color:'#71717A', marginLeft:'2px' }}>AI</span></span>
            <span style={{ width:'7px', height:'7px', background:'#10B981', borderRadius:'50%', boxShadow:'0 0 10px rgba(16,185,129,0.5)', display:'inline-block', animation:'kpulse 2.5s infinite ease-in-out', flexShrink:0 }} />
          </a>

          <div className="knav-switcher" style={{ display:'flex', alignItems:'center', background:'rgba(0,0,0,0.05)', padding:'3px', borderRadius:'9999px', gap:'2px' }}>
            <button type="button" style={{ border:'none', background:'#FFFFFF', color:'#0F172A', padding:'5px 14px', borderRadius:'9999px', fontSize:'0.84rem', fontWeight:600, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.08)', whiteSpace:'nowrap' }}>Overview</button>
            <button type="button" onClick={onLaunchStudio}
              style={{ border:'none', background:'transparent', color:'#4B5563', padding:'5px 14px', borderRadius:'9999px', fontSize:'0.84rem', fontWeight:500, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap' }}>
              Studio
              <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', background:'#E0E7FF', color:'#3730A3', padding:'2px 6px', borderRadius:'9999px', letterSpacing:'0.04em' }}>AI</span>
            </button>
          </div>
        </div>

        {/* Center Nav — Hidden on mobile */}
        <div style={{ display:'flex', alignItems:'center', gap:'26px' }} className="knav-desktop">
          {([['tour','Product Tour'],['capabilities','Capabilities'],['architecture','Architecture']] as [string,string][]).map(([id,label]) => (
            <a key={id} href={`#${id}`} onClick={e=>scrollToSection(e,id)}
              style={{ textDecoration:'none', color:'#374151', fontSize:'0.84rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', transition:'color 0.2s', whiteSpace:'nowrap' }}
              onMouseEnter={e=>(e.currentTarget.style.color='#2563EB')}
              onMouseLeave={e=>(e.currentTarget.style.color='#374151')}>
              {label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexShrink:0 }}>
          <div className="knav-action-desktop" style={{ display:'flex', alignItems:'center', gap:'12px' }}>
            <button type="button" onClick={onLaunchStudio}
              className="knav-launch-btn"
              style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#0F172A', color:'#FFFFFF', padding:'8px 20px', borderRadius:'9999px', fontSize:'0.88rem', fontWeight:600, border:'none', cursor:'pointer', transition:'all 0.2s ease', whiteSpace:'nowrap' }}>
              <span>▷</span>
              <span>{isAuthenticated ? 'Open Studio' : 'Launch Studio'}</span>
            </button>

            {!isAuthenticated ? (
              <button type="button" onClick={onSignIn}
                style={{ background:'transparent', border:'none', color:'#4B5563', fontSize:'0.88rem', fontWeight:600, cursor:'pointer', padding:'8px 12px', whiteSpace:'nowrap' }}>
                Sign In
              </button>
            ) : (
              <span style={{ fontSize:'0.88rem', fontWeight:600, color:'#374151', whiteSpace:'nowrap' }}>👋 {userName?.split(' ')[0] || 'User'}</span>
            )}
          </div>

          <button
            type="button"
            onClick={()=>setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            className="knav-mobile-toggle"
            style={{ display:'none', background:'transparent', border:'none', fontSize:'1.35rem', color:'#0F172A', cursor:'pointer', padding:'6px', lineHeight:1, minWidth:'40px', minHeight:'40px', alignItems:'center', justifyContent:'center' }}>
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="knav-mobile-drawer" style={{ pointerEvents:'auto', position:'absolute', top:'68px', left:'12px', right:'12px', maxWidth:'520px', margin:'0 auto', background:'rgba(255,255,255,0.98)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderRadius:'20px', padding:'20px 22px', boxShadow:'0 24px 60px rgba(0,0,0,0.15)', border:'1px solid rgba(0,0,0,0.08)', display:'flex', flexDirection:'column', gap:'12px', zIndex:100, boxSizing:'border-box' }}>
          {([['tour','Product Tour'],['capabilities','Capabilities'],['architecture','Architecture']] as [string,string][]).map(([id,label]) => (
            <a key={id} href={`#${id}`} onClick={e=>scrollToSection(e as any,id)} style={{ textDecoration:'none', color:'#0F172A', fontSize:'0.95rem', fontWeight:600, padding:'10px 6px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid rgba(0,0,0,0.04)' }}>
              <span>{label}</span>
              <span style={{ color:'#94A3B8', fontSize:'0.85rem' }}>→</span>
            </a>
          ))}
          <div style={{ height:'4px' }} />
          <button type="button" style={{ background:'#0F172A', color:'#FFF', border:'none', borderRadius:'12px', padding:'13px', fontWeight:600, cursor:'pointer', fontSize:'0.95rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%' }} onClick={()=>{ setMobileMenuOpen(false); onLaunchStudio(); }}>
            <span>▷</span>
            <span>{isAuthenticated ? 'Open Studio' : 'Launch Studio'}</span>
          </button>
          {!isAuthenticated && (
            <button type="button" style={{ background:'#F4F4F5', color:'#0F172A', border:'none', borderRadius:'12px', padding:'12px', fontWeight:600, cursor:'pointer', fontSize:'0.92rem', width:'100%' }} onClick={()=>{ setMobileMenuOpen(false); onSignIn(); }}>
              Sign In / Quick Demo
            </button>
          )}
          {isAuthenticated && (
            <div style={{ textAlign:'center', fontSize:'0.85rem', color:'#64748B', paddingTop:'4px' }}>
              Signed in as <strong style={{ color:'#0F172A' }}>{userName || 'User'}</strong>
            </div>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .knav-desktop { display: none !important; }
          .knav-action-desktop { display: none !important; }
          .knav-mobile-toggle { display: inline-flex !important; }
          .knav-pill { padding: 6px 12px 6px 16px !important; width: 94% !important; }
        }
        @media (max-width: 480px) {
          .knav-pill { padding: 6px 8px 6px 12px !important; }
          .knav-brand-group { gap: 8px !important; }
          .knav-brand-title { font-size: 1.12rem !important; }
          .knav-switcher button { padding: 4px 9px !important; font-size: 0.76rem !important; }
        }
      `}</style>
    </header>
  );
};

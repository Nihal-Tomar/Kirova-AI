import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  isAuthenticated?: boolean;
  userName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLaunchStudio,
  onSignIn,
  onSignUp,
  isAuthenticated = false,
  userName,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="landing-navbar-wrapper">
      <nav className={`landing-navbar ${scrolled ? 'landing-navbar-scrolled' : ''}`}>
        {/* Brand Group */}
        <div className="nav-brand-group">
          <a href="#" className="nav-brand-link" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span>kirova<span style={{ fontWeight: 500, color: 'var(--foreground-muted)', marginLeft: '2px' }}>AI</span></span>
            <span className="nav-brand-dot" title="Kirova AI Systems Operational" />
          </a>

          {/* Pill Switcher matching reference: Overview | Studio AI */}
          <div className="nav-pill-switcher">
            <button type="button" className="nav-pill-item active">
              Overview
            </button>
            <button
              type="button"
              className="nav-pill-item"
              onClick={onLaunchStudio}
              title="Open Maintenance Studio"
            >
              <span>Studio</span>
              <span className="nav-pill-badge">AI</span>
            </button>
          </div>
        </div>

        {/* Center Nav Links */}
        <div className="nav-links">
          <a
            href="#tour"
            className="nav-link"
            onClick={e => scrollToSection(e, 'tour')}
          >
            Product Tour
          </a>
          <a
            href="#capabilities"
            className="nav-link"
            onClick={e => scrollToSection(e, 'capabilities')}
          >
            Capabilities
          </a>
          <a
            href="#architecture"
            className="nav-link"
            onClick={e => scrollToSection(e, 'architecture')}
          >
            Architecture
          </a>
        </div>

        {/* Right CTA Actions */}
        <div className="nav-actions">
          <button
            type="button"
            className="btn-nav-launch"
            onClick={onLaunchStudio}
          >
            <span>▷</span>
            <span>{isAuthenticated ? 'Open Studio' : 'Launch Studio'}</span>
          </button>

          {!isAuthenticated ? (
            <>
              <button
                type="button"
                className="nav-signin-link"
                onClick={onSignIn}
              >
                Sign In
              </button>
              <button
                type="button"
                className="btn-nav-signup"
                onClick={onSignUp}
              >
                Sign Up
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>
              👋 {userName?.split(' ')[0] || 'User'}
            </span>
          )}

          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '20px',
            right: '20px',
            background: 'var(--background-paper)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--shadow-dark)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 1001,
            pointerEvents: 'auto',
          }}
        >
          <a
            href="#tour"
            className="nav-link"
            style={{ fontSize: '1rem', padding: '8px 0' }}
            onClick={e => scrollToSection(e, 'tour')}
          >
            Product Tour
          </a>
          <a
            href="#capabilities"
            className="nav-link"
            style={{ fontSize: '1rem', padding: '8px 0' }}
            onClick={e => scrollToSection(e, 'capabilities')}
          >
            Capabilities
          </a>
          <a
            href="#architecture"
            className="nav-link"
            style={{ fontSize: '1rem', padding: '8px 0' }}
            onClick={e => scrollToSection(e, 'architecture')}
          >
            Architecture
          </a>
          <hr style={{ borderColor: 'var(--border-light)', margin: '4px 0' }} />
          <button
            type="button"
            className="btn-hero-primary"
            style={{ justifyContent: 'center' }}
            onClick={() => { setMobileMenuOpen(false); onLaunchStudio(); }}
          >
            ▷ Launch Studio
          </button>
          {!isAuthenticated && (
            <button
              type="button"
              className="btn-hero-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => { setMobileMenuOpen(false); onSignIn(); }}
            >
              Sign In / Quick Demo
            </button>
          )}
        </div>
      )}
    </header>
  );
};

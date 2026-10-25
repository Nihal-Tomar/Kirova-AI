import React from 'react';

interface FooterProps {
  onLaunchStudio: () => void;
  onSignIn: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onLaunchStudio,
  onSignIn,
}) => {
  const currentYear = new Date().getFullYear();

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="landing-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <a href="#" className="footer-logo" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <span>kirova<span style={{ fontWeight: 500, color: 'var(--foreground-muted)', marginLeft: '2px' }}>AI</span></span>
            <span className="nav-brand-dot" />
          </a>
          <p className="footer-desc">
            Evidence-driven industrial maintenance intelligence platform connecting worker-reported faults with historical records, explainable repair-versus-replacement options, and verified outcomes.
          </p>
          <div style={{ marginTop: '16px', fontSize: '0.8125rem', color: 'var(--foreground-muted)' }}>
            Crafted with ❤️ by <strong style={{ color: 'var(--foreground-ink)' }}>Team Sudarshan</strong>
          </div>
        </div>

        <div className="footer-links-group">
          <div>
            <div className="footer-col-title">PRODUCT</div>
            <ul className="footer-col-list">
              <li><a href="#tour" onClick={e => { e.preventDefault(); scrollTo('tour'); }}>Product Tour</a></li>
              <li><a href="#capabilities" onClick={e => { e.preventDefault(); scrollTo('capabilities'); }}>Capabilities</a></li>
              <li><a href="#architecture" onClick={e => { e.preventDefault(); scrollTo('architecture'); }}>Architecture</a></li>
              <li><a href="#" onClick={e => { e.preventDefault(); onLaunchStudio(); }}>Maintenance Studio</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">WORKSPACE</div>
            <ul className="footer-col-list">
              <li><a href="#" onClick={e => { e.preventDefault(); onLaunchStudio(); }}>Launch Studio</a></li>
              <li><a href="#" onClick={e => { e.preventDefault(); onSignIn(); }}>Supervisor Sign In</a></li>
              <li><a href="#" onClick={e => { e.preventDefault(); onSignIn(); }}>Technician Portal</a></li>
              <li><a href="#" onClick={e => { e.preventDefault(); onSignIn(); }}>Demo Accounts</a></li>
            </ul>
          </div>

          <div>
            <div className="footer-col-title">PROJECT</div>
            <ul className="footer-col-list">
              <li><span style={{ color: 'var(--foreground-muted)' }}>HackFront India 2026</span></li>
              <li><span style={{ color: 'var(--foreground-muted)' }}>Open Source & Innovation</span></li>
              <li><span style={{ color: 'var(--foreground-muted)' }}>Kirova AI Version 2.0</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          © {currentYear} Kirova AI — From Voice to Verified Action. Made with ❤️ by Team Sudarshan.
        </div>

        <div className="footer-status-pill">
          <span className="status-dot-green" />
          <span>All Systems Operational (PGlite + Sarvam AI)</span>
        </div>
      </div>
    </footer>
  );
};

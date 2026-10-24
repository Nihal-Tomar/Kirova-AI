import React, { useEffect, useRef, useState } from 'react';

// Extend Window to include the Google Identity Services globals
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  disabled?: boolean;
}

/**
 * Renders the official Google Sign-In button via the GIS popup flow.
 * The credential returned is a signed RS256 Google ID token — sent to the
 * backend for server-side verification. No client secret is involved.
 *
 * Behaviour matrix:
 *   VITE_GOOGLE_CLIENT_ID set  +  GIS script loaded  → renders official Google button
 *   VITE_GOOGLE_CLIENT_ID set  +  GIS script pending  → waits for script load event
 *   VITE_GOOGLE_CLIENT_ID unset in production          → renders nothing (hidden)
 *   VITE_GOOGLE_CLIENT_ID unset in development         → renders a visible config warning
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  disabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const isDev = import.meta.env.DEV === true;

  const [renderState, setRenderState] = useState<
    'idle' | 'waiting' | 'rendered' | 'gis_error'
  >('idle');

  useEffect(() => {
    if (!clientId) return;

    const render = () => {
      if (!window.google?.accounts?.id) {
        setRenderState('gis_error');
        return;
      }
      if (!containerRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: ({ credential }) => {
            window.google?.accounts.id.disableAutoSelect();
            onCredential(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'filled_black',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          // Match the login card max-width (440px card - 80px padding = 360px)
          width: 360,
        });

        setRenderState('rendered');
      } catch (err) {
        console.error('[GoogleSignInButton] Failed to render:', err);
        setRenderState('gis_error');
      }
    };

    if (window.google) {
      render();
    } else {
      setRenderState('waiting');
      const script = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        const onLoad = () => render();
        const onError = () => setRenderState('gis_error');
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', onError, { once: true });
        // Clean up if the component unmounts before the script loads
        return () => {
          script.removeEventListener('load', onLoad);
          script.removeEventListener('error', onError);
        };
      } else {
        // Script tag not in DOM — likely CSP block or misconfigured index.html
        setRenderState('gis_error');
      }
    }
  }, [clientId, onCredential]);

  // ── Nothing to render if no Client ID ──────────────────────────────────────
  if (!clientId) {
    // In development show a clear configuration note instead of silent nothing
    if (isDev) {
      return (
        <div
          role="status"
          aria-label="Google Sign-In not configured"
          style={{
            border: '1px dashed rgba(245, 158, 11, 0.6)',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '0.78125rem',
            color: '#fbbf24',
            background: 'rgba(245, 158, 11, 0.06)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <strong>Google Sign-In not configured</strong>
          <br />
          Set <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4 }}>VITE_GOOGLE_CLIENT_ID</code> in{' '}
          <code style={{ fontSize: '0.72rem', background: 'rgba(0,0,0,0.3)', padding: '1px 5px', borderRadius: 4 }}>client/.env.local</code>
        </div>
      );
    }
    // Production: render nothing — no diagnostic noise for end users
    return null;
  }

  // ── GIS script failed to load ───────────────────────────────────────────────
  if (renderState === 'gis_error') {
    return (
      <div
        role="status"
        style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          textAlign: 'center',
          padding: '8px',
        }}
      >
        Google Sign-In is currently unavailable. Please use email and password.
      </div>
    );
  }

  return (
    <div
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        // Reserve height while GIS button renders to avoid layout shift
        minHeight: renderState === 'rendered' ? undefined : '44px',
        alignItems: 'center',
      }}
    >
      {/* Placeholder shimmer while GIS is loading */}
      {renderState === 'waiting' && (
        <div
          aria-label="Loading Google Sign-In…"
          style={{
            width: '360px',
            height: '44px',
            borderRadius: '4px',
            background: 'rgba(255,255,255,0.04)',
            animation: 'gsi-pulse 1.4s ease-in-out infinite',
          }}
        />
      )}
      <div
        ref={containerRef}
        style={{ display: renderState === 'rendered' ? 'block' : 'none' }}
      />
      <style>{`
        @keyframes gsi-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

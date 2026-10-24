import React, { useEffect, useRef } from 'react';

// Extend the Window interface to include the Google Identity Services globals
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
 * Renders the official Google Sign-In button using the GIS library.
 * The credential returned is a signed Google ID token — it is sent
 * directly to the backend for server-side verification.
 * No client secret is used or needed here.
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onCredential,
  disabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const render = () => {
      if (!window.google || !containerRef.current) return;

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
        width: 320,
      });
    };

    // GIS might already be loaded or might still be loading
    if (window.google) {
      render();
    } else {
      // Wait for the async script to finish loading
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (script) {
        script.addEventListener('load', render, { once: true });
      }
    }
  }, [clientId, onCredential]);

  if (!clientId) {
    // VITE_GOOGLE_CLIENT_ID not set — do not render anything
    return null;
  }

  return (
    <div
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        display: 'flex',
        justifyContent: 'center',
        marginTop: '8px',
      }}
    >
      <div ref={containerRef} />
    </div>
  );
};

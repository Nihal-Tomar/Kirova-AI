import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LandingPage } from './pages/LandingPage';
import { GoogleSignInButton } from './components/GoogleSignInButton';
// Import landing design tokens for the login page design extension
import './styles/landing.css';

// ── API Configuration ─────────────────────────────────────────
// In production, VITE_API_URL must be set (e.g. https://kirova-api.onrender.com).
// In development, Vite's proxy forwards /api to localhost:5000 so the env var is optional.
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

/**
 * Centralized API request helper.
 * Distinguishes: network errors, non-JSON responses, server errors (4xx/5xx).
 * Never leaks stack traces or internal details to the UI.
 */
async function apiRequest(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // In production (not DEV), fail fast if VITE_API_URL was never set —
  // rather than silently sending requests to the Vercel SPA origin.
  const url = API_BASE ? `${API_BASE}${path}` : path;
  if (!import.meta.env.DEV && !API_BASE) {
    throw new Error('API URL is not configured. Add VITE_API_URL to your Vercel environment variables.');
  }

  // Catch network-level failures (DNS, CORS preflight, no server) separately
  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    if (!API_BASE) {
      throw new Error('API URL is not configured. Add VITE_API_URL to your Vercel environment variables.');
    }
    throw new Error(`Cannot reach the server (${API_BASE}). Check your network or the backend deployment.`);
  }

  // Try to parse JSON; fall back gracefully for HTML error pages (e.g. 502 nginx)
  let data: any;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    const text = await res.text();
    if (!res.ok) throw new Error(`Server returned ${res.status} ${res.statusText}.`);
    throw new Error(`Unexpected response format from server: ${text.slice(0, 80)}`);
  }

  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

async function apiUpload(path: string, formData: FormData, token: string) {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch {
    throw new Error('Cannot reach the server. Check your network or the backend deployment.');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

// ── Types ────────────────────────────────────────────────────
type Role = 'SUPERVISOR' | 'REPORTER_TECHNICIAN';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  organizationId: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
}

// ── Auth Context ─────────────────────────────────────────────
const AuthContext = createContext<{
  auth: AuthState;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
}>({ auth: { user: null, token: null }, login: async () => {}, googleLogin: async () => {}, logout: () => {} });

// ── Toast Context ─────────────────────────────────────────────
interface Toast { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; }
const ToastContext = createContext<{ addToast: (t: Omit<Toast, 'id'>) => void }>({ addToast: () => {} });

// ── Toast Provider ────────────────────────────────────────────
function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
  }, []);

  const icons: Record<Toast['type'], string> = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{icons[t.type]}</span>
            <div className="toast-body">
              <div className="toast-title">{t.title}</div>
              {t.message && <div className="toast-message">{t.message}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() { return useContext(ToastContext); }
function useAuth() { return useContext(AuthContext); }

// ── Status Helpers ────────────────────────────────────────────
function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'badge-draft', AWAITING_CLARIFICATION: 'badge-clarification',
    AWAITING_REVIEW: 'badge-review', CONVERTED_TO_WORK_ORDER: 'badge-approved',
    REJECTED: 'badge-rejected', AWAITING_APPROVAL: 'badge-awaiting',
    APPROVED: 'badge-approved', ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-progress', RESOLVED: 'badge-resolved',
    VERIFIED_CLOSED: 'badge-closed', RETURNED_FOR_REWORK: 'badge-clarification',
  };
  return map[status] || 'badge-draft';
}

function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'priority-critical', HIGH: 'priority-high',
    MEDIUM: 'priority-medium', LOW: 'priority-low',
  };
  return map[priority] || 'priority-low';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Shared UI Components ──────────────────────────────────────
function Modal({ open, onClose, title, children, size = '' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: string }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="loading-spinner" />;
}

function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <span className="empty-state-title">{title}</span>
      <span className="empty-state-desc">{desc}</span>
    </div>
  );
}

// ── Voice Recorder Component ──────────────────────────────────
function VoiceRecorder({ onAudioReady }: { onAudioReady: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioReady(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      alert('Microphone access denied');
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="voice-recorder">
      {recording && (
        <div className="audio-visualizer">
          {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="audio-bar" />)}
        </div>
      )}
      {recording && <div className="recorder-timer">{fmt(seconds)}</div>}
      <button className={`recorder-btn ${recording ? 'recording' : ''}`} onClick={recording ? stop : start}>
        {recording ? '⏹' : '🎙️'}
      </button>
      <div className="recorder-status">
        {recording ? 'Recording… tap to stop' : 'Tap to record voice incident'}
      </div>
      {!recording && <p className="text-xs text-muted mt-4">Supports Hindi, Hinglish, Tamil, Telugu, English</p>}
    </div>
  );
}

// ── Evidence Panel ────────────────────────────────────────────
function EvidencePanel({ evidence }: { evidence: any[] }) {
  if (!evidence || evidence.length === 0) return null;
  const labelMap: Record<string, string> = {
    EXTRACTED: 'evidence-extracted', RETRIEVED: 'evidence-retrieved',
    INFERRED: 'evidence-inferred', MISSING: 'evidence-missing', AMBIGUOUS: 'evidence-ambiguous',
  };
  return (
    <div className="evidence-panel">
      {evidence.map((ev: any, i: number) => (
        <div key={i} className="evidence-item">
          <span className={`evidence-label-badge ${labelMap[ev.label] || 'evidence-inferred'}`}>{ev.label}</span>
          <div className="evidence-details">
            <div className="evidence-field">{ev.field_name?.replace(/_/g, ' ')}</div>
            <div className="evidence-value">{ev.raw_value || '—'}</div>
            {ev.source_reference && <div className="evidence-source">📎 {ev.source_reference}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Decision Support & Repair vs Replace Component ─────────────
function getFeasibilityBadge(feasibility: string) {
  switch (feasibility) {
    case 'STRONGLY_INDICATED': return <span className="badge badge-approved">✓ Strongly Indicated</span>;
    case 'VIABLE_OPTION': return <span className="badge badge-review">Viable Option</span>;
    case 'CONDITIONAL': return <span className="badge badge-clarification">⚠️ Conditional</span>;
    case 'NOT_RECOMMENDED': return <span className="badge badge-rejected">✕ Not Recommended</span>;
    default: return <span className="badge badge-draft">{feasibility}</span>;
  }
}

function DecisionSupportPanel({ data, loading }: { data: any; loading: boolean }) {
  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <Spinner />
        <div className="text-xs text-muted mt-2">Evaluating repair vs replace decision matrix…</div>
      </div>
    );
  }
  if (!data || !data.options) {
    return <EmptyState icon="⚖️" title="Decision analysis unavailable" desc="Unable to generate decision support report for this case." />;
  }

  const optIcons: Record<string, string> = {
    INSPECT: '🔍',
    REPAIR: '🛠️',
    REPLACE_COMPONENT: '🔄',
    REPLACE_MACHINE: '🏭',
  };

  return (
    <div className="decision-support-panel" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {/* Advisory Banner */}
      <div className="alert alert-info" style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <span>⚖️</span>
        <div>
          <strong>ADVISORY DECISION SUPPORT ONLY:</strong> {data.advisoryDisclaimer}
        </div>
      </div>

      {/* Summary Matrix Header */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 'var(--space-3)'
      }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Algorithmic Recommendation</div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--brand-primary-light)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{optIcons[data.summary?.recommendedOption] || '💡'}</span>
            <span>{data.options.find((o: any) => o.optionKey === data.summary?.recommendedOption)?.title || data.summary?.recommendedOption}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
          <div>
            <span className="text-muted">Asset Recurrence:</span>{' '}
            <strong style={{ color: data.summary?.historicalRecurrenceCountOnAsset > 1 ? '#ef4444' : 'var(--text-primary)' }}>
              {data.summary?.historicalRecurrenceCountOnAsset}×
            </strong>
          </div>
          <div>
            <span className="text-muted">Peer Benchmarks:</span>{' '}
            <strong>{data.summary?.peerEquipmentVerifiedRepairsCount} verified</strong>
          </div>
        </div>
      </div>

      {/* 4 Decision Option Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {data.options.map((opt: any) => {
          const isRec = opt.optionKey === data.summary?.recommendedOption;
          return (
            <div
              key={opt.optionKey}
              style={{
                background: isRec ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-card)',
                border: isRec ? '1px solid var(--brand-primary)' : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-4)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{optIcons[opt.optionKey] || '•'}</span>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{opt.title}</span>
                  {isRec && <span className="badge badge-approved" style={{ fontSize: '10px' }}>★ Recommended</span>}
                </div>
                <div>{getFeasibilityBadge(opt.feasibility)}</div>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {opt.summary}
              </div>

              {/* Rationale Pill */}
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '12px', marginBottom: '10px', borderLeft: '3px solid var(--brand-primary)' }}>
                <strong>Rationale:</strong> {opt.feasibilityRationale}
              </div>

              {/* Cost & Downtime Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px', fontSize: '11px' }}>
                <div style={{ background: 'var(--bg-base)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-muted">Estimated Cost:</span>{' '}
                  <strong style={{ color: opt.estimatedCost?.category === 'CAPITAL_EXPENDITURE' ? '#ef4444' : 'var(--brand-accent)' }}>
                    {opt.estimatedCost?.category}
                  </strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.estimatedCost?.description}</div>
                </div>
                <div style={{ background: 'var(--bg-base)', padding: '6px 10px', borderRadius: 'var(--radius-sm)' }}>
                  <span className="text-muted">Expected Downtime:</span>{' '}
                  <strong>{opt.estimatedDowntime?.range}</strong>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{opt.estimatedDowntime?.basis}</div>
                </div>
              </div>

              {/* Supporting Evidence List */}
              {opt.supportingEvidence?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Supporting Traceable Evidence:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {opt.supportingEvidence.map((ev: string, i: number) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tradeoffs & Risks */}
              {opt.tradeoffsAndRisks?.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                    Tradeoffs & Safety Implications:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {opt.tradeoffsAndRisks.map((tr: string, i: number) => (
                      <li key={i}>{tr}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {opt.nextSteps && (
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '6px' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Action Required:</strong> {opt.nextSteps}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Evidence Graph Component ──────────────────────────────────
function EvidenceGraphPanel({ data, loading }: { data: any; loading: boolean }) {
  const [selectedNode, setSelectedNode] = useState<any>(null);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
        <Spinner />
        <div className="text-xs text-muted mt-2">Constructing source-linked evidence graph…</div>
      </div>
    );
  }
  if (!data || !data.nodes || data.nodes.length === 0) {
    return <EmptyState icon="🕸️" title="No graph data" desc="Evidence relationships could not be loaded." />;
  }

  const typeConfig: Record<string, { icon: string; color: string; border: string }> = {
    INCIDENT: { icon: '🚨', color: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
    MACHINE: { icon: '⚙️', color: 'rgba(99, 102, 241, 0.15)', border: '#6366f1' },
    COMPONENT: { icon: '🧩', color: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4' },
    WORK_ORDER: { icon: '📜', color: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
    ACTION: { icon: '🔧', color: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6' },
    OUTCOME: { icon: '✅', color: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
    SOURCE_RECORD: { icon: '📎', color: 'rgba(100, 116, 139, 0.15)', border: '#64748b' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Interactive entity relationship graph backed by verified PostgreSQL records. Click any node to inspect traceable audit details.
      </div>

      {/* Nodes visual cluster */}
      <div style={{
        background: 'var(--bg-base)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        alignItems: 'center'
      }}>
        {data.nodes.map((n: any) => {
          const cfg = typeConfig[n.type] || { icon: '•', color: 'rgba(255,255,255,0.05)', border: '#fff' };
          const isSelected = selectedNode?.id === n.id;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => setSelectedNode(n)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: cfg.color,
                border: `1.5px solid ${isSelected ? '#fff' : cfg.border}`,
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                color: 'var(--text-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 0 10px rgba(99, 102, 241, 0.5)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cfg.icon}</span>
              <span style={{ fontWeight: 600 }}>{n.label}</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>[{n.type}]</span>
            </button>
          );
        })}
      </div>

      {/* Relationship Edges Summary */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
          Documented Relationships ({data.edges?.length || 0}):
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
          {data.edges?.map((e: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <span className="font-mono text-xs text-muted">{e.source}</span>
              <span style={{ color: 'var(--brand-primary-light)', fontSize: '11px', fontWeight: 600 }}>──[{e.relationship}]──▶</span>
              <span className="font-mono text-xs text-muted">{e.target}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>({e.label})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--brand-primary)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-4)',
          position: 'relative'
        }}>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            style={{ position: 'absolute', top: '10px', right: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}
          >
            ✕
          </button>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            {selectedNode.label}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--brand-primary-light)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
            Node Type: {selectedNode.type} · ID: {selectedNode.id}
          </div>
          <pre style={{ margin: 0, padding: '8px', background: 'var(--bg-base)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-secondary)', overflowX: 'auto', fontFamily: 'var(--font-mono)' }}>
            {JSON.stringify(selectedNode.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Login Page ────────────────────────────────────────────────
// Styled with the landing design system tokens (Pearl White / Midnight Indigo)
// so it feels like a natural extension of the homepage.
function LoginPage({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const { login, googleLogin } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg: string = err.message || 'Sign in failed';
      // Show inline field error for credential failures; toast for everything else
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credentials')) {
        setFieldError('Incorrect email or password. Please try again.');
      } else {
        addToast({ type: 'error', title: 'Sign in failed', message: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    setFieldError('');
    setLoading(true);
    try {
      await googleLogin(credential);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Google Sign-In failed', message: err.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Uses landing.css cream background + dark-teal card — matching the homepage palette
    <div className="kirova-login-page">
      {/* Subtle ambient glow matching hero section */}
      <div className="kirova-login-glow" aria-hidden="true" />

      <div className="kirova-login-card">
        {/* Back link */}
        {onBackToLanding && (
          <button
            type="button"
            className="kirova-login-back"
            onClick={onBackToLanding}
            aria-label="Return to homepage"
          >
            ← Back to Homepage
          </button>
        )}

        {/* Brand header — matches Navbar logo treatment */}
        <header className="kirova-login-header">
          <div className="kirova-login-logo" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="10" fill="#111329" />
              <path d="M14 11V37" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" />
              <path d="M33 13L21 24L34 37" stroke="#55E7B0" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="21" cy="24" r="2.5" fill="#D9CCFF" />
            </svg>
          </div>
          <h1 className="kirova-login-wordmark">
            kirova<span style={{ fontWeight: 500, color: 'var(--foreground-muted)', marginLeft: 2 }}>AI</span>
          </h1>
          <p className="kirova-login-tagline">From Voice to Verified Action</p>
        </header>

        {/* Google Sign-In — prominent, above email form */}
        <div className="kirova-login-google-wrap">
          <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
        </div>

        {/* Elegant OR divider */}
        <div className="kirova-login-divider" aria-hidden="true">
          <span className="kirova-login-divider-line" />
          <span className="kirova-login-divider-text">or continue with email</span>
          <span className="kirova-login-divider-line" />
        </div>

        {/* Inline error banner */}
        {fieldError && (
          <div className="kirova-login-error" role="alert" aria-live="polite">
            <span aria-hidden="true">⚠</span> {fieldError}
          </div>
        )}

        {/* Email / password form */}
        <form onSubmit={handleLogin} noValidate>
          <div className="kirova-form-group">
            <label htmlFor="login-email" className="kirova-form-label">
              Email address <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="login-email"
              className="kirova-form-control"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setFieldError(''); }}
              placeholder="you@example.com"
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!fieldError}
              disabled={loading}
            />
          </div>

          <div className="kirova-form-group">
            <label htmlFor="login-password" className="kirova-form-label">
              Password <span aria-hidden="true" style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="login-password"
              className="kirova-form-control"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setFieldError(''); }}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              aria-required="true"
              aria-invalid={!!fieldError}
              disabled={loading}
            />
          </div>

          <button
            id="login-submit"
            className="kirova-login-submit"
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading
              ? <><span className="kirova-login-spinner" aria-hidden="true" /> Signing in…</>
              : <><span>Sign In</span><span aria-hidden="true">→</span></>
            }
          </button>
        </form>

        {/* Quick Demo Role Selector */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', fontWeight: 600 }}>
            ⚡ Hackathon Demo Accounts (1-Click)
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.35)' }}
              onClick={() => { setEmail('supervisor@kirova.ai'); setPassword('Supervisor@123'); }}
            >
              🔵 Supervisor (Priya)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.35)' }}
              onClick={() => { setEmail('tech.rajesh@kirova.ai'); setPassword('Tech@123'); }}
            >
              🟢 Technician (Rajesh)
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '11px', padding: '4px 10px', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.35)' }}
              onClick={() => { setEmail('worker.amit@kirova.ai'); setPassword('Worker@123'); }}
            >
              🟡 Worker (Amit)
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="kirova-login-footer-note">
          New Google users are automatically provisioned as Technicians.
        </p>
      </div>
    </div>
  );
}

// ── Sidebar Navigation ────────────────────────────────────────
function Sidebar({ view, setView, onExitToLanding }: { view: string; setView: (v: string) => void; onExitToLanding?: () => void }) {
  const { auth, logout } = useAuth();
  const user = auth.user!;
  const isSupervisor = user.role === 'SUPERVISOR';

  const commonNav = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  ];

  const reporterNav = [
    { id: 'new-report', icon: '📝', label: 'New Report' },
    { id: 'my-reports', icon: '📋', label: 'My Reports' },
  ];

  const technicianNav = [
    { id: 'my-workorders', icon: '🔧', label: 'My Work Orders' },
  ];

  const supervisorNav = [
    { id: 'incidents', icon: '🚨', label: 'All Incidents' },
    { id: 'workorders', icon: '📦', label: 'Work Orders' },
    { id: 'intelligence', icon: '🧠', label: 'Intelligence' },
    { id: 'audit', icon: '🔒', label: 'Audit Logs' },
  ];

  const navItems = [
    ...commonNav,
    ...reporterNav,
    ...(isSupervisor ? supervisorNav : technicianNav),
  ];

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon" style={{ background: '#111329', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
            <path d="M14 11V37" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
            <path d="M33 13L21 24L34 37" stroke="#55E7B0" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="21" cy="24" r="3" fill="#D9CCFF" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-name">Kirova AI</span>
          <span className="sidebar-logo-tagline">Voice → Verified Action</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(item => (
          <button key={item.id} id={`nav-${item.id}`} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
            <span className="nav-item-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
        {onExitToLanding && (
          <button
            type="button"
            className="nav-item"
            style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}
            onClick={onExitToLanding}
            title="Return to Public Homepage"
          >
            <span className="nav-item-icon">🌐</span>
            Public Website
          </button>
        )}
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{user.name}</div>
          <div className="user-role">{user.role === 'SUPERVISOR' ? 'Supervisor' : 'Technician'}</div>
        </div>
        <button className="user-logout-btn" title="Sign out" onClick={logout}>🚪</button>
      </div>
    </nav>
  );
}

// ── Dashboard View ────────────────────────────────────────────
function DashboardView() {
  const { auth } = useAuth();
  const isSupervisor = auth.user?.role === 'SUPERVISOR';
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupervisor) { setLoading(false); return; }
    apiRequest('/api/dashboard', {}, auth.token!).then(d => { setMetrics(d); setLoading(false); }).catch(() => setLoading(false));
  }, [isSupervisor, auth.token]);

  if (!isSupervisor) return <ReporterDashboard />;
  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading dashboard…</span></div>;
  if (!metrics) return <EmptyState icon="📊" title="No data available" desc="Dashboard metrics unavailable" />;

  const m = metrics.metrics;
  const stats = [
    { label: 'Open Incidents', value: m.openIncidents, icon: '🚨', color: '#ef4444' },
    { label: 'Awaiting Review', value: m.awaitingReviewIncidents, icon: '👁️', color: '#f59e0b' },
    { label: 'Awaiting Approval', value: m.awaitingApprovalOrders, icon: '⏳', color: '#6366f1' },
    { label: 'Active Work Orders', value: m.activeWorkOrders, icon: '🔧', color: '#06b6d4' },
    { label: 'Pending Verification', value: m.resolvedAwaitingVerification, icon: '🔍', color: '#8b5cf6' },
    { label: 'Verified & Closed', value: m.verifiedClosedOrders, icon: '✅', color: '#10b981' },
    { label: 'Total Machines', value: m.totalMachines, icon: '⚙️', color: '#64748b' },
    { label: 'Avg Resolution (h)', value: m.averageResolutionHours?.toFixed(1) ?? '—', icon: '⏱️', color: '#f59e0b' },
  ];

  return (
    <div>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': s.color } as any}>
            <div className="stat-icon" style={{ background: `${s.color}22` }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {metrics.topRecurringFaults?.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🧠 Recurring Fault Clusters</div>
              <div className="card-subtitle">Machines with repeated incidents by symptom pattern</div>
            </div>
          </div>
          {metrics.topRecurringFaults.map((f: any, i: number) => (
            <div key={i} className="fault-cluster">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm">{f.machine_name || f.machine_id}</span>
                  <span className="badge badge-draft text-xs" style={{ marginLeft: 8 }}>{f.symptom_category}</span>
                </div>
                <span className="font-bold text-accent">{f.incident_count}×</span>
              </div>
              <div className="fault-frequency">
                <div className="frequency-bar">
                  <div className="frequency-fill" style={{ width: `${Math.min(100, f.incident_count * 20)}%` }} />
                </div>
                <span className="text-xs text-muted">{f.asset_tag}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReporterDashboard() {
  const { auth } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/reports', {}, auth.token!).then(d => { setReports(d.reports || []); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token]);

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  const stats = [
    { label: 'Total Reports', value: reports.length, icon: '📋', color: '#6366f1' },
    { label: 'In Review', value: reports.filter(r => r.status === 'AWAITING_REVIEW').length, icon: '👁️', color: '#06b6d4' },
    { label: 'Needs Clarification', value: reports.filter(r => r.status === 'AWAITING_CLARIFICATION').length, icon: '❓', color: '#f59e0b' },
    { label: 'Converted to WO', value: reports.filter(r => r.status === 'CONVERTED_TO_WORK_ORDER').length, icon: '✅', color: '#10b981' },
  ];

  return (
    <div>
      <div className="stat-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card" style={{ '--stat-color': s.color } as any}>
            <div className="stat-icon" style={{ background: `${s.color}22` }}>{s.icon}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>
      {reports.length === 0 ? (
        <EmptyState icon="📋" title="No reports yet" desc="Submit your first incident report using the 'New Report' tab." />
      ) : (
        <div className="card">
          <div className="card-header"><div className="card-title">Recent Reports</div></div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Report #</th><th>Machine</th><th>Symptom</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {reports.slice(0, 10).map(r => (
                  <tr key={r.id}>
                    <td className="td-primary font-mono text-xs">{r.report_number}</td>
                    <td>{r.machine_name || r.asset_tag || '—'}</td>
                    <td><span className="truncate" style={{ maxWidth: 200, display: 'block' }}>{r.symptom_text}</span></td>
                    <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{formatStatus(r.status)}</span></td>
                    <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Report View ───────────────────────────────────────────
function NewReportView({ onDone }: { onDone: () => void }) {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [step, setStep] = useState<'capture' | 'transcribe' | 'extract' | 'clarify' | 'done'>('capture');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [text, setText] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [incident, setIncident] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  useEffect(() => {
    apiRequest('/api/machines', {}, auth.token!).then(d => setMachines(d.machines || [])).catch(() => {});
  }, [auth.token]);

  const steps = [
    { id: 'capture', label: 'Capture' },
    { id: 'transcribe', label: 'Transcribe' },
    { id: 'extract', label: 'AI Extract' },
    { id: 'clarify', label: 'Clarify' },
    { id: 'done', label: 'Done' },
  ];
  const stepOrder = ['capture', 'transcribe', 'extract', 'clarify', 'done'];
  const stepIdx = stepOrder.indexOf(step);

  const handleCapture = async () => {
    if (mode === 'text' && !text.trim()) { addToast({ type: 'error', title: 'Please enter a description' }); return; }
    if (mode === 'voice' && !audioBlob) { addToast({ type: 'error', title: 'Please record audio first' }); return; }
    setLoading(true);
    try {
      let inc;
      if (mode === 'voice' && audioBlob) {
        const fd = new FormData();
        fd.append('audio', audioBlob, 'recording.webm');
        inc = await apiUpload('/api/reports', fd, auth.token!);
      } else {
        inc = await apiRequest('/api/reports', { method: 'POST', body: JSON.stringify({ text }) }, auth.token!);
      }
      setIncident(inc);
      setStep('transcribe');
      addToast({ type: 'success', title: 'Report created', message: inc.reportNumber });
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setLoading(false); }
  };

  const handleTranscribe = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/reports/${incident.id}/transcribe`, { method: 'POST' }, auth.token!);
      setIncident((prev: any) => ({ ...prev, correctedTranscript: res.correctedTranscript }));
      setStep('extract');
      addToast({ type: 'success', title: 'Transcription complete', message: res.isMockTranscription ? 'Using mock transcription (no Whisper key)' : 'Live transcription' });
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setLoading(false); }
  };

  const handleExtract = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/api/reports/${incident.id}/extract`, { method: 'POST' }, auth.token!);
      setExtraction(res);
      setSelectedMachineId(res.extracted?.resolvedMachineId || '');
      setStep('clarify');
      addToast({ type: 'success', title: 'AI extraction complete' });
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setLoading(false); }
  };

  const handleClarify = async () => {
    setLoading(true);
    try {
      await apiRequest(`/api/reports/${incident.id}/clarify`, { method: 'POST', body: JSON.stringify({ selectedMachineId, additionalDetails }) }, auth.token!);
      setStep('done');
      addToast({ type: 'success', title: 'Report submitted for supervisor review!' });
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Step Indicator */}
      <div className="step-indicator">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            {i > 0 && <div className={`step-connector ${i <= stepIdx ? 'completed' : ''}`} />}
            <div className={`step ${i < stepIdx ? 'completed' : i === stepIdx ? 'active' : ''}`}>
              <div className="step-number">{i < stepIdx ? '✓' : i + 1}</div>
              <div className="step-label">{s.label}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Step: Capture */}
      {step === 'capture' && (
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">📝 Report Incident</div><div className="card-subtitle">Describe the machine fault in any language</div></div>
          </div>
          <div className="tabs">
            <button className={`tab-btn ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>✍️ Text</button>
            <button className={`tab-btn ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')}>🎙️ Voice</button>
          </div>
          {mode === 'text' ? (
            <div className="form-group">
              <label className="form-label required">Incident Description</label>
              <textarea id="report-text" className="form-control" rows={5} value={text} onChange={e => setText(e.target.value)}
                placeholder="e.g., Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai. Pichle hafte bhi yahi problem thi." />
              <span className="form-hint">Hindi, Hinglish, Tamil, Telugu, English — all supported</span>
            </div>
          ) : (
            <VoiceRecorder onAudioReady={blob => { setAudioBlob(blob); addToast({ type: 'success', title: 'Audio recorded!', message: 'Click Next to continue.' }); }} />
          )}
          {audioBlob && mode === 'voice' && (
            <div className="alert alert-success mt-4">🎤 Audio recorded ({(audioBlob.size / 1024).toFixed(1)} KB). Ready to submit.</div>
          )}
          <div className="modal-footer" style={{ borderTop: 'none', marginTop: 'var(--space-5)', paddingTop: 0 }}>
            <button id="capture-submit" className="btn btn-primary" onClick={handleCapture} disabled={loading}>
              {loading ? <><Spinner /> Submitting…</> : 'Next: Transcribe →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Transcribe */}
      {step === 'transcribe' && (
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🎤 Transcription</div><div className="card-subtitle">Convert audio to text for AI processing</div></div>
          </div>
          <div className="alert alert-info">
            📋 Report <strong>{incident?.reportNumber}</strong> created. Click below to run AI transcription.
          </div>
          {incident?.correctedTranscript && (
            <div className="form-group">
              <label className="form-label">Transcript</label>
              <textarea className="form-control" rows={3} value={incident.correctedTranscript} onChange={e => setIncident((p: any) => ({ ...p, correctedTranscript: e.target.value }))} />
              <span className="form-hint">You can edit the transcript before extraction</span>
            </div>
          )}
          <div className="modal-footer" style={{ borderTop: 'none', marginTop: 'var(--space-5)', paddingTop: 0 }}>
            <button className="btn btn-primary" onClick={handleTranscribe} disabled={loading}>
              {loading ? <><Spinner /> Transcribing…</> : '🔊 Transcribe & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Extract */}
      {step === 'extract' && (
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🧠 AI Extraction</div><div className="card-subtitle">Extract structured fields from natural language</div></div>
          </div>
          {incident?.correctedTranscript && (
            <div className="form-group">
              <label className="form-label">Transcript to Analyze</label>
              <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{incident.correctedTranscript}"
              </div>
            </div>
          )}
          <div className="modal-footer" style={{ borderTop: 'none', marginTop: 'var(--space-5)', paddingTop: 0 }}>
            <button className="btn btn-primary" onClick={handleExtract} disabled={loading}>
              {loading ? <><Spinner /> Extracting…</> : '🤖 Run AI Extraction →'}
            </button>
          </div>
        </div>
      )}

      {/* Step: Clarify */}
      {step === 'clarify' && extraction && (
        <div className="two-col" style={{ alignItems: 'start' }}>
          <div className="card">
            <div className="card-header">
              <div><div className="card-title">✅ Extracted Fields</div><div className="card-subtitle">Review and clarify AI results</div></div>
            </div>
            <div className="info-grid" style={{ marginBottom: 'var(--space-5)' }}>
              {[
                ['Machine', extraction.extracted?.resolvedMachineName || extraction.extracted?.machineReference || '—'],
                ['Asset Tag', extraction.extracted?.resolvedMachineTag || '—'],
                ['Symptom Category', extraction.extracted?.symptomCategory || '—'],
                ['Urgency', extraction.extracted?.suggestedUrgency || '—'],
                ['Recurrence', extraction.extracted?.recurrenceClaimed ? '⚠️ Yes' : 'No'],
                ['Reported Time', extraction.extracted?.reportedTime || '—'],
              ].map(([label, value]) => (
                <div key={label} className="info-item">
                  <span className="info-label">{label}</span>
                  <span className="info-value">{value}</span>
                </div>
              ))}
            </div>

            {extraction.disambiguation?.isAmbiguous && (
              <div className="alert alert-warning">
                ⚠️ Machine ambiguous. {extraction.disambiguation.clarificationQuestion}
              </div>
            )}

            <div className="form-group">
              <label className="form-label required">Confirm Machine</label>
              <select id="clarify-machine" className="form-control" value={selectedMachineId} onChange={e => setSelectedMachineId(e.target.value)}>
                <option value="">Select machine…</option>
                {machines.map(m => (
                  <option key={m.id} value={m.id}>{m.asset_tag} — {m.name} ({m.location})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details (optional)</label>
              <textarea id="clarify-details" className="form-control" rows={3} value={additionalDetails} onChange={e => setAdditionalDetails(e.target.value)} placeholder="Any additional context…" />
            </div>

            <div className="flex gap-3 justify-between">
              <button className="btn btn-primary" onClick={handleClarify} disabled={loading}>
                {loading ? <><Spinner /> Submitting…</> : '✅ Submit for Review →'}
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">📎 Evidence Provenance</div></div>
            <EvidencePanel evidence={extraction.evidence || []} />
            {extraction.groundedHistory?.length > 0 && (
              <>
                <div className="divider" />
                <div className="card-title mb-4" style={{ fontSize: 14 }}>📚 Historical Context</div>
                {extraction.groundedHistory.slice(0, 3).map((h: any, i: number) => (
                  <div key={i} className="fault-cluster">
                    <div className="font-semibold text-sm">{h.report_number}</div>
                    <div className="text-xs text-muted">{h.symptom_text?.slice(0, 80)}…</div>
                    <div className="text-xs text-muted mt-2">{formatDate(h.created_at)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === 'done' && (
        <div className="card text-center" style={{ padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 56, marginBottom: 'var(--space-4)' }}>🎉</div>
          <h2>Report Submitted!</h2>
          <p className="text-secondary mt-4 mb-6">Your incident report is now awaiting supervisor review. You'll see updates in My Reports.</p>
          <div className="flex gap-3 justify-center">
            <button className="btn btn-primary" onClick={() => { setStep('capture'); setIncident(null); setExtraction(null); setText(''); setAudioBlob(null); }}>
              + New Report
            </button>
            <button className="btn btn-ghost" onClick={onDone}>View My Reports →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── My Reports View ───────────────────────────────────────────
function MyReportsView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    apiRequest('/api/reports', {}, auth.token!).then(d => { setReports(d.reports || []); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const d = await apiRequest(`/api/reports/${id}`, {}, auth.token!);
      setSelected(d);
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setDetailLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  return (
    <div>
      {detailLoading && <div className="loading-overlay"><Spinner /></div>}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Report: ${selected?.report_number}`} size="modal-lg">
        {selected && (
          <div>
            <div className="flex gap-3 items-center mb-4">
              <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{formatStatus(selected.status)}</span>
              <span className="badge badge-draft">{selected.input_channel}</span>
            </div>
            <div className="info-grid mb-6">
              {[
                ['Machine', selected.machine_name || '—'],
                ['Asset Tag', selected.asset_tag || '—'],
                ['Site', selected.site_name || '—'],
                ['Reporter', selected.reporter_name],
                ['Urgency', selected.urgency_suggestion || '—'],
                ['Category', selected.symptom_category || '—'],
              ].map(([l, v]) => <div key={l} className="info-item"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>)}
            </div>
            {selected.corrected_transcript && (
              <div className="form-group">
                <label className="form-label">Transcript</label>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{selected.corrected_transcript}"
                </div>
              </div>
            )}
            {selected.symptom_text && (
              <div className="form-group">
                <label className="form-label">AI Symptom Description</label>
                <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 13 }}>
                  {selected.symptom_text}
                </div>
              </div>
            )}
            {selected.clarification_question && (
              <div className="alert alert-warning">❓ {selected.clarification_question}</div>
            )}
            {selected.evidence?.length > 0 && (
              <>
                <div className="card-title mb-3" style={{ fontSize: 14 }}>📎 Evidence</div>
                <EvidencePanel evidence={selected.evidence} />
              </>
            )}
          </div>
        )}
      </Modal>

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Incident Reports</div>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
        {reports.length === 0 ? (
          <EmptyState icon="📋" title="No reports yet" desc="Go to New Report to file your first incident." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Report #</th><th>Channel</th><th>Machine</th><th>Symptom</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="td-primary font-mono text-xs">{r.report_number}</td>
                    <td><span className="badge badge-draft text-xs">{r.input_channel}</span></td>
                    <td>{r.machine_name || '—'}</td>
                    <td><span className="truncate" style={{ maxWidth: 180, display: 'block' }} title={r.symptom_text}>{r.symptom_text?.slice(0, 50)}{r.symptom_text?.length > 50 ? '…' : ''}</span></td>
                    <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{formatStatus(r.status)}</span></td>
                    <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => openDetail(r.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── All Incidents View (Supervisor) ───────────────────────────
function IncidentsView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [modalTab, setModalTab] = useState<'intake' | 'decision' | 'graph' | 'history'>('intake');
  const [decisionSupport, setDecisionSupport] = useState<any>(null);
  const [evidenceGraph, setEvidenceGraph] = useState<any>(null);
  const [dsLoading, setDsLoading] = useState(false);
  const [egLoading, setEgLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [priority, setPriority] = useState('MEDIUM');

  const load = useCallback(() => {
    const q = filterStatus ? `?status=${filterStatus}` : '';
    apiRequest(`/api/reports${q}`, {}, auth.token!).then(d => { setReports(d.reports || []); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setModalTab('intake');
    setDecisionSupport(null);
    setEvidenceGraph(null);
    try {
      const d = await apiRequest(`/api/reports/${id}`, {}, auth.token!);
      setSelected(d);

      // Pre-load decision support & evidence graph for supervisor analysis
      setDsLoading(true);
      apiRequest(`/api/incidents/${id}/decision-support`, {}, auth.token!)
        .then(ds => setDecisionSupport(ds))
        .catch(() => {})
        .finally(() => setDsLoading(false));

      setEgLoading(true);
      apiRequest(`/api/incidents/${id}/evidence-graph`, {}, auth.token!)
        .then(eg => setEvidenceGraph(eg))
        .catch(() => {})
        .finally(() => setEgLoading(false));
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
  };

  const handleCreateWO = async () => {
    if (!selected) return;
    setCreateLoading(true);
    try {
      await apiRequest('/api/work-orders', { method: 'POST', body: JSON.stringify({ incidentId: selected.id, priority }) }, auth.token!);
      addToast({ type: 'success', title: 'Work order created!' });
      setSelected(null);
      load();
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setCreateLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  const statusOptions = ['', 'DRAFT', 'AWAITING_CLARIFICATION', 'AWAITING_REVIEW', 'CONVERTED_TO_WORK_ORDER', 'REJECTED'];

  return (
    <div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident: ${selected?.report_number}`} size="modal-lg">
        {selected && (
          <div>
            <div className="flex gap-3 items-center mb-4 flex-wrap">
              <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{formatStatus(selected.status)}</span>
              {selected.urgency_suggestion && <span className={`badge priority-badge ${getPriorityClass(selected.urgency_suggestion)}`}>{selected.urgency_suggestion}</span>}
              <span className="badge badge-draft">{selected.input_channel}</span>
            </div>

            {/* Sub-Tabs for Supervisor Incident Analysis */}
            <div className="tabs mb-4">
              <button type="button" className={`tab-btn ${modalTab === 'intake' ? 'active' : ''}`} onClick={() => setModalTab('intake')}>
                📋 Intake & Evidence
              </button>
              <button type="button" className={`tab-btn ${modalTab === 'decision' ? 'active' : ''}`} onClick={() => setModalTab('decision')}>
                ⚖️ Repair vs Replace
              </button>
              <button type="button" className={`tab-btn ${modalTab === 'graph' ? 'active' : ''}`} onClick={() => setModalTab('graph')}>
                🕸️ Evidence Graph
              </button>
              <button type="button" className={`tab-btn ${modalTab === 'history' ? 'active' : ''}`} onClick={() => setModalTab('history')}>
                📚 Asset History ({selected.groundedHistory?.length || 0})
              </button>
            </div>

            {modalTab === 'intake' && (
              <>
                <div className="info-grid mb-5">
                  {[
                    ['Reporter', selected.reporter_name],
                    ['Machine', selected.machine_name || '—'],
                    ['Asset Tag', selected.asset_tag || '—'],
                    ['Site', selected.site_name || '—'],
                    ['Category', selected.symptom_category || '—'],
                    ['Filed', formatDate(selected.created_at)],
                  ].map(([l, v]) => <div key={l} className="info-item"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>)}
                </div>

                {selected.corrected_transcript && (
                  <div className="form-group">
                    <label className="form-label">Transcript</label>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{selected.corrected_transcript}"
                    </div>
                  </div>
                )}
                {selected.symptom_text && (
                  <div className="form-group">
                    <label className="form-label">AI Symptom</label>
                    <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: 'var(--space-4)', fontSize: 13 }}>{selected.symptom_text}</div>
                  </div>
                )}
                {selected.urgency_rationale && (
                  <div className="alert alert-info">💡 Urgency: {selected.urgency_rationale}</div>
                )}
                {selected.evidence?.length > 0 && (
                  <>
                    <div className="card-title mb-3" style={{ fontSize: 14 }}>📎 Evidence Provenance</div>
                    <EvidencePanel evidence={selected.evidence} />
                  </>
                )}
              </>
            )}

            {modalTab === 'decision' && (
              <DecisionSupportPanel data={decisionSupport} loading={dsLoading} />
            )}

            {modalTab === 'graph' && (
              <EvidenceGraphPanel data={evidenceGraph} loading={egLoading} />
            )}

            {modalTab === 'history' && (
              <div>
                <div className="card-subtitle mb-3">Verified closed work orders for {selected.machine_name || selected.asset_tag} & similar equipment</div>
                {(!selected.groundedHistory || selected.groundedHistory.length === 0) ? (
                  <EmptyState icon="📚" title="No past records" desc="No previous verified maintenance events on this asset." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {selected.groundedHistory.map((h: any, i: number) => (
                      <div key={i} style={{ background: 'var(--bg-card)', border: h.isSameMachine ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: h.isSameMachine ? 'var(--brand-primary-light)' : 'var(--text-muted)' }}>
                            {h.isSameMachine ? '✓ Same Asset' : 'Similar Equipment'}
                          </span>
                          <span className="badge badge-approved" style={{ fontSize: '10px' }}>VERIFIED CLOSED</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.reportNumber} · {h.workOrderNumber}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '4px' }}>{h.symptomText}</div>
                        {h.resolutionSummary && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><strong>Resolution:</strong> {h.resolutionSummary}</div>}
                        {h.technicianFindings && <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}><strong>Findings:</strong> {h.technicianFindings}</div>}
                        {h.verifiedAt && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Verified: {formatDate(h.verifiedAt)}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selected.status === 'AWAITING_REVIEW' && (
              <>
                <div className="divider" />
                <div className="form-group">
                  <label className="form-label required">Work Order Priority</label>
                  <select className="form-control" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="CRITICAL">🔴 Critical</option>
                    <option value="HIGH">🟠 High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">⚪ Low</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-success" onClick={handleCreateWO} disabled={createLoading}>
                    {createLoading ? <><Spinner /> Creating…</> : '📦 Create Work Order'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Incident Reports</div>
          <div className="flex gap-3">
            <select className="form-control" style={{ width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {statusOptions.filter(s => s).map(s => <option key={s} value={s}>{formatStatus(s)}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={load}>🔄</button>
          </div>
        </div>
        {reports.length === 0 ? (
          <EmptyState icon="🚨" title="No incidents" desc="No incident reports matching the selected filter." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Report #</th><th>Reporter</th><th>Machine</th><th>Symptom</th><th>Urgency</th><th>Status</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id}>
                    <td className="td-primary font-mono text-xs">{r.report_number}</td>
                    <td>{r.reporter_name}</td>
                    <td>{r.machine_name || '—'}</td>
                    <td><span style={{ maxWidth: 180, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.symptom_text?.slice(0, 50)}</span></td>
                    <td>{r.urgency_suggestion ? <span className={`badge priority-badge ${getPriorityClass(r.urgency_suggestion)}`}>{r.urgency_suggestion}</span> : '—'}</td>
                    <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{formatStatus(r.status)}</span></td>
                    <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openDetail(r.id)}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Work Orders View (Supervisor) ─────────────────────────────
function WorkOrdersView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [technicianId, setTechnicianId] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [closureNotes, setClosureNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [wo, users] = await Promise.all([
        apiRequest('/api/work-orders', {}, auth.token!),
        apiRequest('/api/auth/demo-accounts', {}, auth.token!),
      ]);
      setOrders(wo.workOrders || []);
      setTechnicians((users.accounts || []).filter((u: any) => u.role === 'REPORTER_TECHNICIAN'));
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setLoading(false); }
  }, [auth.token, addToast]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    try {
      const d = await apiRequest(`/api/work-orders/${id}`, {}, auth.token!);
      setSelected(d); setTechnicianId(''); setRejectReason(''); setClosureNotes(''); setReturnReason('');
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
  };

  const action = async (endpoint: string, body: object, successMsg: string) => {
    setActionLoading(true);
    try {
      await apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }, auth.token!);
      addToast({ type: 'success', title: successMsg });
      setSelected(null); load();
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  return (
    <div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Work Order: ${selected?.work_order_number}`} size="modal-lg">
        {selected && (
          <div>
            <div className="flex gap-3 items-center mb-4 flex-wrap">
              <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{formatStatus(selected.status)}</span>
              <span className={`badge priority-badge ${getPriorityClass(selected.priority)}`}>{selected.priority}</span>
            </div>

            <div className="info-grid mb-5">
              {[
                ['Machine', selected.machine_name],
                ['Asset Tag', selected.asset_tag],
                ['Location', selected.machine_location || '—'],
                ['Report #', selected.report_number],
                ['Symptom', selected.symptom_text?.slice(0, 60) + (selected.symptom_text?.length > 60 ? '…' : '')],
                ['Technician', selected.technician_name || 'Unassigned'],
                ['Approved By', selected.approved_by_name || '—'],
                ['Created', formatDate(selected.created_at)],
              ].map(([l, v]) => <div key={l} className="info-item"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>)}
            </div>

            {selected.resolution_summary && (
              <div className="alert alert-success" style={{ marginBottom: 'var(--space-4)' }}>
                ✅ Resolution: {selected.resolution_summary}
              </div>
            )}

            {selected.statusHistory?.length > 0 && (
              <>
                <div className="card-title mb-3" style={{ fontSize: 14 }}>📋 Status Timeline</div>
                <div className="wo-timeline">
                  {selected.statusHistory.map((h: any, i: number) => (
                    <div key={i} className="wo-timeline-item">
                      <div className="wo-timeline-dot" />
                      <div className="wo-timeline-content">
                        <div className="wo-timeline-status">{h.from_status} → {h.to_status}</div>
                        <div className="wo-timeline-meta">By {h.changed_by_name} · {formatDate(h.timestamp)}</div>
                        {h.notes && <div className="wo-timeline-notes">{h.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="divider" />

            {/* Actions */}
            {selected.status === 'AWAITING_APPROVAL' && (
              <div>
                <div className="card-title mb-4" style={{ fontSize: 14 }}>⚡ Actions</div>
                <div className="form-group">
                  <label className="form-label">Rejection Reason (required if rejecting)</label>
                  <input className="form-control" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="State reason for rejection…" />
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-success" onClick={() => action(`/api/work-orders/${selected.id}/approve`, {}, 'Work order approved!')} disabled={actionLoading}>
                    {actionLoading ? <Spinner /> : '✅ Approve'}
                  </button>
                  <button className="btn btn-danger" onClick={() => action(`/api/work-orders/${selected.id}/reject`, { rejectionReason: rejectReason }, 'Work order rejected')} disabled={actionLoading || !rejectReason.trim()}>
                    ❌ Reject
                  </button>
                </div>
              </div>
            )}

            {selected.status === 'APPROVED' && (
              <div>
                <div className="card-title mb-4" style={{ fontSize: 14 }}>👷 Assign Technician</div>
                <div className="form-group">
                  <label className="form-label required">Technician</label>
                  <select className="form-control" value={technicianId} onChange={e => setTechnicianId(e.target.value)}>
                    <option value="">Select technician…</option>
                    {technicians.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={() => action(`/api/work-orders/${selected.id}/assign`, { technicianId }, 'Technician assigned!')} disabled={!technicianId || actionLoading}>
                  {actionLoading ? <Spinner /> : '👷 Assign'}
                </button>
              </div>
            )}

            {selected.status === 'RESOLVED' && (
              <div>
                <div className="card-title mb-4" style={{ fontSize: 14 }}>🔍 Verify & Close</div>
                <div className="form-group">
                  <label className="form-label required">Closure Notes</label>
                  <textarea className="form-control" rows={3} value={closureNotes} onChange={e => setClosureNotes(e.target.value)} placeholder="Supervisor closure notes…" />
                </div>
                <div className="flex gap-3">
                  <button className="btn btn-success" onClick={() => action(`/api/work-orders/${selected.id}/verify-close`, { supervisorClosureNotes: closureNotes }, 'Work order closed!')} disabled={!closureNotes.trim() || actionLoading}>
                    {actionLoading ? <Spinner /> : '✅ Verify & Close'}
                  </button>
                  <button className="btn btn-danger" onClick={() => action(`/api/work-orders/${selected.id}/return`, { returnReason: returnReason || 'Returned for rework by supervisor' }, 'Returned for rework')} disabled={actionLoading}>
                    🔄 Return for Rework
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Work Orders</div>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon="📦" title="No work orders" desc="Work orders are created from approved incident reports." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>WO #</th><th>Machine</th><th>Symptom</th><th>Priority</th><th>Status</th><th>Technician</th><th>Created</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="td-primary font-mono text-xs">{o.work_order_number}</td>
                    <td><div className="font-semibold text-sm">{o.machine_name}</div><div className="text-xs text-muted">{o.asset_tag}</div></td>
                    <td><span style={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.symptom_text?.slice(0, 45)}</span></td>
                    <td><span className={`badge priority-badge ${getPriorityClass(o.priority)}`}>{o.priority}</span></td>
                    <td><span className={`badge ${getStatusBadgeClass(o.status)}`}>{formatStatus(o.status)}</span></td>
                    <td>{o.technician_name || <span className="text-muted text-xs">Unassigned</span>}</td>
                    <td className="text-xs text-muted">{formatDate(o.created_at)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openDetail(o.id)}>Manage</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── My Work Orders View (Technician) ──────────────────────────
function MyWorkOrdersView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
  const [techModalTab, setTechModalTab] = useState<'work' | 'history' | 'decision' | 'graph'>('work');
  const [techDecisionSupport, setTechDecisionSupport] = useState<any>(null);
  const [techEvidenceGraph, setTechEvidenceGraph] = useState<any>(null);
  const [techDsLoading, setTechDsLoading] = useState(false);
  const [techEgLoading, setTechEgLoading] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');
  const [findings, setFindings] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    apiRequest('/api/work-orders/assigned', {}, auth.token!).then(d => { setOrders(d.workOrders || []); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id: string) => {
    setTechModalTab('work');
    setTechDecisionSupport(null);
    setTechEvidenceGraph(null);
    try {
      const d = await apiRequest(`/api/work-orders/${id}`, {}, auth.token!);
      setSelected(d);
      setResolutionSummary('');
      setFindings('');
      setSelectedHistory([]);

      // Fetch maintenance history once assigned — only available after assignment
      const workableStatuses = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'RETURNED_FOR_REWORK', 'VERIFIED_CLOSED'];
      if (workableStatuses.includes(d.status)) {
        try {
          const h = await apiRequest(`/api/work-orders/${id}/history`, {}, auth.token!);
          setSelectedHistory(h.verifiedClosedIncidents || []);
        } catch {
          // History unavailable — not a blocking error
        }
      }

      // Preload decision support and evidence graph for technician investigation
      if (d.incident_id) {
        setTechDsLoading(true);
        apiRequest(`/api/incidents/${d.incident_id}/decision-support`, {}, auth.token!)
          .then(ds => setTechDecisionSupport(ds))
          .catch(() => {})
          .finally(() => setTechDsLoading(false));

        setTechEgLoading(true);
        apiRequest(`/api/incidents/${d.incident_id}/evidence-graph`, {}, auth.token!)
          .then(eg => setTechEvidenceGraph(eg))
          .catch(() => {})
          .finally(() => setTechEgLoading(false));
      }
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
  };

  const updateStatus = async (status: string, extra?: object) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/work-orders/${selected.id}/status`, { method: 'POST', body: JSON.stringify({ status, ...extra }) }, auth.token!);
      addToast({ type: 'success', title: `Status updated to ${formatStatus(status)}` });
      setSelected(null); load();
    } catch (e: any) { addToast({ type: 'error', title: e.message }); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  return (
    <div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Work Order: ${selected?.work_order_number}`} size="modal-lg">
        {selected && (
          <div>
            <div className="flex gap-3 items-center mb-4 flex-wrap">
              <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{formatStatus(selected.status)}</span>
              <span className={`badge priority-badge ${getPriorityClass(selected.priority)}`}>{selected.priority}</span>
            </div>

            <div className="info-grid mb-5">
              {[
                ['Machine', selected.machine_name],
                ['Asset Tag', selected.asset_tag],
                ['Location', selected.machine_location || '—'],
                ['Report #', selected.report_number],
                ['Approved By', selected.approved_by_name || '—'],
                ['Assigned', formatDate(selected.assigned_at)],
              ].map(([l, v]) => <div key={l} className="info-item"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>)}
            </div>
            {selected.symptom_text && (
              <div className="alert alert-info mb-4">🔧 Job: {selected.symptom_text}</div>
            )}

            {/* Sub-Tabs for Technician Case Investigation */}
            <div className="tabs mb-4">
              <button type="button" className={`tab-btn ${techModalTab === 'work' ? 'active' : ''}`} onClick={() => setTechModalTab('work')}>
                🔧 Work Execution
              </button>
              <button type="button" className={`tab-btn ${techModalTab === 'history' ? 'active' : ''}`} onClick={() => setTechModalTab('history')}>
                📚 Case History ({selectedHistory.length})
              </button>
              <button type="button" className={`tab-btn ${techModalTab === 'decision' ? 'active' : ''}`} onClick={() => setTechModalTab('decision')}>
                ⚖️ Decision Guidance
              </button>
              <button type="button" className={`tab-btn ${techModalTab === 'graph' ? 'active' : ''}`} onClick={() => setTechModalTab('graph')}>
                🕸️ Evidence Graph
              </button>
            </div>

            {techModalTab === 'work' && (
              <>
                {selected.statusHistory?.length > 0 && (
                  <>
                    <div className="card-title mb-3" style={{ fontSize: 14 }}>📋 Status Timeline</div>
                    <div className="wo-timeline">
                      {selected.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="wo-timeline-item">
                          <div className="wo-timeline-dot" />
                          <div className="wo-timeline-content">
                            <div className="wo-timeline-status">{h.from_status} → {h.to_status}</div>
                            <div className="wo-timeline-meta">By {h.changed_by_name} · {formatDate(h.timestamp)}</div>
                            {h.notes && <div className="wo-timeline-notes">{h.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="divider" />

                {selected.status === 'ASSIGNED' && (
                  <div>
                    <div className="card-title mb-4" style={{ fontSize: 14 }}>⚡ Actions</div>
                    <button className="btn btn-primary" onClick={() => updateStatus('IN_PROGRESS')} disabled={actionLoading}>
                      {actionLoading ? <Spinner /> : '▶️ Start Work'}
                    </button>
                  </div>
                )}

                {selected.status === 'IN_PROGRESS' && (
                  <div>
                    <div className="card-title mb-4" style={{ fontSize: 14 }}>📝 Submit Resolution</div>
                    <div className="form-group">
                      <label className="form-label">Findings (optional)</label>
                      <textarea className="form-control" rows={2} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Technical findings and observations…" />
                    </div>
                    <div className="form-group">
                      <label className="form-label required">Resolution Summary</label>
                      <textarea className="form-control" rows={3} value={resolutionSummary} onChange={e => setResolutionSummary(e.target.value)} placeholder="Describe what was done to fix the issue…" />
                    </div>
                    <button className="btn btn-success" onClick={() => updateStatus('RESOLVED', { findings, resolutionSummary })} disabled={!resolutionSummary.trim() || actionLoading}>
                      {actionLoading ? <Spinner /> : '✅ Submit Resolution'}
                    </button>
                  </div>
                )}

                {['RESOLVED', 'VERIFIED_CLOSED'].includes(selected.status) && (
                  <div className="alert alert-success">
                    {selected.status === 'RESOLVED' ? '✅ Resolution submitted — awaiting supervisor verification.' : '🎉 Work order verified and closed!'}
                    {selected.resolution_summary && <div style={{ marginTop: 4 }}>Resolution: {selected.resolution_summary}</div>}
                  </div>
                )}
              </>
            )}

            {techModalTab === 'history' && (
              <div className="card" style={{ background: 'var(--bg-elevated)' }}>
                <div className="card-header" style={{ marginBottom: 'var(--space-3)' }}>
                  <div>
                    <div className="card-title" style={{ fontSize: 14 }}>🕑 Machine Maintenance History</div>
                    <div className="card-subtitle">Verified past repairs on {selected.machine_name} and similar equipment — for reference only</div>
                  </div>
                </div>
                {selectedHistory.length === 0 ? (
                  <EmptyState icon="📚" title="No history found" desc="No previous verified repairs for this equipment." />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {selectedHistory.map((h: any, i: number) => (
                      <div key={i} style={{
                        background: 'var(--bg-card)',
                        border: h.isSameMachine ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                      }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: h.isSameMachine ? 'var(--brand-primary-light)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {h.isSameMachine ? '✓ Same Machine' : 'Similar Equipment'}
                          </span>
                          <span className={`badge ${getStatusBadgeClass('VERIFIED_CLOSED')}`} style={{ fontSize: 10 }}>VERIFIED CLOSED</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{h.reportNumber} · {h.workOrderNumber}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{h.symptomText}</div>
                        {h.technicianFindings && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
                            <strong>Findings:</strong> {h.technicianFindings}
                          </div>
                        )}
                        {h.resolutionSummary && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            <strong>Resolution:</strong> {h.resolutionSummary}
                          </div>
                        )}
                        {h.verifiedAt && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                            Verified: {formatDate(h.verifiedAt)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {techModalTab === 'decision' && (
              <DecisionSupportPanel data={techDecisionSupport} loading={techDsLoading} />
            )}

            {techModalTab === 'graph' && (
              <EvidenceGraphPanel data={techEvidenceGraph} loading={techEgLoading} />
            )}
          </div>
        )}
      </Modal>

      <div className="card">
        <div className="card-header">
          <div className="card-title">My Work Orders</div>
          <button className="btn btn-ghost btn-sm" onClick={load}>🔄 Refresh</button>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon="🔧" title="No work orders assigned" desc="Your supervisor will assign work orders to you after approval." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr><th>WO #</th><th>Machine</th><th>Symptom</th><th>Priority</th><th>Status</th><th>Assigned</th><th></th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td className="td-primary font-mono text-xs">{o.work_order_number}</td>
                    <td><div className="font-semibold text-sm">{o.machine_name}</div><div className="text-xs text-muted">{o.asset_tag} · {o.machine_location}</div></td>
                    <td><span style={{ maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.symptom_text?.slice(0, 45)}</span></td>
                    <td><span className={`badge priority-badge ${getPriorityClass(o.priority)}`}>{o.priority}</span></td>
                    <td><span className={`badge ${getStatusBadgeClass(o.status)}`}>{formatStatus(o.status)}</span></td>
                    <td className="text-xs text-muted">{formatDate(o.assigned_at)}</td>
                    <td><button className="btn btn-secondary btn-sm" onClick={() => openDetail(o.id)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Intelligence View ─────────────────────────────────────────
function IntelligenceView() {
  const { auth } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [faults, setFaults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest('/api/machines', {}, auth.token!),
      apiRequest('/api/graph/recurring', {}, auth.token!),
    ]).then(([m, f]) => {
      setMachines(m.machines || []);
      setFaults(f.recurringFaultClusters || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [auth.token]);

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  const maxFaults = faults.length > 0 ? Math.max(...faults.map((f: any) => f.incident_count)) : 1;

  return (
    <div className="two-col" style={{ alignItems: 'start' }}>
      <div>
        <div className="card mb-6">
          <div className="card-header">
            <div><div className="card-title">🧠 Recurring Fault Intelligence</div><div className="card-subtitle">AI-detected patterns across maintenance history</div></div>
          </div>
          {faults.length === 0 ? (
            <EmptyState icon="🧠" title="No patterns detected yet" desc="Run more incidents to identify recurring fault patterns." />
          ) : faults.map((f: any, i: number) => (
            <div key={i} className="fault-cluster">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm">{f.machine_name || 'Unknown Machine'}</span>
                  <span className="text-xs text-muted" style={{ marginLeft: 8 }}>({f.asset_tag})</span>
                </div>
                <span className="font-bold text-accent" style={{ fontSize: 18 }}>{f.incident_count}×</span>
              </div>
              <div className="text-xs text-muted mb-2">Category: {f.symptom_category} · Location: {f.location || '—'}</div>
              <div className="fault-frequency">
                <div className="frequency-bar">
                  <div className="frequency-fill" style={{ width: `${(f.incident_count / maxFaults) * 100}%` }} />
                </div>
                <span className="text-xs text-muted" style={{ minWidth: 30 }}>{f.incident_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚙️ Machine Registry</div><div className="card-subtitle">{machines.length} machines registered</div></div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Tag</th><th>Name</th><th>Type</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>
                {machines.map(m => (
                  <tr key={m.id}>
                    <td className="td-primary font-mono text-xs">{m.asset_tag}</td>
                    <td>{m.name}</td>
                    <td className="text-xs">{m.type}</td>
                    <td className="text-xs text-muted">{m.location}</td>
                    <td><span className={`badge ${m.is_active ? 'badge-approved' : 'badge-rejected'}`}>{m.is_active ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Audit Logs View ───────────────────────────────────────────
function AuditLogsView() {
  const { auth } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/api/audit-logs?limit=100', {}, auth.token!).then(d => { setLogs(d.auditLogs || []); setLoading(false); }).catch(() => setLoading(false));
  }, [auth.token]);

  if (loading) return <div className="loading-overlay"><Spinner /></div>;

  const actionIcon: Record<string, string> = {
    CREATE: '📝', CREATE_WORK_ORDER: '📦', APPROVE: '✅', REJECT: '❌',
    ASSIGN: '👷', STATUS_UPDATE: '🔄', SUBMIT_RESOLUTION: '📋',
    VERIFY_CLOSE: '🔒', CLARIFY: '💬', EDIT_TRANSCRIPT: '✏️', RETURN: '↩️',
  };

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">🔒 Audit Log</div><div className="card-subtitle">Append-only record of all system actions</div></div>
      </div>
      {logs.length === 0 ? (
        <EmptyState icon="🔒" title="No audit logs" desc="System actions will appear here." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity Type</th><th>Entity ID</th><th>Reason</th></tr></thead>
            <tbody>
              {logs.map((l: any) => (
                <tr key={l.id}>
                  <td className="text-xs text-muted">{formatDate(l.timestamp)}</td>
                  <td className="td-primary text-sm">{l.actor_name || l.actor_id?.slice(0, 8)}</td>
                  <td><span className="font-semibold text-sm">{actionIcon[l.action] || '•'} {l.action}</span></td>
                  <td><span className="badge badge-draft text-xs">{l.entity_type}</span></td>
                  <td className="font-mono text-xs text-muted">{l.entity_id?.slice(0, 20)}</td>
                  <td className="text-xs text-secondary">{l.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
function AppContent({ onExitToLanding }: { onExitToLanding?: () => void }) {
  const { auth } = useAuth();
  const [view, setView] = useState('dashboard');

  if (!auth.user) return <LoginPage onBackToLanding={onExitToLanding} />;

  const isSupervisor = auth.user.role === 'SUPERVISOR';

  const getTitle = () => {
    const titles: Record<string, [string, string]> = {
      dashboard: ['📊 Dashboard', 'Overview & key metrics'],
      'new-report': ['📝 New Incident Report', 'Submit a fault report'],
      'my-reports': ['📋 My Reports', 'Track your submitted reports'],
      'my-workorders': ['🔧 My Work Orders', 'View and update assigned tasks'],
      incidents: ['🚨 All Incidents', 'Review and manage incident reports'],
      workorders: ['📦 Work Orders', 'Manage work order lifecycle'],
      intelligence: ['🧠 Intelligence', 'Recurring faults & machine registry'],
      audit: ['🔒 Audit Logs', 'Immutable system action history'],
    };
    return titles[view] || ['Kirova AI', ''];
  };

  const [pageTitle, pageSubtitle] = getTitle();

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardView />;
      case 'new-report': return <NewReportView onDone={() => setView('my-reports')} />;
      case 'my-reports': return <MyReportsView />;
      case 'my-workorders': return <MyWorkOrdersView />;
      case 'incidents': return isSupervisor ? <IncidentsView /> : null;
      case 'workorders': return isSupervisor ? <WorkOrdersView /> : null;
      case 'intelligence': return isSupervisor ? <IntelligenceView /> : null;
      case 'audit': return isSupervisor ? <AuditLogsView /> : null;
      default: return <DashboardView />;
    }
  };

  return (
    <div className="app-shell">
      <Sidebar view={view} setView={setView} onExitToLanding={onExitToLanding} />
      <main className="main-content">
        <div className="page-header">
          <div>
            <div className="page-title">{pageTitle}</div>
            {pageSubtitle && <div className="page-subtitle">{pageSubtitle}</div>}
          </div>
          <div className="flex gap-3 items-center">
            {onExitToLanding && (
              <button
                type="button"
                onClick={onExitToLanding}
                className="btn btn-secondary btn-sm"
                title="View Public Landing Page"
              >
                🌐 Public Website
              </button>
            )}
            <span className={`badge ${auth.user.role === 'SUPERVISOR' ? 'badge-approved' : 'badge-assigned'}`}>
              {auth.user.role === 'SUPERVISOR' ? '🔵 Supervisor' : '🟢 Technician'}
            </span>
          </div>
        </div>
        <div className="page-body">
          {renderView()}
        </div>
      </main>
    </div>
  );
}

// ── Root App with Providers & Public Route System ─────────────
export default function App() {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const token = localStorage.getItem('ks_token');
      const user = localStorage.getItem('ks_user');
      if (token && user) return { token, user: JSON.parse(user) };
    } catch {}
    return { token: null, user: null };
  });

  const getInitialRoute = (): 'landing' | 'login' | 'app' => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    if (path === '/login' || hash === '#login') return 'login';
    if (path === '/app' || hash === '#app' || path.startsWith('/incidents') || path.startsWith('/workorders')) {
      return 'app';
    }
    // Visiting '/' displays the public landing page!
    return 'landing';
  };

  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'app'>(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: 'landing' | 'login' | 'app') => {
    setCurrentRoute(route);
    const targetPath = route === 'landing' ? '/' : route === 'login' ? '/login' : '/app';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    localStorage.setItem('ks_token', data.token);
    localStorage.setItem('ks_user', JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    navigateTo('app');
  }, []);

  // Google Sign-In: POSTs the Google ID token to the backend for server-side
  // verification. The backend issues a Kirova JWT — identical flow to password login.
  const googleLogin = useCallback(async (credential: string) => {
    const data = await apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
    localStorage.setItem('ks_token', data.token);
    localStorage.setItem('ks_user', JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    navigateTo('app');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ks_token');
    localStorage.removeItem('ks_user');
    setAuth({ token: null, user: null });
    navigateTo('landing');
  }, []);

  const renderScreen = () => {
    if (currentRoute === 'landing') {
      return (
        <LandingPage
          onLaunchStudio={() => {
            if (auth.user) {
              navigateTo('app');
            } else {
              navigateTo('login');
            }
          }}
          onSignIn={() => navigateTo('login')}
          onSignUp={() => navigateTo('login')}
          isAuthenticated={!!auth.user}
          userName={auth.user?.name}
        />
      );
    }

    if (currentRoute === 'login') {
      if (auth.user) {
        return <AppContent onExitToLanding={() => navigateTo('landing')} />;
      }
      return <LoginPage onBackToLanding={() => navigateTo('landing')} />;
    }

    // Studio workspace route
    if (!auth.user) {
      return <LoginPage onBackToLanding={() => navigateTo('landing')} />;
    }
    return <AppContent onExitToLanding={() => navigateTo('landing')} />;
  };

  return (
    <AuthContext.Provider value={{ auth, login, googleLogin, logout }}>
      <ToastProvider>
        {renderScreen()}
      </ToastProvider>
    </AuthContext.Provider>
  );
}

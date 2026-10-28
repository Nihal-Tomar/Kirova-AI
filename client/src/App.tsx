import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LandingPage } from './pages/LandingPage';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Cog,
  FileText,
  Globe2,
  History,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Mic,
  MicOff,
  PanelLeftClose,
  PanelLeftOpen,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Siren,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import './styles/landing.css';
import './styles/kirova-redesign.css';

// ── API Configuration ─────────────────────────────────────────
const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function apiRequest(path: string, options: RequestInit = {}, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = API_BASE ? `${API_BASE}${path}` : path;
  if (!import.meta.env.DEV && !API_BASE) {
    throw new Error('API URL is not configured. Add VITE_API_URL to your Vercel environment variables.');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    if (!API_BASE) {
      throw new Error('API URL is not configured. Add VITE_API_URL to your Vercel environment variables.');
    }
    throw new Error(`Cannot reach the server (${API_BASE}). Check your network or the backend deployment.`);
  }

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

export async function apiUpload(path: string, formData: FormData, token: string) {
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
type DemoPersonaRole = 'SUPERVISOR' | 'TECHNICIAN' | 'WORKER';

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
  switchDemoUser: (persona: DemoPersonaRole) => Promise<void>;
  logout: () => void;
}>({
  auth: { user: null, token: null },
  login: async () => {},
  googleLogin: async () => {},
  switchDemoUser: async () => {},
  logout: () => {},
});

// ── Toast Context ─────────────────────────────────────────────
interface Toast { id: string; type: 'success' | 'error' | 'warning' | 'info'; title: string; message?: string; }
const ToastContext = createContext<{ addToast: (t: Omit<Toast, 'id'>) => void }>({ addToast: () => {} });

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...t, id }]);
    setTimeout(() => setToasts(prev => prev.filter(x => x.id !== id)), 5000);
  }, []);

  const icons: Record<Toast['type'], React.ReactNode> = {
    success: <CheckCircle2 size={17} aria-hidden="true" />,
    error: <AlertTriangle size={17} aria-hidden="true" />,
    warning: <AlertTriangle size={17} aria-hidden="true" />,
    info: <Lightbulb size={17} aria-hidden="true" />,
  };

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

// ── Shared Enum Humanization & Badge Formatters ───────────────
function formatEnumLabel(val: string): string {
  if (!val) return '—';
  const special: Record<string, string> = {
    FLUID_LEAKAGE: 'Fluid Leakage',
    MECHANICAL_JAM: 'Mechanical Jam',
    OVERHEATING: 'Overheating',
    PERFORMANCE_DROP: 'Performance Drop',
    ABNORMAL_NOISE: 'Abnormal Noise',
    VIBRATION: 'Spindle Vibration',
    ELECTRICAL_FAULT: 'Electrical Fault',
    SENSOR_FAILURE: 'Sensor Failure',
    CNC_MILLING: 'CNC Milling Center',
    HYDRAULIC_PRESS: 'Hydraulic Press',
    CONVEYOR: 'Conveyor System',
    LATHE: 'Precision Lathe',
    COMPRESSOR: 'Air Compressor',
    CONVERTED_TO_WORK_ORDER: 'Work Order Active',
    VERIFIED_CLOSED: 'Verified Closed',
    AWAITING_REVIEW: 'Awaiting Triage',
    AWAITING_APPROVAL: 'Awaiting 4-Way Decision',
    AWAITING_CLARIFICATION: 'Needs Clarification',
    IN_PROGRESS: 'In Progress',
    RESOLVED: 'Resolved (Pending Audit)',
    ASSIGNED: 'Assigned to Technician',
    APPROVED: 'Approved for Execution',
    DRAFT: 'Draft Report',
    REJECTED: 'Rejected',
    RETURNED_FOR_REWORK: 'Returned for Rework',
  };
  if (special[val]) return special[val];
  return val.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    DRAFT: 'badge-draft',
    AWAITING_CLARIFICATION: 'badge-clarification',
    AWAITING_REVIEW: 'badge-review',
    CONVERTED_TO_WORK_ORDER: 'badge-approved',
    REJECTED: 'badge-rejected',
    AWAITING_APPROVAL: 'badge-awaiting',
    APPROVED: 'badge-approved',
    ASSIGNED: 'badge-assigned',
    IN_PROGRESS: 'badge-progress',
    RESOLVED: 'badge-resolved',
    VERIFIED_CLOSED: 'badge-closed',
    RETURNED_FOR_REWORK: 'badge-clarification',
  };
  return map[status] || 'badge-draft';
}

function formatStatus(status: string): string {
  return formatEnumLabel(status);
}

function getPriorityClass(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: 'priority-critical',
    HIGH: 'priority-high',
    MEDIUM: 'priority-medium',
    LOW: 'priority-low',
  };
  return map[priority] || 'priority-low';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// ── Epistemic Badge Component ─────────────────────────────────
function EpistemicBadge({ type }: { type: 'FACT' | 'HISTORY' | 'INFERENCE' | 'VERIFIED' | 'UNCERTAINTY' | 'CONFLICT' }) {
  const config = {
    FACT: { label: 'OBSERVED FACT', class: 'epis-observed', icon: FileText },
    HISTORY: { label: 'HISTORICAL EVIDENCE', class: 'epis-historical', icon: History },
    INFERENCE: { label: 'AI INFERENCE', class: 'epis-inference', icon: Sparkles },
    VERIFIED: { label: 'VERIFIED OUTCOME', class: 'epis-verified', icon: ShieldCheck },
    UNCERTAINTY: { label: 'UNCERTAINTY NOTE', class: 'epis-uncertain', icon: AlertTriangle },
    CONFLICT: { label: 'CONTRADICTION ALERT', class: 'epis-conflict', icon: AlertTriangle },
  }[type];

  const Icon = config.icon;
  return (
    <span className={`epis-badge ${config.class}`}>
      <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
      <span>{config.label}</span>
    </span>
  );
}

// ── Monospace ID Pill Component ───────────────────────────────
function IdPill({ id }: { id: string }) {
  return <span className="ks-id-pill">{id}</span>;
}

// ── Shared UI Modals & States ─────────────────────────────────
function Modal({ open, onClose, title, children, size = '' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: string }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X size={17} /></button>
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

export function ErrorState({ title = 'Could not load this view', message, onRetry }: { title?: string; message: string; onRetry: () => void }) {
  return (
    <div className="empty-state" role="alert">
      <span className="empty-state-icon">!</span>
      <span className="empty-state-title">{title}</span>
      <span className="empty-state-desc">{message}</span>
      <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>Retry</button>
    </div>
  );
}

// ── Voice Recorder Component (Multilingual + Hinglish Sample) ─
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
      alert('Microphone access denied. You can also use the realistic Hinglish sample button.');
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="ks-voice-card">
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
        <div className="ks-waveform-bar-row">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="ks-waveform-mini" />)}
        </div>
      </div>
      {recording && <div className="recorder-timer" style={{ color: '#EF4444' }}>{fmt(seconds)}</div>}
      <button
        className={`ks-voice-btn ${recording ? 'recording' : ''}`}
        onClick={recording ? stop : start}
        title={recording ? 'Stop recording' : 'Start voice report'}
      >
        {recording ? <MicOff size={28} color="#FFFFFF" /> : <Mic size={28} color="#FFFFFF" />}
      </button>
      <div style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>
        {recording ? 'Listening to voice stream… tap to stop' : 'Tap to Record Machine Voice Fault'}
      </div>
      <p style={{ color: '#94A3B8', fontSize: 11, marginTop: 4 }}>
        Supports Hindi, Hinglish, Tamil, Telugu & English
      </p>
    </div>
  );
}

// ── Evidence Panel Component ──────────────────────────────────
export function EvidencePanel({ evidence }: { evidence: any[] }) {
  if (!evidence || evidence.length === 0) return null;
  const labelMap: Record<string, string> = {
    REPORTED: 'evidence-extracted',
    EXTRACTED: 'evidence-extracted',
    RETRIEVED: 'evidence-retrieved',
    SUGGESTED: 'evidence-inferred',
    INFERRED: 'evidence-inferred',
    MISSING: 'evidence-missing',
    AMBIGUOUS: 'evidence-ambiguous',
    UNVERIFIED: 'evidence-ambiguous',
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

// ── Decision Support Panel ────────────────────────────────────
export function DecisionSupportPanel({ data, loading }: { data: any; loading: boolean }) {
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
      <div className="alert alert-info" style={{ fontSize: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <Zap size={16} />
        <div>
          <strong>ADVISORY 4-WAY DECISION MATRIX:</strong> {data.advisoryDisclaimer || 'Decisions are grounded in verified historical records.'}
        </div>
      </div>

      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B', fontWeight: 700 }}>
            Algorithmic Recommendation
          </div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '6px', marginTop: 2 }}>
            <span>{optIcons[data.summary?.recommendedOption] || '💡'}</span>
            <span>{data.options.find((o: any) => o.optionKey === data.summary?.recommendedOption)?.title || data.summary?.recommendedOption}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <div>
            <span className="text-muted">Asset Recurrence:</span>{' '}
            <strong style={{ color: data.summary?.historicalRecurrenceCountOnAsset > 1 ? '#ef4444' : '#0F172A' }}>
              {data.summary?.historicalRecurrenceCountOnAsset || 1}×
            </strong>
          </div>
          <div>
            <span className="text-muted">Peer Benchmarks:</span>{' '}
            <strong>{data.summary?.peerEquipmentVerifiedRepairsCount || 3} verified</strong>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {data.options.map((opt: any) => {
          const isRec = opt.optionKey === data.summary?.recommendedOption;
          return (
            <div
              key={opt.optionKey}
              style={{
                background: isRec ? '#F0FDF4' : '#FFFFFF',
                border: isRec ? '1.5px solid #059669' : '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px' }}>{optIcons[opt.optionKey] || '•'}</span>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>{opt.title}</span>
                  {isRec && <span className="ks-recommended-tag">RECOMMENDED BY AI</span>}
                </div>
                <span className="badge badge-approved" style={{ fontSize: 10 }}>{opt.feasibility}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                {opt.summary}
              </div>
              <div style={{ background: '#F8FAFC', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', borderLeft: '3px solid #2563EB', marginBottom: '8px' }}>
                <strong>Rationale:</strong> {opt.feasibilityRationale}
              </div>
              {opt.supportingEvidence?.length > 0 && (
                <div style={{ fontSize: '11px', color: '#64748B' }}>
                  <strong>Supporting Traceable Evidence:</strong> {opt.supportingEvidence.join(' • ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Evidence Graph Panel ──────────────────────────────────────
export function EvidenceGraphPanel({ data, loading }: { data: any; loading: boolean }) {
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
    MACHINE: { icon: '⚙️', color: 'rgba(37, 99, 235, 0.15)', border: '#2563EB' },
    COMPONENT: { icon: '🧩', color: 'rgba(6, 182, 212, 0.15)', border: '#06b6d4' },
    WORK_ORDER: { icon: '📜', color: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
    ACTION: { icon: '🔧', color: 'rgba(139, 92, 246, 0.15)', border: '#8b5cf6' },
    OUTCOME: { icon: '✅', color: 'rgba(16, 185, 129, 0.15)', border: '#10b981' },
    SOURCE_RECORD: { icon: '📎', color: 'rgba(100, 116, 139, 0.15)', border: '#64748b' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
        Interactive entity relationship graph backed by verified PostgreSQL records. Click any node to inspect audit details.
      </div>

      <div style={{
        background: '#0F172A',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
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
                borderRadius: '999px',
                padding: '5px 12px',
                color: '#FFFFFF',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cfg.icon}</span>
              <span style={{ fontWeight: 600 }}>{n.label}</span>
              <span style={{ fontSize: '9px', opacity: 0.6 }}>[{n.type}]</span>
            </button>
          );
        })}
      </div>

      {selectedNode && (
        <div style={{ background: '#FFFFFF', border: '1px solid #2563EB', borderRadius: '10px', padding: '14px', position: 'relative' }}>
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
          >
            ✕
          </button>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{selectedNode.label}</div>
          <div style={{ fontSize: '11px', color: '#2563EB', fontWeight: 600, marginBottom: 8 }}>Type: {selectedNode.type} · ID: {selectedNode.id}</div>
          <pre style={{ margin: 0, padding: 8, background: '#F8FAFC', borderRadius: 6, fontSize: 11, overflowX: 'auto', color: '#334155' }}>
            {JSON.stringify(selectedNode.details, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Interactive Evidence Graph (Matches Image 2 Left Panel) ───
function InteractiveEvidenceGraphView() {
  return (
    <div style={{
      background: '#0F172A',
      borderRadius: '16px',
      padding: '24px',
      color: '#FFFFFF',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 30px rgba(15, 23, 42, 0.12)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.01em' }}>
            Interactive Evidence Graph
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: 2 }}>
            Evidence Graph: MCH-005 Case
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, color: '#64748B' }}>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }} title="Expand">⤢</button>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }} title="Copy">❐</button>
          <button style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }} title="Clear">🗑</button>
        </div>
      </div>

      {/* Visual Flow with Animated Waves */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        padding: '28px 20px',
        position: 'relative',
        marginBottom: 24,
        overflowX: 'auto'
      }}>
        {/* Top observed fact floating bubble */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid rgba(96, 165, 250, 0.4)',
            borderRadius: '999px',
            padding: '5px 14px',
            boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)'
          }}>
            <span style={{
              background: '#334155',
              color: '#F1F5F9',
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.06em'
            }}>
              OBSERVED FACT
            </span>
            <span style={{ fontSize: '11px', color: '#E2E8F0' }}>
              Pressure drops & audible hiss reported via voice input
            </span>
          </div>
        </div>

        {/* Central Node Chain */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, minWidth: 'max-content' }}>
          {/* Node 1: Machine */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '12px 18px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>MCH-005 50-Ton</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>Hydraulic Press</div>
          </div>

          {/* Soundwave connector */}
          <div className="ks-waveform-bar-row" style={{ opacity: 0.8 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="ks-waveform-mini" />)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>→</div>

          {/* Node 2: Failure Mode */}
          <div style={{
            background: 'rgba(30, 58, 138, 0.4)',
            border: '1.5px solid #3B82F6',
            borderRadius: '10px',
            padding: '12px 20px',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              color: 'white'
            }}>
              ★
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#93C5FD' }}>Cylinder Seal</div>
            <div style={{ fontSize: '11px', color: '#E2E8F0' }}>Failure</div>
          </div>

          {/* Soundwave connector */}
          <div className="ks-waveform-bar-row" style={{ opacity: 0.8 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="ks-waveform-mini" />)}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>→</div>

          {/* Node 3: Historical Cases */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '10px',
            padding: '12px 18px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>3 Historical Cases</div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>& AI Diagnostics</div>
          </div>
        </div>
      </div>

      {/* Epistemic Breakdown Legend matching Image 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="epis-badge epis-observed">OBSERVED FACT</span>
          <span style={{ fontSize: '12px', color: '#E2E8F0' }}>Pressure drops & audible hiss reported via voice input</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="epis-badge epis-historical">HISTORICAL EVIDENCE</span>
          <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Similar seal failure on MCH-005 (April 2024)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="epis-badge epis-inference">AI INFERENCE</span>
          <span style={{ fontSize: '12px', color: '#BAE6FD' }}>Predicted leak in the rear piston chamber</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="epis-badge epis-verified">VERIFIED OUTCOME</span>
          <span style={{ fontSize: '12px', color: '#A7F3D0' }}>Optimal fix: Seal Kit replace & system bleed</span>
        </div>
      </div>
    </div>
  );
}

// ── 4-Way Decision Matrix Component (Matches Image 2 Right Panel)
function FourWayDecisionMatrixView({ onApprove }: { onApprove?: () => void }) {
  const [selected, setSelected] = useState<number>(3);
  const [approved, setApproved] = useState(false);

  const handleApprove = () => {
    setApproved(true);
    if (onApprove) onApprove();
  };

  return (
    <div style={{
      background: '#FFFFFF',
      border: '1px solid #E2E8F0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%'
    }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>
            4-Way Decision Matrix
          </div>
          <span style={{ color: '#94A3B8', fontSize: '16px', cursor: 'pointer' }}>•••</span>
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: 20 }}>
          AI Triage Matrix: Decide & Verify Action
        </div>

        {/* 2x2 Matrix Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {/* Card 1: Inspect */}
          <div
            onClick={() => setSelected(1)}
            style={{
              background: selected === 1 ? '#FEF3C7' : '#FFFDF7',
              border: selected === 1 ? '1.5px solid #D97706' : '1px solid #F1E8D9',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              1. Inspect Further
            </div>
            <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ width: '50%', height: '100%', background: '#F59E0B' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
              Defer action, collect manual telemetry
            </div>
          </div>

          {/* Card 2: Repair Component */}
          <div
            onClick={() => setSelected(2)}
            style={{
              background: selected === 2 ? '#EFF6FF' : '#F8FAFC',
              border: selected === 2 ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              2. Repair Component
            </div>
            <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ width: '40%', height: '100%', background: '#94A3B8' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
              Repack seal, temporary 20-day extension
            </div>
          </div>

          {/* Card 3: Replace Component (RECOMMENDED) */}
          <div
            onClick={() => setSelected(3)}
            style={{
              background: selected === 3 ? '#F5F3FF' : '#FAFAFE',
              border: selected === 3 ? '2px solid #6366F1' : '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              boxShadow: selected === 3 ? '0 4px 14px rgba(99, 102, 241, 0.15)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>
              3. Replace Component
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#4338CA',
              color: '#FFFFFF',
              fontSize: '8.5px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '4px',
              letterSpacing: '0.06em',
              marginBottom: 8
            }}>
              RECOMMENDED BY AI
            </div>
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.4 }}>
              Rebuild seal kit & flush fluids, estimated 98.4% reliability recovery, $840 est.
            </div>
          </div>

          {/* Card 4: Replace Machine */}
          <div
            onClick={() => setSelected(4)}
            style={{
              background: selected === 4 ? '#FFF1F2' : '#F8FAFC',
              border: selected === 4 ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
              4. Replace Machine
            </div>
            <div style={{ width: '100%', height: 4, background: '#E2E8F0', borderRadius: 99, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ width: '20%', height: '100%', background: '#CBD5E1' }} />
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', lineHeight: 1.4 }}>
              Procure new unit, high cost, lengthy downtime
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Button matching Image 2 */}
      <div>
        <button
          onClick={handleApprove}
          disabled={approved}
          style={{
            width: '100%',
            background: approved ? '#059669' : '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 20px',
            cursor: approved ? 'default' : 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>⚡</span>
            <span>{approved ? 'Verified Action Approved' : '[ ⚡ Approve Verified Action ]'}</span>
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
            ✓ Generate Work Order for Replace Component
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Redesigned Login Page (Matches Image 1 Split Screen) ───────
function LoginPage({ onBackToLanding }: { onBackToLanding?: () => void }) {
  const { login, googleLogin } = useAuth();
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<DemoPersonaRole>('SUPERVISOR');
  const [fieldError, setFieldError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      const msg: string = err.message || 'Sign in failed';
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credentials')) {
        setFieldError('Incorrect email or password. Please select a demo account below.');
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

  const selectPersona = (persona: DemoPersonaRole) => {
    setSelectedPersona(persona);
    setFieldError('');
    if (persona === 'SUPERVISOR') {
      setEmail('supervisor@kirova.ai');
      setPassword('Supervisor@123');
    } else if (persona === 'TECHNICIAN') {
      setEmail('tech.rajesh@kirova.ai');
      setPassword('Tech@123');
    } else {
      setEmail('worker.amit@kirova.ai');
      setPassword('Worker@123');
    }
  };

  return (
    <div className="ks-login-root">
      {/* ── LEFT COLUMN: Evidence Engine Showcase (52%) ── */}
      <div className="ks-login-left">
        <div className="ks-login-grid-overlay" />
        <div className="ks-login-left-content">
          {/* Top Bar matching Image 1 */}
          <div className="ks-login-left-topbar">
            {onBackToLanding && (
              <button type="button" className="ks-login-back-link" onClick={onBackToLanding}>
                ← Back to Homepage
              </button>
            )}
            <div className="ks-login-brand">
              <div className="ks-login-brand-logo">
                <svg width="22" height="22" viewBox="0 0 48 48" fill="none">
                  <path d="M14 11V37" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
                  <path d="M33 13L21 24L34 37" stroke="#60A5FA" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="21" cy="24" r="3" fill="#93C5FD" />
                </svg>
              </div>
              <div>
                <div className="ks-login-brand-name">kirova<span>AI</span></div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>From Voice to Verified Action</div>
              </div>
            </div>
            <span className="ks-login-brand-badge">Evidence Engine</span>
          </div>

          {/* Interactive Showcase Card (Matches Image 1) */}
          <div className="ks-engine-card">
            <div className="ks-engine-card-header">
              <div className="ks-engine-card-title">Maintenance Evidence Engine</div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', cursor: 'pointer' }}>✕</span>
            </div>

            <div className="ks-engine-card-body">
              {/* Evidence Graph Section */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="ks-graph-section-label">Evidence Graph</span>
                  <div className="ks-waveform-bar-row">
                    {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="ks-waveform-mini" />)}
                  </div>
                </div>

                {/* Node flow diagram matching Image 1 */}
                <div className="ks-graph-flow" style={{ position: 'relative', padding: '6px 0', alignItems: 'center' }}>
                  {/* Node 1: MCH-005 with soundwave */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div className="ks-waveform-bar-row" style={{ height: 10, opacity: 0.7 }}>
                      {[1, 2, 3].map(i => <div key={i} className="ks-waveform-mini" style={{ width: 2 }} />)}
                    </div>
                    <div className="ks-graph-node green">
                      <span style={{ fontSize: '9px', color: '#10B981' }}>●</span>
                      <span>MCH-005</span>
                    </div>
                  </div>

                  <span className="ks-graph-arrow" style={{ letterSpacing: '2px', color: 'rgba(255,255,255,0.25)', padding: '0 8px' }}>·········&gt;</span>

                  {/* Node 2 with stacked telemetry */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                      <div style={{ fontSize: '8px', color: '#64748B' }}>Data telemetry</div>
                      <div style={{ fontSize: '8px', color: '#64748B' }}>Data telemetry</div>
                      <div style={{ fontSize: '8px', color: '#34D399', fontWeight: 600 }}>Data telemetry ✓</div>
                    </div>
                    <div className="ks-graph-node active">
                      <span style={{ fontSize: '9px', color: '#60A5FA' }}>●</span>
                      <span>Piston Seal</span>
                    </div>
                    <div style={{ textAlign: 'center', lineHeight: 1.1 }}>
                      <div style={{ fontSize: '8px', color: '#64748B' }}>Data telemetry</div>
                      <div style={{ fontSize: '8px', color: '#64748B' }}>Data telemetry</div>
                      <div style={{ fontSize: '8px', color: '#34D399', fontWeight: 600 }}>Data telemetry ✓</div>
                    </div>
                  </div>

                  {/* Branch to Historical Cases */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0 8px', gap: 6 }}>
                    <div style={{ fontSize: '8.5px', color: '#34D399', whiteSpace: 'nowrap' }}>⇢ Data telemetry ✓</div>
                    <div className="ks-graph-node">
                      <span>3 Historical Cases</span>
                    </div>
                    <div style={{ fontSize: '8.5px', color: '#34D399', whiteSpace: 'nowrap' }}>⇢ Data telemetry ✓</div>
                  </div>
                </div>
              </div>

              {/* 4-Way Decision Section matching Image 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span className="ks-graph-section-label">4-Way Decision</span>
                  <div className="ks-waveform-bar-row">
                    {[1, 2, 3, 4].map(i => <div key={i} className="ks-waveform-mini" />)}
                  </div>
                </div>
                <div className="ks-decision-row">
                  <span className="ks-decision-btn inspect">Inspect</span>
                  <span className="ks-decision-btn repair">Repair</span>
                  <span className="ks-decision-btn replace-comp">Replace Component</span>
                  <span className="ks-decision-btn replace-machine">Replace Machine</span>
                </div>
              </div>
            </div>

            {/* Status Footer */}
            <div className="ks-engine-status-bar">
              <span className="ks-ai-status-dot">AI Engine: ACTIVE</span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>● Voice Node: Listening…</span>
            </div>
          </div>

          {/* Ambient soundwave decorative footer matching Image 1 */}
          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', alignItems: 'center', gap: 3, opacity: 0.25 }}>
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${Math.sin(i * 0.4) * 12 + 14}px`,
                  background: '#60A5FA',
                  borderRadius: 2
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Auth Card & Instant Demo Access (48%) ── */}
      <div className="ks-login-right">
        <div className="ks-login-right-inner">
          {/* Main White Sign-In Card matching Image 1 */}
          <div className="ks-auth-card">
            <h1 className="ks-auth-heading">Sign In</h1>
            <p className="ks-auth-subheading">
              Welcome back, enter your credentials to access the Industrial Gateway
            </p>

            {/* Google Sign-In Button */}
            <div style={{ marginBottom: 16 }}>
              <GoogleSignInButton onCredential={handleGoogleCredential} disabled={loading} />
            </div>

            {/* Divider */}
            <div className="ks-divider">
              <span className="ks-divider-line" />
              <span className="ks-divider-text">Or continue with email</span>
              <span className="ks-divider-line" />
            </div>

            {fieldError && (
              <div className="ks-field-error">
                <AlertTriangle size={15} /> {fieldError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="ks-field-group">
                <label className="ks-field-label">Email Address</label>
                <input
                  type="email"
                  className="ks-field-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email Address"
                  required
                />
              </div>

              <div className="ks-field-group">
                <div className="ks-field-label-row">
                  <label className="ks-field-label">Password</label>
                  <button type="button" className="ks-forgot-link">Forgot Password?</button>
                </div>
                <input
                  type="password"
                  className="ks-field-input"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />
              </div>

              <button
                type="submit"
                className="ks-submit-btn"
                disabled={loading}
              >
                {loading ? <span className="ks-spin" /> : <span>Sign In to Operations Studio →</span>}
              </button>
            </form>
          </div>

          {/* Instant Hackathon Demo Access OUTSIDE the card (Matches Image 1 directly) */}
          <div className="ks-demo-section-outside">
            <div className="ks-demo-divider-outside">
              <span className="ks-demo-divider-line" />
              <span className="ks-demo-divider-text">Instant Hackathon Demo Access</span>
              <span className="ks-demo-divider-line" />
            </div>

            <div className="ks-persona-row-outside">
              {/* Persona 1: Priya Sharma */}
              <div
                className={`ks-demo-card-outside ${selectedPersona === 'SUPERVISOR' ? 'active' : ''}`}
                onClick={() => {
                  selectPersona('SUPERVISOR');
                  login('supervisor@kirova.ai', 'Supervisor@123');
                }}
                title="Click to sign in instantly as Priya Sharma (Supervisor)"
              >
                <div className="ks-demo-card-top">
                  <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
                    alt="Priya Sharma"
                    className="ks-demo-avatar-img"
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="ks-demo-more-dots">•••</span>
                </div>
                <div className="ks-demo-name-outside">Priya Sharma</div>
                <span className="ks-demo-role-badge-outside supervisor">Supervisor</span>
                <div className="ks-demo-role-desc-outside">Role: Leader</div>
                <button type="button" className="ks-demo-action-btn-outside">
                  <span>👤</span>
                  <span>→</span>
                </button>
              </div>

              {/* Persona 2: Rajesh Kumar */}
              <div
                className={`ks-demo-card-outside ${selectedPersona === 'TECHNICIAN' ? 'active' : ''}`}
                onClick={() => {
                  selectPersona('TECHNICIAN');
                  login('tech.rajesh@kirova.ai', 'Tech@123');
                }}
                title="Click to sign in instantly as Rajesh Kumar (Technician)"
              >
                <div className="ks-demo-card-top">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
                    alt="Rajesh Kumar"
                    className="ks-demo-avatar-img"
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="ks-demo-more-dots">•••</span>
                </div>
                <div className="ks-demo-name-outside">Rajesh Kumar</div>
                <span className="ks-demo-role-badge-outside technician">Technician</span>
                <div className="ks-demo-role-desc-outside">Role: Hands-on</div>
                <button type="button" className="ks-demo-action-btn-outside">
                  <span>👤</span>
                  <span>→</span>
                </button>
              </div>

              {/* Persona 3: Amit Verma */}
              <div
                className={`ks-demo-card-outside ${selectedPersona === 'WORKER' ? 'active' : ''}`}
                onClick={() => {
                  selectPersona('WORKER');
                  login('worker.amit@kirova.ai', 'Worker@123');
                }}
                title="Click to sign in instantly as Amit Verma (Worker)"
              >
                <div className="ks-demo-card-top">
                  <img
                    src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80"
                    alt="Amit Verma"
                    className="ks-demo-avatar-img"
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                  <span className="ks-demo-more-dots">•••</span>
                </div>
                <div className="ks-demo-name-outside">Amit Verma</div>
                <span className="ks-demo-role-badge-outside worker">Worker</span>
                <div className="ks-demo-role-desc-outside">Role: Hands-on</div>
                <button type="button" className="ks-demo-action-btn-outside">
                  <span>👤</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Global Shell & Sidebar (Matches Image 2) ───────────────────
function Sidebar({
  view,
  setView,
  onExitToLanding,
  collapsed,
  onToggle
}: {
  view: string;
  setView: (v: string) => void;
  onExitToLanding?: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { auth, logout } = useAuth();
  const user = auth.user!;
  const isSupervisor = user.role === 'SUPERVISOR';
  const isWorker = user.email.includes('worker') || user.name.toLowerCase().includes('operator') || user.name.toLowerCase().includes('amit');

  // Role tailored navigation
  const operationsNav = isWorker
    ? [
        { id: 'new-report', icon: Mic, label: 'Report a Fault' },
        { id: 'my-reports', icon: ClipboardList, label: 'My Reports' },
      ]
    : isSupervisor
    ? [
        { id: 'dashboard', icon: LayoutDashboard, label: 'Operations Overview' },
        { id: 'new-report', icon: Mic, label: 'Report a Fault' },
        { id: 'incidents', icon: Siren, label: 'Incident Triage Queue', badge: '!' },
        { id: 'workorders', icon: Package, label: 'Work Orders' },
      ]
    : [
        { id: 'my-workorders', icon: Wrench, label: 'Technician Workbench' },
        { id: 'new-report', icon: Mic, label: 'Report a Fault' },
      ];

  const intelligenceNav = isWorker
    ? [
        { id: 'registry', icon: Cog, label: 'Machine Directory' },
      ]
    : isSupervisor
    ? [
        { id: 'intelligence', icon: BrainCircuit, label: 'Evidence Graph Intelligence' },
        { id: 'registry', icon: Cog, label: 'Machine Registry' },
        { id: 'audit', icon: ShieldCheck, label: 'Audit Trail' },
      ]
    : [
        { id: 'intelligence', icon: BrainCircuit, label: 'Evidence Graph Intelligence' },
        { id: 'registry', icon: Cog, label: 'Machine Registry' },
      ];

  return (
    <nav className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`} style={{ background: '#0B1120' }}>
      {/* Brand Header */}
      <div className="sidebar-logo" style={{ borderBottomColor: 'rgba(255, 255, 255, 0.08)' }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #1E293B, #0F172A)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#60A5FA',
          fontWeight: 800,
          fontSize: 12
        }}>
          AI
        </div>
        <div className="sidebar-logo-text">
          <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>KIROVA AI</span>
          <span style={{ color: '#94A3B8', fontSize: 10, letterSpacing: '0.04em' }}>Voice → Verified Action</span>
        </div>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <PanelLeftOpen size={16} color="#94A3B8" /> : <PanelLeftClose size={16} color="#94A3B8" />}
        </button>
      </div>

      <div className="sidebar-nav">
        {/* OPERATIONS GROUP */}
        <div className="ks-sidebar-section">OPERATIONS</div>
        {operationsNav.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <item.icon className="nav-item-icon" size={17} strokeWidth={2} aria-hidden="true" />
            <span className="nav-item-label">{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}

        {/* INTELLIGENCE GROUP */}
        <div className="ks-sidebar-section">INTELLIGENCE</div>
        {intelligenceNav.map(item => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            className={`nav-item ${view === item.id ? 'active' : ''}`}
            onClick={() => setView(item.id)}
          >
            <item.icon className="nav-item-icon" size={17} strokeWidth={2} aria-hidden="true" />
            <span className="nav-item-label">{item.label}</span>
          </button>
        ))}

        {onExitToLanding && (
          <button
            type="button"
            className="nav-item"
            style={{ marginTop: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '12px' }}
            onClick={onExitToLanding}
            title="Return to Public Homepage"
          >
            <Globe2 className="nav-item-icon" size={17} strokeWidth={2} aria-hidden="true" />
            <span className="nav-item-label">Public Website</span>
          </button>
        )}
      </div>

      {/* Sidebar Footer User Card with High Contrast (Matches Image 2) */}
      <div className="sidebar-user" style={{ borderTopColor: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={
              isSupervisor
                ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
                : isWorker
                ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
            }
            alt={user.name}
            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            onError={e => { (e.target as HTMLElement).style.display = 'none'; }}
          />
          <div className="user-info">
            <div className="ks-user-name" style={{ color: '#FFFFFF', fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>
              {user.name.replace(/\(.*?\)/g, '').trim()}
            </div>
            <div className="ks-user-role" style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
              {isSupervisor ? 'Supervisor' : isWorker ? 'Worker' : 'Technician'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 6px #10B981',
              display: 'inline-block'
            }}
            title="Online • Connected"
          />
          <button
            className="user-logout-btn"
            title="Sign out"
            aria-label="Sign out"
            onClick={logout}
            style={{ color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Top Header with Demo Role Switcher (Matches Image 2) ───────
function Header({
  pageTitle,
  breadcrumbs,
  onExitToLanding
}: {
  pageTitle: string;
  breadcrumbs: string[];
  onExitToLanding?: () => void;
}) {
  const { auth, switchDemoUser } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = auth.user!;
  const isSupervisor = user.role === 'SUPERVISOR';
  const isWorker = user.email.includes('worker') || user.name.toLowerCase().includes('amit');

  const currentRoleType: DemoPersonaRole = isSupervisor ? 'SUPERVISOR' : isWorker ? 'WORKER' : 'TECHNICIAN';

  return (
    <div className="page-header" style={{ background: '#FAF8F5', borderBottom: '1px solid #E2E8F0' }}>
      <div>
        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span>/</span>}
              <span>{b}</span>
            </React.Fragment>
          ))}
        </div>
        <div className="page-title" style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
          {pageTitle}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Global Search matching Image 2 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '7px 12px',
          width: 260
        }}>
          <Search size={14} color="#94A3B8" />
          <input
            style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 12, width: '100%', color: '#0F172A' }}
            placeholder="Search incidents, assets, or actions..."
          />
        </div>

        {/* Live Audio Stream Pill matching Image 2 */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 8,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          color: '#475569'
        }}>
          <span>🎚️</span>
          <span>Voice Stream: <strong style={{ color: '#059669' }}>Active</strong> • Live Feed</span>
        </div>

        {/* Demo Role Switcher Dropdown */}
        <div className="ks-role-switcher">
          <button
            type="button"
            className={`ks-role-badge ${currentRoleType.toLowerCase()}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span>{currentRoleType}</span>
            <ChevronDown size={12} />
          </button>

          {dropdownOpen && (
            <div className="ks-role-dropdown">
              <div style={{ padding: '6px 10px', fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                Switch Demo Persona
              </div>
              <button
                type="button"
                className={`ks-role-dropdown-item ${currentRoleType === 'SUPERVISOR' ? 'active' : ''}`}
                onClick={() => { switchDemoUser('SUPERVISOR'); setDropdownOpen(false); }}
              >
                <div className="ks-role-dropdown-avatar supervisor">PS</div>
                <div>
                  <div className="ks-role-dropdown-name">Priya Sharma</div>
                  <div className="ks-role-dropdown-role">Supervisor · Leader</div>
                </div>
              </button>
              <button
                type="button"
                className={`ks-role-dropdown-item ${currentRoleType === 'TECHNICIAN' ? 'active' : ''}`}
                onClick={() => { switchDemoUser('TECHNICIAN'); setDropdownOpen(false); }}
              >
                <div className="ks-role-dropdown-avatar technician">RK</div>
                <div>
                  <div className="ks-role-dropdown-name">Rajesh Kumar</div>
                  <div className="ks-role-dropdown-role">Technician · Hands-on</div>
                </div>
              </button>
              <button
                type="button"
                className={`ks-role-dropdown-item ${currentRoleType === 'WORKER' ? 'active' : ''}`}
                onClick={() => { switchDemoUser('WORKER'); setDropdownOpen(false); }}
              >
                <div className="ks-role-dropdown-avatar worker">AV</div>
                <div>
                  <div className="ks-role-dropdown-name">Amit Verma</div>
                  <div className="ks-role-dropdown-role">Worker / Operator</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {onExitToLanding && (
          <button
            type="button"
            onClick={onExitToLanding}
            className="btn btn-secondary btn-sm"
            title="View Public Landing Page"
          >
            <Globe2 size={13} aria-hidden="true" /> Public Site
          </button>
        )}
      </div>
    </div>
  );
}

// ── Supervisor Operations Overview (Matches Image 2) ──────────
function SupervisorOverview() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest('/api/dashboard', {}, auth.token!)
      .then(d => { setMetrics(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading operations studio…</span></div>;

  const handleQuickApprove = () => {
    addToast({
      type: 'success',
      title: 'Action Approved & Work Order Created',
      message: 'WO-2026-0018 generated for Cylinder Seal Kit replacement.'
    });
  };

  const m = metrics?.metrics || {
    openIncidents: 4,
    awaitingApprovalOrders: 3,
    activeWorkOrders: 2,
    verifiedClosedOrders: 10,
    averageResolutionHours: 3.4
  };

  return (
    <div>
      {/* 4-Column KPI Grid matching Image 2 */}
      <div className="ks-kpi-grid">
        {/* Card 1: Open Incidents */}
        <div className="ks-kpi-card amber">
          <div className="ks-kpi-value">{m.openIncidents || 4}</div>
          <div className="ks-kpi-label">Open Incidents</div>
          <div className="ks-kpi-sublabel">Requires action</div>
        </div>

        {/* Card 2: Pending Decisions */}
        <div className="ks-kpi-card blue">
          <div className="ks-kpi-value">{m.awaitingApprovalOrders || 3}</div>
          <div className="ks-kpi-label">Pending 4-Way Decisions</div>
          <div className="ks-kpi-sublabel">Triage queue</div>
        </div>

        {/* Card 3: Active Work Orders */}
        <div className="ks-kpi-card violet">
          <div className="ks-kpi-value">{m.activeWorkOrders || 2}</div>
          <div className="ks-kpi-label">Active Work Orders</div>
          <div className="ks-kpi-sublabel">In progress</div>
        </div>

        {/* Card 4: Verified & Closed */}
        <div className="ks-kpi-card green">
          <div className="ks-kpi-value">{m.verifiedClosedOrders || 10}</div>
          <div className="ks-kpi-label">Verified & Closed</div>
          <div className="ks-kpi-sublabel">98.4% Uptime this week</div>
        </div>
      </div>

      {/* Main Split View: Interactive Evidence Graph + 4-Way Decision Matrix (Matches Image 2) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, marginBottom: 28, alignItems: 'stretch' }}>
        <InteractiveEvidenceGraphView />
        <FourWayDecisionMatrixView onApprove={handleQuickApprove} />
      </div>

      {/* Recurring Fault Clusters Section (Resolved against Machine Registry) */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <BrainCircuit size={18} color="#2563EB" />
              <span>Recurring Fault Evidence Clusters</span>
            </div>
            <div className="card-subtitle">AI-correlated failure mode patterns with verified resolution history</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Cluster 1 */}
          <div className="ks-fault-card">
            <div className="ks-fault-card-top">
              <div>
                <span className="ks-fault-mode-badge" style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' }}>
                  Fluid Leakage & Pressure Loss
                </span>
                <span className="ks-fault-machine-pill" style={{ marginLeft: 8 }}>
                  MCH-005 · 50-Ton Hydraulic Press
                </span>
                <span className="ks-fault-location-pill">Stamping Area</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#D97706' }}>3× Recurrence</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              Ram cylinder seal micro-cracking causing fluid weepage under 50-ton cycle. 1 temporary tightening failed; 1 seal kit replacement verified.
            </div>
            <button type="button" className="ks-trace-btn">Trace in Evidence Graph →</button>
          </div>

          {/* Cluster 2 */}
          <div className="ks-fault-card">
            <div className="ks-fault-card-top">
              <div>
                <span className="ks-fault-mode-badge" style={{ background: '#FFF1F2', color: '#BE123C', border: '1px solid #FECDD3' }}>
                  Mechanical Jam & Belt Slippage
                </span>
                <span className="ks-fault-machine-pill" style={{ marginLeft: 8 }}>
                  MCH-004 · Main Conveyor Belt 4
                </span>
                <span className="ks-fault-location-pill">Shop Floor Bay B</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#2563EB' }}>2× Recurrence</span>
            </div>
            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
              Tensioner roller bearing play triggers interlock sensor trip under load. Verified fix: replaced tensioner roller assembly.
            </div>
            <button type="button" className="ks-trace-btn">Trace in Evidence Graph →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Technician Investigation Workbench (Rajesh Kumar) ──────────
function TechnicianWorkbench() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [findings, setFindings] = useState('');
  const [resolution, setResolution] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest('/api/work-orders/assigned', {}, auth.token!)
      .then(d => {
        const list = d.workOrders || [];
        setOrders(list);
        if (list.length > 0 && !selectedOrder) setSelectedOrder(list[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [auth.token, selectedOrder]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading workbench…</span></div>;

  const updateStatus = async (status: string, extra: object = {}) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      await apiRequest(`/api/work-orders/${selectedOrder.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, ...extra })
      }, auth.token!);
      addToast({ type: 'success', title: `Status updated to ${formatStatus(status)}` });
      load();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="ks-workbench">
      {/* LEFT PANE: Prioritized Work Order Queue (38%) */}
      <div className="ks-workbench-left">
        <div className="ks-workbench-header">
          <span>Assigned Work Orders ({orders.length})</span>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={12} /></button>
        </div>
        {orders.length === 0 ? (
          <EmptyState icon="🔧" title="No assigned work" desc="All current tasks completed." />
        ) : (
          orders.map(o => (
            <div
              key={o.id}
              className={`ks-queue-item ${selectedOrder?.id === o.id ? 'selected' : ''}`}
              onClick={() => setSelectedOrder(o)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <IdPill id={o.work_order_number} />
                <span className={`badge priority-badge ${getPriorityClass(o.priority)}`}>{o.priority}</span>
              </div>
              <div className="ks-queue-item-machine">{o.machine_name}</div>
              <div className="ks-queue-item-desc">{o.symptom_text}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: '#94A3B8' }}>
                <span className={`badge ${getStatusBadgeClass(o.status)}`} style={{ fontSize: 9 }}>{formatStatus(o.status)}</span>
                <span>{o.asset_tag}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* RIGHT PANE: Live Evidence & Decision Inspector (62%) */}
      <div className="ks-workbench-right">
        {selectedOrder ? (
          <div style={{ padding: 20 }}>
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <IdPill id={selectedOrder.work_order_number} />
                  <span className={`badge priority-badge ${getPriorityClass(selectedOrder.priority)}`}>
                    {selectedOrder.priority}
                  </span>
                  <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`}>
                    {formatStatus(selectedOrder.status)}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  {selectedOrder.machine_name} ({selectedOrder.asset_tag})
                </h3>
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, color: '#64748B' }}>
                <div>Report: {selectedOrder.report_number}</div>
                <div>Bay: {selectedOrder.machine_location || 'Shop Floor'}</div>
              </div>
            </div>

            {/* Epistemic Breakdown */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 8 }}>
                Epistemic Case Breakdown
              </div>
              <div className="epis-card">
                <EpistemicBadge type="FACT" />
                <div className="epis-card-body">
                  <div className="epis-card-text">{selectedOrder.symptom_text}</div>
                  <div className="epis-card-meta">Reported by Amit Verma · Acoustic voice capture</div>
                </div>
              </div>
              <div className="epis-card">
                <EpistemicBadge type="HISTORY" />
                <div className="epis-card-body">
                  <div className="epis-card-text">
                    Similar component service on {selectedOrder.asset_tag} 45 days prior. Verified closed outcome logged.
                  </div>
                  <div className="epis-card-meta">Retrieved from machine maintenance ledger</div>
                </div>
              </div>
              <div className="epis-card">
                <EpistemicBadge type="INFERENCE" />
                <div className="epis-card-body">
                  <div className="epis-card-text">
                    High likelihood of seal extrusion due to pressure oscillation. Recommended component replacement.
                  </div>
                  <div className="epis-card-meta">Confidence score: 94.2% · Traceable to failure cluster</div>
                </div>
              </div>
            </div>

            {/* Work Execution Action Form */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>
                Technician Action & Resolution
              </div>

              {selectedOrder.status === 'ASSIGNED' && (
                <button
                  className="btn btn-primary"
                  onClick={() => updateStatus('IN_PROGRESS')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner /> : '▶ Start Work on Asset'}
                </button>
              )}

              {selectedOrder.status === 'IN_PROGRESS' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Inspection Findings</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={findings}
                      onChange={e => setFindings(e.target.value)}
                      placeholder="e.g., Cylinder seal lips degraded, minor score marks on rod..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Resolution Summary</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      placeholder="Describe parts replaced and verification steps completed..."
                    />
                  </div>
                  <button
                    className="btn btn-success"
                    onClick={() => updateStatus('RESOLVED', { findings, resolutionSummary: resolution })}
                    disabled={!resolution.trim() || actionLoading}
                  >
                    {actionLoading ? <Spinner /> : '✓ Submit for Outcome Verification'}
                  </button>
                </div>
              )}

              {['RESOLVED', 'VERIFIED_CLOSED'].includes(selectedOrder.status) && (
                <div className="alert alert-success">
                  ✓ Resolution submitted. Awaiting supervisor sign-off.
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState icon="👈" title="Select a work order" desc="Click an incident on the left to inspect." />
        )}
      </div>
    </div>
  );
}

// ── Worker Shop-Floor Voice-First Studio (Amit Verma) ──────────
function WorkerVoiceStudio({ onDone }: { onDone: () => void }) {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('Hinglish');
  const [selectedMachine, setSelectedMachine] = useState<string>('mch-005');
  const [symptomText, setSymptomText] = useState('');
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedSymptomTags, setSelectedSymptomTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest('/api/machines', {}, auth.token!)
      .then(d => setMachines(d.machines || []))
      .catch(() => {});
  }, [auth.token]);

  const quickSymptoms = [
    'Abnormal Vibration',
    'Fluid / Oil Leak',
    'Overheating',
    'Mechanical Jam',
    'Pressure Drop',
    'Screeching Noise',
  ];

  const languages = ['Hindi', 'Hinglish', 'Tamil', 'Telugu', 'English'];

  const toggleSymptom = (tag: string) => {
    if (selectedSymptomTags.includes(tag)) {
      setSelectedSymptomTags(selectedSymptomTags.filter(t => t !== tag));
    } else {
      setSelectedSymptomTags([...selectedSymptomTags, tag]);
    }
  };

  const loadHinglishSample = () => {
    setSelectedMachine('mch-005');
    setSymptomText('Machine 5 ka hydraulic cylinder slow descend ho raha hai aur neeche seal se oil pool ho raha hai. Shift ke dauraan continuous hissing noise aa rahi hai.');
    setSelectedSymptomTags(['Fluid / Oil Leak', 'Pressure Drop']);
    addToast({
      type: 'info',
      title: 'Hinglish Sample Loaded',
      message: 'Shop-floor incident ready for AI structuring.'
    });
  };

  const handleSubmit = async () => {
    if (!symptomText.trim()) {
      addToast({ type: 'error', title: 'Please enter or record a fault description' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest('/api/reports', {
        method: 'POST',
        body: JSON.stringify({
          text: symptomText,
          machineId: selectedMachine || undefined
        })
      }, auth.token!);
      addToast({
        type: 'success',
        title: 'Fault Reported Successfully',
        message: `Report ${res.reportNumber || 'submitted'} is now in the supervisor triage queue.`
      });
      onDone();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ks-studio-grid">
      {/* LEFT COLUMN: Input & Voice Capture Studio */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mic size={18} color="#2563EB" />
              <span>Shop-Floor Voice Fault Reporter</span>
            </div>
            <div className="card-subtitle">Report machine issues in 15 seconds in any language</div>
          </div>
        </div>

        {/* Language selector */}
        <div className="ks-lang-pills">
          {languages.map(lang => (
            <button
              key={lang}
              type="button"
              className={`ks-lang-pill ${selectedLanguage === lang ? 'active' : ''}`}
              onClick={() => setSelectedLanguage(lang)}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Voice Recorder Box */}
        <VoiceRecorder onAudioReady={() => {
          loadHinglishSample();
          addToast({ type: 'success', title: 'Audio Processed', message: 'Hinglish transcript converted.' });
        }} />

        {/* 1-Click Hinglish Sample Button */}
        <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 16 }}>
          <button
            type="button"
            className="ks-voice-sample-btn"
            onClick={loadHinglishSample}
          >
            <span>✨</span>
            <span>Load Realistic Hinglish Shop-Floor Sample</span>
          </button>
        </div>

        {/* Machine selection grid */}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label required">Select Machine on Shop-Floor</label>
          <div className="ks-machine-grid">
            {machines.slice(0, 6).map(m => (
              <div
                key={m.id}
                className={`ks-machine-chip ${selectedMachine === m.id ? 'selected' : ''}`}
                onClick={() => setSelectedMachine(m.id)}
              >
                <span className="ks-machine-chip-tag">{m.asset_tag}</span>
                <span className="ks-machine-chip-name">{m.name}</span>
                <span className="ks-machine-chip-loc">{m.location}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick symptom tags */}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label">Quick Symptom Chips (Tap to add)</label>
          <div className="ks-symptom-chips">
            {quickSymptoms.map(tag => (
              <button
                key={tag}
                type="button"
                className={`ks-symptom-chip ${selectedSymptomTags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleSymptom(tag)}
              >
                <span>+</span>
                <span>{tag}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description textarea */}
        <div className="form-group">
          <label className="form-label required">Transcribed Fault Description</label>
          <textarea
            className="form-control"
            rows={4}
            value={symptomText}
            onChange={e => setSymptomText(e.target.value)}
            placeholder="Type or speak the machine symptoms..."
          />
        </div>

        <button
          className="btn btn-primary w-full"
          onClick={handleSubmit}
          disabled={submitting || !symptomText.trim()}
        >
          {submitting ? <Spinner /> : 'Submit Fault for AI Triage →'}
        </button>
      </div>

      {/* RIGHT COLUMN: Live AI Extraction Preview */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Live AI Extraction & Provenance</div>
            <div className="card-subtitle">Real-time structured extraction from operator input</div>
          </div>
        </div>

        <div className="ks-extraction-preview">
          <div className="ks-extraction-row">
            <span className="ks-extraction-key">Detected Asset</span>
            <span className="ks-extraction-val">
              <IdPill id="MCH-005" /> 50-Ton Hydraulic Press
            </span>
          </div>
          <div className="ks-extraction-row">
            <span className="ks-extraction-key">Component</span>
            <span className="ks-extraction-val">Cylinder Gland & Rod Seal Kit</span>
          </div>
          <div className="ks-extraction-row">
            <span className="ks-extraction-key">Symptom</span>
            <span className="ks-extraction-val">
              {selectedSymptomTags.length > 0 ? selectedSymptomTags.join(', ') : 'Fluid Leakage / Pressure Drop'}
            </span>
          </div>
          <div className="ks-extraction-row">
            <span className="ks-extraction-key">Urgency</span>
            <span className="ks-extraction-val">
              <span className="badge priority-badge priority-critical">CRITICAL</span>
            </span>
          </div>
          <div className="ks-extraction-row">
            <span className="ks-extraction-key">Acoustic Signal</span>
            <span className="ks-extraction-val">Hissing bypass noise detected (2.4 kHz)</span>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
            Frontline 5-Stage Traceability
          </div>
          <div className="ks-progress-tracker">
            <div className="ks-progress-step">
              <div className="ks-progress-dot done">✓</div>
              <div className="ks-progress-label done">Reported</div>
            </div>
            <div className="ks-progress-line done" />
            <div className="ks-progress-step">
              <div className="ks-progress-dot active">2</div>
              <div className="ks-progress-label active">Evidence</div>
            </div>
            <div className="ks-progress-line" />
            <div className="ks-progress-step">
              <div className="ks-progress-dot">3</div>
              <div className="ks-progress-label">Decision</div>
            </div>
            <div className="ks-progress-line" />
            <div className="ks-progress-step">
              <div className="ks-progress-dot">4</div>
              <div className="ks-progress-label">Repair</div>
            </div>
            <div className="ks-progress-line" />
            <div className="ks-progress-step">
              <div className="ks-progress-dot">5</div>
              <div className="ks-progress-label">Verified</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Worker My Reports Tracker ─────────────────────────────────
function WorkerReportsView() {
  const { auth } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest('/api/reports', {}, auth.token!)
      .then(d => { setReports(d.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading reports…</span></div>;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">My Submitted Fault Reports</div>
          <div className="card-subtitle">Track the live progress of faults you reported</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      {reports.length === 0 ? (
        <EmptyState icon="📋" title="No reports yet" desc="Use the Report a Fault studio to submit your first report." />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Report #</th>
                <th>Machine</th>
                <th>Symptom</th>
                <th>Status</th>
                <th>Progress Stage</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td><IdPill id={r.report_number} /></td>
                  <td>{r.machine_name || r.asset_tag || '—'}</td>
                  <td><span className="truncate" style={{ maxWidth: 220, display: 'block' }}>{r.symptom_text}</span></td>
                  <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{formatStatus(r.status)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.status === 'VERIFIED_CLOSED' ? '#059669' : '#CBD5E1' }} />
                    </div>
                  </td>
                  <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Supervisor Incidents Queue View ────────────────────────────
function SupervisorIncidentsView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest('/api/reports', {}, auth.token!)
      .then(d => { setReports(d.reports || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading incident queue…</span></div>;

  const convertToWO = async (reportId: string) => {
    try {
      await apiRequest('/api/work-orders', {
        method: 'POST',
        body: JSON.stringify({ incidentId: reportId, priority: 'HIGH' })
      }, auth.token!);
      addToast({ type: 'success', title: 'Work order created from incident!' });
      setSelected(null);
      load();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message });
    }
  };

  return (
    <div>
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Incident: ${selected?.report_number}`} size="modal-lg">
        {selected && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`badge ${getStatusBadgeClass(selected.status)}`}>{formatStatus(selected.status)}</span>
              <span className={`badge priority-badge ${getPriorityClass(selected.urgency_suggestion)}`}>{selected.urgency_suggestion}</span>
            </div>
            <div className="info-grid mb-5">
              {[
                ['Machine', selected.machine_name || '—'],
                ['Asset Tag', selected.asset_tag || '—'],
                ['Reporter', selected.reporter_name || 'Line Operator'],
                ['Category', formatEnumLabel(selected.symptom_category)],
              ].map(([l, v]) => (
                <div key={l} className="info-item"><span className="info-label">{l}</span><span className="info-value">{v}</span></div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Symptom Description</label>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, fontSize: 13, color: '#0F172A' }}>
                {selected.symptom_text}
              </div>
            </div>
            {selected.status === 'AWAITING_REVIEW' && (
              <button className="btn btn-primary" onClick={() => convertToWO(selected.id)}>
                Convert to Work Order →
              </button>
            )}
          </div>
        )}
      </Modal>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Incident Triage Queue</div>
            <div className="card-subtitle">Active machine faults requiring supervisor review and work order conversion</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Report #</th>
                <th>Machine</th>
                <th>Symptom</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td><IdPill id={r.report_number} /></td>
                  <td>{r.machine_name || '—'}</td>
                  <td><span className="truncate" style={{ maxWidth: 200, display: 'block' }}>{r.symptom_text}</span></td>
                  <td><span className={`badge priority-badge ${getPriorityClass(r.urgency_suggestion)}`}>{r.urgency_suggestion}</span></td>
                  <td><span className={`badge ${getStatusBadgeClass(r.status)}`}>{formatStatus(r.status)}</span></td>
                  <td className="text-xs text-muted">{formatDate(r.created_at)}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => setSelected(r)}>Triage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Supervisor Work Orders Management View ────────────────────
function SupervisorWorkOrdersView() {
  const { auth } = useAuth();
  const { addToast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    apiRequest('/api/work-orders', {}, auth.token!)
      .then(d => { setOrders(d.workOrders || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [auth.token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="loading-overlay"><Spinner /><span>Loading work orders…</span></div>;

  const approveOrder = async (id: string) => {
    try {
      await apiRequest(`/api/work-orders/${id}/approve`, { method: 'POST', body: '{}' }, auth.token!);
      addToast({ type: 'success', title: 'Work order approved!' });
      load();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message });
    }
  };

  const verifyCloseOrder = async (id: string) => {
    try {
      await apiRequest(`/api/work-orders/${id}/verify-close`, {
        method: 'POST',
        body: JSON.stringify({ supervisorClosureNotes: 'Verified optimal resolution under full shift load.' })
      }, auth.token!);
      addToast({ type: 'success', title: 'Work order verified and closed!' });
      load();
    } catch (e: any) {
      addToast({ type: 'error', title: e.message });
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Fleet Work Orders</div>
          <div className="card-subtitle">Manage approvals, assignment, and verified closures</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>WO #</th>
              <th>Machine</th>
              <th>Symptom</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Technician</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td><IdPill id={o.work_order_number} /></td>
                <td><strong>{o.machine_name}</strong> <span className="text-xs text-muted">({o.asset_tag})</span></td>
                <td><span className="truncate" style={{ maxWidth: 180, display: 'block' }}>{o.symptom_text}</span></td>
                <td><span className={`badge priority-badge ${getPriorityClass(o.priority)}`}>{o.priority}</span></td>
                <td><span className={`badge ${getStatusBadgeClass(o.status)}`}>{formatStatus(o.status)}</span></td>
                <td>{o.technician_name || <span className="text-muted">Unassigned</span>}</td>
                <td>
                  {o.status === 'AWAITING_APPROVAL' && (
                    <button className="btn btn-success btn-sm" onClick={() => approveOrder(o.id)}>Approve</button>
                  )}
                  {o.status === 'RESOLVED' && (
                    <button className="btn btn-primary btn-sm" onClick={() => verifyCloseOrder(o.id)}>Verify & Close</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Maintenance Intelligence & Machine Registry Views ─────────
function MaintenanceIntelligenceView() {
  const { auth } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    apiRequest('/api/machines', {}, auth.token!)
      .then(d => {
        const list = d.machines || [];
        setMachines(list);
        if (list.length > 0) selectMachine(list[0]);
      })
      .catch(() => {});
  }, [auth.token]);

  const selectMachine = async (m: any) => {
    setSelectedMachine(m);
    try {
      const d = await apiRequest(`/api/machines/${m.id}/history`, {}, auth.token!);
      setHistory(d.verifiedClosedIncidents || []);
    } catch {
      setHistory([]);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <InteractiveEvidenceGraphView />
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Machine Maintenance Knowledge Graph</div>
            <div className="card-subtitle">Select any machine to view verified failure progression & repair outcomes</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 16 }}>
          {machines.map(m => (
            <button
              key={m.id}
              type="button"
              className={`btn ${selectedMachine?.id === m.id ? 'btn-primary' : 'btn-ghost'} btn-sm`}
              onClick={() => selectMachine(m)}
            >
              {m.asset_tag} · {m.name}
            </button>
          ))}
        </div>

        {history.length === 0 ? (
          <EmptyState icon="⚙️" title="No past verified cases" desc="No previous verified repairs logged for this asset." />
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Report</th>
                  <th>Work Order</th>
                  <th>Symptom</th>
                  <th>Resolution Summary</th>
                  <th>Technician Findings</th>
                  <th>Verified Date</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td><IdPill id={h.reportNumber} /></td>
                    <td><IdPill id={h.workOrderNumber} /></td>
                    <td>{h.symptomText}</td>
                    <td><strong style={{ color: '#059669' }}>{h.resolutionSummary}</strong></td>
                    <td>{h.technicianFindings}</td>
                    <td className="text-xs text-muted">{formatDate(h.verifiedAt)}</td>
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

function MachineRegistryView() {
  const { auth } = useAuth();
  const [machines, setMachines] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    apiRequest('/api/machines', {}, auth.token!)
      .then(d => setMachines(d.machines || []))
      .catch(() => {});
  }, [auth.token]);

  const filtered = machines.filter(m =>
    `${m.asset_tag} ${m.name} ${m.type} ${m.location}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Machine Registry</div>
          <div className="card-subtitle">{machines.length} registered assets across plant operations</div>
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <input
          className="form-control"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filter machines by tag, name, type, or bay..."
        />
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Asset Tag</th>
              <th>Machine Name</th>
              <th>Equipment Type</th>
              <th>Bay / Location</th>
              <th>Model / Serial</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id}>
                <td><IdPill id={m.asset_tag} /></td>
                <td><strong>{m.name}</strong></td>
                <td>{formatEnumLabel(m.type)}</td>
                <td>{m.location}</td>
                <td className="font-mono text-xs text-muted">{m.model_number || '—'} · {m.serial_number || '—'}</td>
                <td><span className="badge badge-approved">Active</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogsView() {
  const { auth } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    apiRequest('/api/audit-logs?limit=50', {}, auth.token!)
      .then(d => setLogs(d.auditLogs || []))
      .catch(() => {});
  }, [auth.token]);

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Immutable Audit Trail</div>
          <div className="card-subtitle">Cryptographically verified tamper-evident operational history</div>
        </div>
      </div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Reason / Notes</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={l.id || i}>
                <td className="text-xs text-muted">{formatDate(l.timestamp)}</td>
                <td><strong>{l.actor_name || l.actor_id || 'System'}</strong></td>
                <td><span className="badge badge-draft">{l.action}</span></td>
                <td className="font-mono text-xs">{l.entity_type} {l.entity_id?.slice(0, 10)}</td>
                <td className="text-xs">{l.reason || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── App Content Shell ─────────────────────────────────────────
function AppContent({ onExitToLanding }: { onExitToLanding?: () => void }) {
  const { auth } = useAuth();
  const user = auth.user!;
  const isSupervisor = user.role === 'SUPERVISOR';
  const isWorker = user.email.includes('worker') || user.name.toLowerCase().includes('amit');

  const defaultView = isWorker ? 'new-report' : isSupervisor ? 'dashboard' : 'my-workorders';
  const [view, setView] = useState(defaultView);
  const [collapsed, setCollapsed] = useState(false);

  // Sync default view when user persona changes
  useEffect(() => {
    setView(isWorker ? 'new-report' : isSupervisor ? 'dashboard' : 'my-workorders');
  }, [user.email, isSupervisor, isWorker]);

  const viewTitles: Record<string, { title: string; crumbs: string[] }> = {
    dashboard: { title: 'MCH-005 Triage', crumbs: ['Enterprise', 'Operations', 'MCH-005'] },
    'new-report': { title: 'Report a Fault', crumbs: ['Enterprise', 'Shop Floor', 'Fault Reporter'] },
    'my-reports': { title: 'My Submitted Reports', crumbs: ['Enterprise', 'Frontline', 'Reports'] },
    'my-workorders': { title: 'Technician Workbench', crumbs: ['Enterprise', 'Maintenance', 'Active Work Orders'] },
    incidents: { title: 'Incident Triage Queue', crumbs: ['Enterprise', 'Operations', 'Incident Queue'] },
    workorders: { title: 'Fleet Work Orders', crumbs: ['Enterprise', 'Operations', 'Work Orders'] },
    intelligence: { title: 'Evidence Graph Intelligence', crumbs: ['Enterprise', 'Intelligence', 'Graph'] },
    registry: { title: 'Machine Registry', crumbs: ['Enterprise', 'Assets', 'Registry'] },
    audit: { title: 'Audit Trail', crumbs: ['Enterprise', 'Compliance', 'Audit Logs'] },
  };

  const currentMeta = viewTitles[view] || { title: 'Operations Studio', crumbs: ['Enterprise', 'Operations'] };

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        onExitToLanding={onExitToLanding}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className="main-content">
        <Header
          pageTitle={currentMeta.title}
          breadcrumbs={currentMeta.crumbs}
          onExitToLanding={onExitToLanding}
        />
        <div className="page-body">
          {view === 'dashboard' && <SupervisorOverview />}
          {view === 'new-report' && <WorkerVoiceStudio onDone={() => setView('my-reports')} />}
          {view === 'my-reports' && <WorkerReportsView />}
          {view === 'my-workorders' && <TechnicianWorkbench />}
          {view === 'incidents' && <SupervisorIncidentsView />}
          {view === 'workorders' && <SupervisorWorkOrdersView />}
          {view === 'intelligence' && <MaintenanceIntelligenceView />}
          {view === 'registry' && <MachineRegistryView />}
          {view === 'audit' && <AuditLogsView />}
        </div>
      </main>
    </div>
  );
}

// ── Root App Component ────────────────────────────────────────
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
    return 'landing';
  };

  const [currentRoute, setCurrentRoute] = useState<'landing' | 'login' | 'app'>(getInitialRoute);

  useEffect(() => {
    const handlePopState = () => setCurrentRoute(getInitialRoute());
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

  const googleLogin = useCallback(async (credential: string) => {
    const data = await apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
    localStorage.setItem('ks_token', data.token);
    localStorage.setItem('ks_user', JSON.stringify(data.user));
    setAuth({ token: data.token, user: data.user });
    navigateTo('app');
  }, []);

  const switchDemoUser = useCallback(async (persona: DemoPersonaRole) => {
    const credentials = {
      SUPERVISOR: { email: 'supervisor@kirova.ai', password: 'Supervisor@123' },
      TECHNICIAN: { email: 'tech.rajesh@kirova.ai', password: 'Tech@123' },
      WORKER: { email: 'worker.amit@kirova.ai', password: 'Worker@123' },
    }[persona];
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
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
          onLaunchStudio={() => auth.user ? navigateTo('app') : navigateTo('login')}
          onSignIn={() => navigateTo('login')}
          onSignUp={() => navigateTo('login')}
          isAuthenticated={!!auth.user}
          userName={auth.user?.name}
          onDemoPersona={switchDemoUser}
        />
      );
    }

    if (currentRoute === 'login') {
      if (auth.user) return <AppContent onExitToLanding={() => navigateTo('landing')} />;
      return <LoginPage onBackToLanding={() => navigateTo('landing')} />;
    }

    if (!auth.user) {
      return <LoginPage onBackToLanding={() => navigateTo('landing')} />;
    }
    return <AppContent onExitToLanding={() => navigateTo('landing')} />;
  };

  return (
    <AuthContext.Provider value={{ auth, login, googleLogin, switchDemoUser, logout }}>
      <ToastProvider>
        {renderScreen()}
      </ToastProvider>
    </AuthContext.Provider>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  HelpCircle,
  ShieldAlert,
  UserCheck,
  FileText,
  Sparkles,
  Mic,
  Award,
  Layers,
  AlertCircle
} from 'lucide-react';

interface SupervisorTriageWorkspaceProps {
  incidentId: string;
  onBack: () => void;
  onDecisionSuccess: () => void;
  token: string;
  addToast: (toast: any) => void;
}

export function SupervisorTriageWorkspace({
  incidentId,
  onBack,
  onDecisionSuccess,
  token,
  addToast
}: SupervisorTriageWorkspaceProps) {
  const [incident, setIncident] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [candidatesData, setCandidatesData] = useState<any>(null);
  const [recordedDecision, setRecordedDecision] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal States
  const [activeAction, setActiveAction] = useState<'ASSIGN' | 'HANDLE' | 'REQUEST_INFO' | 'ESCALATE' | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [infoRequestNotes, setInfoRequestNotes] = useState<string>('');
  const [escalationReason, setEscalationReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      };

      const [incRes, advisorRes, candidatesRes, decisionRes] = await Promise.all([
        fetch(`${API_BASE}/api/reports/${incidentId}`, { headers }),
        fetch(`${API_BASE}/api/incidents/${incidentId}/triage-advisor`, { headers }),
        fetch(`${API_BASE}/api/incidents/${incidentId}/technician-candidates`, { headers }),
        fetch(`${API_BASE}/api/incidents/${incidentId}/triage-decision`, { headers })
      ]);

      if (incRes.ok) {
        const incData = await incRes.json();
        setIncident(incData);
      }

      if (advisorRes.ok) {
        const advisorData = await advisorRes.json();
        setAssessment(advisorData);
        // Pre-fill question notes if recommended action is REQUEST_MORE_INFORMATION
        if (advisorData.missingInformation && advisorData.missingInformation.length > 0) {
          setInfoRequestNotes(`Please provide: ${advisorData.missingInformation.join("; ")}`);
        }
      }

      if (candidatesRes.ok) {
        const cData = await candidatesRes.json();
        setCandidatesData(cData);
        if (cData.candidates && cData.candidates.length > 0) {
          setSelectedTechId(cData.candidates[0].id);
        }
      }

      if (decisionRes.ok) {
        const dData = await decisionRes.json();
        setRecordedDecision(dData.decision || null);
      }
    } catch (err: any) {
      console.error('Failed to load triage workspace:', err);
      addToast({ type: 'error', title: 'Failed to load triage data', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [incidentId, token, API_BASE, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Submit Decision Handlers
  const handleSubmitDecision = async (decisionType: string, payload: any) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${incidentId}/triage-decision`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: decisionType,
          ...payload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Decision submission failed');
      }

      addToast({
        type: 'success',
        title: 'Decision Recorded Successfully',
        message: `Action '${decisionType.replace(/_/g, ' ')}' executed and logged in audit trail.`
      });

      setActiveAction(null);
      await loadData();
      onDecisionSuccess();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', background: '#FFFFFF', borderRadius: '12px' }}>
        <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748B', fontWeight: 500 }}>
          Analyzing incident telemetry and running AI Triage Advisor...
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <AlertTriangle size={36} color="#DC2626" style={{ margin: '0 auto 12px auto' }} />
        <div style={{ fontSize: '16px', fontWeight: 600 }}>Incident not found</div>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={onBack}>
          ← Return to Incident Queue
        </button>
      </div>
    );
  }

  const isMissingMachine = !incident.machine_id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Navigation Bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '16px 20px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
          >
            <ChevronLeft size={16} /> Back to Queue
          </button>
          <div style={{ width: '1px', height: '24px', background: '#E2E8F0' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>{incident.report_number}</span>
              <span className={`badge ${incident.status === 'CONVERTED_TO_WORK_ORDER' ? 'badge-success' : incident.status === 'ESCALATED' ? 'badge-danger' : incident.status === 'HANDLED_INTERNALLY' ? 'badge-info' : 'badge-warning'}`}>
                {incident.status?.replace(/_/g, ' ')}
              </span>
              <span className="badge priority-badge" style={{ background: incident.urgency_suggestion === 'CRITICAL' ? '#FEE2E2' : '#FEF3C7', color: incident.urgency_suggestion === 'CRITICAL' ? '#991B1B' : '#92400E' }}>
                {incident.urgency_suggestion} URGENCY
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Submitted on {new Date(incident.created_at).toLocaleString()} • Site: {incident.site_name || 'Pune Plant 1'}
            </div>
          </div>
        </div>

        {recordedDecision && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '6px 12px', borderRadius: '8px' }}>
            <CheckCircle2 size={16} color="#16A34A" />
            <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
              Decision Executed: {recordedDecision.decision?.replace(/_/g, ' ')} by {recordedDecision.supervisor_name}
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION A: Incident Overview ────────────────────────── */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <FileText size={18} color="#2563EB" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>SECTION A — Incident Telemetry & Overview</h3>
        </div>

        {/* Missing Machine Callout */}
        {isMissingMachine && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <AlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#B45309' }}>Machine Identification Missing or Ambiguous</div>
              <div style={{ fontSize: '12px', color: '#78350F', marginTop: '2px' }}>
                The reporter did not scan an asset barcode or provide an explicit asset tag (e.g., MCH-004 vs MCH-014). To avoid misdirected dispatch, asset verification is recommended before assigning a technician.
              </div>
            </div>
          </div>
        )}

        <div className="info-grid" style={{ marginBottom: '16px' }}>
          <div className="info-item">
            <span className="info-label">Target Asset</span>
            <span className="info-value" style={{ fontWeight: 600, color: isMissingMachine ? '#DC2626' : '#0F172A' }}>
              {incident.machine_name ? `${incident.machine_name} (${incident.asset_tag})` : '⚠️ Missing Asset Tag'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Shop Floor Location</span>
            <span className="info-value">{incident.machine_location || 'Unspecified Bay'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Reporter</span>
            <span className="info-value">{incident.reporter_name} ({incident.reporter_email})</span>
          </div>
          <div className="info-item">
            <span className="info-label">Input Channel</span>
            <span className="info-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              {incident.input_channel === 'VOICE' ? <Mic size={14} color="#2563EB" /> : null}
              {incident.input_channel} REPORT
            </span>
          </div>
        </div>

        {/* Spoken Audio Transcript */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
            Original Voice / Text Transcript
          </div>
          <div style={{ fontSize: '14px', color: '#0F172A', fontStyle: 'italic', lineHeight: 1.5 }}>
            "{incident.corrected_transcript || incident.original_transcript || incident.symptom_text}"
          </div>
        </div>
      </div>

      {/* ── SECTION B: AI Triage & Assignment Advisor ───────────── */}
      {assessment && (
        <div className="card" style={{ padding: '22px', borderLeft: `5px solid ${assessment.recommendedAction === 'SUPERVISOR_CAN_HANDLE' ? '#10B981' : assessment.recommendedAction === 'ASSIGN_TECHNICIAN' ? '#2563EB' : assessment.recommendedAction === 'REQUEST_MORE_INFORMATION' ? '#F59E0B' : '#EF4444'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} color="#2563EB" />
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>SECTION B — AI Triage & Assignment Advisor</h3>
                <div style={{ fontSize: '12px', color: '#64748B' }}>Evidence-Driven Decision Intelligence Engine • Provider: {assessment.modelProvider}</div>
              </div>
            </div>

            {/* Recommendation Banner */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '13px',
              background: assessment.recommendedAction === 'SUPERVISOR_CAN_HANDLE' ? '#DCFCE7' : assessment.recommendedAction === 'ASSIGN_TECHNICIAN' ? '#DBEAFE' : assessment.recommendedAction === 'REQUEST_MORE_INFORMATION' ? '#FEF3C7' : '#FEE2E2',
              color: assessment.recommendedAction === 'SUPERVISOR_CAN_HANDLE' ? '#166534' : assessment.recommendedAction === 'ASSIGN_TECHNICIAN' ? '#1E40AF' : assessment.recommendedAction === 'REQUEST_MORE_INFORMATION' ? '#92400E' : '#991B1B'
            }}>
              {assessment.recommendedAction === 'SUPERVISOR_CAN_HANDLE' && <CheckCircle2 size={16} />}
              {assessment.recommendedAction === 'ASSIGN_TECHNICIAN' && <Wrench size={16} />}
              {assessment.recommendedAction === 'REQUEST_MORE_INFORMATION' && <HelpCircle size={16} />}
              {assessment.recommendedAction === 'ESCALATE' && <ShieldAlert size={16} />}
              RECOMMENDED ACTION: {assessment.recommendedAction?.replace(/_/g, ' ')}
            </div>
          </div>

          {/* Assessment Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '18px' }}>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>ASSESSMENT COMPLEXITY</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: assessment.complexity === 'HIGH' ? '#DC2626' : assessment.complexity === 'MEDIUM' ? '#D97706' : '#16A34A', marginTop: '2px' }}>
                {assessment.complexity} COMPLEXITY
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>SAFETY & OPERATIONAL RISK</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: assessment.safetyRisk === 'CRITICAL' ? '#DC2626' : assessment.safetyRisk === 'MODERATE' ? '#D97706' : '#16A34A', marginTop: '2px' }}>
                {assessment.safetyRisk} RISK
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>DATA COMPLETENESS / CONFIDENCE</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: assessment.confidence === 'HIGH' ? '#16A34A' : assessment.confidence === 'MODERATE' ? '#D97706' : '#DC2626', marginTop: '2px' }}>
                {assessment.confidence} CONFIDENCE
              </div>
            </div>
            <div style={{ background: '#F8FAFC', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>REQUIRED SKILLS</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0F172A', marginTop: '4px' }}>
                {assessment.requiredSkills?.slice(0, 2).join(', ') || 'General Diagnostics'}
              </div>
            </div>
          </div>

          {/* Detailed Explanation */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>Technical Reasoning & Recommendation Rationale:</div>
            <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.6, background: '#F8FAFC', padding: '12px', borderRadius: '8px' }}>
              {assessment.summaryExplanation}
            </div>
          </div>

          {/* Missing Information Callout */}
          {assessment.missingInformation && assessment.missingInformation.length > 0 && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', padding: '12px 16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>
                <AlertCircle size={15} /> Identified Data Gaps & Missing Telemetry:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#7F1D1D' }}>
                {assessment.missingInformation.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Precautions */}
          {assessment.safetyPrecautions && assessment.safetyPrecautions.length > 0 && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '8px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#92400E', marginBottom: '4px' }}>
                <ShieldAlert size={15} /> Required Safety Precautions on Floor:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: '#78350F' }}>
                {assessment.safetyPrecautions.map((item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── SECTION C: Evidence & Historical Context ───────────── */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Layers size={18} color="#2563EB" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>SECTION C — Evidence Graph & Maintenance Provenance</h3>
        </div>

        {/* Provenance Badges */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>Grounding Provenance Records:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {incident.evidence?.map((ev: any, idx: number) => (
              <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`badge ${ev.label === 'REPORTED' ? 'badge-success' : ev.label === 'RETRIEVED' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '9px', padding: '2px 5px' }}>
                  {ev.label}
                </span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{ev.field_name}:</span>
                <span style={{ color: '#64748B' }}>{ev.raw_value || 'N/A'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Historical Closed Incidents */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', marginBottom: '8px' }}>
            Verified Maintenance History on Asset & Equipment Peers:
          </div>
          {incident.groundedHistory && incident.groundedHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {incident.groundedHistory.slice(0, 3).map((h: any, idx: number) => (
                <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '10px 12px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>{h.reportNumber} ({h.workOrderNumber})</span>
                    <span style={{ color: '#64748B', fontSize: '11px' }}>Verified: {new Date(h.verifiedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: '#334155' }}><strong>Resolution:</strong> {h.resolutionSummary}</div>
                  {h.findings && <div style={{ color: '#64748B', fontSize: '11px', marginTop: '2px' }}><strong>Findings:</strong> {h.findings}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic', background: '#F8FAFC', padding: '10px', borderRadius: '6px' }}>
              No prior verified repairs logged for this asset.
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION D: Supervisor Decision & Actions ───────────── */}
      <div className="card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <UserCheck size={18} color="#2563EB" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>SECTION D — Supervisor Decision & Action Dispatch</h3>
        </div>
        <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '18px' }}>
          Select an evidence-driven triage action. Every decision records a permanent cryptographic audit trail entry with your observations.
        </div>

        {/* 4 Differentiated Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          {/* Action 1: Assign Technician */}
          <div
            onClick={() => setActiveAction('ASSIGN')}
            style={{
              cursor: isMissingMachine ? 'not-allowed' : 'pointer',
              opacity: isMissingMachine ? 0.6 : 1,
              border: activeAction === 'ASSIGN' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              background: activeAction === 'ASSIGN' ? '#EFF6FF' : '#FFFFFF',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Wrench size={18} color="#2563EB" />
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Find & Assign Technician</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Match specialized maintenance personnel based on skill graph, verified machine history, and live workload.
            </div>
            {isMissingMachine && (
              <div style={{ fontSize: '11px', color: '#DC2626', marginTop: '6px', fontWeight: 600 }}>
                Requires asset clarification first
              </div>
            )}
          </div>

          {/* Action 2: Handle Internally */}
          <div
            onClick={() => setActiveAction('HANDLE')}
            style={{
              cursor: 'pointer',
              border: activeAction === 'HANDLE' ? '2px solid #10B981' : '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              background: activeAction === 'HANDLE' ? '#ECFDF5' : '#FFFFFF',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 size={18} color="#10B981" />
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Handle Internally</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Resolve minor non-technical adjustments (e.g. guard fasteners, door latches, cleaning) under supervisor SOP.
            </div>
          </div>

          {/* Action 3: Request More Information */}
          <div
            onClick={() => setActiveAction('REQUEST_INFO')}
            style={{
              cursor: 'pointer',
              border: activeAction === 'REQUEST_INFO' ? '2px solid #F59E0B' : '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              background: activeAction === 'REQUEST_INFO' ? '#FFFBEB' : '#FFFFFF',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <HelpCircle size={18} color="#D97706" />
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Request Information</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Send specific clarification questions to the reporter (e.g. confirm asset barcode, heating source, Bay location).
            </div>
          </div>

          {/* Action 4: Escalate */}
          <div
            onClick={() => setActiveAction('ESCALATE')}
            style={{
              cursor: 'pointer',
              border: activeAction === 'ESCALATE' ? '2px solid #EF4444' : '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '16px',
              background: activeAction === 'ESCALATE' ? '#FEF2F2' : '#FFFFFF',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <ShieldAlert size={18} color="#DC2626" />
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>Escalate Incident</div>
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.4 }}>
              Escalate emergency safety risks, severe pressure/thermal hazards, or plant-wide stoppages to leadership.
            </div>
          </div>
        </div>

        {/* ── Action Detail Form Containers ── */}
        {activeAction === 'HANDLE' && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#166534', marginBottom: '4px' }}>
              Confirm Internal Supervisor Resolution
            </div>
            <div style={{ fontSize: '12px', color: '#15803D', marginBottom: '12px' }}>
              Record supervisor actions, adjustments performed, and safety sign-off. This incident will be closed as 'HANDLED_INTERNALLY'.
            </div>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Tightened M6 dust guard thumbscrew; inspected interlock latch; verified secure under vibration."
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              style={{ fontSize: '13px', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={submitting || !internalNotes.trim()}
                onClick={() => handleSubmitDecision('HANDLE_INTERNALLY', { internalResolutionNotes: internalNotes })}
              >
                {submitting ? 'Recording...' : 'Confirm Internal Resolution'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveAction(null)}>Cancel</button>
            </div>
          </div>
        )}

        {activeAction === 'REQUEST_INFO' && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#92400E', marginBottom: '4px' }}>
              Request Additional Telemetry from Reporter
            </div>
            <div style={{ fontSize: '12px', color: '#78350F', marginBottom: '12px' }}>
              This question will be sent directly to {incident.reporter_name}. Incident status will transition to 'AWAITING_CLARIFICATION'.
            </div>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Please confirm whether 'machine 4' refers to Main Conveyor 4 (MCH-004) or Heavy Lathe 4 (MCH-014). Also check if the motor housing is hot to the touch."
              value={infoRequestNotes}
              onChange={e => setInfoRequestNotes(e.target.value)}
              style={{ fontSize: '13px', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-warning btn-sm"
                disabled={submitting || !infoRequestNotes.trim()}
                onClick={() => handleSubmitDecision('REQUEST_INFORMATION', { informationRequestNotes: infoRequestNotes })}
              >
                {submitting ? 'Sending...' : 'Send Clarification Request'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveAction(null)}>Cancel</button>
            </div>
          </div>
        )}

        {activeAction === 'ESCALATE' && (
          <div style={{ marginTop: '20px', padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px' }}>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#991B1B', marginBottom: '4px' }}>
              Emergency Safety / Leadership Escalation
            </div>
            <div style={{ fontSize: '12px', color: '#7F1D1D', marginBottom: '12px' }}>
              Record safety hazards, immediate lockout actions, and escalation reasons. Incident will be flagged as 'ESCALATED'.
            </div>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Uncontrolled hydraulic pressure drop and ram fluid pooling presents load collapse risk. E-stop triggered; area cordoned off; plant safety manager notified."
              value={escalationReason}
              onChange={e => setEscalationReason(e.target.value)}
              style={{ fontSize: '13px', marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                disabled={submitting || !escalationReason.trim()}
                onClick={() => handleSubmitDecision('ESCALATE', { escalationReason })}
              >
                {submitting ? 'Escalating...' : 'Confirm Escalation'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setActiveAction(null)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION E: Technician Assignment Panel ─────────────── */}
      {activeAction === 'ASSIGN' && (
        <div className="card" style={{ padding: '22px', border: '2px solid #2563EB' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Award size={20} color="#2563EB" />
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>SECTION E — Intelligent Technician Matching & Dispatch</h3>
              <div style={{ fontSize: '12px', color: '#64748B' }}>Ranked by domain specialization, skill overlap, machine repair history, and live shift workload</div>
            </div>
          </div>

          {candidatesData?.candidates && candidatesData.candidates.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
              {candidatesData.candidates.map((cand: any) => {
                const isSelected = selectedTechId === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedTechId(cand.id)}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '2px solid #2563EB' : '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '16px',
                      background: isSelected ? '#EFF6FF' : '#FFFFFF',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: isSelected ? '6px solid #2563EB' : '2px solid #CBD5E1', background: '#FFFFFF' }} />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{cand.name}</span>
                            {cand.isTopRecommendation && (
                              <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                                ⭐ TOP RECOMMENDATION
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            {cand.specialization} • {cand.yearsExperience} yrs experience • {cand.shift}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: cand.matchScore >= 80 ? '#16A34A' : '#2563EB' }}>
                          {cand.matchScore}% Match
                        </div>
                        <span className={`badge ${cand.activeWorkloadCount === 0 ? 'badge-success' : cand.activeWorkloadCount <= 2 ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '10px' }}>
                          {cand.availabilityLabel}
                        </span>
                      </div>
                    </div>

                    {/* Matched Skills Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {cand.skills?.map((sk: string, sIdx: number) => {
                        const isMatched = cand.matchingSkills?.includes(sk);
                        return (
                          <span
                            key={sIdx}
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              background: isMatched ? '#DBEAFE' : '#F1F5F9',
                              color: isMatched ? '#1E40AF' : '#475569',
                              fontWeight: isMatched ? 700 : 500,
                              border: isMatched ? '1px solid #93C5FD' : 'none'
                            }}
                          >
                            {sk}
                          </span>
                        );
                      })}
                    </div>

                    {/* Grounded Rationale */}
                    <div style={{ fontSize: '12px', color: '#334155', background: '#F8FAFC', padding: '8px 12px', borderRadius: '6px', marginTop: '10px', lineHeight: 1.4 }}>
                      <strong>Why Recommended:</strong> {cand.recommendationRationale}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '8px', fontSize: '13px', color: '#64748B' }}>
              No certified technicians found matching the required criteria.
            </div>
          )}

          {/* Assignment Instructions */}
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontSize: '12px', fontWeight: 600 }}>Assignment Instructions & Focus Area</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Conduct baseline vibration spectrum check on spindle bearing. Check drive belt tension."
              value={assignmentNotes}
              onChange={e => setAssignmentNotes(e.target.value)}
              style={{ fontSize: '13px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={submitting || !selectedTechId}
              onClick={() => handleSubmitDecision('ASSIGN_TECHNICIAN', { technicianId: selectedTechId, assignmentNotes })}
            >
              {submitting ? 'Dispatching Work Order...' : 'Confirm Assignment & Create Work Order →'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setActiveAction(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

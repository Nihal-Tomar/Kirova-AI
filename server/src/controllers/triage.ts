import { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { logAuditEvent } from "../services/audit";
import { triageAdvisorService } from "../services/triageAdvisor";
import { technicianMatchingService } from "../services/technicianMatching";

export async function getTriageAssessment(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  try {
    // Confirm incident exists in user's organization
    const incRes = await db.query(
      "SELECT id, organization_id, machine_id, status FROM incidents WHERE id = $1 AND organization_id = $2",
      [id, user.organizationId]
    );

    if (incRes.rows.length === 0) {
      res.status(404).json({ error: "NOT_FOUND", message: "Incident not found" });
      return;
    }

    const assessment = await triageAdvisorService.evaluateIncident(id);
    res.json(assessment);
  } catch (err: any) {
    console.error("❌ [TRIAGE] Assessment evaluation failed:", err);
    res.status(500).json({ error: "TRIAGE_FAILED", message: err.message });
  }
}

export async function getTechnicianCandidates(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  if (user.role !== "SUPERVISOR") {
    res.status(403).json({ error: "FORBIDDEN", message: "Only supervisors can view technician candidate matching" });
    return;
  }

  try {
    let assessment;
    try {
      assessment = await triageAdvisorService.evaluateIncident(id);
    } catch {}

    const result = await technicianMatchingService.getRankedTechniciansForIncident(
      id,
      user.organizationId,
      assessment
    );

    res.json(result);
  } catch (err: any) {
    console.error("❌ [TRIAGE] Technician matching failed:", err);
    res.status(500).json({ error: "MATCHING_FAILED", message: err.message });
  }
}

export async function submitTriageDecision(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const {
    decision,
    technicianId,
    assignmentNotes,
    internalResolutionNotes,
    informationRequestNotes,
    escalationReason
  } = req.body;

  if (user.role !== "SUPERVISOR") {
    res.status(403).json({ error: "FORBIDDEN", message: "Only supervisors can record triage decisions" });
    return;
  }

  const validDecisions = ["ASSIGN_TECHNICIAN", "HANDLE_INTERNALLY", "REQUEST_INFORMATION", "ESCALATE"];
  if (!decision || !validDecisions.includes(decision)) {
    res.status(400).json({
      error: "INVALID_DECISION",
      message: `Decision must be one of: ${validDecisions.join(", ")}`
    });
    return;
  }

  const incRes = await db.query(
    `SELECT i.*, m.name as machine_name, m.asset_tag 
     FROM incidents i
     LEFT JOIN machines m ON i.machine_id = m.id
     WHERE i.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident not found" });
    return;
  }

  const inc = incRes.rows[0];
  const decisionId = `std-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;

  // ── 1. Action: ASSIGN_TECHNICIAN ──────────────────────────────────
  if (decision === "ASSIGN_TECHNICIAN") {
    if (!technicianId) {
      res.status(400).json({
        error: "MISSING_TECHNICIAN",
        message: "A technician must be selected for assignment."
      });
      return;
    }

    if (!inc.machine_id) {
      res.status(400).json({
        error: "UNRESOLVED_MACHINE",
        message: "Cannot assign technician to an incident with missing or ambiguous machine. Clarification required first."
      });
      return;
    }

    // Verify technician exists in same organization
    const techRes = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1 AND organization_id = $2 AND role = 'REPORTER_TECHNICIAN'",
      [technicianId, user.organizationId]
    );

    if (techRes.rows.length === 0) {
      res.status(400).json({ error: "INVALID_TECHNICIAN", message: "Selected technician was not found in your organization." });
      return;
    }
    const tech = techRes.rows[0];

    // Check if work order already exists for this incident
    const existingWo = await db.query("SELECT id, status FROM work_orders WHERE incident_id = $1", [id]);
    let woId: string;
    let woNumber: string;

    const priority = inc.urgency_suggestion || "MEDIUM";

    if (existingWo.rows.length > 0) {
      woId = existingWo.rows[0].id;
      await db.query(
        `UPDATE work_orders
         SET status = 'ASSIGNED',
             assigned_technician_id = $1,
             assigned_at = CURRENT_TIMESTAMP,
             approved_by_id = $2,
             approved_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [technicianId, user.id, woId]
      );
      woNumber = (await db.query("SELECT work_order_number FROM work_orders WHERE id = $1", [woId])).rows[0].work_order_number;
    } else {
      woId = `wo-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
      woNumber = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      await db.query(
        `INSERT INTO work_orders (
          id, work_order_number, incident_id, machine_id, priority, status,
          approved_by_id, approved_at, assigned_technician_id, assigned_at,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'ASSIGNED', $6, CURRENT_TIMESTAMP, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [woId, woNumber, id, inc.machine_id, priority, user.id, technicianId]
      );
    }

    // Update incident status
    await db.query("UPDATE incidents SET status = 'CONVERTED_TO_WORK_ORDER', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    // Work order history
    await db.query(
      `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
       VALUES ($1, $2, 'DRAFT', 'ASSIGNED', $3, $4)`,
      [
        `wosh-${Date.now()}-triage`,
        woId,
        user.id,
        assignmentNotes ? `Assigned to ${tech.name}: ${assignmentNotes}` : `Assigned to ${tech.name} via AI Triage Advisor`
      ]
    );

    // Save decision
    await db.query(
      `INSERT INTO supervisor_triage_decisions (
        id, incident_id, supervisor_id, decision, assigned_technician_id, assignment_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [decisionId, id, user.id, decision, technicianId, assignmentNotes || null]
    );

    // Audit log
    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "INCIDENT",
      entityId: id,
      action: "SUPERVISOR_TRIAGE_ASSIGN",
      previousState: { status: inc.status },
      newState: { status: "CONVERTED_TO_WORK_ORDER", workOrderId: woId, assignedTechnician: tech.name, priority },
      reason: assignmentNotes || "Supervisor confirmed technician assignment from AI Advisor"
    });

    res.json({
      success: true,
      decision: "ASSIGN_TECHNICIAN",
      incidentId: id,
      workOrderId: woId,
      workOrderNumber: woNumber,
      assignedTechnicianId: technicianId,
      assignedTechnicianName: tech.name,
      incidentStatus: "CONVERTED_TO_WORK_ORDER"
    });
    return;
  }

  // ── 2. Action: HANDLE_INTERNALLY ──────────────────────────────────
  if (decision === "HANDLE_INTERNALLY") {
    if (!internalResolutionNotes || internalResolutionNotes.trim().length === 0) {
      res.status(400).json({
        error: "RESOLUTION_NOTES_REQUIRED",
        message: "Internal resolution details and observations are required when resolving an incident internally."
      });
      return;
    }

    await db.query(
      "UPDATE incidents SET status = 'HANDLED_INTERNALLY', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    await db.query(
      `INSERT INTO supervisor_triage_decisions (
        id, incident_id, supervisor_id, decision, internal_resolution_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [decisionId, id, user.id, decision, internalResolutionNotes.trim()]
    );

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "INCIDENT",
      entityId: id,
      action: "SUPERVISOR_TRIAGE_INTERNAL_RESOLUTION",
      previousState: { status: inc.status },
      newState: { status: "HANDLED_INTERNALLY", notes: internalResolutionNotes.trim() },
      reason: internalResolutionNotes.trim()
    });

    res.json({
      success: true,
      decision: "HANDLE_INTERNALLY",
      incidentId: id,
      incidentStatus: "HANDLED_INTERNALLY",
      internalResolutionNotes: internalResolutionNotes.trim()
    });
    return;
  }

  // ── 3. Action: REQUEST_INFORMATION ────────────────────────────────
  if (decision === "REQUEST_INFORMATION") {
    if (!informationRequestNotes || informationRequestNotes.trim().length === 0) {
      res.status(400).json({
        error: "QUESTIONS_REQUIRED",
        message: "Specific questions or required details for the operator are mandatory."
      });
      return;
    }

    await db.query(
      `UPDATE incidents 
       SET status = 'AWAITING_CLARIFICATION',
           clarification_question = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [informationRequestNotes.trim(), id]
    );

    await db.query(
      `INSERT INTO supervisor_triage_decisions (
        id, incident_id, supervisor_id, decision, information_request_notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [decisionId, id, user.id, decision, informationRequestNotes.trim()]
    );

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "INCIDENT",
      entityId: id,
      action: "SUPERVISOR_TRIAGE_REQUEST_INFO",
      previousState: { status: inc.status },
      newState: { status: "AWAITING_CLARIFICATION", clarificationQuestion: informationRequestNotes.trim() },
      reason: informationRequestNotes.trim()
    });

    res.json({
      success: true,
      decision: "REQUEST_INFORMATION",
      incidentId: id,
      incidentStatus: "AWAITING_CLARIFICATION",
      clarificationQuestion: informationRequestNotes.trim()
    });
    return;
  }

  // ── 4. Action: ESCALATE ───────────────────────────────────────────
  if (decision === "ESCALATE") {
    if (!escalationReason || escalationReason.trim().length === 0) {
      res.status(400).json({
        error: "ESCALATION_REASON_REQUIRED",
        message: "Specific safety/operational escalation rationale is mandatory."
      });
      return;
    }

    await db.query(
      "UPDATE incidents SET status = 'ESCALATED', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    await db.query(
      `INSERT INTO supervisor_triage_decisions (
        id, incident_id, supervisor_id, decision, escalation_reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
      [decisionId, id, user.id, decision, escalationReason.trim()]
    );

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "INCIDENT",
      entityId: id,
      action: "SUPERVISOR_TRIAGE_ESCALATE",
      previousState: { status: inc.status },
      newState: { status: "ESCALATED", reason: escalationReason.trim() },
      reason: escalationReason.trim()
    });

    res.json({
      success: true,
      decision: "ESCALATE",
      incidentId: id,
      incidentStatus: "ESCALATED",
      escalationReason: escalationReason.trim()
    });
    return;
  }
}

export async function getTriageDecision(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const decisionRes = await db.query(
    `SELECT std.*, u.name as supervisor_name, tech.name as technician_name
     FROM supervisor_triage_decisions std
     JOIN users u ON std.supervisor_id = u.id
     LEFT JOIN users tech ON std.assigned_technician_id = tech.id
     JOIN incidents i ON std.incident_id = i.id
     WHERE std.incident_id = $1 AND i.organization_id = $2
     ORDER BY std.created_at DESC LIMIT 1`,
    [id, user.organizationId]
  );

  if (decisionRes.rows.length === 0) {
    res.json({ decision: null });
    return;
  }

  res.json({ decision: decisionRes.rows[0] });
}

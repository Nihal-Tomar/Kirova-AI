import { Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { logAuditEvent } from "../services/audit";
import { historyService } from "../services/history";

export async function createWorkOrder(req: Request, res: Response): Promise<void> {
  const { incidentId, priority = "MEDIUM" } = req.body;
  const user = req.user!;

  if (!incidentId) {
    res.status(400).json({ error: "MISSING_FIELDS", message: "incidentId is required" });
    return;
  }

  const incRes = await db.query(
    "SELECT * FROM incidents WHERE id = $1 AND organization_id = $2",
    [incidentId, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident not found" });
    return;
  }

  const incident = incRes.rows[0];

  if (!incident.machine_id) {
    res.status(400).json({
      error: "UNRESOLVED_MACHINE",
      message: "Cannot create work order for incident with unresolved or ambiguous machine. Clarification required first."
    });
    return;
  }

  const existingWo = await db.query("SELECT id FROM work_orders WHERE incident_id = $1", [incidentId]);
  if (existingWo.rows.length > 0) {
    res.status(400).json({ error: "DUPLICATE", message: "Work order already exists for this incident" });
    return;
  }

  const woId = `wo-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const woNumber = `WO-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  // Initial work order status is AWAITING_APPROVAL
  await db.query(
    `INSERT INTO work_orders (
      id, work_order_number, incident_id, machine_id, priority, status,
      created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, 'AWAITING_APPROVAL', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [woId, woNumber, incidentId, incident.machine_id, priority]
  );

  await db.query("UPDATE incidents SET status = 'CONVERTED_TO_WORK_ORDER' WHERE id = $1", [incidentId]);

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, 'DRAFT', 'AWAITING_APPROVAL', $3, 'Work order generated from reviewed incident')`,
    [`wosh-${Date.now()}-init`, woId, user.id]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: woId,
    action: "CREATE_WORK_ORDER",
    newState: { id: woId, workOrderNumber: woNumber, status: "AWAITING_APPROVAL", priority }
  });

  res.status(201).json({
    id: woId,
    workOrderNumber: woNumber,
    incidentId,
    machineId: incident.machine_id,
    priority,
    status: "AWAITING_APPROVAL"
  });
}

export async function approveWorkOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { priority } = req.body;
  const user = req.user!;

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  if (wo.status !== "AWAITING_APPROVAL") {
    res.status(400).json({
      error: "INVALID_TRANSITION",
      message: `Work order must be in AWAITING_APPROVAL state to approve. Current status: ${wo.status}`
    });
    return;
  }

  const finalPriority = priority || wo.priority;

  await db.query(
    `UPDATE work_orders
     SET status = 'APPROVED',
         priority = $1,
         approved_by_id = $2,
         approved_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [finalPriority, user.id, id]
  );

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, 'AWAITING_APPROVAL', 'APPROVED', $3, 'Supervisor approved work order')`,
    [`wosh-${Date.now()}-app`, id, user.id]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: id,
    action: "APPROVE",
    previousState: { status: "AWAITING_APPROVAL", priority: wo.priority },
    newState: { status: "APPROVED", priority: finalPriority, approvedBy: user.name }
  });

  res.json({
    id,
    status: "APPROVED",
    priority: finalPriority,
    approvedBy: user.name,
    approvedAt: new Date().toISOString()
  });
}

export async function rejectWorkOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { rejectionReason } = req.body;
  const user = req.user!;

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    res.status(400).json({ error: "REASON_REQUIRED", message: "rejectionReason is mandatory when rejecting a work order" });
    return;
  }

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  await db.query(
    `UPDATE work_orders
     SET status = 'REJECTED',
         rejection_reason = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [rejectionReason.trim(), id]
  );

  await db.query(
    "UPDATE incidents SET status = 'REJECTED' WHERE id = $1",
    [wo.incident_id]
  );

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, $3, 'REJECTED', $4, $5)`,
    [`wosh-${Date.now()}-rej`, id, wo.status, user.id, rejectionReason.trim()]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: id,
    action: "REJECT",
    previousState: { status: wo.status },
    newState: { status: "REJECTED", rejectionReason: rejectionReason.trim() },
    reason: rejectionReason.trim()
  });

  res.json({ id, status: "REJECTED", rejectionReason: rejectionReason.trim() });
}

export async function returnWorkOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { returnReason } = req.body;
  const user = req.user!;

  if (!returnReason || returnReason.trim().length === 0) {
    res.status(400).json({ error: "REASON_REQUIRED", message: "returnReason is mandatory when returning a work order" });
    return;
  }

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];
  let newStatus: string;

  if (wo.status === "AWAITING_APPROVAL") {
    // Return to clarification
    newStatus = "AWAITING_APPROVAL";
    await db.query(
      `UPDATE incidents SET status = 'AWAITING_CLARIFICATION', clarification_question = $1 WHERE id = $2`,
      [returnReason.trim(), wo.incident_id]
    );
  } else if (wo.status === "RESOLVED") {
    // Return for rework
    newStatus = "RETURNED_FOR_REWORK";
  } else {
    res.status(400).json({
      error: "INVALID_TRANSITION",
      message: `Cannot return work order from status: ${wo.status}`
    });
    return;
  }

  await db.query(
    `UPDATE work_orders
     SET status = $1,
         return_reason = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [newStatus, returnReason.trim(), id]
  );

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [`wosh-${Date.now()}-ret`, id, wo.status, newStatus, user.id, returnReason.trim()]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: id,
    action: "RETURN",
    previousState: { status: wo.status },
    newState: { status: newStatus, returnReason: returnReason.trim() },
    reason: returnReason.trim()
  });

  res.json({ id, status: newStatus, returnReason: returnReason.trim() });
}

export async function assignWorkOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { technicianId } = req.body;
  const user = req.user!;

  if (!technicianId) {
    res.status(400).json({ error: "MISSING_TECHNICIAN", message: "technicianId is required" });
    return;
  }

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  // STRICT INVARIANT ENFORCEMENT: Assignment CANNOT occur before approval!
  if (wo.status !== "APPROVED" && wo.status !== "ASSIGNED") {
    res.status(400).json({
      error: "CANNOT_ASSIGN_UNAPPROVED_WORK_ORDER",
      message: `Work order must be in APPROVED state before assigning a technician. Current status is: ${wo.status}`
    });
    return;
  }

  // Verify technician exists in same organization
  const techRes = await db.query(
    "SELECT id, name, role FROM users WHERE id = $1 AND organization_id = $2 AND role = 'REPORTER_TECHNICIAN'",
    [technicianId, user.organizationId]
  );

  if (techRes.rows.length === 0) {
    res.status(400).json({ error: "INVALID_TECHNICIAN", message: "Technician not found in your organization" });
    return;
  }

  const technician = techRes.rows[0];

  await db.query(
    `UPDATE work_orders
     SET status = 'ASSIGNED',
         assigned_technician_id = $1,
         assigned_at = CURRENT_TIMESTAMP,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [technicianId, id]
  );

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, $3, 'ASSIGNED', $4, $5)`,
    [`wosh-${Date.now()}-asgn`, id, wo.status, user.id, `Assigned to ${technician.name}`]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: id,
    action: "ASSIGN",
    previousState: { status: wo.status, assignedTechnicianId: wo.assigned_technician_id },
    newState: { status: "ASSIGNED", assignedTechnicianId: technicianId, assignedTo: technician.name }
  });

  res.json({
    id,
    status: "ASSIGNED",
    assignedTechnicianId: technicianId,
    assignedTechnicianName: technician.name,
    assignedAt: new Date().toISOString()
  });
}

export async function updateWorkOrderStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, findings, resolutionSummary, componentId } = req.body;
  const user = req.user!;

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  // RBAC checks for technician
  if (user.role === "REPORTER_TECHNICIAN" && wo.assigned_technician_id !== user.id) {
    res.status(403).json({
      error: "FORBIDDEN",
      message: "You can only update status on work orders assigned to you"
    });
    return;
  }

  // Legal transitions:
  // ASSIGNED -> IN_PROGRESS
  // RETURNED_FOR_REWORK -> IN_PROGRESS
  // IN_PROGRESS -> RESOLVED
  if (status === "IN_PROGRESS") {
    if (wo.status !== "ASSIGNED" && wo.status !== "RETURNED_FOR_REWORK") {
      res.status(400).json({
        error: "INVALID_TRANSITION",
        message: `Cannot transition to IN_PROGRESS from ${wo.status}`
      });
      return;
    }

    await db.query(
      "UPDATE work_orders SET status = 'IN_PROGRESS', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
      [id]
    );

    await db.query(
      `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
       VALUES ($1, $2, $3, 'IN_PROGRESS', $4, 'Technician commenced repair')`,
      [`wosh-${Date.now()}-inp`, id, wo.status, user.id]
    );

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "WORK_ORDER",
      entityId: id,
      action: "STATUS_UPDATE",
      previousState: { status: wo.status },
      newState: { status: "IN_PROGRESS" }
    });

    res.json({ id, status: "IN_PROGRESS" });
    return;
  } else if (status === "RESOLVED") {
    if (wo.status !== "IN_PROGRESS") {
      res.status(400).json({
        error: "INVALID_TRANSITION",
        message: `Work order must be IN_PROGRESS before resolving. Current status: ${wo.status}`
      });
      return;
    }

    if (!resolutionSummary || resolutionSummary.trim().length === 0) {
      res.status(400).json({
        error: "RESOLUTION_SUMMARY_REQUIRED",
        message: "resolutionSummary is mandatory when submitting work order resolution"
      });
      return;
    }

    await db.query(
      `UPDATE work_orders
       SET status = 'RESOLVED',
           technician_findings = $1,
           resolution_summary = $2,
           component_id = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [findings || null, resolutionSummary.trim(), componentId || null, id]
    );

    await db.query(
      `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
       VALUES ($1, $2, 'IN_PROGRESS', 'RESOLVED', $3, 'Technician submitted resolution for verification')`,
      [`wosh-${Date.now()}-res`, id, user.id]
    );

    await logAuditEvent({
      organizationId: user.organizationId,
      actorId: user.id,
      entityType: "WORK_ORDER",
      entityId: id,
      action: "SUBMIT_RESOLUTION",
      previousState: { status: "IN_PROGRESS" },
      newState: { status: "RESOLVED", resolutionSummary: resolutionSummary.trim(), findings }
    });

    res.json({
      id,
      status: "RESOLVED",
      resolutionSummary: resolutionSummary.trim(),
      technicianFindings: findings
    });
    return;
  } else {
    res.status(400).json({
      error: "INVALID_STATUS",
      message: `Invalid status update target: ${status}. Use verify-close for closure.`
    });
  }
}

export async function verifyCloseWorkOrder(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { supervisorClosureNotes } = req.body;
  const user = req.user!;

  if (!supervisorClosureNotes || supervisorClosureNotes.trim().length === 0) {
    res.status(400).json({
      error: "CLOSURE_NOTES_REQUIRED",
      message: "supervisorClosureNotes is mandatory when verifying work order closure"
    });
    return;
  }

  const woRes = await db.query(
    `SELECT wo.*, i.organization_id 
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  if (wo.status !== "RESOLVED") {
    res.status(400).json({
      error: "NOT_RESOLVED",
      message: `Only work orders in RESOLVED status can be verified and closed. Current status: ${wo.status}`
    });
    return;
  }

  // SELF-APPROVAL GUARDRAIL: Supervisor cannot verify closure if they themselves were assigned as the technician
  if (wo.assigned_technician_id === user.id) {
    res.status(403).json({
      error: "SELF_VERIFICATION_PROHIBITED",
      message: "You cannot verify and close a work order that you executed as the technician. Another supervisor must verify."
    });
    return;
  }

  await db.query(
    `UPDATE work_orders
     SET status = 'VERIFIED_CLOSED',
         verified_by_id = $1,
         verified_at = CURRENT_TIMESTAMP,
         supervisor_closure_notes = $2,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [user.id, supervisorClosureNotes.trim(), id]
  );

  await db.query(
    `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
     VALUES ($1, $2, 'RESOLVED', 'VERIFIED_CLOSED', $3, $4)`,
    [`wosh-${Date.now()}-cls`, id, user.id, supervisorClosureNotes.trim()]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "WORK_ORDER",
    entityId: id,
    action: "VERIFY_CLOSE",
    previousState: { status: "RESOLVED" },
    newState: { status: "VERIFIED_CLOSED", verifiedBy: user.name, supervisorNotes: supervisorClosureNotes.trim() },
    reason: supervisorClosureNotes.trim()
  });

  res.json({
    id,
    status: "VERIFIED_CLOSED",
    verifiedBy: user.name,
    verifiedAt: new Date().toISOString(),
    supervisorClosureNotes: supervisorClosureNotes.trim()
  });
}

export async function getWorkOrders(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status, technicianId } = req.query;

  let queryStr = `
    SELECT wo.*, 
           m.asset_tag, m.name as machine_name, m.type as machine_type, m.location as machine_location,
           i.report_number, i.symptom_text, i.symptom_category,
           tech.name as technician_name,
           sup_app.name as approved_by_name,
           sup_ver.name as verified_by_name
    FROM work_orders wo
    JOIN incidents i ON wo.incident_id = i.id
    JOIN machines m ON wo.machine_id = m.id
    LEFT JOIN users tech ON wo.assigned_technician_id = tech.id
    LEFT JOIN users sup_app ON wo.approved_by_id = sup_app.id
    LEFT JOIN users sup_ver ON wo.verified_by_id = sup_ver.id
    WHERE i.organization_id = $1
  `;
  const params: any[] = [user.organizationId];

  // Technicians see only work orders assigned to them.
  // Supervisors see all work orders in the organization (optionally filtered).
  if (user.role === "REPORTER_TECHNICIAN") {
    queryStr += ` AND wo.assigned_technician_id = $${params.length + 1}`;
    params.push(user.id);
  } else {
    // Supervisor: allow optional filter by specific technician
    if (technicianId) {
      params.push(technicianId);
      queryStr += ` AND wo.assigned_technician_id = $${params.length}`;
    }
  }

  if (status) {
    params.push(status);
    queryStr += ` AND wo.status = $${params.length}`;
  }

  queryStr += " ORDER BY wo.created_at DESC LIMIT 50";

  const resWo = await db.query(queryStr, params);
  res.json({ workOrders: resWo.rows });
}

export async function getAssignedWorkOrders(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const queryStr = `
    SELECT wo.*, 
           m.asset_tag, m.name as machine_name, m.type as machine_type, m.location as machine_location,
           i.report_number, i.symptom_text, i.symptom_category,
           sup_app.name as approved_by_name
    FROM work_orders wo
    JOIN incidents i ON wo.incident_id = i.id
    JOIN machines m ON wo.machine_id = m.id
    LEFT JOIN users sup_app ON wo.approved_by_id = sup_app.id
    WHERE wo.assigned_technician_id = $1
    ORDER BY wo.created_at DESC
  `;

  const resWo = await db.query(queryStr, [user.id]);
  res.json({ workOrders: resWo.rows });
}

export async function getWorkOrderById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const woRes = await db.query(
    `SELECT wo.*, 
            m.asset_tag, m.name as machine_name, m.type as machine_type, m.location as machine_location,
            i.report_number, i.symptom_text, i.symptom_category, i.input_channel,
            tech.name as technician_name, tech.email as technician_email,
            sup_app.name as approved_by_name,
            sup_ver.name as verified_by_name,
            c.name as component_name, c.part_number as component_part_number
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     JOIN machines m ON wo.machine_id = m.id
     LEFT JOIN users tech ON wo.assigned_technician_id = tech.id
     LEFT JOIN users sup_app ON wo.approved_by_id = sup_app.id
     LEFT JOIN users sup_ver ON wo.verified_by_id = sup_ver.id
     LEFT JOIN components c ON wo.component_id = c.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  // Case-level access: technicians may only view work orders assigned to them.
  // Supervisors have full read access within the organization.
  if (user.role === "REPORTER_TECHNICIAN" && wo.assigned_technician_id !== user.id) {
    res.status(403).json({
      error: "CASE_ACCESS_DENIED",
      message: "You do not have access to this work order. Only the assigned technician or a supervisor may view it."
    });
    return;
  }

  const historyRes = await db.query(
    `SELECT h.*, u.name as changed_by_name
     FROM work_order_status_history h
     JOIN users u ON h.changed_by_id = u.id
     WHERE h.work_order_id = $1
     ORDER BY h.timestamp ASC`,
    [id]
  );

  res.json({
    ...wo,
    statusHistory: historyRes.rows
  });
}

/**
 * GET /api/work-orders/:id/history
 *
 * Returns the machine maintenance history for the machine attached to this work order.
 * Access rules:
 *   - Supervisors: always allowed within their organization.
 *   - Technicians: only allowed if they are the assigned_technician_id on this work order
 *     AND the work order has moved past APPROVED (i.e. is ASSIGNED, IN_PROGRESS, RESOLVED,
 *     RETURNED_FOR_REWORK, or VERIFIED_CLOSED). Pre-assignment access is blocked.
 */
export async function getWorkOrderHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { symptomCategory } = req.query;
  const user = req.user!;

  // Fetch the work order and confirm org membership
  const woRes = await db.query(
    `SELECT wo.machine_id, wo.assigned_technician_id, wo.status, i.organization_id,
            i.symptom_category as incident_symptom_category
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     WHERE wo.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (woRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Work order not found" });
    return;
  }

  const wo = woRes.rows[0];

  // Technician case-level access gate
  if (user.role === "REPORTER_TECHNICIAN") {
    if (wo.assigned_technician_id !== user.id) {
      res.status(403).json({
        error: "CASE_ACCESS_DENIED",
        message: "Maintenance history is only accessible to the assigned technician on this work order."
      });
      return;
    }

    // Technicians cannot access history before assignment is confirmed
    const preAssignmentStatuses = ["AWAITING_APPROVAL", "APPROVED", "REJECTED"];
    if (preAssignmentStatuses.includes(wo.status)) {
      res.status(403).json({
        error: "CASE_ACCESS_DENIED",
        message: "Maintenance history becomes available after the work order has been assigned to you."
      });
      return;
    }
  }

  const effectiveCategory = (symptomCategory as string) || wo.incident_symptom_category;
  const history = await historyService.retrieveForMachine(wo.machine_id, effectiveCategory);

  const machineRes = await db.query(
    "SELECT id, asset_tag, name, type, model_number, serial_number, location FROM machines WHERE id = $1",
    [wo.machine_id]
  );

  res.json({
    workOrderId: id,
    machine: machineRes.rows[0] || null,
    symptomCategoryFilter: effectiveCategory || null,
    verifiedClosedIncidents: history
  });
}

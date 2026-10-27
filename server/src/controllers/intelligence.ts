import { Request, Response } from "express";
import { db } from "../db/index";
import { historyService } from "../services/history.js";
import { getAuditLogs } from "../services/audit.js";
import { decisionSupportService } from "../services/decisionSupport.js";

export async function getMachineHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { symptomCategory } = req.query;
  const user = req.user!;

  const mchRes = await db.query(
    `SELECT m.id, m.asset_tag, m.name, m.type, m.model_number, m.serial_number, m.location, m.is_active
     FROM machines m
     JOIN sites s ON m.site_id = s.id
     WHERE m.id = $1 AND s.organization_id = $2`,
    [id, user.organizationId]
  );

  if (mchRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Machine not found" });
    return;
  }

  // This endpoint has no case identifier, so it cannot safely scope history to a
  // technician's assigned case. Technicians use GET /work-orders/:id/history.
  if (user.role === "REPORTER_TECHNICIAN") {
    res.status(403).json({
      error: "CASE_ACCESS_DENIED",
      message: "Use the assigned work order history endpoint to access case maintenance history."
    });
    return;
  }

  const history = await historyService.retrieveForMachine(id, symptomCategory as string, user.organizationId);
  res.json({
    machine: mchRes.rows[0],
    verifiedClosedIncidents: history
  });
}

export async function getRecurringFaults(req: Request, res: Response): Promise<void> {
  const { equipmentType, symptomCategory } = req.query;
  const clusters = await historyService.getRecurringFaults(
    equipmentType as string,
    symptomCategory as string,
    req.user!.organizationId
  );
  res.json({ recurringFaultClusters: clusters });
}

export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  const user = req.user!;

  const openIncidents = await db.query(
    "SELECT COUNT(*) as count FROM incidents WHERE organization_id = $1 AND status IN ('DRAFT', 'AWAITING_CLARIFICATION', 'AWAITING_REVIEW')",
    [user.organizationId]
  );

  const awaitingReviewIncidents = await db.query(
    "SELECT COUNT(*) as count FROM incidents WHERE organization_id = $1 AND status = 'AWAITING_REVIEW'",
    [user.organizationId]
  );

  const awaitingApprovalOrders = await db.query(
    `SELECT COUNT(*) as count 
     FROM work_orders wo 
     JOIN incidents i ON wo.incident_id = i.id 
     WHERE i.organization_id = $1 AND wo.status = 'AWAITING_APPROVAL'`,
    [user.organizationId]
  );

  const activeWorkOrders = await db.query(
    `SELECT COUNT(*) as count 
     FROM work_orders wo 
     JOIN incidents i ON wo.incident_id = i.id 
     WHERE i.organization_id = $1 AND wo.status IN ('APPROVED', 'ASSIGNED', 'IN_PROGRESS')`,
    [user.organizationId]
  );

  const resolvedWorkOrders = await db.query(
    `SELECT COUNT(*) as count 
     FROM work_orders wo 
     JOIN incidents i ON wo.incident_id = i.id 
     WHERE i.organization_id = $1 AND wo.status = 'RESOLVED'`,
    [user.organizationId]
  );

  const verifiedClosedOrders = await db.query(
    `SELECT COUNT(*) as count 
     FROM work_orders wo 
     JOIN incidents i ON wo.incident_id = i.id 
     WHERE i.organization_id = $1 AND wo.status = 'VERIFIED_CLOSED'`,
    [user.organizationId]
  );

  const totalMachines = await db.query(
    `SELECT COUNT(*) as count
     FROM machines m
     JOIN sites s ON m.site_id = s.id
     WHERE s.organization_id = $1`,
    [user.organizationId]
  );

  const recurringClusters = await historyService.getRecurringFaults(undefined, undefined, user.organizationId);

  const resolutionTime = await db.query(
    `SELECT AVG(EXTRACT(EPOCH FROM (resolved.timestamp - wo.created_at)) / 3600) AS average_hours
     FROM work_orders wo
     JOIN incidents i ON wo.incident_id = i.id
     JOIN (
       SELECT work_order_id, MIN(timestamp) AS timestamp
       FROM work_order_status_history
       WHERE to_status = 'RESOLVED'
       GROUP BY work_order_id
     ) resolved ON resolved.work_order_id = wo.id
     WHERE i.organization_id = $1`,
    [user.organizationId]
  );
  const averageResolutionHours = resolutionTime.rows[0]?.average_hours;

  res.json({
    metrics: {
      openIncidents: parseInt(openIncidents.rows[0].count, 10),
      awaitingReviewIncidents: parseInt(awaitingReviewIncidents.rows[0].count, 10),
      awaitingApprovalOrders: parseInt(awaitingApprovalOrders.rows[0].count, 10),
      activeWorkOrders: parseInt(activeWorkOrders.rows[0].count, 10),
      resolvedAwaitingVerification: parseInt(resolvedWorkOrders.rows[0].count, 10),
      verifiedClosedOrders: parseInt(verifiedClosedOrders.rows[0].count, 10),
      totalMachines: parseInt(totalMachines.rows[0].count, 10),
      averageResolutionHours: averageResolutionHours === null || averageResolutionHours === undefined
        ? null
        : Number(averageResolutionHours)
    },
    topRecurringFaults: recurringClusters.slice(0, 5)
  });
}

export async function getAuditLogsController(req: Request, res: Response): Promise<void> {
  const { entityType, entityId, limit } = req.query;
  const logs = await getAuditLogs(
    entityType as string,
    entityId as string,
    limit ? parseInt(limit as string, 10) : 50
  );
  res.json({ auditLogs: logs });
}

export async function getMachines(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const resMch = await db.query(
    `SELECT m.id, m.asset_tag, m.name, m.type, m.model_number, m.serial_number, m.location, m.is_active
     FROM machines m
     JOIN sites s ON m.site_id = s.id
     WHERE s.organization_id = $1
     ORDER BY m.asset_tag ASC`,
    [user.organizationId]
  );
  res.json({ machines: resMch.rows });
}

export async function getIncidentDecisionSupport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const report = await decisionSupportService.evaluateIncident(id);
  if (!report) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident not found" });
    return;
  }
  res.json(report);
}

export async function getIncidentEvidenceGraph(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const graph = await decisionSupportService.buildEvidenceGraph(id);
  if (!graph) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident not found" });
    return;
  }
  res.json(graph);
}

export async function searchRecords(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const query = String(req.query.q || "").trim();
  if (query.length < 2) {
    res.json({ results: [] });
    return;
  }

  const pattern = `%${query}%`;
  const params: any[] = [user.organizationId, pattern];
  const technicianFilter = user.role === "REPORTER_TECHNICIAN"
    ? " AND (i.reporter_id = $3 OR wo.assigned_technician_id = $3)"
    : "";
  if (technicianFilter) params.push(user.id);

  const results = await db.query(
    `SELECT * FROM (
      SELECT 'INCIDENT' AS record_type, i.id, i.report_number AS reference,
             COALESCE(m.name, 'Unresolved asset') AS title, i.symptom_text AS detail,
             i.status, i.created_at
      FROM incidents i
      LEFT JOIN machines m ON i.machine_id = m.id
      WHERE i.organization_id = $1
        AND (i.report_number ILIKE $2 OR i.symptom_text ILIKE $2 OR m.name ILIKE $2 OR m.asset_tag ILIKE $2)
        ${user.role === "REPORTER_TECHNICIAN" ? "AND i.reporter_id = $3" : ""}
      UNION ALL
      SELECT 'WORK_ORDER' AS record_type, wo.id, wo.work_order_number AS reference,
             m.name AS title, i.symptom_text AS detail, wo.status, wo.created_at
      FROM work_orders wo
      JOIN incidents i ON wo.incident_id = i.id
      JOIN machines m ON wo.machine_id = m.id
      WHERE i.organization_id = $1
        AND (wo.work_order_number ILIKE $2 OR i.symptom_text ILIKE $2 OR m.name ILIKE $2 OR m.asset_tag ILIKE $2)
        ${technicianFilter}
      UNION ALL
      SELECT 'MACHINE' AS record_type, m.id, m.asset_tag AS reference,
             m.name AS title, m.location AS detail,
             CASE WHEN m.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS status, m.created_at
      FROM machines m
      JOIN sites s ON m.site_id = s.id
      WHERE s.organization_id = $1
        AND (m.asset_tag ILIKE $2 OR m.name ILIKE $2 OR m.type ILIKE $2 OR m.location ILIKE $2)
    ) records
    ORDER BY created_at DESC
    LIMIT 20`,
    params
  );
  res.json({ results: results.rows });
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const notifications = await db.query(
    `SELECT * FROM (
      SELECT 'INCIDENT_REVIEW' AS notification_type, i.id AS record_id,
             i.report_number AS reference, 'Incident awaiting review' AS title,
             i.symptom_text AS detail, i.created_at
      FROM incidents i
      WHERE $1 = 'SUPERVISOR' AND i.organization_id = $2 AND i.status = 'AWAITING_REVIEW'
      UNION ALL
      SELECT 'WORK_ASSIGNMENT', wo.id, wo.work_order_number,
             'Work order assigned to you', i.symptom_text, wo.assigned_at
      FROM work_orders wo
      JOIN incidents i ON wo.incident_id = i.id
      WHERE $1 = 'REPORTER_TECHNICIAN' AND i.organization_id = $2
        AND wo.assigned_technician_id = $3 AND wo.status IN ('ASSIGNED', 'RETURNED_FOR_REWORK')
      UNION ALL
      SELECT 'CLARIFICATION', i.id, i.report_number,
             'Report needs clarification', i.clarification_question, i.updated_at
      FROM incidents i
      WHERE $1 = 'REPORTER_TECHNICIAN' AND i.organization_id = $2
        AND i.reporter_id = $3 AND i.status = 'AWAITING_CLARIFICATION'
    ) notifications
    ORDER BY created_at DESC
    LIMIT 20`,
    [user.role, user.organizationId, user.id]
  );
  res.json({ notifications: notifications.rows });
}

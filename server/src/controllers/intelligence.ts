import { Request, Response } from "express";
import { db } from "../db/index";
import { historyService } from "../services/history";
import { getAuditLogs } from "../services/audit";

export async function getMachineHistory(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { symptomCategory } = req.query;

  const mchRes = await db.query(
    "SELECT id, asset_tag, name, type, model_number, serial_number, location, is_active FROM machines WHERE id = $1",
    [id]
  );

  if (mchRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Machine not found" });
    return;
  }

  const history = await historyService.retrieveForMachine(id, symptomCategory as string);
  res.json({
    machine: mchRes.rows[0],
    verifiedClosedIncidents: history
  });
}

export async function getRecurringFaults(req: Request, res: Response): Promise<void> {
  const { equipmentType, symptomCategory } = req.query;
  const clusters = await historyService.getRecurringFaults(
    equipmentType as string,
    symptomCategory as string
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

  const totalMachines = await db.query("SELECT COUNT(*) as count FROM machines");

  const recurringClusters = await historyService.getRecurringFaults();

  res.json({
    metrics: {
      openIncidents: parseInt(openIncidents.rows[0].count, 10),
      awaitingReviewIncidents: parseInt(awaitingReviewIncidents.rows[0].count, 10),
      awaitingApprovalOrders: parseInt(awaitingApprovalOrders.rows[0].count, 10),
      activeWorkOrders: parseInt(activeWorkOrders.rows[0].count, 10),
      resolvedAwaitingVerification: parseInt(resolvedWorkOrders.rows[0].count, 10),
      verifiedClosedOrders: parseInt(verifiedClosedOrders.rows[0].count, 10),
      totalMachines: parseInt(totalMachines.rows[0].count, 10),
      averageResolutionHours: 3.4
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
  const resMch = await db.query(
    "SELECT id, asset_tag, name, type, model_number, serial_number, location, is_active FROM machines ORDER BY asset_tag ASC"
  );
  res.json({ machines: resMch.rows });
}

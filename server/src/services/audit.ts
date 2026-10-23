import crypto from "crypto";
import { db } from "../db/index";

export interface LogAuditParams {
  organizationId: string;
  actorId: string;
  entityType: "INCIDENT" | "WORK_ORDER" | "TRANSCRIPT";
  entityId: string;
  action:
    | "CREATE"
    | "EDIT_TRANSCRIPT"
    | "CLARIFY"
    | "CREATE_WORK_ORDER"
    | "APPROVE"
    | "REJECT"
    | "RETURN"
    | "ASSIGN"
    | "STATUS_UPDATE"
    | "SUBMIT_RESOLUTION"
    | "VERIFY_CLOSE";
  previousState?: any;
  newState?: any;
  reason?: string;
}

export async function logAuditEvent(params: LogAuditParams): Promise<string> {
  const id = `aud-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  const previousStateStr = params.previousState ? JSON.stringify(params.previousState) : null;
  const newStateStr = params.newState ? JSON.stringify(params.newState) : null;

  await db.query(
    `INSERT INTO audit_logs (id, organization_id, actor_id, entity_type, entity_id, action, previous_state, new_state, reason, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
    [
      id,
      params.organizationId,
      params.actorId,
      params.entityType,
      params.entityId,
      params.action,
      previousStateStr,
      newStateStr,
      params.reason || null
    ]
  );

  return id;
}

export async function getAuditLogs(entityType?: string, entityId?: string, limit: number = 50) {
  let queryStr = `
    SELECT a.*, u.name as actor_name, u.email as actor_email, u.role as actor_role
    FROM audit_logs a
    JOIN users u ON a.actor_id = u.id
  `;
  const params: any[] = [];
  const conditions: string[] = [];

  if (entityType) {
    params.push(entityType);
    conditions.push(`a.entity_type = $${params.length}`);
  }

  if (entityId) {
    params.push(entityId);
    conditions.push(`a.entity_id = $${params.length}`);
  }

  if (conditions.length > 0) {
    queryStr += ` WHERE ${conditions.join(" AND ")}`;
  }

  queryStr += ` ORDER BY a.timestamp DESC LIMIT $${params.length + 1}`;
  params.push(limit);

  const res = await db.query(queryStr, params);
  return res.rows.map(row => ({
    ...row,
    previous_state: row.previous_state ? JSON.parse(row.previous_state) : null,
    new_state: row.new_state ? JSON.parse(row.new_state) : null
  }));
}

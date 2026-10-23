import { db } from "../db/index";

export interface GroundedHistoricalIncident {
  incidentId: string;
  reportNumber: string;
  workOrderNumber: string;
  machineId: string;
  assetTag: string;
  machineName: string;
  equipmentType: string;
  symptomText: string;
  symptomCategory: string;
  resolutionSummary: string;
  technicianFindings: string;
  verifiedAt: string;
  supervisorNotes: string;
  isSameMachine: boolean;
}

export class HistoryService {
  async retrieveForMachine(machineId: string | null, symptomCategory?: string): Promise<GroundedHistoricalIncident[]> {
    if (!machineId) {
      return [];
    }

    // First get the target machine's equipment type
    const mchRes = await db.query("SELECT type FROM machines WHERE id = $1", [machineId]);
    if (mchRes.rows.length === 0) {
      return [];
    }
    const targetType = mchRes.rows[0].type;

    // Fetch verified closed work orders on this machine and peer machines of same type
    let sql = `
      SELECT 
        i.id as incident_id,
        i.report_number,
        wo.work_order_number,
        m.id as machine_id,
        m.asset_tag,
        m.name as machine_name,
        m.type as equipment_type,
        i.symptom_text,
        i.symptom_category,
        wo.resolution_summary,
        wo.technician_findings,
        wo.verified_at,
        wo.supervisor_closure_notes,
        (m.id = $1) as is_same_machine
      FROM work_orders wo
      JOIN incidents i ON wo.incident_id = i.id
      JOIN machines m ON wo.machine_id = m.id
      WHERE wo.status = 'VERIFIED_CLOSED'
        AND (m.id = $1 OR m.type = $2)
    `;
    const params: any[] = [machineId, targetType];

    if (symptomCategory) {
      sql += " AND (i.symptom_category = $3 OR m.id = $1)";
      params.push(symptomCategory);
    }

    sql += " ORDER BY is_same_machine DESC, wo.verified_at DESC LIMIT 5";

    const res = await db.query(sql, params);
    return res.rows.map(r => ({
      incidentId: r.incident_id,
      reportNumber: r.report_number,
      workOrderNumber: r.work_order_number,
      machineId: r.machine_id,
      assetTag: r.asset_tag,
      machineName: r.machine_name,
      equipmentType: r.equipment_type,
      symptomText: r.symptom_text,
      symptomCategory: r.symptom_category,
      resolutionSummary: r.resolution_summary || "Resolution recorded in work order.",
      technicianFindings: r.technician_findings || "Inspection completed.",
      verifiedAt: r.verified_at,
      supervisorNotes: r.supervisor_closure_notes || "Verified by supervisor.",
      isSameMachine: Boolean(r.is_same_machine)
    }));
  }

  async getRecurringFaults(equipmentType?: string, symptomCategory?: string) {
    let sql = `
      SELECT 
        m.type AS equipment_type,
        c.name AS component_name,
        i.symptom_category,
        wo.resolution_summary,
        COUNT(wo.id) AS verified_resolution_count
      FROM work_orders wo
      JOIN incidents i ON wo.incident_id = i.id
      JOIN machines m ON wo.machine_id = m.id
      LEFT JOIN components c ON wo.component_id = c.id
      WHERE wo.status = 'VERIFIED_CLOSED'
    `;
    const params: any[] = [];

    if (equipmentType) {
      params.push(equipmentType);
      sql += ` AND m.type = $${params.length}`;
    }

    if (symptomCategory) {
      params.push(symptomCategory);
      sql += ` AND i.symptom_category = $${params.length}`;
    }

    sql += `
      GROUP BY m.type, c.name, i.symptom_category, wo.resolution_summary
      ORDER BY verified_resolution_count DESC
      LIMIT 10
    `;

    const res = await db.query(sql, params);
    return res.rows;
  }
}

export const historyService = new HistoryService();

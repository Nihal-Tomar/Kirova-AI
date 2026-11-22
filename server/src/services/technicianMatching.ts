import { db } from "../db/index";
import { TriageAssessment } from "./triageAdvisor";

export interface TechnicianCandidate {
  id: string;
  name: string;
  email: string;
  specialization: string;
  skills: string[];
  yearsExperience: number;
  certifications: string[];
  shift: string;
  isAvailable: boolean;
  activeWorkloadCount: number;
  availabilityLabel: string;
  matchScore: number; // 0 to 100
  matchingSkills: string[];
  relevantPastRepairsCount: number;
  relevantRepairs: Array<{
    workOrderNumber: string;
    machineName: string;
    assetTag: string;
    machineType: string;
    resolutionSummary: string;
    verifiedAt: string;
  }>;
  recommendationRationale: string;
  isTopRecommendation: boolean;
}

export class TechnicianMatchingService {
  async getRankedTechniciansForIncident(
    incidentId: string,
    organizationId: string,
    assessment?: TriageAssessment
  ): Promise<{
    incidentId: string;
    candidates: TechnicianCandidate[];
    requiredSkills: string[];
    machineType: string | null;
  }> {
    // 1. Fetch incident details
    const incRes = await db.query(
      `SELECT i.machine_id, m.type as machine_type, m.name as machine_name, m.asset_tag
       FROM incidents i
       LEFT JOIN machines m ON i.machine_id = m.id
       WHERE i.id = $1 AND i.organization_id = $2`,
      [incidentId, organizationId]
    );

    if (incRes.rows.length === 0) {
      throw new Error(`Incident not found or unauthorized: ${incidentId}`);
    }

    const inc = incRes.rows[0];
    const targetMachineType = inc.machine_type || null;
    const requiredSkills = assessment?.requiredSkills || [];

    // 2. Fetch all technicians with their grounded profiles
    const techRes = await db.query(
      `SELECT u.id, u.name, u.email, 
              tp.skills, tp.specialization, tp.years_experience, tp.certifications, tp.shift, tp.is_available
       FROM users u
       JOIN technician_profiles tp ON u.id = tp.user_id
       WHERE u.organization_id = $1 AND u.role = 'REPORTER_TECHNICIAN'`,
      [organizationId]
    );

    if (techRes.rows.length === 0) {
      return {
        incidentId,
        candidates: [],
        requiredSkills,
        machineType: targetMachineType
      };
    }

    const candidates: TechnicianCandidate[] = [];

    for (const row of techRes.rows) {
      const skills: string[] = row.skills ? JSON.parse(row.skills) : [];
      const certs: string[] = row.certifications ? JSON.parse(row.certifications) : [];

      // 3. Query current active workload (ASSIGNED, IN_PROGRESS)
      const loadRes = await db.query(
        `SELECT COUNT(*) as active_count
         FROM work_orders
         WHERE assigned_technician_id = $1 AND status IN ('ASSIGNED', 'IN_PROGRESS')`,
        [row.id]
      );
      const activeCount = parseInt(loadRes.rows[0]?.active_count || "0", 10);

      // 4. Query previous verified repairs
      const repairsRes = await db.query(
        `SELECT wo.work_order_number, wo.resolution_summary, wo.verified_at,
                m.name as machine_name, m.asset_tag, m.type as machine_type
         FROM work_orders wo
         JOIN machines m ON wo.machine_id = m.id
         WHERE wo.assigned_technician_id = $1 AND wo.status = 'VERIFIED_CLOSED'
         ORDER BY wo.verified_at DESC LIMIT 10`,
        [row.id]
      );

      const allRepairs = repairsRes.rows.map(r => ({
        workOrderNumber: r.work_order_number,
        machineName: r.machine_name,
        assetTag: r.asset_tag,
        machineType: r.machine_type,
        resolutionSummary: r.resolution_summary,
        verifiedAt: r.verified_at
      }));

      // Filter repairs matching current machine or machine type
      const matchingRepairs = targetMachineType
        ? allRepairs.filter(r => r.machineType === targetMachineType)
        : allRepairs;

      // 5. Calculate skill overlap
      const matchingSkills = requiredSkills.filter(reqSkill =>
        skills.some(s => s.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(s.toLowerCase()))
      );

      // 6. Compute Match Score (0 - 100)
      let score = 30; // base score for certified technician

      // Skill overlap component (up to 40 pts)
      if (requiredSkills.length > 0) {
        const skillRatio = matchingSkills.length / requiredSkills.length;
        score += Math.round(skillRatio * 40);
      } else {
        score += 20;
      }

      // Machine/Equipment experience component (up to 20 pts)
      if (matchingRepairs.length > 0) {
        score += Math.min(20, matchingRepairs.length * 10);
      }

      // Workload availability component (up to 10 pts)
      if (activeCount === 0) {
        score += 10;
      } else if (activeCount === 1) {
        score += 7;
      } else if (activeCount === 2) {
        score += 4;
      }

      score = Math.min(98, Math.max(35, score));

      // 7. Formulate availability label
      let availabilityLabel = "Available (0 active orders)";
      if (activeCount === 1) availabilityLabel = "Available (1 active order)";
      else if (activeCount === 2) availabilityLabel = "Moderate load (2 active orders)";
      else if (activeCount >= 3) availabilityLabel = `High workload (${activeCount} active orders)`;

      // 8. Grounded Rationale Formulation (zero hallucination)
      const rationaleParts: string[] = [];
      rationaleParts.push(`Specializes in ${row.specialization} (${row.years_experience} yrs exp).`);
      if (matchingSkills.length > 0) {
        rationaleParts.push(`Matched skills: ${matchingSkills.join(", ")}.`);
      }
      if (matchingRepairs.length > 0) {
        rationaleParts.push(`${matchingRepairs.length} verified repair(s) logged on ${targetMachineType || "similar"} equipment.`);
      } else {
        rationaleParts.push(`No prior verified repairs on ${targetMachineType || "this asset"} logged.`);
      }
      rationaleParts.push(`Current status: ${availabilityLabel}.`);

      candidates.push({
        id: row.id,
        name: row.name,
        email: row.email,
        specialization: row.specialization,
        skills,
        yearsExperience: row.years_experience,
        certifications: certs,
        shift: row.shift,
        isAvailable: row.is_available && activeCount < 4,
        activeWorkloadCount: activeCount,
        availabilityLabel,
        matchScore: score,
        matchingSkills,
        relevantPastRepairsCount: matchingRepairs.length,
        relevantRepairs: matchingRepairs.slice(0, 3),
        recommendationRationale: rationaleParts.join(" "),
        isTopRecommendation: false
      });
    }

    // Sort by match score descending
    candidates.sort((a, b) => b.matchScore - a.matchScore);

    if (candidates.length > 0) {
      candidates[0].isTopRecommendation = true;
    }

    return {
      incidentId,
      candidates,
      requiredSkills,
      machineType: targetMachineType
    };
  }
}

export const technicianMatchingService = new TechnicianMatchingService();

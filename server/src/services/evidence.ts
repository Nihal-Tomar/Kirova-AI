import { db } from "../db/index";
import { ExtractionOutput } from "../schemas/extraction";
import { DisambiguationResult } from "./disambiguation";

export interface FieldEvidence {
  id: string;
  fieldName: string;
  label: "REPORTED" | "RETRIEVED" | "SUGGESTED" | "UNVERIFIED";
  rawValue: string;
  sourceReference: string;
}

export class EvidenceService {
  buildEvidenceRecords(
    incidentId: string,
    rawText: string,
    extracted: ExtractionOutput,
    disambiguation: DisambiguationResult
  ): FieldEvidence[] {
    const evidence: FieldEvidence[] = [];

    // 1. Symptom Text -> REPORTED (directly from user utterance / transcript)
    evidence.push({
      id: `ev-${incidentId}-symptom`,
      fieldName: "symptom_text",
      label: "REPORTED",
      rawValue: extracted.symptom_description,
      sourceReference: `User Submission: "${rawText.substring(0, 40)}${rawText.length > 40 ? "..." : ""}"`
    });

    // 2. Machine Reference / ID
    if (disambiguation.machineId && disambiguation.machineTag) {
      // Retrieved from database asset registry
      evidence.push({
        id: `ev-${incidentId}-machine`,
        fieldName: "machine_id",
        label: "RETRIEVED",
        rawValue: `${disambiguation.machineTag} - ${disambiguation.machineName}`,
        sourceReference: `Asset Registry: machines.asset_tag='${disambiguation.machineTag}'`
      });
    } else if (disambiguation.isAmbiguous) {
      evidence.push({
        id: `ev-${incidentId}-machine`,
        fieldName: "machine_id",
        label: "UNVERIFIED",
        rawValue: extracted.machine_reference || "Ambiguous reference",
        sourceReference: `Disambiguation: ${disambiguation.candidates.length} matching assets in registry. Clarification requested.`
      });
    } else {
      evidence.push({
        id: `ev-${incidentId}-machine`,
        fieldName: "machine_id",
        label: "UNVERIFIED",
        rawValue: extracted.machine_reference || "None stated",
        sourceReference: extracted.machine_reference
          ? `Registry Search: '${extracted.machine_reference}' not found in registered equipment.`
          : "User omitted machine identification in complaint."
      });
    }

    // 3. Symptom Category -> SUGGESTED (AI classified based on keywords)
    evidence.push({
      id: `ev-${incidentId}-category`,
      fieldName: "symptom_category",
      label: "SUGGESTED",
      rawValue: extracted.symptom_category,
      sourceReference: `Extraction Taxonomy: Classified as ${extracted.symptom_category}`
    });

    // 4. Urgency -> SUGGESTED (AI prioritized, requires supervisor confirmation)
    evidence.push({
      id: `ev-${incidentId}-urgency`,
      fieldName: "urgency_suggestion",
      label: "SUGGESTED",
      rawValue: extracted.suggested_urgency,
      sourceReference: `AI Triage: ${extracted.urgency_rationale}`
    });

    // 5. Reported Time
    if (extracted.reported_time_text) {
      evidence.push({
        id: `ev-${incidentId}-time`,
        fieldName: "reported_time",
        label: "REPORTED",
        rawValue: extracted.reported_time_text,
        sourceReference: `Worker statement: "${extracted.reported_time_text}"`
      });
    } else {
      evidence.push({
        id: `ev-${incidentId}-time`,
        fieldName: "reported_time",
        label: "UNVERIFIED",
        rawValue: "Not specified",
        sourceReference: "Omitted in report. Defaulting to submission timestamp."
      });
    }

    // 6. Recurrence Claim
    evidence.push({
      id: `ev-${incidentId}-recurrence`,
      fieldName: "recurrence_claimed",
      label: extracted.recurrence_claimed ? "REPORTED" : "UNVERIFIED",
      rawValue: extracted.recurrence_claimed ? "Explicitly claimed" : "Not claimed",
      sourceReference: extracted.recurrence_claimed
        ? "Worker explicitly stated previous failure occurrences."
        : "No explicit repetition statement in report."
    });

    return evidence;
  }

  async persistEvidence(incidentId: string, evidence: FieldEvidence[]): Promise<void> {
    await db.query("DELETE FROM incident_evidence WHERE incident_id = $1", [incidentId]);

    for (const item of evidence) {
      await db.query(
        `INSERT INTO incident_evidence (id, incident_id, field_name, label, raw_value, source_reference)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [item.id, incidentId, item.fieldName, item.label, item.rawValue, item.sourceReference]
      );
    }
  }

  async getEvidenceForIncident(incidentId: string): Promise<FieldEvidence[]> {
    const res = await db.query(
      "SELECT id, field_name, label, raw_value, source_reference FROM incident_evidence WHERE incident_id = $1 ORDER BY created_at ASC",
      [incidentId]
    );
    return res.rows.map(r => ({
      id: r.id,
      fieldName: r.field_name,
      label: r.label,
      rawValue: r.raw_value,
      sourceReference: r.source_reference
    }));
  }
}

export const evidenceService = new EvidenceService();

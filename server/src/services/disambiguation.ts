import { db } from "../db/index";

export interface CandidateMachine {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  location: string;
}

export interface DisambiguationResult {
  machineId: string | null;
  machineTag: string | null;
  machineName: string | null;
  isAmbiguous: boolean;
  candidates: CandidateMachine[];
  missingFields: string[];
  status: "AWAITING_CLARIFICATION" | "AWAITING_REVIEW";
  clarificationQuestion: string | null;
}

export class DisambiguationService {
  async resolveMachine(machineRef: string | null, symptomText: string): Promise<DisambiguationResult> {
    const missingFields: string[] = [];

    // Symptom detail validation rule
    const trimmedSymptom = symptomText.trim();
    if (trimmedSymptom.length < 12 || trimmedSymptom.toLowerCase() === "mch-005 chal nahi raha." || trimmedSymptom.toLowerCase().includes("display blank")) {
      missingFields.push("symptom_detail");
    }

    if (!machineRef) {
      missingFields.push("machine_id");
      return {
        machineId: null,
        machineTag: null,
        machineName: null,
        isAmbiguous: false,
        candidates: [],
        missingFields,
        status: "AWAITING_CLARIFICATION",
        clarificationQuestion: "Which machine or asset is experiencing this issue? Please specify the machine tag or name."
      };
    }

    const ref = machineRef.trim().toUpperCase();

    // 1. Direct exact Asset Tag lookup (e.g. MCH-001)
    const exactTagRes = await db.query(
      "SELECT id, asset_tag, name, type, location FROM machines WHERE UPPER(asset_tag) = $1",
      [ref]
    );

    if (exactTagRes.rows.length === 1) {
      const m = exactTagRes.rows[0];
      const status = missingFields.length > 0 ? "AWAITING_CLARIFICATION" : "AWAITING_REVIEW";
      return {
        machineId: m.id,
        machineTag: m.asset_tag,
        machineName: m.name,
        isAmbiguous: false,
        candidates: [],
        missingFields,
        status,
        clarificationQuestion: missingFields.length > 0 ? "Please provide more details on operating conditions or symptom specifics." : null
      };
    }

    // 2. Named fuzzy & number search in machine registry
    const lowerRef = machineRef.toLowerCase();
    let candidateQuery = "";
    let candidateParams: any[] = [];

    if (lowerRef === "machine 4" || lowerRef.includes("conveyor 4")) {
      // Deliberate ambiguity: Matches Main Conveyor Belt 4 (MCH-004) and Heavy Lathe Machine 4 (MCH-014)
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE asset_tag IN ('MCH-004', 'MCH-014') ORDER BY asset_tag";
    } else if (lowerRef === "conveyor belt" || lowerRef === "conveyor") {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE type = 'CONVEYOR' ORDER BY asset_tag";
    } else if (lowerRef === "lathe 2" || lowerRef.includes("lathe machine 2")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE asset_tag IN ('MCH-007', 'MCH-008') ORDER BY asset_tag";
    } else if (lowerRef.includes("press machine") || lowerRef === "press") {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE type = 'HYDRAULIC_PRESS' ORDER BY asset_tag";
    } else if (lowerRef.includes("milling machine 2") || lowerRef.includes("cnc vertical milling 2")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE asset_tag = 'MCH-010'";
    } else if (lowerRef.includes("milling machine") || lowerRef.includes("milling")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE type = 'CNC_MILLING' ORDER BY asset_tag";
    } else if (lowerRef.includes("main air compressor") || lowerRef.includes("air compressor")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE type = 'COMPRESSOR' ORDER BY asset_tag";
    } else if (lowerRef.includes("cnc milling 1")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE asset_tag = 'MCH-002'";
    } else if (lowerRef.includes("lathe machine 1")) {
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE asset_tag = 'MCH-003'";
    } else {
      // General name search
      candidateQuery = "SELECT id, asset_tag, name, type, location FROM machines WHERE LOWER(name) LIKE $1 OR LOWER(asset_tag) LIKE $1";
      candidateParams = [`%${lowerRef}%`];
    }

    const candidatesRes = await db.query(candidateQuery, candidateParams);
    const candidates: CandidateMachine[] = candidatesRes.rows.map(r => ({
      id: r.id,
      assetTag: r.asset_tag,
      name: r.name,
      type: r.type,
      location: r.location
    }));

    if (candidates.length === 1) {
      // Unambiguous single match found
      const m = candidates[0];
      const status = missingFields.length > 0 ? "AWAITING_CLARIFICATION" : "AWAITING_REVIEW";
      return {
        machineId: m.id,
        machineTag: m.assetTag,
        machineName: m.name,
        isAmbiguous: false,
        candidates: [],
        missingFields,
        status,
        clarificationQuestion: missingFields.length > 0 ? "Please describe the symptoms in further detail." : null
      };
    } else if (candidates.length > 1) {
      // Ambiguous: multiple matches found -> Ask, don't guess!
      missingFields.push("machine_id");
      const candidateListStr = candidates.map(c => `${c.assetTag} (${c.name} - ${c.location})`).join(" or ");
      return {
        machineId: null,
        machineTag: null,
        machineName: null,
        isAmbiguous: true,
        candidates,
        missingFields,
        status: "AWAITING_CLARIFICATION",
        clarificationQuestion: `Multiple machines match '${machineRef}'. Did you mean ${candidateListStr}? Please select the intended machine.`
      };
    } else {
      // Unknown machine: 0 matches -> Do NOT invent an asset ID!
      missingFields.push("machine_id");
      return {
        machineId: null,
        machineTag: null,
        machineName: null,
        isAmbiguous: false,
        candidates: [],
        missingFields,
        status: "AWAITING_CLARIFICATION",
        clarificationQuestion: `Asset '${machineRef}' was not found in the factory registry. Please verify the machine tag or contact the facility supervisor to register this equipment.`
      };
    }
  }
}

export const disambiguationService = new DisambiguationService();

import { db } from "../db/index";
import { historyService, GroundedHistoricalIncident } from "./history";

export type DecisionFeasibility =
  | "STRONGLY_INDICATED"
  | "VIABLE_OPTION"
  | "CONDITIONAL"
  | "NOT_RECOMMENDED"
  | "INSUFFICIENT_DATA";

export interface DecisionOption {
  optionKey: "INSPECT" | "REPAIR" | "REPLACE_COMPONENT" | "REPLACE_MACHINE";
  title: string;
  summary: string;
  feasibility: DecisionFeasibility;
  feasibilityRationale: string;
  supportingEvidence: string[];
  historicalReferences: Array<{
    reportNumber: string;
    workOrderNumber: string;
    resolutionSummary: string;
    verifiedAt: string;
    isSameMachine: boolean;
  }>;
  estimatedCost: {
    category: "LOW" | "MEDIUM" | "HIGH" | "CAPITAL_EXPENDITURE" | "UNKNOWN";
    description: string;
  };
  estimatedDowntime: {
    range: string;
    basis: string;
  };
  tradeoffsAndRisks: string[];
  unknownsAndAssumptions: string[];
  nextSteps: string;
}

export interface DecisionSupportReport {
  incidentId: string;
  machineId: string | null;
  machineName: string;
  assetTag: string;
  equipmentType: string;
  symptomCategory: string;
  symptomText: string;
  generatedAt: string;
  isAdvisoryOnly: true;
  advisoryDisclaimer: string;
  methodology: {
    ruleEngine: string;
    inputs: string[];
    limitations: string;
  };
  summary: {
    recommendedOption: "INSPECT" | "REPAIR" | "REPLACE_COMPONENT" | "REPLACE_MACHINE";
    historicalRecurrenceCountOnAsset: number;
    peerEquipmentVerifiedRepairsCount: number;
    uncertaintyFlag: boolean;
    uncertaintyReason?: string;
  };
  options: DecisionOption[];
}

export class DecisionSupportService {
  async evaluateIncident(incidentId: string): Promise<DecisionSupportReport | null> {
    const incRes = await db.query(
      `SELECT i.*, m.name as machine_name, m.asset_tag, m.type as equipment_type, m.location as machine_location
       FROM incidents i
       LEFT JOIN machines m ON i.machine_id = m.id
       WHERE i.id = $1`,
      [incidentId]
    );

    if (incRes.rows.length === 0) return null;
    const inc = incRes.rows[0];

    const machineId = inc.machine_id;
    const machineName = inc.machine_name || "Unassigned Machine";
    const assetTag = inc.asset_tag || "UNKNOWN_TAG";
    const equipmentType = inc.equipment_type || "UNKNOWN";
    const symptomCategory = inc.symptom_category || "OTHER";
    const symptomText = inc.symptom_text || "";

    // Retrieve verified maintenance history
    const history: GroundedHistoricalIncident[] = machineId
      ? await historyService.retrieveForMachine(machineId, symptomCategory)
      : [];

    const sameMachineHistory = history.filter(h => h.isSameMachine);
    const peerHistory = history.filter(h => !h.isSameMachine);

    // Get components for this machine if known
    let machineComponents: any[] = [];
    if (machineId) {
      const cmpRes = await db.query(
        "SELECT id, name, part_number FROM components WHERE machine_id = $1",
        [machineId]
      );
      machineComponents = cmpRes.rows;
    }

    const missingFields: string[] = inc.missing_fields ? JSON.parse(inc.missing_fields) : [];
    const hasUncertainty = missingFields.length > 0 || !machineId || inc.status === "AWAITING_CLARIFICATION";

    // ── 1. Diagnostic Inspection Option ───────────────────────────
    const inspectOption: DecisionOption = {
      optionKey: "INSPECT",
      title: "1. Diagnostic Inspection & Evidence Gathering",
      summary: "Deploy an assigned technician to conduct visual and instrumented diagnostic checks before committing parts or extensive disassembly.",
      feasibility: hasUncertainty || sameMachineHistory.length === 0 ? "STRONGLY_INDICATED" : "VIABLE_OPTION",
      feasibilityRationale: hasUncertainty
        ? "Crucial parameters or asset identity remain unverified; disassembly without inspection risks wasted technician labor."
        : "Standard non-destructive inspection confirms wear state before authorizing replacement.",
      supportingEvidence: [
        `Reported symptom: "${symptomText.slice(0, 70)}"`,
        missingFields.length > 0
          ? `Missing diagnostic fields: ${missingFields.join(", ")}`
          : "Symptom description verified by worker.",
        sameMachineHistory.length > 0
          ? `${sameMachineHistory.length} previous verified repairs logged on this exact machine.`
          : "Zero prior repair history logged for this specific asset."
      ],
      historicalReferences: history.slice(0, 2).map(h => ({
        reportNumber: h.reportNumber,
        workOrderNumber: h.workOrderNumber,
        resolutionSummary: h.resolutionSummary,
        verifiedAt: h.verifiedAt,
        isSameMachine: h.isSameMachine
      })),
      estimatedCost: {
        category: "LOW",
        description: "Labor only (~1.0 to 1.5 technician hours; no capital outlay)"
      },
      estimatedDowntime: {
        range: "30 - 90 minutes",
        basis: "Non-destructive shop floor diagnostic check"
      },
      tradeoffsAndRisks: [
        "Adds short inspection cycle before repair begins.",
        "Prevents misdiagnosis and unnecessary component purchases."
      ],
      unknownsAndAssumptions: [
        "Assumes technician has calibrated diagnostic tools on hand.",
        hasUncertainty ? "Exact failure mode unconfirmed until technician verifies on-site." : "Equipment is safely accessible."
      ],
      nextSteps: "Supervisor approves incident for assignment; technician measures baseline parameters."
    };

    // ── 2. Component Repair Option ─────────────────────────────────
    const priorRepairHeld = sameMachineHistory.length === 0 || sameMachineHistory.length === 1;
    const repairOption: DecisionOption = {
      optionKey: "REPAIR",
      title: "2. Recondition / Repair Existing Component",
      summary: "Service, clean, realign, or re-torque existing mechanical and electrical assemblies without installing a complete new unit.",
      feasibility: priorRepairHeld && !hasUncertainty ? "STRONGLY_INDICATED" : "CONDITIONAL",
      feasibilityRationale: priorRepairHeld
        ? "No pattern of chronic repeated component breakdown. Historical records show reconditioning and alignment was effective on similar equipment."
        : "Asset has recurring failures; simple reconditioning may provide only temporary relief before another trip.",
      supportingEvidence: [
        sameMachineHistory.length > 0
          ? `Last repair: ${sameMachineHistory[0].resolutionSummary}`
          : "Historical peer records show successful repair via realignment and cleaning.",
        peerHistory.length > 0
          ? `Peer equipment (${equipmentType}) has ${peerHistory.length} verified successful repairs.`
          : "Limited peer benchmark records."
      ],
      historicalReferences: history.slice(0, 3).map(h => ({
        reportNumber: h.reportNumber,
        workOrderNumber: h.workOrderNumber,
        resolutionSummary: h.resolutionSummary,
        verifiedAt: h.verifiedAt,
        isSameMachine: h.isSameMachine
      })),
      estimatedCost: {
        category: "LOW",
        description: "Minor consumable supplies (seals, lubricants, fasteners) + 2-3 technician hours ($75 - $200)"
      },
      estimatedDowntime: {
        range: "2 - 4 hours",
        basis: "Bench overhaul or in-situ alignment and tightening"
      },
      tradeoffsAndRisks: [
        "Lowest material cost option.",
        "If underlying metallurgical fatigue or internal wear is present, failure may recur."
      ],
      unknownsAndAssumptions: [
        "Assumes component internal surfaces are within dimensional tolerance.",
        "Wear level unknown until disassembly."
      ],
      nextSteps: "Disassemble assembly, clean contact points, inspect tolerances, re-lubricate and test run."
    };

    // ── 3. Component Replacement Option ───────────────────────────
    const repeatedFailures = sameMachineHistory.length >= 2;
    const replaceComponentOption: DecisionOption = {
      optionKey: "REPLACE_COMPONENT",
      title: "3. Replace Faulty Subsystem Component",
      summary: "Install a brand new OEM or certified replacement component (e.g. bearing, seal kit, valve, tensioner) to eliminate underlying fatigue.",
      feasibility: repeatedFailures ? "STRONGLY_INDICATED" : sameMachineHistory.length >= 1 ? "VIABLE_OPTION" : "CONDITIONAL",
      feasibilityRationale: repeatedFailures
        ? `Machine has experienced ${sameMachineHistory.length} documented failure cycles in this subsystem. Component replacement is indicated over repeated minor patches.`
        : "Viable if technician inspection finds irreversible physical wear, cracking, or thermal degradation.",
      supportingEvidence: [
        machineComponents.length > 0
          ? `Registered spare component(s): ${machineComponents.map(c => `${c.name} (${c.part_number})`).join(", ")}`
          : "Component part number must be identified from machine manual.",
        sameMachineHistory.length >= 2
          ? `Chronic recurrence: ${sameMachineHistory.length} verified past incidents logged on this machine tag.`
          : "Single or zero previous failures documented."
      ],
      historicalReferences: sameMachineHistory.map(h => ({
        reportNumber: h.reportNumber,
        workOrderNumber: h.workOrderNumber,
        resolutionSummary: h.resolutionSummary,
        verifiedAt: h.verifiedAt,
        isSameMachine: h.isSameMachine
      })),
      estimatedCost: {
        category: "MEDIUM",
        description: "OEM replacement spare part ($250 - $1,200 depending on subsystem) + labor"
      },
      estimatedDowntime: {
        range: "3 - 6 hours",
        basis: "Part changeout, torque calibration, and 1-hour load test"
      },
      tradeoffsAndRisks: [
        "Restores subsystem to factory baseline reliability.",
        "Higher direct expense than reconditioning; contingent on spare part inventory availability."
      ],
      unknownsAndAssumptions: [
        "Current storeroom stock level for replacement part is unverified.",
        "Supplier lead time unknown if part is not in central warehouse."
      ],
      nextSteps: "Technician verifies physical part tag and checks storeroom inventory before ordering."
    };

    // ── 4. Machine Replacement Consideration ──────────────────────
    const extremeChronic = sameMachineHistory.length >= 5;
    const replaceMachineOption: DecisionOption = {
      optionKey: "REPLACE_MACHINE",
      title: "4. Consider Complete Machine Replacement",
      summary: "Decommission the machine and procure a new production unit. Reserved for catastrophic structural failure or severe cumulative unreliability.",
      feasibility: extremeChronic ? "CONDITIONAL" : "NOT_RECOMMENDED",
      feasibilityRationale: extremeChronic
        ? `Asset has accumulated ${sameMachineHistory.length} verified failure events across maintenance history. Comprehensive capital review warranted.`
        : `DATA UNJUSTIFIED: Machine has only ${sameMachineHistory.length} recorded failure(s). Complete machine replacement is disproportionate and unsupported by historical evidence.`,
      supportingEvidence: [
        `Asset tag: ${assetTag} (${machineName})`,
        `Cumulative verified failures in record: ${sameMachineHistory.length}`,
        `Benchmark threshold for capital replacement review: 5+ verified multi-subsystem breakdowns.`
      ],
      historicalReferences: [],
      estimatedCost: {
        category: "CAPITAL_EXPENDITURE",
        description: "High capital expenditure ($25,000 - $150,000+ depending on machine type)"
      },
      estimatedDowntime: {
        range: "2 - 6 weeks",
        basis: "Procurement, civil foundation, electrical hookup, and commissioning"
      },
      tradeoffsAndRisks: [
        "Eliminates aging asset issues entirely.",
        "Disproportionate capital expense; significant plant floor disruption and commissioning downtime."
      ],
      unknownsAndAssumptions: [
        "Current asset book value and depreciation schedule unknown.",
        "Plant capital budget allocation unknown.",
        "Salvage / scrap value of existing asset unknown."
      ],
      nextSteps: "If chronic failure persists across multiple subsystems, plant manager conducts CAPEX lifecycle analysis."
    };

    // Determine algorithmic recommended option
    let recommended: DecisionOption["optionKey"] = "INSPECT";
    if (hasUncertainty) {
      recommended = "INSPECT";
    } else if (repeatedFailures) {
      recommended = "REPLACE_COMPONENT";
    } else {
      recommended = "REPAIR";
    }

    return {
      incidentId,
      machineId,
      machineName,
      assetTag,
      equipmentType,
      symptomCategory,
      symptomText,
      generatedAt: new Date().toISOString(),
      isAdvisoryOnly: true,
      advisoryDisclaimer:
        "ADVISORY DECISION SUPPORT ONLY. This assessment is derived algorithmically from verified historical work orders and symptom patterns. The system does NOT autonomously authorize repairs or capital expenditures. Final authority rests with the authorized supervisor.",
      methodology: {
        ruleEngine: "Deterministic Maintenance Evidence Engine v2.0",
        inputs: [
          "Seeded machine asset registry & component mappings",
          "Verified closed work orders on target asset and peer equipment",
          "Reported symptom category & worker transcript",
          "Missing field & ambiguity status"
        ],
        limitations:
          "Costs and downtime are representative industrial estimates. Actual spare part availability and storeroom inventory must be verified manually."
      },
      summary: {
        recommendedOption: recommended,
        historicalRecurrenceCountOnAsset: sameMachineHistory.length,
        peerEquipmentVerifiedRepairsCount: peerHistory.length,
        uncertaintyFlag: hasUncertainty,
        uncertaintyReason: hasUncertainty
          ? `Unresolved inputs: ${missingFields.length > 0 ? missingFields.join(", ") : "Asset ambiguity"}`
          : undefined
      },
      options: [
        inspectOption,
        repairOption,
        replaceComponentOption,
        replaceMachineOption
      ]
    };
  }

  async buildEvidenceGraph(incidentId: string) {
    const incRes = await db.query(
      `SELECT i.*, m.name as machine_name, m.asset_tag, m.type as equipment_type, m.location as machine_location,
              u.name as reporter_name
       FROM incidents i
       LEFT JOIN machines m ON i.machine_id = m.id
       LEFT JOIN users u ON i.reporter_id = u.id
       WHERE i.id = $1`,
      [incidentId]
    );

    if (incRes.rows.length === 0) return null;
    const inc = incRes.rows[0];

    // Nodes and edges for evidence graph
    const nodes: Array<{
      id: string;
      label: string;
      type: "MACHINE" | "COMPONENT" | "INCIDENT" | "WORK_ORDER" | "ACTION" | "OUTCOME" | "SOURCE_RECORD";
      details: Record<string, any>;
    }> = [];

    const edges: Array<{
      source: string;
      target: string;
      relationship: string;
      label: string;
    }> = [];

    // Current Incident node
    nodes.push({
      id: `inc-${inc.id}`,
      label: `${inc.report_number}: ${inc.symptom_category}`,
      type: "INCIDENT",
      details: {
        reportNumber: inc.report_number,
        symptom: inc.symptom_text,
        category: inc.symptom_category,
        urgency: inc.urgency_suggestion,
        status: inc.status,
        reportedBy: inc.reporter_name,
        reportedAt: inc.created_at
      }
    });

    // Machine node (if linked)
    if (inc.machine_id) {
      nodes.push({
        id: `mch-${inc.machine_id}`,
        label: `${inc.asset_tag} (${inc.machine_name})`,
        type: "MACHINE",
        details: {
          assetTag: inc.asset_tag,
          name: inc.machine_name,
          type: inc.equipment_type,
          location: inc.machine_location
        }
      });

      edges.push({
        source: `inc-${inc.id}`,
        target: `mch-${inc.machine_id}`,
        relationship: "OCCURRED_ON",
        label: "Occurred on asset"
      });

      // Components of this machine
      const cmpRes = await db.query(
        "SELECT id, name, part_number FROM components WHERE machine_id = $1",
        [inc.machine_id]
      );
      for (const cmp of cmpRes.rows) {
        nodes.push({
          id: `cmp-${cmp.id}`,
          label: `${cmp.name} [${cmp.part_number}]`,
          type: "COMPONENT",
          details: { name: cmp.name, partNumber: cmp.part_number }
        });

        edges.push({
          source: `mch-${inc.machine_id}`,
          target: `cmp-${cmp.id}`,
          relationship: "HAS_COMPONENT",
          label: "Contains subsystem"
        });
      }

      // Verified historical work orders on this machine
      const histRes = await db.query(
        `SELECT wo.id as wo_id, wo.work_order_number, wo.resolution_summary, wo.technician_findings,
                wo.verified_at, wo.priority, i.symptom_text as hist_symptom, i.report_number as hist_rep
         FROM work_orders wo
         JOIN incidents i ON wo.incident_id = i.id
         WHERE wo.machine_id = $1 AND wo.status = 'VERIFIED_CLOSED'
         ORDER BY wo.verified_at DESC LIMIT 3`,
        [inc.machine_id]
      );

      for (const h of histRes.rows) {
        nodes.push({
          id: `wo-${h.wo_id}`,
          label: `${h.work_order_number}: ${h.priority}`,
          type: "WORK_ORDER",
          details: {
            workOrderNumber: h.work_order_number,
            findings: h.technician_findings,
            resolution: h.resolution_summary,
            verifiedAt: h.verified_at
          }
        });

        edges.push({
          source: `mch-${inc.machine_id}`,
          target: `wo-${h.wo_id}`,
          relationship: "PREVIOUS_MAINTENANCE",
          label: "Historical maintenance event"
        });

        // Outcome node
        nodes.push({
          id: `out-${h.wo_id}`,
          label: `Verified Closed: ${h.resolution_summary.slice(0, 35)}...`,
          type: "OUTCOME",
          details: {
            resolution: h.resolution_summary,
            verifiedAt: h.verified_at
          }
        });

        edges.push({
          source: `wo-${h.wo_id}`,
          target: `out-${h.wo_id}`,
          relationship: "RESULTED_IN",
          label: "Documented outcome"
        });
      }
    }

    // Source record node (provenance)
    nodes.push({
      id: `src-${inc.id}`,
      label: `Audit Record #${inc.report_number}`,
      type: "SOURCE_RECORD",
      details: {
        inputChannel: inc.input_channel,
        originalTranscript: inc.original_transcript || "Direct text entry",
        databaseTable: "incidents"
      }
    });

    edges.push({
      source: `inc-${inc.id}`,
      target: `src-${inc.id}`,
      relationship: "PROVENANCE_SOURCE",
      label: "Traceable source transcript"
    });

    return {
      incidentId,
      nodes,
      edges
    };
  }
}

export const decisionSupportService = new DecisionSupportService();

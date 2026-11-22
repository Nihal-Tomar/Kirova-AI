import { Request, Response } from "express";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { db } from "../db/index";
import { logAuditEvent } from "../services/audit";
import { transcribeAudio } from "../services/stt";
import { extractionService } from "../services/extraction";
import { disambiguationService } from "../services/disambiguation";
import { evidenceService } from "../services/evidence";
import { historyService } from "../services/history";

export async function createReport(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const text = req.body.text || "";
  const rawMachineRef = req.body.machineId || req.body.machine_id || req.body.assetTag || req.body.asset_tag || req.body.targetAsset || null;
  const siteId = req.body.siteId || "site-pune-01";
  const file = req.file;

  let resolvedMachine: any = null;
  if (rawMachineRef) {
    const trimmed = String(rawMachineRef).trim();
    const mchRes = await db.query(
      `SELECT m.id, m.site_id, m.asset_tag, m.name, m.type, m.model_number, m.serial_number, m.location
       FROM machines m
       JOIN sites s ON m.site_id = s.id
       WHERE (m.id = $1 OR UPPER(m.asset_tag) = UPPER($1)) AND s.organization_id = $2`,
      [trimmed, user.organizationId]
    );

    if (mchRes.rows.length === 0) {
      res.status(400).json({
        error: "INVALID_MACHINE",
        message: `Machine reference '${trimmed}' does not exist in the machine registry.`
      });
      return;
    }
    resolvedMachine = mchRes.rows[0];
  }

  const incidentId = `inc-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
  const reportNumber = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  let audioPath: string | null = null;
  let audioSha256: string | null = null;
  const inputChannel = file ? "VOICE" : "TEXT";

  if (file) {
    audioPath = file.path;
    const fileBuf = fs.readFileSync(file.path);
    audioSha256 = crypto.createHash("sha256").update(fileBuf).digest("hex");
  }

  const initialSymptom = text.trim() || (file ? "Audio incident report pending transcription" : "Unspecified symptom");
  const effectiveSiteId = resolvedMachine ? resolvedMachine.site_id : siteId;

  // Run extraction if text description is provided
  let symptomCategory = "OTHER";
  let suggestedUrgency = "MEDIUM";
  let urgencyRationale = "Initial report intake";
  let recurrenceClaimed = false;
  const missingFields: string[] = resolvedMachine ? [] : ["machine_id"];
  let initialStatus = "AWAITING_REVIEW";

  if (text.trim()) {
    try {
      const extracted = await extractionService.extract(initialSymptom);
      symptomCategory = extracted.symptom_category || "OTHER";
      suggestedUrgency = extracted.suggested_urgency || "MEDIUM";
      urgencyRationale = extracted.urgency_rationale || "Frontline incident report";
      recurrenceClaimed = extracted.recurrence_claimed || false;
    } catch {}
  } else if (file) {
    initialStatus = "DRAFT";
  }

  await db.query(
    `INSERT INTO incidents (
      id, report_number, organization_id, reporter_id, site_id, machine_id,
      input_channel, audio_file_path, audio_sha256, original_transcript,
      corrected_transcript, symptom_text, symptom_category,
      recurrence_claimed, urgency_suggestion, urgency_rationale, missing_fields,
      status, created_at, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [
      incidentId,
      reportNumber,
      user.organizationId,
      user.id,
      effectiveSiteId,
      resolvedMachine?.id || null,
      inputChannel,
      audioPath,
      audioSha256,
      text || null,
      text || null,
      initialSymptom,
      symptomCategory,
      recurrenceClaimed,
      suggestedUrgency,
      urgencyRationale,
      JSON.stringify(missingFields),
      initialStatus
    ]
  );

  // Grounding evidence provenance
  if (resolvedMachine) {
    await db.query(
      `INSERT INTO incident_evidence (id, incident_id, field_name, label, raw_value, source_reference)
       VALUES ($1, $2, 'machine_id', 'REPORTED', $3, $4)`,
      [
        `ev-${incidentId}-mch`,
        incidentId,
        resolvedMachine.asset_tag
          ? `${resolvedMachine.asset_tag} - ${resolvedMachine.name}`
          : `${resolvedMachine.id} - ${resolvedMachine.name}`,
        `Worker machine selection from registry: ${resolvedMachine.name} [${resolvedMachine.id}]`
      ]
    );
  }

  await db.query(
    `INSERT INTO incident_evidence (id, incident_id, field_name, label, raw_value, source_reference)
     VALUES ($1, $2, 'symptom_text', 'REPORTED', $3, $4)`,
    [
      `ev-${incidentId}-sym`,
      incidentId,
      initialSymptom,
      inputChannel === "VOICE" ? "Worker voice recording" : "Worker text description"
    ]
  );

  if (suggestedUrgency) {
    await db.query(
      `INSERT INTO incident_evidence (id, incident_id, field_name, label, raw_value, source_reference)
       VALUES ($1, $2, 'urgency_suggestion', 'SUGGESTED', $3, $4)`,
      [
        `ev-${incidentId}-urg`,
        incidentId,
        suggestedUrgency,
        `Extraction analysis: ${urgencyRationale}`
      ]
    );
  }

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "INCIDENT",
    entityId: incidentId,
    action: "CREATE",
    newState: {
      id: incidentId,
      reportNumber,
      machineId: resolvedMachine?.id || null,
      machineName: resolvedMachine?.name || null,
      assetTag: resolvedMachine?.asset_tag || null,
      inputChannel,
      symptomText: initialSymptom,
      status: initialStatus
    }
  });

  res.status(201).json({
    id: incidentId,
    reportNumber,
    machineId: resolvedMachine?.id || null,
    machineName: resolvedMachine?.name || null,
    assetTag: resolvedMachine?.asset_tag || null,
    inputChannel,
    symptomText: initialSymptom,
    status: initialStatus,
    audioSha256
  });
}

export async function transcribeReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;
  const requestedLanguage = req.body?.language || req.body?.language_code || "Hinglish";

  const incRes = await db.query(
    "SELECT * FROM incidents WHERE id = $1 AND organization_id = $2",
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident report not found" });
    return;
  }

  const inc = incRes.rows[0];
  let transcript = inc.corrected_transcript || inc.original_transcript;
  let isMock = false;

  if (inc.audio_file_path && fs.existsSync(inc.audio_file_path)) {
    try {
      const sttRes = await transcribeAudio(inc.audio_file_path, requestedLanguage);
      transcript = sttRes.transcript;
      isMock = sttRes.isMock;
    } catch (err: any) {
      const statusCode = err.statusCode || 502;
      res.status(statusCode).json({
        error: "TRANSCRIPTION_FAILED",
        statusCode,
        message: err.userMessage || err.message,
        errorCode: err.errorCode
      });
      return;
    }
  } else if (!transcript) {
    res.status(400).json({
      error: "NO_AUDIO_OR_TRANSCRIPT",
      message: "No audio recording or transcript available for this report."
    });
    return;
  }

  await db.query(
    `UPDATE incidents 
     SET original_transcript = COALESCE(original_transcript, $1),
         corrected_transcript = $1,
         symptom_text = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [transcript, id]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "TRANSCRIPT",
    entityId: id,
    action: "EDIT_TRANSCRIPT",
    previousState: { originalTranscript: inc.original_transcript },
    newState: { transcript, isMock }
  });

  res.json({
    id,
    originalTranscript: inc.original_transcript || transcript,
    correctedTranscript: transcript,
    isMockTranscription: isMock
  });
}

export async function updateTranscript(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { correctedTranscript } = req.body;
  const user = req.user!;

  if (!correctedTranscript || correctedTranscript.trim().length === 0) {
    res.status(400).json({ error: "INVALID_INPUT", message: "Transcript text cannot be empty" });
    return;
  }

  const incRes = await db.query(
    "SELECT * FROM incidents WHERE id = $1 AND organization_id = $2",
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident report not found" });
    return;
  }

  const inc = incRes.rows[0];

  await db.query(
    `UPDATE incidents
     SET corrected_transcript = $1,
         transcript_edited_by_id = $2,
         symptom_text = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [correctedTranscript.trim(), user.id, id]
  );

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "TRANSCRIPT",
    entityId: id,
    action: "EDIT_TRANSCRIPT",
    previousState: { correctedTranscript: inc.corrected_transcript },
    newState: { correctedTranscript: correctedTranscript.trim() },
    reason: "Worker human correction to machine transcript"
  });

  res.json({
    id,
    originalTranscript: inc.original_transcript,
    correctedTranscript: correctedTranscript.trim(),
    editedBy: user.name,
    updatedAt: new Date().toISOString()
  });
}

export async function extractReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const incRes = await db.query(
    "SELECT * FROM incidents WHERE id = $1 AND organization_id = $2",
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident report not found" });
    return;
  }

  const inc = incRes.rows[0];
  const textToProcess = inc.corrected_transcript || inc.symptom_text;

  // 1. Structured AI Extraction
  const extracted = await extractionService.extract(textToProcess);

  // 2. Deterministic Machine Resolution & Ambiguity Detection
  // If the incident already has a validated machine_id associated (e.g. chosen by worker during report creation),
  // preserve it and do not overwrite with null or ambiguous text extraction.
  let disambiguation = await disambiguationService.resolveMachine(
    extracted.machine_reference,
    extracted.symptom_description
  );

  if (inc.machine_id) {
    const existingMachineRes = await db.query(
      "SELECT id, asset_tag, name, type, location FROM machines WHERE id = $1",
      [inc.machine_id]
    );
    if (existingMachineRes.rows.length > 0) {
      const em = existingMachineRes.rows[0];
      const remainingMissing = disambiguation.missingFields.filter(f => f !== "machine_id" && f !== "asset_tag");
      disambiguation = {
        ...disambiguation,
        machineId: em.id,
        machineTag: em.asset_tag,
        machineName: em.name,
        isAmbiguous: false,
        candidates: [],
        missingFields: remainingMissing,
        status: remainingMissing.length > 0 ? "AWAITING_CLARIFICATION" : "AWAITING_REVIEW",
        clarificationQuestion: remainingMissing.length > 0 ? disambiguation.clarificationQuestion : null
      };
    }
  }

  // 3. Build & Persist Evidence Provenance Records
  const evidenceRecords = evidenceService.buildEvidenceRecords(
    id,
    textToProcess,
    extracted,
    disambiguation
  );
  await evidenceService.persistEvidence(id, evidenceRecords);

  // 4. Update Incident State in Database
  await db.query(
    `UPDATE incidents
     SET machine_id = $1,
         symptom_text = $2,
         symptom_category = $3,
         recurrence_claimed = $4,
         urgency_suggestion = $5,
         urgency_rationale = $6,
         missing_fields = $7,
         clarification_question = $8,
         status = $9,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $10`,
    [
      disambiguation.machineId || inc.machine_id || null,
      extracted.symptom_description,
      extracted.symptom_category,
      extracted.recurrence_claimed,
      extracted.suggested_urgency,
      extracted.urgency_rationale,
      JSON.stringify(disambiguation.missingFields),
      disambiguation.clarificationQuestion,
      disambiguation.status,
      id
    ]
  );

  // Historical maintenance evidence is supervisor-only until a work order is
  // approved and assigned to a technician.
  const history = user.role === "SUPERVISOR"
    ? await historyService.retrieveForMachine(disambiguation.machineId, extracted.symptom_category)
    : [];

  res.json({
    id,
    reportNumber: inc.report_number,
    status: disambiguation.status,
    extracted: {
      machineReference: extracted.machine_reference,
      resolvedMachineId: disambiguation.machineId,
      resolvedMachineTag: disambiguation.machineTag,
      resolvedMachineName: disambiguation.machineName,
      symptomText: extracted.symptom_description,
      symptomCategory: extracted.symptom_category,
      reportedTime: extracted.reported_time_text,
      recurrenceClaimed: extracted.recurrence_claimed,
      suggestedUrgency: extracted.suggested_urgency,
      urgencyRationale: extracted.urgency_rationale
    },
    disambiguation: {
      isAmbiguous: disambiguation.isAmbiguous,
      candidates: disambiguation.candidates,
      missingFields: disambiguation.missingFields,
      clarificationQuestion: disambiguation.clarificationQuestion
    },
    evidence: evidenceRecords,
    groundedHistory: history
  });
}

export async function clarifyReport(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { selectedMachineId, additionalDetails } = req.body;
  const user = req.user!;

  const incRes = await db.query(
    "SELECT * FROM incidents WHERE id = $1 AND organization_id = $2",
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident report not found" });
    return;
  }

  const inc = incRes.rows[0];
  let machineId = selectedMachineId || inc.machine_id;
  let symptomText = inc.symptom_text;

  if (additionalDetails) {
    symptomText = `${symptomText}. Additional details: ${additionalDetails}`;
  }

  let machineTag: string | null = null;
  let machineName: string | null = null;

  if (machineId) {
    const mchRes = await db.query("SELECT asset_tag, name FROM machines WHERE id = $1", [machineId]);
    if (mchRes.rows.length > 0) {
      machineTag = mchRes.rows[0].asset_tag;
      machineName = mchRes.rows[0].name;
    }
  }

  const missingFields: string[] = [];
  if (!machineId) missingFields.push("machine_id");

  const newStatus = missingFields.length === 0 ? "AWAITING_REVIEW" : "AWAITING_CLARIFICATION";

  await db.query(
    `UPDATE incidents
     SET machine_id = $1,
         symptom_text = $2,
         missing_fields = $3,
         clarification_question = NULL,
         status = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5`,
    [machineId, symptomText, JSON.stringify(missingFields), newStatus, id]
  );

  // Re-evaluate evidence
  if (machineId && machineTag) {
    await db.query(
      `UPDATE incident_evidence
       SET label = 'RETRIEVED',
           raw_value = $1,
           source_reference = $2
       WHERE incident_id = $3 AND field_name = 'machine_id'`,
      [`${machineTag} - ${machineName}`, `User Disambiguation confirmed from registry: ${machineTag}`, id]
    );
  }

  await logAuditEvent({
    organizationId: user.organizationId,
    actorId: user.id,
    entityType: "INCIDENT",
    entityId: id,
    action: "CLARIFY",
    previousState: { status: inc.status, machineId: inc.machine_id },
    newState: { status: newStatus, machineId, symptomText },
    reason: "Worker submitted clarification response"
  });

  const history = user.role === "SUPERVISOR"
    ? await historyService.retrieveForMachine(machineId, inc.symptom_category)
    : [];

  res.json({
    id,
    status: newStatus,
    machineId,
    machineTag,
    machineName,
    symptomText,
    missingFields,
    groundedHistory: history
  });
}

export async function getReportById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = req.user!;

  const incRes = await db.query(
    `SELECT i.*, m.asset_tag, m.name as machine_name, m.type as machine_type, m.location as machine_location,
            u.name as reporter_name, u.email as reporter_email, s.name as site_name
     FROM incidents i
     LEFT JOIN machines m ON i.machine_id = m.id AND (m.is_active IS NULL OR m.is_active = TRUE)
     JOIN users u ON i.reporter_id = u.id
     JOIN sites s ON i.site_id = s.id
     WHERE i.id = $1 AND i.organization_id = $2`,
    [id, user.organizationId]
  );

  if (incRes.rows.length === 0) {
    res.status(404).json({ error: "NOT_FOUND", message: "Incident report not found" });
    return;
  }

  const inc = incRes.rows[0];

  // For technicians: they may only view a report if they submitted it, OR if they
  // are the assigned technician on the linked work order.
  if (user.role === "REPORTER_TECHNICIAN") {
    const isReporter = inc.reporter_id === user.id;

    // Check if a work order exists for this incident and this technician is assigned
    const assignedWoRes = await db.query(
      "SELECT id FROM work_orders WHERE incident_id = $1 AND assigned_technician_id = $2",
      [id, user.id]
    );
    const isAssignedTechnician = assignedWoRes.rows.length > 0;

    if (!isReporter && !isAssignedTechnician) {
      res.status(403).json({
        error: "CASE_ACCESS_DENIED",
        message: "You do not have access to this report. Access is granted to the reporter and the assigned technician only."
      });
      return;
    }

    // History is only visible to the assigned technician, not to any unrelated reporter
    const evidence = await evidenceService.getEvidenceForIncident(id);
    const history = isAssignedTechnician
      ? await historyService.retrieveForMachine(inc.machine_id, inc.symptom_category)
      : [];

    res.json({
      ...inc,
      missing_fields: inc.missing_fields ? JSON.parse(inc.missing_fields) : [],
      evidence,
      groundedHistory: history
    });
    return;
  }

  // Supervisors: full access including history
  const evidence = await evidenceService.getEvidenceForIncident(id);
  const history = await historyService.retrieveForMachine(inc.machine_id, inc.symptom_category);

  res.json({
    ...inc,
    missing_fields: inc.missing_fields ? JSON.parse(inc.missing_fields) : [],
    evidence,
    groundedHistory: history
  });
}

export async function getReports(req: Request, res: Response): Promise<void> {
  const user = req.user!;
  const { status } = req.query;

  let queryStr = `
    SELECT i.*, m.asset_tag, m.name as machine_name, m.type as machine_type,
           u.name as reporter_name
    FROM incidents i
    LEFT JOIN machines m ON i.machine_id = m.id
    JOIN users u ON i.reporter_id = u.id
    WHERE i.organization_id = $1
  `;
  const params: any[] = [user.organizationId];

  // Technicians/Workers see only reports they submitted.
  // Supervisors see all reports in the organization.
  if (user.role === "REPORTER_TECHNICIAN") {
    queryStr += ` AND i.reporter_id = $${params.length + 1}`;
    params.push(user.id);
  }

  if (status) {
    params.push(status);
    queryStr += ` AND i.status = $${params.length}`;
  }

  queryStr += " ORDER BY i.created_at DESC LIMIT 50";

  const resReports = await db.query(queryStr, params);
  res.json({
    reports: resReports.rows.map(r => ({
      ...r,
      missing_fields: r.missing_fields ? JSON.parse(r.missing_fields) : []
    }))
  });
}

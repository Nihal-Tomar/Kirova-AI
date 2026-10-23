import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { runMigrations } from "../db/migrate";

export async function seedDatabase(): Promise<void> {
  console.log("🌱 [SEED] Starting database migration and seeding...");
  await runMigrations();

  // Temporarily bypass trigger for clean seed reset of audit_logs
  await db.executeScript("DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON audit_logs;");
  await db.query("DELETE FROM audit_logs");
  await db.query("DELETE FROM work_order_status_history");
  await db.query("DELETE FROM work_orders");
  await db.query("DELETE FROM incident_evidence");
  await db.query("DELETE FROM incidents");
  await db.query("DELETE FROM components");
  await db.query("DELETE FROM machines");
  await db.query("DELETE FROM users");
  await db.query("DELETE FROM sites");
  await db.query("DELETE FROM organizations");

  await db.executeScript(`
    CREATE TRIGGER trg_audit_logs_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering();
  `);

  console.log("Cleared existing records.");

  // 1. Organization
  const orgId = "org-1";
  await db.query(
    "INSERT INTO organizations (id, name) VALUES ($1, $2)",
    [orgId, "Apex Manufacturing Ltd"]
  );

  // 2. Sites
  const site1 = "site-pune-01";
  const site2 = "site-chennai-01";
  await db.query(
    "INSERT INTO sites (id, organization_id, name, location) VALUES ($1, $2, $3, $4), ($5, $6, $7, $8)",
    [
      site1, orgId, "Pune Plant 1 - Main Fab", "Chakan Industrial Area, Pune",
      site2, orgId, "Chennai Assembly Hub", "Sriperumbudur, Chennai"
    ]
  );

  // 3. Users (Hash passwords securely)
  const passwordSup = await bcrypt.hash("Supervisor@123", 10);
  const passwordTech = await bcrypt.hash("Tech@123", 10);
  const passwordWorker = await bcrypt.hash("Worker@123", 10);

  const supId = "user-sup-01";
  const tech1Id = "user-tech-01";
  const tech2Id = "user-tech-02";
  const workerId = "user-worker-01";

  await db.query(
    `INSERT INTO users (id, organization_id, name, email, password_hash, role) VALUES 
     ($1, $2, $3, $4, $5, $6),
     ($7, $8, $9, $10, $11, $12),
     ($13, $14, $15, $16, $17, $18),
     ($19, $20, $21, $22, $23, $24)`,
    [
      supId, orgId, "Priya Sharma (Supervisor)", "supervisor@kaaryasetu.ai", passwordSup, "SUPERVISOR",
      tech1Id, orgId, "Rajesh Kumar (Technician)", "tech.rajesh@kaaryasetu.ai", passwordTech, "REPORTER_TECHNICIAN",
      tech2Id, orgId, "Vikram Singh (Technician)", "tech.vikram@kaaryasetu.ai", passwordTech, "REPORTER_TECHNICIAN",
      workerId, orgId, "Amit Verma (Line Operator)", "worker.amit@kaaryasetu.ai", passwordWorker, "REPORTER_TECHNICIAN"
    ]
  );

  // 4. Seed Machines (12 core machines + deliberate ambiguity candidates)
  const machines = [
    { id: "mch-001", tag: "MCH-001", name: "Main Conveyor Belt 1", type: "CONVEYOR", loc: "Shop Floor Bay A", model: "CB-500X", serial: "SN-CB-001" },
    { id: "mch-002", tag: "MCH-002", name: "CNC Milling Center 1", type: "CNC_MILLING", loc: "Machine Bay 1", model: "VF-2SS", serial: "SN-CNC-002" },
    { id: "mch-003", tag: "MCH-003", name: "Precision Lathe 1", type: "LATHE", loc: "Toolroom", model: "TL-1640", serial: "SN-LT-003" },
    { id: "mch-004", tag: "MCH-004", name: "Main Conveyor Belt 4", type: "CONVEYOR", loc: "Shop Floor Bay B", model: "CB-500X", serial: "SN-CB-004" },
    { id: "mch-005", tag: "MCH-005", name: "50-Ton Hydraulic Press", type: "HYDRAULIC_PRESS", loc: "Stamping Area", model: "HP-50T", serial: "SN-HP-005" },
    { id: "mch-006", tag: "MCH-006", name: "Screw Compressor Alpha", type: "COMPRESSOR", loc: "Utility Room", model: "SC-100", serial: "SN-SC-006" },
    { id: "mch-007", tag: "MCH-007", name: "Heavy Duty Lathe 2", type: "LATHE", loc: "Bay C", model: "TL-2060", serial: "SN-LT-007" },
    { id: "mch-008", tag: "MCH-008", name: "Secondary Hydraulic Press", type: "HYDRAULIC_PRESS", loc: "Stamping Area", model: "HP-30T", serial: "SN-HP-008" },
    { id: "mch-009", tag: "MCH-009", name: "High Speed Stamping Press", type: "HYDRAULIC_PRESS", loc: "Bay D", model: "HP-100T", serial: "SN-HP-009" },
    { id: "mch-010", tag: "MCH-010", name: "CNC Vertical Milling 2", type: "CNC_MILLING", loc: "Machine Bay 2", model: "VF-3SS", serial: "SN-CNC-010" },
    { id: "mch-011", tag: "MCH-011", name: "CNC 5-Axis Milling", type: "CNC_MILLING", loc: "Machine Bay 3", model: "UMC-750", serial: "SN-CNC-011" },
    { id: "mch-012", tag: "MCH-012", name: "High-Pressure Air Compressor 2", type: "COMPRESSOR", loc: "Utility Room", model: "SC-150HP", serial: "SN-SC-012" },
    { id: "mch-014", tag: "MCH-014", name: "Heavy Lathe Machine 4", type: "LATHE", loc: "Bay D", model: "TL-2480", serial: "SN-LT-014" }
  ];

  for (const m of machines) {
    await db.query(
      `INSERT INTO machines (id, site_id, asset_tag, name, type, model_number, serial_number, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [m.id, site1, m.tag, m.name, m.type, m.model, m.serial, m.loc]
    );
  }

  // 5. Seed Components
  const components = [
    { id: "cmp-001", machineId: "mch-001", name: "Drive Pulley", partNumber: "PT-DP-101" },
    { id: "cmp-002", machineId: "mch-001", name: "Electric Motor 5kW", partNumber: "PT-EM-5KW" },
    { id: "cmp-003", machineId: "mch-002", name: "Coolant Pump", partNumber: "PT-CP-202" },
    { id: "cmp-004", machineId: "mch-002", name: "Spindle Drive Assembly", partNumber: "PT-SD-303" },
    { id: "cmp-005", machineId: "mch-003", name: "Chuck 3-Jaw Assembly", partNumber: "PT-CK-404" },
    { id: "cmp-006", machineId: "mch-004", name: "Belt Tensioner Roller", partNumber: "PT-TR-505" },
    { id: "cmp-007", machineId: "mch-005", name: "Hydraulic Cylinder Seal", partNumber: "PT-HC-606" },
    { id: "cmp-008", machineId: "mch-006", name: "Air Oil Separator Filter", partNumber: "PT-FL-707" },
    { id: "cmp-009", machineId: "mch-007", name: "Lead Screw Bearing", partNumber: "PT-LS-808" },
    { id: "cmp-010", machineId: "mch-008", name: "Pressure Relief Valve", partNumber: "PT-RV-909" }
  ];

  for (const c of components) {
    await db.query(
      "INSERT INTO components (id, machine_id, name, part_number) VALUES ($1, $2, $3, $4)",
      [c.id, c.machineId, c.name, c.partNumber]
    );
  }

  // 6. Seed 10 Verified Historical Closed Incidents & Work Orders
  const verifiedIncidents = [
    {
      incId: "hist-inc-01",
      woId: "hist-wo-01",
      repNum: "INC-2026-0001",
      woNum: "WO-2026-0001",
      mchId: "mch-001",
      cmpId: "cmp-001",
      symptom: "Conveyor belt slipping under load with squealing friction noise",
      cat: "ABNORMAL_NOISE",
      priority: "HIGH",
      findings: "Drive pulley bearing was loose and surface had severe rubber glaze.",
      resolution: "Replaced drive pulley bearing (PT-DP-101), aligned belt track, and retensioned drive motor.",
      notes: "Verified normal operation for 2 hours under full 400kg conveyor load."
    },
    {
      incId: "hist-inc-02",
      woId: "hist-wo-02",
      repNum: "INC-2026-0002",
      woNum: "WO-2026-0002",
      mchId: "mch-004",
      cmpId: "cmp-006",
      symptom: "Belt intermittent stoppage during morning shift",
      cat: "MECHANICAL_JAM",
      priority: "MEDIUM",
      findings: "Tensioner roller bearing worn out; belt lost tension and triggered sensor interlock.",
      resolution: "Installed replacement tensioner roller (PT-TR-505) and calibrated proximity sensor.",
      notes: "Verified smooth continuous running without stoppage."
    },
    {
      incId: "hist-inc-03",
      woId: "hist-wo-03",
      repNum: "INC-2026-0003",
      woNum: "WO-2026-0003",
      mchId: "mch-002",
      cmpId: "cmp-003",
      symptom: "Coolant fluid leakage pooling under CNC base table",
      cat: "FLUID_LEAKAGE",
      priority: "MEDIUM",
      findings: "Coolant pump output hose clamp cracked and gasket degraded.",
      resolution: "Replaced pump gasket seal and fitted stainless steel hose clamps.",
      notes: "Pressure tested coolant manifold at 3.5 bar with zero leaks."
    },
    {
      incId: "hist-inc-04",
      woId: "hist-wo-04",
      repNum: "INC-2026-0004",
      woNum: "WO-2026-0004",
      mchId: "mch-003",
      cmpId: "cmp-005",
      symptom: "Lathe chuck jam; spindle stalled when feeding workpiece",
      cat: "MECHANICAL_JAM",
      priority: "HIGH",
      findings: "Metal chips jammed in scroll gear mechanism due to damaged chip wiper.",
      resolution: "Disassembled 3-jaw chuck, cleaned scroll gear, and fitted new wiper felt.",
      notes: "Spindle runout checked within 0.005mm tolerance."
    },
    {
      incId: "hist-inc-05",
      woId: "hist-wo-05",
      repNum: "INC-2026-0005",
      woNum: "WO-2026-0005",
      mchId: "mch-005",
      cmpId: "cmp-007",
      symptom: "Hydraulic press cylinder slow descent and pressure drop below 30 bar",
      cat: "FLUID_LEAKAGE",
      priority: "CRITICAL",
      findings: "Hydraulic ram piston rod seal degraded causing internal fluid bypass.",
      resolution: "Replaced hydraulic cylinder seal kit (PT-HC-606) and topped up ISO VG 46 hydraulic oil.",
      notes: "Holding pressure verified at 50 tons for 15 minutes without creep."
    },
    {
      incId: "hist-inc-06",
      woId: "hist-wo-06",
      repNum: "INC-2026-0006",
      woNum: "WO-2026-0006",
      mchId: "mch-006",
      cmpId: "cmp-008",
      symptom: "Compressor automatic high-temperature trip above 95 degrees C",
      cat: "OVERHEATING",
      priority: "HIGH",
      findings: "Air-oil separator filter completely choked with oily dust deposit.",
      resolution: "Replaced air-oil separator filter (PT-FL-707) and blown out cooler fins with dry air.",
      notes: "Steady state operating temperature stabilized at 78 degrees C."
    },
    {
      incId: "hist-inc-07",
      woId: "hist-wo-07",
      repNum: "INC-2026-0007",
      woNum: "WO-2026-0007",
      mchId: "mch-007",
      cmpId: "cmp-009",
      symptom: "Heavy lathe spindle vibration during facing operation",
      cat: "VIBRATION",
      priority: "MEDIUM",
      findings: "Lead screw support bearing play exceeded 0.08mm.",
      resolution: "Replaced lead screw bearing (PT-LS-808) and adjusted preload locknut.",
      notes: "Vibration velocity measured under 1.8 mm/s RMS (ISO Class 1 compliant)."
    },
    {
      incId: "hist-inc-08",
      woId: "hist-wo-08",
      repNum: "INC-2026-0008",
      woNum: "WO-2026-0008",
      mchId: "mch-008",
      cmpId: "cmp-010",
      symptom: "Broken pressure gauge seal leaking hydraulic fluid",
      cat: "FLUID_LEAKAGE",
      priority: "LOW",
      findings: "Vibration caused pressure gauge fitting to back off and pinch the copper seal washer.",
      resolution: "Installed new Dowty bonded seal washer (PT-RV-909) and torqued to 35 Nm.",
      notes: "Visual inspection verified leak-free after 50 continuous pressing cycles."
    },
    {
      incId: "hist-inc-09",
      woId: "hist-wo-09",
      repNum: "INC-2026-0009",
      woNum: "WO-2026-0009",
      mchId: "mch-010",
      cmpId: "cmp-004",
      symptom: "Y-axis guide mechanical jam with servo overload alarm",
      cat: "MECHANICAL_JAM",
      priority: "HIGH",
      findings: "Central lubrication line to Y-axis ball screw was clogged by dried grease.",
      resolution: "Flushed grease metering valves, re-primed EP2 grease, and cleaned guideway wipers.",
      notes: "Axis homing and full traverse cycle executed with smooth current draw."
    },
    {
      incId: "hist-inc-10",
      woId: "hist-wo-10",
      repNum: "INC-2026-0010",
      woNum: "WO-2026-0010",
      mchId: "mch-012",
      cmpId: "cmp-008",
      symptom: "Discharge operating pressure drop below 4 bar",
      cat: "PERFORMANCE_DROP",
      priority: "MEDIUM",
      findings: "Minimum pressure valve disc was sticking in half-open position.",
      resolution: "Overhauled minimum pressure valve, polished piston, and renewed Viton O-rings.",
      notes: "Air delivery verified at 12.5 m3/min at 7.5 bar rated pressure."
    }
  ];

  for (const h of verifiedIncidents) {
    // Insert incident in CONVERTED_TO_WORK_ORDER
    await db.query(
      `INSERT INTO incidents (
        id, report_number, organization_id, reporter_id, site_id, machine_id,
        input_channel, symptom_text, symptom_category, recurrence_claimed,
        urgency_suggestion, urgency_rationale, missing_fields, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [
        h.incId, h.repNum, orgId, workerId, site1, h.mchId,
        "TEXT", h.symptom, h.cat, false,
        h.priority, "Automated prioritization based on symptom severity", "[]",
        "CONVERTED_TO_WORK_ORDER"
      ]
    );

    // Insert incident evidence
    await db.query(
      `INSERT INTO incident_evidence (id, incident_id, field_name, label, raw_value, source_reference)
       VALUES 
       ($1, $2, 'symptom_text', 'REPORTED', $3, 'Worker input report'),
       ($4, $5, 'machine_id', 'RETRIEVED', $6, 'DB asset registry lookup'),
       ($7, $8, 'urgency_suggestion', 'SUGGESTED', $9, 'Deterministic priority rule')`,
      [
        `ev-${h.incId}-1`, h.incId, h.symptom,
        `ev-${h.incId}-2`, h.incId, h.mchId,
        `ev-${h.incId}-3`, h.incId, h.priority
      ]
    );

    // Insert work order in VERIFIED_CLOSED
    await db.query(
      `INSERT INTO work_orders (
        id, work_order_number, incident_id, machine_id, priority, status,
        approved_by_id, approved_at, assigned_technician_id, assigned_at,
        technician_findings, resolution_summary, component_id,
        verified_by_id, verified_at, supervisor_closure_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '3 days', $8, NOW() - INTERVAL '2 days', $9, $10, $11, $12, NOW() - INTERVAL '1 day', $13)`,
      [
        h.woId, h.woNum, h.incId, h.mchId, h.priority, "VERIFIED_CLOSED",
        supId, tech1Id, h.findings, h.resolution, h.cmpId, supId, h.notes
      ]
    );

    // Insert status history rows
    const historyRows = [
      { id: `wosh-${h.woId}-1`, from: 'AWAITING_APPROVAL', to: 'APPROVED', user: supId, notes: 'Supervisor approved work order' },
      { id: `wosh-${h.woId}-2`, from: 'APPROVED', to: 'ASSIGNED', user: supId, notes: 'Assigned to Rajesh Kumar' },
      { id: `wosh-${h.woId}-3`, from: 'ASSIGNED', to: 'IN_PROGRESS', user: tech1Id, notes: 'Technician began troubleshooting' },
      { id: `wosh-${h.woId}-4`, from: 'IN_PROGRESS', to: 'RESOLVED', user: tech1Id, notes: 'Repair completed, resolution submitted' },
      { id: `wosh-${h.woId}-5`, from: 'RESOLVED', to: 'VERIFIED_CLOSED', user: supId, notes: h.notes }
    ];

    for (const row of historyRows) {
      await db.query(
        `INSERT INTO work_order_status_history (id, work_order_id, from_status, to_status, changed_by_id, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [row.id, h.woId, row.from, row.to, row.user, row.notes]
      );
    }

    // Insert initial audit trail events
    await db.query(
      `INSERT INTO audit_logs (id, organization_id, actor_id, entity_type, entity_id, action, previous_state, new_state, reason)
       VALUES 
       ($1, $2, $3, 'WORK_ORDER', $4, 'VERIFY_CLOSE', '{"status":"RESOLVED"}', '{"status":"VERIFIED_CLOSED"}', $5)`,
      [
        `aud-${h.woId}-close`, orgId, supId, h.woId, h.notes
      ]
    );
  }

  console.log("✅ [SEED] Seeded 1 Organization, 2 Sites, 4 Users, 13 Machines, 10 Components, 10 Verified Historical Work Orders, and Audit Records.");
}

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Database seeded successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Database seed failed:", err);
      process.exit(1);
    });
}

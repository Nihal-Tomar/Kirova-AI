import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";
import { db } from "../src/db";

describe("Machine Selection & Supervisor Telemetry Consistency Test Suite", () => {
  let app: any;
  let supervisorToken: string;
  let workerToken: string;

  beforeAll(async () => {
    app = createApp();
    await ensureDbSeeded();

    const supLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });
    expect(supLogin.status).toBe(200);
    supervisorToken = supLogin.body.token;

    const workerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });
    expect(workerLogin.status).toBe(200);
    workerToken = workerLogin.body.token;
  }, 40000);

  it("Flow 1: Worker selects MCH-005 -> Persisted in DB, reflected in Supervisor Section A telemetry", async () => {
    // 1. Worker reports fault selecting MCH-005
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        text: "Machine hydraulic cylinder slow descend ho raha hai aur neeche seal se oil pool ho raha hai.",
        machineId: "mch-005"
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.machineId).toBe("mch-005");
    expect(reportRes.body.machineName).toContain("Hydraulic Press");
    expect(reportRes.body.assetTag).toBe("MCH-005");

    const incidentId = reportRes.body.id;

    // 2. Supervisor retrieves incident details (Section A data)
    const detailRes = await request(app)
      .get(`/api/reports/${incidentId}`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.machine_id).toBe("mch-005");
    expect(detailRes.body.machine_name).toContain("Hydraulic Press");
    expect(detailRes.body.asset_tag).toBe("MCH-005");
    expect(detailRes.body.machine_location).toBe("Stamping Area");

    // 3. Supervisor Triage Advisor runs on the incident
    const advisorRes = await request(app)
      .get(`/api/incidents/${incidentId}/triage-advisor`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(advisorRes.status).toBe(200);
    // Should NOT be flagged as missing machine!
    expect(advisorRes.body.recommendedAction).not.toBe("REQUEST_MORE_INFORMATION");
    expect(advisorRes.body.recommendedAction).toBe("ASSIGN_TECHNICIAN");

    // 4. Calling extractReport preserves machine_id
    const extractRes = await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${workerToken}`);

    expect(extractRes.status).toBe(200);
    expect(extractRes.body.extracted.resolvedMachineId).toBe("mch-005");
    expect(extractRes.body.extracted.resolvedMachineTag).toBe("MCH-005");
  });

  it("Flow 2: Submitting invalid machine ID returns 400 INVALID_MACHINE", async () => {
    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        text: "Vibration in nonexistent machine",
        machineId: "mch-nonexistent-999"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("INVALID_MACHINE");
  });

  it("Flow 3 (Case 2): Machine with no registered asset tag is accepted and allows technician assignment", async () => {
    // Insert a machine without asset_tag
    await db.query(
      `INSERT INTO machines (id, site_id, asset_tag, name, type, location)
       VALUES ('mch-case2', 'site-pune-01', NULL, 'Custom Stamping Rig', 'HYDRAULIC_PRESS', 'Bay F - Prototype')
       ON CONFLICT (id) DO NOTHING`
    );

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        text: "Hydraulic leak on prototype stamping fixture.",
        machineId: "mch-case2"
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.machineId).toBe("mch-case2");
    expect(reportRes.body.assetTag).toBeNull();
    const incId = reportRes.body.id;

    // AI advisor does not flag missing machine
    const advisorRes = await request(app)
      .get(`/api/incidents/${incId}/triage-advisor`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(advisorRes.status).toBe(200);
    expect(advisorRes.body.recommendedAction).toBe("ASSIGN_TECHNICIAN");

    // Supervisor assigns technician successfully
    const assignRes = await request(app)
      .post(`/api/incidents/${incId}/triage-decision`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ASSIGN_TECHNICIAN",
        technicianId: "user-tech-01",
        assignmentNotes: "Assigned for hydraulic repair on custom rig"
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.decision).toBe("ASSIGN_TECHNICIAN");
  });

  it("Flow 4 (Case 3): No machine selected -> Flags missing machine and prevents technician assignment", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        text: "Kuch machine me se sound aa raha hai bahut tez."
      });

    expect(reportRes.status).toBe(201);
    expect(reportRes.body.machineId).toBeNull();
    const incId = reportRes.body.id;

    // AI advisor flags missing machine
    const advisorRes = await request(app)
      .get(`/api/incidents/${incId}/triage-advisor`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(advisorRes.status).toBe(200);
    expect(advisorRes.body.recommendedAction).toBe("REQUEST_MORE_INFORMATION");

    // Attempting to assign technician returns 400 UNRESOLVED_MACHINE
    const assignRes = await request(app)
      .post(`/api/incidents/${incId}/triage-decision`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ASSIGN_TECHNICIAN",
        technicianId: "user-tech-01"
      });

    expect(assignRes.status).toBe(400);
    expect(assignRes.body.error).toBe("UNRESOLVED_MACHINE");
  });

  it("Flow 5 (Case 4): Incident with deleted/unavailable machine record prevents technician assignment", async () => {
    // Insert a machine, create report, and then deactivate/archive machine record
    await db.query(
      `INSERT INTO machines (id, site_id, asset_tag, name, type, location, is_active)
       VALUES ('mch-decomm', 'site-pune-01', 'MCH-DECOMM', 'Decommissioned Press', 'HYDRAULIC_PRESS', 'Storage Bay', TRUE)
       ON CONFLICT (id) DO UPDATE SET is_active = TRUE`
    );

    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        text: "Issue on decommissioned asset.",
        machineId: "mch-decomm"
      });

    expect(reportRes.status).toBe(201);
    const incId = reportRes.body.id;

    // Simulate machine deletion / decommissioning from active plant registry
    await db.query("UPDATE machines SET is_active = FALSE WHERE id = 'mch-decomm'");

    // Get report by ID: machine_id is preserved, but active machine record is unavailable (null)
    const getRes = await request(app)
      .get(`/api/reports/${incId}`)
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.machine_id).toBe("mch-decomm");
    expect(getRes.body.machine_name).toBeNull();

    // Assignment must be blocked
    const assignRes = await request(app)
      .post(`/api/incidents/${incId}/triage-decision`)
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ASSIGN_TECHNICIAN",
        technicianId: "user-tech-01"
      });

    expect(assignRes.status).toBe(400);
    expect(assignRes.body.error).toBe("UNRESOLVED_MACHINE");
  });
});

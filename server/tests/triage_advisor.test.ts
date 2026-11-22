import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

describe("AI Triage Advisor & Intelligent Technician Assignment Test Suite", () => {
  let app: any;
  let supervisorToken: string;
  let technicianToken: string;
  let workerToken: string;

  beforeAll(async () => {
    app = createApp();
    await ensureDbSeeded();

    // Authenticate supervisor
    const supLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });
    expect(supLogin.status).toBe(200);
    supervisorToken = supLogin.body.token;

    // Authenticate technician Rajesh
    const techLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech.rajesh@kirova.ai", password: "Tech@123" });
    expect(techLogin.status).toBe(200);
    technicianToken = techLogin.body.token;

    // Authenticate worker Amit
    const workerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });
    expect(workerLogin.status).toBe(200);
    workerToken = workerLogin.body.token;
  }, 40000);

  // ── Test Case 1: INC-2026-1799 Missing Machine Regression Check ────────
  it("Regression Test: INC-2026-1799 detects missing machine/asset tag and recommends REQUEST_MORE_INFORMATION", async () => {
    const res = await request(app)
      .get("/api/incidents/live-inc-1799/triage-advisor")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.incidentId).toBe("live-inc-1799");
    expect(res.body.recommendedAction).toBe("REQUEST_MORE_INFORMATION");
    expect(res.body.confidence).toBe("LOW");
    expect(res.body.missingInformation.length).toBeGreaterThan(0);
    expect(res.body.missingInformation[0]).toContain("Specific Machine Asset Tag");
    expect(res.body.summaryExplanation).toContain("machine 4");
    expect(res.body.safetyPrecautions.length).toBeGreaterThan(0);
  });

  // ── Test Case 2: Prevention of assigning unverified machine ─────────
  it("Prevents technician assignment on incident with missing machine", async () => {
    const res = await request(app)
      .post("/api/incidents/live-inc-1799/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ASSIGN_TECHNICIAN",
        technicianId: "user-tech-01",
        assignmentNotes: "Attempting assignment without verified machine"
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("UNRESOLVED_MACHINE");
  });

  // ── Test Case 3: Request More Information workflow on INC-2026-1799 ────
  it("Supervisor can submit REQUEST_INFORMATION decision on INC-2026-1799", async () => {
    const res = await request(app)
      .post("/api/incidents/live-inc-1799/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "REQUEST_INFORMATION",
        informationRequestNotes: "Please verify if this is Conveyor 4 in Bay B or Heavy Lathe 4 in Bay D."
      });

    expect(res.status).toBe(200);
    expect(res.body.decision).toBe("REQUEST_INFORMATION");
    expect(res.body.incidentStatus).toBe("AWAITING_CLARIFICATION");
    expect(res.body.clarificationQuestion).toContain("Conveyor 4");

    // Verify incident updated in DB
    const incRes = await request(app)
      .get("/api/reports/live-inc-1799")
      .set("Authorization", `Bearer ${supervisorToken}`);
    expect(incRes.body.status).toBe("AWAITING_CLARIFICATION");
  });

  // ── Test Case 4: Low-Risk Supervisor Self-Resolution (INC-2026-1801) ──
  it("INC-2026-1801 recommends SUPERVISOR_CAN_HANDLE and allows internal resolution", async () => {
    const advisorRes = await request(app)
      .get("/api/incidents/live-inc-1801/triage-advisor")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(advisorRes.status).toBe(200);
    expect(advisorRes.body.recommendedAction).toBe("SUPERVISOR_CAN_HANDLE");
    expect(advisorRes.body.complexity).toBe("LOW");
    expect(advisorRes.body.safetyRisk).toBe("NONE");

    // Execute internal resolution
    const resolveRes = await request(app)
      .post("/api/incidents/live-inc-1801/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "HANDLE_INTERNALLY",
        internalResolutionNotes: "Tightened M6 thumbscrew on dust guard and inspected hinge latch. Fully secured."
      });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.decision).toBe("HANDLE_INTERNALLY");
    expect(resolveRes.body.incidentStatus).toBe("HANDLED_INTERNALLY");

    // Verify recorded decision endpoint
    const decRes = await request(app)
      .get("/api/incidents/live-inc-1801/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`);
    expect(decRes.body.decision.decision).toBe("HANDLE_INTERNALLY");
  });

  // ── Test Case 5: Complex Fault Recommends ASSIGN_TECHNICIAN ───────────
  it("INC-2026-0009 recommends ASSIGN_TECHNICIAN and ranks Vikram as top Hydraulic specialist", async () => {
    const advisorRes = await request(app)
      .get("/api/incidents/live-inc-01/triage-advisor")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(advisorRes.status).toBe(200);
    expect(advisorRes.body.recommendedAction).toBe("ASSIGN_TECHNICIAN");

    // Match technician candidates
    const matchRes = await request(app)
      .get("/api/incidents/live-inc-01/technician-candidates")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(matchRes.status).toBe(200);
    expect(matchRes.body.candidates.length).toBeGreaterThan(0);

    // Vikram Singh specializes in Hydraulics & High Pressure Systems
    const topCandidate = matchRes.body.candidates[0];
    expect(topCandidate.name).toContain("Vikram");
    expect(topCandidate.specialization).toContain("Hydraulics");
    expect(topCandidate.isTopRecommendation).toBe(true);
  });

  // ── Test Case 6: Assign Technician creates work order & logs audit trail
  it("Supervisor can assign matched technician to create work order and notify", async () => {
    const assignRes = await request(app)
      .post("/api/incidents/live-inc-01/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ASSIGN_TECHNICIAN",
        technicianId: "user-tech-02",
        assignmentNotes: "Inspect hydraulic cylinder seal kit and check pressure manifold."
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.decision).toBe("ASSIGN_TECHNICIAN");
    expect(assignRes.body.assignedTechnicianName).toContain("Vikram");
    expect(assignRes.body.incidentStatus).toBe("CONVERTED_TO_WORK_ORDER");

    const woId = assignRes.body.workOrderId;
    expect(woId).toBeDefined();

    // Verify assigned technician can view the work order
    const techWoRes = await request(app)
      .get(`/api/work-orders/${woId}`)
      .set("Authorization", `Bearer ${technicianToken}`);
    // Rajesh is tech1, Vikram is tech2. Rajesh should NOT see Vikram's work order!
    expect(techWoRes.status).toBe(403);

    // Supervisor can view it
    const supWoRes = await request(app)
      .get(`/api/work-orders/${woId}`)
      .set("Authorization", `Bearer ${supervisorToken}`);
    expect(supWoRes.status).toBe(200);
    expect(supWoRes.body.status).toBe("ASSIGNED");
    expect(supWoRes.body.assigned_technician_id).toBe("user-tech-02");
  });

  // ── Test Case 7: Spindle Vibration ranks Rajesh Kumar as #1 ──────────
  it("INC-2026-0010 (Vibration) ranks Rajesh Kumar as top mechanical/vibration specialist", async () => {
    const matchRes = await request(app)
      .get("/api/incidents/live-inc-02/technician-candidates")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(matchRes.status).toBe(200);
    const topCandidate = matchRes.body.candidates[0];
    expect(topCandidate.name).toContain("Rajesh");
    expect(topCandidate.specialization).toContain("Mechanical");
    expect(topCandidate.matchingSkills).toContain("Vibration Analysis");
  });

  // ── Test Case 8: Critical Safety Escalation Action ────────────────────
  it("Supervisor can escalate a critical safety incident", async () => {
    const escRes = await request(app)
      .post("/api/incidents/live-inc-02/triage-decision")
      .set("Authorization", `Bearer ${supervisorToken}`)
      .send({
        decision: "ESCALATE",
        escalationReason: "Spindle bearing high-frequency vibration indicates impending seizure. Factory floor safety shutdown initiated."
      });

    expect(escRes.status).toBe(200);
    expect(escRes.body.decision).toBe("ESCALATE");
    expect(escRes.body.incidentStatus).toBe("ESCALATED");
  });

  // ── Test Case 9: RBAC Enforcement ────────────────────────────────────
  it("Technicians and workers cannot submit triage decisions", async () => {
    const unauthRes = await request(app)
      .post("/api/incidents/live-inc-02/triage-decision")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({
        decision: "HANDLE_INTERNALLY",
        internalResolutionNotes: "Worker trying to self-resolve"
      });

    expect(unauthRes.status).toBe(403);
  });
});

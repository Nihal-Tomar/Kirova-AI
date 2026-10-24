import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("Workflow Lifecycle & State Machine Test Suite", () => {
  let supToken: string;
  let techToken: string;
  let incidentId: string;
  let workOrderId: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const supLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });
    supToken = supLogin.body.token;

    const techLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech.rajesh@kirova.ai", password: "Tech@123" });
    techToken = techLogin.body.token;

    // Create an incident with unambiguous machine (MCH-001)
    const incRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "MCH-001 conveyor belt motor abnormal friction noise" });
    incidentId = incRes.body.id;

    // Run extraction
    await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${techToken}`);
  });

  it("2.1 should create a work order in AWAITING_APPROVAL status", async () => {
    const res = await request(app)
      .post("/api/work-orders")
      .set("Authorization", `Bearer ${supToken}`)
      .send({ incidentId, priority: "HIGH" });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe("AWAITING_APPROVAL");
    expect(res.body.priority).toBe("HIGH");
    workOrderId = res.body.id;
  });

  it("2.2 should strictly ENFORCE approval-before-assignment invariant (HTTP 400)", async () => {
    // Attempting to assign technician while work order is still in AWAITING_APPROVAL
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ technicianId: "user-tech-01" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("CANNOT_ASSIGN_UNAPPROVED_WORK_ORDER");
  });

  it("2.3 should allow supervisor to approve work order -> transitions to APPROVED", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/approve`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ priority: "CRITICAL" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("APPROVED");
    expect(res.body.priority).toBe("CRITICAL");
    expect(res.body.approvedBy).toBeDefined();
  });

  it("2.4 should allow supervisor to assign technician once APPROVED -> transitions to ASSIGNED", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ technicianId: "user-tech-01" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ASSIGNED");
    expect(res.body.assignedTechnicianId).toBe("user-tech-01");
  });

  it("2.5 should allow assigned technician to start work -> transitions to IN_PROGRESS", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/status`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ status: "IN_PROGRESS" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("IN_PROGRESS");
  });

  it("2.6 should reject resolution without resolution summary (HTTP 400)", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/status`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ status: "RESOLVED", findings: "Looked at pulley" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("RESOLUTION_SUMMARY_REQUIRED");
  });

  it("2.7 should allow technician to submit resolution -> transitions to RESOLVED", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/status`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({
        status: "RESOLVED",
        findings: "Drive pulley rubber glaze caused belt slippage",
        resolutionSummary: "Replaced drive pulley bearing and retensioned motor",
        componentId: "cmp-001"
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("RESOLVED");
    expect(res.body.resolutionSummary).toBeDefined();
  });

  it("2.8 should forbid technician from self-verifying closure (HTTP 403)", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/verify-close`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ supervisorClosureNotes: "Closing it myself" });

    expect(res.status).toBe(403);
  });

  it("2.9 should allow supervisor to verify closure -> transitions to VERIFIED_CLOSED", async () => {
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/verify-close`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ supervisorClosureNotes: "Verified normal operation under 400kg load for 2 hours. Vibration normal." });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("VERIFIED_CLOSED");
    expect(res.body.verifiedBy).toBeDefined();
    expect(res.body.supervisorClosureNotes).toBeDefined();
  });
});

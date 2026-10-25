/**
 * Case-Level Access Control Tests
 *
 * Verifies that:
 *   1. An unassigned technician cannot read another technician's work order by ID.
 *   2. An unassigned technician cannot access machine maintenance history.
 *   3. A technician cannot access history before their work order has been assigned.
 *   4. A technician can access history once they are assigned.
 *   5. A supervisor retains full read access to all work orders and history.
 *   6. A technician's GET /api/work-orders list is scoped to their own assignments.
 *   7. A technician cannot read an incident report they did not submit and are not assigned to.
 */

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("Case-Level Access Control Test Suite", () => {
  let supToken: string;
  let tech1Token: string;   // user-tech-01 (Rajesh)
  let tech2Token: string;   // user-tech-02 (Vikram) — the unassigned technician
  let incidentId: string;
  let workOrderId: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const [supRes, t1Res, t2Res] = await Promise.all([
      request(app).post("/api/auth/login").send({ email: "supervisor@kirova.ai", password: "Supervisor@123" }),
      request(app).post("/api/auth/login").send({ email: "tech.rajesh@kirova.ai",  password: "Tech@123" }),
      request(app).post("/api/auth/login").send({ email: "tech.vikram@kirova.ai",  password: "Tech@123" }),
    ]);
    supToken   = supRes.body.token;
    tech1Token = t1Res.body.token;
    tech2Token = t2Res.body.token;

    // Create a complete workflow: report → extract → work order → approve → assign tech1
    const repRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${tech1Token}`)
      .send({ text: "MCH-006 compressor overheating trip above 95 degrees" });
    incidentId = repRes.body.id;

    await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${tech1Token}`);

    const woCreateRes = await request(app)
      .post("/api/work-orders")
      .set("Authorization", `Bearer ${supToken}`)
      .send({ incidentId, priority: "HIGH" });
    workOrderId = woCreateRes.body.id;

    await request(app)
      .post(`/api/work-orders/${workOrderId}/approve`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({});

    await request(app)
      .post(`/api/work-orders/${workOrderId}/assign`)
      .set("Authorization", `Bearer ${supToken}`)
      .send({ technicianId: "user-tech-01" });  // tech1 is assigned; tech2 is NOT
  });

  // ── 1. Work order read — wrong technician ─────────────────────────────────

  it("3.1 unassigned technician cannot fetch another tech's work order by ID (403)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}`)
      .set("Authorization", `Bearer ${tech2Token}`);  // tech2 is NOT assigned

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CASE_ACCESS_DENIED");
  });

  it("3.2 assigned technician CAN fetch their own work order by ID (200)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}`)
      .set("Authorization", `Bearer ${tech1Token}`);  // tech1 IS assigned

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workOrderId);
  });

  it("3.3 supervisor CAN fetch any work order by ID (200)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}`)
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(workOrderId);
  });

  // ── 2. Work orders list — scope enforcement ───────────────────────────────

  it("3.4 technician's GET /api/work-orders returns only their assigned cases", async () => {
    // tech2 has no assigned work orders — should get an empty list, not tech1's work orders
    const res = await request(app)
      .get("/api/work-orders")
      .set("Authorization", `Bearer ${tech2Token}`);

    expect(res.status).toBe(200);
    const workOrders: any[] = res.body.workOrders;
    // None of the returned work orders should be assigned to tech1 (Rajesh)
    const crossLeak = workOrders.filter((wo: any) => wo.assigned_technician_id === "user-tech-01");
    expect(crossLeak).toHaveLength(0);
  });

  it("3.5 supervisor GET /api/work-orders returns all org work orders", async () => {
    const res = await request(app)
      .get("/api/work-orders")
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.workOrders.length).toBeGreaterThan(0);
  });

  // ── 3. Machine history — pre-assignment and post-assignment ───────────────

  it("3.6 unassigned technician cannot access machine history (403)", async () => {
    // tech2 has no assigned work orders for MCH-006
    const res = await request(app)
      .get("/api/machines/mch-006/history")
      .set("Authorization", `Bearer ${tech2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CASE_ACCESS_DENIED");
  });

  it("3.7 generic machine history cannot bypass case-level access (403)", async () => {
    // A machine URL does not identify a case, so even an assigned technician
    // must use the work-order history endpoint below.
    const res = await request(app)
      .get("/api/machines/mch-006/history")
      .set("Authorization", `Bearer ${tech1Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CASE_ACCESS_DENIED");
  });

  it("3.8 supervisor CAN access machine history without an assignment (200)", async () => {
    const res = await request(app)
      .get("/api/machines/mch-006/history")
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.machine).toBeDefined();
  });

  // ── 4. Work order history endpoint ────────────────────────────────────────

  it("3.9 unassigned technician cannot access GET /api/work-orders/:id/history (403)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}/history`)
      .set("Authorization", `Bearer ${tech2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CASE_ACCESS_DENIED");
  });

  it("3.10 assigned technician CAN access GET /api/work-orders/:id/history (200)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}/history`)
      .set("Authorization", `Bearer ${tech1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.workOrderId).toBe(workOrderId);
    expect(res.body.verifiedClosedIncidents).toBeDefined();
  });

  it("3.11 supervisor CAN access GET /api/work-orders/:id/history (200)", async () => {
    const res = await request(app)
      .get(`/api/work-orders/${workOrderId}/history`)
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
  });

  // ── 5. Incident report access ─────────────────────────────────────────────

  it("3.12 technician cannot read an incident they did not submit and are not assigned to (403)", async () => {
    // Create an incident reported by the worker account, not tech2
    const workerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });
    const workerToken = workerLogin.body.token;

    const workerIncRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ text: "MCH-003 lathe chuck jam" });
    const workerIncidentId = workerIncRes.body.id;

    // tech2 (Vikram) is not the reporter and has no assigned WO for this incident
    const res = await request(app)
      .get(`/api/reports/${workerIncidentId}`)
      .set("Authorization", `Bearer ${tech2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("CASE_ACCESS_DENIED");
  });

  it("3.13 reporter CAN read their own incident (200)", async () => {
    // tech1 reads the incident they submitted in beforeAll
    const res = await request(app)
      .get(`/api/reports/${incidentId}`)
      .set("Authorization", `Bearer ${tech1Token}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(incidentId);
  });

  it("3.14 reporter's incident history is empty until assignment (history gate)", async () => {
    // The reporter can read their own report but should NOT see machine history
    // because the work order has not been assigned to the reporter themselves.
    // (tech1 submitted the report but tech1 IS assigned — so history IS visible for tech1)
    // Create a separate reporter-only scenario with a worker who is never assigned
    const workerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });
    const workerToken = workerLogin.body.token;

    const workerIncRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ text: "MCH-001 conveyor belt noise" });
    const wIncId = workerIncRes.body.id;

    await request(app)
      .post(`/api/reports/${wIncId}/extract`)
      .set("Authorization", `Bearer ${workerToken}`);

    const res = await request(app)
      .get(`/api/reports/${wIncId}`)
      .set("Authorization", `Bearer ${workerToken}`);

    // Reporter can read their own incident
    expect(res.status).toBe(200);
    // But groundedHistory is empty — no work order assigned to this worker
    expect(res.body.groundedHistory).toHaveLength(0);
  });

  // ── 6. Status update — wrong technician ───────────────────────────────────

  it("3.15 unassigned technician cannot update status of another tech's work order (403)", async () => {
    // First start tech1's work (set to IN_PROGRESS via tech1)
    await request(app)
      .post(`/api/work-orders/${workOrderId}/status`)
      .set("Authorization", `Bearer ${tech1Token}`)
      .send({ status: "IN_PROGRESS" });

    // tech2 tries to submit a resolution on tech1's work order
    const res = await request(app)
      .post(`/api/work-orders/${workOrderId}/status`)
      .set("Authorization", `Bearer ${tech2Token}`)
      .send({ status: "RESOLVED", resolutionSummary: "Fixed by vikram" });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FORBIDDEN");
  });
});

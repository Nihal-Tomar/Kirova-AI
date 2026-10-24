import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("RBAC & Security Authorization Test Suite", () => {
  let supToken: string;
  let techToken: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    // Login as Supervisor
    const supLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });
    supToken = supLogin.body.token;

    // Login as Technician
    const techLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech.rajesh@kirova.ai", password: "Tech@123" });
    techToken = techLogin.body.token;
  });

  it("1.1 should allow technician to login and view assigned work orders", async () => {
    const res = await request(app)
      .get("/api/work-orders/assigned")
      .set("Authorization", `Bearer ${techToken}`);
    expect(res.status).toBe(200);
    expect(res.body.workOrders).toBeDefined();
  });

  it("1.2 should strictly FORBID technician from approving work orders (HTTP 403)", async () => {
    const res = await request(app)
      .post("/api/work-orders/wo-fake-123/approve")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ priority: "HIGH" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FORBIDDEN");
  });

  it("1.3 should strictly FORBID technician from assigning work orders (HTTP 403)", async () => {
    const res = await request(app)
      .post("/api/work-orders/wo-fake-123/assign")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ technicianId: "user-tech-01" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FORBIDDEN");
  });

  it("1.4 should strictly FORBID technician from verifying closure (HTTP 403)", async () => {
    const res = await request(app)
      .post("/api/work-orders/wo-fake-123/verify-close")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ supervisorClosureNotes: "Approved by tech" });
    expect(res.status).toBe(403);
    expect(res.body.error).toBe("FORBIDDEN");
  });

  it("1.5 should reject unauthenticated requests to protected endpoints (HTTP 401)", async () => {
    const res = await request(app).get("/api/dashboard");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("UNAUTHORIZED");
  });

  it("1.6 should forbid technician from viewing supervisor dashboard (HTTP 403)", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${techToken}`);
    expect(res.status).toBe(403);
  });

  it("1.7 should allow supervisor to access dashboard (HTTP 200)", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${supToken}`);
    expect(res.status).toBe(200);
    expect(res.body.metrics).toBeDefined();
  });
});

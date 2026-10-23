import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("Audit Trail Immutability & Defense-in-Depth Test Suite", () => {
  let supToken: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const supLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kaaryasetu.ai", password: "Supervisor@123" });
    supToken = supLogin.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  it("4.1 should allow supervisor to query audit logs", async () => {
    const res = await request(app)
      .get("/api/audit-logs")
      .set("Authorization", `Bearer ${supToken}`);

    expect(res.status).toBe(200);
    expect(res.body.auditLogs).toBeDefined();
    expect(res.body.auditLogs.length).toBeGreaterThan(0);

    const first = res.body.auditLogs[0];
    expect(first.actor_id).toBeDefined();
    expect(first.action).toBeDefined();
    expect(first.timestamp).toBeDefined();
  });

  it("4.2 should ensure no DELETE route exists for audit logs (HTTP 404)", async () => {
    const res = await request(app)
      .delete("/api/audit-logs/aud-fake-123")
      .set("Authorization", `Bearer ${supToken}`);

    expect([404, 405]).toContain(res.status);
  });

  it("4.3 should trigger PostgreSQL defense exception on direct UPDATE on audit_logs", async () => {
    let errorCaught = false;
    try {
      await db.query("UPDATE audit_logs SET action = 'MODIFIED'");
    } catch (err: any) {
      errorCaught = true;
      expect(err.message).toContain("append-only");
    }
    expect(errorCaught).toBe(true);
  });

  it("4.4 should trigger PostgreSQL defense exception on direct DELETE on audit_logs", async () => {
    let errorCaught = false;
    try {
      await db.query("DELETE FROM audit_logs");
    } catch (err: any) {
      errorCaught = true;
      expect(err.message).toContain("append-only");
    }
    expect(errorCaught).toBe(true);
  });
});

import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db/index";
import { seedDatabase } from "../src/scripts/seed";

describe("Demo Credentials & Alias Login Verification", () => {
  let app: any;

  beforeAll(async () => {
    await db.init();
    await seedDatabase();
    app = createApp();
  });

  it("allows Supervisor (Priya) to login with formal email and formal password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "Supervisor@123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("SUPERVISOR");
    expect(res.body.user.name).toContain("Priya");
  });

  it("allows Supervisor (Priya) to login with friendly alias 'priya@kirova.ai'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "priya@kirova.ai", password: "Supervisor@123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("SUPERVISOR");
  });

  it("allows Supervisor (Priya) to login with fallback demo password 'demo123'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "supervisor@kirova.ai", password: "demo123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("SUPERVISOR");
  });

  it("allows Technician (Rajesh) to login with formal email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech.rajesh@kirova.ai", password: "Tech@123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REPORTER_TECHNICIAN");
    expect(res.body.user.name).toContain("Rajesh");
  });

  it("allows Technician (Rajesh) to login with friendly alias 'rajesh@kirova.ai'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "rajesh@kirova.ai", password: "Tech@123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REPORTER_TECHNICIAN");
  });

  it("allows Technician (Rajesh) to login with fallback demo password 'demo123'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "rajesh@kirova.ai", password: "demo123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REPORTER_TECHNICIAN");
  });

  it("allows Worker (Amit) to login with formal email and password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REPORTER_TECHNICIAN");
    expect(res.body.user.name).toContain("Amit");
  });

  it("allows Worker (Amit) to login with friendly alias 'amit@kirova.ai' or 'worker@kirova.ai'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "amit@kirova.ai", password: "demo123" });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe("REPORTER_TECHNICIAN");
  });
});

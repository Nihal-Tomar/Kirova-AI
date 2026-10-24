import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";

const app = createApp();

describe("Ambiguity Resolution & Anti-Hallucination Test Suite", () => {
  let supToken: string;
  let techToken: string;

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
  });

  it("3.1 should detect ambiguity for 'Machine 4' and return candidates without auto-picking", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "Machine 4 ka belt ajeeb noise kar raha hai aur ruk gaya hai." });

    const incidentId = reportRes.body.id;

    const extractRes = await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${techToken}`);

    expect(extractRes.status).toBe(200);
    expect(extractRes.body.status).toBe("AWAITING_CLARIFICATION");
    expect(extractRes.body.disambiguation.isAmbiguous).toBe(true);
    expect(extractRes.body.disambiguation.candidates.length).toBe(2);

    const tags = extractRes.body.disambiguation.candidates.map((c: any) => c.assetTag);
    expect(tags).toContain("MCH-004");
    expect(tags).toContain("MCH-014");

    // Zero-hallucination assertion: machineId must be null
    expect(extractRes.body.extracted.resolvedMachineId).toBeNull();
  });

  it("3.2 should block work order creation while machine reference is unresolved (HTTP 400)", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "Machine 4 ka belt ajeeb noise kar raha hai aur ruk gaya hai." });

    const incidentId = reportRes.body.id;
    await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${techToken}`);

    const woRes = await request(app)
      .post("/api/work-orders")
      .set("Authorization", `Bearer ${supToken}`)
      .send({ incidentId, priority: "HIGH" });

    expect(woRes.status).toBe(400);
    expect(woRes.body.error).toBe("UNRESOLVED_MACHINE");
  });

  it("3.3 should resolve ambiguity when user selects candidate MCH-004", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "Machine 4 ka belt ajeeb noise kar raha hai aur ruk gaya hai." });

    const incidentId = reportRes.body.id;
    const extractRes = await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${techToken}`);

    const candidateMch4 = extractRes.body.disambiguation.candidates.find((c: any) => c.assetTag === "MCH-004");

    const clarifyRes = await request(app)
      .post(`/api/reports/${incidentId}/clarify`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ selectedMachineId: candidateMch4.id });

    expect(clarifyRes.status).toBe(200);
    expect(clarifyRes.body.status).toBe("AWAITING_REVIEW");
    expect(clarifyRes.body.machineTag).toBe("MCH-004");
    expect(clarifyRes.body.machineName).toContain("Conveyor");
  });

  it("3.4 should handle unknown asset 'Machine 99' without inventing an asset ID", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "Machine 99 ka pressure drop ho gaya hai poora." });

    const incidentId = reportRes.body.id;
    const extractRes = await request(app)
      .post(`/api/reports/${incidentId}/extract`)
      .set("Authorization", `Bearer ${techToken}`);

    expect(extractRes.status).toBe(200);
    expect(extractRes.body.status).toBe("AWAITING_CLARIFICATION");
    expect(extractRes.body.disambiguation.isAmbiguous).toBe(false);
    expect(extractRes.body.disambiguation.candidates.length).toBe(0);
    expect(extractRes.body.extracted.resolvedMachineId).toBeNull();
    expect(extractRes.body.disambiguation.missingFields).toContain("machine_id");
  });
});

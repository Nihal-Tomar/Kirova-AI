import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";
import { extractionService } from "../src/services/extraction";

const app = createApp();

describe("Malformed AI & Transcript Preservation Test Suite", () => {
  let techToken: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const techLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "tech.rajesh@kirova.ai", password: "Tech@123" });
    techToken = techLogin.body.token;
  });

  it("5.1 should preserve original transcript when user edits corrected transcript", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "MCH-001 conveyor belt moter nois" });

    const incidentId = reportRes.body.id;

    // Simulate STT transcribe
    await request(app)
      .post(`/api/reports/${incidentId}/transcribe`)
      .set("Authorization", `Bearer ${techToken}`);

    // Human edits transcript to fix phonetic typo
    const editRes = await request(app)
      .patch(`/api/reports/${incidentId}/transcript`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ correctedTranscript: "MCH-001 conveyor belt motor abnormal noise" });

    expect(editRes.status).toBe(200);
    expect(editRes.body.correctedTranscript).toBe("MCH-001 conveyor belt motor abnormal noise");

    // Fetch report and verify dual preservation
    const getRes = await request(app)
      .get(`/api/reports/${incidentId}`)
      .set("Authorization", `Bearer ${techToken}`);

    expect(getRes.body.original_transcript).toBe("MCH-001 conveyor belt moter nois");
    expect(getRes.body.corrected_transcript).toBe("MCH-001 conveyor belt motor abnormal noise");
    expect(getRes.body.transcript_edited_by_id).toBeDefined();
  });

  it("5.2 should handle empty text gracefully without crashing (HTTP 400)", async () => {
    const reportRes = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${techToken}`)
      .send({ text: "   " });

    const incidentId = reportRes.body.id;

    const editRes = await request(app)
      .patch(`/api/reports/${incidentId}/transcript`)
      .set("Authorization", `Bearer ${techToken}`)
      .send({ correctedTranscript: "   " });

    expect(editRes.status).toBe(400);
    expect(editRes.body.error).toBe("INVALID_INPUT");
  });

  it("5.3 should gracefully handle short/incomplete symptoms without throwing uncaught exceptions", async () => {
    const extracted = extractionService.deterministicExtract("MCH-005 chal nahi raha.");
    expect(extracted.machine_reference).toBe("MCH-005");
    expect(extracted.symptom_category).toBeDefined();
    expect(extracted.suggested_urgency).toBeDefined();
  });
});

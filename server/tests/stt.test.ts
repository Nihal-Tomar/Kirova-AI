import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import fs from "fs";
import path from "path";
import { createApp } from "../src/app";
import { ensureDbSeeded } from "./setup";
import { transcribeAudio } from "../src/services/stt";

const app = createApp();

describe("Sarvam AI Speech-to-Text Test Suite", () => {
  let workerToken: string;
  let testAudioPath: string;

  beforeAll(async () => {
    await ensureDbSeeded();

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "worker.amit@kirova.ai", password: "Worker@123" });
    workerToken = loginRes.body.token;

    // Create a temporary dummy wav file
    testAudioPath = path.resolve(__dirname, "test-sample.wav");
    const buffer = Buffer.alloc(44);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(16000, 24);
    buffer.writeUInt32LE(32000, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(0, 40);
    fs.writeFileSync(testAudioPath, buffer);
  });

  it("fails when no authentication token is provided to /api/stt/transcribe", async () => {
    const res = await request(app)
      .post("/api/stt/transcribe")
      .attach("audio", testAudioPath);

    expect(res.status).toBe(401);
  });

  it("fails when audio file is missing in multipart request", async () => {
    const res = await request(app)
      .post("/api/stt/transcribe")
      .set("Authorization", `Bearer ${workerToken}`)
      .send({ language: "Hinglish" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("MISSING_AUDIO");
  });

  it("successfully transcribes audio via POST /api/stt/transcribe with Sarvam Saaras v4 support", async () => {
    const res = await request(app)
      .post("/api/stt/transcribe")
      .set("Authorization", `Bearer ${workerToken}`)
      .attach("audio", testAudioPath)
      .field("language", "Hinglish");

    expect(res.status).toBe(200);
    expect(res.body.transcript).toBeDefined();
    expect(res.body.languageCode).toBeDefined();
    expect(typeof res.body.confidence).toBe("number");
  });

  it("transcribes directly via service layer with language mode support", async () => {
    const result = await transcribeAudio(testAudioPath, "Hinglish");
    expect(result.transcript).toBeDefined();
    expect(result.languageCode).toBe("hi-IN");
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  afterAll(() => {
    if (fs.existsSync(testAudioPath)) {
      try { fs.unlinkSync(testAudioPath); } catch {}
    }
  });
});

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

    // Create a temporary valid 16kHz mono WAV file
    testAudioPath = path.resolve(__dirname, "test-sample.wav");
    const sampleRate = 16000;
    const numSamples = sampleRate * 1;
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);
    buffer.write("RIFF", 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write("WAVE", 8);
    buffer.write("fmt ", 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write("data", 36);
    buffer.writeUInt32LE(dataSize, 40);
    for (let i = 0; i < numSamples; i++) {
      buffer.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 8000), 44 + i * 2);
    }
    fs.writeFileSync(testAudioPath, buffer);
  }, 40000);

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
    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      if (typeof url === "string" && url.includes("sarvam.ai")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            transcript: "Machine 4 conveyor belt noise",
            language_code: "hi-IN",
            request_id: "req-test-sarvam-01"
          })
        } as any;
      }
      return originalFetch(url, opts);
    };

    try {
      const res = await request(app)
        .post("/api/stt/transcribe")
        .set("Authorization", `Bearer ${workerToken}`)
        .attach("audio", testAudioPath)
        .field("language", "Hinglish");

      expect(res.status).toBe(200);
      expect(res.body.transcript).toBeDefined();
      expect(res.body.languageCode).toBeDefined();
      expect(res.body.provider).toBe("sarvam-saaras-v4");
    } finally {
      global.fetch = originalFetch;
    }
  });

  it("transcribes directly via service layer with language mode support", async () => {
    const originalFetch = global.fetch;
    global.fetch = async (url: any, opts: any) => {
      if (typeof url === "string" && url.includes("sarvam.ai")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            transcript: "Machine 4 conveyor belt noise",
            language_code: "hi-IN",
            request_id: "req-test-sarvam-02"
          })
        } as any;
      }
      return originalFetch(url, opts);
    };

    try {
      const result = await transcribeAudio(testAudioPath, "Hinglish");
      expect(result.transcript).toBeDefined();
      expect(result.languageCode).toBe("hi-IN");
      expect(result.provider).toBe("sarvam-saaras-v4");
    } finally {
      global.fetch = originalFetch;
    }
  });

  afterAll(() => {
    if (fs.existsSync(testAudioPath)) {
      try { fs.unlinkSync(testAudioPath); } catch {}
    }
  });
});

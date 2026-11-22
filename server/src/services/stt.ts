import fs from "fs";
import path from "path";
import { config } from "../config/env";

export interface TranscribeResult {
  transcript: string;
  languageCode: string;
  confidence?: number;
  isMock: boolean;
  provider: string;
  requestId?: string;
}

/**
 * Maps incoming language names/codes to Sarvam AI Saaras v4 parameters
 */
export function resolveLanguageAndMode(inputLang?: string): { languageCode: string; mode: string } {
  const norm = (inputLang || "").toLowerCase().trim();
  if (norm.includes("hinglish") || norm.includes("codemix") || norm.includes("latn")) {
    return { languageCode: "hi-IN", mode: "codemix" };
  }
  if (norm.includes("en") || norm.includes("english")) {
    return { languageCode: "en-IN", mode: "transcribe" };
  }
  if (norm.includes("ta") || norm.includes("tamil")) {
    return { languageCode: "ta-IN", mode: "transcribe" };
  }
  if (norm.includes("te") || norm.includes("telugu")) {
    return { languageCode: "te-IN", mode: "transcribe" };
  }
  // Default to Hindi
  return { languageCode: "hi-IN", mode: "transcribe" };
}

/**
 * Gets appropriate MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".wav":
      return "audio/wav";
    case ".mp3":
      return "audio/mp3";
    case ".webm":
      return "audio/webm";
    case ".ogg":
      return "audio/ogg";
    case ".flac":
      return "audio/flac";
    case ".m4a":
    case ".mp4":
      return "audio/mp4";
    default:
      return "audio/wav";
  }
}

/**
 * Transcribes audio file using the official Sarvam AI Saaras v4 API.
 * Throws on API failure — does NOT generate fake or simulated transcript text.
 */
export async function transcribeAudio(
  audioFilePath: string,
  reportedLanguage: string = "Hinglish"
): Promise<TranscribeResult> {
  // 1. Validate file existence
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found at: ${audioFilePath}`);
  }

  // 2. Validate file size (max 25MB)
  const stats = fs.statSync(audioFilePath);
  if (stats.size === 0) {
    throw new Error("Audio file is empty (0 bytes).");
  }
  if (stats.size > 25 * 1024 * 1024) {
    throw new Error("Audio file exceeds maximum allowed size of 25MB.");
  }

  // 3. Verify Sarvam API key is configured
  if (!config.sarvamApiKey) {
    throw new Error("SARVAM_API_KEY is not configured in backend environment variables.");
  }

  const { languageCode, mode } = resolveLanguageAndMode(reportedLanguage);

  const fileBuffer = fs.readFileSync(audioFilePath);
  const mimeType = getMimeType(audioFilePath);
  const ext = path.extname(audioFilePath) || ".wav";
  const blob = new Blob([fileBuffer], { type: mimeType });

  const formData = new FormData();
  formData.append("file", blob, `audio-recording${ext}`);
  formData.append("model", "saaras:v4");
  formData.append("mode", mode);
  if (languageCode) {
    formData.append("language_code", languageCode);
  }

  const response = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: {
      "api-subscription-key": config.sarvamApiKey
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [STT] Sarvam AI API returned HTTP ${response.status}: ${errorText}`);
    let parsedMessage = errorText;
    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.error?.message || errJson.message || errorText;
    } catch {}
    throw new Error(`Sarvam STT failed (HTTP ${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();

  return {
    transcript: data.transcript ?? "",
    languageCode: data.language_code || languageCode || "hi-IN",
    confidence: typeof data.confidence === "number" ? data.confidence : undefined,
    isMock: false,
    provider: "sarvam-saaras-v4",
    requestId: data.request_id
  };
}

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

export class SarvamSTTError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public requestId?: string;
  public userMessage: string;

  constructor(status: number, rawMessage: string, errorCode?: string, requestId?: string) {
    let userMsg = rawMessage;
    if (status === 401 || status === 403) {
      userMsg = "Authentication failed: The SARVAM_API_KEY is invalid, expired, or unauthorized in the backend environment. Please verify your active Sarvam API key.";
    } else if (status === 402) {
      userMsg = "Account error: Insufficient API credits on your Sarvam AI account. Please check your credit balance at dashboard.sarvam.ai.";
    } else if (status === 429) {
      userMsg = "Rate limit exceeded: Too many requests sent to the Sarvam API. Please wait a moment and try again.";
    } else if (status === 400) {
      userMsg = `Bad request: ${rawMessage || "Invalid audio format, duration, or request parameters."}`;
    } else if (status >= 500) {
      userMsg = "Service unavailable: Upstream Sarvam AI service encountered an internal error. Please try again.";
    }

    super(`Sarvam STT failed (HTTP ${status}): ${userMsg}`);
    this.name = "SarvamSTTError";
    this.statusCode = status;
    this.errorCode = errorCode;
    this.requestId = requestId;
    this.userMessage = userMsg;
  }
}

/**
 * Retrieves and sanitizes SARVAM_API_KEY from runtime environment or .env files on disk.
 * Strips accidental whitespace, wrapping quotes ("..."), and newlines.
 */
export function getActiveSarvamApiKey(): string {
  // 1. Direct process.env or loaded config
  let key = process.env.SARVAM_API_KEY || config.sarvamApiKey || "";

  // 2. If empty, check .env files on disk (allows hot configuration without restarting node)
  if (!key.trim()) {
    const rootEnvPath = path.resolve(__dirname, "../../../.env");
    const serverEnvPath = path.resolve(__dirname, "../../.env");
    for (const envPath of [serverEnvPath, rootEnvPath]) {
      if (fs.existsSync(envPath)) {
        try {
          const content = fs.readFileSync(envPath, "utf-8");
          const match = content.match(/^SARVAM_API_KEY\s*=\s*(.+)$/m);
          if (match && match[1]) {
            key = match[1].trim();
            break;
          }
        } catch {}
      }
    }
  }

  // 3. Clean quotes, spaces, newlines
  return key.trim().replace(/^["']|["']$/g, "").replace(/[\r\n]/g, "");
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
 * Transcribes audio file using official Sarvam AI Saaras v4 API.
 * Throws SarvamSTTError on failure — NEVER generates fake or deterministic transcripts.
 */
export async function transcribeAudio(
  audioFilePath: string,
  reportedLanguage: string = "Hinglish"
): Promise<TranscribeResult> {
  // 1. Validate file existence
  if (!fs.existsSync(audioFilePath)) {
    throw new SarvamSTTError(400, `Audio file not found on server at: ${audioFilePath}`, "FILE_NOT_FOUND");
  }

  // 2. Validate file size (must be non-empty, max 25MB)
  const stats = fs.statSync(audioFilePath);
  if (stats.size === 0) {
    throw new SarvamSTTError(400, "Recorded audio file is empty (0 bytes). Please record again.", "EMPTY_AUDIO");
  }
  if (stats.size > 25 * 1024 * 1024) {
    throw new SarvamSTTError(400, "Audio file exceeds maximum allowed size of 25MB.", "FILE_TOO_LARGE");
  }

  // 3. Retrieve and validate active API key
  const apiKey = getActiveSarvamApiKey();
  if (!apiKey) {
    throw new SarvamSTTError(
      401,
      "SARVAM_API_KEY environment variable is not configured in backend settings.",
      "MISSING_API_KEY"
    );
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

  let response: Response;
  try {
    response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey
      },
      body: formData
    });
  } catch (netErr: any) {
    console.error("❌ [STT] Sarvam AI network connection failure:", netErr);
    throw new SarvamSTTError(
      503,
      `Cannot connect to Sarvam AI gateway (${netErr.message || "Network timeout"}). Check internet connectivity.`,
      "NETWORK_ERROR"
    );
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [STT] Sarvam AI API returned HTTP ${response.status}: ${errorText}`);
    let parsedMessage = errorText;
    let errorCode: string | undefined;
    let requestId: string | undefined;

    try {
      const errJson = JSON.parse(errorText);
      parsedMessage = errJson.error?.message || errJson.message || errorText;
      errorCode = errJson.error?.code || errJson.code;
      requestId = errJson.error?.request_id || errJson.request_id;
    } catch {}

    throw new SarvamSTTError(response.status, parsedMessage, errorCode, requestId);
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

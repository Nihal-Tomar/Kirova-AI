import fs from "fs";
import path from "path";
import { config } from "../config/env";

export interface TranscribeResult {
  transcript: string;
  languageCode: string;
  confidence: number;
  isMock: boolean;
  provider?: string;
  apiError?: string;
}

/**
 * Maps incoming language names/codes to Sarvam AI Saaras v4 parameters
 */
function resolveLanguageAndMode(inputLang?: string): { languageCode: string; mode: string } {
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
 * Transcribes audio file using Sarvam AI Saaras v4 model.
 * Falls back deterministically if API key is absent, unauthorized, or offline.
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

  const { languageCode, mode } = resolveLanguageAndMode(reportedLanguage);

  // 3. If Sarvam API key is configured, call official Sarvam AI STT API (Saaras v4)
  if (config.sarvamApiKey) {
    try {
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
        console.warn(`⚠️ [STT] Sarvam AI API returned HTTP ${response.status}: ${errorText}`);
        return {
          transcript: "Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai.",
          languageCode: languageCode || "hi-IN",
          confidence: 0.92,
          isMock: true,
          provider: "sarvam-saaras-v4-fallback",
          apiError: `Sarvam API error (${response.status}): ${errorText.slice(0, 150)}`
        };
      }

      const data = await response.json();
      return {
        transcript: data.transcript || "",
        languageCode: (data.language_code || languageCode) as string,
        confidence: 0.96,
        isMock: false,
        provider: "sarvam-saaras-v4"
      };
    } catch (err: any) {
      console.warn(`⚠️ [STT] Sarvam AI network error: ${err.message}. Engaging resilient fallback.`);
      return {
        transcript: "Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai.",
        languageCode: languageCode || "hi-IN",
        confidence: 0.90,
        isMock: true,
        provider: "sarvam-saaras-v4-fallback",
        apiError: err.message
      };
    }
  }

  // 4. Resilient Local Mock Transcriber for offline demonstration / development without key
  return {
    transcript: "Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai.",
    languageCode: languageCode || "hi-IN",
    confidence: 0.92,
    isMock: true,
    provider: "local-mock"
  };
}

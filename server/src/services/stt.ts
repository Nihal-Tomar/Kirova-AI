import fs from "fs";
import { config } from "../config/env";

export interface TranscribeResult {
  transcript: string;
  languageCode: "hi-IN" | "en-IN" | "hi-Latn";
  confidence: number;
  isMock: boolean;
}

export async function transcribeAudio(audioFilePath: string, reportedLanguage: string = "hi-IN"): Promise<TranscribeResult> {
  // Check if file exists
  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found at: ${audioFilePath}`);
  }

  // If real Sarvam API key is available, call Sarvam AI STT API
  if (config.sarvamApiKey) {
    try {
      const formData = new FormData();
      const fileBuffer = fs.readFileSync(audioFilePath);
      const blob = new Blob([fileBuffer], { type: "audio/wav" });
      formData.append("file", blob, "recording.wav");
      formData.append("model", "saarika:v2");
      formData.append("language_code", reportedLanguage || "hi-IN");

      const response = await fetch("https://api.sarvam.ai/speech-to-text", {
        method: "POST",
        headers: {
          "api-subscription-key": config.sarvamApiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sarvam STT API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      return {
        transcript: data.transcript || "",
        languageCode: (data.language_code || reportedLanguage) as any,
        confidence: 0.94,
        isMock: false
      };
    } catch (err: any) {
      console.warn(`⚠️ [STT] Sarvam AI API call failed: ${err.message}. Falling back to resilient mock transcriber.`);
    }
  }

  // Resilient Local Mock Transcriber for offline demonstration / development
  // Default Hindi/Hinglish audio demo fixture
  const demoTranscript = "Machine 4 ka belt ajeeb noise kar raha hai aur kabhi-kabhi chalte waqt ruk jaata hai.";

  return {
    transcript: demoTranscript,
    languageCode: "hi-IN",
    confidence: 0.92,
    isMock: true
  };
}

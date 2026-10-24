import dotenv from "dotenv";
import path from "path";

// Load .env from workspace root or server directory
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config();

export interface AppConfig {
  port: number;
  nodeEnv: string;
  jwtSecret: string;
  databaseUrl?: string;
  sarvamApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  googleClientId?: string;
  isMockStt: boolean;
  isMockLlm: boolean;
}

function validateAndLoadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const port = parseInt(process.env.PORT || "5000", 10);
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (nodeEnv === "production" && !databaseUrl) {
    throw new Error("FATAL: DATABASE_URL is required in production. Configure Render PostgreSQL before starting the server.");
  }

  if (nodeEnv === "production" && databaseUrl && !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
    throw new Error("FATAL: DATABASE_URL must be a PostgreSQL connection string in production.");
  }

  if (nodeEnv === "production" && !process.env.ALLOWED_ORIGINS?.trim()) {
    throw new Error("FATAL: ALLOWED_ORIGINS is required in production. Set it to the Vercel frontend origin.");
  }

  // JWT Secret validation: Fail-fast if missing or insecure
  let jwtSecret = process.env.JWT_SECRET;
  const insecurePlaceholders = [
    "hackfront-secret-key-2026",
    "secret",
    "changeme",
    "change-me",
    "password",
    "12345678"
  ];

  if (!jwtSecret) {
    if (nodeEnv === "production") {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is missing in production. Generate a 256-bit secret with: openssl rand -base64 32"
      );
    }
    // Safe auto-generated development secret for local reproducibility
    jwtSecret = "kirova_dev_secret_key_generated_minimum_32_chars_ok!";
    console.warn("⚠️  [SECURITY WARNING] JWT_SECRET not set. Using secure development fallback. Set JWT_SECRET in .env for production.");
  } else if (jwtSecret.length < 32 || insecurePlaceholders.includes(jwtSecret.toLowerCase())) {
    if (nodeEnv === "production") {
      throw new Error(
        "FATAL: JWT_SECRET is too short or uses an insecure placeholder. Must be at least 32 characters."
      );
    }
    console.warn("⚠️  [SECURITY WARNING] JWT_SECRET is short or matches a known placeholder.");
  }

  const sarvamApiKey = process.env.SARVAM_API_KEY?.trim();
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();

  if (!googleClientId) {
    console.warn("⚠️  [AUTH] GOOGLE_CLIENT_ID not set. Google Sign-In will be disabled.");
  } else {
    console.info("✅ [AUTH] Google Sign-In configured.");
  }

  const isMockStt = !sarvamApiKey;
  const isMockLlm = !openaiApiKey && !geminiApiKey;

  if (isMockStt) {
    console.info("ℹ️  [STT SERVICE] SARVAM_API_KEY not provided. Running in explicit local development mock mode.");
  } else {
    console.info("✅ [STT SERVICE] Sarvam AI STT configured.");
  }

  if (isMockLlm) {
    console.info("ℹ️  [LLM SERVICE] OPENAI_API_KEY / GEMINI_API_KEY not provided. Running in deterministic structured extraction mode.");
  } else {
    console.info("✅ [LLM SERVICE] External LLM provider configured.");
  }

  return {
    port,
    nodeEnv,
    jwtSecret,
    databaseUrl,
    sarvamApiKey,
    openaiApiKey,
    geminiApiKey,
    googleClientId,
    isMockStt,
    isMockLlm
  };
}

export const config = validateAndLoadConfig();

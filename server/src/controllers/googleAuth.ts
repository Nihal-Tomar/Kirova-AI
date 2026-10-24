import { Request, Response } from "express";
import https from "https";
import { createPublicKey, createVerify } from "crypto";
import { config } from "../config/env";
import { db } from "../db/index";
import { signToken } from "../middleware/auth";

// ── Google ID Token Payload (relevant fields) ─────────────────────────────────
interface GooglePayload {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  exp: number;
  iat: number;
}

// ── Minimal Google ID token verifier (no external deps) ─────────────────────
// Google ID tokens are RS256 JWTs. We verify them by:
//  1. Decoding the header to get the key ID (kid).
//  2. Fetching Google's JSON Web Key Set (JWKS) from the well-known URL.
//  3. Finding the matching public key and verifying the RS256 signature.
//  4. Validating standard claims (iss, aud, exp).

function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON from ${url}`));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Decode the three Base64url-encoded parts of a JWT without verifying.
 * Returns { header, payload, signature, signingInput }.
 */
function decodeJwt(token: string): {
  header: { alg: string; kid: string };
  payload: GooglePayload;
  signingInput: string;
  signatureBuffer: Buffer;
} {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format.");

  const header = JSON.parse(
    Buffer.from(parts[0], "base64url").toString("utf-8")
  );
  const payload = JSON.parse(
    Buffer.from(parts[1], "base64url").toString("utf-8")
  );
  const signatureBuffer = Buffer.from(parts[2], "base64url");
  const signingInput = `${parts[0]}.${parts[1]}`;

  return { header, payload, signingInput, signatureBuffer };
}

/**
 * Convert a JWK (n, e) to a Node.js KeyObject for RS256 verification.
 */
function jwkToPem(jwk: { n: string; e: string; kty: string }): string {
  // Node ≥ 15 supports importing JWK directly via createPublicKey
  const keyObject = createPublicKey({ key: jwk as any, format: "jwk" });
  return keyObject.export({ type: "spki", format: "pem" }) as string;
}

// Simple JWKS cache — keyed by kid, expires after 1 hour
const jwksCache: Record<string, { pem: string; expiresAt: number }> = {};
const JWKS_URL =
  "https://www.googleapis.com/oauth2/v3/certs";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function getPublicKeyPem(kid: string): Promise<string> {
  const cached = jwksCache[kid];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.pem;
  }

  const jwks = await fetchJson(JWKS_URL);
  const key = (jwks.keys as any[]).find((k) => k.kid === kid);
  if (!key) {
    throw new Error(
      `Google public key not found for kid: ${kid}. The token may be stale.`
    );
  }

  const pem = jwkToPem(key);
  jwksCache[kid] = { pem, expiresAt: Date.now() + CACHE_TTL_MS };
  return pem;
}

/**
 * Verify a Google ID token and return the payload.
 * Throws if verification fails for any reason.
 */
async function verifyGoogleIdToken(
  idToken: string,
  expectedAudience: string
): Promise<GooglePayload> {
  const { header, payload, signingInput, signatureBuffer } =
    decodeJwt(idToken);

  // 1. Algorithm must be RS256
  if (header.alg !== "RS256") {
    throw new Error(`Unexpected JWT algorithm: ${header.alg}`);
  }

  // 2. Fetch the correct public key
  const pem = await getPublicKeyPem(header.kid);

  // 3. Verify RS256 signature
  const verifier = createVerify("SHA256");
  verifier.update(signingInput);
  const isValid = verifier.verify(pem, signatureBuffer);
  if (!isValid) {
    throw new Error("JWT signature verification failed.");
  }

  // 4. Validate standard claims
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Google ID token has expired.");
  }
  if (payload.iat > now + 300) {
    // Allow 5-minute clock skew
    throw new Error("Google ID token issued in the future.");
  }
  if (
    payload.iss !== "accounts.google.com" &&
    payload.iss !== "https://accounts.google.com"
  ) {
    throw new Error(`Unexpected issuer: ${payload.iss}`);
  }
  if (payload.aud !== expectedAudience) {
    throw new Error(
      `Token audience mismatch. Expected: ${expectedAudience}, got: ${payload.aud}`
    );
  }

  return payload;
}

// ── Route Handler ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 *
 * Body: { credential: "<Google ID token JWT>" }
 *
 * 1. Verifies the Google ID token server-side against Google's public keys.
 * 2. Finds an existing user by email OR auto-provisions a new one.
 * 3. Issues a Kirova JWT — identical shape to the password login response.
 *
 * No redirect URI or client secret is used. The GOOGLE_CLIENT_ID is used
 * only to validate the `aud` claim, confirming the token was issued for
 * this specific application.
 */
export async function googleSignIn(req: Request, res: Response): Promise<void> {
  if (!config.googleClientId) {
    res.status(503).json({
      error: "GOOGLE_AUTH_DISABLED",
      message: "Google Sign-In is not configured on this server.",
    });
    return;
  }

  const { credential } = req.body;
  if (!credential || typeof credential !== "string") {
    res.status(400).json({
      error: "MISSING_CREDENTIAL",
      message: "Google ID token is required.",
    });
    return;
  }

  // ── Step 1: Verify the Google ID token ──────────────────────────────────────
  let payload: GooglePayload;
  try {
    payload = await verifyGoogleIdToken(credential, config.googleClientId);
  } catch (err: any) {
    console.error("[GOOGLE AUTH] Token verification failed:", err.message);
    res.status(401).json({
      error: "INVALID_GOOGLE_TOKEN",
      message: "Google token verification failed. Please try signing in again.",
    });
    return;
  }

  if (!payload.email_verified) {
    res.status(403).json({
      error: "EMAIL_NOT_VERIFIED",
      message: "Your Google account email is not verified.",
    });
    return;
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const displayName =
    payload.name ||
    payload.given_name ||
    normalizedEmail.split("@")[0];

  // ── Step 2: Find or create user ──────────────────────────────────────────────
  type UserRow = {
    id: string;
    organization_id: string;
    name: string;
    email: string;
    role: "REPORTER_TECHNICIAN" | "SUPERVISOR";
  };

  let userRow: UserRow | null = null;

  const existing = await db.query<UserRow>(
    "SELECT id, organization_id, name, email, role FROM users WHERE LOWER(email) = $1",
    [normalizedEmail]
  );

  if (existing.rows.length > 0) {
    userRow = existing.rows[0];
  } else {
    // Auto-provision new Google-authenticated user as REPORTER_TECHNICIAN.
    // A Supervisor can elevate the role via the database if needed.
    const orgRes = await db.query<{ id: string }>(
      "SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1",
      []
    );

    if (orgRes.rows.length === 0) {
      res.status(503).json({
        error: "NO_ORGANIZATION",
        message:
          "No organization exists in the system. Please contact an administrator.",
      });
      return;
    }

    const orgId = orgRes.rows[0].id;
    // Derive a deterministic user ID from the Google subject (sub) claim
    const newUserId = `guser-${payload.sub.slice(-12)}`;

    await db.query(
      `INSERT INTO users (id, organization_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        newUserId,
        orgId,
        displayName,
        normalizedEmail,
        "", // No password — Google-authenticated users use Google sign-in only
        "REPORTER_TECHNICIAN",
      ]
    );

    const newUser = await db.query<UserRow>(
      "SELECT id, organization_id, name, email, role FROM users WHERE id = $1",
      [newUserId]
    );
    userRow = newUser.rows[0] ?? null;
  }

  if (!userRow) {
    res.status(500).json({
      error: "USER_PROVISION_FAILED",
      message: "Failed to retrieve or create user account.",
    });
    return;
  }

  // ── Step 3: Issue a Kirova JWT (identical shape to password login) ───────────
  const token = signToken({
    id: userRow.id,
    organizationId: userRow.organization_id,
    name: userRow.name,
    email: userRow.email,
    role: userRow.role,
  });

  res.json({
    token,
    user: {
      id: userRow.id,
      organizationId: userRow.organization_id,
      name: userRow.name,
      email: userRow.email,
      role: userRow.role,
    },
  });
}

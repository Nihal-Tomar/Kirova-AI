import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { signToken } from "../middleware/auth";
import { logAuditEvent } from "../services/audit";

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "MISSING_CREDENTIALS", message: "Email and password are required" });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Support legacy @kaaryasetu.ai addresses as an alias for @kirova.ai
  const lookupEmail = normalizedEmail.endsWith("@kaaryasetu.ai")
    ? normalizedEmail.replace("@kaaryasetu.ai", "@kirova.ai")
    : normalizedEmail;

  // Map friendly short aliases to formal seeded user accounts
  let mappedEmail = lookupEmail;
  if (mappedEmail === "priya@kirova.ai" || mappedEmail === "priya" || mappedEmail === "supervisor") {
    mappedEmail = "supervisor@kirova.ai";
  } else if (mappedEmail === "rajesh@kirova.ai" || mappedEmail === "rajesh" || mappedEmail === "tech" || mappedEmail === "technician") {
    mappedEmail = "tech.rajesh@kirova.ai";
  } else if (mappedEmail === "amit@kirova.ai" || mappedEmail === "amit" || mappedEmail === "worker@kirova.ai" || mappedEmail === "worker") {
    mappedEmail = "worker.amit@kirova.ai";
  } else if (mappedEmail === "vikram@kirova.ai" || mappedEmail === "vikram") {
    mappedEmail = "tech.vikram@kirova.ai";
  }

  const userRes = await db.query(
    `SELECT id, organization_id, name, email, password_hash, role
     FROM users
     WHERE LOWER(email) = $1 OR LOWER(email) = $2
     LIMIT 1`,
    [lookupEmail, mappedEmail]
  );

  if (userRes.rows.length === 0) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    return;
  }

  const user = userRes.rows[0];
  let isMatch = await bcrypt.compare(password, user.password_hash);

  // Demo convenience fallback: permit "demo123" / "Demo@123" across all demo accounts
  if (!isMatch) {
    const inputPwdLower = password.trim().toLowerCase();
    if (inputPwdLower === "demo123" || inputPwdLower === "demo@123") {
      isMatch = true;
    }
  }

  if (!isMatch) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    return;
  }

  const displayEmail = user.email.replace("@kaaryasetu.ai", "@kirova.ai");

  const token = signToken({
    id: user.id,
    organizationId: user.organization_id,
    name: user.name,
    email: displayEmail,
    role: user.role
  });

  res.json({
    token,
    user: {
      id: user.id,
      organizationId: user.organization_id,
      name: user.name,
      email: displayEmail,
      role: user.role
    }
  });
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Not authenticated" });
    return;
  }
  res.json({ user: req.user });
}

export async function getDemoAccounts(req: Request, res: Response): Promise<void> {
  const usersRes = await db.query("SELECT id, name, email, role FROM users ORDER BY role DESC, name ASC");
  const accounts = usersRes.rows.map(acc => ({
    ...acc,
    email: acc.email.replace("@kaaryasetu.ai", "@kirova.ai")
  }));
  res.json({ accounts });
}

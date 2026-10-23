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

  const userRes = await db.query(
    "SELECT id, organization_id, name, email, password_hash, role FROM users WHERE LOWER(email) = LOWER($1)",
    [email.trim()]
  );

  if (userRes.rows.length === 0) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    return;
  }

  const user = userRes.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password" });
    return;
  }

  const token = signToken({
    id: user.id,
    organizationId: user.organization_id,
    name: user.name,
    email: user.email,
    role: user.role
  });

  res.json({
    token,
    user: {
      id: user.id,
      organizationId: user.organization_id,
      name: user.name,
      email: user.email,
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
  res.json({ accounts: usersRes.rows });
}

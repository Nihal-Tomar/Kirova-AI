import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface AuthUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: "REPORTER_TECHNICIAN" | "SUPERVISOR";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role
    },
    config.jwtSecret,
    { expiresIn: "24h" }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, config.jwtSecret) as AuthUser;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);

  if (!user) {
    res.status(401).json({ error: "INVALID_TOKEN", message: "Invalid or expired token" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(allowedRoles: ("REPORTER_TECHNICIAN" | "SUPERVISOR")[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "UNAUTHORIZED", message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "FORBIDDEN",
        message: `Action restricted. Required role: ${allowedRoles.join(" or ")}, but current role is: ${req.user.role}`
      });
      return;
    }

    next();
  };
}

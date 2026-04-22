import jwt from "jsonwebtoken";

export type Role = "admin" | "viewer";

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  name: string;
}

function getSecret(): string {
  const secret = process.env["JWT_SECRET"] || process.env["SESSION_SECRET"];
  if (!secret) {
    throw new Error("JWT_SECRET (or SESSION_SECRET) must be set");
  }
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, getSecret()) as JwtPayload;
}

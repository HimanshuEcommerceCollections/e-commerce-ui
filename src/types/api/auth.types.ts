import type { UserRole } from "./common.types";

// ─── Requests ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  role?: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// ─── Responses ───────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;        // milliseconds, e.g. 86400000 = 24h
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string | null;
  role: UserRole;
  issuedAt: string;         // ISO-8601 UTC
}

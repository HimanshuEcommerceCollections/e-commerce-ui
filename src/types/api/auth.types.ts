import type { UserRole } from "./common.types";

// ─── Requests ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
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
  fullName: string;
  phoneNumber: string | null; // null for legacy accounts created before phone was required
  role: UserRole;
  issuedAt: string;         // ISO-8601 UTC
}

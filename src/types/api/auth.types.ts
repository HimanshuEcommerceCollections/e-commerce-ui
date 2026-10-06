import type { UserRole } from "./common.types";

// ─── Requests ────────────────────────────────────────────────────────────────

export interface RegisterRequest {
  email: string;
  /** At least 8 characters with a letter and a digit. */
  password: string;
  fullName: string;
  phoneNumber?: string;
  marketingOptIn?: boolean;
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

// ─── Account (signed in) ─────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  marketingOptIn: boolean;
  role: UserRole;
  createdAt: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  marketingOptIn?: boolean;
  /** Required when changing the email. */
  currentPassword?: string;
}

/** `auth` is a fresh token when the email changed (tokens are keyed by email). */
export interface ProfileUpdateResponse {
  profile: UserProfile;
  auth: AuthResponse | null;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

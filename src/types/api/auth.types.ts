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
  /** true (the default) keeps the session for 30 days; false for 24 hours. */
  rememberMe?: boolean;
}

/** POST /api/auth/login/verify: the code texted for 2-step verification. */
export interface LoginVerifyRequest {
  challengeId: string;
  code: string;
  rememberMe?: boolean;
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
  expiresAt?: string;       // ISO-8601 UTC
}

/** Login answer when the account has 2-step verification on: no token yet. */
export interface TwoFactorChallenge {
  twoFactorRequired: true;
  challengeId: string;
  phoneMasked: string | null;
}

export type LoginResult = AuthResponse | TwoFactorChallenge;

export const isTwoFactorChallenge = (r: LoginResult): r is TwoFactorChallenge =>
  (r as TwoFactorChallenge).twoFactorRequired === true;

// ─── Account (signed in) ─────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  marketingOptIn: boolean;
  role: UserRole;
  createdAt: string;
  /** "MM-DD" or null. */
  birthday?: string | null;
  passwordChangedAt?: string | null;
  twoFactorEnabled?: boolean;
  /** Masked, e.g. "•••-•••-4821". */
  twoFactorPhone?: string | null;
  storeCreditBalance?: number;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  email?: string;
  /** null clears it. */
  phoneNumber?: string | null;
  marketingOptIn?: boolean;
  /** "MM/DD" or "MM-DD"; null clears it. */
  birthday?: string | null;
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
  /** Default true: other sessions are revoked and a fresh token is returned. */
  signOutOtherDevices?: boolean;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

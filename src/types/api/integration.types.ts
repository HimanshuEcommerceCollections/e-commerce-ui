export interface IntegrationSecretSpec {
  name: string;
  label: string;
  required?: boolean;
  help?: string;
}

export interface IntegrationSettingSpec {
  key: string;
  label: string;
  type: "boolean" | "text" | "select";
  options?: Array<{ value: string; label: string }>;
  default?: boolean | string;
  help?: string;
}

/** A vendor type: a built-in adapter (GOOTEN) or CUSTOM. */
export interface IntegrationProvider {
  id: string;
  label: string;
  description: string;
  single: boolean;
  defaultBaseUrl?: string;
  baseUrlRequired: boolean;
  secrets: IntegrationSecretSpec[];
  freeformSecrets: boolean;
  settings: IntegrationSettingSpec[];
  features: string[];
}

export interface Integration {
  id: string;
  slug: string;
  name: string;
  provider: string;
  providerLabel: string;
  enabled: boolean;
  baseUrl: string | null;
  settings: Record<string, unknown>;
  /** Names with a masked hint ("••••••3456"); values never leave the server. */
  secrets: Array<{ name: string; hint: string }>;
  /** False when the encryption key changed: the secrets must be entered again. */
  secretsReadable: boolean;
  missingSecrets: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
}

export interface IntegrationNavItem {
  slug: string;
  name: string;
  provider: string;
  providerLabel: string;
}

export interface IntegrationInput {
  provider?: string;
  name?: string;
  enabled?: boolean;
  baseUrl?: string | null;
  settings?: Record<string, unknown>;
  /** A value sets the secret; null removes it; an absent name keeps it. */
  secrets?: Record<string, string | null>;
  notes?: string | null;
}

export interface ConnectionResult {
  ok: boolean;
  message: string;
  detail?: Record<string, unknown>;
}

// Catalog audit log (Admin › Audit log). Records are read only.

export type AuditActorType = "team" | "seller" | "system";

export type AuditCategory =
  | "stock"
  | "price"
  | "submit"
  | "edit"
  | "decision"
  | "assign"
  | "delist"
  | "status"
  | "product"
  | "import"
  | "supplier"
  | "doc"
  | "unpub"
  | "integration";

export interface AuditEvent {
  id: string;
  /** Display number, "EV-123". */
  eventId: string;
  createdAt: string;
  /** Dotted type, e.g. "product.status_changed". */
  action: string;
  category: AuditCategory | string;
  categoryLabel: string;
  actor: { id: string | null; email: string | null; name: string | null; role: string | null; type: AuditActorType };
  source: string;
  entity: { type: string; id: string | null; code: string | null; label: string | null };
  seller: { id: string; name: string | null } | null;
  summary: string;
  before: string | null;
  after: string | null;
  note: string | null;
  alert: string | null;
  details: Record<string, unknown>;
}

export interface AuditStats {
  last24h: { events: number; stockChanges: number; stockAlerts: number; reviewDecisions: number };
  sellers: { id: string; name: string }[];
  categories: { key: AuditCategory; label: string }[];
}

export interface AuditListParams {
  q?: string;
  /** Comma-separated categories. */
  category?: string;
  actorType?: AuditActorType;
  sellerId?: string;
  /** Last N days; or use from/to (ISO dates). */
  days?: number;
  from?: string;
  to?: string;
  alerts?: boolean;
  entityType?: string;
  entityId?: string;
  entityCode?: string;
  page?: number;
  size?: number;
}

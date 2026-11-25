import type { PageResponse } from "./common.types";

// ─── CRM (Admin › CRM): customers, suppliers, tickets, tasks ─────────────────

export interface CrmMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export type TicketStatus = "open" | "pending" | "solved";
export type TicketPriority = "urgent" | "high" | "normal" | "low";
export type TicketView = "mine" | "unassigned" | "overdue" | "open" | "pending" | "solved";
export type RequesterKind = "customer" | "supplier";
export type PipelineStage = "lead" | "contacted" | "interested" | "applied" | "review" | "documents" | "live" | "lost";
export type ActivityKind = "note" | "call" | "email" | "ticket" | "stage" | "task" | "order";

export interface CrmStageInfo {
  key: PipelineStage;
  label: string;
  description: string;
  /** Follows the Seller Portal on its own. */
  auto: boolean;
}

/** The words the screens use, from the API so the two never drift. */
export interface CrmMeta {
  ticketStatuses: TicketStatus[];
  ticketPriorities: TicketPriority[];
  ticketCategories: string[];
  ticketViews: TicketView[];
  replyHours: Record<TicketPriority, number>;
  stages: CrmStageInfo[];
  lostReasons: string[];
  supplierSources: string[];
  customerTags: string[];
  manualCustomerTags: string[];
  callOutcomes: string[];
  atRiskDays: number;
  stuckDays: number;
}

export interface CrmTeam {
  members: CrmMember[];
  me: string;
}

// ── Tickets ──────────────────────────────────────────────────────────────────

export interface TicketRow {
  id: string;
  /** TK-5312 */
  reference: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: string;
  source: "STAFF" | "HELP_CENTER" | "SELLER_PORTAL";
  requester: { kind: RequesterKind; id: string | null; name: string; email: string | null };
  owner: CrmMember | null;
  createdAt: string;
  lastMessageAt: string;
  slaDueAt: string;
  solvedAt: string | null;
  messageCount: number;
}

export interface TicketList extends PageResponse<TicketRow> {
  counts: Record<TicketView, number>;
}

export interface TicketMessage {
  id: string;
  kind: "requester" | "staff" | "note";
  author: { id: string | null; name: string };
  body: string;
  createdAt: string;
}

export interface TicketRequester {
  kind: RequesterKind;
  /** Profile id (customer or supplier), null for a guest. */
  id: string | null;
  code: string | null;
  name: string;
  email: string | null;
  summary: string;
  tags: string[];
  stage?: PipelineStage;
}

export interface TicketDetail extends Omit<TicketRow, "requester"> {
  requester: TicketRequester;
  messages: TicketMessage[];
  otherTickets: number;
  linked: { type: "seller_ticket" | "support_message"; reference: string; href: string } | null;
}

export interface TicketCreateInput {
  customerId?: string;
  supplierId?: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  body: string;
  /** Omitted = me, null = unassigned. */
  ownerId?: string | null;
}

// ── Customers ────────────────────────────────────────────────────────────────

export interface CustomerRow {
  id: string;
  /** C-1048 */
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  since: string;
  orders: number;
  ltv: number;
  lastOrderAt: string | null;
  tags: string[];
  marketingConsent: boolean;
  owner: CrmMember | null;
  openTickets: number;
}

export interface CustomerList extends PageResponse<CustomerRow> {
  allCount: number;
}

export interface HistoryItem {
  id: string;
  kind: ActivityKind;
  body: string;
  by: string | null;
  at: string;
}

export interface ContactTicket {
  reference: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
}

export interface ContactTask {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  owner: CrmMember | null;
}

export interface CustomerProfile extends CustomerRow {
  hasAccount: boolean;
  averageOrder: number | null;
  tickets: ContactTicket[];
  tasks: ContactTask[];
  recentOrders: { id: string; orderNumber: string; status: string; total: number; currency: string; createdAt: string }[];
  history: HistoryItem[];
}

export interface CustomerQuery {
  q?: string;
  tag?: string;
  owner?: string;
  sort?: "name" | "orders" | "ltv" | "last";
  dir?: "asc" | "desc";
  page?: number;
  size?: number;
}

// ── Suppliers ────────────────────────────────────────────────────────────────

export interface SupplierRow {
  id: string;
  /** S-231 */
  code: string;
  company: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  category: string | null;
  stage: PipelineStage;
  stageChangedAt: string;
  estProducts: number;
  liveProducts: number;
  source: string;
  owner: CrmMember | null;
  nextStep: string | null;
  nextDue: string | null;
  lostReason: string | null;
  followsPortal: boolean;
  since: string;
}

export interface SupplierBoard {
  content: SupplierRow[];
  strip: { inProgress: number; productsOnTheWay: number; live: number; overdueNextSteps: number; stuck: number; lost: number };
  stages: CrmStageInfo[];
}

export interface SupplierProfile extends SupplierRow {
  application: { id: string; reference: string; stage: string } | null;
  tickets: ContactTicket[];
  tasks: ContactTask[];
  history: HistoryItem[];
}

export interface SupplierCreateInput {
  company: string;
  contactName?: string;
  email?: string;
  category?: string;
  source?: string;
  estProducts?: number;
  ownerId?: string | null;
}

// ── Tasks, notifications, dashboard, search ──────────────────────────────────

export type TaskTab = "today" | "up" | "done";

export interface TaskRow {
  id: string;
  title: string;
  dueAt: string;
  done: boolean;
  doneAt: string | null;
  owner: CrmMember | null;
  contact: { kind: RequesterKind; id: string; code: string; name: string } | null;
}

export interface TaskList {
  content: TaskRow[];
  counts: Record<TaskTab, number>;
}

export interface TaskCreateInput {
  title: string;
  customerId?: string;
  supplierId?: string;
  /** ISO timestamp. */
  due: string;
  ownerId?: string | null;
}

export interface CrmNotification {
  id: string;
  icon: string;
  tone: "bad" | "warn" | "ok" | "";
  title: string;
  subtitle: string;
  link: { type: "ticket" | "customer" | "supplier" | "tasks"; id: string | null };
}

export interface CrmDashboard {
  kpis: {
    openTickets: number;
    unassignedTickets: number;
    overdueTickets: number;
    myTasksDue: number;
    myTasksOverdue: number;
    suppliersInProgress: number;
    liveSuppliers: number;
    stuckSuppliers: number;
  };
  queue: TicketRow[];
  funnel: { key: PipelineStage; label: string; count: number }[];
  stuckSuppliers: { id: string; code: string; company: string; stage: PipelineStage; stageChangedAt: string }[];
  care: (CustomerRow & { daysSinceOrder: number | null })[];
  activity: {
    id: string;
    kind: ActivityKind;
    body: string;
    by: string | null;
    at: string;
    subject: { kind: RequesterKind; id: string; name: string } | null;
  }[];
  workload: { member: CrmMember; openTickets: number; openTasks: number }[];
}

export interface CrmSearchResult {
  customers: { id: string; code: string; name: string; email: string | null }[];
  suppliers: { id: string; code: string; name: string; email: string | null; contact: string | null; stage: PipelineStage }[];
  tickets: { reference: string; subject: string; status: TicketStatus }[];
}

export interface ActivityInput {
  kind: "note" | "call" | "email";
  body: string;
  subject?: string;
  outcome?: string;
  minutes?: number;
}

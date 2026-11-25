import api from "@/lib/Axios";
import type { AxiosResponse } from "axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  ActivityInput,
  CrmDashboard,
  CrmMeta,
  CrmNotification,
  CrmSearchResult,
  CrmTeam,
  CustomerList,
  CustomerProfile,
  CustomerQuery,
  CustomerRow,
  HistoryItem,
  PipelineStage,
  SupplierBoard,
  SupplierCreateInput,
  SupplierProfile,
  TaskCreateInput,
  TaskList,
  TaskRow,
  TaskTab,
  TicketCreateInput,
  TicketDetail,
  TicketList,
  TicketPriority,
  TicketStatus,
  TicketView,
  RequesterKind,
} from "@/types/api/crm.types";

const BASE = "/api/admin/crm";
/** The browser's offset from UTC, so "today" is the admin's today. */
const tz = () => new Date().getTimezoneOffset();

/** Unwraps the API envelope: every call here resolves to the data itself. */
const data = async <T>(p: Promise<AxiosResponse<ApiResponse<T>>>): Promise<T> => (await p).data.data as T;
const get = <T>(url: string, params?: Record<string, unknown>) => data<T>(api.get(`${BASE}${url}`, { params }));
const post = <T>(url: string, body?: unknown) => data<T>(api.post(`${BASE}${url}`, body ?? {}));
const patch = <T>(url: string, body: unknown) => data<T>(api.patch(`${BASE}${url}`, body));

/** Admin › CRM (ROLE_ADMIN): customers, suppliers, tickets, tasks and the dashboard. */
const crmService = {
  meta: () => get<CrmMeta>("/meta"),
  team: () => get<CrmTeam>("/team"),
  /** Counts for the sidebar badge. */
  summary: () => get<{ tickets: Record<TicketView, number> }>("/summary"),
  dashboard: () => get<CrmDashboard>("/dashboard", { tz: tz() }),
  notifications: () => get<{ content: CrmNotification[] }>("/notifications", { tz: tz() }),
  search: (q: string, limit = 6) => get<CrmSearchResult>("/search", { q, limit }),

  // Tickets
  tickets: (p: { view: TicketView; who?: RequesterKind; q?: string; page?: number; size?: number }) => get<TicketList>("/tickets", p),
  ticket: (reference: string) => get<TicketDetail>(`/tickets/${reference}`),
  createTicket: (input: TicketCreateInput) => post<TicketDetail>("/tickets", input),
  updateTicket: (reference: string, input: { status?: TicketStatus; priority?: TicketPriority; ownerId?: string | null }) =>
    patch<TicketDetail>(`/tickets/${reference}`, input),
  sendMessage: (reference: string, input: { body: string; mode: "reply" | "note"; after?: "pending" | "solved" }) =>
    post<TicketDetail>(`/tickets/${reference}/messages`, input),

  // Customers
  customers: (p: CustomerQuery) => get<CustomerList>("/customers", { ...p }),
  customer: (id: string) => get<CustomerProfile>(`/customers/${id}`),
  createCustomer: (input: { name: string; email: string; phone?: string }) => post<CustomerProfile>("/customers", input),
  updateCustomer: (id: string, input: { ownerId?: string | null; tags?: string[] }) => patch<CustomerProfile>(`/customers/${id}`, input),
  addCustomerActivity: (id: string, input: ActivityInput) => post<HistoryItem>(`/customers/${id}/activities`, input),

  // Suppliers
  suppliers: (p: { q?: string; owner?: string; includeLost?: boolean }) => get<SupplierBoard>("/suppliers", p),
  supplier: (id: string) => get<SupplierProfile>(`/suppliers/${id}`),
  createSupplier: (input: SupplierCreateInput) => post<SupplierProfile>("/suppliers", input),
  updateSupplier: (id: string, input: { ownerId?: string | null; nextStep?: string; nextDue?: string | null }) =>
    patch<SupplierProfile>(`/suppliers/${id}`, input),
  moveSupplier: (id: string, input: { stage: PipelineStage; reason?: string; note?: string }) => post<SupplierProfile>(`/suppliers/${id}/stage`, input),
  addSupplierActivity: (id: string, input: ActivityInput) => post<HistoryItem>(`/suppliers/${id}/activities`, input),

  // Tasks
  tasks: (p: { owner?: string; tab?: TaskTab; customerId?: string; supplierId?: string }) => get<TaskList>("/tasks", { ...p, tz: tz() }),
  createTask: (input: TaskCreateInput) => post<TaskRow>("/tasks", input),
  updateTask: (id: string, input: { done?: boolean; title?: string; due?: string; ownerId?: string | null }) => patch<TaskRow>(`/tasks/${id}`, input),
};

export type { CustomerRow };
export default crmService;

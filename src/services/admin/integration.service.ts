import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type {
  ConnectionResult,
  Integration,
  IntegrationInput,
  IntegrationNavItem,
  IntegrationProvider,
} from "@/types/api/integration.types";

/** Admin › Settings › API integrations. */
const integrationService = {
  /** Sidebar tabs; catalog staff may read it. */
  nav: () => api.get<ApiResponse<IntegrationNavItem[]>>("/api/admin/integrations-nav"),
  providers: () => api.get<ApiResponse<IntegrationProvider[]>>("/api/admin/integrations/providers"),
  list: () => api.get<ApiResponse<Integration[]>>("/api/admin/integrations"),
  get: (slug: string) => api.get<ApiResponse<Integration>>(`/api/admin/integrations/${slug}`),
  create: (body: IntegrationInput) => api.post<ApiResponse<Integration>>("/api/admin/integrations", body),
  update: (slug: string, body: IntegrationInput) => api.patch<ApiResponse<Integration>>(`/api/admin/integrations/${slug}`, body),
  remove: (slug: string) => api.delete<ApiResponse<{ slug: string }>>(`/api/admin/integrations/${slug}`),
  test: (slug: string) => api.post<ApiResponse<ConnectionResult>>(`/api/admin/integrations/${slug}/test`),
};

export default integrationService;

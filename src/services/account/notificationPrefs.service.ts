import api from "@/lib/Axios";
import type { ApiResponse } from "@/types/api/common.types";
import type { NotificationPrefs } from "@/types/api/account.types";

const BASE = "/api/users/me/notification-preferences";

/** Email and text preferences (contract C10). */
const notificationPrefsService = {
  get: () => api.get<ApiResponse<NotificationPrefs>>(BASE),

  update: (data: Partial<Omit<NotificationPrefs, "phone" | "orderUpdates">>) =>
    api.patch<ApiResponse<NotificationPrefs>>(BASE, data),

  /** Turns off every marketing email; order updates and delivery texts stay as they are. */
  unsubscribeAll: () => api.post<ApiResponse<NotificationPrefs>>(`${BASE}/unsubscribe-all`),
};

export default notificationPrefsService;

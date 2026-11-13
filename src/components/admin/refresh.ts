/** Fired after changes that affect the sidebar counts (orders to fulfil, low stock). */
export const ADMIN_REFRESH_EVENT = "admin:refresh-counts";

export const refreshAdminCounts = () => window.dispatchEvent(new Event(ADMIN_REFRESH_EVENT));

/** Fired after an API integration is added, renamed, switched on/off or removed: the sidebar tabs follow. */
export const ADMIN_INTEGRATIONS_EVENT = "admin:integrations-changed";

export const refreshAdminIntegrations = () => window.dispatchEvent(new Event(ADMIN_INTEGRATIONS_EVENT));

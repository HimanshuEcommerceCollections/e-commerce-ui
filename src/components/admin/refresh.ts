/** Fired after changes that affect the sidebar counts (orders to fulfil, low stock). */
export const ADMIN_REFRESH_EVENT = "admin:refresh-counts";

export const refreshAdminCounts = () => window.dispatchEvent(new Event(ADMIN_REFRESH_EVENT));

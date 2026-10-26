/**
 * Pulls the human-readable message out of an Axios error response
 * (the backend's ApiResponse.message), falling back to the error's own
 * message and finally a caller-supplied default. A validation error's
 * message is the generic "Validation failed", so its first field message
 * (`data: { field: message }`, e.g. "That code didn't match. Try again.")
 * is used instead.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const body = (err as { response?: { data?: { message?: string; data?: unknown } } })?.response?.data;
  const apiMessage = body?.message;
  if (apiMessage === "Validation failed" && body?.data && typeof body.data === "object") {
    const first = Object.values(body.data as Record<string, unknown>).find((v) => typeof v === "string" && v);
    if (typeof first === "string") return first;
  }
  if (apiMessage) return apiMessage;
  return err instanceof Error ? err.message : fallback;
}

/**
 * Pulls the human-readable message out of an Axios error response
 * (the backend's ApiResponse.message), falling back to the error's own
 * message and finally a caller-supplied default.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const apiMessage = (err as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  if (apiMessage) return apiMessage;
  return err instanceof Error ? err.message : fallback;
}

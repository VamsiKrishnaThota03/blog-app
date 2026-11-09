import { isAxiosError } from 'axios';

/** Extract a user-facing message from an API error. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (!error.response) return 'Cannot reach the server. Please check your connection and try again.';
    const message = (error.response.data as { message?: unknown } | undefined)?.message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

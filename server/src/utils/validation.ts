const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isNonEmptyString(value: unknown, maxLength = Infinity): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 255 && EMAIL_RE.test(value);
}

/** Parse a positive integer route/query param; returns null when invalid. */
export function parsePositiveInt(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

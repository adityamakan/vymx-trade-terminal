/**
 * Normalize an upstream market-observation timestamp without inventing freshness.
 * Yahoo Finance may expose timestamps as Date instances, epoch seconds/milliseconds,
 * or parseable strings depending on the adapter/version.
 */
export function normalizeProviderTimestamp(value: unknown): string | null {
  let milliseconds: number;

  if (value instanceof Date) {
    milliseconds = value.getTime();
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
  } else if (typeof value === 'string' && value.trim()) {
    milliseconds = Date.parse(value);
  } else {
    return null;
  }

  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) return null;
  // A market observation materially in the future is invalid provider metadata.
  if (date.getTime() > Date.now() + 5 * 60_000) return null;
  return date.toISOString();
}

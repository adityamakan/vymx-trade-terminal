export interface ProviderQuoteLike {
  price?: unknown;
  asOf?: unknown;
}

/**
 * A quote is suitable for simulated trading only when it has a positive finite
 * price and a real provider observation timestamp within the accepted age
 * window. Retrieval time is deliberately not a substitute for observation time.
 */
export function isVerifiedProviderQuote(
  quote: ProviderQuoteLike,
  now = Date.now(),
  maxAgeMs = 24 * 60 * 60_000
): boolean {
  const observedAt = typeof quote.asOf === 'string' ? Date.parse(quote.asOf) : Number.NaN;
  return Number.isFinite(quote.price) && Number(quote.price) > 0 &&
    Number.isFinite(observedAt) &&
    observedAt <= now + 5 * 60_000 &&
    now - observedAt <= maxAgeMs;
}

export interface ProviderQuoteLike {
  price?: unknown;
  asOf?: unknown;
  quoteAsOf?: unknown;
}

/**
 * A quote is suitable for simulated trading only when it has a positive finite
 * price and a real provider observation timestamp within the accepted age
 * window. Retrieval time is deliberately not a substitute for observation time.
 */
export function isVerifiedProviderQuote(
  quote: ProviderQuoteLike,
  now = Date.now(),
  maxAgeMs = 120_000
): boolean {
  const timestamp = quote.asOf ?? quote.quoteAsOf;
  const observedAt = typeof timestamp === 'string' ? Date.parse(timestamp) : Number.NaN;
  return typeof quote.price === 'number' && Number.isFinite(quote.price) && quote.price > 0 &&
    Number.isFinite(observedAt) &&
    observedAt <= now + 5 * 60_000 &&
    now - observedAt <= maxAgeMs;
}

/**
 * A simulated order must use the same fresh provider price the UI most recently
 * received. The tolerance is deliberately tiny and relative to avoid allowing
 * materially different prices for low-priced FX instruments.
 */
export function isSubmittedPriceCurrent(
  submittedPrice: number,
  quote: ProviderQuoteLike,
  now = Date.now()
): boolean {
  if (!isVerifiedProviderQuote(quote, now)) return false;
  if (!Number.isFinite(submittedPrice) || submittedPrice <= 0 || typeof quote.price !== 'number') return false;
  const tolerance = Math.max(1e-8, Math.abs(quote.price) * 1e-8);
  return Math.abs(submittedPrice - quote.price) <= tolerance;
}

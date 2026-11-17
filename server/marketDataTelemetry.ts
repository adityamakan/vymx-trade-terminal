export type ProviderFailureKind = 'timeout' | 'rate_limited' | 'upstream' | 'invalid_response' | 'unknown';

export type ProviderStatus = 'not_verified' | 'healthy' | 'degraded';

export interface ProviderTelemetrySnapshot {
  status: ProviderStatus;
  operationallyVerified: boolean;
  requests: number;
  successes: number;
  failures: number;
  timeouts: number;
  cacheHits: number;
  inFlightJoins: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastLatencyMs: number | null;
  averageLatencyMs: number | null;
  lastFailureKind: ProviderFailureKind | null;
}

export function classifyProviderError(error: unknown): ProviderFailureKind {
  const candidate = error as { name?: string; code?: string; message?: string; status?: number; statusCode?: number };
  const message = String(candidate?.message || '').toLowerCase();
  const code = String(candidate?.code || '').toLowerCase();
  const status = Number(candidate?.status ?? candidate?.statusCode);
  if (candidate?.name === 'AbortError' || candidate?.name === 'TimeoutError' || code.includes('timeout') || code === 'etimedout') return 'timeout';
  if (status === 429 || message.includes('too many requests') || message.includes('rate limit')) return 'rate_limited';
  if (message.includes('invalid') || message.includes('validation') || message.includes('schema')) return 'invalid_response';
  if (Number.isFinite(status) && status >= 500) return 'upstream';
  if (message.includes('network') || message.includes('fetch') || message.includes('http')) return 'upstream';
  return 'unknown';
}

export class ProviderTelemetry {
  private requests = 0;
  private successes = 0;
  private failures = 0;
  private timeouts = 0;
  private cacheHits = 0;
  private inFlightJoins = 0;
  private consecutiveFailures = 0;
  private lastSuccessAt: string | null = null;
  private lastFailureAt: string | null = null;
  private lastLatencyMs: number | null = null;
  private averageLatencyMs: number | null = null;
  private lastFailureKind: ProviderFailureKind | null = null;

  recordCacheHit(): void { this.cacheHits += 1; }
  recordInFlightJoin(): void { this.inFlightJoins += 1; }

  recordSuccess(latencyMs: number): void {
    this.requests += 1;
    this.successes += 1;
    this.consecutiveFailures = 0;
    this.lastSuccessAt = new Date().toISOString();
    this.lastLatencyMs = Math.max(0, Math.round(latencyMs));
    this.averageLatencyMs = this.averageLatencyMs === null
      ? this.lastLatencyMs
      : Math.round((this.averageLatencyMs * 0.8) + (this.lastLatencyMs * 0.2));
    this.lastFailureKind = null;
  }

  recordFailure(latencyMs: number, kind: ProviderFailureKind): void {
    this.requests += 1;
    this.failures += 1;
    this.consecutiveFailures += 1;
    if (kind === 'timeout') this.timeouts += 1;
    this.lastFailureAt = new Date().toISOString();
    this.lastLatencyMs = Math.max(0, Math.round(latencyMs));
    this.averageLatencyMs = this.averageLatencyMs === null
      ? this.lastLatencyMs
      : Math.round((this.averageLatencyMs * 0.8) + (this.lastLatencyMs * 0.2));
    this.lastFailureKind = kind;
  }

  snapshot(now = Date.now()): ProviderTelemetrySnapshot {
    const lastSuccessMs = this.lastSuccessAt ? Date.parse(this.lastSuccessAt) : Number.NaN;
    const successAgeMs = now - lastSuccessMs;
    const recentSuccess = Number.isFinite(lastSuccessMs) && successAgeMs >= 0 && successAgeMs <= 5 * 60_000;
    const status: ProviderStatus = this.requests === 0
      ? 'not_verified'
      : recentSuccess && this.consecutiveFailures === 0
        ? 'healthy'
        : 'degraded';
    return {
      status,
      operationallyVerified: status === 'healthy',
      requests: this.requests,
      successes: this.successes,
      failures: this.failures,
      timeouts: this.timeouts,
      cacheHits: this.cacheHits,
      inFlightJoins: this.inFlightJoins,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessAt: this.lastSuccessAt,
      lastFailureAt: this.lastFailureAt,
      lastLatencyMs: this.lastLatencyMs,
      averageLatencyMs: this.averageLatencyMs,
      lastFailureKind: this.lastFailureKind
    };
  }
}

export const marketDataTelemetry = new ProviderTelemetry();

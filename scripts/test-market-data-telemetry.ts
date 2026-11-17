import assert from 'node:assert/strict';
import { ProviderTelemetry, classifyProviderError } from '../server/marketDataTelemetry';

const telemetry = new ProviderTelemetry();
assert.equal(telemetry.snapshot().status, 'not_verified');
assert.equal(telemetry.snapshot().operationallyVerified, false);

telemetry.recordCacheHit();
telemetry.recordInFlightJoin();
telemetry.recordSuccess(120);
let snapshot = telemetry.snapshot();
assert.equal(snapshot.status, 'healthy');
assert.equal(snapshot.requests, 1);
assert.equal(snapshot.successes, 1);
assert.equal(snapshot.cacheHits, 1);
assert.equal(snapshot.inFlightJoins, 1);
assert.equal(snapshot.lastLatencyMs, 120);
assert.equal(snapshot.averageLatencyMs, 120);

telemetry.recordFailure(900, 'timeout');
snapshot = telemetry.snapshot();
assert.equal(snapshot.status, 'degraded');
assert.equal(snapshot.failures, 1);
assert.equal(snapshot.timeouts, 1);
assert.equal(snapshot.consecutiveFailures, 1);
assert.equal(snapshot.lastFailureKind, 'timeout');

telemetry.recordSuccess(80);
snapshot = telemetry.snapshot();
assert.equal(snapshot.status, 'healthy');
assert.equal(snapshot.consecutiveFailures, 0);
assert.equal(snapshot.failures, 1);
assert.equal(snapshot.successes, 2);
assert.ok(snapshot.averageLatencyMs !== null && snapshot.averageLatencyMs > 0);

assert.equal(classifyProviderError({ name: 'TimeoutError' }), 'timeout');
assert.equal(classifyProviderError({ status: 429 }), 'rate_limited');
assert.equal(classifyProviderError({ status: 503 }), 'upstream');
assert.equal(classifyProviderError(new Error('schema validation failed')), 'invalid_response');
assert.equal(classifyProviderError(new Error('unexpected failure')), 'unknown');

const oldSuccess = new ProviderTelemetry();
oldSuccess.recordSuccess(10);
assert.equal(oldSuccess.snapshot(Date.now() + 6 * 60_000).status, 'degraded');

console.log('Market-data telemetry tests passed.');

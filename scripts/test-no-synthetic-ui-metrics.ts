import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screener = readFileSync(new URL('../src/components/Screener.tsx', import.meta.url), 'utf8');
const heatmap = readFileSync(new URL('../src/components/Heatmap.tsx', import.meta.url), 'utf8');

assert.equal(screener.includes('charCodeAt'), false, 'Screener metrics must never be derived from ticker-symbol characters');
assert.equal(heatmap.includes('charCodeAt'), false, 'Heatmap metrics must never be derived from ticker-symbol characters');
assert.match(screener, /N\/A — provider fundamentals unavailable/, 'Market-cap cells must disclose unavailable provider fundamentals');
assert.match(screener, /N\/A — verified candle series unavailable|RSI: N\/A/, 'Technical metrics must disclose unavailable source data');
assert.match(heatmap, /no dark-pool provider/, 'Dark-pool values must remain unavailable without a provider');
assert.match(heatmap, /no validated scoring model/, 'AI confidence must remain unavailable without a validated model');

console.log('Synthetic UI metric regression tests passed.');

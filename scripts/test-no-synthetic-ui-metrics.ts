import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const screener = readFileSync(new URL('../src/components/Screener.tsx', import.meta.url), 'utf8');
const heatmap = readFileSync(new URL('../src/components/Heatmap.tsx', import.meta.url), 'utf8');
const quickTrade = readFileSync(new URL('../src/components/QuickTrade.tsx', import.meta.url), 'utf8');
const assetDetails = readFileSync(new URL('../src/components/AssetDetails.tsx', import.meta.url), 'utf8');
const dashboard = readFileSync(new URL('../src/components/Dashboard.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8');
const portfolio = readFileSync(new URL('../src/components/Portfolio.tsx', import.meta.url), 'utf8');

assert.equal(screener.includes('charCodeAt'), false, 'Screener metrics must never be derived from ticker-symbol characters');
assert.equal(heatmap.includes('charCodeAt'), false, 'Heatmap metrics must never be derived from ticker-symbol characters');
assert.match(screener, /N\/A — provider fundamentals unavailable/, 'Market-cap cells must disclose unavailable provider fundamentals');
assert.match(heatmap, /RSI: N\/A — verified candle series unavailable/, 'Heatmap RSI must disclose unavailable source data');
assert.match(heatmap, /no dark-pool provider/, 'Dark-pool values must remain unavailable without a provider');
assert.match(heatmap, /no validated scoring model/, 'AI confidence must remain unavailable without a validated model');
assert.match(quickTrade, /const canExecute = quoteIsFresh &&/, 'Quick trade must require a fresh quote');
assert.match(assetDetails, /disabled=\{!hasFreshQuote\}/, 'Asset detail trade form must disable submission without a fresh quote');
assert.match(dashboard, /hasFreshProviderQuote\(asset\) \? formatCurrency\(asset\.price/, 'Dashboard prices must be gated per symbol');
assert.match(app, /!liveAsset \|\| !isVerifiedProviderQuote\(liveAsset\)/, 'Stale bundled prices must not trigger price alerts');
assert.match(app, /quotesComplete && fxComplete/, 'Portfolio snapshots must require fresh quotes for every open position');
assert.match(portfolio, /hasFreshProviderQuote\(liveAsset\) \? liveAsset!\.price : null/, 'Portfolio holdings must not fall back to bundled prices');
assert.match(portfolio, /N\/A — incomplete quote coverage/, 'Incomplete portfolio valuations must be disclosed');

console.log('Synthetic UI metric regression tests passed.');

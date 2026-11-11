import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  Timestamp
} from 'firebase/firestore';

const projectId = 'demo-vymx-trade-terminal';
const rules = await readFile('firestore.rules', 'utf8');
const env = await initializeTestEnvironment({
  projectId,
  firestore: { rules, host: '127.0.0.1', port: 8080 }
});

const ledger = (db, uid) => doc(db, 'users', uid, 'ledger', 'data');
const snapshot = (db, uid, id) => doc(db, 'users', uid, 'portfolioSnapshots', id);
const intraday = (db, uid, id) => doc(db, 'users', uid, 'portfolioIntradaySnapshots', id);

const validLedger = {
  virtualBalance: 100000,
  watchlist: ['AAPL', 'BTC'],
  portfolio: [{ symbol: 'AAPL', quantity: 2, avgBuyPrice: 180 }],
  transactions: []
};

const validSnapshot = (id) => ({
  id,
  capturedAt: Date.now(),
  cashBalance: 100000,
  positions: [{
    symbol: 'AAPL',
    quantity: 2,
    price: 180,
    marketValue: 360,
    quoteCurrency: 'USD',
    marketValueUSD: 360
  }],
  baseCurrency: 'USD',
  fxRates: { USD: 1 },
  totalEquityUSD: 100360,
  source: 'provider-quote-snapshot',
  currencyNormalization: 'provider-fx-to-usd'
});

try {
  const anonymous = env.unauthenticatedContext().firestore();
  const alice = env.authenticatedContext('alice').firestore();
  const bob = env.authenticatedContext('bob').firestore();

  // Anonymous access and cross-user access must be denied.
  await assertFails(getDoc(ledger(anonymous, 'alice')));
  await assertSucceeds(setDoc(ledger(alice, 'alice'), validLedger));
  await assertSucceeds(getDoc(ledger(alice, 'alice')));
  await assertFails(getDoc(ledger(alice, 'bob')));
  await assertFails(setDoc(ledger(alice, 'bob'), validLedger));

  // The ledger schema rejects negative balances, excessive arrays and unknown fields.
  await assertFails(setDoc(ledger(alice, 'alice'), { ...validLedger, virtualBalance: -1 }));
  await assertFails(setDoc(ledger(alice, 'alice'), {
    ...validLedger,
    watchlist: Array.from({ length: 101 }, (_, i) => 'SYM' + i)
  }));
  await assertFails(setDoc(ledger(alice, 'alice'), { ...validLedger, admin: true }));

  // Snapshot writes are owner-only and enforce USD/source metadata.
  await assertSucceeds(setDoc(snapshot(alice, 'alice', '2026-11-11'), validSnapshot('2026-11-11')));
  await assertSucceeds(getDoc(snapshot(alice, 'alice', '2026-11-11')));
  await assertFails(getDoc(snapshot(alice, 'bob', '2026-11-11')));
  await assertFails(setDoc(snapshot(alice, 'alice', 'bad-currency'), {
    ...validSnapshot('bad-currency'),
    baseCurrency: 'INR'
  }));

  // Intraday snapshots require a Firestore Timestamp expiry field.
  await assertSucceeds(setDoc(intraday(alice, 'alice', 'bucket-1'), {
    ...validSnapshot('bucket-1'),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000))
  }));
  await assertFails(setDoc(intraday(alice, 'alice', 'bucket-2'), {
    ...validSnapshot('bucket-2'),
    expiresAt: new Date(Date.now() + 90 * 86400000)
  }));
  await assertFails(setDoc(intraday(alice, 'alice', 'bucket-3'), {
    ...validSnapshot('bucket-3'),
    expiresAt: Timestamp.fromDate(new Date(Date.now() + 90 * 86400000)),
    extra: 'not-allowed'
  }));

  // Unmatched collection paths are closed by default.
  await assertFails(getDocs(collection(alice, 'privateAdminData')));
  await assertSucceeds(deleteDoc(ledger(alice, 'alice')));

  console.log('Firestore rules emulator tests passed: anonymous denial, user isolation, schema validation and snapshot TTL field shape.');
} finally {
  await env.cleanup();
}

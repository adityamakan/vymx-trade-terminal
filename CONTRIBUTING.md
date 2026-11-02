# Contributing to VYMX

## Before changing code

Read System Architecture (docs/ARCHITECTURE.md), Data Quality (docs/DATA_QUALITY.md), Security (SECURITY.md), and Deployment Runbook (docs/DEPLOYMENT_RUNBOOK.md).

Confirm whether the requested feature is a UI improvement, provider integration, analytics calculation, or operational change. Do not copy static values, random generators, synthetic returns or placeholder transactions into live data paths.

## Local checks

Use Node.js 22.19.0 or later.

- npm ci
- npm run lint
- npm test
- npm run build:artifacts
- npm run build before proposing a release

## Pull request requirements

Every pull request should include:
- problem statement and expected behavior;
- files/modules affected;
- screenshots for material UI changes;
- tests added or updated;
- commands run and actual results;
- provider/source, unit, observation timestamp and failure behavior for data changes;
- migration, environment-variable and deployment implications;
- security/authentication impact (explicitly state when none).

## Data and analytics rules

- Do not invent missing observations or substitute zero.
- Distinguish provider observation time from retrieval time.
- State units, currency, frequency, sample window and methodology.
- Use adjusted or unadjusted prices consistently and document the choice.
- Do not describe raw portfolio equity change as TWR or MWR.
- Backtests require reproducible input data, point-in-time controls, transaction costs, slippage, rebalance rules and benchmark alignment.
- AI-generated text must be labeled as commentary and must not be presented as a verified fact.

## Security and account data

- Never commit secrets, service-account files or private keys.
- Do not move provider secrets into VITE variables or browser headers.
- Do not weaken Firebase rules or change authentication flows as a side effect of unrelated work.
- Treat user portfolio and identity data as private; avoid logging it.

## Scope discipline

Keep pull requests focused and reviewable. Do not combine a large UI redesign with an untested authentication migration or live-trading capability. If a change requires external dashboard configuration, document the exact manual step and leave production untouched until approved.

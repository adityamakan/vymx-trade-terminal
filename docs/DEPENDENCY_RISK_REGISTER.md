# Dependency vulnerability risk register

## Current status — 2026-11-11

The validated release-readiness lockfile reports **0 npm audit vulnerabilities**:

| Severity | Baseline (Nov 2) | Current lockfile |
|---|---:|---:|
| Critical | 2 | 0 |
| High | 17 | 0 |
| Moderate | 8 | 0 |
| Low | 0 | 0 |
| Info | 0 | 0 |
| **Total** | **27** | **0** |

The current result came from `npm audit --json` after the regenerated lockfile was installed with `npm ci`. The CI verification step failed the run if any critical, high or moderate advisory remained; the completed audit output reported zero in every severity category. This means the npm advisory database reported no known vulnerabilities for this lockfile at that time. It is not a guarantee that the application has no security defects or that new advisories will not be published.

## Main remediation changes

| Package | Previous locked version | Current locked version | Remediation |
|---|---:|---:|---|
| `yahoo-finance2` | 3.15.4 | 4.0.6 | Migrated to supported v4 on Node 22 and instantiated the `YahooFinance` client. |
| `zod` | 3.25.76 | 4.6.7 | Updated through the Yahoo Finance v4 dependency graph. |
| `@grpc/grpc-js` | 1.9.16 | 1.14.7 | Added a compatible npm override to resolve the Firebase/Firestore transitive advisory path. |
| `postcss-selector-parser` | 6.0.10 | 6.1.6 | Added a compatible 6.x override for the Tailwind Typography dependency path. |
| `firebase` | 12.15.0 | 12.19.0 | Refreshed within the existing 12.x range. |
| `@firebase/firestore` | 4.16.0 | 4.17.2 | Refreshed within the existing Firebase SDK dependency graph. |
| `dompurify` | 3.4.11 | 3.4.17 | Updated compatible lockfile resolution. |
| `proxy-addr` | 2.0.7 | 2.0.8 | Updated compatible lockfile resolution. |
| `express` | 4.21.2 | 4.22.3 | Updated within the existing Express 4 range. |
| `qs` | 6.15.2 | 6.16.2 | Updated compatible lockfile resolution. |

The lockfile refresh also updated other affected transitive dependencies, including body-parser, Browserslist, compression, fast-uri, ip-address, nanoid, PostCSS, source-map-js, undici, Hono, fflate and protobufjs. The exact resolved versions are recorded in `package-lock.json`.

## Validation completed

The dependency-refresh workflow completed all of the following on the release-readiness branch:

1. Regenerated `package-lock.json` from the declared dependency ranges and explicit overrides.
2. Installed the resulting lockfile with `npm ci`.
3. Passed TypeScript validation with `npm run lint`.
4. Passed the automated financial analytics, provider timestamp and quote-verification tests with `npm test`.
5. Passed the Vite frontend and Express production bundle build with `npm run build:artifacts`.
6. Passed the follow-up `npm audit --json` check with zero vulnerabilities in all severity categories.

The main CI workflow separately runs a production-server smoke test. The release-readiness branch now extends that smoke test to verify same-origin, exact allowlisted-origin, wildcard deploy-preview-origin and denied-origin WebSocket behavior.

## Remaining verification that is not an npm audit result

- Exercise Google sign-in and Firestore ledger reads/writes against the Firebase Emulator and the intended production Firebase project.
- Confirm the Render deployment uses the updated lockfile and the configured Node 22 runtime.
- Verify Yahoo quote, chart and quoteSummary responses against the live upstream provider after deployment; Yahoo Finance remains an unofficial external service.
- Continue monitoring new advisories through the repository's Dependabot configuration and CI audit.

## Maintenance policy

- Do not use `npm audit fix --force` as a blanket remediation. The original audit proposed inappropriate major downgrades for Firebase, Tailwind Typography and Yahoo Finance.
- Keep dependency changes in reviewable commits and regenerate the lockfile with npm rather than hand-editing resolved package entries.
- Require `npm ci`, typecheck, tests, production build, server smoke tests and a fresh audit before merging dependency changes.
- Recheck the npm advisory database at release time; a clean audit is time-specific.

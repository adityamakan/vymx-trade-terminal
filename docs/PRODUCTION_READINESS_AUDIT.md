# VYMX production-readiness audit

**Audit date:** 12 November 2026  
**Repository:** `adityamakan/vymx-trade-terminal`  
**Main commit audited:** `46fa98ebeffceaff55a66132a1daaaeb95c5cb5a`

## Executive status

**Not yet production-verified.** Application CI and CodeQL pass, but production infrastructure, Firebase identity and GitHub release governance have unresolved blockers.

## Evidence-based status

| Area | Verified evidence | Status |
|---|---|---|
| Main CI | Run `43086315341` succeeded on `46fa98e` | Pass |
| CodeQL | Run `43086315080` succeeded on `46fa98e` | Pass |
| Typecheck, tests, build, local production-server smoke test | Included in successful CI | Pass |
| Firestore rules | Emulator suite runs in CI | Emulator only |
| Main branch protection | Branch API returned `protected: false`; rulesets endpoint returned `[]` | **P0 blocker** |
| Firebase web configuration | Main contained a placeholder with `projectId: mock` | **P0 blocker for persistent auth/cloud sync** |
| Netlify Deploy Preview | PR #7 Redirect rules, Header rules and Pages changed all report `Deploy failed` | **P0 preview blocker** |
| Netlify root cause | Check output contains no build error; deploy log inaccessible through connected integration | Unknown |
| Render deployed commit/settings | Dashboard not accessible through GitHub integration | Unverified |
| Production API and WebSocket | No live production monitor run yet | Unverified |
| Firebase production rules and TTL | Emulator tests only | Unverified |

## P0 — Required before production release

### 1. Protect GitHub main

The branch API reported `protected: false` for `main` on 12 November 2026; the repository returned no rulesets. An administrator must configure a branch protection rule or ruleset:

1. Require pull requests before merging.
2. Require `CI / Typecheck, tests, build and dependency audit`.
3. Require CodeQL analysis.
4. Require conversation resolution.
5. Block force pushes and branch deletion.
6. Decide whether an approving review is required. For a solo-maintained project, use an explicit owner review rather than bypassing checks silently.

The connected integration cannot write repository administration settings. Verify the resulting rule in GitHub Settings and the branch API.

### 2. Configure the real Firebase project

The previous tracked browser configuration contained placeholder values. This follow-up removes the fake config import and switches to `VITE_FIREBASE_*` variables. Persistent Firebase services remain disabled until the four required values are supplied:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

Before enabling real accounts:
1. Confirm the production Firebase project ID independently.
2. Set the four values in the production frontend build environment.
3. Enable only the Auth providers offered by the UI.
4. Add the exact production frontend hostname to Firebase Auth authorized domains.
5. Deploy the reviewed `firestore.rules` to that exact project.
6. Test owner access and cross-user denial using separate test accounts.
7. Enable the `expiresAt` TTL policy for collection group `portfolioIntradaySnapshots`, if automatic retention is required.
8. Consider Firebase App Check before wider public exposure.

These Firebase web values are public browser configuration, not private server secrets. Firestore rules and Auth are the authorization boundary. Never put service-account JSON, Gemini, FRED or Finnhub secrets into `VITE_*` variables.

### 3. Resolve Netlify Deploy Preview

For PR #7, GitHub reports three failed deploy-derived checks: Redirect rules, Header rules and Pages changed. All point to the same failed Netlify deploy and say only "Deploy failed". Do not guess the cause.

Required diagnostic:
1. Open the failed Netlify deploy from the PR check.
2. Open the full deploy/build log.
3. Copy the first actual error and final build output, redacting environment values and tokens.
4. Verify Netlify base directory, build command, publish directory and Node version.
5. Re-run the preview and require all deploy-derived checks to pass.

The repository pins Node 22.19.0 in `.node-version`; this branch also declares the same version in `netlify.toml`. Netlify documents `.node-version` as a supported Node-version selector. This removes one configuration ambiguity but does not prove it caused the previous failure.

## P1 — External production verification

### Render

Confirm service `vymx-trade-terminal-2` deploys the expected `main` commit and has:
- Build: `npm ci && npm run build`
- Start: `npm start`
- Node: `22.19.0`
- Health check: `/health`
- Correct, narrow `WEBSOCKET_ALLOWED_ORIGINS`
- Required `VITE_FIREBASE_*` values at build time if persistent auth is enabled
- Server-only provider secrets kept outside the browser bundle

The GitHub integration cannot change or inspect Render dashboard settings.

### Production monitor

The scheduled workflow checks:
1. `GET /` and the built JavaScript bundle for frontend delivery.
2. `GET /health` and the expected service identity.
3. `POST /api/prices` for a real Yahoo Finance AAPL quote, positive finite price, provider source and observation timestamp no more than seven days old or five minutes in the future.
4. Server-side WebSocket handshake and ping/pong heartbeat. Browser Origin allowlist behavior remains covered by CI integration tests.

Merge and run it after the expected Render deployment. A passing result is an operational signal, not a full browser journey or a guarantee that every provider/instrument is available.

### Firestore production rules and TTL

Emulator tests do not deploy production rules. Deploy only after confirming the project ID and reviewing the exact rules diff. Verify the active rules and TTL policy in Firebase/Google Cloud. An `expiresAt` field alone does not enable TTL.

## P2 — Application acceptance

After preview and backend checks pass:
- Test sign-in, demo access, dashboard, screener, asset details, portfolio, simulated trade, logout and account switching.
- Verify provider timestamps, stale-data states, currency normalization and unavailable states.
- Confirm no private provider credentials are present in the client bundle.
- Check CORS, mixed content, browser console and WebSocket reconnect behavior.
- Review keyboard navigation, responsive layouts and accessible status messages.
- Load-test cautiously. API rate limiting is process-local and must move to a shared store before horizontal scaling.

## Release decision

Do not call VYMX production-ready until P0 blockers are closed and P1 external deployment checks have evidence. Green GitHub CI is necessary, but it does not verify Render, Netlify, Firebase production rules or GitHub governance.

## Evidence

- Main CI: https://github.com/adityamakan/vymx-trade-terminal/actions/runs/43086315341
- Main CodeQL: https://github.com/adityamakan/vymx-trade-terminal/actions/runs/43086315080
- Previous monitoring PR: https://github.com/adityamakan/vymx-trade-terminal/pull/7

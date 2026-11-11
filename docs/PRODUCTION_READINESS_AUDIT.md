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
| Render service configuration | Read-only Render inspection: service is live on `46fa98e`; Node 22.19.0; build `npm install && npm run build`; start `npm start`; auto-deploy from `main`; Free plan, one instance; custom HTTP health-check path unset | Partially verified; health-check configuration needs correction |
| Production API and WebSocket | Render build/startup logs verified; external HTTP/API/WebSocket probe unavailable; scheduled monitor is defined on PR #8 and not active until merge | Unverified |
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

For PR #7 and the current PR #8, GitHub reports three failed deploy-derived checks: Redirect rules, Header rules and Pages changed. All three point to the same failed Netlify deploy and say only "Deploy failed". The failed checks are associated with the PR preview deployment; the underlying Netlify deploy log is not available through the current connected integration. The failure persisted after pinning Node 22.19.0, so Node-version mismatch is not established as the root cause. Do not guess the cause.

Required diagnostic:
1. Open the failed Netlify deploy from the PR check.
2. Open the full deploy/build log.
3. Copy the first actual error and final build output, redacting environment values and tokens.
4. Verify Netlify base directory, build command, publish directory and Node version.
5. Re-run the preview and require all deploy-derived checks to pass.

The repository pins Node 22.19.0 in `.node-version`; this branch also declares the same version in `netlify.toml`. Netlify documents both `.node-version` and `NODE_VERSION` as supported selectors. The repeated failure after this alignment means the build log is still required to identify the actual cause.

## P1 — External production verification

### Render

Read-only inspection confirmed service `vymx-trade-terminal-2` is connected to `main` with auto-deploy enabled. At inspection it was live on commit `46fa98ebeffceaff55a66132a1daaaeb95c5cb5a`; the build completed on 11 November 2026 at 19:22 UTC. Observed settings were Node.js `22.19.0`, build `npm install && npm run build`, start `npm start`, Free plan and one instance. Build/runtime logs show a successful build and `VYMX API listening on port 10000`.

Remaining Render actions:
- Change the build command to `npm ci && npm run build` only as a controlled dashboard change after verifying lockfile consistency; the current observed command is `npm install && npm run build`.
- Configure HTTP health-check path `/health`; the inspected service currently has no custom HTTP health-check path.
- Verify the narrow `WEBSOCKET_ALLOWED_ORIGINS` value and the presence of required build/runtime variables without exposing secret values. The connected read-only service response did not expose environment-variable names or values.
- Confirm the candidate merge commit is deployed, then verify live HTTP/API/provider/WebSocket behavior.

The workspace also contains legacy sibling services `vymx-trade-terminal-1` (suspended) and `vymx-trade-terminal` (not suspended, configured start command `npm startyarn start`). They were not modified or deleted. Review their ownership/use before cleanup.

### Production monitor

The scheduled workflow checks:
1. `GET /` and the built JavaScript bundle for frontend delivery.
2. `GET /health` and the expected service identity.
3. `POST /api/prices` for a real Yahoo Finance AAPL quote, positive finite price, provider source and observation timestamp no more than seven days old or five minutes in the future.
4. Server-side WebSocket handshake and ping/pong heartbeat. Browser Origin allowlist behavior remains covered by CI integration tests.

Merge and run it after the expected Render deployment. The workflow is present in PR #8 but is not active until the PR merges. A passing result is an operational signal, not a full browser journey or a guarantee that every provider/instrument is available.

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

# Production operations and release verification

This document defines the operational checks for the Render production service. It complements [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md); it does not replace provider-specific dashboard configuration or production change approval.

## Production topology

- Production application/API/WebSocket: `https://vymx-trade-terminal-2.onrender.com`
- Hosting: Render web service `vymx-trade-terminal-2`
- Source of truth: GitHub `main`
- Runtime: Node.js `22.19.0`
- Health endpoint: `GET /health`
- Market-data endpoint: `POST /api/prices`
- WebSocket endpoint: `wss://vymx-trade-terminal-2.onrender.com/api/prices`

The application is a market-data dashboard and simulated-trading environment. A green health check is not evidence of brokerage connectivity, executable prices, order routing, investment suitability, or guaranteed market-data availability.

## Scheduled production monitor

The GitHub Actions workflow `.github/workflows/production-monitor.yml` runs every 30 minutes and can also be started manually from Actions → Production availability monitor → Run workflow.

It performs four live checks against the production Render origin: The quote must identify Yahoo Finance, include its provider observation timestamp, be no more than five minutes in the future and no older than seven days (allowing for weekends and market holidays):

1. **Frontend delivery:** `GET /` must return the VYMX HTML shell and its built JavaScript bundle must be reachable.
2. **Process health:** `GET /health` must return HTTP 200 with `status: "ok"` and `service: "vymx-api"`.
3. **Market-data path:** `POST /api/prices` requests AAPL and requires a valid positive finite price plus a parseable provider observation timestamp. It does not treat retrieval time as the provider observation time.
4. **WebSocket lifecycle:** opens a same-origin WebSocket connection and requires the application heartbeat response `pong`.

The monitor retries transient HTTP/network failures up to three attempts. A failed run means at least one production smoke check did not meet its contract; inspect the job log before concluding whether the cause is Render, the provider, or the WebSocket path. It is an availability signal, not a full synthetic user journey and not a guarantee that every symbol or screen is correct.

The monitor uses the public production URL and does not require secrets. Do not add API keys, Firebase credentials, or other secrets to workflow YAML or logs.

## Release acceptance checklist

A release is not production-verified until all applicable items below have evidence:

### Source and CI
- [ ] Candidate is merged to `main` through a reviewed pull request.
- [ ] Typecheck, unit tests, production build, backend smoke tests, Firestore Emulator rules tests and dependency audit pass on the merge commit.
- [ ] CodeQL and repository-required checks pass for the merge commit.
- [ ] The production monitor passes after deployment.
- [ ] The frontend build uses the real Firebase public web configuration if persistent authentication and cloud sync are required.

### Render
- [ ] Service `vymx-trade-terminal-2` deploys the exact expected `main` commit.
- [ ] Build command is `npm ci && npm run build`.
- [ ] Start command is `npm start`.
- [ ] Health check path is `/health`.
- [ ] Node runtime is `22.19.0`.
- [ ] `WEBSOCKET_ALLOWED_ORIGINS` contains only the verified frontend production origin and the narrowly scoped deploy-preview pattern, if previews need direct WebSocket access.
- [ ] No secret values are copied into GitHub, PR comments, screenshots, or support requests.
- [ ] Production API, browser WebSocket and server logs are reviewed after deploy.

### Netlify preview
- [ ] Netlify build completes and the Redirect rules, Header rules and Pages changed checks are green.
- [ ] `/api/health` on the preview resolves to the Render API.
- [ ] The frontend uses the configured Render WebSocket endpoint.
- [ ] Browser console shows no CORS, WebSocket 403, mixed-content, or reconnect loop errors.
- [ ] The actual Netlify primary hostname is verified before adding it to Render's origin allowlist.

A Netlify preview is not the production host. The production service remains Render.

### Firebase
- [ ] The intended production Firebase project is independently confirmed.
- [ ] The frontend build supplies `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID`; optional storage bucket, messaging sender and measurement identifiers are set if used.
- [ ] Values correspond to the confirmed production project. They are public web-client configuration, not private server credentials; authorization is enforced by Firebase Auth and Firestore rules.
- [ ] Google and/or Email/Password providers are enabled only if those sign-in methods are offered.
- [ ] Firebase Auth authorized domains include the actual production frontend hostname. Do not assume ephemeral preview hostnames are authorized.
- [ ] Authentication providers and authorized domains are reviewed.
- [ ] `firestore.rules` is deployed only after reviewing the exact project and rules diff.
- [ ] Firestore Emulator rules tests pass for the same rules revision.
- [ ] TTL is explicitly configured for the `portfolioIntradaySnapshots` collection group if automatic expiry is required.
- [ ] A least-privilege production read/write smoke test is completed with test accounts.
- [ ] Production data is backed up/exported according to the project's recovery plan before material schema/rules changes.

Emulator tests do not deploy rules. An `expiresAt` field does not enable TTL by itself.

### GitHub governance
- [ ] Protect `main` against direct pushes, force pushes and deletion.
- [ ] Require pull requests and review as appropriate for the project.
- [ ] Require the CI and CodeQL checks that actually exist and are stable.
- [ ] Require conversation resolution before merge.
- [ ] Review Actions permissions and third-party action pinning periodically.

The GitHub branch API reported `main.protected = false` on 12 November 2026, and the repository returned no rulesets. The branch-protection detail endpoint denied integration access, so an administrator must configure and verify branch protection or a ruleset in GitHub Settings.

## Incident triage

### Health check fails
1. Open the Render deployment and runtime logs for the exact deployment.
2. Confirm the deployed commit SHA and service state.
3. Check for build failures, process crashes, memory pressure, cold starts, or port binding errors.
4. Re-run the monitor after the service is stable.

### Health passes but market-data check fails
1. Inspect the API response and Render logs.
2. Distinguish an upstream Yahoo Finance error/rate limit from an application exception.
3. Confirm the returned quote has a provider observation timestamp; never substitute `fetchedAt`.
4. Do not fabricate fallback prices or silently convert unavailable fields to zero.
5. If the provider is degraded, keep affected data explicitly unavailable and communicate the limitation.

### WebSocket check fails
1. Confirm Render is running the expected commit.
2. Check `WEBSOCKET_ALLOWED_ORIGINS` against the actual request Origin and Host.
3. Confirm TLS endpoint, path `/api/prices`, and server WebSocket upgrade logs.
4. Test from the real production frontend and verify heartbeat/reconnect behavior.
5. Do not broaden the origin allowlist to `*.netlify.app` as a workaround.

### Rollback
If a deployment causes a production regression:
1. Identify the last known-good Render deployment and commit.
2. Use Render's rollback/redeploy controls according to the service's deployment policy.
3. Confirm `/health`, market-data API and WebSocket heartbeat after rollback.
4. Record the failed commit, evidence, impact window and corrective action.
5. Do not rewrite Git history or force-push `main` to perform a production rollback.

## Current known limitations

- Yahoo Finance is an unofficial upstream market-data source and may throttle, delay, or omit observations.
- The health endpoint verifies process health/configuration, not upstream provider health.
- The application is not a brokerage or live order-execution system; simulated trades are not real orders.
- Process-local rate limiting is not shared across multiple service instances. Reassess before horizontal scaling.
- Production Firebase rules, TTL, Render environment variables, Netlify deploy checks, and GitHub branch protection require separate dashboard verification.


## Firebase client configuration

The browser Firebase SDK is initialized from Vite build-time variables, not a hard-coded applet configuration file. Required variables are `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_APP_ID`. Optional fields are `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID` and `VITE_FIREBASE_MEASUREMENT_ID`.

If required values are missing, Firebase Auth and Firestore intentionally remain uninitialized; Demo Access remains local-only and does not sync between devices. This avoids connecting to a placeholder or wrong project. Set values in the production host's build environment and rebuild. Never put private service-account, Gemini, FRED or Finnhub credentials in `VITE_*` variables.

The Firebase web API key is a public client identifier, not an authorization boundary. Keep Firestore rules restrictive, enable only the intended Auth providers, review authorized domains and consider App Check before wider public exposure.

## Verified repository status at 12 November 2026

- Main commit at audit time: `46fa98ebeffceaff55a66132a1daaaeb95c5cb5a`.
- GitHub Actions CI and CodeQL completed successfully for that commit.
- The default branch API reported `protected: false`; no repository rulesets were returned.
- Render deployed commit, environment variables, health-check setting and runtime logs were not accessible through the connected GitHub integration.
- Netlify Deploy Preview for PR #7 failed in Redirect rules, Header rules and Pages changed. GitHub check output says only "Deploy failed"; the underlying Netlify log was not accessible, so the cause remains unknown.
- The Firebase config on `main` at audit time contained placeholder values (`projectId: mock`). This follow-up replaces the fake config import with explicit Vite environment configuration.
- Firestore Emulator tests do not deploy production rules or prove the production project is correct.

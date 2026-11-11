# Deployment and release runbook

## Production topology

- Render web service: `vymx-trade-terminal-2`
- Production source: GitHub repository `adityamakan/vymx-trade-terminal`, branch `main`
- Node runtime: `22.19.0` (pinned in `.node-version`)
- Application start command: `npm start` (runs `node dist-server/server.cjs`)
- Health endpoint: `/health`
- Render production URL: `https://vymx-trade-terminal-2.onrender.com`

The Render dashboard export supplied during the November 2, 2026 review showed production at commit `38cc661`. It also showed a Free instance that can spin down during inactivity; a cold-start delay is not itself a failed deployment.

## Confirmed deployment failure

The supplied Render log for commit `3c7fd0991b8b09807ba4f5c6543f7332a70430f7` showed:

```
src/App.tsx(739,19): error TS17001:
JSX elements cannot have multiple attributes with the same name.
```

The failing revision had duplicate `isDataOffline` props on the Dashboard JSX element. The subsequent production revision shown in the dashboard no longer had that duplicate. This was a source compilation regression, not evidence of a Render platform outage.

Other red entries in the dashboard history do not include their build logs in the supplied export. Their exact causes remain unverified; do not label them as the same error without inspecting each deployment's logs.

## Required Render service settings

Set these in the Render service dashboard and verify them after saving:

| Setting | Required value |
|---|---|
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/health` |
| Node version | `22.19.0` |
| Auto-deploy branch | `main` |

The supplied log showed Render using `npm install && npm run build`. That is less reproducible than `npm ci`, and it did not run the typecheck or tests before deployment. The `npm run build` script now runs `npm run lint` and `npm test` before generating production artifacts, so Render's existing `npm install && npm run build` command inherits the same preflight gates. The GitHub CI workflow runs the checks as separate named steps and a production-server smoke test. Aligning Render's build command with CI is still a dashboard action; a repository commit cannot change a manually configured service unless Render is configured to consume a Blueprint.

## Release gates

A candidate revision must pass, in order:

1. Locked dependency installation with `npm ci`.
2. TypeScript validation with `npm run lint`.
3. Automated tests with `npm test`.
4. Production build with `npm run build`.
5. Start the built server using the same entry point as production.
6. Verify `GET /health` returns the expected service identity.
7. Verify malformed API input is rejected with HTTP 400.
8. Review dependency audit output and known advisory exceptions.
9. Review the Netlify Deploy Preview separately if that integration is still enabled.
10. Merge only after all required checks are green; then verify the Render deployment and production health endpoint.

## Provider and runtime checks

- `/health` confirms process health and provider-key configuration only. It does not probe Yahoo Finance, FRED, Finnhub or Gemini.
- Yahoo Finance is an unofficial upstream dependency. Quote failures and stale data must remain explicit; never substitute server fetch time for the provider's observation timestamp.
- Optional FRED, Finnhub and Gemini integrations require server-side environment variables. Missing credentials should produce explicit unavailable states, not fake values.
- Render Free instances may sleep. Distinguish cold starts from crashes and failed builds.
- Check Render deploy logs, runtime logs, and the health endpoint separately. A successful build does not prove that all providers are operational.


## Netlify preview versus Render backend

The production architecture remains Render full-stack: the Express process serves the React build, REST API and WebSocket from one origin. A Netlify static preview is a separate frontend host and must not be treated as production.

This repository now includes `netlify.toml` with:
- `npm ci && npm run build` as the build command and `dist` as the publish directory.
- A forced same-origin REST proxy from `/api/*` to the Render API.
- An SPA fallback to `/index.html`.

The browser WebSocket is not proxied by that REST rewrite. `netlify.toml` now sets the public build variable `VITE_WS_URL=wss://vymx-trade-terminal-2.onrender.com/api/prices`, so no secret or dashboard-only build variable is required for that endpoint. On the Render service, set `WEBSOCKET_ALLOWED_ORIGINS` to the exact Netlify production origin plus its narrowly scoped deploy-preview pattern. If the Netlify production hostname is `https://vymxtrade.netlify.app`, the value is `https://vymxtrade.netlify.app,https://deploy-preview-*--vymxtrade.netlify.app`; verify the site's actual primary hostname in Netlify before saving. Do not use a broad `*.netlify.app` allowlist. Redeploy Render after changing its server variable; Netlify rebuilds when the repository config changes.

Validation for a Netlify preview:
1. Open `/api/health` on the preview domain and confirm it returns `service: vymx-api`.
2. Confirm `POST /api/prices` returns a provider-backed quote or an explicit partial/unavailable response.
3. Confirm the browser establishes `wss://vymx-trade-terminal-2.onrender.com/api/prices`, receives a price update, and completes heartbeat ping/pong.
4. Confirm the browser console has no CORS, mixed-content, WebSocket 403, or repeated reconnect errors.

A Netlify Deploy Preview is not production. Production remains the Render service and must pass its own health, REST and WebSocket checks. Do not infer Render health from Netlify status or vice versa.


## API edge protections

The Express service now enables Helmet headers (CSP remains disabled pending an explicit external-widget allowlist), compression, a 32 KB JSON body limit, one trusted Render proxy hop, a default 240-request/minute per-IP API limit, and a 15-request/minute AI-route limit. Health/status probes are excluded from the general API limit. CI smoke tests assert the security header and verify that malformed API input returns 400 and a second request at a deliberately low test limit returns 429.

The rate-limit store is process-local. It must be replaced with a shared store before horizontally scaling the service. WebSocket upgrades bypass Express middleware but enforce same-origin or explicit allowlisted-origin checks, a 20-connection cap, a 100-distinct-symbol aggregate cap, and a 4 KB frame limit. CI smoke tests verify same-origin, exact allowlisted-origin, wildcard deploy-preview-origin and denied-origin behavior, including heartbeat ping/pong.

## GitHub branch protection

The connected GitHub integration returned no repository rulesets, but the branch-protection endpoint itself denied access to this integration. Therefore, protection on `main` has **not** been independently verified or changed by this remediation.

Before merging, verify the repository's Settings → Branches / Rulesets configuration and require:
- Pull requests before merging to `main`.
- Successful `CI / Typecheck, tests, build and dependency audit` checks.
- Successful CodeQL analysis checks.
- No force pushes or branch deletion on `main`.
- Conversation resolution before merge.

Do not treat a green PR run as a substitute for protecting the default branch against direct pushes.

## Firebase operations are separate

- Deploying the Node service does not deploy Firestore security rules.
- The repository contains `firestore.rules`; rules must be deployed through the Firebase deployment process and verified with the Firebase Emulator before production rollout.
- The 90-day `expiresAt` field does not activate Firestore TTL by itself. A TTL policy must be enabled for the `portfolioIntradaySnapshots` collection group in Google Cloud/Firebase.
- Do not claim retention or rules enforcement is active until the cloud configuration is independently verified.

## Dependency vulnerability policy

The initial November 2, 2026 audit reported 27 advisories (2 critical, 17 high and 8 moderate). The release-readiness branch has since upgraded `yahoo-finance2` to v4.0.6, initialized its client instance, and pinned patched transitive versions of `@grpc/grpc-js` (1.14.7) and `postcss-selector-parser` (6.1.6). The regenerated lockfile passed `npm ci`, typecheck, tests and production build. The follow-up `npm audit` gate completed successfully with zero critical, high or moderate advisories; this does not assert that there are no low or informational notices. Dependabot configuration is included to keep future updates visible.

Do not run `npm audit fix --force` as a blanket response. It proposed incompatible Firebase and Yahoo Finance changes for the original vulnerable tree. Continue to review each new advisory by affected version, dependency path, exploitability, fixed version and compatibility, then rerun the complete release gates.

## Evidence still required

- Individual Render logs for every failed deployment in the dashboard history.
- Render environment-variable names/configuration (never paste secret values into issues or chat).
- Confirmation that Render's dashboard build/start/health settings match this runbook.
- Production smoke checks for provider reachability and WebSocket lifecycle.
- Confirmation of deployed Firestore rules and TTL policy.

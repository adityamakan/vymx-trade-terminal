# Deployment and release runbook

## Production topology

- Render web service: `vymx-trade-terminal-2`
- Production source: GitHub repository `adityamakan/vymx-trade-terminal`, branch `main`
- Node runtime: `22.19.0` (pinned in `.node-version`)
- Application start command: `npm start` (runs `node dist/server.cjs`)
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

The GitHub repository also reports Netlify Deploy Preview checks. The frontend currently calls same-origin `/api/*` REST routes and opens a same-origin `/api/prices` WebSocket. The repository does not contain a Netlify Functions or proxy configuration, while the Express API and WebSocket server are started by `server/server.ts` on Render.

Therefore, a Netlify static preview can build the frontend but will not automatically provide the Express API or WebSocket service. Unless the Netlify project dashboard has an external proxy/function configuration not represented in this repository, API-backed features in a Netlify preview will not work. Choose one explicit approach:

- Use Render as the single full-stack deployment and treat Netlify preview as non-production/disabled; or
- Configure a documented REST proxy to Render and a separately supported WebSocket route, then test both. A REST-only rewrite is not sufficient for live WebSocket quotes.

A Netlify Deploy Preview failure is a separate check from the Render production deployment. Inspect its Netlify build log independently; do not interpret it as proof that Render production is down.


## API edge protections

The Express service now enables Helmet headers (CSP remains disabled pending an explicit external-widget allowlist), compression, a 32 KB JSON body limit, one trusted Render proxy hop, a default 240-request/minute per-IP API limit, and a 15-request/minute AI-route limit. Health/status probes are excluded from the general API limit. CI smoke tests assert the security header and verify that malformed API input returns 400 and a second request at a deliberately low test limit returns 429.

The rate-limit store is process-local. It must be replaced with a shared store before horizontally scaling the service. WebSocket upgrades bypass Express middleware but have independent same-origin checks, a 20-connection cap, a 100-distinct-symbol aggregate cap, and a 4 KB frame limit. CI smoke tests verify a same-origin handshake and ping/pong response.

## Firebase operations are separate

- Deploying the Node service does not deploy Firestore security rules.
- The repository contains `firestore.rules`; rules must be deployed through the Firebase deployment process and verified with the Firebase Emulator before production rollout.
- The 90-day `expiresAt` field does not activate Firestore TTL by itself. A TTL policy must be enabled for the `portfolioIntradaySnapshots` collection group in Google Cloud/Firebase.
- Do not claim retention or rules enforcement is active until the cloud configuration is independently verified.

## Dependency vulnerability policy

The November 2, 2026 CI audit artifact reported 27 advisories: 2 critical, 17 high and 8 moderate. It included vulnerable direct dependencies and transitive dependencies. The raw report is retained as a CI artifact for 14 days.

Do not run `npm audit fix --force` as a blanket response. In particular, the report proposed major-version changes for Firebase and Yahoo Finance dependencies. Triage each advisory by affected version, dependency path, exploitability, fixed version and compatibility; upgrade in controlled batches and rerun the complete release gates.

## Evidence still required

- Individual Render logs for every failed deployment in the dashboard history.
- Render environment-variable names/configuration (never paste secret values into issues or chat).
- Confirmation that Render's dashboard build/start/health settings match this runbook.
- Production smoke checks for provider reachability and WebSocket lifecycle.
- Confirmation of deployed Firestore rules and TTL policy.

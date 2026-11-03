# Security policy

## Supported deployment posture

VYMX is a research dashboard and simulated-trading sandbox. It does not route real orders and must not be represented as a broker, exchange, investment adviser, or production trading venue.

## Reporting a vulnerability

Do not publish exploitable details, credentials, API keys, Firebase service-account files, personal data, or proof-of-concept payloads in a public issue. Use GitHub's private vulnerability reporting feature for this repository where available. Include:

- affected commit, branch, route, component, or dependency;
- impact and realistic attack prerequisites;
- reproducible steps with test accounts and synthetic data only;
- suggested mitigation, if known.

Rotate any credential that may have been exposed. Removing a secret from the latest commit does not invalidate it or erase it from Git history.

## Security invariants

- Firebase Authentication is the authoritative identity provider for cloud-backed user data. Local guest mode is not a verified identity.
- Firestore rules must enforce ownership and schema constraints. Client-side checks are not authorization.
- Provider credentials must remain server-side and must never be exposed through `VITE_*` variables.
- Missing, stale, invalid, or unavailable provider observations must be represented as unavailable; do not substitute fabricated financial data.
- Simulated portfolio transactions are not real orders or withdrawable funds.
- Browser-local checksums or integrity markers are not cryptographic security controls.

## Dependency vulnerability handling

The CI workflow produces an npm audit report as an artifact and workflow summary. This is initially report-only so that existing advisories can be assessed without blindly applying breaking upgrades.

For each advisory:

1. Identify the direct dependency and full transitive dependency path.
2. Confirm whether the affected code is present in the production bundle or server runtime.
3. Check the patched version and semver compatibility.
4. Upgrade the narrowest safe dependency range and regenerate `package-lock.json` with the supported Node/npm toolchain.
5. Run typecheck, tests, production build and runtime smoke tests.
6. Review the diff and audit output before merging.

Do not use `npm audit fix --force` as an automatic remediation strategy.


## API edge protections

The API applies Helmet security headers (with CSP and cross-origin resource policies left disabled until the external-widget policy is explicitly reviewed), response compression, a 32 KB JSON body limit, a per-IP API limit of 240 requests/minute, and a separate 15 requests/minute limit for the generic AI route. The health/status probes are excluded from the general API limit. The service trusts one reverse-proxy hop, matching the current Render topology.

The rate-limit store is in-memory and therefore process-local. It is suitable as a basic single-instance abuse-control layer, not a distributed quota system. Before horizontal scaling, move counters to a shared store (for example Redis) and verify trusted-proxy configuration for the complete ingress chain. WebSocket upgrades are not covered by Express HTTP middleware. They have independent same-origin checks for browser clients, a 20-connection process cap, a 100-distinct-symbol aggregate subscription cap, and a 4 KB frame limit. These are per-process safeguards, not a distributed quota.

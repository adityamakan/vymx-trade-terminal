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

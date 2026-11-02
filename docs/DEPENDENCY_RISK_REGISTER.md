# Dependency vulnerability risk register

## Baseline

Source: the repository's `npm audit --json` artifact generated on November 2, 2026 from the current lockfile at that time.

| Severity | Count |
|---|---:|
| Critical | 2 |
| High | 17 |
| Moderate | 8 |
| **Total** | **27** |

These are dependency advisory matches, not proof that every vulnerable code path is reachable in VYMX. The audit must be evaluated against dependency paths, runtime exposure, feature usage, and available patched versions.

## Critical

| Package | Locked version | Dependency path | Initial response |
|---|---:|---|---|
| `dompurify` | 3.4.11 | Optional dependency of `jspdf` | Move to a patched compatible release; test PDF export and any HTML sanitization paths. |
| `proxy-addr` | 2.0.7 | Express and nested Express dependency | Update to patched 2.0.8+ within compatible ranges; test proxy/IP handling and rate limiting. |

## High

| Package | Locked version | Dependency path | Initial response |
|---|---:|---|---|
| `@firebase/firestore` | 4.16.0 | `firebase` | Review Firebase SDK release path; audit suggests a major-version change, so do not downgrade blindly. |
| `@firebase/firestore-compat` | 0.4.11 | `firebase` | Same Firebase migration track. |
| `@grpc/grpc-js` | 1.9.16 | `@firebase/firestore` | Firebase currently constrains this dependency; test any override in the Firebase Emulator before use. |
| `@modelcontextprotocol/sdk` | 1.29.0 | `yahoo-finance2`; peer dependency of `@google/genai` | Update to a patched 1.x version if compatible with both parents; add adapter tests. |
| `body-parser` | 1.20.5 and nested 2.3.0 | Express and nested MCP Express | Update within each parent's supported range; verify JSON parsing and body-size limits. |
| `browserslist` | 4.28.2 | Build tooling | Update compatible lockfile resolution and rerun Vite build. |
| `compression` | 1.8.1 | Direct dependency | Update to patched 1.8.2+ and test streamed/closed responses. |
| `fast-uri` | 3.1.2 | `ajv` | Update compatible transitive version; run schema validation tests. |
| `firebase` | 12.15.0 | Direct dependency | Do not accept the audit tool's suggested major downgrade without evaluating Firebase Auth/Firestore compatibility. |
| `ip-address` | 10.2.0 | `express-rate-limit` | Update within compatible range; verify IP parsing and proxy behavior. |
| `nanoid` | 3.3.12 | `postcss` | Update compatible lockfile resolution. |
| `postcss` | 8.5.15 | Vite/autoprefixer | Update within Vite's supported range; run full production build. |
| `source-map-js` | 1.2.1 | PostCSS/Tailwind | Update to patched compatible version. |
| `undici` | 7.29.0 | `cheerio` | Update to patched compatible version; test provider HTTP requests and HTML parsing. |
| `vite` | 6.4.3 | Direct dependency | Update to a patched compatible 6.x release and verify plugin compatibility. |
| `yahoo-finance2` | 3.15.4 | Direct dependency | v3 emitted a deprecation warning in CI. Plan a tested v4 migration or a temporary safe pin; verify quote/chart/quoteSummary behavior. |
| `zod` | 3.25.76 | MCP SDK, Yahoo Finance adapter, schema tooling | Audit parent compatibility before moving to v4; do not force a major upgrade. |

## Moderate

| Package | Locked version | Dependency path | Initial response |
|---|---:|---|---|
| `@hono/node-server` | 1.19.14 | MCP SDK | Update compatible transitive version. |
| `@tailwindcss/typography` | 0.5.20 | Direct dependency | Review patched release or tested parser override; audit's suggested downgrade is not an acceptable automatic fix. |
| `baseline-browser-mapping` | 2.10.37 | Browserslist | Update compatible build-tool dependency. |
| `fflate` | nested 0.6.x | `three-stdlib` | Update `three-stdlib`/nested dependency or use a tested override; verify 3D rendering and archive/PDF features. |
| `hono` | 4.12.25 | MCP SDK | Update compatible transitive version. |
| `postcss-selector-parser` | 6.0.10 | Tailwind typography | Verify compatible patched 6.x version or update parent package. |
| `protobufjs` | 7.6.4 | Gemini SDK / gRPC tooling | Update within compatible range; run AI integration smoke tests. |
| `qs` | 6.15.2 | Express/body-parser and nested Express | Update compatible version; test query parsing and request validation. |

## Safe remediation sequence

1. Create a dedicated dependency-maintenance branch.
2. Apply non-breaking lockfile updates first; do not use `npm audit fix --force`.
3. Review the resulting lockfile diff and verify that no major downgrade or unexpected package substitution occurred.
4. Run `npm ci`, `npm run lint`, `npm test`, `npm run build`, and the production-server smoke test.
5. Test Firebase Auth/Firestore behavior in the Firebase Emulator before changing Firebase SDK or gRPC dependency versions. Authentication implementation remains out of scope for the current remediation.
6. Test quote, historical chart, and financial-statement adapters before changing `yahoo-finance2`.
7. Re-run `npm audit --json` and compare counts and advisory paths. Record any accepted residual risk with an owner and review date.
8. Only then merge the lockfile update.

## Important limitation

The report-only CI step records advisories but does not make the application secure by itself. The current audit findings remain open until a patched lockfile has been committed and the release gates pass. A successful build alone does not close a dependency vulnerability.


## Post-remediation candidate audit (November 2, 2026)

A non-forced `npm audit fix --package-lock-only` candidate was generated, installed with `npm ci`, and passed TypeScript validation, the automated test suite, and the production build before being committed to the remediation branch.

| Severity | Baseline | Validated candidate |
|---|---:|---:|
| Critical | 2 | 0 |
| High | 17 | 6 |
| Moderate | 8 | 4 |
| **Total** | **27** | **10** |

The candidate resolves the two critical findings (`dompurify` and `proxy-addr`) and several high/moderate transitive advisories through compatible lockfile updates. The lockfile-only change leaves `package.json` ranges unchanged. Firebase SDK packages moved within the existing 12.x major line; authentication source code was not modified. A real Firebase sign-in/Firestore runtime regression test has not yet been performed.

### Residual advisories

- **High:** `firebase`, `@firebase/firestore`, `@firebase/firestore-compat`, `@grpc/grpc-js`, `yahoo-finance2`, `zod`.
- **Moderate:** `@tailwindcss/typography`, `postcss-selector-parser`, `express`, `qs`.

The audit tool proposes a major Firebase downgrade and a Yahoo Finance downgrade for some residual findings. Those are not accepted automatically. Firebase needs an Emulator-backed compatibility review; Yahoo Finance needs a controlled adapter migration or a separately tested safe pin. Tailwind's suggested downgrade is also not accepted without visual/build regression testing.

**Status:** Critical advisories reduced to zero in the candidate lockfile; 10 residual advisories remain open. This is risk reduction, not a claim of zero vulnerabilities.

## Context

`resolveAppRunnerScheme` is the shared async resolver used when the App Runner picker changes an application's source and when the Parameters tab loads the selected runner. It already branches by origin: Platform runners require an asset-content read through Core so resolution uses the runner's current declared `$id`; Config and originless runners currently always call the Admin Backend resolver.

The Admin Backend resolver returns an envelope with its schema at `response.schema`. Core's `v1/application_type_schemas/schema` endpoint returns the resolved schema directly at `response`. When `DIAL_ADMIN_API_URL` is not configured, only Core is callable.

## Goals / Non-Goals

**Goals:**

- Keep Platform resolution behavior and its content-id correction unchanged.
- Use the Admin Backend resolver for Config-origin resolution when it is configured.
- Use Core's resolver for Config-origin and originless resolution when the Admin Backend is unavailable.
- Preserve the existing unresolved-runner fallback for failed resolution requests.

**Non-Goals:**

- Add resolver retries, cross-service fallback after a configured request fails, or changes to backend endpoints.
- Change runner origins, option construction, picker UI, or persisted application-source identifiers.

## Decisions

### Select the resolver after the Platform-origin branch

The existing Platform branch remains first and returns before environment-based routing. It must always read Core asset content by storage path and resolve through Core with that content's current `$id`; `DIAL_ADMIN_API_URL` does not affect this path.

For all other runners, evaluate `process.env.DIAL_ADMIN_API_URL` using the repository's established truthiness convention. A non-empty value selects `getResolvedApplicationScheme`; an absent or empty value selects `getResolvedRunnerSchema`.

**Alternative considered:** Route all origins by environment. Rejected because Platform runners are Core assets and their resource content and correct resolution key are Core-owned regardless of Admin Backend availability.

### Normalize the two response contracts inside the shared resolver

The Admin Backend branch extracts `response.schema`; the Core branch uses `response` as the `DialApplicationScheme`. Both branches return the original runner as `scheme` when their selected call fails. Callers retain one normalized `{ runner, scheme }` contract and need no knowledge of service availability or response shapes.

**Alternative considered:** Change `getResolvedRunnerSchema` to wrap its direct response in `{ schema }`. Rejected because that action correctly exposes Core's native response contract and is already consumed by Platform resolution.

### Prove environment selection with the existing focused resolver spec

Extend `resolve-app-runner.spec.ts` with isolated environment setup/cleanup and resolver mocks. Verify Config-origin resolution with Admin URL configured, with the URL absent or empty, and failure fallback for each path; retain the Platform tests to prove that environment state does not alter it.

## Risks / Trade-offs

- **[Risk]** Environment state can leak between tests and select the wrong branch. → **Mitigation:** explicitly stub and restore `DIAL_ADMIN_API_URL` in the resolver spec.
- **[Risk]** Mixing response shapes can leave `scheme` undefined on a successful Core call. → **Mitigation:** assert both BE-envelope and Core-direct success results in focused tests.
- **[Risk]** A configured but unavailable Admin Backend will not fall back to Core. → **Mitigation:** this is intentional: configuration declares the authoritative resolver, and the existing unresolved-runner fallback preserves selection behavior without concealing a deployment failure.

## Migration Plan

No data migration or rollout sequencing is required. Deploying the frontend enables Core-only resolution automatically whenever `DIAL_ADMIN_API_URL` is not provided. Rollback is the normal frontend rollback.

## Open Questions

None.

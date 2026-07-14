## Context

`ApplicationResourceController`/`ApplicationEximService` is structurally identical to the already-ported `ToolSetResourceController`/`ToolSetEximService`: same `ResourceEximExportHelper.resolveExportEntries` path resolution, same aggregate-document shape (`ApplicationsExim(List<ApplicationExim>)`), same uniqueness-conflict-then-`OVERRIDE`/`SKIP` import flow, same four endpoints (`/export`, `/export/json`, `/import/zip`, `/import/json`). `ApplicationEximDto`/`ApplicationExim` carry no credential-like fields, so — unlike toolsets — there's nothing to consider redacting either way. The FE's `ParsedAssets.applications: AssetApp[]` (`src/models/import-asset.ts`) is the existing client-side contract, already handled by `isInvalidJson`/`getFormDataForImport`'s application branch (which optionally rewrites an `id` field the same way as prompts/toolsets, though — unlike prompts — an id isn't strictly required for the FE's own review-grid logic to function).

`validityState` and discovered-tools/try-out-tool are explicitly out of scope (see proposal's Why) — the former dropped for lack of any clean migration path, the latter deferred pending confirmation of Core's deployment-name-addressed endpoints for applications (materially different addressing than toolsets' bucket-path-addressed ones).

## Goals / Non-Goals

**Goals**
- Application JSON/zip export produces `{ applications: AssetApp[] }`, matching the FE's existing `ParsedAssets` contract.
- Application JSON/zip import applies `OVERRIDE`/`SKIP` conflict resolution against Core's live state, reusing the circuit breaker and zip path-traversal guard already generalized for Files/Prompts/Toolsets.
- `validityState` is cleanly removed from the asset-application read path, with no dangling BE call.

**Non-Goals**
- Discovered-tools / try-out-tool for applications.
- Any replacement mechanism for `validityState`.
- Any change to the `{ applications: AssetApp[] }` wire shape.

## Decisions

### D1 — Application import/export reuses the Toolsets exim pattern verbatim, swapping the field name and type
`buildApplicationsExport`/`importApplicationsExport`/`mergeApplicationsExports` in `src/server/applications/exim.ts`/`zip-exim.ts` mirror `src/server/toolsets/exim.ts`/`zip-exim.ts` structurally byte-for-byte apart from operating on `ParsedAssets.applications`/`AssetApp`/`ResourceType.APPLICATION`/`RESOURCE_TYPE_PREFIX[APPLICATION]` instead of the toolset equivalents, and zip entry `applications/applications.json` instead of `toolSets/toolSets.json`. No secret redaction logic is needed at all (there's nothing to redact).

### D2 — `withValidityState` removed, not stubbed
Rather than leaving a no-op stub or a `TODO`, `withValidityState` and its call site in `getApp` are deleted outright. `validityState` becomes `undefined` for asset applications going forward — the same as it already effectively is today for every other read path (list rows, create, update never populated it; only the single-`getApp` Phase-1 seam did, and confirmed via grep, no component under `src/components/Assets/` reads this field).

## Risks / Trade-offs

- **[Risk] `validityState` removal is a real (if currently invisible) feature regression** — if a future UI change starts reading `AssetApp.validityState`, it will silently always be `undefined` for asset applications. Accepted per explicit user decision; the field stays declared as optional on the shared `EntityValidityState`/`DialApplication` models (used by unrelated entity types), so no type-level signal is lost, but there's no runtime guard against this being reintroduced by mistake.

## Migration Plan

1. Implement `src/server/applications/exim.ts`/`zip-exim.ts` (D1), with unit tests mirroring the toolsets test suite's coverage.
2. Remove `withValidityState`/its call site (D2).
3. Wire `importApps`/`exportApps` to the new implementations.
4. Targeted test pass for all new/touched modules.

## Open Questions

None outstanding — `validityState` disposition and discovered-tools/try-out-tool scoping both confirmed with the user.

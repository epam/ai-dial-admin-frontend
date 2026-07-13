## Why

Application import/export are the last operations on the well-understood, fully-portable side of the applications migration. Reverse-engineering `ApplicationResourceController`/`ApplicationEximService` confirms it's structurally identical to the already-migrated toolsets/prompts pattern: a structured `{ applications: AssetApp[] }` aggregate JSON document (the FE's existing `ParsedAssets.applications` shape), zip export wraps that document as a single entry, `OVERRIDE`/`SKIP` conflict resolution. Unlike toolsets, applications carry no credential-like fields (`ApplicationEximDto`/`ApplicationExim` have nothing analogous to `authSettings.clientSecret`), so there's nothing to redact either way.

**Explicitly out of scope, split into follow-ups (confirmed with the user):**
- **Discovered-tools and try-out-tool**: applications are addressed in Core differently than toolsets — try-out-tool's Core endpoint is deployment-name-addressed (`v1/deployments/{deploymentName}/mcp`), not the bucket-path-addressed `v1/toolset/{path}/mcp` toolsets used, and discovered-tools' exact Core REST shape for applications isn't yet confirmed. Deferred to a follow-up once verified, rather than guessing at unverified endpoint shapes.
- **`validityState`**: the BE computes this via a fully admin-authored, BE-database-only `ApplicationTypeSchema` table (zero seed data, no Core equivalent) validated with a JSON-schema library. There is no clean migration path — bundling schemas client-side would lose admin editability, and there's no "default" set to bundle anyway. Confirmed with the user: **drop `validityState` entirely** rather than keep the BE dependency indefinitely. This is a real (but effectively invisible) regression — no component under `src/components/Assets/` currently reads or renders `validityState`, so removing the current Phase-1 workaround (`withValidityState` in `assets-applications/actions.ts`, which calls the still-alive BE `assetsApi.getAsset` purely for this field) has no observed UI impact.

## What Changes

- **Port `importApps`/`exportApps`** (`src/app/[lang]/assets-applications/actions.ts`) off `assetsApi.importAssets`/`exportAssets` onto a new `{ applications: AssetApp[] }`-based Core-direct implementation, mirroring `src/server/toolsets/exim.ts`/`zip-exim.ts` exactly:
  - Export: fetch merged content+metadata per selected path via `assetApi.getMerged`, set each application's `id` to its Core-prefixed path, return `{ applications: [...] }` for JSON, or wrap it as a single `applications/applications.json` zip entry for archive export.
  - Import: parse the uploaded document (JSON or zip-wrapped), resolve per-application conflicts against Core directly, apply `OVERRIDE`/`SKIP`, `assetApi.put` each accepted application. Reuse the same consecutive-failure circuit breaker and zip path-traversal guard already generalized for Files/Prompts/Toolsets.
- **Remove the `validityState` Phase-1 seam**: delete `withValidityState` and its call site in `getApp`; `validityState` is no longer populated for asset applications (the field stays optional on the `AssetApp`/`DialApplication` models — those are shared with other, unrelated entity types this change doesn't touch).

## Capabilities

### Modified Capabilities
- `application-resources-core-api`: adds application JSON/zip export and JSON/zip import, executed directly against DIAL Core, replacing the admin-BE proxy for these operations. Formally documents `validityState` as dropped (not deferred) for asset applications, and discovered-tools/try-out-tool as deferred pending Core endpoint verification.

## Impact

- **Modified code:**
  - `src/app/[lang]/assets-applications/actions.ts` — `importApps`, new-signature `exportApps` re-pointed to Core-direct logic; `withValidityState`/its call site in `getApp` removed
  - New: `src/server/applications/exim.ts`, `src/server/applications/zip-exim.ts` — mirrors `src/server/toolsets/exim.ts`/`zip-exim.ts`
- **Unchanged:** `ImportModal`/`ExportModal` UI, `ConflictResolutionPolicy` enum, the `{ applications: AssetApp[] }` wire shape, `getApps`/`createApp`/`updateApp`/`removeApp`/`bulkDeleteApps`/`moveApps`/`getAssetTools` (discovered-tools stays on the BE, unaffected by this change).
- **Removed:** `assetsApi.importAssets`/`exportAssets`/`getAsset` (the validityState-only call) become unreferenced for applications for these specific operations (class itself untouched — `getAssetTools`/`tryOutAssetTool`'s `APPLICATION` branch and the deployment-config `applications` domain still use it).

## Non-goals

- Discovered-tools / try-out-tool for applications (separate follow-up, pending Core endpoint verification).
- `validityState` for asset applications (dropped, not deferred — see Why).
- Any change to the `{ applications: AssetApp[] }` wire shape.
- The deployment-config `Applications` domain (a separate entity type from Assets/Applications, entirely unaffected).

## Why

Phase 4 of the TypeScript SDK migration (#5634, epic #5629). Phases 1-3 moved settings, deployments and publications
onto `@epam/ai-dial-typescript-sdk`. What remains of the platform-entity surface is `AssetApi`
(`src/server/core/asset-api.ts`): one generic client that builds `v1/{prefix}/{path}` and `v1/metadata/{prefix}/{path}`
URLs for every `ResourceType` from two lookup maps in `src/constants/assets-core.ts`. About 40 files call it, directly or
through `EnrichmentClients` (listed in the design's caller audit). The SDK has no generic call; it has one operation per type and verb, each taking
`(bucket, path)`, so the migration needs a dispatch seam, not a find-and-replace. The issue asks for one PR per entity
group, which this umbrella change plans; each group is its own OpenSpec change.

## What Changes

- Add a typed per-type **SDK op table** beside `asset-api.ts`: for each mapped `ResourceType`, one thin typed closure per
  verb (content get, metadata get, save, delete) such as `(sdk, bucket, path, init) => sdk.getModelByPath(bucket, path, init)`.
  `AssetApi` routes a mapped type through `sdkGet` / `sdkAction` and falls back to the hand-written URL for an unmapped one.
  `AssetApi`'s public methods, `ASSET_MERGERS`, `fetchAllPages`, the etag header helpers and the prompt `id` injection stay.
- Migrate in **five PRs**, each its own OpenSpec change, in this order:
  1. `core-sdk-assets-seam`: the table, the DELETE adapter fix (#5642), `Partial` URL maps, the path-encoding fixture spec,
     the 304 equivalence spec, and `MODEL`.
  2. `core-sdk-assets-platform-config`: `ROUTER`, `ROLE`, `ROUTE`, `PROJECT_KEY`, `INTERCEPTOR`, `TRANSLATOR`, `PLUGIN`,
     `APP_TYPE_SCHEMA`, `CATALOG_SCHEMA`.
  3. `core-sdk-assets-policies`: `POLICY`, `POLICY_ASSIGNMENT`.
  4. `core-sdk-assets-folder-nested`: `PROMPT`, `CONVERSATION`, `ALIAS`.
  5. `core-sdk-assets-versioned`: `APPLICATION`, `TOOLSET` (platform vs custom operations), `moveResource`, and the
     removal of both URL maps and the URL fallback.
- Each PR deletes the entries it migrated from `CORE_RESOURCE_URL` / `CORE_RESOURCE_METADATA_URL` and the admin DTOs that only
  duplicate that group's SDK content type. Each PR carries a MODIFIED `core-client` requirement ("Calls the SDK cannot
  express stay on the hand-written client"): the whole block copied, the list extended, every scenario name kept.
- URLs stay byte-identical: SDK 0.3.1 encodes a space and non-ASCII letters but leaves `%`, `+`, `?` and `#` raw, so the
  table still passes `encodeCorePath(path)` as before; an encoded path goes through the SDK unchanged.
- `PLUGIN` has SDK operations since 0.3.1 (`getPlugin`, `savePlugin`, `deletePlugin`, `getPluginMetadata`) and migrates in
  PR 2. `FILE`, `SKILL` and `PROJECT` reach `AssetApi` only through `move`, so they get no SDK op row; their URL-map entries
  are unreachable and go when PR 5 deletes the maps (Phase 6 owns files and skills).
- Terms used across the group changes: an **op row** is a type's entry in the new SDK op table; a **URL entry** is a type's
  entry in `CORE_RESOURCE_URL` / `CORE_RESOURCE_METADATA_URL`.

This umbrella change itself modifies no behavior and carries no spec delta (`skip_specs`); the five group changes do.

**Non-goals:** `ConfigFileApi`, `CatalogSchemasApi`, `AppRunnerSchemaApi` and `ComplexResourceCoreApi` (recorded as
out-of-scope follow-ups so the epic does not drop them); the `/v1/ops/toolset/*` and external-service endpoints
(Phase 5; `TOOLSET` content and metadata through `AssetApi` is in scope, PR 5); files and
skills (Phase 6); the `GlobalSettings` DTO cleanup (#5640); the `BaseApi` non-JSON 2xx fix (#5638); fixing the existing
encode-at-caller inconsistencies; any UI change.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
None in this change. The group changes modify `core-client` (every PR) and `core-asset-client` (where a requirement's
transport wording changes).

## Impact

- Code: `src/server/core/asset-api.ts`, a new op-table file in `src/server/core/`, `core-api.ts` (DELETE and 304 handling),
  `src/constants/assets-core.ts`, `src/types/resource-type.ts` (stale `ROLE` "read-only" comment), admin DTOs under
  `src/models/` per group. Callers of `AssetApi` keep their signatures; return types widen to `| null | undefined`
  where a 403 reaches them.
- Specs: `core/tests/asset-api.spec.ts` is rewritten per migrated type against the real SDK; `publications-enrichment`,
  exim, move and bulk-delete specs are the regression net.
- Dependencies: none new; `@epam/ai-dial-typescript-sdk` is `^0.3.1` (bumped from `^0.2.1` ahead of this change, which
  adds the plugin operations; the existing code type-checks unchanged).
- Risk: URL drift for ids with reserved characters (guarded by the fixture spec), and `platform`-bucket dispatch for
  applications and toolsets (recorded in the design, pinned by a spec).

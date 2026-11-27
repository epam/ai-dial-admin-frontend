## Why

PR 2 of the Phase 4 umbrella `core-sdk-assets` (#5634, epic #5629; decisions D1-D9 live in the umbrella `design.md`).
PR 1 (`core-sdk-assets-seam`, #5699) built the `AssetApi` op table and proved it on `MODEL`. Nine more flat
platform-bucket types use the same shape (content `v1/{prefix}{name}`, metadata `v1/metadata/{prefix}{name}`, bucket
`platform`, no folders, no version) and have a one-to-one SDK operation per verb, so they move as table rows with no new
mechanism: `ROUTER`, `ROLE`, `ROUTE`, `PROJECT_KEY`, `INTERCEPTOR`, `TRANSLATOR`, `PLUGIN`, `APP_TYPE_SCHEMA` and
`CATALOG_SCHEMA`.

## What Changes

- Nine rows in `ASSET_SDK_OPS` (`server/core/asset-sdk-ops.ts`), each four closures over the SDK operations below, bucket
  `platform`, the path passed already encoded with `encodeCorePath`:

  | Type | Content get | Metadata get | Save | Delete |
  | --- | --- | --- | --- | --- |
  | `ROUTER` | `getPlatformRouter` | `getRouterMetadata` | `savePlatformRouter` | `deletePlatformRouter` |
  | `ROLE` | `getRole` | `getRoleMetadata` | `saveRole` | `deleteRole` |
  | `ROUTE` | `getRoute` | `getRouteMetadata` | `saveRoute` | `deleteRoute` |
  | `PROJECT_KEY` | `getKey` | `getKeyMetadata` | `saveKey` | `deleteKey` |
  | `INTERCEPTOR` | `getInterceptor` | `getInterceptorMetadata` | `saveInterceptor` | `deleteInterceptor` |
  | `TRANSLATOR` | `getTranslator` | `getTranslatorMetadata` | `saveTranslator` | `deleteTranslator` |
  | `PLUGIN` | `getPlugin` | `getPluginMetadata` | `savePlugin` | `deletePlugin` |
  | `APP_TYPE_SCHEMA` | `getSchema` | `getSchemaMetadata` | `saveSchema` | `deleteSchema` |
  | `CATALOG_SCHEMA` | `getCatalogSchemaResource` | `getCatalogSchemaMetadata` | `saveCatalogSchemaResource` | `deleteCatalogSchemaResource` |

- **`ROUTER` uses `getPlatformRouter`, not `getRouter`.** In SDK 0.3.1 `getRouter(router_name)` targets
  `/v1/routers/{router_name}`, a different endpoint with a single name parameter; `getPlatformRouter(bucket, path)` targets
  `/v1/routers/{bucket}/{path}`, the URL `AssetApi` sends today. The design records the probe that confirms it.
- `ROLE` is read and write through `AssetApi` (`platform-roles/actions.ts` uses `put`, `delete`, `getMergedWithEtag` and bulk
  delete); the comment on `ResourceType.ROLE` that calls it "read-only here" is stale and is corrected.
- The nine entries of each URL map (`CORE_RESOURCE_URL`, `CORE_RESOURCE_METADATA_URL`) in `constants/assets-core.ts` are
  deleted. No admin DTO is deleted unless it merely duplicates its SDK content type (the design records the check per type;
  PR 1's finding was that none does).
- URLs, methods, query strings, conditional headers, merge functions, listing, pagination, the `put` `_metadata` graft and the
  etag source (metadata node for these flat types) are byte-identical to today. No caller changes.
- The PR 1 specs that use `ROLE` as the still-hand-written reference type (`asset-api.spec.ts`, `asset-api-model.spec.ts`,
  `asset-sdk-ops.spec.ts`) are re-pointed at `POLICY`, which PR 3 migrates next; PR 3 picks the next reference.
- The existing `APP_TYPE_SCHEMA` and `ROUTE` listing specs in `asset-api.spec.ts` move to `CORE_TEST_URL` and read the
  sent `Request`'s `url`, because those types now go through the SDK; their assertions do not change.

**Non-goals:** `POLICY`, `POLICY_ASSIGNMENT`, `PROMPT`, `CONVERSATION`, `ALIAS`, `APPLICATION`, `TOOLSET` and `moveResource`
(PRs 3-5); `list`, `getMerged` and merge changes; `ConfigFileApi`, `CatalogSchemasApi`, `AppRunnerSchemaApi` and
`ComplexResourceCoreApi` (the follow-up issue the user files); any behavior change.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `core-client`: "Calls the SDK cannot express stay on the hand-written client" names the router, role, route, project key,
  interceptor, translator, plugin, application-type-schema and catalog-schema asset operations as SDK-backed, gains a scenario
  for them, and its "not yet routed" scenario now names a policy instead of a role.
- `core-asset-client`: "Verbatim-body resource support (app-runner)" gains a scenario that the app-runner content and
  metadata calls go through the SDK to the same endpoints with the body still sent verbatim.

## Impact

- Code: `src/server/core/asset-sdk-ops.ts` (nine rows), `src/constants/assets-core.ts` (eighteen entries deleted),
  `src/types/resource-type.ts` (comment), the `ROLE` re-point in three existing specs, and the `APP_TYPE_SCHEMA` / `ROUTE`
  listing specs in `asset-api.spec.ts` moved to `CORE_TEST_URL`. `asset-api.ts` needs no change:
  it already routes any type that has a row.
- Specs: new `core/tests/asset-api-platform-config.spec.ts` (every type, every verb, old-vs-new URL equality) beside the
  existing `asset-api-model.spec.ts`; the `platform-*` actions specs, `publications-enrichment`, `server/assets`,
  `server/folders` and `server/config-entities` as the regression net.
- Dependencies: none (SDK `^0.3.1` is already in place).

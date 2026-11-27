## Context

See `proposal.md` (Why, What Changes) and the umbrella `core-sdk-assets/design.md` (D1-D9, caller audit, SDK coverage).
PR 1 left `AssetApi` routing any type that has a row in `ASSET_SDK_OPS` through `sdkGet` / `sdkAction` / `sdkDelete` and any
other type through the URL maps. `asset-api.ts` therefore needs no change here; this PR adds rows, deletes URL entries and
moves the specs' hand-written reference type.

Facts that shape the work:

- All nine types are in `PLATFORM_BUCKET_RESOURCE_TYPES`: flat, unversioned, bucket `platform`, and `RESOURCE_TYPE_PREFIX`
  already ends in `platform/` (`routers/platform/`, `roles/platform/`, ...). So they take the platform-bucket rules of
  umbrella D4: `getMetadata` strips a leading `platform/` and an empty path lists the root (`resolveListPath`, unchanged);
  content get, save and delete send the bare name with bucket `platform`.
- Their callers are `platform-routers`, `platform-roles`, `platform-routes` (and `test-suites` listing and reading `ROUTE`),
  `platform-keys`, `platform-interceptors`, `platform-translators`, `platform-plugins`, `platform-app-runners`,
  `platform-catalog-schemas`, plus the shared `server/assets`, `server/folders`, `server/config-entities/read.ts` and
  `server/aliases/name-clash.ts`. Every one is truthiness-based on a read (`!node`, `content?.$id`, `list` / `listStrict`
  use `node == null`); none compares `=== null`, so PR 1's `| null | undefined` widening already covers them (task 1.1
  re-checks).
- These are `ConfigResourceController`-served types, none in `RESOURCE_CONTROLLER_TYPES`, so `getMergedWithEtag` keeps taking
  the etag from the metadata node. The SDK path does not change that: only the transport moved.
- SDK operations in `^0.3.1`, all `(bucket, path)` and all four verbs present for every type. The metadata operation of each
  is the one the proposal's table names; `getCatalogSchema(init)` and `getRouters` are different endpoints (a schema lookup
  by `id`, a router list) and are not used.

## Goals / Non-Goals

**Goals:**
- Every verb of the nine types reaches Core as the same method, path, query and conditional headers it does today.
- After this PR the only types without a row that `AssetApi` still serves are `POLICY`, `POLICY_ASSIGNMENT`, `PROMPT`,
  `CONVERSATION`, `ALIAS`, `APPLICATION`, `TOOLSET` and the three move-only types, so a mixed state stays safe.

**Non-Goals:**
- Anything the proposal lists as a non-goal, and a shared helper that builds a platform row from the four SDK operations
  (see D1).

## Decisions

### D1. Nine explicit rows, no row factory

Each row is four closures written out, like `MODEL`'s. A factory taking the four SDK operations as arguments would save about
forty lines, but the operations differ in body and init types, so the factory would need a generic cast per call and would
hide which SDK operation a type uses, which is the one thing a reader of the table wants. The table stays a flat list a
reader can compare with the SDK's operation names. The one cast stays on the request body (umbrella D2), applied per closure
only where the operation's body type is not `Record<string, unknown>`.

### D2. `ROUTER` is `getPlatformRouter`

`getRouter(router_name)` is `GET /v1/routers/{router_name}`; `getPlatformRouter(bucket, path)` is
`GET /v1/routers/{bucket}/{path}`, which is what `v1/routers/platform/{name}` is. The probe in task 1.2 sends one request
through each row for a plain name and asserts the URL, so a future SDK that re-targets either operation fails a spec rather
than changing the URL.

Probed on SDK 0.3.1 (task 1.2): for all nine rows, content get, one resource's metadata get, the root listing (empty path
and `platform/`), save and delete send the same method, path and query as the hand-written client's request for a
policy with the prefix swapped, and an empty path and a path ending in `/` survive for every type, so no metadata closure
needed to restore either. `getPlatformRouter` requests `/v1/routers/platform/{name}` and `getRouterMetadata`
`/v1/metadata/routers/platform/{name}`. `saveSchema` and `saveCatalogSchemaResource` type their body with a required
`$id`, so those two closures cast the body to the SDK's own `ApplicationTypeSchema` / `CatalogSchema` type (aliased in
`server/core/models.ts`, as `settings-api.ts` and `publications/models.ts` alias theirs) instead of
`Record<string, unknown>`, so a tighter SDK schema fails `typecheck` instead of passing a stale local copy; the other
seven keep the plain cast.

### D3. Paths and queries are byte-identical, pinned by the PR 1 fixture shape

Rows pass `encodeCorePath(path)` unchanged (umbrella D3). The new spec runs the PR 1 fixture cases (`100%`, `a+b`, `q?x#y`,
an existing `%20`, a space, non-ASCII, empty path, trailing `/`) per verb against the hand-written URL of a type that is
still hand-written. Two cases are specific to this group and added: an **app-runner name that is already a
percent-encoded URI**, in the real `$id` shape with an encoded `/`
(`https%3A%2F%2Fhost%2Fcustom_application_schemas%2Fchart`, which `encodeCorePath` sends as
`https%253A%252F%252Fhost%252Fcustom_application_schemas%252Fchart`; the SDK keeps an existing `%XX`, so `%25` survives
and the `%2F` never reaches Core as a path separator) and a **project key named with a space** (`keyResourceName` returns
the plain name, so this one case is what covers the key row's encoding). Both pass the SDK only because the path is
encoded first, as in PR 1.

### D4. The reference type for old-vs-new equality is `POLICY`

`asset-sdk-ops.spec.ts`, `asset-api.spec.ts` and `asset-api-model.spec.ts` use `ROLE` as the type that is still on the URL
fallback. `POLICY` replaces it: it is a platform-bucket type with a URL entry and no row until PR 3. Its one folder level
does not matter for the cases compared (a flat name and the encoding fixture), but it is not flat, so the spec titles and
comments that call the reference "a flat platform type" are reworded with the re-point. Each later group picks the next
reference among the types still hand-written when its change is written; from PR 3 on none is a platform-bucket type, so a
plain prefix swap no longer lines the two URLs up (a bucketed type sends `{prefix}{bucket}/{path}`) and that change records
how its comparison is built. PR 5 drops the equality half (umbrella decision 11). Alternative: keep a test-only
hand-written client as the reference. Rejected: it would duplicate the URL logic PR 5 deletes and outlive the migration.

The move to the SDK also changes what the existing `APP_TYPE_SCHEMA` and `ROUTE` listing specs in `asset-api.spec.ts` see:
the SDK hands `fetch` a `Request`, which rejects their relative `TEST_URL` host, and their `toContain` checks ran on a URL
string. They move to `CORE_TEST_URL` and read the request's `url`, with the same assertions (task 3.2).

### D5. Admin DTO cleanup follows the PR 1 test

A `Dial*Resource` DTO is deleted only if it duplicates its SDK content type one to one, with no admin-only field. The nine DTOs
(`DialRouterResource`, `DialRoleResource`, `DialRouteResource`, `DialKeyResource`, `DialInterceptorResource`,
`DialTranslatorResource`, `DialPluginResource`, `DialAppRunnerResource`, `DialCatalogSchemaResource`) extend the admin's
`CoreResource` / `NamedCoreResource` / `CoreDeploymentResource` bases, which carry `_metadata`, so none is a plain duplicate;
task 1.3 compares each with its SDK type and writes the result here. The expected outcome, as in PR 1, is that nothing is
deleted; if a DTO turns out to be a duplicate, it goes in this PR.

Result (task 1.3): nothing is deleted. All nine carry `_metadata` (the merge graft the SDK type has no field for); five
(`DialKeyResource`, `DialTranslatorResource`, `DialPluginResource`, `DialCatalogSchemaResource`, `DialAppRunnerResource`)
also carry a client-only `name` that Core's own type does not declare, and `DialAppRunnerResource` narrows its base with
`Omit`. None is a one-to-one duplicate of its SDK content type.

### D6. The stale `ResourceType.ROLE` comment is replaced, not just deleted

The comment says role is registered only so the metadata route can list API-written roles and that no surface writes it
through `AssetApi`. `platform-roles/actions.ts` creates, updates, deletes and reads roles through `put`, `delete`,
`getMergedWithEtag` and bulk delete. The replacement says so in one line, matching how the neighbouring entries read.

## Risks / Trade-offs

- [An SDK save operation types its body so `body as Record<string, unknown>` no longer compiles for a type] -> the closure
  narrows with the operation's own body type at that one site; `npm run typecheck` is a gate, and the cast stays on the body.
- [`getSchema` / `saveSchema` target `/v1/schemas/{bucket}/{path}`, but the SDK also exposes `/v1/application_type_schemas/*`
  lookups by `id`] -> the row uses only the `(bucket, path)` operations, and the URL assertion in the new spec fails if one
  is swapped for an id lookup.
- [The `ROLE` equality specs lose their reference type in the middle of the migration] -> D4 re-points them in this PR, so no
  commit leaves an equality spec comparing two SDK paths.
- [Behavior hidden in a type's metadata read, such as `ROUTE`'s `listStrict` use in `test-suites`] -> the regression net
  runs `test-suites` actions specs and `server/assets`, `server/folders`, `server/config-entities`.

## Migration Plan

One PR. A type with a row routes through the SDK from the first request; rollback is reverting the PR, because each type's URL
entry comes back with it and `AssetApi` falls back to it.

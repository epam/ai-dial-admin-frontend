## Context

See `proposal.md` for motivation. The pattern comes from Phases 1-3 (`2026-11-10-adopt-core-sdk-pilot`,
`2026-11-18-core-sdk-settings`, `2026-11-18-core-sdk-deployments`, `2026-11-23-core-sdk-publications`):
`getCoreSdk(host)` in `src/server/core/sdk-client.ts`, and `sdkAction` / `sdkGet` on `CoreApi` (`core-api.ts`), which reproduce
`BaseApi`'s envelope and value contracts. Tests drive the real SDK against `vitest-fetch-mock`.

Facts about the current `AssetApi` that shape the approach:

- It is generic over **20** `ResourceType`s: 17 the SDK covers (`PLUGIN` joined them in SDK 0.3.1), plus `FILE`, `SKILL`,
  `PROJECT` (never enriched through it; only `move` reaches them). Its URLs come from `CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL`, which only
  `asset-api.ts` reads.
- The SDK has one operation per type and verb, with `(bucket, path)` parameters (`getModelByPath`, `getModelMetadata`,
  `saveModel`, `deleteModel`, ...). Applications and toolsets have a platform family (`path` only) and a custom family
  (`bucket, path`).
- **SDK 0.3.1 normalizes path params lightly; it does not encode them the way the hand-written code does.** Re-probed on
  0.3.1 (the earlier 0.2.1 probe saw them verbatim): a space and non-ASCII letters are percent-encoded and an existing `%XX`
  is kept (`m%20n` is not turned into `m%2520n`), but `%`, `+`, `?`, `#`, `;`, `,` and `[]` are sent raw (`100%` stays
  `100%`, `q?x#y` stays `q?x#y`). The hand-written URL for those is `100%25`, `q%3Fx%23y`, `a%2Bb`. So a raw name passed to
  the SDK would change the URL; the encoding `encodeCorePath` does (per segment, `/` kept) must still happen at the call
  site. Probed: an `encodeCorePath`-encoded path passes through the SDK unchanged for every case tried (`100%25`, `a%252Fb`,
  `q%3Fx%23y`, `a%2Bb`, `m%2520n`, `x/y%20z/`, non-ASCII), so the result equals the hand-written URL. This is exactly the
  "an SDK upgrade changes path handling" case the PR 1 fixture spec exists to catch. Not yet probed, and pinned by the same
  fixture spec in PR 1: an **empty** path param (a root listing, `GET /v1/metadata/models/platform/`) and a **folder** path
  whose trailing `/` must survive (every folder listing). If the SDK drops either, the op row builds that path itself
  rather than relying on the SDK.
- On 0.3.1 `DELETE` through the SDK with `parseAs: 'text'` yields `undefined` for a `204`, `''` for an empty `200` and the raw
  text for a JSON body. The adapter already maps the first two to `''`; only a JSON body differs from the hand-written client
  (see D5).
- Only `getMetadata` strips a leading `platform/` (`resolveListPath`); content get, `put` and `delete` pass the path through.
  Platform types bake the `platform` bucket into their prefix, so for the SDK the bucket is `platform` and the path the bare name.
- `ROLE` is read and write (`platform-roles/actions.ts` uses `put`, `delete`, `getMergedWithEtag` and bulk delete); the
  comment on `ResourceType.ROLE` saying "read-only" is stale.

### Caller audit and SDK coverage (tasks 1.1, 1.2; re-checked against SDK 0.3.1 on 2026-11-26)

Types reaching `AssetApi` from each caller group (all confirmed; the proposal's grouping holds):

| Callers | Types | PR |
| --- | --- | --- |
| `platform-models` | MODEL | 1 |
| `platform-routers`, `platform-roles`, `platform-routes` (and `test-suites` listing `ROUTE`), `platform-keys`, `platform-interceptors`, `platform-translators`, `platform-plugins`, `platform-app-runners`, `platform-catalog-schemas` | ROUTER, ROLE, ROUTE, PROJECT_KEY, INTERCEPTOR, TRANSLATOR, PLUGIN, APP_TYPE_SCHEMA, CATALOG_SCHEMA | 2 |
| `platform-policies`, `platform-policy-assignments` | POLICY, POLICY_ASSIGNMENT | 3 |
| `prompts`, `conversations`, `assets-aliases`, `server/prompts/exim.ts` | PROMPT, CONVERSATION, ALIAS | 4 |
| `assets-applications`, `assets-toolsets`, `server/applications/exim.ts`, `server/toolsets/exim.ts`, `toolset-ops-api.ts`, `toolsets/mcp-client.ts`, `EnrichmentClients` in `api.ts` | APPLICATION, TOOLSET | 5 |
| `files`, `projects`, `skills` actions | FILE, PROJECT, SKILL, **only through `AssetApi.move`** | 5 (see below) |

Shared consumers that hold a `ResourceType` and are covered by every PR's regression net: `server/assets/{exim,bulk-delete,move,import-export-action}.ts`,
`server/folders/{folders-core,resource-walk}.ts`, `server/aliases/name-clash.ts`, `server/config-entities/read.ts`, `core/pagination.ts`.

**Finding: `move` is not application/toolset-only.** `files`, `projects` and `skills` call `AssetApi.move` (`ResourceType.FILE`,
`PROJECT`, `SKILL`) even though they never use the other verbs. `moveResource` is one type-independent operation, so PR 5 migrates
it for all of them, not just for applications and toolsets; PR 5's specs cover a file, a project and a skill move, and the design
claim "heavily used by applications and toolsets" is narrowed to "used by every type".

SDK coverage for the 17 mappable types (content get, metadata get, save, delete): every verb exists in 0.3.1. Names that differ
from the type name: `PLUGIN` is `getPlugin` / `savePlugin` / `deletePlugin` with `getPluginMetadata` (all `bucket, path`, new in
0.3.1); `MODEL` content is `getModelByPath(bucket, path)` (`getModel` takes a bare name); `ROUTER` is `getPlatformRouter` /
`savePlatformRouter` / `deletePlatformRouter` with `getRouterMetadata` (the SDK also has `getRouter`; PR 2 confirms which
of the two matches the hand-written `bucket, path` URL before choosing, as `getModelByPath` was chosen over `getModel`); `CATALOG_SCHEMA` is `getCatalogSchemaResource` /
`saveCatalogSchemaResource` / `deleteCatalogSchemaResource` with `getCatalogSchemaMetadata`; `PROJECT_KEY` is `getKey` /
`saveKey` / `deleteKey` with `getKeyMetadata`; `APP_TYPE_SCHEMA` is `getSchema` /
`saveSchema` / `deleteSchema` with `getSchemaMetadata`; `ALIAS` is `getPublicAlias` / `savePublicAlias` / `deletePublicAlias`
with `getPublicAliasMetadata`. Applications: platform `getPlatformApplication` / `save…` / `delete…` / `getPlatformApplicationMetadata`
(path only); custom `getCustomApplication` / `saveCustomApplication` / `deleteCustomApplication` with `getApplicationMetadata`
(bucket, path). Toolsets: platform `getPlatformToolSet` / `savePlatformToolSet` / `deletePlatformToolSet` /
`getPlatformToolSetMetadata`; custom `getCustomToolSet` / `saveToolSet` / `deleteToolSet` with `getToolSetMetadata`. No mappable
type is missing a verb, so after PR 5 only `FILE`, `SKILL` and `PROJECT` have no op row (they never reach the content or
metadata verbs). The `@epam/ai-dial-typescript-sdk` bump to `^0.3.1` also type-checks the existing code (`npm run typecheck` is clean);
`createSDK({ baseUrl, fetch })` is unchanged.

## Goals / Non-Goals

**Goals:**
- Every SDK-covered type's `AssetApi` calls go through the SDK, one entity group per PR, with unchanged URLs and unchanged
  `AssetApi` signatures except the widened `| null | undefined` returns.
- A mixed state is always safe: after any PR, mapped types use the SDK and unmapped ones the old path.

**Non-Goals:**
- The sibling clients named in the proposal's non-goals, and any behavior change.

## Decisions

### D1. A per-type op table with a fallback, not a subclass per group

A table keyed by `ResourceType` in a new file beside `asset-api.ts`. Each row holds one typed closure per verb, e.g.
`(sdk, bucket, path, init) => sdk.getModelByPath(bucket, path, init)`, plus the bucket/path split for that type.
`AssetApi.getContent`, `getMergedWithEtag`, `getMetadata`, `put` and `delete` look the type up: a row routes through
`sdkGet` / `sdkAction`, a missing row uses the existing URL. Each PR adds op rows and deletes the matching URL entries.
(Terms: an **op row** is a type's entry in this table; a **URL entry** is its entry in `CORE_RESOURCE_URL` /
`CORE_RESOURCE_METADATA_URL`.)

- Alternative: a subclass per group wired in `api.ts`. Rejected: callers that take a `ResourceType` (exim, move,
  bulk-delete, resource-walk) would have to learn the routing, and the fallback would still be needed.
- Alternative: one wholesale swap at the end. Rejected: no per-group regression net, and it breaks one PR per group.
- The fallback is a migration device, not a permanent branch. After PR 5 every SDK-covered type has an op row; only `FILE`,
  `SKILL` and `PROJECT` don't, and they never reach the content or metadata verbs, so PR 5 removes the fallback (D6).

### D2. Typing: closures per row, a cast only on the request body

The operations differ in body type and path parameters, so no single generic cast covers them. Each closure is typed against
its own operation; the only cast is on the body `AssetApi.put` receives as `T extends object`. `AssetApi` keeps its generic
public signatures (`Record<string, unknown>` content, `CoreResourceMetadataNode`), so the ~40 callers are untouched, and
`ASSET_MERGERS` keeps producing the admin models. Each PR deletes the admin DTOs that only duplicate its group's SDK content
type; types with admin-only fields stay as the SDK type plus those fields (the direction #5640 follows for settings).

### D3. URLs stay byte-identical: encode at the call site

The table passes `encodeCorePath(path)` as the SDK path param, exactly what `asset-api.ts` builds today; query parameters
(`recursive`, `token`, `limit`) keep their values. Core-issued ids keep their current per-caller behavior; the known
encode-at-caller inconsistencies are noted, not fixed. PR 1 adds a fixture spec through the real SDK with `%20`, `+`, a
space, unicode, a nested `/`, an empty path (root listing) and a folder path with a trailing `/`, asserting the exact URL, so an SDK change to path handling fails a test instead of
double-encoding silently. Later PRs reuse the fixture and assert old-vs-new URL equality **per verb**, not only per type.

### D4. Bucket and path are split per verb, as today

**Platform-bucket types** (`PLATFORM_BUCKET_RESOURCE_TYPES`: PRs 1-3). Metadata reads keep `resolveListPath` (strip
`platform/`, empty path lists the root). Content get, save and delete send the bare name with bucket `platform` and no
stripping. The table reproduces that per verb instead of sharing one helper, because a shared strip would change a content,
put or delete path that happens to start with `platform/`.

**Bucketed types** (`PROMPT`, `CONVERSATION`, `ALIAS`, custom `APPLICATION` / `TOOLSET`: PRs 4-5). Today the whole
`bucket/folder/name` path follows the prefix; the SDK takes `(bucket, path)`. The op row splits on the first `/`: the first
segment is the bucket, the rest the path, encoded with `encodeCorePath` after the split, so the joined URL is unchanged.
The `public/` default for an omitted conversation or prompt list path becomes bucket `public` with an empty path. A path
with no `/` (a bare bucket, e.g. the `public` fallback `parsePathFields` already guards) is bucket-only with an empty path,
the root listing of that bucket. PR 4 pins each of these with an old-vs-new URL assertion.

### D5. The DELETE adapter fix (#5642) and the 304 pin land in PR 1

`AssetApi.delete` is the first `DELETE` through the SDK, so PR 1 fixes the adapter in `core-api.ts` with specs for empty `200`
and `204` bodies, and closes #5642. `getMergedWithEtag` sends `If-None-Match` and treats a `304` as a failure; PR 1 adds one
spec that runs the same `304` through the SDK and the old path and asserts the same envelope (`success: false`, status `304`,
etag kept), fixing `core-api.ts` in the same PR if they differ.

### D6. URL maps become `Partial`, with a guarded lookup

PR 1 changes `CORE_RESOURCE_URL` and `CORE_RESOURCE_METADATA_URL` to `Partial<Record<ResourceType, string>>` and the lookup
throws a clear error for a type that has neither an op row nor a URL entry. Each PR deletes its URL entries. PR 1 also
corrects the map comment in `assets-core.ts`, which names only `SKILL` and `PROJECT` as unreachable: `FILE` is unreachable
through these verbs too.

End state, decided: `move` reads `RESOURCE_TYPE_PREFIX`, not these maps, so after PR 5 nothing reads them. **PR 5 deletes
both maps and the URL fallback**, including the unreachable `FILE` / `SKILL` / `PROJECT` entries; a content or metadata
call for a type with no op row then throws. PRs 1-4's guarded lookup is what proves no such call exists before PR 5
removes the branch.

### D7. Platform versus custom for applications and toolsets (PR 5)

The SDK has `getPlatformApplication(path)` and `getCustomApplication(bucket, path)` (the same split for toolsets). The table
dispatches on the first path segment being `platform`. This **assumes `platform` is a reserved bucket** (Core's platform
root); a user bucket literally named `platform` would be misrouted. A spec pins that a `platform/...` path reaches the
platform operation and any other bucket the custom one, with a comment at the dispatch. PR 5's change re-verifies the
assumption against the existing application and toolset data flows before it is written.

### D8. Group order and `moveResource`

PR order: seam + `MODEL`; the rest of the flat platform types; policies; prompt, conversation and alias; applications and
toolsets with `moveResource`. The risky versioned group goes last, once the pattern is proven. `moveResource` is one
type-independent operation, used for every type including `FILE`, `PROJECT` and `SKILL` (see the caller audit), so it rides
with the last group instead of getting a PR of its own. PR 1 is `MODEL` only so the heaviest PR proves read, metadata, put and delete end to end before eight more types
follow as pure table rows.

### D9. 403 versus failure

`sdkGet` returns `undefined` on a 403 and `null` on other failures. `AssetApi.getContent` and `getMetadata` widen to
`| null | undefined` (documented once on the helper, as in Phases 2 and 3); callers that treat both the same keep working,
and any caller that distinguishes `null` is updated in the PR that migrates its type. The caller audit above records types
only, not `null` handling, so each group change audits its callers for a branch on `null` versus `undefined` (an explicit
`=== null`, or a 403 that should not read as "not found") and lists what it found in its own design.

## Out-of-scope follow-ups

Not part of Phase 4's checklist. Each stays hand-written after Phase 4 and needs an owner before the epic closes, which is
why task 3.2 requires the follow-up issue to exist before this change is archived:

- `ConfigFileApi` (`server/core/config-file-api.ts`): read-only; the SDK has `listFileConfig*` / `getFileConfig*` for it.
- `CatalogSchemasApi` and `AppRunnerSchemaApi`: reads that do not fit the generic `AssetApi` shape.
- `ComplexResourceCoreApi` (base of the application-resource and app-runner resource clients).

Proposed: one follow-up issue for the four, filed by the user after PR 1 merges. Not filed or drafted by this change.

## Risks / Trade-offs

- [The SDK changes its path-param handling again (it already did between 0.2.1 and 0.3.1)] -> the PR 1 fixture spec fails
  first; it covers `%`, `+`, `?`, `#`, a space, non-ASCII, an existing `%20`, a nested `/`, an empty path and a trailing
  `/`, and pins that the
  `encodeCorePath`-encoded path produces the hand-written URL.
- [A `platform`-named user bucket is misrouted for applications or toolsets] -> D7 spec and the data-flow check in PR 5.
- [Fallback branch lingers after the groups are done] -> D6 deletes URL entries per PR and PR 5 deletes the maps and the
  fallback; the guarded lookup makes a forgotten type fail loudly in a test, not silently on the old URL.
- [The bucket split for bucketed types changes a URL] -> D4's split rule, with old-vs-new URL assertions in PR 4 for an
  omitted path, a bare bucket and a nested folder.
- [`ROLE` was assumed read-only] -> its write and delete rows are in PR 2, and the stale comment is corrected there.
- [PR 5 is the largest group] -> it adds `moveResource`, the D7 platform/custom dispatch and the D6 map removal; versioned
  content, metadata merge and etag handling keep their code, only the transport changes.
- [`asset-api.spec.ts` asserts hand-written URL strings] -> SDK requests reach `fetch` as a `Request`; each PR rewrites the
  affected cases with a request helper and `CORE_TEST_URL`, and runs the real `api.ts` objects with
  `vi.stubEnv('DIAL_CORE_API_URL', CORE_TEST_URL)`.

## Context

The existing `config-file-entity-views` capability uses a persisted `showConfigFiles` flag in `AppContext`. On seven views, a title-adjacent toggle replaces `BaseAssetList` with a separate name-only `ConfigFileEntityList`; `ConfigFileListSwap` and `useConfigFileEntityList` coordinate a lazy list-names read. This creates a second listing model and global UI state for a source that belongs inside the existing FileManager hierarchy.

DIAL Core exposes file-defined entity names through `GET /v1/admin/config/file/{type}` and bodies through `GET /v1/admin/config/file/{type}/{name}`. File-derived entities are not resource-bucket objects: the list response has names only, Core does not expose per-entity source-file provenance, and they have no metadata or write endpoint. Existing detail pages already use `configFileApi` and read-only state when routed with `configFile=true`; Catalog Schemas already fall back from Core resources to file configuration by `$id`.

## Goals / Non-Goals

**Goals:**

- Represent config-file entities as an explicit synthetic `file` root in the shared FileManager, not as a `BucketType` or Core storage bucket.
- Preserve normal `platform` and `public` resource behavior while making file rows flat, name-only, read-only, and openable.
- Preserve the existing read-only detail behavior and routes; add the missing Translator read branch.
- Replace duplicate toggle/list infrastructure with source-aware roots, rows, navigation, and action gating.
- Keep Core calls lazy: request file entity names only when the user first opens the `file` root.

**Non-Goals:**

- Change Core contracts or add write support for file-defined entities.
- Change normal resource columns, resource metadata, or platform/public mutations.
- Refactor the route-local read-only detail mechanism beyond changes required to wire Translator file reads.
- Identify which input file originally declared an entity after Core merges `config.files[]`.

## Decisions

### Model the file root as a source descriptor, not a resource bucket

Introduce an explicit source/root descriptor (backed by a fixed-value `EntitySource` enum) for FileManager roots. Resource roots retain their existing Core metadata/list actions; the `file` descriptor carries the config-file entity type, flat/read-only attributes, and file-name loading action.

This avoids extending `BucketType` with `file`. Existing platform/public logic contains two-way branches and resource-path assumptions; treating `file` as a bucket could accidentally apply public writes, version columns, folder actions, or resource fetches to file rows.

**Alternatives considered:**

- Extend `BucketType` with `file`: rejected because it conflates a synthetic source with a Core bucket and makes existing two-way branches unsafe.
- Keep a standalone config-file grid: rejected because it duplicates FileManager behavior and retains the global toggle state.

### Root ordering and visibility

Supported platform-only views use `[file, platform]`. Applications and Toolsets use `[file, platform, public]` when Catalog is enabled, and `[file, public]` when it is disabled. Keys receive no file root.

The file root remains available when Catalog is disabled because it is served by Core's file inspection endpoint and does not depend on the Catalog menu's platform-resource visibility.

### Load file names with the initial root batch

Create and render the `file` root with the rest of the tree, and request `configFileApi.listNames` concurrently with visible physical-root reads when the listing mounts. Cache that initial result for the mounted listing context; selecting `file/` uses the cached names and does not refresh it. If the file-source read fails, preserve the successfully loaded physical roots and leave the file root unavailable rather than treating the failure as an empty list.

**Alternatives considered:**

- Defer the names request until `file/` is opened: rejected because the read-only list should be ready with the other roots.
- Fetch every file body to produce ordinary rows: rejected because Core's file list is names-only and N+1 content reads add avoidable latency.

### Map each supported route to a Core file type centrally

Replace the toggle placement set with one registry that maps the supported listing route to its config-file type. It covers Models, Interceptors, Translators, Routes, Roles, App Runners (`schemas`), Catalog Schemas (`catalog_schemas`), Applications, and Toolsets. Add `Translators = 'translators'` to `ConfigFileEntityType` and the readable type allow-list. Exclude Keys.

App Runners retain the existing `schemas` mapping, which represents Core's `applicationTypeSchemas` rather than an independent app-runner configuration collection.

### Use source-aware rows for navigation, columns, and actions

File rows carry their explicit file source. While browsing `file/`, FileManager renders only the name column and permits row open plus open-in-new-tab. It suppresses creation, import/export, delete/bulk delete, duplicate, rename, move, drag/drop, selection mutation, and all folder actions.

Opening a non-Catalog file row appends `configFile=true` to the existing platform/asset detail route. Applications and Toolsets use the bare `{id}` path with the flag, never a public `path` query. Catalog Schema file rows use the existing encoded `$id` detail route without the flag so the established API-first/file-fallback behavior remains the sole resolver.

### Preserve read-only detail behavior

Do not change the existing config-file source behavior in covered detail pages: config-file body read, read-only controls, and hidden ADMIN|CORE format selector remain unchanged. Add the same branch for Translators. Catalog Schema detail resolution remains API-first and falls back to a file schema by `$id`, read-only when the fallback succeeds.

### Remove the toggle-specific path after source integration

Delete `showConfigFiles` state and persistence, `ConfigFilesToggle`, `ConfigFileListSwap`, `useConfigFileEntityList`, `ConfigFileEntityList`, seven page wrappers that only compose those pieces, and toggle-only header/list props. Remove the unused `showOnlyConfigFiles` picker-read branch rather than repurposing it; picker option resolution remains distinct from FileManager file-root loading.

## Risks / Trade-offs

- **[File rows lack resource metadata]** → Render the source-specific name-only columns and do not fabricate author, dates, etag, folder IDs, or provenance.
- **[Existing platform/public conditionals could mutate file rows]** → Gate action availability and routing from the explicit `EntitySource.File` discriminator before bucket branches; cover it with focused unit/component tests.
- **[Failure to load file names can be indistinguishable from an empty root]** → Reuse the tree's established request-error notification/result handling so a failed Core read is surfaced rather than silently presented as no entries.
- **[Catalog-disabled deployments have different roots]** → Test both root sets to ensure platform disappears but file remains reachable.
- **[App Runner terminology can mislead users]** → Keep the `schemas` mapping as existing behavior and state its application-type-schema semantics in the updated specification.

## Migration Plan

1. Add source descriptors, file-name loading, source-aware row mapping, actions, columns, and navigation behind the existing FileManager list path.
2. Add Translator config-file type/read-only detail support and attach Catalog Schema discovery to its existing fallback detail behavior.
3. Remove the toggle-only state, components, hooks, wrappers, and obsolete picker parameter once all affected views use the file root.
4. Validate focused tests, both TypeScript projects, lint, formatting, and the full suite. No backend deployment or persisted-data migration is required.
5. Roll back by reverting the frontend change; the Core read-only file endpoints and existing detail routes remain compatible.

## Open Questions

- None. The proposal fixes lazy loading, root ordering, App Runner semantics, Catalog Schema routing, and Catalog-disabled visibility as recorded decisions.

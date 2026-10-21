# Core resource entities carry a `_metadata` system object

Tracks [Issue #4474](https://github.com/epam/ai-dial-admin-frontend/issues/4474) — [Admin] Add
system metadata property to entities.

## Why

Detail reads of DIAL Core resources graft metadata-endpoint data (`author`, `createdAt`,
`updatedAt`) and derived helpers (`name`, `path`, `folderId`, `version`, `nodeType`,
`status`, `validationWarnings`) flat onto the entity model, next to the resource's own content
fields. Consumers must know each type's sourcing to find metadata — `ResourceInfoHeader` already
papers over the inconsistency with `entity?.updated_at ?? entity?.updatedAt` — and every write
path re-enumerates the fields to strip in its own `to*Payload` destructure. Issue #4474 asks for
one predictable place for entity metadata.

## What Changes

- Merged Core-resource detail entities (the `getMerged`/`getMergedWithEtag` flows in
  `src/server/core/asset-api.ts`, and the skill read in `src/server/core/skills-core-api.ts`)
  gain a `_metadata` object holding everything the merge layer grafts that is not resource
  content: `author`, `createdAt`, `updatedAt` (formatted through the existing
  `asset-metadata.ts`/`skill-metadata.ts` formatters), plus the identity helpers
  (`name`, `path`, `folderId`, `version`, `nodeType`) and the read-only projections
  (`status`, `validationWarnings`).
- `_metadata` values are sourced from the metadata response first, falling back to the original
  resource's own inline fields where Core serves them (public-bucket applications and toolsets
  alike serve snake_case `created_at`/`updated_at` — Core's
  `ApplicationService`/`ToolSetService` graft the blob metadata into the content response at
  serve time).
- **Resource content is never mutated.** Fields the original resource carries — including the
  editable maintainer (`author` on `Deployment`-based types) and inline
  `created_at`/`updated_at` — stay on the entity exactly as served.
- **BREAKING (frontend-internal):** the flat grafted helper fields disappear from merged detail
  entities; consumers (View pages, Move/delete/duplicate flows, `getEntityPath`, dual-bucket
  `isPlatformBucketPath` checks, JSON editor diffs, Info headers, `Maintainer` display,
  `SourceField` runner options, Skills view) read them from `_metadata`.
- Write paths strip the whole `_metadata` object before PUT: the per-field
  `author`/`createdAt`/`updatedAt` destructuring in `toKeyPayload`, `toRolePayload`,
  `toRoutePayload`, `toRunnerPayload`, `toPlatformApplicationPayload`,
  `toPlatformToolsetPayload` is replaced by a single `_metadata` strip; per-type write quirks
  (prompt `id`, key `key`/`name`/`description`, toolset `reference`/`displayVersion`) remain.
- `asset-api.put`'s response enrichment (`parsePathFields`) grafts into `_metadata`, so write
  responses match read shapes.
- exim export documents carry `_metadata`; import strips it before writing.
- Model types are corrected to the original resource shapes where the old flat graft was the
  only reason a field existed (e.g. `DialToolsetResource.updatedAt: string` → the served
  `updated_at`).

## Capabilities

### New Capabilities

- `core-resource-entity-metadata`: the `_metadata` contract on Core-resource detail entities —
  contents and sourcing precedence, untouched resource content, the wholesale write-path strip,
  exim handling, and the single UI read path.

### Modified Capabilities

- `core-asset-client`: "Content+metadata field merge matches per-type source-of-truth" now nests
  the grafts under `_metadata` instead of flat; "Write operations resolve with normalized
  admin-format path fields" resolves into `_metadata`.
- `skill-resources-core-api`: "A single skill's author, created/updated dates, and etag are read
  from a single parent-folder listing" now populates `_metadata` instead of flat fields.
- `platform-keys`: "Payload sanitization on write" strips `_metadata` instead of the enumerated
  flat fields.
- `platform-toolsets`: "Platform toolset writes strip read-only and derived fields" strips
  `_metadata` (plus `reference`) instead of the enumerated flat fields.
- `platform-applications`: "Platform application writes strip read-only and derived fields"
  strips `_metadata` (plus `reference`) instead of the enumerated flat fields.
- `model-resources-core-api`: the model update strip requirement removes `_metadata` (and keeps
  the `status`/`validationWarnings` behavior, which relocates rather than disappears).

The specs phase sweeps every write-strip and merge-shape requirement across the remaining
platform/core-api specs (`platform-roles`, `platform-routes`, `platform-interceptors`,
`platform-translators`, `platform-app-runners`, `platform-catalog-schemas`,
`prompts-core-api`, `conversations-core-api`, `application-resources-core-api`,
`toolset-resources-core-api`, exim requirements) and adds deltas where the existing text
enumerates the flat fields.

## Non-goals

- List rows (`ResourceInfo` from `toResourceInfoList`) — metadata-only grid projections stay
  flat and untouched.
- `etag` — stays out of `_metadata` and keeps flowing as a separate value through the
  page → View → save contract.
- Deployments, evaluation entities (datasets, runs, test suites), config-file entities, files,
  and publications — their `createdAt`/`updatedAt`/`author` are content fields of their own
  backend DTOs (`Publication.java` declares its own), so they are untouched.
- Any DIAL Core backend change — Core keeps serving exactly what it serves today; `_metadata`
  is a frontend-constructed, write-stripped object.
- Activity Audit's "Since Creation" filter — its `createdAt` comes from the audit backend, not
  the Core metadata mechanism.

## Impact

- **Server layer:** `src/server/core/asset-metadata.ts` (all 12 mergers and their shared
  formatters — the grafts move under `_metadata`), `src/server/core/skill-metadata.ts`,
  `src/server/core/skills-core-api.ts`, `src/server/core/asset-api.ts` (`put` response
  enrichment), `src/server/assets/exim.ts` (import strip).
- **Server actions:** `src/app/[lang]/platform-{keys,roles,routes,app-runners,interceptors}/actions.ts`,
  `assets-{applications,toolsets}/actions.ts`, `assets-{prompts,conversations}/actions.ts` and
  their platform counterparts — strippers simplify to the `_metadata` strip.
- **Models:** `src/models/dial/resource.ts` (a shared `_metadata` type; flat helper fields
  removed from the merged shapes; `DialToolsetResource.updatedAt` corrected to the served
  `updated_at`), `src/models/dial/base-entity.ts` (`ModifiedEntity` usage on Core-resource
  models).
- **UI consumers:** `EntityHeaderControls/Info/InfoHeader.tsx`,
  `Assets/Resources/ResourceInfoHeader.tsx` (its `updated_at ?? updatedAt` fallback dies),
  `BaseControls/Maintainer.tsx` display path, `SourceField/Application/utils.ts`, Skills view,
  every detail-view consumer of `.name`/`.path`/`.folderId`/`.version` on merged entities —
  the bulk of the diff, since identity reads are everywhere.
- **Tests:** `asset-metadata.spec.ts` (asserts the flat merge field-by-field for all 12 types),
  `asset-api.spec.ts`, `skills-core-api.spec.ts`, the per-actions spec files, InfoHeader /
  Permissions / Details component specs, exim specs, and the spec-project typecheck
  (`npm run typecheck:specs`, blocking at zero) — fixtures drift against production types here.
- **Backend contract:** none — Core requests/responses are byte-identical before and after.

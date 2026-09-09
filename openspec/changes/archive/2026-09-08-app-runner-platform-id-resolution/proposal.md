## Why

An application's runner-scheme source can point at either of two populations: an admin-backend "config
file" runner (`AppRunnerOrigin.Entity`, read via `DialApplicationScheme[]`) or a DIAL Core "platform"
(blob-stored) runner (`AppRunnerOrigin.Asset`, read via `ResourceInfo[]`). The merged option list stamps
every platform runner's `$id` with its Core resource `name` (`toAssetOption` in
`SourceField/Application/utils.ts`), because a metadata-only list read never sees the runner's real
content. That name is only the runner's `$id` **at creation time** (Core stores it as
`encodeURIComponent($id)`) — if a runner's `$id` is edited afterwards through its own content (the
Properties tab / JSON editor), the resource name no longer changes, so the two diverge. Both
`AppRunners.tsx` (the picker) and `ParametersTab.tsx` (the scheme-driven Parameters view) resolve a
platform runner's scheme by this same possibly-stale `$id`, and `AppRunners.tsx` also writes it into the
application's `source`/`application_type_schema_id` on selection — so a stale id both fetches the wrong
scheme and persists a link that can silently stop resolving.

`AppRunnerOrigin`'s member names (`Entity`/`Asset`) also no longer match how the two populations are
described elsewhere in this codebase (config file vs. platform/Core), inviting the same confusion the
`$id` bug came from.

## What Changes

- Rename `AppRunnerOrigin.Entity` → `AppRunnerOrigin.Config` and `AppRunnerOrigin.Asset` →
  `AppRunnerOrigin.Platform` (enum member names and string values), and the paired i18n keys
  `SourceI18nKey.EntityRunner` → `SourceI18nKey.ConfigRunner` and `SourceI18nKey.AssetRunner` →
  `SourceI18nKey.PlatformRunner` (English display text is unchanged: "Configuration file" / "API").
  **BREAKING** for any code importing the old enum member names (none outside this repo).
- On selecting a `Platform`-origin runner, fetch that runner's full content (`getRunner(path,
  DEFAULT_ETAG)`) before resolving its scheme, and use the fetched resource's own `$id` — not the
  option's list-derived `$id` — as both the value written to the application's source and the id passed
  to `getResolvedRunnerSchema`. `Config`-origin resolution (`getResolvedApplicationScheme`) is unchanged.
- Extract the duplicated "resolve a runner's scheme by origin, unwrap the response, fall back to the
  runner itself on failure" logic out of `AppRunners.tsx` and `ParametersTab.tsx` into one shared helper,
  now also performing the platform detail fetch above, so both call sites stay in sync.

## Capabilities

### Modified Capabilities

- `application-source`: the "Applications Schema panel owns runner-scheme side-effects" requirement
  changes to describe origin-aware resolution (`Config` vs `Platform`) and the platform detail-fetch
  step; `AppRunnerOrigin` member names in referenced code change accordingly.

## Impact

- `apps/ai-dial-admin/src/components/SourceField/Application/{models.ts,utils.ts,AppRunners.tsx}`
- `apps/ai-dial-admin/src/components/Applications/ParametersTab/ParametersTab.tsx`
- New shared resolver module under `SourceField/Application/` (I/O, so not `utils.ts` per
  `.claude/rules/utils.md`)
- `apps/ai-dial-admin/src/constants/i18n.ts`, `apps/ai-dial-admin/src/locales/en.ts` (key rename only)
- Every other reader of `AppRunnerOrigin.Entity`/`.Asset`: `constants/grid-columns/grid-columns.tsx`,
  `components/EntityView/Interceptors/{Interceptors.tsx,models.ts}`,
  `components/Assets/Resources/ResourceFeatures.tsx`, `components/Assets/Platform/use-asset-runner-details.ts`
- Specs affected by the enum member rename: `platform-app-runners` (`assets-app-runners`) exposes the
  merged picker used from `Assets > Applications`; no requirement text there names the enum, so no delta
  needed for it.
- Test files exercising the current names/flow: `SourceField/Application/tests/{AppRunnersMerged.spec.tsx,
  runner-options.spec.ts,AppRunners.spec.tsx}`, `Applications/ParametersTab/tests/ParametersTab.spec.tsx`,
  `EntityView/AppRoute/tests/ApplicationAppRoutes.spec.tsx`, `assets-applications/tests/runner-sources.spec.tsx`

## Non-goals

- Not touching how a *new* asset application is seeded from the "Create Assets Application" action
  (which writes a `schemas/platform/{id}` reference form, not a bare `$id` — a separate, pre-existing
  code path this change does not call).
- Not reconciling `ResourceSourceField.tsx`'s use of the flat `DialApplicationResource.application_type_schema_id`
  field against the `application-source` spec's aspirational unified `source.applicationTypeSchemaId` — that
  drift predates this change and is out of scope here.
- Not changing the `Config`-origin resolution flow, which is already correct.

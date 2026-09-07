## Why

GitHub issue #4407: in the App Runner picker (Application → Source Type = App Runner → "Select
application runner", on `Assets > Applications`), the `Source` column reads `Entity`/`Asset`. Every
other Core-backed picker in this codebase (Roles, Interceptors, Keys, Models, Applications, Toolsets,
Routes) labels the same two populations `Configuration file`/`API` via `ConfigEntityOrigin`. The App
Runner picker predates that convention and never picked it up, so it reads as a bug rather than a
different, intentional labeling.

## What Changes

- Relabel the App Runner picker's `Source` column: `Entity Runner` → `Configuration file`,
  `Asset Runner` → `API` — matching `ConfigEntityOrigin`'s existing `ORIGIN_LABEL` wording
  (`src/utils/config-entities/source-column.ts`) instead of the picker's own `SourceI18nKey`
  strings.
- No column added for display name: confirmed `assetApi.list`'s underlying Core metadata read
  (`CoreResourceMetadataNode`) never carries `dial:applicationTypeDisplayName` — that field lives only
  in a runner's content body, one per-runner `GET` away. Adding the column would mean adding that
  fetch for every asset-origin row in the picker, which is out of scope for a label fix.
- `AppRunnerOrigin` (`Entity`/`Asset`) stays as the internal discriminator — it still drives real
  behavior differences (schema-resolution source, open-in-new-tab target) documented in
  `platform-app-runners`'s "Runner origin drives schema resolution and navigation" requirement. Only
  the column's rendered text changes.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `platform-app-runners`: the "app runners created through `Assets > App Runners`... offered as source
  options" requirement currently pins the column text to `Entity`/`Asset`; it changes to
  `Configuration file`/`API`.

## Impact

- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — `PICKER_RUNNER_COLUMNS`'s
  `valueFormatter`.
- `apps/ai-dial-admin/src/constants/i18n.ts` / `src/locales/en.ts` — `SourceI18nKey.AssetRunner`/
  `.EntityRunner` values (or their replacement).
- `apps/ai-dial-admin/src/components/SourceField/Application/tests/runner-options.spec.ts` — asserts
  the current label strings, needs updating.
- No change to `AppRunnerOrigin`, `buildAppRunnerOptions`, or the schema-resolution/navigation logic
  in `AppRunners.tsx` — those keys off the enum value, not the label.

## Non-goals

- Unifying `AppRunnerOrigin` with `ConfigEntityOrigin` as a single type, or routing the picker's data
  through `getConfigEntityOptions`/`readConfigEntities`. The two populations here come from a
  different merge (`buildAppRunnerOptions`, entity-vs-raw-resource-listing) than the Api/ConfigFile
  union those helpers implement; only the label convention is being matched.
- Adding a display-name column (see above — no data available without a new per-row fetch).
- Changing the interceptor attach-picker's separate `AssetInterceptorOrigin` (`Entity`/`Asset`)
  labels — a different component, not part of this issue.

## Why

`SourceField/Application/AppRunners.tsx` serves two unrelated callers through one body: `SourceField`
(admin-BE runners, `DialApplication` entity) and `ResourceSourceField` (Assets Applications, merged
config + Platform runners, snake_case resource fields). Every Platform/merged concern — the `entity`
vs `selectedValue`/`onChangeValue` double API, `isMergedSource` label and column switches, `runnerOptions`
state with the `runner.$id` mutation, Platform-origin open-in-tab — sits in the component the simple
admin-BE case also renders. The admin-BE picker should stay trivial; the resource picker should own its
extra behaviour.

## What Changes

- `AppRunners.tsx` is reduced to the admin-BE case: entity API only (`entity` / `onChange`), runners read
  straight from props, `dial:applicationTypeDisplayName` labels, standard runner columns, one
  `ApplicationRunners/<id>` open-in-new-tab URL. Removed: `selectedValue`, `onChangeValue`, `view`,
  `isMergedSource`, `runnerOptions` state, the `runner.$id` mutation, Platform-origin URL branch.
- New `AppRunnersResource.tsx` beside it, used only by `ResourceSourceField`: `selectedValue` /
  `onChangeValue` API, merged config + Platform options, `$id` labels, `PICKER_RUNNER_COLUMNS`,
  Platform-origin open-in-tab, Platform re-resolve with the `runner.$id` mutation moved over unchanged.
- `SelectAppRunnersModal` loses the `isMergedSource` branching for `AppRunners`; `AppRunnersResource`
  passes the merged column set explicitly.
- `ResourceSourceField` renders `AppRunnersResource`; `SourceField` keeps `AppRunners`.
- The small shared bits (validation effect, select-vs-modal render, loader) are duplicated, not extracted.
- Tests: `AppRunnersMerged.spec.tsx` and the `onChangeValue` case move to an `AppRunnersResource` spec;
  `SourceField`/`ResourceSourceField` specs and mocks follow.
- `AppRunnersResource` still shows a stored `application_type_schema_id` that no option carries (a Platform
  runner whose `$id` was edited after creation) instead of rendering blank; it is not matched to a runner.
- `AppRunnersResource`'s Open control opens `platform-app-runners/<path>` for a Platform runner and
  `platform-app-runners/<$id>?configFile=true` for a configuration-file runner, as the App Runners list does.
- `AppRunners` is behaviour-identical; the two fixes above are the only user-visible changes.

### Non-goals

- Changing `resolve-app-runner.ts` (also used by `ParametersTab`).
- Cleaning up `SourceField`'s `AssetsApplications` reset branch.
- Extracting a shared presentational picker.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `application-source`: asset applications render `ResourceSourceField` (not `SourceField`) and its
  `AppRunnersResource` picker; Applications keep `SourceField` and `AppRunners`.
- `platform-app-runners`: the merged picker becomes a dedicated component, `AppRunners` never merged;
  shows an unmatched stored id and adds origin-aware open-in-new-tab for the merged picker.

## Impact

- Code: `components/SourceField/Application/{AppRunners,SelectAppRunnersModal}.tsx`, new
  `AppRunnersResource.tsx`, `components/Assets/Resources/ResourceSourceField.tsx`.
- Tests: `SourceField/Application/tests/`, `SourceField/tests/SourceField.spec.tsx`, ResourceSourceField
  and `Assets/Apps` specs, `test-setup.tsx` if it mocks `AppRunners`.
- Shared callers of `resolveAppRunnerScheme` (`ParametersTab`) are untouched.

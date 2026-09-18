## Why

Three already-implemented fixes to Asset Applications' App-Runner-driven parameters have no spec
coverage: switching an App Runner used to discard already-set `applicationProperties` (#4225), the
Parameters tab's "Generated form" view showed "No Configuration Scheme" for Asset-origin (e.g.
QuickApp 2.0) App Runners because it always resolved schema through the admin-BE path (#4394), and
preset/schema parameters for those same Asset-origin runners were removable in the Parameters Table
view because they never landed in the schema-derived row set (#4413). The code for all three is
already merged into this branch; this change documents the resulting behavior as spec requirements.

## What Changes

- `ResourceSourceField.tsx` (`Assets` resource source editor, used by platform/asset Applications):
  switching the selected App Runner now merges the new runner's default `applicationProperties` under
  the entity's existing values, so already-set values for keys the new runner also defines survive
  the switch instead of being overwritten.
- `ParametersTab.tsx`: scheme resolution for an already-selected App Runner now branches on the
  runner's origin — Asset-origin runners resolve via `getResolvedRunnerSchema` (Core), other runners
  via `getResolvedApplicationScheme` (admin-BE) — matching the branching `AppRunners.tsx` already used
  at selection time. This fixes the Generated form view for Asset-origin runners.
- No code change for the Parameters Table view's Remove-hiding: fixing scheme resolution above means
  an Asset-origin runner's preset parameters now populate `schemeProperties`, so `TableView.tsx`'s
  existing `isFromScheme`/`isRemoveHidden` logic (unchanged) now correctly marks and locks them.

## Capabilities

### Modified Capabilities

- `platform-applications`: switching the App Runner on a platform/asset Application preserves
  already-set `applicationProperties` for keys the new runner also defines.
- `platform-app-runners`: viewing an existing application's Parameters tab resolves an Asset-origin
  runner's scheme through Core, not just at selection time.
- `app-properties-table-editing`: schema-derived rows now include an Asset-origin runner's resolved
  preset parameters, so Remove stays hidden for them.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Resources/ResourceSourceField.tsx`
- `apps/ai-dial-admin/src/components/Applications/ParametersTab/ParametersTab.tsx`
- No test or task work is proposed here — the code is already implemented and merged; this change
  only adds spec coverage for it.

## Non-goals

- Not re-implementing or altering the existing fixes — this change is documentation-only.
- Not adding a browser-verification or unit-test task — the user explicitly asked only for specs,
  with no code or test changes.

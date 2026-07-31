## Why

The Activity Audit page's `View` dropdown offers a third option, `Asset`, that has never done anything: it ships permanently `disabled: true`, no fetcher or column set exists behind it, and `ActivityAuditView.Asset` is referenced nowhere else in the app. It reads as a feature that is either broken or coming, and it is neither.

## What Changes

- Remove the `Asset` option from the Activity Audit `View` dropdown; the selector offers `Config` and `Deployments`.
- Remove the now-unused `ActivityAuditView.Asset` enum member so no code path can select a view with no fetcher behind it.
- Remove the `Telemetry.ActivityView.Asset` i18n key and its locale string.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `activity-audit-deployments-view`: `View selector exposes a Deployments option` — the option set drops `Asset`.
- `activity-audit-deployments-tab`: `View-type selector is hidden inside the entity Audit tab` and `ActivityAuditList accepts a viewMode override` — both name the dropdown's option set, which is now `Config / Deployments`.

## Impact

Frontend only, three files under `apps/ai-dial-admin/src`: `components/ActivityAudit/List/List.tsx` (the option), `types/activity-audit.ts` (the enum member), `constants/i18n.ts` + `locales/en.ts` (the key and string). No API, fetcher, or column-definition change — nothing was wired to the option. `ActivityAuditList`'s own spec asserts the exact option set, so the removal is covered by the existing suite.

## Non-goals

- No change to the `Config` or `Deployments` views, their fetchers, columns, or defaults.
- No asset-activity feature: this removes a placeholder, it does not replace it. A future asset audit view would come with its own fetcher, columns, and change.

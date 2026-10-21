## Context

See proposal.md — Why. The Import Config page is a two-step `DialSteps` wizard (`ImportConfig.tsx`): Files
(`Files.tsx`) builds a `FormData` with the file and a `resolutionPolicy` entry; Configuration
(`ConfigurationPreview.tsx`) previews it and holds the Import button. Both branch on a derived boolean,
`isDeployments`, and `ImportConfig.onImportFile` picks the import action with a nested ternary over it and the file
type. The admin preview renders `ConfigurationGrid` (action column + Compare through the audit `ActivityDetails`
modal); the deployment preview renders `DeploymentConfigurationGrid` with a validation banner and an error-gated
Import button.

After `analytics-config-export`, `ExportComponentType.ANALYTICS` exists, `ConfigScopeSelector` takes the scopes to
offer, and `Files.tsx` passes `IMPORT_CONFIG_SCOPES` (admin + deployments).

The service contract (`CatalogTransferController`, `web/dto/catalog/`, on the service's `development`): multipart
`file` part; query params `resolution_policy` (`FAIL_IF_EXISTS` | `SKIP_IF_EXISTS`; `OVERWRITE` is a 422) and
`acknowledge_reused_names` (default false). Preview answers 200 whenever the bundle parses, with
`{ required_system_tables, tables, pipelines: ImportEntry[], env_specific, validation_errors }`. Import answers
`{ import_id, outcome, required_system_tables, tables, pipelines, env_specific }` with a `status` on each entry, and
is step-committed with best-effort compensation. `ImportEntry`: `name`, `import_action` (`CREATE` | `SKIP` | `FAIL`),
`prev`, `next`, `differs`, `metadata_only`, `problems`, `armable`, `arm_problems`, `reused_name`, `status`.

## Goals / Non-Goals

**Goals:**

- Give the Analytics scope its own branch everywhere the import page branches today, leaving admin and Deployments
  unchanged.
- Reuse the existing preview pieces — action column, Compare modal, validation banner, blocked-import tooltip —
  rather than building Analytics-only equivalents.

**Non-Goals:**

- A source-strategy interface across the import page's three sources; three explicit branches are still readable.
- Audit grouping (separate change).

## Decisions

### D1. Branch on `ExportComponentType`; replace `isDeployments` and the nested ternary

`ImportConfig`, `Files` and `ConfigurationPreview` branch on `configScope`. `onImportFile` becomes a `switch` over the
scope (and, for admin, the file type) with `async`/`await` — removing the nested ternary and the `.then` chain the
code standards forbid in new code. `IMPORT_CONFIG_SCOPES` and the export page's `getExportScopes` become one `getConfigScopes(isDeploymentsEnabled,
isAnalyticsEnabled)` in `Common/ConfigScopeSelector/utils.ts` — both pages now offer the same sources — and the
selector renders when it returns more than one scope. `import-config/page.tsx` passes `isAnalyticsEnabled={getIsAnalyticsEnabled()}`.

*Alternative:* keep `isDeployments` and add `isAnalytics`. Rejected for the same reason as the export change: two
booleans for three states.

### D2. The policy and the confirmation travel as their own values, not inside the `FormData`

The Analytics `FormData` carries only the `file` part. The policy (`CatalogResolutionPolicy`) is Files-step state
lifted to `ImportConfig`, and the re-used-name confirmation is Configuration-step state; both are passed to the
server actions as arguments that `AnalyticsDataApi` puts on the query string under the service's snake_case names.
The deployment branch already strips `resolutionPolicy` out of the `FormData` before sending; not putting it there in
the first place removes that dance for the new scope.

### D3. API: two multipart methods on `AnalyticsDataApi`

`previewCatalogImport(file, policy, isReusedNamesAcknowledged, token)` and `importCatalog(...)` use `postFiles`,
which already returns the shared error envelope. A query-string builder (`CATALOG_IMPORT_QUERY`) encodes
`resolution_policy` and `acknowledge_reused_names`. Server actions `previewAnalyticsImportConfig` and
`importAnalyticsConfig` join `import-config/actions.ts`.

### D4. Preview rendering: one `AnalyticsImportPreview`, admin pieces reused

`AnalyticsImportPreview` owns the fetch, the three tabs, the banners and the confirmation checkbox, and reports
`{ isImportBlocked }` up to `ConfigurationPreview` so the existing Import button and `ImportBlockedTooltip` stay in
one place. Rows are mapped by a pure util (`getAnalyticsImportRows`) that uppercases nothing — the service already
sends `CREATE`/`SKIP`/`FAIL`, matching the admin action column — and puts `problems`, `armable`, `arm_problems`,
`differs`, `metadata_only` and `prev`/`next` on the row. Columns reuse `getComponentActionColumn()` and the
Compare operation; Compare opens `ActivityDetails` with `prev` and `next` exactly as `ConfigurationGrid` does with its
prev/current state. `validation_errors` are listed in a `DialNotification`, not the deployment `ValidationBanner`: that banner counts
"artifacts" and tells the user to replace files, which is not what a bundle-level service message says. Tab invalidity uses `TabModel.invalid`, as
the deployment preview does.

The component is split into `AnalyticsImportPreview` (fetch and gate), `AnalyticsImportGrid` (tabs, grid, Compare)
and `AnalyticsImportNotices` (banners and the confirmation). The gate is a pure function `isAnalyticsImportBlocked(preview, isReusedNamesAcknowledged)`: true when the preview
is absent, has `validation_errors`, has any `FAIL` entry, or has an unacknowledged `reused_name`.

### D5. Result in place, keyed by the import response

`ImportConfig` keeps the last `CatalogImportResult` for the Analytics scope. `AnalyticsImportPreview` renders from the
result when there is one (adding the Status column and the outcome banner) and from the preview otherwise; the
Import button is disabled once a result is shown. Choosing a new file or scope clears the result. The outcome banner
uses `DialNotification` variants (success / error); the post-import reminder (pipelines disabled, no access grants)
is part of the completed banner.

*Alternative:* toast only, as admin and Deployments do. Rejected: a `rolled_back` or `rollback_failed` outcome needs
per-object status to act on, which a toast cannot carry.

### D6. Unreachable service

Calls go through `useProtectedRequest`, which already turns a rejected server action into a failed envelope; the
preview reports it with a dedicated "could not load the preview" message when the envelope carries no service
words. The import call does the same with the generic import-failed message.

## Risks / Trade-offs

- [Analytics import depends on the export change's shared pieces] → implemented on a fresh branch after PR #4890
  merges; nothing here touches export behavior.
- [The service's contract moves] → models in one file (`models/analytics/catalog-import.ts`), mapping and gate in
  pure utils with unit tests.
- [`prev` / `next` are the bundle shape, not the admin entity shape] → `ActivityDetails` diffs arbitrary objects; if
  a nested member renders poorly, it is a display issue confined to the modal, not a data issue.
- [The `deployment-import` main spec opens with a delta header] → normalize it (as was done for
  `deployment-export`) before archiving, or the archive aborts.

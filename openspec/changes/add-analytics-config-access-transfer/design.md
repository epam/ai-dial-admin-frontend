## Context

See proposal.md — Why. The Analytics scope of both pages is already built around four request/response pairs
(`/v1/catalog/export[/preview]`, `/v1/catalog/import[/preview]`), one request builder per side
(`buildCatalogExportRequest`, `CATALOG_IMPORT_QUERY`) and one row mapper per preview (`getAnalyticsPreviewRows`,
`getAnalyticsImportRows`). ADAS 0.24 adds an opt-in `include_access` to all four and an `access` member to every
response; with the flag off, a 0.24 response differs only by an empty `access` array on the import side, which the
current models ignore.

Constraints that shape the design:

- An ADAS older than 0.24 binds the export body strictly and refuses an unknown `include_access` with 400, so the
  field must be absent — not `false` — when the box is off.
- The table-grant permission is global, and the only place the frontend sees it is `permissions.grant` on each item
  of `GET /v1/tables`. Neither page reads tables on load today; the export picker reads them lazily per tab.
- `TabbedSelectionContent` (shared with the Deployments scope) caches each tab's candidates for its lifetime.
- `ActivityDetails` renders `prev` / `next` of any object and is keyed by a resource id and type.

## Goals / Non-Goals

**Goals:**

- One flag per page feeds every request of that page, so the preview and the action it confirms cannot disagree.
- Access rows reuse the existing preview grids, action styling, compare modal and blocking logic, rather than a
  parallel set.

**Non-Goals:**

- No change to any `Common/*` component or to `TabbedSelectionContent`.
- No client-side validation of access entries — the service's `problems` and `validation_errors` are shown as returned.

## Decisions

### D1. Grant permission comes from a hook over the existing `getTables` action

A new hook, `hooks/use-analytics-access-grant.ts`, calls `getTables` from `app/[lang]/tables/actions.ts` once the
Analytics scope is selected, and returns `canGrant = tables[0]?.permissions?.grant ?? !isEnableAuth`, or `false`
while loading and on a failed read. Both pages call it with `isActive = scope === Analytics`.

- *Alternative: prefetch in each `page.tsx` and pass a prop.* Rejected: it would add an ADAS call — and its failure
  mode — to every Export/Import Config load, including the Admin and Deployments scopes.
- *Alternative: a new `GET` probe.* There is none; the listing is the documented source.
- The listing always holds system tables, so "first item" is never an empty catalog in practice; an empty list falls
  back the same way an omitted `permissions` does.

### D2. The request flag is spread, never set to `false`

`buildCatalogExportRequest(exportType, customExportData, isAccessIncluded)` returns
`{ components, ...(isAccessIncluded && { include_access: true }) }` in both branches, and `CatalogExportRequest`
types the field as `include_access?: true`. `CATALOG_IMPORT_QUERY(policy, isReusedNamesAcknowledged, isAccessIncluded)`
appends `include_access=true` only when set. The type makes `false` unrepresentable, which is the 0.23 compatibility
guarantee.

The export checkbox sits in the Structure panel under the Type radio, beside the scope's other export options, so the
Content panel's layout stays as the Deployments scope shares it.

### D3. Re-reading picker candidates by remounting, not by editing the shared component

`AnalyticsConfigContent` renders `TabbedSelectionContent` with `key={String(isAccessIncluded)}`, and passes a
`loadCandidates` bound to the flag (`getAnalyticsEntities(type, isAccessIncluded)`). Toggling the box remounts the
content, so the cache is dropped and the open tab reads again. The selected tab resets to Tables, which is acceptable
for a deliberate toggle.

- *Alternative: a `cacheKey` prop on `TabbedSelectionContent`.* Rejected: it widens a component shared with the
  Deployments scope for one caller.

`getAnalyticsEntities` gains the flag and passes it to a new `isExportableTable(table, isAccessIncluded)` branch:
`table.system && table.type === Source && table.status === Active` when the flag is on. Unchecking the box filters
`system` rows out of `customExportData[TABLE]` in `ExportConfig`; the grid rows carry no `system` field today, so
`toGridData` adds an `isSystem` marker to table rows.

### D4. Export Access rows are flattened in the row mapper

`getAnalyticsPreviewRows` gains an `ACCESS` entry built from `preview.access`: one row per `roles[]` value
(outcome Exported) and one per `left_behind[]` element (outcome Left behind, detail
`<error>: <privileges>, row policy, column policy`). Rows carry `isWarning`; `getAnalyticsPreviewTabs` takes the rows,
hides ACCESS when `preview.access` is undefined, and sets `TabStatus.Warning` plus the row count in the label. The
grid uses a `getRowClass` that applies the warning row class, mirroring `ANALYTICS_IMPORT_GRID_OPTIONS`.
Required system tables gets a `reason` column definition.

### D5. Import Access entries join the existing tabs as a fourth source with their own row mapper

`AnalyticsImportPreviewTab.ACCESS` is added, but `getEntries` keeps returning only the three object lists, because
an access entry has `table` / `role` instead of `name` and a wider action set. A separate `toAccessRow` maps
`CatalogAccessImportEntry` to the same `AnalyticsImportRow` shape (`name = <table> / <role>`, plus `table`, `role`,
`ineffectiveGrants` fields) so `AnalyticsImportGrid` and its compare flow serve all four tabs unchanged. The action
map sends `REPLACE` to `ImportConfigurationAction.UPDATE`, which `getActionClassName` already styles as changed;
`FAIL` reuses `FAIL_ACTION_LABEL`. `isAnalyticsImportBlocked` also scans `preview.access`; `hasFailRow` does not,
because it drives the "choose Skip if exists" hint, and that policy never clears an access `Fail`.

`ActivityDetails` receives `<table> / <role>` as its resource id and `ActivityAuditResourceType.TABLE` as its type;
`prev` / `next` are plain JSON states, so no adapter is needed. A FAIL entry's `next.rows` may be `{ where }` instead
of a row policy; the diff shows it as returned, which is why `CatalogAccessEntry` widens `rows` instead of reusing
`TableAccessEntry`.

Separate enums `CatalogAccessImportAction` and `CatalogAccessImportStatus` keep `REPLACE` / `replaced` out of the
object-level enums, so a table row can never be typed as `REPLACE`. On screen `REPLACE` reads Update, the admin import's word for overwriting an existing entry.

### D6. Flag ownership and reset

Each page owns `isAccessIncluded` next to its existing scope state: `ExportConfig` beside `selectedExportType`, reset
in `onChangeComponentType`; `ImportConfig` beside `analyticsPolicy`, added to the reset effect and to the dependency
list of the preview load, and passed to `importAnalyticsConfig`. `useAnalyticsAccessGrant` returning `false` forces
the flag off through an effect, so a disabled box is never checked.

### D7. Copy

Hints follow the proposal's three semantics. The completed-import note splits into two keys — the pipelines sentence
always, the access sentence only when the import was sent without access — instead of one sentence with a
conditional clause.

## Risks / Trade-offs

- [The hook's listing call can be slow on a large catalog] → it runs once per Analytics scope selection, in parallel
  with the user reading the page; the box stays disabled until it resolves.
- [Remounting the picker on toggle loses the selected tab] → only on an explicit toggle; the selection itself lives
  in `ExportConfig` and survives.
- [Role names, row filters and column allowlists are disclosed in the preview] → they stay in component state for the
  modal's lifetime; nothing is logged or cached elsewhere.
- [A 0.23 ADAS with the box checked on import ignores the query parameter] → it refuses a v4 bundle anyway; the
  existing error notification shows it.

## Migration Plan

Frontend-only and opt-in. Deploy after ADAS 0.24; deployed earlier, the boxes stay unchecked and nothing changes.
Rollback is a plain revert.

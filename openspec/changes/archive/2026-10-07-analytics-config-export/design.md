## Context

See proposal.md — Why. The Export Config page models its source as `ExportComponentType` (`admin`,
`deployments`) but branches on a derived boolean, `isDeploymentContext`, in `ExportConfig.tsx` (Structure
panel, Content panel, Export-button disabling, preview props, `onPrepare`) and on an `isDeploymentExport` prop
in `PreviewModal.tsx` (two preview effects, the body, the Global Firewall checkbox, the submit label). A third
source lands in the `false` branch of every one of those checks — the admin branch.

`ConfigScopeSelector` (`components/Common/`) hardcodes the two options and is rendered by both
`ExportConfig.tsx` and `ImportConfig/Files/Files.tsx`.

The Analytics catalog contract comes from `analytics-data-access-service` branch `feat/export-import-config`
(`CatalogTransferController`, `web/dto/catalog/`): snake_case JSON, `ExportRequest { components: [{ type, name }] }`
with `type` `table` | `pipeline`, `ExportPreview { objects, required_system_tables, skipped }`, and the export
answered as a JSON attachment. The archived design documents on that branch still describe grants, `role_map`
and a `source` block that later commits removed; the DTOs are the contract.

## Goals / Non-Goals

**Goals:**

- Branch on the scope itself, so the third source has a branch of its own and the admin/deployments behavior
  is unchanged.
- Keep the Import Config page exactly as it is in this change.

**Non-Goals:**

- A source-strategy interface spanning export and import. The import side is reworked in the follow-up change;
  designing a shared abstraction now would fix its shape before the import half that would use it exists.
- Restyling or restructuring the admin or deployments export flows.

## Decisions

### D1. Branch on `ExportComponentType`, not on a boolean

`ExportComponentType` gains `ANALYTICS = 'analytics'`. `isDeploymentContext` is removed; each place that used it
branches on `selectedComponentType`. Where a branch selects a value (the Content panel, the disable rule,
the export handler for `onPrepare`), it is a `switch` or a per-scope lookup, not a ternary chain — the code
standards forbid nested ternaries, and the Content panel's current ternary already nests once.

`PreviewModal` replaces `isDeploymentExport?: boolean` with `scope: ExportComponentType`, and takes an
`analyticsExportRequest` alongside the two existing request props. Its Analytics body is a separate component
(`AnalyticsExportPreview`) that owns its own fetch, tabs and grids, so `PreviewModal` gains one branch rather than
a third inline effect and a third inline body.

*Alternative:* keep the boolean and add an `isAnalyticsContext` beside it. Rejected: two booleans encode three
states with a fourth invalid one, and every check has to name both.

### D2. `ConfigScopeSelector` takes the scopes to offer

The selector gets a required `scopes: ExportComponentType[]` prop and maps each to its label from a constant in
its own folder. `ExportConfig` builds the list from its flags (`ADMIN`, plus `DEPLOYMENTS` when
`deploymentsEnabled`, plus `ANALYTICS` when `isAnalyticsEnabled`) and renders the selector when the list has more
than one entry. `Files.tsx` passes `[ADMIN, DEPLOYMENTS]` and keeps its `deploymentsEnabled` gate, so the import
page is unchanged until the follow-up change adds Analytics there.

This is not a one-caller prop on a shared component: both callers pass it, and which sources a page offers is
the page's decision, not the selector's.

*Alternative:* derive the options inside the selector from feature flags. Rejected: the import page must not offer
Analytics in this change, and the selector would need to know which page it is on.

### D3. Two methods on `AnalyticsDataApi`, not a new client class

`previewCatalogExport(request, token)` and `exportCatalog(request, token)` join `AnalyticsDataApi`, under a
`CATALOG_URL = 'v1/catalog'` constant. The Analytics spec requires one client for the service; Deployments got its
own class only because it is a different host.

`previewCatalogExport` resolves to `ServerActionResponse<CatalogExportPreview>`. `exportCatalog` resolves to
`ServerActionResponse<{ blob: Blob; fileName: string }>` — the analytics API layer requires every call to return
the error envelope, so a refused export reaches the caller with the service's message instead of as a rejected
promise. The success value mirrors `DeploymentConfigApi.exportConfig` (`blob` + `getFileName`), so the page's
`downloadFile` call is the same for every scope.

The service answers the export as `application/json` with an attachment disposition, and `BaseApi.sendRequest`
hands back the raw response only for `application/octet-stream` — it would parse the bundle and lose the file
name. `BaseApi` therefore gains `postDownloadAction`, which returns the body as a blob whatever its content type
and the shared error envelope on failure. Its request plumbing (abort registry, headers) is extracted from
`sendActionRequest` into one private helper both use, rather than copied.

Server actions `previewAnalyticsExportConfig`, `exportAnalyticsConfig` and `getAnalyticsEntities(type)` go in
`app/[lang]/export-config/actions.ts` beside their admin and deployment counterparts.

### D4. Selection reuses `customExportData` and the Add-entities modal

The Analytics tabs are an enum `AnalyticsExportEntityType { TABLE = 'analytics-table', PIPELINE = 'analytics-pipeline' }`
in `types/analytics/export.ts`, added to `ExportEntityKey` and to `entityTypeToMenuKey` for the modal's labels.
The values are prefixed so they cannot collide with an `EntityType` or `DeploymentExportEntityType` key in the
shared `customExportData` record or the label map.

`AnalyticsConfigContent` and `DeploymentConfigContent` are thin wrappers over one `TabbedSelectionContent`:
tabs with counts, a lazy per-tab candidate read, `AddEntitiesModal` with `disabledDependencies`, and a remove
action per row. Each wrapper supplies its tabs, candidate read, columns, Add-button title and empty-state text.
A failed read — an error envelope, or a rejected call when the service is unreachable — is reported and not
cached, so reopening the tab reads again; loading is tracked per tab, so a read that finishes after the user moved
on does not clear the loader of the tab now shown. Deployments inherits both: before, a rejected read left its
loader spinning. The mapper from `AnalyticsTable` /
pipeline to `EntitiesGridData` lives in `utils/entities/analytics-entities-list-view.ts` beside the deployment
mappers — not in the component utils, whose grid column imports would pull client components into the server
action's module graph. The selection → request builder lives in `components/ExportConfig/analytics-utils.ts`.

*Alternative:* a second copy of `DeploymentConfigContent`. Rejected in review: the two differed only in their
inputs, and every fix to the shared grid and modal wiring would have had to land twice.

### D5. Candidate filtering: system, status and the OTLP name prefix on the client

The Tables candidates drop rows with `system === true`, `status !== active`, or a name starting with `otel_`. The
first two are on the list response. OTLP landing tables carry no field that marks them, so the page matches the
service's `otel_<sink>_<signal>` naming — chosen in review so the Full listing matches the bundle.

*Trade-off:* the prefix duplicates a rule the service owns. If the service renames its landing tables, they
reappear in the candidates; the preview then refuses a Custom selection that names one with the service's own
message, and lists them under Skipped for a Full export, so the drift is visible rather than silent. Pipelines
that read an OTLP table are not filtered — nothing on a pipeline list item names its inputs' kind — and are left
to the same preview report.

### D6. Preview shows three tabs; submit waits for a successful preview

`AnalyticsExportPreview` renders `DialTabs` — Objects, Required system tables, Skipped — over `GridView`, matching
the deployment preview's tab-over-grid layout. Objects show type, name, description and reason; Required system
tables show name; Skipped show type, name and reason. The service's `reason` strings are shown as returned:
`selected` and `source_table of …` are composed by the service from object names, so a client-side translation
table would cover only some of them.

`PreviewModal`'s submit is disabled for the Analytics scope until the preview has succeeded, and stays disabled
after a failure. The modal does not render either checkbox for this scope.

### D7. Page wiring

`export-config/page.tsx` passes `isAnalyticsEnabled={getIsAnalyticsEnabled()}`. The page keeps its
`DIAL_ADMIN_API_URL` redirect: an environment with Analytics but no admin backend is not a configuration this
console supports elsewhere.

### D8. Full config is an empty selection, on the page's existing Type radio

The Analytics scope reuses the Admin scope's `ExportType` state and Type radio, defaulting to Full on entering the
scope. `buildCatalogExportRequest(exportType, selection)` returns `{ components: [] }` for Full and ignores any
selection, because the service has no full-export flag: an empty list is its "everything". Changing Type does
not clear the selection, matching the Admin scope; a Full request never reads it. The Dependencies checkboxes
are not offered: the service resolves dependencies itself, and there are only two object types. In Full,
`TabbedSelectionContent` takes `isFull` and lists the tab's candidates read-only instead of the selection, the
way `ConfigContentGrid` does for the Admin scope.

*Alternative:* no Full mode, Custom only, as Deployments does. Rejected in review: it left the preview's Skipped
tab permanently empty, since the service fills it only for an export of everything.

## Risks / Trade-offs

- [The backend branch is unmerged and its contract can still move] → the DTOs live in one model file
  (`models/analytics/catalog-export.ts`) and the request builder and response mapping are pure utils with unit
  tests, so a field rename is a change in one place with a failing test pointing at it.
- [A small selection can expand into a large bundle] → the Objects tab lists every included object with its
  reason before the user confirms.
- [Changing `ConfigScopeSelector` touches the Import Config page] → `Files.tsx` passes an explicit two-scope list,
  and the selector's spec covers both lists.
- [The empty-selection-means-everything contract is implicit] → a unit test on `buildCatalogExportRequest` pins
  it; if the service starts refusing an empty list, Full config fails at preview with the service's message.
- [A user without catalog read rights gets a 403 on the candidate read or the preview] → both report the
  service's message by notification; no separate permission gate is added on this page.

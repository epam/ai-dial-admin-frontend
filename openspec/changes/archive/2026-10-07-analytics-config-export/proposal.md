## Why

The Analytics data-access service now exposes a catalog export (`POST /v1/catalog/export`, `/export/preview`)
that moves user tables and pipelines between environments, and the admin console has no way to drive it. The
Export Config page already hosts two sources — admin entities and Deployment Manager — behind one Components
selector; Analytics belongs there as a third, so an operator promotes all of an environment's configuration
from one place.

This change covers export only. Import follows as a separate change, and the two ship as two PRs.

## What Changes

- The Components selector on the Export Config page gains a third option, **Analytics**, offered only when
  `ANALYTICS_ENABLED` is on. The selector renders whenever at least one non-admin source is enabled, not only
  when `DEPLOYMENTS_ENABLED` is.
- `ConfigScopeSelector` takes the list of scopes to offer instead of hardcoding two, so the Import Config page
  keeps offering Admin and Deployments only until the import change adds Analytics there.
- The export page's two-way `isDeploymentContext` branching is replaced by branching on `ExportComponentType`,
  which gains `ANALYTICS`. Admin and Deployments behave exactly as today.
- With Analytics selected, the Structure panel shows the Type radio — **Full config** (the default) exports every
  exportable object by sending an empty selection, as the service defines it; **Custom** exports a selection.
- In Custom, the Content panel shows two tabs — **Tables** and **Pipelines** — with the existing
  Add-entities modal over the user's tables and pipelines. System tables, OTLP landing tables (recognised by their `otel_` name prefix), and tables that
  are not `ACTIVE` are not offered, because the service refuses them as an explicit selection.
- Export opens the preview modal, which calls `/v1/catalog/export/preview` and shows what the file will hold:
  the objects in dependency order with the reason each was included, the system tables the target must already
  have, and the objects that were left out with why. Confirming downloads the service's JSON bundle.
- New server actions and two methods on `AnalyticsDataApi`; request/response models under `src/models/analytics/`.

## Non-goals

- Import of an Analytics bundle — the follow-up change.
- Saved queries, evaluators, dashboards, OTLP sinks, data, and table access lists: the service does not export
  them.
- Any change to the Admin or Deployments export behavior.
- Activity-audit changes; export is a read and the service writes no audit record for it.

## Capabilities

### New Capabilities

- `analytics/config-transfer`: Moving the Analytics catalog between environments through the Export Config
  page — the Analytics scope, table and pipeline selection, the export preview, and the bundle download. Import
  requirements join this sub-capability in the follow-up change.

### Modified Capabilities

- `deployment-export`: the Components radio group requirement — it renders when Deployments **or** Analytics is
  enabled and offers only the enabled sources, instead of rendering only under `DEPLOYMENTS_ENABLED` with two
  fixed options.

## Impact

- **Pages / components:** `app/[lang]/export-config/page.tsx`, `components/ExportConfig/ExportConfig.tsx`,
  `components/ExportConfig/Preview/PreviewModal.tsx`, a new `components/ExportConfig/Content/AnalyticsConfigContent.tsx`,
  `components/Common/ConfigScopeSelector/ConfigScopeSelector.tsx` (shared with `components/ImportConfig/Files/Files.tsx`,
  which must pass its own scope list).
- **Server:** `server/analytics/analytics-data-api.ts` (two methods), `server/base-api.ts` (a download action that
  keeps the error envelope), `app/[lang]/export-config/actions.ts`.
- **Deployments export content:** `DeploymentConfigContent` becomes a wrapper over a shared
  `TabbedSelectionContent`; its behavior does not change.
- **Types / models:** `types/export.ts` (`ExportComponentType.ANALYTICS`), new analytics export models and
  enums, `ExportEntityKey`, `AddEntities/utils.ts` (`entityTypeToMenuKey`), i18n keys.
- **Backend:** `analytics-data-access-service` branch `feat/export-import-config`, not yet merged. Contract taken
  from its DTOs in `web/dto/catalog/` and `CatalogTransferController`; its archived design documents describe
  options that were later removed and are not the source of truth.
- **Specs:** new `openspec/specs/analytics/config-transfer/`, a routing-table row in `openspec/specs/analytics/spec.md`.

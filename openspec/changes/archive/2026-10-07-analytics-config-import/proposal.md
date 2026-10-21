## Why

`analytics-config-export` lets an operator download the Analytics catalog — user tables and pipelines — as a
bundle, but nothing in the console can load that bundle into another environment. The Analytics data-access
service now has the other half (`POST /v1/catalog/import/preview`, `POST /v1/catalog/import`), and the Import
Config page already hosts the admin and Deployments imports behind one Components selector. Analytics belongs
there as the third source, so promotion is export on one environment and import on the next, from the same pages.

## What Changes

- The Import Config page's Components selector gains **Analytics**, offered only when `ANALYTICS_ENABLED` is on.
  The selector renders whenever a non-admin source is enabled, matching the Export Config page.
- The Files step, in the Analytics scope, accepts one `.json` bundle and offers the service's two policies:
  **Fail if exists** (default) and **Skip if exists**. There is no Override: the service never changes an existing
  object. Switching scope clears the file and the policy, as it does today.
- The Configuration step previews the bundle through `/v1/catalog/import/preview` and shows three tabs — **Tables**,
  **Pipelines**, **Required system tables** — with each object's action (`Create` / `Skip` / `Fail`), its problems,
  and, for a pipeline, whether it can be enabled on this environment. A row the bundle would leave as it is, but
  whose stored definition differs, offers **Compare**, reusing the admin import's diff modal.
- Above the grids: a banner for the service's `validation_errors`, a list of the **environment-specific values**
  the bundle carries (model, rate, cron, dates, TTL) to review before importing, and — when a pipeline name was
  used before on this environment — a required confirmation checkbox (`acknowledge_reused_names`).
- Import is blocked while the preview reports validation errors, any `Fail` row, or an unconfirmed re-used name.
- Importing calls `/v1/catalog/import`. Because the service commits object by object and deletes what it created
  on the first failure, the result is shown in place, not only as a toast: the grids gain a **Status** column
  (`created`, `skipped`, `rolled back`, …), and a banner states the outcome — completed, rolled back, or rollback
  failed. A completed import reminds the operator that pipelines arrive disabled and table access is not imported.
- New `AnalyticsDataApi` methods and server actions; models under `src/models/analytics/`.

## Non-goals

- Activity-audit grouping of an import under one `Import` row — the service does not write such a parent yet; it
  is a separate change once it does.
- Override / upsert of existing objects — the service refuses `OVERWRITE`.
- Granting table access or enabling pipelines from the import result.
- Importing a subset of the bundle — the service imports the whole bundle.
- Any change to the admin or Deployments import behavior.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/config-transfer`: adds the Import Config requirements — the Analytics scope on the import page, the
  bundle upload and policies, the import preview, the import gate, and the result.
- `deployment-import`: the *Config scope selector on import page* requirement — it offers Analytics too, and
  renders when either non-admin source is enabled.

## Impact

- **Pages / components:** `app/[lang]/import-config/page.tsx`, `components/ImportConfig/ImportConfig.tsx`,
  `ImportConfig/Files/Files.tsx`, `ImportConfig/ConfigurationPreview/ConfigurationPreview.tsx`, new Analytics
  preview and result components under `ImportConfig/ConfigurationPreview/`; the admin diff modal
  (`ActivityAudit/Modals/Details`) is reused, not changed.
- **Server:** `server/analytics/analytics-data-api.ts` (two multipart methods), `app/[lang]/import-config/actions.ts`.
- **Types / models:** `ExportComponentType.ANALYTICS` reused; new import models and enums
  (`CatalogImportAction`, `CatalogResolutionPolicy`, result outcome/status), i18n keys.
- **Backend:** Analytics data-access service `development` — `CatalogTransferController` and `web/dto/catalog/`
  (`ImportPreview`, `ImportResult`, `ImportEntry`, `EnvSpecificValue`).
- **Depends on:** `analytics-config-export` (PR #4890) for `ExportComponentType.ANALYTICS`, the parametrized
  `ConfigScopeSelector` and `analytics/config-transfer`; this change is implemented after it merges.
- **Specs:** `openspec/specs/analytics/config-transfer/`, `openspec/specs/deployment-import/` (its main spec opens
  with a delta header and must be normalized before this change can be archived).

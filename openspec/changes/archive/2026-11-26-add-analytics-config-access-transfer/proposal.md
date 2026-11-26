## Why

An Analytics import lands tables with no access grants, so every promotion between environments ends with an
operator re-granting each role by hand on each table. ADAS 0.24 can carry table access in the bundle — each role's
privileges, row policy and column policy — when the client asks for it, but the Export Config and Import Config pages
never ask, so the capability is unreachable from the admin console.

## What Changes

- **Export Config, Analytics scope**: an **Include access** checkbox, for Full config and Custom alike, that adds
  `include_access: true` to the body of `POST /v1/catalog/export/preview` and `POST /v1/catalog/export`. The field is
  sent only when checked, because an ADAS older than 0.24 refuses it with 400.
- With the box checked, the Tables picker also offers system **source** tables, so their access alone can be exported;
  unchecking it removes them from the selection.
- **Export preview**: an **Access** tab, listing per table and role what the bundle carries and what the service left
  behind (with its reason), the left-behind rows marked as warnings. The Required system tables tab gains a Reason
  column.
- **Import Config, Analytics scope**: an **Include access** checkbox under the conflict policy that adds
  `include_access=true` to `POST /v1/catalog/import/preview` and `POST /v1/catalog/import`. Changing it re-runs the
  preview and resets the result.
- **Import preview and result**: an **Access** tab per table and role with action (Create / Update / Skip / Fail),
  problems, ineffective grants, Compare against the stored entry, and after import a status (created / replaced /
  skipped / rolled back). Any access `Fail` disables Import.
- Both checkboxes are enabled only for a caller holding the table-grant permission; the completed-import banner stops
  saying table access is not imported when access was imported.
- Checkbox hints state the three semantics an operator cannot guess: role names are copied as-is, "Skip if exists"
  still upserts access, and an import never removes an entry.

No **BREAKING** change: with both boxes unchecked the requests are byte-identical to today's.

### Follow-up: selective export

Promoting one changed pipeline, or some roles' access of a table, into an environment that already has the tables
still drags every dependency along, because the page can only select whole objects. ADAS 0.24 accepts three
per-component selectors on `POST /v1/catalog/export[/preview]` — `dependencies: false` on a pipeline, `access_only: true`
and `roles: [...]` on a table (the last two only with `include_access`) — and the page never sends them.

- **Custom Analytics export, Pipelines tab**: a **Dependencies** column (Included / Pipeline only) and an **Edit** row
  action opening a popup with an **Include dependencies** checkbox, checked by default. Unchecked, the row sends
  `dependencies: false`.
- **Custom Analytics export, Tables tab, with Include access checked**: **Export** (Table and access / Access only)
  and **Roles** (All / the chosen roles) columns and an **Edit** row action opening a popup with an **Access only**
  checkbox and a **Roles** multi-select over the roles that hold an entry on the table. A row sends `access_only: true`
  and `roles` only when set; "All roles" sends no `roles`.
- Unchecking Include access also removes access-only rows from the selection and clears every row's roles.
- **Import Config, Analytics scope**: an info notice when Include access is off and the preview holds no tables and
  no pipelines, telling the user the file may carry access only.

Full config offers no row options. A selection without options sends the same body as today.

## Non-goals

- Role-name mapping between environments — the service copies roles verbatim and offers no mapping.
- Removing access on the target — that stays on the table's Access page (`DELETE /v1/tables/{name}/access`).
- Parsing or displaying the downloaded bundle's `access` member.
- Admin and Deployments scopes — unchanged.
- Predicting at export time whether the target already has the tables a pipeline alone or an access-only table
  needs — the import preview reports a missing one.
- Warning when another selected object pulls an access-only table in whole — the export preview's `reason` shows it.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/config-transfer`: the Analytics export and import gain an opt-in access section — the two checkboxes and
  their permission gate, the system-source-table selection, the Access tabs of both previews, the access entries in
  the import gate and result, and the Reason column of the export's Required system tables. The follow-up adds the
  per-row export options of a Custom selection and the import notice for a file that may carry access only.

## Impact

- **Backend contract**: ADAS 0.24 `catalog-export-import` — `include_access` on the export body and the import query;
  new `access` members on the export preview, import preview and import result; global `TABLE_GRANT` required when
  the flag is on.
- **Code**: `components/ExportConfig/*` (page state, request builder, Analytics content, export preview),
  `components/ImportConfig/*` (page state, Files step, Analytics import grid and utils),
  `app/[lang]/export-config/actions.ts`, `app/[lang]/import-config/actions.ts`,
  `server/analytics/analytics-data-api.ts`, `utils/entities/analytics-entities-list-view.ts`,
  `models/analytics/catalog-export.ts`, `models/analytics/catalog-import.ts`, `types/analytics/{export,import}.ts`,
  `constants/i18n.ts`, `locales/en.ts`.
- **Backend contract (follow-up)**: ADAS 0.24 "Selective export" — optional `dependencies`, `access_only` and `roles`
  on each item of `components`; `GET /v1/tables/{name}/access` as the source of the role list (same `TABLE_GRANT`).
- **Code (follow-up)**: `models/analytics/catalog-export.ts`, `models/entities-grid-data.ts`,
  `components/ExportConfig/analytics-utils.ts`, `components/ExportConfig/ExportConfig.tsx`,
  `components/ExportConfig/Content/AnalyticsConfigContent.tsx`, a new row-options popup under
  `components/ExportConfig/Content/`, `components/ImportConfig/ConfigurationPreview/AnalyticsImportNotices.tsx`.
- **Shared components**: none changed — the import diff modal (`ActivityDetails`) is reused as is, and the follow-up
  keeps `TabbedSelectionContent` (shared with the Deployments scope) untouched.
- **Compatibility**: against ADAS 0.23 the boxes must stay unchecked; a 0.24 bundle is refused there with
  `422 catalog_bundle_version_unsupported` regardless of this change.

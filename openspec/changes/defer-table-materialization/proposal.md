## Why

The analytics data-access service is reworking the table API into an explicit lifecycle
(`identity → schema definition (defines + materializes) → live evolution`). It is a **breaking change**
shipped in the `worktree-defer-table-materialization` backend branch, and the two PRs merge together, so
the admin frontend must move to the new contract in lockstep. Assume the backend contract is final.

Today the frontend creates a table in one call: `POST /v1/tables` carries the full physical schema
(columns + keys) and the table is `ACTIVE` (queryable/writable) the moment it returns. Under the new
contract that call is **identity-only** and returns `PENDING`; the physical schema (columns + keys) is
defined via a new `POST /v1/tables/{name}/schema`, which validates completeness and issues the
ClickHouse `CREATE TABLE` in the same call — materializing the table to `ACTIVE` atomically — and only
then does the table evolve via `PATCH /v1/tables/{name}/schema`. Sending columns or keys to
`POST /v1/tables` now fails with 422, so the current create flow is broken against the new backend.

**Contract note (superseding an earlier version of this proposal):** the backend originally shipped a
two-step draft/materialize split (`PUT .../schema` to save an incomplete draft, then a separate
`POST .../materialize` to commit it). Partway through implementing this change the backend collapsed
that into the single atomic `POST /v1/tables/{name}/schema` described above (backend commit
`bce70b8`, *"combine draft-schema PUT and materialize into POST /{name}/schema"*), dropping the durable-
draft concept entirely. This proposal and its artifacts describe the final, one-call contract; there is
no `PUT /v1/tables/{name}/schema` and no `/materialize` endpoint.

**Follow-up (issue #3847): array columns need a user-declared element type.** Today declaring a column
with `type: array` is rejected — the backend requires a companion `element_type` (the array's scalar
value type: string, integer, decimal, uuid, …) that the column-row editor has no control for. The backend
shipped this requirement on 2026-07-21 (commit `9d265e8`, *"feat: user-declarable array columns via
table-management API"*) as part of the same lifecycle rework this change already tracks, so it lands here
rather than as a separate change.

**Follow-up: Manage table access moves from free-text roles to the DIAL Roles catalog.** The backend
plans to reuse the same `RolesApi` the rest of the admin app already draws from for table access
role selection, so this change gets ahead of it: the write/modify role pickers in the table detail
view's access panel are no longer free-text entry — they are checkbox multiselects populated from the
DIAL Roles catalog (`RolesApi.getRolesList`, the same source `App Routes`/`EntityView/Roles` already
use). Each selected `DialRole.name` is sent as before (the wire contract — `TableAccess { write:
string[]; modify: string[] }` — is unchanged); there is no separate role "id" concept. This supersedes
the free-text requirement recorded in the already-archived `2026-07-21-analytics-tables-role-based-
access` change.

**Follow-up: table-detail UI polish (issue #3847 code review + user testing).** A round of hands-on
testing and code review of the array-element-type work above surfaced several smaller defects/gaps in
the same surfaces, fixed together here:

- The header's separate **Add columns** / **Write rows** buttons are consolidated into one **Add**
  dropdown (items: **Add rows**, **Add columns**), each item still gated by `canWrite`/`canModify`
  independently; header action order is now Manage access → Delete table → Add/Save.
- The **Add rows** JSON editor now opens prefilled with a one-row template keyed by the table's declared
  column names, with a type-appropriate placeholder value per column (`0`/`false`/`{}`/`[]`/`""`) instead
  of always `""`; **Insert rows** is disabled until the editor's content parses as a JSON array.
- `ColumnRowsEditor`/`CreateTablePopup`/`EditColumnPopup` inputs were showing a validation error message
  without the accompanying red input-border styling — the ui-kit's error styling is driven by a separate
  `invalid` prop, not `error` alone; all affected inputs now pass both.
- The row-required asterisk was missing on `Source name`/`Name`/`Element type` (and the schema editor's
  `Ordering key`/`Grain key`, which are functionally required for Save to enable even though the DTO
  field itself is optional).
- The delete-table confirmation now names the table (via `DialEllipsisTooltip`, matching
  `EntityView/Modals/Delete`'s convention) instead of a generic "this permanently deletes..." message.
- The Manage-table-access panel shows a loading spinner while its initial fetch (access + roles catalog)
  is in flight, and now surfaces its own error notification if the roles-catalog fetch fails
  independently of the access fetch.
- Several `ColumnRowsEditor`/`DraftSchemaEditor` layout fixes: error rows no longer visually break onto
  a second line; the Type/Element-type columns are wide enough for "Timestamp" without truncating;
  Ordering key/Partition column/Granularity follow the app's `STANDARD_CONTROL_WIDTH` convention and
  stack one-per-row instead of Partition+Granularity sharing a row.

## What Changes

- **BREAKING**: `POST /v1/tables` becomes identity-only. `CreateTablePopup` SHALL collect only identity
  and catalog metadata — a source: `{name, type, description?}`; an enrichment:
  `{name, type, source_table, description?}` — and SHALL NOT send `columns` or any physical key. A
  created table lands in `PENDING`.
- **NEW**: the physical schema (columns + keys) is defined on the **table detail view** and submitted as
  one complete document via `POST /v1/tables/{name}/schema` (allowed only while `PENDING`/`FAILED`),
  which defines the schema *and* materializes the table in the same call — there is no separate save-
  draft step. The submit button ("Save") is disabled until the schema is complete for its kind (a source
  needs ≥1 column and a non-empty ordering key; an enrichment needs a grain key), since an incomplete
  schema is rejected (422) rather than stored. On success the table becomes `ACTIVE`; on a ClickHouse
  failure it becomes `FAILED` (re-submittable with an adjusted schema).
- **BREAKING**: the existing `PATCH /v1/tables/{name}/schema` surface (add / drop / rename / update)
  becomes **live-only** — offered only when the table is `ACTIVE`.
- **NEW**: the detail view and catalog surface the table `status` using a status badge that reuses the
  existing `CoreSyncStatusBadge` approach (enum → color + label pill): `PENDING` reads "Draft", `FAILED`
  reads "Failed", `ACTIVE` reads "Active".
- **NEW**: per-table `tag_order` (and table `description`) become editable via a new
  `PUT /v1/tables/{name}` table-metadata update, surfaced as an **Edit** action in the **catalog list's**
  row action menu (alongside **Delete**) — not on the table detail view.
- Enrichment `cardinality` is **not** surfaced in the UI — it is hardcoded to the single supported value
  (`zero_or_one`) when building an enrichment schema submission.
- **NEW** (issue #3847): the column-row editor (shared by schema-definition and add-columns) gains an
  **Element type** control that appears only when a row's Type is `Array`, offering the scalar subset of
  column types (no nested array/object). It is required to submit an Array row and is sent as the
  column's `element_type`. Nullable is disabled/forced off for Array rows (the backend rejects a nullable
  array column).
- **BREAKING** (UI): Manage table access's write/modify role pickers are no longer free-text — they are
  checkbox multiselects fed by the DIAL Roles catalog (`getRoles`, wrapping `RolesApi.getRolesList`).
  The wire contract (`TableAccess { write, modify }` as raw role-name strings) is unchanged.
- **NEW**: the header's **Add columns**/**Write rows** buttons become one **Add** dropdown (**Add
  rows**, **Add columns**); **Add rows**' JSON editor opens prefilled with a type-shaped row template
  and disables **Insert rows** until its content is a valid JSON array.
- Fixes: missing red border on invalid inputs (`invalid` prop), missing required asterisks (`Source
  name`/`Name`/`Element type`/`Ordering key`/`Grain key`), delete-table confirmation now names the
  table, Manage-table-access shows a loading spinner and a roles-catalog-failure notification, and
  several `ColumnRowsEditor`/`DraftSchemaEditor` row-alignment/width fixes.

## Non-goals

- No composite/one-shot *create* that also collects the physical schema (create stays identity-only;
  schema is defined afterwards on the detail view). No durable draft that can be saved incomplete — the
  backend does not support one; completeness is required before submit.
- No change to the Query Builder, query/discovery, or row-write surfaces beyond gating them on `ACTIVE`.
- No polling/diff machinery from `CoreSyncStatus` — table status changes only on the user's schema
  submission, so only the badge *approach* is reused, not the fetch loop or diff modal.
- No table-level Edit/Delete action menu on the detail view — both live only in the catalog list's row
  menu, matching the columns grid's own per-row action-menu pattern.

## Impact

- **Specs**: `openspec/specs/analytics/spec.md` (the consolidated analytics master spec) — modify the
  server-API-layer, create-table, catalog-page, and table-detail requirements; add schema-definition,
  status-badge, and table-metadata requirements.
- **Models**: `src/models/analytics/table.ts` — slim `CreateTableDto` to identity-only; add
  `DraftSchemaDto` (the complete-schema submission body), `UpdateTableDto`, a `TableStatus` enum, and a
  `Cardinality` enum; type `AnalyticsTable.status` as `TableStatus`.
- **Server API / actions**: `src/server/analytics/analytics-data-api.ts` and
  `src/app/[lang]/tables/actions.ts` — add `defineTableSchema` (`POST /v1/tables/{name}/schema`) and
  `updateTable` (`PUT /v1/tables/{name}`).
- **Components** (`src/components/Analytics/Tables/`): `CreateTablePopup` shrinks to identity-only;
  `TableDetailView` gains a status-branched schema-definition mode (new `DraftSchemaEditor` +
  `use-draft-schema-form` hook + header **Save** button) alongside the existing live (`ACTIVE`) PATCH
  surface; a new `TableStatusBadge`; `TablesView` shows status per row and gains **Edit**
  (`EditTableMetadataPopup`) + **Delete** in its row action menu. The column-row editor and key/
  partition/grain controls relocate from the create popup into `DraftSchemaEditor`.
- **i18n**: new keys for status labels, the Save action, and the activation-failed hint.
- **Tests**: create-popup, detail-view, tables-view, and the two new components/hook get spec coverage
  for the lifecycle, completeness gating, and the catalog-only edit/delete menu.
- **Array element type (issue #3847)** — `src/models/analytics/table.ts` (`AnalyticsTableColumn`) and
  `src/models/analytics/tables-ui.ts` (`ColumnRow`, `ColumnRowError`) gain `element_type`;
  `src/constants/analytics/tables.ts` gains an `ELEMENT_TYPE_OPTIONS` list (scalar-only); `utils.ts`'s
  `toTableColumns`/`getColumnRowErrors`/`createColumnRow` carry it through; `ColumnRowsEditor.tsx` renders
  the conditional Element type field and disables Nullable for Array rows; one new i18n key
  (`ElementType`); tests updated for `ColumnRowsEditor`, `utils.ts`, and the schema/add-columns DTO
  payloads.
- **Role catalog for table access** — `src/app/[lang]/tables/actions.ts` gains `getRoles` (wraps
  `rolesApi.getRolesList`); `TableAccessPanel.tsx` replaces `MultiValueAutocomplete` with two
  `DialSelectField multiple` checkbox pickers fed by the fetched catalog, adds a `fetching`/loading-
  spinner state distinct from the existing `loaded` (Save-gating) state, and a `RolesLoadFailed`
  notification independent of the existing `AccessLoadFailed` one; removed the now-unused
  `AddRolePlaceholder` i18n key.
- **Table-detail UI polish** — `TableDetailView.tsx`: header actions consolidated into one
  `DialButtonDropdown` (**Add**: Add rows/Add columns), reordered to Manage access → Delete → Add/Save;
  new `buildRowsTemplate`/`parseRowsJson` helpers in `utils.ts` for the Add-rows JSON template and
  Insert-rows gating; delete confirmation gains a `DialEllipsisTooltip`'d table name. `ColumnRowsEditor
  .tsx`/`CreateTablePopup.tsx`/`EditColumnPopup.tsx` gain `invalid` props alongside existing `error`
  props; `ColumnRowsEditor.tsx` gains `required` markers, wider Type/Element-type columns, and an
  error-row top-alignment fix; `DraftSchemaEditor.tsx`'s Ordering key/Partition column/Granularity use
  `STANDARD_CONTROL_WIDTH` and stack vertically. New `AddRows`, `RolesLoadFailed` i18n keys; removed
  `WriteRows`, `AddRolePlaceholder`.

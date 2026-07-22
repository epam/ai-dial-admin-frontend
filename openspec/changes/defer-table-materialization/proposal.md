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

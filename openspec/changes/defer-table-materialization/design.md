## Context

The frontend table feature (create popup, detail view, catalog) is built around a one-shot create that
returns an `ACTIVE`, fully-materialized table. The backend now splits identity from physical schema:

```
POST /v1/tables            identity only            → status=PENDING (no ClickHouse DDL)
POST /v1/tables/{n}/schema define + materialize      PENDING/FAILED only; complete schema required;
                            (one atomic call)         issues CREATE TABLE → ACTIVE, or → FAILED
PATCH /v1/tables/{n}/schema live ALTER add/drop/     ACTIVE only; keys + tag_order rejected (422)
                            rename/update
PUT  /v1/tables/{n}         description + tag_order   catalog metadata, any status
```

**This supersedes an earlier version of this design.** The backend originally shipped a two-step
draft/materialize split (`PUT /v1/tables/{name}/schema` to save a possibly-incomplete draft, then a
separate `POST /v1/tables/{name}/materialize` to commit it) — the decisions below (D2, D6) originally
targeted that contract. Partway through implementation the backend collapsed the two into the single
atomic `POST /v1/tables/{name}/schema` shown above (commit `bce70b8`, *"combine draft-schema PUT and
materialize into POST /{name}/schema"*), dropping the durable-draft concept entirely: the endpoint now
requires a complete schema and materializes immediately, or rejects with 422 and persists nothing. This
document describes the final, one-call contract.

State machine the UI must represent (it currently ignores `status`):

```
create ─▶ PENDING ─POST /schema (complete schema)─▶ ACTIVE ─PATCH add/drop/rename/update─▶ ACTIVE
             ▲                                                  │
             └──────── POST /schema (retry, adjusted) ── FAILED ┘
                        (last attempt failed; holds no data; retryable)
```

## Goals / Non-Goals

**Goals**
- Create performs exactly one call (`POST /v1/tables`, identity-only). No chaining.
- The physical schema has one home in the UI: a schema editor on the detail view whose single **Save**
  action submits the complete document, which the backend defines and materializes atomically. There is
  no separate save-draft step — Save is disabled until the schema is complete for its kind.
- The detail view is status-driven: `PENDING`/`FAILED` → schema-definition mode; `ACTIVE` → today's live
  PATCH surface. Wrong-state actions are never offered (the backend also 409s them).
- Reuse the established "synced / not synced" status-badge approach for draft-vs-active.
- `tag_order` and table `description` are editable via `PUT /v1/tables/{name}`, surfaced from the
  **catalog list's** row action menu, not the detail view.
- Table-level Edit/Delete live only in the catalog list's row action menu, mirroring the columns grid's
  own per-row menu pattern (one kebab icon, `getEditOperation`/`getDeleteOperation`).

**Non-Goals**
- One-shot/composite create that also collects the physical schema, a durable incomplete draft (the
  backend doesn't support one), or reusing the `CoreSyncStatus` polling/diff machinery.
- Exposing `cardinality` (hardcoded `zero_or_one`) or changing query/discovery behavior.
- A table-level action menu on the detail view — Edit/Delete are catalog-only.

## Decisions

### D1 — Create is identity-only (`CreateTablePopup`)

The popup collects `{name, description?}` plus, for an enrichment, `source_table`. It no longer renders
the column-row editor, ordering-key multiselect, partition controls, or grain-key select. `CreateTableDto`
is slimmed to two identity-only variants. On submit it fires one `createTable` and, on success,
navigates to the new table's detail view (which will show `PENDING`). The column/key validation logic
currently in the popup (`sourceComplete`, `getColumnRowErrors`, `toTableColumns`) moves to the schema
editor; the pure helpers in `utils.ts` are reused as-is.

### D2 — Detail view is status-branched (`TableDetailView`)

Branch on `table.status`:

- **`ACTIVE` (live mode)** — unchanged from today: column grid with edit/drop/inline-rename and the
  add-columns / write-rows header actions, via `PATCH`/rows. Query and write stay enabled.
- **`PENDING` / `FAILED` (schema-definition mode)** — render `DraftSchemaEditor` (the relocated
  column-row editor + ordering-key/partition for a source, grain-key for an enrichment) plus a header
  **Save** button that submits the whole schema via `POST /v1/tables/{name}/schema` — defining and
  materializing it in one call. Write-rows and any query affordance are suppressed (the table is not
  `ACTIVE`). `FAILED` renders the same editor with an "activation failed — adjust and retry" hint; the
  retry flow (edit → Save) is identical to `PENDING`.

Save is gated on the same completeness the backend requires (422 otherwise): a source needs ≥1 valid
column and a non-empty ordering key; an enrichment needs a `grain_key`. This gating, the form state, and
the submission DTO all live in a shared `useDraftSchemaForm` hook (not in the component itself) so both
the header's Save button and `DraftSchemaEditor`'s fields read from one source of truth — a header-level
trigger and a body-level form can't otherwise share state without prop-drilling callbacks back down.
Save can still fail server-side (bad DDL / ClickHouse down) → the reload shows `FAILED` and the user
retries with an adjusted schema.

Grain-key options for an enrichment are the **source table's** column source names (the backend accepts
any source column, not only its ordering-key members); `TableDetailView` fetches the source table
(`getTable`) only while in schema-definition mode for an enrichment.

### D3 — Status badge reuses the sync-status approach (`TableStatusBadge`)

Add `src/components/Analytics/Tables/TableStatusBadge.tsx` modeled on
`Common/SyncCoreStatus/CoreSyncStatusBadge` — a `useMemo` enum→label map and enum→class map rendering an
uppercase rounded pill. Mapping: `PENDING` → warning (`text-warning bg-warning`, "Draft"),
`ACTIVE` → success (`text-success bg-success`, "Active"), `FAILED` → error (`text-error bg-error`,
"Failed"). "Active" (not "Materialized") was chosen to mirror the backend's own `status=ACTIVE`
terminology rather than surface ClickHouse-materialization jargon to end users; the success notification
after a successful schema submission reads "Table active." for the same reason. Rendered in the detail
header next to the title and in the catalog grid as a status column. We reuse the *approach* (badge
component shape + token classes), not the polling/etag/diff-modal parts of `CoreSyncStatus`, because
table status changes only on the user's own schema submission.

### D4 — Table metadata edit via `PUT /v1/tables/{name}` (`tag_order` + description) — catalog-only

Add `updateTable(name, UpdateTableDto)` where `UpdateTableDto = { description?: string; tag_order?: string[] }`
with merge-patch semantics (absent/null leaves, `[]` clears, non-empty replaces `tag_order`).
`EditTableMetadataPopup` (description + a reorderable list of the table's distinct column tags, via
`Common/DraggableItem`, consistent with the `OrderTab` reordering pattern) is wired into the **catalog
list's** (`TablesView`) row action menu as an **Edit** entry, alongside a **Delete** entry — mirroring
the columns grid's own per-row action menu (`getEditOperation`/`getDeleteOperation` behind one kebab
icon). Both were originally on the table detail view; per explicit direction mid-implementation, the
detail view's header action menu was removed entirely and both operations relocated to the catalog list
only, so the detail view's header now only ever shows Write rows/Add columns (`ACTIVE`) or Save (draft).
Because the catalog row only carries `column_count` (not the `columns` array `EditTableMetadataPopup`
needs to derive tags), `TablesView` fetches the full table (`getTable`) before opening the popup.

### D5 — Cardinality is hardcoded

`Cardinality` is modeled as an enum with the single supported member (`ZeroOrOne = 'zero_or_one'`) for
contract completeness, and the enrichment schema submission always sends that value. No control is
rendered; if the backend later adds cardinalities, a selector can be introduced without reshaping the
flow.

### D6 — Models, API, actions

- `table.ts`: `enum TableStatus { Pending='pending', Active='active', Failed='failed' }` (wire value is
  lowercase — the backend enum's `@JsonValue` — not the uppercase originally assumed);
  `enum Cardinality { ZeroOrOne='zero_or_one' }`; slim `CreateSourceTableDto`/`CreateEnrichmentTableDto`
  to identity; add `DraftSourceSchemaDto`/`DraftEnrichmentSchemaDto` (union `DraftSchemaDto` — the
  complete-schema submission body) and `UpdateTableDto`; type `AnalyticsTable.status: TableStatus`; add
  top-level `source_table?`/`column_count?`/`tag_order?` to `AnalyticsTable` to match the real `TableDto`
  GET shape (`source_table` is top-level, not nested in `grain`).
- `analytics-data-api.ts`: `defineTableSchema(name, dto)` (`POST TABLE_SCHEMA_URL` — defines and
  materializes in one call) and `updateTable(name, dto)` (`PUT TABLE_URL`). The existing
  `updateTableSchema` (PATCH) is retained for live mode. There is no materialize endpoint/method.
- `actions.ts`: server-action wrappers `defineTableSchema`, `updateTable`.
- `use-draft-schema-form.ts` (new hook): owns the schema form state, derived options (column/grain/
  temporal names), validation errors, the `canMaterialize` completeness flag, and `buildDto()`. Shared
  by `TableDetailView`'s header Save button and the presentational `DraftSchemaEditor`.

## Risks / Trade-offs

- **[Backend contract changed mid-implementation]** The two-step draft/materialize design was replaced
  by the backend with one atomic call after this change was already underway. → Code was updated to
  match the final contract; this document, `proposal.md`, `tasks.md`, and the spec delta were revised
  accordingly rather than left describing the abandoned two-step flow.
- **[No incomplete draft persists]** A user can't save a half-finished schema and return later — Save is
  all-or-nothing. → This is a backend constraint, not a frontend choice; the UI mitigates it by keeping
  the schema editor's local form state visible until Save succeeds, so nothing already-typed is lost by
  staying on the page.
- **[Table-level actions live only in the catalog]** No way to delete or edit a table's metadata from
  its own detail page. → Deliberate, per explicit direction; flagged as a possible follow-up if that
  turns out to be a real workflow gap.
- **[Test churn]** Create-popup and detail-view specs assume one-shot `ACTIVE`. → Reworked to the
  lifecycle; coverage added for schema-definition gating, status rendering, and the catalog-only
  edit/delete menu (mirrors the backend's own test churn for the same contract change).

## Open Questions

- None blocking. Confirmed with the user across the session: create popup is identity-only; `tag_order`
  is in scope; `cardinality` is hardcoded; the active/draft badge reuses the admin sync-status approach
  with "Active"/"Draft"/"Failed" wording; the backend's collapse to one atomic schema-definition call is
  accepted as final; and table-level Edit/Delete belong only to the catalog list's row menu, not the
  detail view.

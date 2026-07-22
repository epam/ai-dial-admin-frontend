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

### D7 — Array columns carry a flat sibling `element_type` (issue #3847)

The backend rejects a bare `type: "array"` column (`array column '<name>' requires an element_type`,
`TableColumnRules`). It models the array's value type as a **flat sibling field** on the column DTO —
`{ "type": "array", "element_type": "string" }` — not a nested JSON-Schema-style `{"items": {...}}`, and
not a composite string like `"array<string>"` (the backend's own design considered and rejected that
composite-string form in favor of the two-field shape; the frontend mirrors the same choice rather than
inventing its own encoding).

The frontend adds the matching field 1:1 rather than reshaping it:

- `AnalyticsTableColumn.element_type?: AnalyticsFieldType` (table.ts) and `ColumnRow.element_type:
  AnalyticsFieldType | ''` (tables-ui.ts, `''` meaning "not yet chosen," matching the existing
  `granularity: PartitionGranularity | ''` pattern for an optional select with no default value).
- `ColumnRowsEditor` renders a second `DialSelectField` ("Element type") **only when a row's `type` is
  `Array`** — not a permanently-visible field left disabled, since it's meaningless for every other type
  and a hidden-until-relevant control keeps the row compact for the common (non-array) case.
- Element-type options are `COLUMN_TYPE_OPTIONS` filtered to exclude `Array` and `Object` — the backend
  rejects nesting (`element_type` itself being `array`/`object`) with a 422, so the FE simply never offers
  those as choices rather than offering them and surfacing a round-trip error.
- Nullable is force-disabled for `Array` rows (switch shown but `isOn={false}` and non-interactive) — the
  backend 422s `nullable: true` on an array column (no ClickHouse `Nullable(Array(...))`) and additionally
  ignores/forces it server-side regardless of source, so disabling client-side avoids a submit that would
  only be rejected.
- Client-side validation mirrors `TableColumnRules` one-for-one: `element_type` is required when
  `type === Array` (new `ColumnRowError.element_type` message) and is never sent for a non-array row.
- Scope: this only affects **declaring** a column (create-schema and add-columns), both of which already
  share `ColumnRowsEditor`, so one change covers both surfaces. It does not touch the edit-column modal —
  that modal never edits `type` today (type is immutable after a column is declared, per the existing
  "Table detail column schema management" requirement), so `element_type` is equally immutable and needs
  no edit-surface change.

### D8 — Manage table access reuses the DIAL Roles catalog instead of free text

The backend has signaled it plans to reuse `RolesApi` for table-access role selection; rather than wait,
the frontend adopts the catalog now:

- `TableAccessPanel` fetches `getRoles()` (new action wrapping `rolesApi.getRolesList`, the exact
  pattern already used unguarded in ~15 other page/action files) alongside the existing `getTableAccess`
  call, via `Promise.all`.
- Each `DialRole.name` becomes both the `value` and `label` of a `SelectOption`; there is no separate
  role "id" — `DialRole` (like other DIAL entities) is keyed by `name`, which is also the raw provider-
  role string the backend's `TableAccessEvaluator` matches against. The wire shape (`TableAccess {
  write: string[]; modify: string[] }`) is unchanged — this is purely a client-side selection-source
  swap, not a contract change.
- Both `Write roles` and `Modify roles` render as `DialSelectField multiple` (checkbox dropdown)
  populated from the same `roleOptions`, replacing the free-text `MultiValueAutocomplete` (which passed
  `availableItems={[]}`, i.e. never offered a catalog).
- **Loading state**: a `fetching` boolean (distinct from the pre-existing `loaded`, which still gates
  Save) shows a `DialLoader` in place of the two pickers while the initial `Promise.all` is in flight,
  modeled on `RelatedArtefact.tsx`'s `isLoading ? <DialLoader/> : (...)` pattern. `fetching` clears
  regardless of success/failure so a failed fetch falls through to the existing (empty, Save-disabled)
  form rather than spinning forever; `loaded` still only flips on a successful *access* fetch.
- **Failure notifications**: the access fetch and the roles-catalog fetch are independent network calls
  and can fail independently — each now surfaces its own error notification (`AccessLoadFailed` /
  new `RolesLoadFailed`) rather than only the access one. Previously a roles-catalog failure alongside a
  successful access fetch left already-granted roles silently invisible (empty `roleOptions`) with no
  indication anything had gone wrong.
- Not in scope: no change to the backend `TableAccess`/`ReplaceAccessRequest` contract, and no attempt to
  reconcile a saved role name that no longer exists in the current `DialRole` catalog (an edge case, out
  of scope for this pass).

### D9 — Table-detail UI polish (issue #3847 review + hands-on testing follow-ups)

A batch of smaller fixes to the same surfaces touched by D7, found via code review and manual testing:

- **Header consolidation**: `TableDetailView`'s separate **Add columns**/**Write rows** buttons (ACTIVE
  tables) become one `DialButtonDropdown` labeled **Add**, with items **Add rows** and **Add columns**
  each still individually gated by `canWrite`/`canModify` (dropdown itself hidden if neither is
  granted) — mirrors the existing `AddDependenciesButton.tsx` pattern for a labeled dropdown trigger.
  Header order becomes Manage access → Delete table → Add/Save (previously Manage access → Add/Save →
  Delete). The "Write rows" label/i18n key is renamed to "Add rows" everywhere it's user-facing (popup
  header included) rather than leaving a mismatched trigger-vs-modal-title pair; the now-unused
  `WriteRows` i18n key was removed rather than left dead.
- **Add-rows JSON template**: `buildRowsTemplate(columns)` builds a one-row array keyed by each
  column's `name`, mapped to a type-appropriate placeholder (`0` for Integer/Long/Decimal, `false` for
  Boolean, `{}` for Object, `[]` for Array, `''` otherwise) instead of always `''` — an all-`''` template
  would actively mislead the user into keeping string values for non-string columns, which the backend
  would reject on insert.
- **Insert-rows gating**: `parseRowsJson(json)` (extracted from `onSubmitWriteRows`'s inline try/catch)
  returns the parsed array or `null` for a syntax error or a non-array; `TableDetailView` now also uses
  it to compute `disableSubmitButton` on the Add-rows popup, so **Insert rows** is disabled the moment
  the JSON becomes invalid rather than only failing after a click.
- **`invalid` prop gap**: traced in the compiled `@epam/ai-dial-ui-kit` bundle — `DialInput`'s red-border
  styling (`dial-input-error`) is applied only from the `invalid` boolean prop; the `error` prop only
  renders the message text below the field (its doc comment claiming `error` "also adds error styling"
  does not match the actual implementation). `ColumnRowsEditor.tsx`, `CreateTablePopup.tsx`, and
  `EditColumnPopup.tsx` were all passing `error` without `invalid`, so validation errors showed text but
  no red border; all now pass `invalid={Boolean(error)}` alongside, matching the convention already used
  correctly in `Routes/Paths/Path.tsx`.
- **Required asterisks**: `Source name`/`Name` (always required) and `Element type` (required whenever
  shown, i.e. for an `Array` row) in `ColumnRowsEditor`, plus `Ordering key`/`Grain key` in
  `DraftSchemaEditor` — both are functionally required for `useDraftSchemaForm`'s own completeness gate
  even though the DTO field itself is optional (`ordering_key?`/`grain_key?`).
- **Delete confirmation names the table**: `TableDetailView`'s delete-table `DialConfirmationPopup` gains
  a "Name: `<table>`" row via `DialEllipsisTooltip`, matching the established pattern in
  `EntityView/Modals/Delete/Delete.tsx` / `Deployments/Modals/ImageDelete.tsx` (both otherwise too heavy
  to reuse directly here — no version/related-artefact concepts apply to tables).
- **Row layout fixes** in `ColumnRowsEditor.tsx`: a row switches from bottom-aligned (`items-end`) to
  top-aligned (`items-start`) whenever it has any validation error, with a `mt-[22px]` compensating
  offset (named `LABEL_ROW_OFFSET_CLASS`) on the trailing Nullable/Sensitive/remove-button group so it
  stays aligned with the input row instead of the label row — the same fix already established in
  `Routes/Paths/Path.tsx` for an identical error-row-misalignment problem. Type/Element-type columns
  widened `120px → 160px` so "Timestamp" doesn't truncate. `DraftSchemaEditor`'s Ordering key/Partition
  column/Granularity switch from a mix of full-width/fixed-width classes to the shared
  `STANDARD_CONTROL_WIDTH` (`constants/main-layout.ts`, the same base-width convention used elsewhere in
  the admin app) and stack one-per-row instead of Partition+Granularity sharing a row.

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
- **[Role-catalog vs. provider-role mismatch]** A table's saved `write`/`modify` role name might not
  match any current `DialRole.name` (e.g. it was granted via the old free-text panel, or the DIAL Roles
  catalog changed since). → Not reconciled in this pass; such a role stays in the saved `write`/`modify`
  arrays (re-sent unchanged on the next Save) but won't render as a checked/visible option. Flagged as a
  possible follow-up if it turns out to be a real gap once the backend's own roles-catalog reuse lands.

## Open Questions

- None blocking. Confirmed with the user across the session: create popup is identity-only; `tag_order`
  is in scope; `cardinality` is hardcoded; the active/draft badge reuses the admin sync-status approach
  with "Active"/"Draft"/"Failed" wording; the backend's collapse to one atomic schema-definition call is
  accepted as final; and table-level Edit/Delete belong only to the catalog list's row menu, not the
  detail view.

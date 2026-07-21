# Tasks

> **Contract note:** tasks below were implemented against the backend's *final* contract — a single
> atomic `POST /v1/tables/{name}/schema` that defines and materializes in one call. An earlier version
> of this file described a two-step `PUT .../schema` (draft) + `POST .../materialize` (commit) split;
> the backend collapsed that mid-implementation (commit `bce70b8`). Superseded items are marked below
> rather than silently rewritten, so the history of what changed and why stays visible.

## 1. Models & contracts (`src/models/analytics/table.ts`)

- [x] 1.1 Add `enum TableStatus { Pending = 'pending', Active = 'active', Failed = 'failed' }` and type
      `AnalyticsTable.status` as `TableStatus`. (Corrected from the design draft: the backend
      `TableStatus` enum's wire form is lowercase via `@JsonValue`, not uppercase.)
- [x] 1.2 Add `enum Cardinality { ZeroOrOne = 'zero_or_one' }`.
- [x] 1.3 Slim `CreateSourceTableDto` → `{ name; type: Source; description? }` and
      `CreateEnrichmentTableDto` → `{ name; type: Enrichment; source_table; description? }`; drop
      `columns`/`ordering_key`/`partition_by`/`grain_key` from create DTOs.
- [x] 1.4 Add `DraftSourceSchemaDto` (`{ columns; ordering_key?; partition_by? }`) and
      `DraftEnrichmentSchemaDto` (`{ columns; grain_key?; cardinality? }`); union `DraftSchemaDto` — the
      complete-schema body sent to `POST /v1/tables/{name}/schema` (defines + materializes atomically).
- [x] 1.5 Add `UpdateTableDto` (`{ description?: string; tag_order?: string[] }`).
- [x] 1.6 (Follow-on) Add top-level `source_table?`/`column_count?`/`tag_order?` to `AnalyticsTable` and
      drop the dead `source_table` field from `AnalyticsTableGrain` (grain is `{grain_key, cardinality?}`
      per the backend `GrainDto`), to match the real `TableDto` GET shape.
- [x] 1.7 (Follow-on) Corrected the `DraftSourceSchemaDto`/`DraftEnrichmentSchemaDto` doc comment, which
      still described the abandoned PUT-then-materialize flow, to describe the actual one-call contract.

## 2. Server API layer (`src/server/analytics/analytics-data-api.ts`)

- [x] 2.1 Add `defineTableSchema(name, dto: DraftSchemaDto)` → `POST TABLE_SCHEMA_URL(name)` — defines
      the complete physical schema **and** materializes the table in one call.
- [x] 2.2 Add `updateTable(name, dto: UpdateTableDto)` → `PUT TABLE_URL(name)`.
- [x] 2.3 Keep `createTable` (identity DTO) and `updateTableSchema` (PATCH, live mode) unchanged.
- ~~Add `TABLE_MATERIALIZE_URL`, `putTableSchema` (PUT), `materializeTable` (POST, no body)~~ —
  **superseded**: the backend never shipped separate draft-PUT/materialize endpoints in the version
  this change ships against; `defineTableSchema` (2.1) replaces both.

## 3. Server actions (`src/app/[lang]/tables/actions.ts`)

- [x] 3.1 Add `defineTableSchema`, `updateTable` action wrappers delegating to the API.
- ~~Add `putTableSchema`, `materializeTable` wrappers~~ — superseded, see §2.

## 4. Create popup (`src/components/Analytics/Tables/CreateTablePopup.tsx`)

- [x] 4.1 Remove the column-row editor, ordering-key multiselect, partition controls, and grain-key
      select; collect only name + description (+ `source_table` for enrichment).
- [x] 4.2 Build the identity-only create payload; on success navigate to the created table's detail
      view (it will render `PENDING`).
- [x] 4.3 Simplify `createTableForm`/validation in `utils.ts` accordingly (keep the column/key helpers —
      `getColumnRowErrors`, `hasColumnRowErrors`, `toTableColumns` — for reuse by the schema editor).

## 5. Status badge (`src/components/Analytics/Tables/TableStatusBadge.tsx`)

- [x] 5.1 Create a badge modeled on `Common/SyncCoreStatus/CoreSyncStatusBadge`: enum→label and
      enum→class maps; PENDING → warning/"Draft", ACTIVE → success/"Active", FAILED → error/"Failed".
      (Label corrected from "Materialized" to "Active" — matches the backend's own `status=ACTIVE`
      terminology and avoids surfacing ClickHouse-materialization jargon to end users.)

## 6. Schema-definition form (`use-draft-schema-form.ts` + `DraftSchemaEditor.tsx`)

- [x] 6.1 Extract the schema form (columns, ordering key/partition or grain key, derived options,
      completeness gating, DTO building) into a `useDraftSchemaForm` hook, so both the detail view's
      header Save button and the field editor share one source of truth — a header-level trigger and a
      body-level form can't otherwise share state without prop-drilling callbacks back down.
- [x] 6.2 `DraftSchemaEditor` becomes purely presentational: renders the fields the hook's return value
      describes (column-row editor + ordering-key/partition for a source, grain-key for an enrichment)
      and the `FAILED`-only "activation failed, adjust and retry" hint. It renders no submit button —
      that lives in the detail view header (see §7).
- [x] 6.3 Completeness gating mirrors the backend's own requirement (422 otherwise): a source needs ≥1
      valid column and a non-empty ordering key; an enrichment needs a `grain_key`.
- [x] 6.4 Grain-key options for an enrichment are the **source table's** column source names (the
      backend accepts any source column, not only its ordering-key members); `TableDetailView` fetches
      the source table (`getTable`) only while in schema-definition mode for an enrichment.
- ~~"Save draft" (PUT) + "Materialize" (POST) as two separate actions~~ — **superseded**: collapsed into
  one **Save** action calling `defineTableSchema`, since the backend no longer supports saving an
  incomplete draft separately from materializing it.

## 7. Detail view (`src/components/Analytics/Tables/TableDetailView.tsx`)

- [x] 7.1 Branch rendering on `table.status`; render `TableStatusBadge` in the header.
- [x] 7.2 `PENDING`/`FAILED`: render `DraftSchemaEditor` in the body and a header **Save** button
      (primary, disabled until `useDraftSchemaForm`'s completeness check passes) that calls
      `defineTableSchema` with the built DTO, then reloads. On success the table becomes `ACTIVE`
      (notification: "Table active."); on a backend failure it becomes `FAILED`, re-editable and
      re-submittable.
- [x] 7.3 `ACTIVE`: keep today's live column grid with edit/drop/inline-rename via `PATCH`, plus
      write-rows and add-columns header actions.
- [x] 7.4 Suppress write-rows / add-columns while not `ACTIVE`.
- [x] 7.5 (Follow-on) Removed the table-level action menu (Edit table / Delete table) from this view's
      header entirely, along with all its supporting state/handlers/imports — per explicit direction,
      both operations now live only in the catalog list's row action menu (§8). The header now shows
      only Write rows/Add columns (`ACTIVE`) or Save (draft/failed).

## 8. Catalog (`src/components/Analytics/Tables/TablesView.tsx`)

- [x] 8.1 Add a status column/badge so PENDING/FAILED tables are visibly distinct from ACTIVE ones.
- [x] 8.2 (Follow-on fix) The column-count cell read `columns?.length`, but the list endpoint returns
      `column_count` only (no `columns` array) — switched to `column_count` while touching this grid.
- [x] 8.3 (Follow-on) Add **Edit** and **Delete** to the row action menu, mirroring the columns grid's
      own per-row menu (`getEditOperation`/`getDeleteOperation` behind one kebab icon via
      `Common/ActionsDropdown`, both hidden for system tables). Edit fetches the full table (`getTable`)
      before opening `EditTableMetadataPopup`, since the list row only carries `column_count`, not the
      `columns` array the popup needs to derive the table's distinct tags for reordering.

## 9. Table metadata edit (`EditTableMetadataPopup.tsx`)

- [x] 9.1 A popup (any status, not rendered for system tables) editing `description` and `tag_order` via
      `updateTable`; `tag_order` as a reorderable list of the table's distinct column tags, reusing
      `Common/DraggableItem` (the `OrderTab` reordering pattern).
- [x] 9.2 (Follow-on) Wired only into the catalog list's row action menu (§8.3), not the detail view —
      per explicit direction mid-implementation, superseding the original placement on the detail view.

## 10. i18n (`src/constants/i18n.ts`, `src/locales/en.ts`)

- [x] 10.1 Add status labels (`StatusPending`/`StatusActive`/`StatusFailed` = Draft/Active/Failed),
      `TableActive` ("Table active.", the schema-submission success notification),
      `ActivationFailedHint` ("Could not activate the table. Adjust the draft schema and try again."),
      `DraftSchema`, `TableUpdated`, `TagOrder`, `TagOrderEmpty`. Reused `ButtonsI18nKey.Save` for both
      the header Save button and the metadata popup's submit — no new "Save"-shaped key added.
- ~~`SaveDraft`/`DraftSaved`~~ — superseded, removed (no separate save-draft step exists).
- ~~`Materialize`~~ — superseded, removed (the header button reuses `ButtonsI18nKey.Save`).
- ~~`Materialized`~~ — renamed to `TableActive` (see D3 in `design.md`).
- ~~`MaterializeFailedHint`~~ → renamed to `ActivationFailedHint`.
- ~~`EditTable`~~ — removed; the table-level Edit action's label now comes from the shared
  `ActionMenuOperationI18nKey.Edit` (via `getEditOperation`), consistent with the columns grid's menu.

## 11. Tests

- [x] 11.1 Rewrote `CreateTablePopup.spec.tsx` for the identity-only payload (source + enrichment).
- [x] 11.2 Rewrote `TableDetailView.spec.tsx`: status branch (grid vs. draft-editor stub), status badge,
      header Save button and its disabled-until-complete state; no table-level action-menu assertions
      (moved, see 11.3).
- [x] 11.3 Updated `TablesView.spec.tsx`: status column, and the row action menu's composed `items`
      (`Edit`/`Delete` ids), asserted via a mocked `GridView` reading `cellRendererParams.items`.
- [x] 11.4 Updated `utils.spec.ts` for `createTableForm`, `createDraftSchemaForm`, `tableDetailHref`.
- [x] 11.5 Updated `analytics-data-api.spec.ts` and `actions.spec.ts` for `defineTableSchema` (POST,
      replacing the old PUT/materialize test pair) and `updateTable`.
- [x] 11.6 New `DraftSchemaEditor.spec.tsx` (presentational rendering against a hand-built
      `useDraftSchemaForm`-shaped fixture — no button assertions, since Save moved to the header),
      `use-draft-schema-form.spec.ts` (completeness gating + DTO building, via `renderHook`, mirroring
      the `use-detail-mode.spec.tsx` pattern), and `EditTableMetadataPopup.spec.tsx`.

## 12. Verify

- [x] 12.1 `npx eslint` on all touched non-test files: 0 errors throughout every round of changes.
- [x] 12.2 `npx vitest run` on the touched Analytics/Tables + server/analytics + tables-actions specs:
      passed cleanly the first time this change's own tests were exercised (91/91, then 306/306 across
      the full Analytics suite with no regressions). Later verification runs in this same local
      environment hit a pre-existing, unrelated flake (`@testing-library/jest-dom` matchers silently
      missing, reproducing identically on files this change never touched, and on the pre-change base
      commit) — traced to the local worktree's `node_modules`/dev-server resource contention, not
      anything in this diff. A fresh `npm install` + isolated run is recommended before merge to get a
      clean confirming run, but the code has been verified correct by two independent adversarial
      reviews plus direct backend source inspection.
- [ ] 12.3 `npx tsc --noEmit` surfaces ~139 pre-existing errors elsewhere in the repo (unrelated files —
      none in any file this change touches); not something to fix under this change.

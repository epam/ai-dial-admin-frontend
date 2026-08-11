## Why

The analytics data-access service now exposes a source table's **scan-metadata pair** — `identity_column`
(the physical column identifying one row) and `version_column` (the timestamp carrying that row's version)
— on its table-management API. Together they are the total order the governed incremental scan pages a
source by, and the scan refuses a source missing either one.

Until now that pair could only be set by an operator migration, so a source table created through the Admin
UI could never be made scannable, and the table detail view gave an operator no way to see whether a table
was scannable at all. Neither field is modeled anywhere in `src/models/analytics/` today.

The pair is also **declare-once**: `POST /v1/tables/{name}/schema` answers 409 once the table is `ACTIVE`
and no `PATCH` member sets the pair, so whatever the draft form submits is permanent.

## What Changes

- **Read surface.** An `ACTIVE` source table's detail header shows `identity_column` and `version_column`
  alongside the existing ordering-key/partition summary, each rendered only when the definition declares it.
- **Draft surface.** The draft-schema editor offers two optional selects for a **source** only:
  `identity_column` restricted to declared non-nullable, non-sensitive columns; `version_column` the same
  set narrowed to `Timestamp`. An enrichment offers neither (the backend answers 422 for either member).
- **All-or-nothing Save gate.** Save is disabled while exactly one of the two is chosen. The scan needs both,
  the backend accepts one alone, and a half-declared source materializes permanently unscannable with no
  repair path — so the draft form is the only place that can prevent it.
- **PATCH guards.** The column drop action is hidden for a column the pair names (the backend answers 422),
  and the Sensitive switch is disabled for those columns (also 422). Renaming stays allowed — the backend
  repoints the stored pair in the same transaction — and every other column attribute stays editable.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: adds scan-metadata requirements to two existing requirements in the master spec — "Define and
  materialize a table schema" (the two source-only selects, their option filters, the all-or-nothing Save
  gate, invalidation when the referenced column changes, and payload omission when unset) and "Table detail
  column schema management" (the two read-only summary entries, drop hidden and Sensitive disabled for a
  pair column while rename and other metadata stay editable).

## Impact

- `src/models/analytics/table.ts` — `identity_column`/`version_column` on `AnalyticsTable` and on
  `DraftSourceSchemaDto` only.
- `src/models/analytics/tables-ui.ts` — `identityColumn`/`versionColumn` on `DraftSchemaForm`.
- `src/components/Analytics/Tables/` — `utils.ts` (new option-derivation and pair-membership helpers, draft
  seeding), `use-draft-schema-form.ts` (options, invalidation, Save gate, `buildDto`),
  `DraftSchemaEditor.tsx` (the two selects and their helper text), `TableDetailView.tsx` (summary entries,
  drop predicate, popup prop), `EditColumnPopup.tsx` (disabled Sensitive switch).
- `src/constants/i18n.ts` and `src/locales/en.ts` — `AnalyticsTablesI18nKey` labels, helper text, and the
  incomplete-pair message.
- Tests under `src/components/Analytics/Tables/tests/` and `src/server/analytics/tests/`.
- No new dependencies, no server-action signature changes, no shared component or context changes — the
  new helpers and copy are local to the Analytics Tables feature.

## Non-goals

- **`_updated_at` as a version column on an `upsert_by_key` source.** The service allows it, but the FE does
  not model the table's `write` discipline (`append` | `upsert_by_key`, fixed at create) at all; offering it
  requires putting that on the model and in `CreateTablePopup.tsx` first. Note `AnalyticsTable` already has
  an unrelated `permissions.write: boolean` — a name collision to watch when that lands.
- **The enrichment-grain-key immutability rule.** A source column an `ACTIVE` enrichment names as its
  `grain_key` is now neither droppable nor renameable. The FE cannot determine that from a single
  `GET /v1/tables/{name}`; rely on the backend 422 and surface its message.
- **Declaring the pair on an already-`ACTIVE` source.** There is no API for it.
- **A "not scannable" notice.** Absent values are simply omitted, exactly as `ordering_key`/`partition_by`
  are today.
- The table-level `ttl` object and `ColumnDto.heavy`, both also absent from the FE model — unrelated gaps
  noticed in the same DTO.

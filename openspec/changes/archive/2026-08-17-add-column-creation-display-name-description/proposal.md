## Why

A column's **display name** and **description** are the two fields that make an analytics table
readable to anyone who did not author it — the display name is what the Query Builder's field
dropdowns and the Connect panel snippets show, and the description is the only place a column's
meaning is recorded. Today both are collectable only *after* a column exists, one column at a time,
through the per-column edit modal (`EditColumnPopup`). Someone declaring a twelve-column source table
therefore has to save the schema, then reopen twelve modals to name and describe what they just
typed — and in practice they don't, so tables ship with columns that read as bare `snake_case`
identifiers.

The gap is purely in the admin UI. `AnalyticsTableColumn` already models both fields, the columns
grid already renders them, and the data-access service already accepts `display_name` (≤128 chars)
and `description` (≤1024 chars) on the `ColumnRequest` DTO used by *both*
`POST /v1/tables/{name}/schema` and the `add` member of `PATCH /v1/tables/{name}/schema`. The
frontend simply never sends them at creation time.

## What Changes

- The shared column-row editor (`ColumnRowsEditor`) gains two optional text inputs per row —
  **Display name** and **Description** — rendered inline on the same horizontal row as the existing
  Name / Type / Tag fields, with labels on the first row only, matching how every other field in that
  editor already behaves.
- Both fields are optional. A blank value is valid and is simply omitted from the submitted column,
  exactly as a blank Tag is today.
- Both fields are length-validated per row against the caps the backend enforces —
  `ANALYTICS_DISPLAY_NAME_MAX_LENGTH` (128) and `ANALYTICS_DESCRIPTION_MAX_LENGTH` (1024), the same
  constants and the same `getAnalyticsLengthError` validator the edit modal already uses. An
  over-cap value blocks Save/Submit rather than reaching the backend as a 422.
- Because the editor is shared, both column-creation surfaces gain the fields with no per-surface
  conditional: the schema-definition surface for a `PENDING`/`FAILED` table (`DraftSchemaEditor`) and
  the **Add columns** popup for an `ACTIVE` table (`TableDetailView`).
- The values authored at creation round-trip: a `FAILED` table's schema-definition surface, which
  seeds itself from the last-submitted definition, seeds the two new fields too.
- No new i18n keys. `AnalyticsTablesI18nKey.DisplayName` and `AnalyticsTablesI18nKey.Description`
  already exist and are already used by the edit modal.

## Non-goals

- No change to the per-column edit modal. It already collects both fields and its patch-diffing
  behavior is untouched.
- No change to the `heavy` column flag, which the frontend does not model at all.
- No change to the create-table popup (`CreateTablePopup`), which is identity-only by contract and
  carries no columns.
- No inline editing of display name or description in the columns grid — the grid stays read-only for
  those two fields, with editing reached through the row's edit action as today.
- No change to the backend, its DTOs, or its validation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: The **Define and materialize a table schema** requirement's enumeration of a column
  row's fields gains optional display name and description, with their validation caps; the **Table
  detail column schema management** requirement's add-columns paragraph gains the same fields, since
  it reuses the same row editor.

## Impact

Affected code, all under `apps/ai-dial-admin/src`:

- `models/analytics/tables-ui.ts` — `ColumnRow` gains `display_name` and `description`;
  `ColumnRowError` gains the matching optional error keys.
- `components/Analytics/Tables/ColumnRowsEditor.tsx` — two new `DialInput` controls; the
  `rowHasError` computation must account for the two new error keys so the row's top-alignment
  fix still triggers.
- `components/Analytics/Tables/utils.ts` — `createColumnRow` and `toColumnRows` seed the new fields,
  `toTableColumns` emits them when non-blank, `getColumnRowErrors` length-validates them, and
  `hasColumnRowErrors` accounts for them.
- Tests: `ColumnRowsEditor.spec.tsx`, `utils.spec.ts`, `use-draft-schema-form.spec.ts`,
  `DraftSchemaEditor.spec.tsx`, `TableDetailView.spec.tsx`.
- `openspec/specs/analytics/spec.md` — the two requirements named above.

No API, server-action, dependency, or contract changes. The one shared surface touched
(`ColumnRowsEditor`) is used only by the two analytics table column-creation flows, so the blast
radius is confined to `Analytics > Tables`.

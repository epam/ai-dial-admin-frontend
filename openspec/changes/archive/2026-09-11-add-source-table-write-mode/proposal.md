## Why

A source table's **write discipline** — `append` (a plain `MergeTree`, every row kept) or
`upsert_by_key` (a `ReplacingMergeTree`, collapsing to the latest row per ordering key) — is declared
once, at `POST /v1/tables`, and is immutable afterwards: it selects the ClickHouse engine, which is
frozen at materialization. The create popup does not collect it, so every table this console creates
is an `append` table forever.

That closes off a whole pipeline kind from the console. An **aggregate** pipeline's rollup target must
be written `upsert_by_key` — otherwise recomputing a group key adds a second row instead of replacing
its own — so an aggregate pipeline can only ever target a table created outside the admin console. No
later request repairs this: the field is rejected on the schema-definition endpoint and on every
mutating endpoint, and the only remedy for a wrong choice is to delete the table and create it again.

## What Changes

- The **create source table** popup collects a write discipline: a required two-option control,
  defaulting to `append`, with each option naming the consequence of choosing it and the field
  carrying the hint that the choice is fixed for the table's lifetime, in the style of the existing
  schema-key hints. (Built as a dropdown first; see design.md D1 for why it ended up a radio group.)
- The create payload for a source table carries `write`.
- The **create enrichment** popup is unchanged and its payload never carries `write`: an enrichment is
  always keyed and collapsed on its grain key, and the service rejects the member with 422.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/tables`: the "Create table (source or enrichment)" requirement — today "a **source**
  table SHALL collect a name and optional description" — gains the write discipline as a third
  collected field, source-only, with a stated default and a stated absence from the enrichment
  payload.

## Non-goals

- **Showing the value after creation.** The table detail header's schema-metadata summary is not
  extended; a created table's write discipline is not surfaced anywhere in the console. Deliberate:
  the console's own create flow is the only place the value can be chosen, and the read surfaces are
  a separate concern.
- **Editing it.** There is no endpoint to change it; nothing in the UI may suggest otherwise.
- **`_updated_at` as a version column.** An `upsert_by_key` table carries the engine's own
  `_updated_at`, which the service accepts as `version_column` even though it is not a declared
  column. The schema-definition surface still offers only declared timestamp columns, so that
  combination stays unreachable from the console. Out of scope here.
- **Aggregate-pipeline validation.** The pipeline create modal does not gain a check that its target
  is an upsert table; a wrong target still fails server-side with the service's own message.

## Impact

- `apps/ai-dial-admin/src/models/analytics/table.ts` — a `TableWriteMode` enum and a `write` member on
  the source create DTO.
- `apps/ai-dial-admin/src/models/analytics/tables-ui.ts` — the create form gains the field.
- `apps/ai-dial-admin/src/components/Analytics/Tables/CreateTablePopup.tsx` and its `utils.ts` seed —
  the control and its payload branch.
- `apps/ai-dial-admin/src/constants/i18n.ts` + `src/locales/en.ts` — label, option labels, hint.
- No server-action or API-class change: `createTable` forwards the DTO as-is.

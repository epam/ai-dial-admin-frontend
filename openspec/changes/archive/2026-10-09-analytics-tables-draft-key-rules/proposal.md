## Why

QA feedback on #3847 found that the Draft schema editor lets an author build a source table or an
enrichment the backend always rejects, and that key selections behave inconsistently when a column is
renamed. The author learns of a bad key only from a backend `validation_error` toast after Save, or
ends up with a key tag that cannot be removed.

## What Changes

- **Eligible key columns.** The Ordering key offers only non-nullable, non-Object columns. The Partition
  column offers only non-nullable Date/Timestamp columns. An enrichment's Grain key offers only the source
  table's non-Object columns. These are the backend's `requireKeyable` rules (`ordering_key`,
  `partition_by`, `grain_key`), so the rejection can no longer be reached from the UI.
- **Selections follow the column rows.** An Ordering key or Partition column that stops being eligible
  (flipped to nullable, retyped) is dropped, the way the Partition/Identity/Version selections already are.
- **Renames carry the selection.** Renaming a column rewrites its name in the Ordering key, Partition
  column, Identity column and Version column instead of clearing some of them and leaving a stale,
  unremovable Ordering key tag. A name cleared to blank drops the selection.
- **Identity and Version exclude each other.** The column chosen as Identity is not offered as Version,
  and the reverse, reactively.
- **Hints state the new eligibility** for the Ordering key, Partition column and Grain key.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: "Define and materialize a table schema" (key option rules, selection upkeep on
  retype and rename, Identity/Version exclusion) and "Table schema keys are explained where
  they are chosen and where they are read" (hint text states the eligibility).

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/`: `use-draft-schema-form.ts`, `DraftSchemaEditor.tsx`,
  `utils.ts`, their specs.
- `apps/ai-dial-admin/src/locales/en.ts` and `src/constants/i18n.ts`: hint text.
- Draft surface only. The active-table view, the JSON editor and every other Analytics page are untouched.

## Non-goals

- The Element type / Values header layout in the column grid (deferred until a redesign).
- Restricting sensitive columns as a Partition column: the backend does not reject them.
- Map columns: the UI offers no Map type, so there is nothing to filter.
- Name validation in the Create popups and the `*` on the Columns section: both are already in place
  (#3956; the first column row's Name label carries the marker).
- Backend changes.

## Decision recorded against an earlier ticket

#4146 says to *clear* a scan-metadata selection when its column is renamed. This change replaces that,
for the draft form, with *carry the selection to the new name*, because the Ordering key already behaves
as "keep" and the inconsistency is what QA reported. Retype, removal and flipping to nullable/sensitive
still clear the selection.

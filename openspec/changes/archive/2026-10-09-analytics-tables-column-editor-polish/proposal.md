## Why

QA feedback on #3847 found two things in the column row editor that mislead the author: an Object column's
Nullable switch can be turned on although the backend always rejects it, and the sentence explaining that an
enum column sorts in declared order stands once beneath the whole column grid, where it reads as a statement
about the table.

## What Changes

- **Object is never nullable.** An Object row's Nullable switch is disabled and shown off, as an Array row's
  already is, and the built column never carries `nullable: true`. The rule applies wherever the column row
  editor is used: the draft schema surface and the "Add columns" form of an `ACTIVE` table.
- **The enum ordering note moves to its column.** It renders beneath the enum row's own Values field. The
  grid-level note is removed. The row is aligned the way a row with a validation error already is.
- **Accepted limitation, stated.** The Values dialog is the shared `Common/Multiselect` popup and keeps its
  own per-value rule; the row-level enum check stays the authoritative one. The comment that calls the popup
  "only ever stricter on the low end" is corrected.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: "Define and materialize a table schema" (an Object row cannot be nullable) and
  "A column may be declared with an enum type and a closed, ordered value list" (where the ordering note sits,
  and the stated popup limitation).

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/`: `ColumnRowsEditor.tsx`, `EnumValuesField.tsx`,
  `utils.ts` (`toTableColumns`), their specs.
- Draft schema editor and the "Add columns" form share `ColumnRowsEditor`, so both change.
- No shared component under `Common/` changes.

## Non-goals

- The Values dialog's own length rule (the shared `Multiselect` popup validates 2 to 255 characters per
  value, the enum rule is 1 to 64). Standing rule: `Common/*` components are used as they are, with no prop or
  injectable validator added for one caller. Values of 65 to 255 characters therefore pass the popup and are
  rejected by the row check after Apply.
- The "Element type *" and "Values *" header cells over rows that do not use them: deferred until a layout
  redesign.
- Decimal input in the Add rows editor: it is a free JSON editor whose content the author owns.
- Backend changes.

## Why

The column-row editor lays every row out as a flex row of fields, and a type-specific control is
appended to the one row whose type needs it: an element-type select for an Array row, a value-list
field for an enum row. Two things follow, both visible as soon as any row below the first is typed
enum:

- That row carries one more field than the rows above it, so its Name, Display name, Description and
  Type fields are all narrower and none of them line up with the same field in the neighbouring rows.
- `Multiselect` always renders its own label, so the value column's label ("Values \*") appears beside
  a mid-list row's control instead of on the label line at the top, where every other field's label
  is. The element-type select avoids this only by passing no label below the first row — which leaves
  that column with no label at all whenever the first row is not the Array row.

The fix is layout-only: no validation, payload, or submission behaviour changes.

## What Changes

- A type-specific control becomes a column of the whole editor rather than an extra field in one row.
  Once any row is typed Array (or enum), every row reserves that column's cell and leaves it empty
  where the row's type does not use it, so every other field keeps its position and width in all rows.
- The column's label is rendered on the first row, alongside the other field labels, whether or not
  the first row is the one that uses the control.
- `EnumValuesField` gains an `isLabelHidden` prop: in a row below the first, `Multiselect`'s own label
  is clipped to screen readers instead of repeated beside the control.

## Non-goals

- Rebuilding the editor as a CSS grid with a dedicated header row. Equal flex factors across rows give
  the same alignment guarantee, and a header row would need every field's own label suppressed —
  which the installed ui-kit cannot do for a select without also dropping its accessible name.
- Changing `Common/Multiselect`. It is shared, and a label-visibility prop added for this one caller
  would be a prop no other caller wants (see `.claude/rules/components.md` §4).
- Any change to the enum validation rules, the submitted payload, or the per-column edit modal.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics`: the "Define and materialize a table schema" requirement states how a type-specific
  column is laid out and labelled; the enum value-list requirement points at those terms and states
  that a mid-list enum row does not repeat the column's label.

## Context

`ColumnRowsEditor` renders one flex row per declared column, with each field's own label rendered on
the first row only (`labelProps={first ? … : undefined}`). The type-specific controls were appended
conditionally — `{isArray && <DialSelectField …>}`, `{isEnum && <EnumValuesField …>}` — which is what
makes a row's field set, and therefore its field widths, depend on that row's type.

## Decision

Reserve the cell, keep the flex layout.

`hasArrayRow` / `hasEnumRow` are derived from the whole row set. When either is true, **every** row
renders that column: the control in the rows whose type uses it, and an empty `div` carrying the same
`flex-1 min-w-[160px]` in the rest. Because every row then holds an identical set of flex items in an
identically wide container, the columns resolve to the same widths without a grid template — verified
in the browser on a replica of the components' real markup: the cell offsets are identical in all
three rows (24 / 281 / 537 / 919 / 1067 / 1235 / 1367 px).

The empty cell also carries the column's label on the first row, with `self-start` so the label sits
on the row's label line rather than being pushed down by the row's `items-end` alignment.

### Alternatives considered

**A CSS grid with a dedicated header row.** Structurally cleaner, and it would remove the first-row
label offset (`LABEL_ROW_OFFSET_CLASS`) that the error layout needs. Rejected because it requires
suppressing every field's own label: `DialInput` takes `aria-label` and is fine, but the installed
`DialSelectField` honours neither `labelVisuallyHidden` nor `labelClassName` (verified — both render
the label wrapper with an empty class), so the Type and Element type selects would either keep a
visible duplicate label or lose their accessible name entirely. Reserving cells needs one label
suppression instead of three.

**A `hideLabel`-style prop on `Common/Multiselect`.** Rejected per `.claude/rules/components.md` §4:
the mismatch is handled in the wrapper this repo owns (`EnumValuesField`), not by growing the shared
component's API for a single caller.

## Consequences

- `EnumValuesField` clips the label with `[&>label]:sr-only` on `Multiselect`'s root — the label stays
  in the accessibility tree, which is strictly better than the other fields' rows below the first,
  where no label element exists at all. The class is coupled to `Multiselect` rendering its label as
  the root's first child element; `tests/EnumValuesField.spec.tsx` asserts the clip, so a ui-kit or
  `Multiselect` restructure that breaks the coupling fails a test rather than silently un-hiding the
  label.
- A row's cell count no longer depends on its own type, so the alignment guarantee is testable
  without asserting styling: two rows of different types render the same number of cells.
- The editor gains at most two reserved columns, and only while a row actually needs one — a schema of
  plain scalar columns is laid out exactly as before.

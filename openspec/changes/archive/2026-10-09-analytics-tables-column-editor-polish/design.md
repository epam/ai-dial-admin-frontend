## Context

`ColumnRowsEditor` bottom-aligns each row and switches to top alignment when a field shows a validation
message, because the message makes one field taller than its neighbours. The Nullable switch is locked for Array
through `disabled={isArray}`, and `toTableColumns` forces `nullable: false` for Array. `EnumValuesField` wrapped
the shared `Multiselect` and rendered nothing beneath it, so the ordering note stood once under the whole grid.

## Goals / Non-Goals

**Goals:**
- Make the Object rule the same shape as the Array rule, in the same places.
- Put the ordering note where it describes, without breaking row alignment.

**Non-Goals:**
- Touching `Common/Multiselect` or its per-value rule (see proposal.md, Non-goals).

## Decisions

### D1. One `isNullableLocked` condition for Array and Object

The switch, its `isOn` value and `toTableColumns` read the same predicate, so the visible state and the
submitted value cannot diverge. Retyping to a locked type also sets the row's stored `nullable` to false, so a
row that had it on does not bring a hidden `true` back when it is retyped to a type that allows it. Without that
the switch would show off while `getIdentityColumnNames` and the other row-based key derivers, which read the
stored flag, still treated the column as nullable.

*Alternative:* leave the stored flag and only mask the display, as Array does today. Rejected for the reason
above; Array gets the same retype reset because the two now share the predicate.

### D2. The note moves into `EnumValuesField`, under the Multiselect

`EnumValuesField` already has the only context the note needs (it is the enum control). It wraps the
Multiselect and the note in one element that carries the flex sizing the Multiselect used to carry, keeping the
`[&>label]:sr-only` selector on the Multiselect itself so non-first rows still hide the repeated label. The note
is not rendered when the field is `disabled`: the read-only use in the Edit column popup has its own statement
that the value set cannot change.

*Alternative:* an info affordance on the "Values" label, as the key fields have. Rejected: the label belongs to
the shared Multiselect, which takes a plain string, and wrapping it would mean a new prop there.

### D3. A row with an enum value list is top-aligned

An enum row with a note beneath its field is taller than its neighbours for the same reason a row with an error
is, so it takes the same treatment: `items-start`, and the offset on the first row's trailing controls. The
condition becomes "row has an error or is an enum row". Rows of other types keep bottom alignment.

*Alternative:* position the note absolutely so the row height is unchanged. Rejected: it overlaps whatever
follows the row (the next row, or the error message) and has no layout box to reserve.

### D4. The popup bound is stated, not engineered around

The Values popup validates each value with the shared topic rule. Making it use the enum rule needs an
injectable validator or a fork of the shared list. Neither is acceptable here, so the spec states the
consequence (a value the popup accepts can be rejected by the row afterwards) and `EnumValuesField`'s comment
is corrected: it claimed the popup is only ever stricter on the low end, but it is looser at the high end.

## Risks / Trade-offs

- **Repeated note on a grid with several enum columns.** Each enum row carries it. → Accepted: the note is one
  short line, and a single shared line was the reported problem.
- **Top alignment changes the look of enum rows.** → Browser verification covers a first-row enum, a later
  enum row, and an enum row with an error.

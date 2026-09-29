## Context

`Common/SchemaGrid` renders a JSON Schema's properties as tree rows. Name is edited in
`TreeNameCellRenderer` (its own `<input>`); Title, Description, Tab, Section, and Order in the shared
`Grid/CellRenderers/EditableCellRenderer`, which many other grids also use. Tab and Section live in
the row's `dialMeta` under the catalog keys and have cells only on first-level rows, and only for
consumers whose `metaColumns` include them.

The grid already blocks save for one class of error: `hasInvalidFieldNames` (empty or duplicate
names, from #4746) feeds `SaveValidationContext` under a `useId()` field and shows a single
`DialErrorText` above the grid. Per-kind configuration already travels as props backed by named sets
in `SchemaGrid/constants.ts` (`metaColumns`, `requiredMetaColumns`).

See proposal.md for why the limit belongs here rather than in Core or in the renderer.

## Goals / Non-Goals

**Goals:**

- One optional prop configures every free-text cell, with defaults on unless switched off.
- The same resolved configuration drives both the inputs and the save check, so they cannot drift.
- Other grids using `EditableCellRenderer` see no behavior change.

**Non-Goals:**

- Per-cell error highlighting for constraint violations — the message above the grid is the signal,
  as it is for duplicate names today.
- Validating `min` / `max` / `step` or any attribute other than `maxLength`, `minLength`, `pattern` on
  save.

## Decisions

### D1 — Configuration is native input attributes, not JSON Schema keywords

The prop is keyed by a new `SchemaInputField` enum (`Name`, `Title`, `Description`, `Tab`, `Section`,
`Order`) and each value is
`Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange' | 'onKeyDown' | 'type' | 'id' | 'className'>`,
or `null` to drop that field's defaults. The prop itself is `SchemaFieldInputConfig | false`.

_Alternative:_ `Pick<JSONSchema7, 'maxLength' | 'minLength' | 'pattern'>`. Rejected with the user: it
only ever expresses validation, so a consumer wanting `inputMode`, `spellCheck`, or `min` on Order
would need a second prop. The three validating attributes share their names and semantics with the
JSON Schema keywords anyway.

Types go in `SchemaGrid/models.ts`; `DEFAULT_SCHEMA_FIELD_INPUT_PROPS` in `SchemaGrid/constants.ts`,
next to the meta-column sets.

### D2 — One pure resolver, used by columns and validation

`resolveSchemaFieldInputProps(config?)` in `SchemaGrid/utils.ts` returns the effective
`Partial<Record<SchemaInputField, SchemaFieldInputProps>>`:

- `undefined` → the defaults;
- `false` → `{}`;
- otherwise, for every field in defaults ∪ config: `null` → omitted; else
  `{ ...defaults[field], ...config[field] }`. An attribute set to `undefined` stays as an `undefined`
  key, which React renders as absent and the validator treats as unset — that is the "remove one
  attribute" path, with no extra sentinel.

`SchemaGrid` memoizes the result on the prop, passes it to `getSchemaGridColumns`, and feeds the same
object to the validator. Consumers pass nothing today, so each gets the defaults; a consumer that
needs a different set later adds a named constant beside `CATALOG_SCHEMA_META_COLUMNS`.

_Alternative:_ defaults merged inside each cell renderer. Rejected: the save check would need its own
copy of the merge.

### D3 — Pass-through on the renderers, spread before owned attributes

`EditableCellRenderer` gains `inputProps?: SchemaFieldInputProps`-shaped params (typed locally as the
same `Omit<…>` — the renderer is generic and must not import from `SchemaGrid`), spread onto `<input>`
**before** its own attributes, so `value`, `onChange`, `onKeyDown`, `type`, `id`, and `className`
always win at runtime as well as in the type. Its existing explicit `min` / `max` / `step` / `inputMode`
params also come after the spread and therefore win over `inputProps` when both are given; SchemaGrid
does not pass the explicit ones, so there is no conflict in practice. The same holds for `placeholder`:
the renderer's own translated one wins, and `inputProps.placeholder` is only the fallback when it has none. `TreeNameCellRenderer` gets the
same parameter with the same ordering.

Keeping the type local to the renderer respects the Common-placement rule: the renderer gains a
generic native pass-through, not a SchemaGrid-specific prop.

### D4 — Save check mirrors HTML constraint semantics

A pure `getFieldConstraintViolations(fields, resolved, metaColumns)` walks the row tree and returns a
deduplicated list of `{ field: SchemaInputField, rule: 'maxLength' | 'minLength' | 'pattern', limit }`:

- Name, Title, Description on every row; Tab and Section on first-level rows only, and only when the
  consumer's `metaColumns` include them — mirroring where the cells exist.
- `maxLength` / `minLength` compare `value.length` (UTF-16 code units, as the browser counts).
- `pattern` is compiled as `^(?:pattern)$` with the `u` flag, matching how `<input pattern>` anchors
  the whole value; a pattern that fails to compile is ignored rather than blocking every save.
- Empty values are skipped by `minLength` and `pattern`, as HTML does; emptiness is the name check's
  and requiredness's concern.

On a read-only grid the check is skipped: the schema came from an external source the user cannot
edit here, so a violation could never be fixed. Otherwise `SchemaGrid` combines it with `hasInvalidFieldNames` into the one `isValid` it already dispatches, and
renders one `DialErrorText` per violation under the existing name message, e.g. "Title must be at most
{limit} characters". The message never interpolates the value — a 1000-character value in the message
would recreate the bug. `DialErrorText` carries `role="alert"`, so the messages are announced without
an extra live region.

_Alternative:_ a single generic "some values are too long" message. Rejected: with five fields and
nested rows the user could not find the offender.

### D5 — i18n

Three `BasicI18nKey` entries — max length, min length, pattern — with `{field}` and `{limit}`
parameters, in the shape of the existing `CreateFolderValidateNameLength`. The field label comes from
the column header text already used for that column.

### D6 — The ui-kit fix arrives by version bump

#4731's quoting change is made in `@epam/ai-dial-ui-kit`'s `SchemaRenderer` and released there; this
change bumps the dependency. No admin code builds that message, so nothing else changes here.

## Risks / Trade-offs

- [An existing app-runner or catalog schema already holds an over-limit value] → it opens, but save is
  blocked until the value is shortened, and the message names the field. Whether any exist on dev is
  unverified. A consumer can relax its set through the prop if that turns out to be wrong for runners.
- [`EditableCellRenderer` is shared by many grids] → the parameter is optional and absent elsewhere, so
  their rendered `<input>` is unchanged; covered by the renderer's own spec.
- [Browser `maxLength` does not truncate a value set programmatically] → that is exactly the JSON/import
  path, which D4 catches on save.
- [Core later adds `maxLength` to its catalog meta-schema] → the defaults must be changed to match; the
  constant carries a comment pointing at the meta-schema.
- [The ui-kit release lags] → the bump task is independent; the constraint work can merge first and
  #4731 closes when the bump lands.

## Migration Plan

No data migration. Rollback is a revert; the ui-kit bump can be reverted independently.

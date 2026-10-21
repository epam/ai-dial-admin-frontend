## Context

See `proposal.md` — Why. The behavior contract is in `specs/analytics/spec.md`.

Three facts shape the approach:

1. **One editor, two surfaces.** `ColumnRowsEditor` is rendered by `DraftSchemaEditor` (the
   `PENDING`/`FAILED` schema-definition surface) and by the **Add columns** popup inside
   `TableDetailView`. Adding the fields to the editor covers both with no conditional prop; hiding
   them on one surface would *require* adding one. Both were requested, so no prop is needed.
2. **Nothing new is needed below the editor.** `AnalyticsTableColumn` already carries
   `display_name?` / `description?`; the caps (`ANALYTICS_DISPLAY_NAME_MAX_LENGTH` 128,
   `ANALYTICS_DESCRIPTION_MAX_LENGTH` 1024), the validator (`getAnalyticsLengthError`), and the i18n
   keys (`AnalyticsTablesI18nKey.DisplayName` / `.Description`) all exist and are already used by
   `EditColumnPopup`. The gap is the UI row model (`ColumnRow`), the inputs, and the DTO mapper.
3. **The row already carries a layout workaround.** `ColumnRowsEditor` switches from `items-end` to
   `items-start` whenever a row has any validation error, and offsets the trailing label-less
   switch/remove group on the first row by `LABEL_ROW_OFFSET_CLASS` to compensate. Both behaviors are
   keyed off a `rowHasError` boolean that enumerates the error keys explicitly — so two new
   error-capable fields are not a no-op for layout.

## Goals / Non-Goals

**Goals:**

- Keep the existing row-editor shape: one `ColumnRow` per column, per-row error objects aligned by
  index, blank-means-absent at DTO build time.
- Reuse the caps, validator, and i18n keys the edit modal already uses, so the creation form and the
  edit modal can never disagree about what is valid.

**Non-Goals:**

- Any refactor of `ColumnRowsEditor` beyond adding the two fields. In particular, the two-line row
  layout considered below is explicitly not being built.
- Extracting the row into a per-row sub-component. It stays a single mapped block, as today.

## Decisions

### D1 — Both fields render inline on the existing single row

The row becomes: Name · Type · (Element type) · Tag · Display name · Description · [Nullable]
[Sensitive] [remove]. Labels stay on the first row only, matching every existing field.

Chosen because it keeps the diff to two `DialInput` blocks and preserves the editor's one-row-per-column
reading, which is what makes a twelve-column schema scannable at all.

*Alternative considered — a two-line row* (identifier/type fields on line 1, the two metadata fields
on line 2). It gives the two new fields, especially Description, far more usable width and degrades
better on a narrow viewport. Rejected: it doubles each row's height, so the scannability argument
above cuts the other way for a long schema, and it requires reworking the first-row label placement
and the `LABEL_ROW_OFFSET_CLASS` offset rather than extending them.

Consequence to handle rather than discover: six text/select controls plus two switches on one flex
row is tight. Give Display name and Description explicit `flex` weights and `min-w-[…]` floors in the
same style as the existing fields (Name is `flex-[2] min-w-[160px]`, Tag is `flex-1 min-w-[120px]`),
weighting Description the widest of the new pair since it holds the longest values. The row is
already horizontally constrained by its container; do not introduce a horizontal scroll container
just for this row — the min-widths plus the existing flex behavior are what the other fields rely on.

### D2 — `ColumnRow` gains two plain `string` fields, not an optional pair

`display_name: string` and `description: string`, defaulted to `''` by `createColumnRow` and
`toColumnRows`. This matches how `tag` is already modeled: the row model is a form model where every
text field is a controlled non-optional string, and optionality is expressed at the DTO boundary.
Making them `string | undefined` would push `?? ''` into the JSX for no gain.

### D3 — Blank-means-absent is enforced in `toTableColumns`, not in the editor

`toTableColumns` already spreads `...(r.tag.trim() ? { tag: r.tag.trim() } : {})`. The two new fields
follow that exact shape. This keeps one place that decides what reaches the wire and keeps the trim
consistent with the service's own `normalizeDisplayName` / `normalizeDescription` (which trim and map
blank to null).

Note the asymmetry with `EditColumnPopup`, which sends a blank string *deliberately* — there a blank
means "clear the stored value" under merge-patch semantics. At creation there is nothing to clear, so
omission is correct. This is a real difference in meaning, not an inconsistency, and it is why the
two paths do not share a mapper.

### D4 — Validation extends `ColumnRowError` and both of its consumers

`ColumnRowError` gains `display_name?` and `description?`. `getColumnRowErrors` runs
`getAnalyticsLengthError` against each cap. Two consumers then have to be updated or the errors are
computed and silently ignored:

- `hasColumnRowErrors` — gates Save / submit. Missing the new keys means an over-cap value reaches the
  backend as a 422.
- `rowHasError` inside `ColumnRowsEditor` — drives the `items-start` switch and the first-row offset.
  Missing the new keys means a row erroring *only* on display name or description renders misaligned.

Unlike the identifier checks, the length checks apply to **every** row, not only rows that will be
sent — a length error on a row with a blank name is unreachable in practice (the row is dropped by
`toTableColumns`), but scoping the check would be extra logic for no benefit, and `tag` is already
validated unconditionally the same way.

### D5 — No new i18n keys, no new constants

`AnalyticsTablesI18nKey.DisplayName` and `.Description` already exist with the strings "Display name"
and "Description" in `locales/en.ts`, and are the same labels the edit modal shows for the same two
fields — which is exactly the consistency wanted. Per `components.md` §10, reuse rather than add.

### D6 — Accessibility

Each new input gets a stable per-row `id` in the established pattern
(`col-display-name-${row.id}`, `col-description-${row.id}`) so its `labelProps` label — rendered on
the first row only — associates with the first row's control, matching how Name, Type, and Tag
already behave in this editor. Rows after the first carry no visible label, which is the editor's
existing (and pre-existing) accessibility characteristic for all of its fields; this change neither
improves nor worsens it, and changing it is out of scope. `DialInput`'s `error` + `invalid` props
supply the validation message and state, as they already do for Tag.

## Risks / Trade-offs

- **Row crowding on a narrow viewport** → mitigated by explicit `flex` weights and `min-w` floors
  (D1). This is the accepted cost of the chosen layout; the two-line alternative is recorded above if
  it needs revisiting.
- **Silently ignored validation** → the two consumers named in D4 are the failure mode, and both are
  easy to miss because neither shows up as a type error: `hasColumnRowErrors` and `rowHasError`
  enumerate error keys as boolean ORs, so an unlisted key just reads as `undefined`. Both need a test.
- **`FAILED`-table round-trip** → `toColumnRows` seeds the row model from a stored definition. Missing
  the two fields there would silently drop authored metadata on resubmit, turning a retry into data
  loss. Covered by a spec scenario and a test.

## Open Questions

None.

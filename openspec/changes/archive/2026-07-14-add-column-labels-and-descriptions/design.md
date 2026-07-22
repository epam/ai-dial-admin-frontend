# Design — Analytics column labels and descriptions

## Context

The analytics backend (`analytics-data-access-service`) models per-column metadata in its Postgres catalog: `description` (long help text, merged), `display_name` (short display name, ≤128 chars, `add-label-field` branch), `tag`, `sensitive`. Both read surfaces return them: `QuerySchemaFieldDto` (schema discovery — feeds the Query Builder) and `TableDto.ColumnDto` (table management — feeds the Tables pages). The FE casts backend JSON directly to its models (no mapping layer in `src/server/analytics/analytics-data-api.ts`), so typing the new fields on the models is the entire data-plumbing story.

Backend PATCH semantics that shape this design (`TableSchemaService`):

- The whole patch is **validated up front** — any invalid op rejects the entire request (422) before anything applies. A multi-field edit is therefore atomic from the user's perspective.
- Ops apply in a fixed phase order: drop → rename → add → retag → set_display_name → set_sensitive.
- `retag`/`set_display_name` **resolve against post-op exposed names** — deliberately, so one patch can rename a column and set its metadata, referencing the **new** name.
- `rename` is rejected for grain-key, ordering-key, and `_`-prefixed system columns; `retag`/`set_display_name` have no mutability restriction.
- Blank/null values in metadata ops **clear** the stored value; `display_name` normalizes blank→null and caps at 128 chars.
- `redescribe` does not exist yet (BE follow-up, confirmed); it is assumed to mirror `set_display_name`.

## 1. Display-name resolution (Query Builder)

One rule everywhere: **display name = `display_name ?? name`**; the raw `name` remains the only value that enters query serialization, JSON, and SQL.

- `fieldsToOptions` (`QueryBuilder/utils/fields.ts`) projects `display_name` and `description` onto `FieldOption` (which gains both as optional props in `models/analytics/query-builder.ts`). This one projection covers every builder section, since all pickers consume `fieldsToOptions` output.
- A small pure helper in `utils/fields.ts` — `fieldDisplayName(fields: AnalyticsEntityField[], name: string): string` — resolves a serialized field name back to its display label for chips and summaries. Sections already have `state.fields` in scope via context. Names with no schema entry (stale references, aggregate aliases in having/sort) fall through unchanged — exactly today's behavior.
- `groupFieldOptions` search matches `option.display_name` in addition to `option.name` (case-insensitive, same normalization as today).
- The dropdown overlay is width-bounded (`max-w`); descriptions render through `DialEllipsisTooltip` so long text truncates to one line with the full value in a width-capped hover tooltip.

### Dropdown option row

`CategorizedFieldDropdown` renders field rows as name-only + type today; functions already render two lines (`fn.name` + `fn.hint`). Field rows adopt the same two-line shape:

```
┌────────────────────────────────────────────┐
│ Total money spend                  decimal │   ← label ?? name (primary), type (right)
│ Money spent on the request                 │   ← description (secondary, only when set)
└────────────────────────────────────────────┘
```

No new component — extend the existing option-row markup. Rows without label and without description render exactly as today (single line, no layout shift for unlabeled schemas).

### Chips and summaries

`FieldChip` label, `ChipRow` summary strings (`summaryOf` in Aggregates, group-by row text, sort summary, filter-condition summary), and the Select chips all pass their field name through `fieldDisplayName`. Serialization paths are untouched — the summaries are render-only strings.

## 2. Tables detail grid

Two new `ColDef`s after Tag: Display name (`field: 'display_name'`) and Description (`field: 'description'`). `AgGridWrapper`'s `defaultColDef` already exposes every field-backed column's full value in a hover tooltip, so plain ColDefs satisfy the a11y rule (never truncate without access to the full value) with no custom cell renderer. Empty values render as empty cells, matching Tag.

## 3. Unified Edit-column modal

### UI

The per-column action menu shrinks from [Rename, Retag, Delete] to **[Edit, Delete]** (pencil icon). Edit opens a feature-local `EditColumnPopup` (`DialFormPopup`, Sm/Md) seeded from the row's `AnalyticsTableColumn`:

```
Edit column ────────────────────────────────
  Column name   [ total_cost         ]   rename    · non-blank required
  Label         [ Total money spend  ]   set_display_name   · blank = clear
  Tag           [ metric             ]   retag     · blank = clear
  Description   [ …multiline…        ]   redescribe· blank = clear
──────────────────────────────  Cancel / Save
```

- The old `ColumnEdit { column, retag: boolean }` state and the shared single-input modal are replaced by a single `editColumn: AnalyticsTableColumn | null` state — the boolean-kind discriminator disappears entirely (no enum needed: there is only one edit kind now).
- **Name input disabled** when the column is not renameable: `source_name` starts with `_`, equals the table's `grain.grain_key`, or appears in `ordering_key` (all available on `AnalyticsTable`). Metadata fields stay editable — mirrors the BE's mutability rules instead of letting the request 422.
- **Submit enabling**: disabled while the name field is blank, and disabled when nothing changed (the diff below is empty). Blank metadata fields are valid input (they clear).
- Inline name-cell rename in the grid is kept unchanged as the quick path.

### Diff-based patch builder

A pure function in `Tables/utils.ts`:

```ts
buildColumnEditPatch(original: AnalyticsTableColumn, edited: ColumnEditValues): AnalyticsSchemaPatch | null
```

- Include `rename: [{ from, to }]` only when the trimmed name differs.
- For each metadata field whose trimmed value differs from the original (treating `undefined`/`''` as equal-empty): include `retag` / `set_display_name` / `redescribe` with the value (empty string sent as the clear signal, matching the BE's blank-clears contract).
- **Metadata ops reference the post-rename name** when a rename is included — the one subtle backend contract point, encoded and unit-tested here rather than scattered in the component.
- Returns `null` when nothing changed (drives the submit-disabled state).

Submit sends the single patch through the existing `applyPatch` → success toast → reload flow. Up-front BE validation makes the combined request all-or-nothing, so no partial-failure UI is needed.

### Models

`AnalyticsSchemaPatch` gains `set_display_name?: AnalyticsColumnSetDisplayName[]` and `redescribe?: AnalyticsColumnRedescribe[]` (each `{ name, display_name }` / `{ name, description }`), shaped after the existing `AnalyticsColumnRetag`.

## Risks / trade-offs

- **[Silent no-op window]** If the FE ships an op the BE doesn't know yet (`set_display_name` pre-merge, `redescribe` pre-follow-up), Spring ignores the unknown JSON key: the PATCH returns 200, the UI toasts success, and the reload shows the value unchanged. Mitigation: the user merges the label branch before release; the `redescribe` dependency is flagged on its task. No FE guard is built — the window is deploy-sequencing, not a runtime state the FE can detect.
- **[`redescribe` contract is assumed]** Modeled to mirror `set_display_name` exactly. If the BE lands a different shape, only `buildColumnEditPatch` and the model type change — isolated by design.
- **[Label/name ambiguity in pickers]** Showing only labels can hide the queryable name users must recognize in JSON/SQL. Accepted for now: search still matches raw names, unlabeled fields show the name, and JSON/SQL views expose the truth. A name-subtitle in the option row is a cheap follow-up if it confuses.
- **[Stale display after schema edits]** Chips resolve labels from `state.fields` at render, so a Tables-page set_display_name shows up in the Query Builder after its next schema load — no cross-page sync needed or attempted.

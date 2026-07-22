# Tasks — Analytics column display names and descriptions

> Sequencing: archive `redesign-query-builder-page` before archiving this change (this change's spec delta layers on its requirements).
> Backend deps: the `display_name` field (renamed from `label` in the final BE revision) ships with the BE `worktree-add-label-field` merge (user handles the merge); the `redescribe` op is a confirmed BE follow-up. Before either lands, the corresponding PATCH op is silently ignored by the BE (200 + no-op) — deploy sequencing, not an FE guard.

## 1. Models & i18n

- [x] 1.1 `src/models/analytics/entity.ts`: add `display_name?: string` and `description?: string` to `AnalyticsEntityField`. Do NOT add `sensitive`.
- [x] 1.2 `src/models/analytics/table.ts`: add `display_name?: string` and `description?: string` to `AnalyticsTableColumn`; add `AnalyticsColumnSetDisplayName { name; display_name }` and `AnalyticsColumnRedescribe { name; description }`; extend `AnalyticsSchemaPatch` with `set_display_name?` and `redescribe?` lists (shape after the existing `AnalyticsColumnRetag`).
- [x] 1.3 `src/models/analytics/query-builder.ts`: add `display_name?: string` and `description?: string` to `FieldOption`.
- [x] 1.4 i18n: added `AnalyticsTables.DisplayName` ("Display name") and `AnalyticsTables.EditColumnTitle` ("Edit column"); removed the now-unused Rename/Retag/RenameTitle/RetagTitle keys; the edit modal reuses `Buttons.Save` and the shared grid Edit action label.

## 2. Query Builder display

- [x] 2.1 `QueryBuilder/utils/fields.ts`: project `display_name`/`description` in `fieldsToOptions`; make `groupFieldOptions` search match `display_name` as well as `name`; add pure helper `fieldDisplayName(fields, name)` returning `display_name ?? name` (unknown names — e.g. aggregate aliases — pass through unchanged). Also project `display_name`/`description` in `havingFieldOptions`' plain group-by entries so the Having (and aggregate-mode Sort) pickers display them.
- [x] 2.2 `QueryBuilder/Common/CategorizedFieldDropdown.tsx`: field option rows render display name (primary) + type (right-aligned) + description (secondary line, truncated); each option row is wrapped in a `DialTooltip` (width-capped) revealing the full description on hover anywhere on the row; overlay has a constant width (`w-[400px]`) so expanding a category never resizes the dropdown; picker-mode trigger resolves the selected field's display name; single-line rendering unchanged for fields without metadata.
- [x] 2.3 Chips and summaries show display names via `fieldDisplayName`: Select chips (`Select/SelectProjection.tsx`), aggregate summaries (`Aggregate/Aggregates.tsx`), group-by chips/rows (`Aggregate/GroupBySection.tsx`), sort summaries (`Sort/SortKeys.tsx`), filter/having condition summaries (`Filter/FilterCondition.tsx`). Serialization, JSON view, and SQL view stay on raw `name` — render-only change.
- [x] 2.4 Tests: extended `utils/tests/fields.spec.ts` (projection, display-name-aware search, `fieldDisplayName` incl. fallback and unknown-name pass-through, having-options projection), `Common/tests/CategorizedFieldDropdown.spec.tsx` (two-line row, single-line fallback, search by display name, trigger label), and `tests/QueryBuilder.spec.tsx` (Select chip shows display name while the executed query keeps the raw field name).

## 3. Tables detail grid columns

- [x] 3.1 `Tables/TableDetailView.tsx`: added Display name (`display_name`) and Description `ColDef`s after Tag. `AgGridWrapper`'s `defaultColDef` already provides a full-value hover tooltip for field-backed columns, so no custom ellipsis cell was needed.
- [x] 3.2 Tests: `Tables/tests/TableDetailView.spec.tsx` — grid columnDefs include the Display name and Description headers (GridView mock extended to expose headers).

## 4. Unified Edit-column modal

- [x] 4.1 `Tables/utils.ts`: pure `buildColumnEditPatch(original, edited)` → `AnalyticsSchemaPatch | null` — only changed ops (`rename`/`retag`/`set_display_name`/`redescribe`); trimmed comparison treating `undefined`/`''` as equal-empty; blank metadata values sent as the clear signal; **metadata ops reference the post-rename name when a rename is included**; `null` when nothing changed. Plus `isRenameRestricted(table, column)` for `_`-prefixed/grain-key/ordering-key columns.
- [x] 4.2 Unit tests in `Tables/tests/utils.spec.ts`: single-field diffs, combined rename+metadata using the new name, blank-clears, whitespace-only equality, no-change → `null`, blank name never renames; `isRenameRestricted` positive/negative cases.
- [x] 4.3 `Tables/EditColumnPopup.tsx` — `DialFormPopup` with Column name / Display name / Tag inputs seeded from the column; name input disabled via `renameDisabled` prop; submit (`Buttons.Save`) disabled while the name is blank or the diff is empty. The Description field is **hidden until the BE ships its description-edit op** — verified live that the merged BE (`set_display_name` merge) silently ignores unknown patch ops (200 + no-op), so offering the field made Save appear to do nothing. `buildColumnEditPatch` keeps `redescribe` support ready for when the op lands.
- [x] 4.4 `Tables/TableDetailView.tsx`: Rename + Retag actions replaced by the shared grid Edit action (pencil) opening `EditColumnPopup`; old `ColumnEdit { column, retag }` state and single-input modal removed in favor of `editColumn: AnalyticsTableColumn | null`; submit routes the built patch through the existing `applyPatch` → reload flow. Inline name-cell rename and the delete action unchanged; system tables keep no action column.
- [x] 4.5 Component tests in `Tables/tests/EditColumnPopup.spec.tsx`: seeds current values; rename+set_display_name submits one combined patch with the post-rename name; clearing the display name submits the empty clear signal; blank name disables submit; unchanged form disables submit; `renameDisabled` disables only the name input.

## 5. Verification

- [x] 5.1 Full suite `npx vitest run` from `apps/ai-dial-admin/` — 628 files, 6087 tests passed; `npm run lint` clean.
- [x] 5.2 Browser check against the live local app (BE 0.19.0-dev.10, pre-`display_name`-merge): field-picker rows show name + truncated description + type inside a fixed-width dropdown; hovering an option shows the full description in a tooltip; Tables detail grid shows the Display name (empty until BE merge — fallback correct) and Description columns; system table stays read-only. Display-name rendering and the combined edit flow re-verify after the BE branch merges.

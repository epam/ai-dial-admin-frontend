## 1. Models, constants, and i18n groundwork

- [x] 1.1 In `src/models/analytics/query-builder.ts`: add `aliasEdited: boolean` to `AggregateRow` and `GroupByRow`; add `FieldDropdownMode` enum (`Picker`, `Add`, `MultiAdd`); add `CompactSelectOption` extending the ui-kit `SelectOption` with an optional `code`.
- [x] 1.2 In `src/models/analytics/query-builder.ts`: remove `QueryBuilderWarning.MissingAggregateAlias` and `QueryBuilderWarning.MissingGroupByAlias`.
- [x] 1.3 In `src/constants/i18n.ts` + `src/locales/en.ts`: add a name and a description key per filter operator (Equals / Not equals / Contains / Does not contain / Less than / Greater than / Less than or equal / Greater than or equal / In list) and per sort direction (Ascending / Descending); state case-insensitivity in the Contains / Does not contain descriptions. Remove the two alias-warning keys and strings.
- [x] 1.4 In `src/constants/analytics/query-builder.ts`: retype `OPERATOR_OPTIONS` and `SORT_DIRECTION_OPTIONS` as `CompactSelectOption[]` with `label` from the new i18n names, `code` the existing short uppercased form, and `description` from the new i18n descriptions; drop the two removed warnings from `WARNING_I18N`, `AGGREGATE_SECTION_WARNINGS`, and `GROUP_BY_SECTION_WARNINGS`. Leave `VALUE_TYPE_OPTIONS`, `SORT_NULLS_OPTIONS`, and `PAGE_TYPE_OPTIONS` unchanged.

## 2. Alias derivation (utils)

- [x] 2.1 In `src/components/Analytics/QueryBuilder/utils/fields.ts`: add `deriveAlias(fn, args, distinct, fields)` — argument-less aggregate → capitalized function name (`Count`); first filled expression arg → `<display name> (<fn>)`, with `distinct` folded into the function part (`Project ID (count distinct)`); no filled expression arg → capitalized function name. An argument field without `display_name` contributes its raw name.
- [x] 2.2 In the same file: add `uniqueAlias(candidate, taken)` returning the candidate or a counter-suffixed variant (`Total tokens (sum) 2`), plus a helper collecting the aliases currently in state for the `taken` set.
- [x] 2.3 In `utils/state.ts`: have `createAggregate` and `createGroupByFn` accept the fields/state needed to prefill `alias` via `deriveAlias` + `uniqueAlias`, and set `aliasEdited: false`. `createGroupByColumn` keeps its empty alias.
- [x] 2.4 In `utils/deserialize.ts`: set `aliasEdited: true` on every aggregate and group-by function row it builds so an authored alias is never rederived.

## 3. Alias wiring in the sections

- [x] 3.1 In `Aggregate/Aggregates.tsx`: pass state into `createAggregate` for the prefill; on function change, argument change, and distinct toggle, rederive the alias only when `aliasEdited` is false; set `aliasEdited = true` in the alias `CompactInput`'s `onChange`.
- [x] 3.2 In `Aggregate/GroupBySection.tsx`: same prefill and rederive-until-edited handling for function rows (`createGroupByFn`, argument changes, alias input).
- [x] 3.3 In `utils/serialize.ts`: serialize computed columns with `as: alias.trim() || deriveAlias(...)`; drop the alias condition from the `group_by` name list so a function entry is included on required-args-filled alone; remove the two alias warnings from `getAggregateWarnings`.

## 4. Shared result column labels

- [x] 4.1 In `QueryBuilder.tsx` `buildExecutedMeta`: extend `columnLabels` to cover row-mode `select` columns alongside the schema-backed `group_by` columns it already maps; SQL-view runs keep an empty map.
- [x] 4.2 In `utils/result.ts`: have `getResultColumns` accept the label map and set `headerName` from it, falling back to the column key; update `Result/ResultArea.tsx` to pass `meta`'s map (`ResultChart` keeps reading the same map).

## 5. Multi-select field dropdown

- [x] 5.1 Extract the dropdown option row from `Common/CategorizedFieldDropdown.tsx` into its own component under `Common/` (tooltip wrapper, display name, sensitive marker, right-aligned type, description line, selected tint), taking a selected flag so the tint is applied after the hover class and a hovered selected row still reads as selected.
- [x] 5.2 In `Common/CategorizedFieldDropdown.tsx`: replace the implicit add-vs-picker branching with the `FieldDropdownMode` enum and add `MultiAdd` — `selected` list, `onToggle`, no `setOpen(false)` on pick, no search/accordion reset while open, `aria-multiselectable` on the listbox, and `aria-selected` per option.
- [x] 5.3 In `Select/SelectProjection.tsx`: use `MultiAdd`, stop filtering already-picked fields out of `options`, and toggle membership (append on select, splice on deselect) preserving selection order.
- [x] 5.4 In `Aggregate/GroupBySection.tsx`: use `MultiAdd` for the plain-column part of the add dropdown — stop filtering picked columns out, toggle a column row on/off, and leave the Functions group and function rows behaving as they do now (pick closes the overlay).

## 6. Full names and tooltips in the enum selects

- [x] 6.1 In `Common/CompactSelect.tsx`: accept `CompactSelectOption[]`; render `code ?? label` in the trigger and `label` alone in the list; wrap each option in `DialTooltip` with `hideTooltip` when it has no description; widen the overlay's `min-w` to fit the longest operator name while keeping option rows truncating.
- [x] 6.2 In `Aggregate/Aggregates.tsx`: pass `description: fn.description` from the served catalog onto the function options (no frontend label or hint map).
- [x] 6.3 In `Filter/FilterCondition.tsx`: switch `summaryOf` from the raw `node.op` to the matching option's `code` so the collapsed chip reads `Project ID EQ …`.

## 7. Tests

- [x] 7.1 `utils/tests/fields.spec.ts`: `deriveAlias` (argument-less, single expression arg, distinct, missing `display_name`, unfilled args) and `uniqueAlias` (free candidate, one collision, several collisions).
- [x] 7.2 `utils/tests/serialize.spec.ts`: blank alias falls back to the derived value for aggregates and group-by function rows; `group_by` includes a function entry on required-args-filled alone; `getAggregateWarnings` no longer returns the alias warnings and still returns `MissingGroupByField` / `EmptyAggregate`.
- [x] 7.3 `utils/tests/deserialize.spec.ts`: a round-tripped authored alias is marked user-edited and survives a subsequent argument change.
- [x] 7.4 `utils/tests/result.spec.ts`: `getResultColumns` heads a schema column by its label and falls back to the raw key when the map has no entry.
- [x] 7.5 `Common/tests/CategorizedFieldDropdown.spec.tsx`: `MultiAdd` keeps the overlay open across two picks, keeps the search term, lists already-selected fields with the selected state, deselects on a second click, and `Picker` mode still closes on pick.
- [x] 7.6 `Common/tests/CompactSelect.spec.tsx`: the list renders full names without codes, the trigger renders the code, and an option with a description exposes a tooltip while one without does not.
- [x] 7.7 `Aggregate/tests/FunctionSections.spec.tsx`: a new aggregate row arrives with the derived alias, rederives on argument change, stops rederiving after a manual edit, and a second identical aggregate gets a uniquified alias. Extend the Sort coverage so a freshly added aggregate's alias is offered as a sort field.

No browser-verification task: per the change's task-planning question the user opted for unit and component tests only.

## 8. Review follow-ups

- [x] 8.1 Add `functionLabel` / `humanizeFunctionName` (`utils/functions.ts`) and use the label in the function pickers and in `deriveAlias`; drop the short-code concept from `CompactSelect`, its descriptors and the row summaries; add the ellipsis tooltip on the trigger and widen the operator/direction selects.
- [x] 8.2 Add the check-mark cue beside the name in `Common/FieldDropdownOption.tsx` and `Common/CompactSelect.tsx`; remove the section-tile borders in `Common/SectionBlock.tsx`; let an expanded `ChipRow` wrap and give the argument/alias editors usable min-widths.
- [x] 8.3 Replace the per-path alias derivation with one resolver — `computedColumnNames` / `takenColumnNames` in `utils/fields.ts` — consumed by the prefill, `havingFieldOptions` and `buildQuery`, so a blank alias is counted for uniqueness and every path offers the name the query carries.
- [x] 8.4 Keep Sort keys and Having conditions in sync when a derived name changes: pure `renamedSortKeys` / `renamedFilterFields` in `utils/state.ts`, applied in both sections' `syncAlias`.
- [x] 8.5 Correct the `IMPLICIT_COUNT_ALIAS` comment (it no longer matches an authored count row's label).
- [x] 8.6 Quality cleanups from the same review: make `CategorizedFieldDropdown`'s props a discriminated union on `mode`; give the dropdown and select triggers `aria-haspopup`/`aria-expanded`/`aria-controls` (via new `SectionAction` props); hoist the operator options from `FilterCondition` to `FilterGroup`; have `compactSelectLabel` fall back to the raw value so it matches the trigger; collapse the duplicated `syncAlias` comments; add `functionLabels` so colliding labels fall back to catalog names; drop the dead spread in `buildExecutedMeta`.
- [x] 8.7 Tests for the follow-ups: `utils/tests/functions.spec.ts` (label heuristic over the real catalog text), `utils/tests/options.spec.ts`, `utils/tests/state.spec.ts` (rename helpers), cross-path agreement in `utils/tests/fields.spec.ts`, and the rename-carries-references cases in `Aggregate/tests/FunctionSections.spec.tsx`.

## 9. Quality checks

- [x] 9.1 Run `npm run lint`, `npm run format:write`, and `npm run test` from the repo root (vitest from `apps/ai-dial-admin/` for single-file runs) and fix everything they report.

## 1. Representability and pure helpers

- [x] 1.1 Add `isChipRepresentable(query, functions)` to `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/deserialize.ts` implementing the rule of the "A query the chips cannot show is held in the SQL view" requirement, lifting the Period pair before judging the filter; keep the catalog checks (served, arity, literal positions) as shared helpers
- [x] 1.2 Add the binning function name to `constants/analytics/query-builder.ts` beside the relative-time function names, and a `binningFunction(functions)` helper in `QueryBuilder/utils/functions.ts` that returns it only when the catalog serves it with an integer amount, a unit with allowed values and an expression argument
- [x] 1.3 Add `QueryBuilder/Chips/utils/filter.ts`: predicate ↔ popup form, value shaping by field type (enum values, boolean, list), null operators ↔ `isNull`, operator reset on column change
- [x] 1.4 Add `QueryBuilder/Chips/utils/aggregate.ts`: popup form ↔ `groupBy` / `aggregates` rows, bucket presets filtered by the catalog's units, custom "amount unit" parsing, distinct-count entry for the implicit-measure function, required-argument check
- [x] 1.5 Add `QueryBuilder/Chips/utils/sort.ts` (field options per query kind, used-field exclusion, pruning after an Aggregate change) and `QueryBuilder/Chips/utils/labels.ts` (the words each chip states)

## 2. Remove the JSON view

- [x] 2.1 Remove `QueryBuilderView.Json` and `SavedQueryEditor.Json`, the JSON buffer, its flags and handlers from `QueryBuilder.tsx`, and the JSON branches of `onChangeView`, `leaveSqlBuffer` and `onConfirmDiscard`; `Modals/DiscardQueryPopup.tsx` keeps one description
- [x] 2.2 Remove `divergedJsonText` from `SavedQueryCaptureInput`, `parseDivergedBody` and the JSON precedence from `utils/saved-query.ts`; `deriveSavedQueryEditor` returns Builder or Sql; drop the JSON inputs and `jsonText` restore from `use-saved-query-page.tsx`
- [x] 2.3 Remove the i18n keys only the JSON view used (`ViewJson`, `InvalidJson`, `NotShownInBuilder`, `DiscardQueryDescriptionJson`, `StructuredQueryJson`) from `constants/i18n.ts` and `locales/en.ts`

## 3. Page layout

- [x] 3.1 Add `QueryBuilder/Layout/BuilderArea.tsx`: a `re-resizable` area with a bottom handle, pixel default / minimum / maximum, height persisted in localStorage and applied after mount, and a `separator` handle with `aria-valuenow` and arrow-key steps
- [x] 3.2 Add `QueryBuilder/Layout/QueryHeader.tsx`: heading, one-line description with an expand control (`aria-expanded` + `aria-controls`), and the page actions slot; pass the draft table's description from `app/[lang]/queries/page.tsx` and the query's description from `use-saved-query-page.tsx`
- [x] 3.3 Restructure `QueryBuilder.tsx` into header, view switcher row (SegmentedControl with Builder and SQL; Run; Copy in the SQL view only), `BuilderArea`, results; render `SqlEditor` and `AiPanel` in the builder area
- [x] 3.4 Rework `Result/ResultArea.tsx` header: one result count (with the total when reported) replaces the stat chips, Add to dashboard is rendered there beside Export CSV; remove `Result/StatChip.tsx` if nothing else uses it

## 4. Chip bar shell

- [x] 4.1 Add `QueryBuilder/Chips/ChipPopup.tsx` over the kit `Dropdown` (`renderOverlay`, dialog role, title id): title with optional back control, body slot, footer with Remove (editing only), Cancel and Apply bound to an `isValid` flag; check the kit's real props through the `ai-dial-ui-kit` MCP first
- [x] 4.2 Add `QueryBuilder/Chips/Chip.tsx` (a button stating its part, exposing `aria-haspopup` and `aria-expanded`) and `QueryBuilder/Chips/ChipBar.tsx` rendering chips in the specified order from the builder state
- [x] 4.3 Add `QueryBuilder/Chips/AddChip.tsx`: the Add menu (Filter, Aggregate, Show columns, Sort) with unavailable entries per the spec, swapping to the chosen kind's popup in adding form with the back control
- [x] 4.4 Add the chip i18n keys (chip labels, popup titles, field labels, operator and bucket names, Add menu entries) to `constants/i18n.ts` and `locales/en.ts`, reusing shared button keys

## 5. Period and Limit chips

- [x] 5.1 Add `Chips/Period/PeriodChip.tsx` and `PeriodPopup.tsx`: preset list from `timePeriodOptionsConfig`, custom range through `Common/RangePicker`, Apply calling the page's period handlers; render the chip only when the schema has a temporal field
- [x] 5.2 Add `Chips/Limit/LimitChip.tsx` and `LimitPopup.tsx`: Rows and Offset whole-number fields with validation, writing `page` as offset paging without a total
- [x] 5.3 Remove `Toolbar/QueryBuilderToolbar.tsx` and the toolbar time filter wiring once the Period chip owns the period

## 6. Filter chips

- [x] 6.1 Add `Chips/Filter/FilterPopup.tsx`: Column through the kit `Select` (searchable) over comparable fields, Operator select, Value control by column type and operator (enum values, true/false, text, list, none)
- [x] 6.2 Add `Chips/Filter/FilterChips.tsx`: one chip per root predicate, Apply and Remove writing `filter.children`, the root kept an AND

## 7. Aggregate chip

- [x] 7.1 Add `Chips/Aggregate/AggregatePopup.tsx`: Group by, Split by period (presets, Custom text, none) shown only for a temporal column with the binning function served, secondary group-by with add and remove controls, Function list with the distinct-count entry, the function's column and any further catalog argument through `Common/FnArgEditor`
- [x] 7.2 Add `Chips/Aggregate/AggregateChip.tsx`: Apply sets aggregate mode with the popup's rows and removes the Show columns chip; Remove returns to a row query; both prune Sort chips whose field the query no longer returns

## 8. Show columns and Sort chips

- [x] 8.1 Add `Chips/Columns/ColumnsPopup.tsx`: the field tree grouped by tag with group and All checkboxes in checked / mixed / unchecked states, per-group selected counts, collapsible groups, sensitive marker per field; reuse the tag grouping of `SourcePanel/utils/source-panel.ts`
- [x] 8.2 Add `Chips/Columns/ColumnsChip.tsx` writing `select` as plain fields in schema order, available in a row query only
- [x] 8.3 Add `Chips/Sort/SortPopup.tsx` and `SortChips.tsx`: Field and Direction, one chip per key, used fields excluded

## 9. Loading a stored query

- [x] 9.1 In `apps/ai-dial-admin/src/app/[lang]/queries/[id]/page.tsx`, translate a structured body that fails `isChipRepresentable` through `translateQuery` on the server and pass `initialSql` or the read failure to `QueryBuilder`
- [x] 9.2 Make `toBuilderRestore` open the SQL editor with the translated text for such a body and build the baseline from it; report a refused translation through `useReadFailureNotification` and open an empty SQL view
- [x] 9.3 Switch the remaining callers (`leaveSqlBuffer`, the assistant-message run) from `isBuilderRepresentable` to `isChipRepresentable`, and remove `isBuilderRepresentable` and the helpers left without a caller; `isFilterRepresentable` stays for the row-limit editor

## 10. Remove the form

- [x] 10.1 Delete `QueryBuilder/Rail/`, `Mode/`, `Select/`, `Aggregate/`, `Sort/`, `Page/`, and `Common/SectionBlock`, `FunctionRow`, `FieldChip` with their specs; keep the filter tree (`Filter/`, `filter-tree-context.tsx`, `Common/SectionAction`, `ChipRow`) that the table access row-limit editor renders
- [x] 10.2 Remove the constants, serialize warnings (`hasDroppedCondition`, `getAggregateWarnings`, `hasDroppedProjectionColumn`), models and i18n keys left without a consumer

## 11. Specs index and docs

- [x] 11.1 Reword the `analytics/query-builder` and `analytics/query-viewer` rows of the routing table in `openspec/specs/analytics/spec.md`, and the Purpose of `openspec/specs/analytics/query-builder/spec.md` and `openspec/specs/analytics/query-viewer/spec.md`
- [x] 11.2 Update the `query-builder` and `query-viewer` descriptions in the Analytics rule of `openspec/config.yaml`, then run `npm run validate:agent-docs`

## 12. Unit tests

- [x] 12.1 Util specs: `isChipRepresentable` (one case per bullet of the rule, both directions), `binningFunction`, `Chips/utils/filter`, `aggregate`, `sort`, `labels`
- [x] 12.2 Component specs for `ChipPopup`, `Chip`, `ChipBar` and `AddChip`: order, Add menu availability, back control, Apply / Cancel / Remove, focus return
- [x] 12.3 Component specs for the Period, Limit, Filter, Aggregate, Show columns and Sort popups: required fields, value controls by column type, Split by period visibility and validation, checkbox states, pruning of Sort chips
- [x] 12.4 Layout specs: `BuilderArea` resize, persistence and keyboard steps; `QueryHeader` description states; `ResultArea` count and Add to dashboard placement
- [x] 12.5 Rewrite `QueryBuilder/tests/QueryBuilder.spec.tsx`, `SavedQueryPage.spec.tsx`, `utils/tests/saved-query.spec.ts` and `utils/tests/deserialize.spec.ts` for the views without JSON, the SQL guard over chips, and a stored body opened as translated SQL; add the server-translation cases to the `app/[lang]/queries` page specs; add missing mocks to `apps/ai-dial-admin/test-setup.tsx`

## 13. Browser verification

- [x] 13.1 Run the `spec-browser-verify` skill for this change against the running local app (local stack up, auth disabled): it builds a VerificationRequest from the browser-observable scenarios of the `analytics/query-builder`, `analytics/query-viewer` and `analytics/saved-queries` deltas and spawns the `spec-verification-gate` sub-agent through the Playwright MCP. For scenarios that save or edit a query, create a query of its own and delete it at the end; do not modify existing saved queries
- [x] 13.2 Resolve every `fail` verdict and re-run the skill for the failed scenarios only until none remain; treat a `blocked` verdict caused by an element not addressable by role or accessible name as a defect to fix

## 14. Quality checks

- [x] 14.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix what they report
- [x] 14.2 Run `openspec validate add-query-builder-chip-bar --strict`

## 15. Draft table held by the page

- [x] 15.1 Hold the draft's table in `SourcePanel/context.tsx` (`draftTable`, set by `onNavigate` on a plain click, after the unsaved-work confirmation when there is one); `getDraftHref` links to `/queries` without a parameter
- [x] 15.2 Add `QueryBuilder/QueryBuilderDraftPage.tsx`: resolves the draft's table from the context, reads a picked table's schema through the panel's column cache, shows a loading indicator meanwhile; `app/[lang]/queries/page.tsx` drops `searchParams` and prefetches the first table only
- [x] 15.3 Specs: `QueryBuilderDraftPage`, the Source panel link and confirmation cases, the draft page server spec, `getDraftHref`

## 16. Assistant panel

- [x] 16.1 Add `QueryBuilder/Ai/AiSidePanel.tsx`: collapsed control with spark icon and Ask AI label, open panel with a collapse control, overlay below the tablet breakpoint; remember the open state in localStorage
- [x] 16.2 In `QueryBuilder.tsx` render `AiPanel` inside the side panel when the assistant is enabled, drop the AI entry from the view switcher and `QueryBuilderView.Ai`, show Run regardless of the panel, and switch the view to Builder or SQL when a message is run
- [x] 16.3 Specs: the assistant cases of `QueryBuilder.spec.tsx` against the panel, `AiSidePanel`

## 17. Review follow-ups

- [x] 17.1 Bound a stored body by its saved time intent before the server translates it to SQL (`withStoredTimeBound` in `utils/saved-query.ts`, used by `app/[lang]/queries/[id]/page.tsx`)
- [x] 17.2 Keep an authored alias, and the sort keys naming it, when the Aggregate popup is applied without changing that row (`Chips/utils/aggregate.ts`)
- [x] 17.3 Move focus to the collapse control when the assistant panel opens and back to the Ask AI control when it closes (`Ai/AiSidePanel.tsx`)
- [x] 17.4 Specs: `withStoredTimeBound`, the saved query page translation, kept aliases, panel focus
- [x] 17.5 Hold an untranslatable stored body until the user authors something in its place, whatever view is open (`use-saved-query-page.tsx`), and report a translation that throws on the server (`app/[lang]/queries/[id]/page.tsx`)

## 18. Saved query actions and tagged queries

- [x] 18.1 Rework the heading row actions in `QueryBuilder.tsx`: Delete, Edit and Duplicate on a clean saved query; Discard and a Save menu (Save, Save as a new query) on a changed one; Save as a new query alone for a caller who may not write it
- [x] 18.2 Group the Queries tab by tag (`SourcePanel/QueryTagGroup.tsx`, `groupQueriesByTag`), untagged queries flat after the groups, collapsible groups kept in the panel state
- [x] 18.3 Specs: the heading actions in `SavedQueryPage.spec.tsx`, the grouped list in `SourcePanel.spec.tsx`, `groupQueriesByTag`
- [x] 18.4 Turn the Source panel to its Queries tab when a saved draft opens its new query (`Queries/Modals/DuplicateQuery.tsx`, `useSourcePanelTabSelect`)

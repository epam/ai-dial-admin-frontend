## 1. Draft builder route

- [x] 1.1 Rewrite `apps/ai-dial-admin/src/app/[lang]/queries/page.tsx` as the draft page: keep the `isAnalyticsForbidden()` → `Page403` gate, read `searchParams.table`, resolve it against `getEntities()` (absent or unknown → first entity), prefetch `getFunctions()` and `getEntitySchema(<resolved>)`, and render `QueryBuilder` without `savedQuery`, with the resolved table name as `name` and `key="draft:<table>"`
- [x] 1.2 Add `key={savedQuery.id}` to the `QueryBuilder` rendered by `app/[lang]/queries/[id]/page.tsx` so navigating between two saved queries remounts the builder
- [x] 1.3 Remove the in-place source switch from `components/Analytics/QueryBuilder/QueryBuilder.tsx` (`onSelectEntity`, its schema-loading state and notification) and the `Select` with the `entities` / `selectedEntityName` / `onSelectEntity` props from `Toolbar/QueryBuilderToolbar.tsx`; drop `QueryBuilderI18nKey.Source` from `constants/i18n.ts` and `locales/en.ts` if nothing else uses it

## 2. Draft mode in the builder

- [x] 2.1 Extend `components/Analytics/QueryBuilder/use-saved-query-page.tsx` with a draft branch: capture the starting-state baseline through the existing `captureFrom` → `toSavedQueryRequest` path with empty metadata, derive `isDirty` from it, and expose `isDraft`
- [x] 2.2 Add draft Reset: reuse the page's Discard confirmation (`components/EntityView/Modals/Discard/Discard.tsx`) and remount the builder to its starting state on confirm (reset counter folded into the builder's `key` on the draft page)
- [x] 2.3 Add draft Save as query: open `components/Analytics/Queries/Modals/DuplicateQuery.tsx` unseeded, with the scope defaulting to personal, create through `createSavedQuery`, then `router.push('/queries/{id}')` and `router.refresh()`; keep the modal open with its values on failure and report by machine error code
- [x] 2.4 Render the toolbar action slot by mode in `QueryBuilder.tsx`: draft → Reset (only while dirty) and Save as query (disabled under the same conditions as Save, and while saving); add the new labels to `constants/i18n.ts` and `locales/en.ts`

## 3. Saved-query actions on the query page

- [x] 3.1 Lift Save as out of the `isDirty` branch in `QueryBuilder.tsx` so it is offered on a clean saved query, keeping it disabled for an unrunnable query and while saving; confirm `buildSaveAsRequest` sends the stored body unchanged when the page is clean
- [x] 3.2 Add Delete to the saved-query toolbar slot: a `GhostButton` shown when `isWritable`, opening the standard delete confirmation from `components/EntityView/Modals/Delete`, calling `deleteSavedQuery`, then a success notification, `router.push('/queries')` and `router.refresh()`; on failure show the error notification and leave the page as it was
- [x] 3.3 Point the vanished-query path in `use-saved-query-page.tsx` at the draft builder with a `router.refresh()`, and call `router.refresh()` after a successful Edit and Save as so the layout's query list is re-read

## 4. Source panel

- [x] 4.1 Add `apps/ai-dial-admin/src/app/[lang]/queries/layout.tsx`: skip all fetches when `isAnalyticsForbidden()`, otherwise fetch `getEntities()`, `getTables()` and both `listSavedQueries` scopes in parallel (a failed `getTables()` degrades to no descriptions) and wrap `children` in the provider
- [x] 4.2 Create `components/Analytics/QueryBuilder/SourcePanel/` with `models.ts` (tab, scope-filter and column-load-status enums; provider value and row interfaces) and `SourcePanelProvider.tsx` holding the selected tab, both search texts, scope filter, expanded tables and groups, the per-table column cache, the collapsed flag (localStorage, applied after mount like the rail) and the unsaved-work guard registration
- [x] 4.3 Add pure utils under `components/Analytics/QueryBuilder/SourcePanel/utils/`: merge entities with catalog tables by name, filter tables by search, filter and sort queries by search + scope, and group a table's fields by tag ordered by `tag_order` with untagged columns last — reusing the grouping core of `QueryBuilder/utils/fields.ts` (extract it to a shared pure function if it is tied to dropdown options)
- [x] 4.4 Build `SourcePanel.tsx` and its collapsed strip (after `Rail/CollapsedRail.tsx`): kit `Tabs` for Tables / Queries, collapse and expand controls with `aria-expanded`, `inert` on the hidden content; check the kit's real props through the `ai-dial-ui-kit` MCP before wiring `Tabs`, `Search`, `Tooltip`, `EllipsisTooltip` and the dropdown used for the scope filter
- [x] 4.5 Build the Tables tab (`TablesTab.tsx`, `TableRow.tsx`, `TagGroup.tsx`, `ColumnRow.tsx`): search by table name, a toggle button and a pick link per table, lazy `getEntitySchema` on first expansion with loading and inline-retry states, tag groups with counts, flat untagged columns, column label / type / sensitive marker and the composed tooltip, `aria-current` on the open draft's table, empty and no-results states
- [x] 4.6 Build the Queries tab (`QueriesTab.tsx`, `QueryRow.tsx`): merged list ordered by name, search over name and tag, All / Personal / Common filter with a non-colour active indicator, scope + description tooltip, `aria-current` on the open query, empty and no-results states
- [x] 4.7 Add the page shell that renders `SourcePanel` beside the builder and use it in both `queries/page.tsx` and `queries/[id]/page.tsx`; set the initial tab from the page (Tables on a draft, Queries on a saved query) only when the provider has no tab chosen yet
- [x] 4.8 Wire the unsaved-work guard: `QueryBuilder` registers its `isDirty` with the provider; row links let modified clicks through, and on a plain click with unsaved work open the Discard confirmation from the provider and `router.push` on confirm
- [x] 4.9 Add the panel's i18n keys (tab labels, search placeholders, filter choices, strip label, sensitive-data and column-name tooltip text, empty / no-results / load-failure / retry strings) to `constants/i18n.ts` and `locales/en.ts`

## 5. Remove the Queries grid

- [x] 5.1 Delete `components/Analytics/Queries/List/QueriesList.tsx` and `components/Analytics/Queries/Modals/CreateQuery.tsx` with their specs, and move anything `EditQuery` / `DuplicateQuery` imported from them into the shared field set
- [x] 5.2 Remove what served only the grid: `QUERIES_COLUMN` in `constants/grid-columns/grid-columns.tsx`, the Queries entries in `components/ListView/constants.ts`, the duplicate branch for queries in `utils/entities/duplicate-entity.ts` (the create branch stays: the save notifications use it), and the i18n keys left without a consumer; keep `utils/open-in-new-tab.ts`, `components/Breadcrumbs/constants.ts` and the Custom Dashboards link to `/queries/{id}` working

## 6. Specs index and docs

- [x] 6.1 Add the `analytics/source-panel` row to the routing table in `openspec/specs/analytics/spec.md` and reword the `analytics/saved-queries` and `analytics/query-builder` rows; update the Purpose of `openspec/specs/analytics/saved-queries/spec.md` (no list page, no standalone create or duplicate)
- [x] 6.2 Add `source-panel` to the sub-capability lists in `AGENTS.md` and in the Analytics rule of `openspec/config.yaml`, then run `npm run sync:agent-mirrors` and `npm run validate:agent-docs`

## 7. Unit tests

- [x] 7.1 Util specs for the new pure functions in `SourcePanel/utils/tests/`: entity/catalog merge (missing counterpart, failed catalog), table search, query search + scope filter and ordering, tag grouping with `tag_order`, tags outside the order, and untagged columns
- [x] 7.2 Component specs in `SourcePanel/tests/`: tab switching and per-tab search, collapse / expand with the persisted flag, lazy column load with loading / failure / retry and no refetch on re-expand, column row tooltip composition, scope filter indicator, `aria-current` marking, empty and no-results states
- [x] 7.3 Guard specs: a plain click with unsaved work opens the confirmation, confirm navigates, cancel keeps the page, a clean page navigates directly, a modified click is not intercepted
- [x] 7.4 Update `QueryBuilder/tests/` and the `use-saved-query-page` specs for draft mode (baseline, dirty, Reset, Save as query success and failure), Save as on a clean query, Delete (confirm, success navigation, failure, hidden when not writable) and the toolbar without a source selector
- [x] 7.5 Replace `app/[lang]/queries/tests/` grid-page specs with draft-page specs: 403, no `table`, known `table`, unknown `table` fallback, empty entities; add a layout spec for the forbidden short-circuit and the catalog-failure degradation; add any missing mocks to `apps/ai-dial-admin/test-setup.tsx`

## 8. Browser verification

- [x] 8.1 Run the `spec-browser-verify` skill for this change against the running local app (local stack up, auth disabled): it builds a VerificationRequest from the browser-observable scenarios of the `analytics/source-panel`, `analytics/query-builder` and `analytics/saved-queries` deltas and spawns the `spec-verification-gate` sub-agent through the Playwright MCP. Create a query of its own for the scenarios that save, edit or delete; do not modify existing saved queries
- [x] 8.2 Resolve every `fail` verdict and re-run the skill for the failed scenarios only until none remain; treat a `blocked` verdict caused by an element not addressable by role or accessible name as a defect to fix

## 9. Quality checks

- [x] 9.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; fix what they report
- [x] 9.2 Run `openspec validate add-query-builder-source-panel --strict`

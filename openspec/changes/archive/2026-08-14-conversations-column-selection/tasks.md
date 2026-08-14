Prerequisite: apply and archive `conversations-summary-and-user-column` and
`conversations-grid-sort-and-filter` first. This change extends the second change's field-backed sort and
filter rule to columns added from the schema.

Verification note: the change's scenarios are browser-observable, so the `spec-browser-verify` question was
asked; the user chose unit-test coverage only, so no verification task is included.

Groups 1–4 are the shared grid work and are reviewable independently of groups 5–8, which are the analytics
opt-in. Splitting them across two PRs is expected.

## 1. Leaf descriptors in the shared panel

- [x] 1.1 Add a leaf-descriptor model (`field`, `headerName`, `hide`, `groupId`) and a pure derivation from
      either a flat `ColDef[]` or a `ColGroupDef[]` to that list, in `src/components/Grid/utils.ts`. The flat
      case must be an identity transform so existing grids are unaffected.
- [x] 1.2 Add the pure inverse: write a visibility change or a reorder back into the definitions tree at the
      leaf's location, returning new definitions and leaving other groups untouched.
- [x] 1.3 Change `src/components/Grid/ColumnsPanel/ColumnsPanel.tsx` to render leaf descriptors, keeping the
      existing exclusion of panel-suppressed, field-less and header-less columns, and show each column's group
      when the grid is grouped.
- [x] 1.4 In `src/components/Grid/GridView/GridView.tsx`, derive the descriptor list from `columnDefs` and
      rewrite `toggleColumnVisibility`, `onFindColumn` and `onMoveColumn` to work through it instead of
      top-level `field` matching and top-level indices.

## 2. Group-safe reordering and hidden-column cleanup

- [x] 2.1 Clamp `onMoveColumn` to the dragged leaf's own group: resolve the target index's group and return
      unchanged when it differs, so no partial move is applied.
- [x] 2.2 On a toggle to hidden, clear that column's sort and its filter-model entry through the grid API
      before applying the new definitions, and confirm the resulting filter change is what triggers a
      server-paged grid's re-fetch — no datasource special-casing.

## 3. Grouped column-state persistence

- [x] 3.1 In `src/components/Grid/utils.ts`, add grouped counterparts to `applyColumnStateOrderToColDefs`
      (ordering leaves within their groups **and** applying `hide`), `haveColDefsSamePanelState`,
      `updateColumnVisibilityInStorage` and `getColumnVisibilityFromGridState`. Leave the flat functions and
      their callers unchanged, and keep the existing behaviour of skipping a stored `colId` that no longer
      exists.
- [x] 3.2 Add a grouped variant of `checkColDefsChanges` in
      `src/components/Grid/comparators/base-column-comparator.ts`, so the reset affordance appears exactly when
      the state differs from the defaults.
- [x] 3.3 Teach `getDefaultSorts` in `src/components/Grid/AgGridWrapper.tsx` to read `sort` from leaf columns,
      so a grouped grid's default sort is applied.
- [x] 3.4 Have `GridView` select the flat or grouped helper based on the shape of `columnDefs`, in one place.

## 4. Shared-grid tests

- [x] 4.1 Add specs for the descriptor derivation and its inverse in `src/components/Grid/tests/`: flat input
      round-trips unchanged, grouped input yields leaves with their `groupId`, and a write-back leaves other
      groups untouched.
- [x] 4.2 Add specs for the grouped state helpers and the grouped comparator, including a stored `colId` that
      no longer exists.
- [x] 4.3 Add `GridView` component specs over both shapes: toggling visibility, reordering within a group, a
      cross-group drop leaving the order unchanged, hiding a column clearing its sort and filter, and the reset
      affordance's visibility.
- [x] 4.4 Run the existing specs of the grids already using the panel (Usage Log, Evaluation list, Containers,
      Container events, Queries, HF registry, MCP registry) and resolve any behaviour difference — identical
      behaviour on flat grids is the acceptance bar for groups 1–3.

## 5. The conversations column catalog

- [x] 5.1 Fetch the `conversations` entity schema for the view: call the existing `getEntitySchema` action from
      `src/app/[lang]/conversations-trace/page.tsx` and pass it into the view, with a failure leaving the
      curated columns and a reported unavailability rather than an empty catalog.
- [x] 5.2 Add a pure catalog builder in `src/utils/analytics/` taking the schema fields and the curated column
      definitions: keep each curated column, then add one column per remaining field, excluding `sensitive`
      fields, `object` / `array` types, and fields a curated column consumes (`first_request_time`,
      `last_request_time`).
- [x] 5.3 Map `AnalyticsFieldType` to rendering and querying: the existing `ConversationFieldFormat`
      formatters, numeric alignment, and the `baseStringFilter` / `baseNumberFilter` preset the type calls for,
      so a schema-driven column sorts and filters on the same terms as a curated one.
- [x] 5.4 Attribute every catalog column to the `conversations` provenance group, and keep the Rating column
      outside the catalog entirely.

## 6. Projection follows visibility

- [x] 6.1 Pass the visible schema-driven fields into `buildConversationListQuery`
      (`src/utils/analytics/conversations-queries.ts`) and union them with the curated fields in the select.
- [x] 6.2 In `src/components/Analytics/ConversationsTrace/use-conversations.ts`, restart paging when a column
      becomes visible and do not re-query when one is hidden.
- [x] 6.3 Confirm the totals query is untouched by visibility — it aggregates over the filtered result, not
      over the projection.
- [x] 6.4 Widen the list row model in `src/models/analytics/conversations-trace.ts` so a row can carry
      schema-driven fields alongside the curated ones.

## 7. Conversations opt-in

- [x] 7.1 In `src/components/Analytics/ConversationsTrace/List/ConversationsList.tsx`, add the Columns button
      and panel wiring (`showColumnsPanel` / `toggleColumnsPanel`), following how `ListView/List.tsx` triggers
      it, and pass a per-view `storageKey` plus `isLiveData`.
- [x] 7.2 Not needed as written: `autoSizeStrategy: fitGridWidth` is an initial-fit strategy, not the sizing
      mechanism. Every curated column already carries `flex` + `minWidth`, and `defaultColDef` supplies both for
      schema-driven ones, so columns still fill the container with a `storageKey` present. `minWidth` behaviour
      is unchanged, so the horizontal-scroll threshold is the same as before.
- [x] 7.3 Gate the datasource assignment on the persisted state having been applied, so the first page request
      carries a restored sort and restored predicates.

## 8. Analytics tests

- [x] 8.1 Add a spec for the catalog builder in `src/utils/analytics/tests/`: each exclusion rule, the
      type-to-format mapping, the curated columns kept as-is, and a schema reporting an unknown type.
- [x] 8.2 Extend `src/utils/analytics/tests/conversations-queries.spec.ts` for the projection following the
      visible fields, and that a hidden field is absent from the select.
- [x] 8.3 Extend `src/components/Analytics/ConversationsTrace/tests/ConversationsList.spec.tsx` and
      `ConversationsTraceView.spec.tsx`: the catalog offered, Rating absent from it, showing a column
      re-querying from the first page, hiding one not re-querying, and the first request carrying restored
      state.
- [x] 8.4 Extend `src/app/[lang]/conversations-trace/tests/actions.spec.ts` and the page spec for the schema
      fetch and its failure path.

## 9. Quality checks

- [x] 9.1 Run `npm run lint`, `npm run format`, and the test suite from `apps/ai-dial-admin/`, and resolve
      everything they report.

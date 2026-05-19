## 1. TreeGrid primitive — types and utilities

- [x] 1.1 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/types.ts` exporting `TreeRow<T> = T & { id: string; parentId: string | null; depth: number; expanded: boolean; children: TreeRow<T>[]; synthetic?: boolean }`. Mirror the field set used by SchemaGrid's `SchemaFieldRow` so the migration is mechanical when we do it; add `synthetic` for the synthetic-parent flag (Decision 5).
- [x] 1.2 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/utils.ts` exporting:
    - `buildTreeFromParentPointer<T>(rows: T[], opts: { getId: (r: T) => string; getParentId: (r: T) => string | null; maxDepth?: number }): TreeRow<T>[]` — builds the tree from `(getId, getParentId)` pointers, drops cyclic back-edges, caps depth at `maxDepth` (default 8). Logs `console.warn` once per cycle and once for cap hits. Input rows pre-flagged with `synthetic: true` SHALL have that flag propagated to the resulting `TreeRow<T>`. Synthesis of missing intermediate ancestors is the consumer's responsibility (Decision 5).
    - `flattenTree<T>(rows: TreeRow<T>[]): TreeRow<T>[]` — depth-first walk emitting `row` then (if `expanded`) its children recursively.
    - `updateRowInTree<T>(rows: TreeRow<T>[], id: string, updater: (row: TreeRow<T>) => TreeRow<T>): TreeRow<T>[]` — immutable map-by-id, recursing into children. Mirrors SchemaGrid's `updateFieldInList` (`SchemaGrid.tsx:69-80`).
    - `findRowInTree<T>(rows: TreeRow<T>[], id: string): TreeRow<T> | undefined` — same recursion shape as SchemaGrid's `findFieldById`.
    - `overlayExpandedState<T>(tree: TreeRow<T>[], prev: Map<string, boolean>): TreeRow<T>[]` — applies a saved expanded-id map to a freshly built tree. Used by `useTreeRows` on refresh (Decision 9).
- [x] 1.3 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/tests/utils.spec.ts` covering: linear chain (a→b→c), branching (a → b, c), input rows pre-flagged with `synthetic: true` propagate to built tree, cycle detection (a→b→a) drops the back-edge and warns, depth cap at 8 with overflow rendered as flat siblings at depth 8, empty input returns empty array, multiple roots, orphan rows (parent id not in input set) become roots.

## 2. TreeGrid primitive — UI

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/ExpanderCell.tsx` rendering an indent (`paddingLeft: depth * 24` matching SchemaGrid's spacing at `SchemaGrid.tsx:288`), a chevron toggle (`IconChevronDown` / `IconChevronRight` from `@tabler/icons-react`, matching the kit's `Accordion` icon pattern referenced in the `adaptive-value-grid-collapsible` spec), and the cell value. Synthetic rows SHALL render the value in italic and SHALL render the chevron disabled-styled. Leaf rows (no children) render no chevron, just the indent. Accepts `params: ICellRendererParams<TreeRow<T>>`.
- [x] 2.2 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/use-tree-rows.ts` exporting `useTreeRows<T>(tree: TreeRow<T>[], opts?: { defaultExpandDepth?: number })` returning `{ flatRows, onToggleExpand, gridApiRef, onGridReady }`. The hook owns:
    - A `useRef<Map<string, boolean>>` of expanded-state keyed by row id, surviving rebuilds via `overlayExpandedState` (Decision 9).
    - The `onToggleExpand(row)` callback that flips a single row's expanded state and pushes new flat rows into the AG Grid api via `updateGridOptions({ rowData })` — same flow as SchemaGrid's `onToggleExpand` (`SchemaGrid.tsx:82-96`) which deliberately bypasses any parent `onChange` because expand is UI-only.
    - A side effect that re-flattens and re-pushes rows when the input `tree` reference changes (e.g., after a query refetch).
- [x] 2.3 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/TreeGrid.tsx` — a thin component composing `GridView` and `useTreeRows`. Props: `rows: TreeRow<T>[]`, `columnDefs: ColDef[]`, `expanderColumnField: keyof T` (which column gets `ExpanderCell` as `cellRenderer`), `additionalGridOptions?: GridOptions`. The component SHALL clone the column with `field === expanderColumnField` and inject the `ExpanderCell` renderer at construction. It SHALL ALSO strip every column's `sort` and set `sortable: false` + `filter: false` on every column before forwarding to `GridView` — see Decision 11. `getRowId` uses `TreeRow<T>.id`.
- [x] 2.4 Create `apps/ai-dial-admin/src/components/Common/TreeGrid/tests/TreeGrid.spec.tsx` covering: renders flattened tree in row order parent→children, click expander toggles row, indent matches depth, synthetic rows rendered italic, refresh preserves expanded state, leaf rows render no chevron, empty tree shows the existing `GridView` empty state, **AND a column carrying `sort: 'desc'` does NOT reorder rendered rows away from `flattenTree` order (Decision 11 regression)**.

## 3. Query and column changes

- [x] 3.1 In `apps/ai-dial-admin/src/constants/telemetry.tsx`, add a new constant `ENTITY_CONSUMPTION_TREE_QUERY` that mirrors `ENTITY_CONSUMPTION_QUERY` but with `'parent_deployment'` added to `expressions` and `groupBy`. Keep `ENTITY_CONSUMPTION_QUERY` unchanged so flat mode continues to work without a column shape diff. Co-locate a `TypeScript` comment pointing to this design doc.
- [x] 3.2 In `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx`, no constant edit — the consumer (`EntitiesConsumptionTree.tsx`) will swap the Name column's `cellRenderer` at runtime via `TreeGrid`'s `expanderColumnField` prop. Verify the existing `TELEMETRY_GRID_COLUMNS` has a Name column with `field: 'name'` (it does — `grid-columns.tsx:447-458` extends from `NAME_COLUMN`).
- [x] 3.3 No additional i18n keys are required. Synthetic placeholder rows display backend `0` values directly with no client-side substitution or tooltip text; the `(+N)` suffix on the Name column is locale-neutral.

## 4. EntitiesConsumptionTree component

- [x] 4.1 Create `apps/ai-dial-admin/src/components/Telemetry/EntitiesConsumptionTree.tsx`. Props mirror the current `TelemetryGrid` props: `getData`, `refreshTime`, `title`, plus `query` and `treeQuery` (`ENTITY_CONSUMPTION_QUERY` and `ENTITY_CONSUMPTION_TREE_QUERY`).
- [x] 4.2 In the component, use `useState<boolean>(() => readGroupByParentPref())` for the toggle state, where `readGroupByParentPref` reads from `localStorage['dashboard:entities-consumption:groupByParent']` (returns `false` for absent / `'false'`). When the user toggles, write the new value back via `localStorage.setItem`.
- [x] 4.3 Use the existing `getData(query)` shape to fetch. Call `getData(ENTITY_CONSUMPTION_TREE_QUERY)`, run the response through `getGridData`, then `withSyntheticAncestors` (consumer-local pre-processing that walks each row's `execution_path` and appends `synthetic: true` placeholder rows for any missing intermediate ancestor — Decision 5). Pass the augmented array to `buildTreeFromParentPointer` with `getId: r => ${r.execution_path}|${r.name}` and `getParentId: r => stripDeploymentSuffix(r.execution_path, r.name) + '|' + r.parent_deployment` (composite-id matching, avoids name-collision when the same deployment appears under multiple parents — Decision 5 explanation).
- [x] 4.4 Compute `columnDefs` for tree mode by spreading `TELEMETRY_GRID_COLUMNS` and replacing the Name column's `cellRenderer`. The replacement renderer SHALL show `row.name` followed by a subtle `(+N)` suffix where N is `row.children.length` if non-zero (Decision 6). Pass `expanderColumnField: 'name'` to `TreeGrid`.
- [x] 4.5 Numeric columns require no per-row overrides — the default `TELEMETRY_GRID_COLUMNS` definitions are passed through unchanged. Synthetic placeholder rows display the literal `0` values they were created with; no `tooltipValueGetter` or subtree-sum computation is performed.
- [x] 4.6 Add the toggle UI: a `DialSelect` (size `Sm`, variant `Secondary`) or `DialCheckbox` above the grid title, label = `t(TelemetryI18nKey.GroupByParent)`. Position: inline with the existing grid title bar; the existing `TelemetryGrid` does not own that bar, so this component renders its own header div that includes the title from props and the toggle to the right. Use the same heading typography as existing telemetry titles (check `TelemetryGrid.tsx`).
- [x] 4.7 Refresh handling: when `refreshTime` triggers a refetch, the new response replaces the previous tree. `useTreeRows`'s `overlayExpandedState` preserves expanded state across the rebuild (Decision 9).

## 5. Wire into the dashboard

- [x] 5.1 In `apps/ai-dial-admin/src/components/Telemetry/Dashboards/View/SimpleDashboard.tsx`, replace the existing `<TelemetryGrid query={ENTITY_CONSUMPTION_QUERY} columnDefs={TELEMETRY_GRID_COLUMNS} title={...} />` for `route === ApplicationRoute.Dashboard` with `<EntitiesConsumptionTree getData={...} refreshTime={...} title={...} query={ENTITY_CONSUMPTION_QUERY} treeQuery={ENTITY_CONSUMPTION_TREE_QUERY} />`. Verify Projects Consumption below it is untouched.
- [x] 5.2 Verify the Entities Consumption slot only renders for `route === ApplicationRoute.Dashboard` (`SimpleDashboard.tsx:37`). Other routes that use `SimpleDashboard` (Applications, AssetsToolsets, etc.) do not see Entities Consumption; no migration needed for those routes.

## 6. Tests

- [x] 6.1 Add `apps/ai-dial-admin/src/components/Telemetry/tests/EntitiesConsumptionTree.spec.tsx` covering: initial render in flat mode when no localStorage pref (parity with current `TelemetryGrid` snapshot of column count and row format); toggle on switches to tree mode and triggers the tree query; tree rows render expanded state and indented Name; synthetic-parent insertion when a `parent_deployment` value lacks its own row; toggle preference persists via localStorage; refresh preserves expanded state.
- [x] 6.2 Verify `TreeGrid` unit tests from Task 2.4 and `utils` tests from Task 1.3 cover the synthetic-parent and cycle-detection paths end-to-end. The `EntitiesConsumptionTree` spec MAY shallow-mock `TreeGrid` and assert on its props if the e2e DOM assertions become brittle — prefer integration where reasonable.
- [x] 6.3 No spec change for `TelemetryGrid` or `GridView` — both are untouched.

## 7. Validation

- [x] 7.1 Run `npm run lint` from repo root and resolve any issues.
- [x] 7.2 Run `npm run format:write` from repo root.
- [x] 7.3 Run `npm run test` from `apps/ai-dial-admin/` (required for `@/` alias resolution) and resolve any failures.
- [x] 7.4 Run `openspec validate dashboard-entities-tree-grid --strict` and resolve any reported issues.

## 1. Column Hierarchy Flip (utils.ts)

- [x] 1.1 Rewrite `getComparedMetricsColumns` in `apps/ai-dial-admin/src/components/Runs/View/utils.ts` to produce `group → [metricKey → [Current leaf, Compared leaf]]` instead of `group → [Current → keys, Compared → keys]`
- [x] 1.2 Update `getAnalyticsColumnsCompare` in the same file to apply the same inversion for EXECUTION: replace `{ headerName: 'EXECUTION', children: [{ headerName: 'Current', children: executionColumns }, { headerName: 'Compared', children: comparedExecutionColumns }] }` with individual field sub-groups (`#`, `HTTP`, `Duration`) each containing a Current and Compared leaf
- [x] 1.3 Update `getAnalyticsColumnsCompare` to apply the same inversion for EXTRACTED: each field key becomes a sub-group with Current and Compared leaf children
- [x] 1.4 Update unit tests in `apps/ai-dial-admin/src/components/Runs/View/tests/utils.spec.ts` that assert the compare column structure to match the new hierarchy

## 2. TreeColumnsPanel — Core Component

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel.tsx` with props interface `{ columns: ColDef[], onColumnsChange: (columns: ColDef[]) => void, panelClassName: string, toggleColumnsPanel?: () => void, skipLeafNames?: string[] }` and a header (title + close button matching ColumnsPanel style) with a scrollable tree body
- [x] 2.2 Create `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/TreeColumnNode.tsx` — recursive node renderer that renders a group node as an expand/collapse row with a `DialCheckbox` (supporting indeterminate state) and its children indented below when expanded; renders a leaf node as a `DialCheckbox` labelled with `headerName`; skips leaf nodes whose `headerName` is in `skipLeafNames`
- [x] 2.3 Implement group checkbox indeterminate-state derivation: compute checked/indeterminate/unchecked from the visibility of all non-skipped leaf descendants
- [x] 2.4 Implement the recursive `toggleColDefNode` pure function (in a `utils.ts` co-located with the component or in the existing `Runs/View/utils.ts`) that deep-clones the ColDef tree and sets `hide` on the target node and all its descendants
- [x] 2.5 Create `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/index.ts` re-exporting `TreeColumnsPanel`

## 3. Analytics.tsx Integration

- [x] 3.1 Add `panelColDefs` state to `Analytics.tsx` initialised from `computedColDefs`; add a `useEffect` that resets `panelColDefs` whenever `computedColDefs` reference changes (on mode switch or data load)
- [x] 3.2 Add `showTreePanel` boolean state and `toggleTreePanel` handler to `Analytics.tsx`
- [x] 3.3 Add a "Columns" ghost icon button (using an appropriate `@tabler/icons-react` icon) to the analytics toolbar row; pressing it calls `toggleTreePanel`
- [x] 3.4 Pass `panelColDefs` as `columnDefs` to `<GridView>` instead of `computedColDefs`
- [x] 3.5 Implement `onPanelColumnsChange` callback in `Analytics.tsx`: call `setPanelColDefs(newColDefs)` and `gridApiRef.current?.setGridOption('columnDefs', newColDefs)` to keep React state and live grid in sync
- [x] 3.6 Wrap the `<GridView>` container in a `relative`-positioned div; conditionally render `<TreeColumnsPanel>` as an absolute overlay inside that div when `showTreePanel` is true, passing `panelColDefs`, `onPanelColumnsChange`, and `toggleTreePanel`

## 5. Bug Fixes (post-implementation)

- [x] 5.1 Add `context: { panelName: 'Details' }` to the blank group and `context: { panelName: 'Status' }` to the status column in `staticColumns` in `utils.ts`; update `TreeColumnNode.tsx` to use `node.context?.panelName || node.headerName` as the display label so blank grid headers still show meaningful names in the panel
- [x] 5.2 Fix columns invisible on init and in compare mode: revert `<GridView columnDefs>` prop back to `computedColDefs` in `Analytics.tsx`; keep `panelColDefs` only for `<TreeColumnsPanel>` — this removes the 1-render delay that caused GridView to initialize from stale column defs

## 8. Panel UX

- [x] 8.1 In `TreeColumnNode.tsx` change `useState(true)` → `useState(false)` so all groups start collapsed (only level-1 rows visible on open)
- [x] 8.2 Fix DnD in `TreeColumnsPanel.tsx`: custom `DraggableTreeItem` with `useDrag([id])` + `useDrop([id])` (fully stable deps — no re-registration mid-drag); `onMove` updates only `localColumns` during hover (no parent callback); `onCommit` called on `end` to commit final order to parent once; `onMove`/`onCommit` accessed via refs so closures are always current

## 7. Polish

- [x] 7.1 Fix panel background color: change `bg-layer-2` → `bg-layer-3` in the `panelClassName` string passed to `<TreeColumnsPanel>` in `Analytics.tsx` (matching `staticPanelClassName` used by the original ColumnsPanel in `GridView.tsx`)
- [x] 7.2 Add indentation for leaf nodes in `TreeColumnNode.tsx`: wrap the leaf `<DialCheckbox>` in `<div className="pl-6">` so leaves align with the checkbox text of sibling group nodes (which are offset by the `w-5` toggle button + `gap-1`)
- [x] 7.3 Add drag-and-drop reordering for level-1 columns in `TreeColumnsPanel.tsx`: import `DndProvider`/`HTML5Backend`, `DraggableItem`, `useCallback`, `useDrop`, and `useRef`; derive a stable drag `id` per top-level column from `context.panelName || headerName.trim()`; implement `findItem` and `moveItem` callbacks that reorder `columns` and call `onColumnsChange`; wrap the list `<ul>` in a drop-zone ref; wrap each top-level `<li>` in `<DraggableItem>`; wrap the whole panel in `<DndProvider backend={HTML5Backend}>`

## 6. Bug Fixes (Current/Compared visibility)

- [x] 6.1 Change `DEFAULT_SKIP_LEAF_NAMES` in `TreeColumnsPanel.tsx` from `['Current', 'Compared']` to `[]` — this makes Current/Compared leaves visible in the panel and fixes `getGroupCheckState` always returning `'checked'` in compare mode (caused by `collectLeafStates` skipping all leaves and returning an empty array)

## 9. Housekeeping

- [~] 9.1 ~~types.ts~~ — reverted per user request; `Props` interface and `GroupCheckState` type remain inline in their respective files
- [~] 9.2 ~~constants.ts~~ — reverted per user request; `DRAG_TYPE` and `DEFAULT_SKIP_LEAF_NAMES` remain inline in `TreeColumnsPanel.tsx`
- [x] 9.3 Create `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/index.ts` re-exporting `TreeColumnsPanel` as default
- [x] 9.4 Create `apps/ai-dial-admin/src/components/Grid/TreeColumnsPanel/tests/utils.spec.ts` with tests covering `toggleColDefNode`, `collectLeafStates`, and `getGroupCheckState`

## 4. Code Quality

- [x] 4.1 Run `npm run lint` and `npm run format:write` from the repo root; fix any issues
- [x] 4.2 Run `npx vitest run src/components/Runs/View/tests/utils.spec.ts` from `apps/ai-dial-admin/` and confirm all tests pass

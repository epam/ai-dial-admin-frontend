# tree-grid Specification

## Purpose

Provide a domain-agnostic primitive for rendering flat row arrays (with parent-id pointers) as an expandable tree on top of the existing community-edition `GridView` / AG Grid integration. The primitive owns flattening, depth-first ordering, indent rendering, expander chevrons, synthetic-row styling, and the disabling of column sort/filter that would otherwise scatter children away from parents. Domain features (e.g., entities consumption, audit) consume this primitive and supply their own data transforms and column defs.

## Requirements

### Requirement: TreeGrid primitive renders flat rows with parent pointers as an expandable tree

A generic `TreeGrid<T>` component SHALL live at `apps/ai-dial-admin/src/components/Common/TreeGrid/TreeGrid.tsx`. It SHALL accept a `TreeRow<T>[]` (where `TreeRow<T> = T & { id, parentId, depth, expanded, children: TreeRow<T>[], synthetic? }`), a `columnDefs: ColDef[]`, and an `expanderColumnField: keyof T` identifying which column receives the indent + caret renderer. It SHALL compose the existing `GridView` component without modifying it. The primitive SHALL NOT depend on AG Grid's enterprise `treeData` mode — flattening is hand-rolled to keep the codebase on the community edition and consistent with the existing audit and SchemaGrid tree implementations.

The primitive SHALL be capability-agnostic: no knowledge of deployments, schemas, activities, telemetry, or any other domain concept. Domain knowledge lives in feature components that consume `TreeGrid`.

#### Scenario: Component renders rows in depth-first flatten order honoring expanded state

- **GIVEN** a tree with one root, two children of that root, and one grandchild under the first child, where all rows are `expanded: true`
- **WHEN** the component renders
- **THEN** AG Grid SHALL receive rows in the order [root, child-1, grandchild, child-2]

#### Scenario: Collapsing a parent hides its descendants without removing them from the tree

- **GIVEN** an expanded parent row with two children
- **WHEN** the user clicks the expander chevron on the parent
- **THEN** the parent's `expanded` flag SHALL flip to `false`
- **AND** the flatten output SHALL contain only the parent
- **AND** the tree data structure SHALL retain the children (re-expanding restores them without a refetch)

#### Scenario: Indent depth matches row depth

- **WHEN** a row at depth N is rendered
- **THEN** the indent in the expander column SHALL be `N * 24` pixels of left padding (matching the spacing used by `SchemaGrid`)

#### Scenario: Leaf rows render no chevron

- **WHEN** a row has an empty `children` array
- **THEN** no expander chevron SHALL render in the expander column
- **AND** the indent SHALL still apply at `depth * 24` so leaves align with the cells of their siblings that have children

#### Scenario: Synthetic rows render with italic name

- **GIVEN** a `TreeRow<T>` with `synthetic: true`
- **WHEN** the row is rendered
- **THEN** the expander column value SHALL appear in italic typography
- **AND** the chevron (if any) SHALL render in a disabled / muted style

#### Scenario: TreeGrid strips column sort and disables sortable/filter on every column

- **GIVEN** a `columnDefs` array where one or more columns declare `sort: 'desc'` (or `sort: 'asc'`), and where columns inherit `sortable: true` / `filter: 'agTextColumnFilter'` from `GridView`'s defaults
- **WHEN** `TreeGrid` augments `columnDefs` before forwarding them to `GridView`
- **THEN** every column SHALL have its `sort` property removed
- **AND** every column SHALL have `sortable: false`
- **AND** every column SHALL have `filter: false`
- **AND** the rendered row order SHALL match `flattenTree` output exactly (parent immediately followed by its visible children), regardless of any sort/filter that was declared on the input column defs

**Why:** tree row order IS the answer that `flattenTree` provides. Column sort would re-order the flat list and visually scatter children away from their parents on every `rowData` update (`AgGridWrapper`'s non-live path re-applies `defaultSorts` on each tick via `applyGridState`). Column filters would hide children but keep parents (and vice versa), breaking the tree just as badly. AG Grid Enterprise's `treeData` mode handles both natively, but Decision 4 deliberately does not use it.

### Requirement: buildTreeFromParentPointer constructs a tree from flat rows with parent ids

A pure utility `buildTreeFromParentPointer<T>(rows: T[], opts)` SHALL live at `apps/ai-dial-admin/src/components/Common/TreeGrid/utils.ts`. It SHALL take a flat array of source rows and an options object specifying `getId`, `getParentId`, and an optional `maxDepth` (default 8). It SHALL return a `TreeRow<T>[]` where each input row is wrapped with `id`, `parentId`, `depth`, `expanded: false`, and `children: TreeRow<T>[]`. If an input row carries a `synthetic: true` property it SHALL be propagated to the resulting `TreeRow<T>`.

The function SHALL be pure: same inputs produce same outputs, no observable side effects beyond the cycle/depth-cap warnings.

Synthesis of intermediate ancestors (when `parent_deployment` references a deployment with no own row) is the **consumer's** responsibility — see Decision 5. The primitive does NOT synthesize rows on its own; consumers pre-process their input array, append synthetic placeholder rows with `synthetic: true`, and pass the augmented array in.

#### Scenario: Rows with null parent become roots

- **GIVEN** input rows `[{ id: 'a', parent: null }, { id: 'b', parent: null }]`
- **WHEN** `buildTreeFromParentPointer` runs
- **THEN** both rows SHALL be returned as roots at depth 0
- **AND** each SHALL have `children: []`

#### Scenario: Rows with a parent id pointing into the set are nested

- **GIVEN** input rows `[{ id: 'a', parent: null }, { id: 'b', parent: 'a' }, { id: 'c', parent: 'b' }]`
- **WHEN** the builder runs
- **THEN** the output SHALL contain one root `a` at depth 0 with one child `b` at depth 1, and `b` SHALL have one child `c` at depth 2

#### Scenario: Input rows pre-flagged as synthetic propagate to the built tree

- **GIVEN** input rows `[{ id: 'a', parent: null, synthetic: true }, { id: 'b', parent: 'a' }]`
- **WHEN** the builder runs
- **THEN** the resulting `TreeRow<T>` for `a` SHALL carry `synthetic: true`
- **AND** the resulting `TreeRow<T>` for `b` SHALL NOT carry `synthetic`

#### Scenario: Orphan row whose parent id is not in the input set becomes a root

- **GIVEN** input rows `[{ id: 'b', parent: 'a' }]` (no row for `a`)
- **WHEN** the builder runs
- **THEN** `b` SHALL be returned as a root at depth 0 (the primitive does NOT synthesize a parent — consumers do that pre-processing if they want it)

#### Scenario: Cycle detection drops the back-edge

- **GIVEN** input rows `[{ id: 'a', parent: 'b' }, { id: 'b', parent: 'a' }]`
- **WHEN** the builder runs
- **THEN** the back-edge SHALL be dropped: one of the two rows SHALL become a root and the other SHALL be its child (deterministic by input order)
- **AND** a single `console.warn` SHALL be emitted naming the cycle members
- **AND** the builder SHALL NOT infinite-recurse

#### Scenario: Depth cap flattens overflow at the cap depth

- **GIVEN** a linear chain of 12 rows where each row's parent is the previous one
- **WHEN** the builder runs with default `maxDepth: 8`
- **THEN** rows at logical depth ≤ 7 SHALL nest normally
- **AND** rows at logical depth ≥ 8 SHALL be siblings at depth 8 (no further nesting)
- **AND** a single `console.warn` SHALL be emitted summarizing how many rows hit the cap

### Requirement: flattenTree emits rows in depth-first order honoring expanded flags

A pure utility `flattenTree<T>(rows: TreeRow<T>[]): TreeRow<T>[]` SHALL emit each input row followed by its descendants if and only if the row's `expanded` flag is `true`. Order SHALL be parent before children, siblings in array order. The function SHALL be pure: no mutation of input, no side effects.

#### Scenario: Collapsed parent skips its subtree

- **GIVEN** a tree `[{ id: 'a', expanded: false, children: [{ id: 'b' }] }]`
- **WHEN** `flattenTree` runs
- **THEN** the output SHALL be `[{ id: 'a' ... }]`
- **AND** `b` SHALL NOT appear

#### Scenario: Expanded parent emits its subtree before the next sibling

- **GIVEN** a tree `[a (expanded, children: [b]), c]`
- **WHEN** `flattenTree` runs
- **THEN** the output order SHALL be `[a, b, c]`

### Requirement: useTreeRows hook owns expanded-state and pushes flat rows to AG Grid

A React hook `useTreeRows<T>(tree: TreeRow<T>[], opts?)` SHALL own the expanded-state map keyed by row id and the side-effect of pushing flat rows into the AG Grid api. It SHALL expose `{ flatRows, onToggleExpand, gridApiRef, onGridReady }`. Expanded-state SHALL survive tree reference changes (e.g., a refetch produces a new tree object with the same row ids).

#### Scenario: Toggle on a row flips its expanded flag and re-pushes rows to the grid

- **GIVEN** a mounted `useTreeRows` with a collapsed parent and ready `gridApiRef`
- **WHEN** `onToggleExpand(parent)` is called
- **THEN** the parent's `expanded` flag SHALL flip to `true`
- **AND** the grid api SHALL receive a new `rowData` containing the parent followed by its children

#### Scenario: Re-render with a new tree object preserves expanded state by id

- **GIVEN** a `useTreeRows` where row `a` was previously toggled expanded
- **WHEN** the parent component re-renders with a freshly built tree whose row `a` has `expanded: false` from `buildTreeFromParentPointer`
- **THEN** the overlay step SHALL restore `expanded: true` for row `a` before flattening
- **AND** the user SHALL see no flicker / no collapse of previously-expanded subtrees

#### Scenario: Removed row id is dropped from the expanded-state map

- **GIVEN** a `useTreeRows` where row `a` was expanded
- **WHEN** a refetch returns a tree no longer containing row `a`
- **THEN** subsequent renders SHALL NOT carry `a` in the expanded-state map (memory bound is the size of currently-visible rows, not historical rows)

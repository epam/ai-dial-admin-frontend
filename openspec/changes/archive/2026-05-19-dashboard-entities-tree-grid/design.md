## Context

The Dashboard's Entities Consumption grid is rendered in `apps/ai-dial-admin/src/components/Telemetry/Dashboards/View/SimpleDashboard.tsx`:

```tsx
<TelemetryGrid
  getData={getData}
  refreshTime={effectiveRefreshTime}
  query={ENTITY_CONSUMPTION_QUERY}
  columnDefs={TELEMETRY_GRID_COLUMNS}
  title={t(TelemetryI18nKey.EntitiesConsumption)}
/>
```

The query (`src/constants/telemetry.tsx:52`) is:

```ts
ENTITY_CONSUMPTION_QUERY = {
  $type: 'json',
  query: {
    expressions: [
      'deployment',
      'count()',
      'sum(deployment_price) as money',
      'sum(price) as aggregated_money',
      'sum(prompt_tokens) as tokens_p',
      'sum(completion_tokens) as tokens_c',
    ],
    from: ANALYTICS_TABLE_NAME,
    groupBy: ['deployment'],
  },
};
```

`parent_deployment` is already a known column — it appears in `TRACES_QUERY.expressions` (`src/constants/telemetry.tsx:119`) and `CONVERSATIONS_QUERY.expressions` (`src/constants/telemetry.tsx:180`), and is declared as a hidden column in `USAGE_LOG_TRACES_COLUMNS` (`src/constants/grid-columns/grid-columns.tsx:501`) and `MCP_CALLS_BY_DEPLOYMENT_COLUMNS` (`src/constants/grid-columns/grid-columns.tsx:604`). The grouping in `MCP_CALLS_BY_DEPLOYMENT_QUERY` (`src/constants/telemetry.tsx:242-250`) already pioneers `groupBy: ['parent_deployment', 'deployment']` for a different chart, confirming the backend handles the shape.

Two existing tree implementations in the codebase guide this work — and they motivate the extraction:

- **`ActivityAudit/List/List.tsx`** (`getProcessedActivityMap`, lines 140-175): builds `Record<activityId, DialActivity & { children, expanded, canToggleExpand }>` from a flat list, then inline-flattens parent-then-children when feeding rows into AG Grid's infinite datasource. Handles exactly one level of nesting. Tied to `parentActivityId` / `activityId` / `DialActivity`. Accumulates rows across paginated `getRows` calls in `fullActivityList` state — fragile when the user changes filters mid-scroll, but works for the audit use case.

- **`Common/SchemaGrid/SchemaGrid.tsx`** (`flattenFields`, `updateFieldInList`, the whole `SchemaFieldRow` machinery in `./utils.ts`): builds an N-level tree of JSON schema fields with `children`, `depth`, `expanded`, recurses through `updateFieldInList` to mutate by id, flattens depth-first into AG Grid rows, and draws indented carets in the leftmost column. The flatten/expand pattern is exactly what Entities Consumption needs; the row type and column set are JSONSchema7-specific and not reusable for telemetry rows.

The natural reuse is **the SchemaGrid pattern** (N-level, indent + caret) — not the audit list pattern (one-level, no indent). Lifting it into a generic primitive captures the right abstraction once and lets the audit list adopt it later if/when its accumulated-state quirks become a problem worth fixing.

## Goals / Non-Goals

**Goals:**
- Dashboard users SHALL be able to see deployment call chains in the Entities Consumption grid grouped by `parent_deployment → deployment`, with expand/collapse on each parent.
- A single generic `TreeGrid<T>` primitive SHALL exist under `Common/TreeGrid/` and be the only place tree-flatten/expand logic lives for any *future* tree consumer in the app.
- The change SHALL be opt-in via a toggle persisted per-user; flat behavior is the default and unchanged for users who never toggle.
- Dashboard refresh (`refreshTime`) SHALL preserve expanded-state across refetches.

**Non-Goals:**
- **Migrating the audit list to `TreeGrid` is out of scope.** It works today; its accumulated-state and infinite-row coupling are a separate refactor with its own risk profile. The new primitive is designed to support a future migration, but proving that fit lives in a follow-up change.
- **Migrating `SchemaGrid` to `TreeGrid` is out of scope.** Same reasoning. The primitive's API is informed by SchemaGrid's needs (N-level, indent), so it can swap in, but the migration is a separate change.
- **Tree behavior on the Usage Log raw traces grid is out of scope.** Usage Log uses AG Grid's server-side infinite-row model with `IDatasource`; combining infinite rows with tree flattening has its own design problem and would block this change. The Entities Consumption grid is client-paginated over a bounded aggregation, which is what makes a tree feasible here.
- **A path-based tree (parsing `execution_path` as a `/`-delimited string) is out of scope.** The user chose `parent_deployment` pointer over execution_path. Path-based decoding is documented as a potential future enhancement when chains routinely exceed 2-3 levels and pointer chains become awkward to follow.
- **Per-leaf drill-down to raw traces is out of scope.** Clicking a leaf does NOT open a filtered Usage Log view. That would be a separate "open in Usage Log" affordance, mirroring the audit shortcut pattern. Worth doing later; not this change.
- **Server-side computation of subtree totals is out of scope.** The frontend sums descendant metrics in `buildTreeFromParentPointer`. The backend returns leaf-level aggregations only. Acceptable because the result set is bounded (one row per (deployment, parent_deployment) tuple, typically <500 rows even on large installations).

## Decisions

### Decision 1: New generic primitive `TreeGrid<T>` instead of extending `GridView` or `SchemaGrid`

Three placement options were considered:

| Option | Description |
|---|---|
| **A** | Add a `tree` prop to the existing `GridView` and hide the flatten algorithm behind it |
| **B** | Generalize `SchemaGrid` to accept arbitrary row types and column definitions |
| **C** | New `TreeGrid<T>` primitive next to `GridView` under `Common/`, composing it internally |

**Chosen: C.** `GridView` is a small AG Grid wrapper with no opinion about row structure; adding tree semantics to it would balloon its surface and force every flat-grid consumer to opt out. `SchemaGrid` is a leaf component with a domain-specific row type, hardcoded column set, and JSONSchema7 round-trip logic — generalizing it means stripping nearly everything except the flatten/expand bits, at which point it's not `SchemaGrid` anymore. A new primitive that *composes* `GridView` keeps the layering clean: `TreeGrid<T>` owns tree state and indentation; `GridView` owns AG Grid configuration; feature components own their domain.

**Naming:** `TreeGrid` is unambiguous, matches the existing naming style (`GridView`, `SchemaGrid`), and doesn't collide with AG Grid's built-in `treeData` mode (which this primitive deliberately does not use — see Decision 4).

### Decision 2: Tree built from `parent_deployment` pointer, not parsed from `execution_path`

The user explicitly chose pointer over path. Reasoning captured here for posterity:

- `parent_deployment` is a single value per row — trivial to group by in ClickHouse. `execution_path` is a string like `"chat-orch/gpt-4-router/tool-fs"`; grouping by it requires a substring/split aggregation that ClickHouse can do but not cheaply, and it produces one row per *exact path* rather than per (deployment, caller) pair.
- The codebase's other "grouped by parent" view (`MCP_CALLS_BY_DEPLOYMENT_QUERY`) uses the pointer shape — adopting it here gives us a consistent backend pattern across two views.
- Pointer-based trees mirror the audit list's approach, so reviewers already familiar with that pattern have less new ground to cover.
- Deep deployment chains (>2-3 levels) are rare in practice for the dashboard's audience; when they happen, the pointer model handles them correctly, it just renders as a deeper indent. The only case it doesn't handle as well as `execution_path` is when an intermediate deployment is missing from the result set entirely — covered by Decision 5 (synthetic parents).

**Trade-off:** if a deployment is called by two different parents within the same time window, it appears twice in the tree (once under each parent). This is *correct* — they are different call paths with different aggregate metrics — but visually unusual if you expect a strict tree. We accept this; the alternative (DAG rendering) is far more UI complexity for a marginal case. The Name column makes the parent context obvious through indentation.

### Decision 3: Aggregation level = `(deployment, parent_deployment)` tuple, NOT raw traces

The user chose aggregated per (parent, child) tuple over per-trace leaves. This shapes the entire query:

```sql
SELECT deployment, parent_deployment,
       count(),
       sum(deployment_price) AS money,
       sum(price) AS aggregated_money,
       sum(prompt_tokens) AS tokens_p,
       sum(completion_tokens) AS tokens_c
FROM analytics
GROUP BY deployment, parent_deployment
```

One row per (deployment, caller) tuple. The frontend never sees individual traces in this view. Per-trace drill-down lives in the Usage Log and is reachable from a future "open traces for this row" affordance — not part of this change.

**Why this is the right call:** the dashboard is for monitoring *consumption*, not investigating individual calls. The user already has Usage Log for traces. Mixing aggregated parents with raw-trace leaves would couple two query shapes in one grid, complicate refresh, and confuse the column meaning (a "money" column shows different things at different levels).

### Decision 4: Hand-rolled flatten, NOT AG Grid's `treeData` mode

AG Grid has a built-in `treeData: true` mode that takes a flat row array and a `getDataPath` accessor and renders a tree. We are deliberately not using it.

| Reason | Detail |
|---|---|
| **License** | `treeData` is an **enterprise** feature — requires a license key. The repo's AG Grid is community edition (verified via `package.json`); enabling enterprise across an open dependency tree is its own decision. |
| **Consistency** | Both existing tree views (audit list, SchemaGrid) hand-roll the flatten. Adopting `treeData` would split the codebase into two tree paradigms. |
| **Control** | Hand-flatten gives us full control over the row id ordering, the indent rendering, expand/collapse animation, and the synthetic-parent behavior (Decision 5). |

The hand-roll is six lines:

```ts
const flattenTree = <T>(rows: TreeRow<T>[]): TreeRow<T>[] => {
  const out: TreeRow<T>[] = [];
  for (const row of rows) {
    out.push(row);
    if (row.expanded && row.children.length) out.push(...flattenTree(row.children));
  }
  return out;
};
```

Plus an indent-aware first-column cell renderer (`ExpanderCell`). Total primitive surface stays under ~200 lines.

### Decision 5: Synthetic parent rows when `parent_deployment` is not in the result set

Suppose the query returns:

```
{ deployment: 'gpt-4-router', parent_deployment: 'chat-orch', count: 320, money: 8.00 }
{ deployment: 'claude-fb',    parent_deployment: 'chat-orch', count: 180, money: 4.00 }
```

…but no row with `deployment: 'chat-orch'`. This happens if `chat-orch` was used only as a router and never logged a direct call itself within the window. The naïve `buildTreeFromParentPointer` would orphan the two rows; they have a parent pointer but no parent node.

**Resolution:** synthesis is **consumer-side**, not a feature of the primitive. `EntitiesConsumptionTree` runs a pre-processing step (`withSyntheticAncestors`) over the rows from `getGridData` and appends synthetic placeholder rows for any ancestor `execution_path` not represented in the result set. Each synthetic row carries:
- `name`: the parent name taken from the child's `parent_deployment` field
- `execution_path`: the parent path (computed by stripping the child's deployment name from its own ep)
- `synthetic: true` — the input row carries this directly, and `buildTreeFromParentPointer` propagates it onto the resulting `TreeRow<T>`

The cell renderer marks synthetic rows visually (italic deployment name, no tooltip suggesting a missing direct-call count). This keeps the tree well-formed and gives users an aggregate view of indirect deployments that would otherwise be invisible.

**Why the primitive doesn't synthesize:** an earlier iteration had `makeSyntheticRow` + `sumFields` options on `buildTreeFromParentPointer`. With this consumer's adoption of `execution_path` as the unique node id (instead of just the deployment name), the primitive's name-based synthesis couldn't generate the composite `${path}|${name}` ids the consumer needs. Removing the dead options keeps the primitive minimal; the only consumer that needs synthesis (`EntitiesConsumptionTree`) does it itself.

**Alternative considered: orphan rows at depth 0 with a "called by: chat-orch (not in set)" badge.** Rejected — looks like a bug; users don't read badges. Synthetic parent gives the same information through structure.

### Decision 6: Parent rows show direct aggregates with subtree-sum tooltip

A parent deployment can have both its own direct calls (rows where it was called with no parent) AND a set of child rows. The visible numeric cells SHALL show the *direct* aggregate; tooltips on those cells SHALL show the subtree sum.

Why direct + tooltip rather than subtree-sum + tooltip:

- The System Usage chart above the grid shows total request count from the same analytics table. If parent rows showed subtree sums, the numbers in the grid would double-count (each call is counted at the leaf and at every ancestor), breaking reconciliation with the chart.
- Direct aggregates are what the backend actually returns — the frontend doesn't have to compute them. Subtree sums are the layer of synthesis the tree adds, and they belong in a tooltip / secondary affordance.
- For synthetic parents (no direct calls), the cell shows the subtree sum (because there's no direct aggregate to show), with an italic marker — see Decision 5.

The Name column SHALL display a subtle `(+N)` suffix where N is the immediate-child count, so the user can see at a glance that a row has children without having to expand it.

### Decision 7: Flat/tree toggle, default flat, persisted per-user

A toggle above the grid lets the user pick:
- **Flat** (default) — current behavior; query uses `groupBy: ['deployment']`; no tree rendering. Identical to today.
- **Tree** — new behavior; query uses `groupBy: ['deployment', 'parent_deployment']`; rows rendered through `TreeGrid`.

Persistence: `localStorage['dashboard:entities-consumption:groupByParent']` = `'true'` | `'false'` | absent. Absent = flat. The key is per-grid, not per-route, so introducing similar toggles elsewhere later is a clean copy-paste.

**Why default flat:**
- No visible diff for users who don't care about call structure.
- Reviewers and ops teams see the dashboard they know on day one.
- The toggle is in the user's hands; opting in is a single click with persistence.

**Alternative considered: default tree, with a "flatten" escape hatch.** Rejected — too aggressive for a UX change on a high-visibility view. Default flat is the safer rollout, and adoption can be measured before flipping the default in a future change.

### Decision 8: Bounded recursion depth (8) and cycle detection in tree build

`parent_deployment` is user data — nothing prevents a misconfiguration where a→b→a, or a deployment self-references. `buildTreeFromParentPointer` SHALL:

- Detect cycles by tracking the set of ancestor IDs walking down each branch. If a child's id is in its own ancestor set, the edge SHALL be dropped (the child becomes a root) and a single `console.warn` SHALL list the offending chain.
- Cap depth at 8. Any row that would land at depth > 8 SHALL be rendered as a flat sibling at depth 8 (no further indent). Single `console.warn` per render summarizing how many rows hit the cap.

Why 8: deeper than any plausible real call chain, generous enough to give us headroom, small enough to keep indent rendering readable. Adjustable as a single constant if real data later argues for more.

**This is the only bit of "error handling" in the primitive.** Per the project's CLAUDE.md guidance, internal code is trusted; we add these guards only because the tree-building input is shaped by user-configured deployments and the failure mode without them (stack overflow) is severe.

### Decision 9: Expanded-state survival across refresh

`useTreeRows` SHALL key expanded-state by row id (i.e., `deployment` name in this consumer). When `refreshTime` fires and the query re-runs:

1. New rows arrive from the server.
2. `buildTreeFromParentPointer` rebuilds the tree.
3. `useTreeRows` overlays the previous expanded-state map (`Map<id, boolean>`) onto the new tree — any row whose id matches a previously-expanded id keeps `expanded: true`.
4. Rows in the previous state but no longer present (e.g., a deployment stopped being called) drop from the map; rows newly arrived inherit the primitive's default (`expanded: false`).

This is the same pattern the audit list deliberately attempts via its accumulated `fullActivityList`, but at the right layer (the primitive, not the consumer) and without the filter-reset fragility.

### Decision 10: Column set — extend `TELEMETRY_GRID_COLUMNS` with an indent renderer on Name, not a parallel constant

Two options for hosting the tree-mode columns:

| Option | Effect |
|---|---|
| **A** | New `TELEMETRY_TREE_GRID_COLUMNS` constant — identical except the Name column has the `ExpanderCell` renderer |
| **B** | Reuse `TELEMETRY_GRID_COLUMNS` and let `EntitiesConsumptionTree` override the Name column's `cellRenderer` at runtime |

**Chosen: B.** Avoids the constant duplication and the drift hazard (someone adds a column to one but forgets the other). The override is a single-line `useMemo` in the new component.

**Trade-off:** the column definition no longer fully describes its rendering — the consumer has to know it can be augmented. Acceptable because the augmentation is mechanical (replace one cell renderer) and lives next to the consumer.

### Decision 11: TreeGrid MUST strip column `sort` and disable `sortable` / `filter` on every column

**Root cause this guards against (discovered during browser verification):**

`TELEMETRY_GRID_COLUMNS` declares `sort: 'desc'` on the cost column (`apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx:439`). `TreeGrid` was passing column defs through almost verbatim — overriding only the expander column's `cellRenderer`. The downstream chain was:

1. `flattenTree` produces `[parent, child1, child2, …]` in correct tree order.
2. `TreeGrid` → `GridView` → `AgGridWrapper`.
3. `AgGridWrapper`, with `isLiveData` unset, runs the imperative path on every `rowData` change — calling `gridApi.updateGridOptions({rowData})` AND `applyGridState(gridApi, model, defaultSorts)` (`AgGridWrapper.tsx:162-163, 174-177`).
4. `defaultSorts` includes `{colId: 'cost', sort: 'desc'}`. AG Grid re-applies it on every expand/collapse, scrambling tree order — children get sorted to wherever their cost value lands and are visually separated from their parent.

To the user this presents as "expand flickers but nothing appears" — actually the children DO appear, just sorted into the wrong rows somewhere else in the table.

**Why unit tests didn't catch it:** the test suite shallow-mocks `GridView` and exercises `useTreeRows` / `flattenTree` in isolation. The real `AgGridWrapper` sort-reapplication only fires inside a live AG Grid runtime, so the bug only surfaces in the browser. Task 7.5 (manual verify) is the only task this guards.

**The fix (`TreeGrid.tsx`):** before forwarding column defs to `GridView`, strip every column's `sort` and force `sortable: false`. Tree row order IS the answer that `flattenTree` provides; column sort cannot coexist with hand-flattened tree rows. (AG Grid Enterprise's `treeData` mode handles this natively, but Decision 4 deliberately doesn't use it.) The same logic applies to column filters — filtering a column would hide children but keep parents (and vice versa), breaking the tree just as badly — so `filter` is also disabled.

**Regression coverage (mandatory):** `TreeGrid.spec.tsx` SHALL include a test that mounts `TreeGrid` with a column carrying `sort: 'desc'`, supplies rows whose tree order does NOT match that sort, and asserts the rendered order matches `flattenTree` output (parent then children). Without this test the next refactor reintroduces the bug.

## Risks / Trade-offs

- **Risk:** the `groupBy` extension multiplies result row count by the average number of distinct callers per deployment. For typical installations this is 2-5x; for unusual ones it could be 20x. → **Mitigation:** result set is still bounded (one row per (deployment, caller) tuple, not per trace); the existing query is already client-paginated by `TelemetryGrid`. We add a `console.warn` if the response exceeds 5000 rows so we can see this in dev tools before users do.

- **Risk:** synthetic parents (Decision 5) hide the fact that a deployment is misconfigured / unobservable. → **Mitigation:** the italic styling and the tooltip text "aggregated from descendants — no direct calls in this window" make the partial-data state explicit. Users investigating consumption know what they're looking at.

- **Risk:** the toggle adds a small UI element to a high-visibility dashboard. → **Mitigation:** placed inline with the existing grid title bar, label keys are short, doesn't move other content. Default-flat means no immediate visual diff.

- **Risk:** `TreeGrid` primitive is over-engineered for a single consumer. → **Mitigation:** the primitive is ~200 lines; the alternative (inline in `EntitiesConsumptionTree`) is the same code, just less reusable. The cost of the abstraction is small and the path to a second consumer (audit list, SchemaGrid) is short.

- **Trade-off:** `parent_deployment` cardinality varies across deployments. Some deployments have hundreds of distinct callers (popular models), some have one. The tree grid happily renders both; the user just sees taller trees in popular branches. No special handling for "very wide" parents — pagination remains client-side over the same result set, and AG Grid's row virtualization keeps render cost bounded.

- **Trade-off:** the `console.warn` on cycle / depth-cap is dev-tools-only. There is no user-visible signal beyond the affected branch being slightly truncated. Users who hit this case will likely be DIAL admins debugging their own deployment graph; the warning surface is the right channel.

- **Trade-off:** localStorage toggle persistence is per-browser, not per-user-account. Two devs sharing an account see different defaults. Same trade-off every other localStorage preference in the app makes; no reason to be the first to break the pattern.

- **Open question:** the audit list and `SchemaGrid` migrations to `TreeGrid` are explicitly out of scope. Each follow-up change SHALL re-validate that the primitive's API still fits before adopting. We accept the risk that one of those migrations surfaces a missing primitive feature; the cost of adding a feature later is small compared to designing for unspecified future consumers now.

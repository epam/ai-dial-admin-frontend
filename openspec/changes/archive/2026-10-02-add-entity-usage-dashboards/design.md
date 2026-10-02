## Context

See proposal.md — Why. Today `UsageDashboard` is one component that owns everything: the page
heading, `View by`, the period and `Compare`, and every widget of the selected view. Its data hooks
already take a `QueryScope` with an `entityFilter` (`deployment = …`) that nothing sets.
`EntityAudit` renders the telemetry `Dashboard` with `entity` and `route`, and shares one
`TimeFilterValue` across its `Dashboard`, `Traces`, `Conversations` and `Activities` tabs.
`getAuditTabs` decides which tabs an entity gets from `featureFlags.dashboardEnabled` and the route.

What the usage log holds for an application, measured on dev over a week (shapes only):

| Rows | Count of rows | `deployment_price` | `total_price` | tokens |
|---|---|---|---|---|
| the application's own calls (`deployment` = app) | one per user request | empty | the whole tree's cost | zero |
| the calls it made (`parent_deployment` = app) | several per user request | per model call | per model call | per model call |

The calls it made undercount the tree's cost by what nested applications spent, and overcount the
requests several times over. Asset deployments are named `<kind>/<bucket>/<name>__<version>` with
each segment URI-encoded, the shape `getEntityFilterName` already builds for asset toolsets.

## Goals / Non-Goals

**Goals:**

- One widget set, two shells: the standalone page and the entity tab render the same blocks.
- An entity's scope is data handed to the block, not a branch inside each widget.

**Non-Goals:**

- No change to the request contract's shapes; a block issues the same shapes the page does.
- No change to the telemetry dashboard.

## Decisions

### D1. Split `UsageDashboard` into a page shell and a `UsageBlock`

`UsageBlock` takes `view`, `scope` (D2), `windows`, `resolution`, `refreshToken`, `notice` and the
block's tab list, and owns everything per view: tab, donut metric, time-series view, dialogs, the
row panel, `useUsageDashboardData`, `useHeatmapWeek`. It renders the KPI row, time series, donut,
heatmap and breakdown. `UsageDashboard` keeps the heading, `UsageControls`, the window snapshot, and
renders one `UsageBlock` with the selected view and an empty scope — so the page renders what it
renders now.

`EntityUsageDashboard` is the second shell: the same `UsageControls` with `View by` limited to the
entity's views (D5), the window snapshot seeded from and written back to the Audit tab's shared
period, and one `UsageBlock` for the selected view's entry in `ENTITY_BLOCKS` (D3).

*Alternative rejected:* every view stacked under its own heading, with no `View by`. It made an
entity dashboard read differently from the page, and an application's three stacked views issued
three times the requests on every load.

*Alternative rejected:* pass an `entity` prop into `UsageDashboard` and branch inside. Every widget
would learn about entities, and the page would carry entity branches it never takes.

### D2. A scope is a set of row clauses per role, not one deployment filter

`QueryScope.entityFilter` gives way to `scope: UsageScope`:

```ts
interface UsageScope {
  /** Clauses for the entity's own rows: totals, buckets, heatmap, and tabs read from them. */
  own: QueryFilterNode[];
  /** Clauses for the calls the entity made, where a tab or a figure reads those instead. */
  made?: QueryFilterNode[];
}
```

`QueryScope` carries the resolved clauses (`entityClauses`) and `buildFilter` appends them; the data
hooks pick `own` or `made` per request, so the builders stay ignorant of entities. The page passes
`PAGE_SCOPE` (`{ own: [] }`). A model passes `own: [deployment = name]`; an application passes
`own: [deployment = name]` and `made: [parent_deployment = name]`; the application's MCP block
reads `made` for everything, since an application's own rows are never tool calls; its Routes block
reads `own` within the Routes view.

`buildEntityScope(route, name)` in `utils/entity-scope.ts` builds it from the name
`getEntityDeploymentName(route, entity)` resolves — keyed on the name, so a re-fetched entity object
does not re-issue every read — reusing `getEntityFilterName`'s
toolset rule and adding the same rule for asset applications (`applications/` + `encodeCorePath`
of the asset's `DialFile.path`). An entity with no name to match gets no scope, and the tab renders
nothing rather than the whole log. `projectFilter` is unused today and is dropped with `entityFilter`.

*Alternative rejected:* one clause and a per-tab column swap (`deployment` ↔ `parent_deployment`).
It reads naturally for an application's `Models` tab and wrongly for its KPI row, which is exactly
the mistake the measurement above shows.

### D3. An entity's blocks are a table, keyed by route

`ENTITY_BLOCKS: Record<EntityRoute, EntityBlock[]>` in `constants.ts`, where an `EntityBlock` names
its view, hidden tabs, and which figures read `made`:

| Route | Blocks (view → hidden tab; `made` readers) |
|---|---|
| Models, PlatformModels | LLM → `Models` |
| Toolsets, AssetsToolsets | MCP → `MCP Servers` |
| Applications, AssetsApplications | LLM → `Applications`; `made` for the `Models` tab, its donut and split plot, and the token figures · MCP → `Applications`; `made` throughout · Routes → `Owners`; shown only when `entity.routes` is non-empty |

The block's tab list is `VIEW_BREAKDOWN_TABS[view]` less the hidden one; its donut and split plot
lead with the first of what remains. This replaces the hard-wired `VIEW_BREAKDOWN_TABS[view][0]`
leading tab with a block input.

### D4. An application's spend and token figures

`commonMeasures` gains a `spendColumn` input: `deployment_price` by default, `total_price` for a
block whose totals read `own` rows of an application — those rows carry no `deployment_price` and
a `total_price` covering the tree. Tokens and cost per 1M come from a second totals request over
`made` rows (the existing totals shape, scope swapped), which also supplies the denominator for the
`Models` tab's and donut's shares. On a block without `made`, no second request is issued.

The `Tokens` card takes an optional caption; the application's LLM block passes "direct model
calls". Cost per 1M divides the `made` spend by the `made` tokens, so both rest on one basis as the
page's card does.

*Alternative rejected:* sum `deployment_price` over rows whose `execution_path` contains the
application. It would cover nested calls, but `execution_path`'s completeness is an open question to
the backend (backend requests document, question 2); the change takes it up once answered.

### D5. `UsageControls` takes the views `View by` offers

`UsageControls` gains `views`, defaulting to every view; the entity dashboard passes its entity's.
`View by` is shown whatever the count, so a one-view entity reads like the page. The option labels
come from `VIEW_LABEL_KEY` in `utils/labels.ts`, one record for every place a view is named.

### D6. The flag decision lives in `EntityAudit`; the Assets applications tab in `getAuditTabs`

`EntityAudit` renders `EntityUsageDashboard` for the `Dashboard` tab when
`featureFlags.analyticsUsageEnabled` — which the layout already builds from both flags, as
`/dashboards` reads them — and `ENTITY_BLOCKS` serves the route; the telemetry `Dashboard`
otherwise. Where the tab appears is unchanged for the five routes that have it today.
Assets applications have no Audit tab today: `getTabsForAsset` adds one under that flag, and
`getAuditTabs` gives it `Dashboard` alone — no `Activities`, which the admin audit does not record for
a Core asset, as for asset toolsets. The platform-bucket view does not pass the flags yet: its
applications are addressed by name rather than by a bucket path, and which deployment name the usage
log records for them is unconfirmed.

The 403 check reuses the page's `isAnalyticsForbidden` through a `getIsAnalyticsForbidden` server
action, asked once per tab mount; the tab draws a loader until it answers and `Page403` on a
refusal.

## Risks / Trade-offs

- [`total_price` semantics are inferred from the schema and one measurement] → Backend question 1;
  a unit test pins which column the application block sums, so a correction is one constant.
- [Asset names are built on the client] → The rule is the one asset toolsets already rely on; a unit
  test pins the encoding of a path with a space. Backend request 2 removes the heuristic.
- [An application's LLM view issues two more totals requests, over the calls it made] → Only that
  view, and only once per window; the other views issue the page's shapes.
- [`Tokens` on an application undercounts nested calls] → Stated on the card itself.

## Migration Plan

Frontend only, behind the existing flags; rollback is turning `ANALYTICS_USAGE_ENABLED` off, which
restores the telemetry dashboard on every entity at once.

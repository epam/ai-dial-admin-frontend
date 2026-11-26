## Context

See `proposal.md` for motivation and scope. Constraints from the current code:

- **No cross-entity coverage source exists.** The eval backend (`DIAL_EVAL_API_URL`) exposes two relevant
  reads: the deployment listing `GET /api/v1/deployments` (`getDeployments(type?, interface?)`, the one the
  test-suite Target picker uses for its Models / Applications / MCP tabs) and the structured-query API
  `POST /api/v1/queries/execute` over `test_suite_runs`, whose rows carry `started_at_ms`, `test_suite_id`
  and the snapshot refs `deployment_ref::id|type`, `mcp_deployment_ref::id`.
- **Ids may differ in form.** Core stores a deployment path with each segment URI-encoded
  (`encodeCorePath`; see `toStoredDeploymentId` in `EvalTrendsTab/build-suites-for-deployment-query`), while
  entity views hold it decoded. Whether the eval listing's `deploymentId` matches the form a suite saved is
  not visible from the frontend, so ids are compared in their decoded form on both sides.
- **Sibling pattern.** Test Suite Trends reads through client hooks calling server actions, builds queries
  with pure builders from `utils/structured-query/build`, parses rows in pure utils, and renders cards in
  `KpiCardFrame`. `PassRateBar` (Common) already draws the thin accessible percentage bar the design wants.

## Goals / Non-Goals

**Goals:**

- One page, one hook, and a card row whose per-source failure isolation is observable.
- All percentage and uncovered arithmetic in pure, unit-tested utils.
- A data layer the follow-up cards can extend (the second row will add its own queries beside the
  coverage one, not rewrite it).

**Non-Goals:**

- A backend aggregate for coverage. The totals-minus-covered arithmetic stays on the frontend, as agreed.
- Caching or auto-refresh. The page loads on open, like the other Evaluation views.

## Decisions

### D1. Route `/system-health`, feature folder `components/EvalSystemHealth/`

A server page (`app/[lang]/system-health/page.tsx`, `dynamic = 'force-dynamic'`) renders one client
component that owns the hook and the card row. The folder name follows `EvalTrendsTab`'s `Eval` prefix
because `SystemHealth` alone does not say which health. The page does not use `EvaluationListView`: that
is a grid list, and this is a card dashboard.

_Alternatives:_ nesting under `components/Runs/` or `components/TestSuites/` — rejected, the page belongs
to neither entity and will grow its own run-trends and distribution sections.

### D2. Totals from one deployment listing, split by `$type`

One `getDeployments()` call with no filters returns every deployment. Each entry carries a `$type`, and the
hook splits the list on it (`groupDeploymentIds`): `dial-model` → models, `dial-application` →
applications, `dial-toolset` → toolsets; any other type is left out. The total of a kind is the number of its
distinct ids. The same `GET /api/v1/deployments` backs the test-suite target picker, so "total" means
"evaluatable", which is what coverage is measured against.

Read from a live instance: the unfiltered list returned all three types, and toolsets carry their own
`$type` (`dial-toolset`), so one request suffices. An application that also exposes the MCP interface is
`dial-application` and stays an application.

_Alternatives:_

- **Three filtered requests** (`type=dial-model`, `type=dial-application`, `interface=mcp`), as first built —
  rejected: the `interface=mcp` filter also returns the applications that expose MCP, so they were counted
  as applications and again as toolsets, and three round-trips cost more than one.
- The Core `GET /v1/deployments` (`getAllDeployments`) — rejected, it is read by the conversations feature,
  not by Evaluation; the Entities/Assets list actions — rejected, they are paged, per-entity, and split
  between deprecated and current groups.

### D3. Covered evaluatees from one aggregate over `test_suite_runs`

One aggregate-mode query: `select` `deployment_ref::id`, `mcp_deployment_ref::id` and `max(started_at_ms)`,
`group_by` the two ids, `filter` `started_at_ms >= (now − 30d)` `AND` `test_suite_id IN (subquery: id of
test_suites)`. The subquery drops runs whose suite was deleted (the "active suite" rule). The hook reads the
resulting rows into one `Set` of ids — both refs together, since a suite that reaches an application through
an MCP tool covers it as much as one that calls it — and intersects it with each kind's listing, so an
undeployed evaluatee is in no count (spec: _Coverage definition_). Both sides are compared decoded
(`normalizeDeploymentId`), so the match holds whichever encoding the listing and the stored ref use. The
window start is passed into the pure builder as a parameter (`utils.md` §2: deterministic), the hook
supplies `Date.now()`.

Doing the distinct-per-evaluatee step in `group_by` rather than client-side keeps the result bounded by
the number of evaluatees, not by the number of runs.

_Alternatives:_

- **Row query, dedupe on the client** — rejected, size grows with run history.
- **Group by `test_suite_id`, then read `test_suites` for their refs** — a viable fallback (see Risks);
  it needs a second round-trip and an `IN` list sized by suite count, and reads the suite's _current_ target
  rather than the one the run actually used.
- **Per-deployment count queries** — rejected, N queries for N evaluatees.

### D4. Two sources, one shared status

The hook runs the deployment listing and the coverage query concurrently and keeps each outcome
(`loading` / `error` / `ready`) separately. A pure `buildCoverageCards(sources)` util maps them to the four
card view-models. Every card needs both sources, so the cards share one status: loading until both have
returned, error as soon as either has failed (error wins over a still-pending source). A listing call counts
as failed when `success` is false or it throws; the query call when it throws or returns `null`.

_Alternative:_ per-kind failure isolation (each kind card depending only on its own listing) — it was built
for the three-request version and dropped with it: with one listing there is nothing to isolate.

_Known cost:_ Next.js runs the server actions a page dispatches one after another, not in parallel, so the
coverage query starts only after the listing has returned. Measured on a live instance the listing took ~19 s
and the query ~9 s, so the cards appeared after ~28 s. A single server action that calls both backends
concurrently would cut that to the slower of the two; not done in this change.

### D5. Card = `KpiCardFrame` + `PassRateBar`, shared view-model

A `CoverageCard` component takes one view-model (`title`, `status`, `total`, `covered`, optional
`tooltip`) and renders inside `KpiCardFrame`. The percentage is `covered / total` through the existing
`formatPassRatePercent` (at most one decimal, so a whole number reads `95%`, not the mock's `95.0%`); the
bar is `PassRateBar` with the card title as its name. Zero total renders the empty-value glyph `—` and no
bar. `PassRateBar` colours its fill by band (green ≥ 70 %, yellow 40–69 %, red below), so low coverage reads
amber or red; those thresholds are reused as-is rather than forked, and are a one-line change in the shared
constants if product want different cut-offs for coverage.

The info control on Total Evaluatees uses the ui-kit `Tooltip` on a focusable icon button with an
`aria-label`, per `a11y.md` (keyboard parity, no hover-only affordance). Component and prop names are
confirmed against the `ai-dial-ui-kit` MCP server at implementation time, not fixed here.

_Alternative:_ a new donut/ring component as drawn in the mock — rejected by the call: the design is
moving to the thin bar used elsewhere.

### D6. Menu and route

`MenuI18nKey.SystemHealth`, `ApplicationRoute.SystemHealth = '/system-health'`, and an item
`{ key, href, badge: MenuBadge.Preview }` appended to the Evaluation group in `menu-configuration.tsx`.
Item-level `Preview` is already used by the policies items, so no menu mechanism changes. The item takes
`IconActivity` in `MENU_ITEM_ICONS` (the Sessions item uses it too; it has no filled variant, so the active
state shows the outline), and `breadcrumbConfig` gets a single-segment entry, as the other Evaluation pages
have. Like `/runs` and
`/datasets`, the page itself does no flag check — the menu hides the entry and the eval API is what fails
when it is absent, which the cards render as their error state.

### D7. i18n

A new `EvalSystemHealthI18nKey` enum in `constants/i18n.ts` with its strings in `locales/en.ts`: card
titles, the caption (`{total} total · {uncovered} uncovered`, one parameterised key), the tooltip body,
and the load-error message. The generic loading/error wording is reused from shared keys where one fits
(checked at implementation, per `components.md` §10).

### D8. Activity cards: five queries, one batched server action

The two cards need five reads of the eval query API:

| Query | Entity | Shape | Gives |
| --- | --- | --- | --- |
| total suites | `test_suites` | row, `limit 1`, `include_total` | `totalCount` |
| suites run, current | `test_suite_runs` | aggregate, group by `test_suite_id`, `started_at_ms` in the current period, `test_suite_id IN (existing suite ids)` | one row per suite run |
| suites run, previous | same | same, previous period | same |
| suites added, current | `test_suites` | row, `created_at_ms` in the current period, select `deployment_ref::id`, `mcp_deployment_ref::id`, `include_total` | `totalCount` and the targets |
| suites added, previous | `test_suites` | row, `limit 1`, previous period, `include_total` | `totalCount` |

_Suites run_ counts the rows of the group-by (distinct suites) on the client, as the coverage query does for
evaluatees; the `IN (existing suite ids)` subquery is the one coverage already uses, extracted so both share
it. _Suites added_ reads `totalCount`, the figure the test-suite list already relies on, and counts the
distinct normalised ids of the returned targets for the `across N evaluatees` caption.

All five go through one new server action, `executeStructuredQueries(queries)` next to
`executeStructuredQuery`, which runs them with `Promise.all` on the server and returns one result per query,
`null` for a query that failed. A single browser-to-server call matters because Next.js runs a page's server
actions one after another: five separate actions would queue behind the listing and the coverage query.
A failing query is therefore a `null` in the array, not a rejected action, so a card's state can depend on
its own queries only.

_Alternatives:_

- **Five `executeStructuredQuery` calls** — rejected, five queued round-trips.
- **A `count`/`count_distinct` aggregate instead of counting group rows** — `fn('count')` works on the eval
  entities, but distinct counting is unconfirmed in the DSL, and the group-by rows are a bounded list of
  suite ids; revisit if the instance grows to where that list is heavy.
- **A Route Handler instead of a server action** — rejected, the repo's pattern is server actions with route
  handlers only for downloads and streams.

### D9. Periods and the delta

`buildMonthCostWindows(now)` already returns the local-calendar month-to-date span and the matching previous
span with the day clamped (31 Mar → end of Feb), and is what the Eval Trends tab's cost card uses for the same
"vs prev. period" comparison. The activity cards reuse it rather than re-derive the rule; its name says
"cost" but it computes plain periods. The hook passes `new Date()`, the builders take the span as parameters.
Both ends are inclusive local-day boundaries, sent as `long` millisecond values.

The delta is a pure subtraction of the two counts, formatted `+N` / `-N`; zero gives no badge. The badge is
the existing `EvalMonthCostDeltaBadge`, which already carries the `vs prev. period` wording and the carets,
given an `isIncreaseGood` flag: by default it paints an increase red, right for cost, and with the flag a rise
is green and a fall red, right for more suites run or added. One badge instead of a copy keeps the two from
drifting. `KpiDeltaBadge` was not used: its `vs prev.` text names no period. The exact spans are exposed as
screen-reader text, as the cost card does; a hover tooltip with them is left out because a badge is not a
focusable trigger.

### D10. Card view-model and layout

An `ActivityCardModel` carries the `kind`, a `status`, the `value`, the `previousValue`, and per-kind extras
(`total` and `rate` for suites run, `evaluateeCount` for suites added). A pure `buildActivityCards(results,
windows)` maps the batch results to the two models; the load status type is the coverage one, reused. The
cards render in `KpiCardFrame` through one `ActivityCard` component, and the row is a sibling of the coverage
row on the same `xl:grid-cols-4` grid, so the two cards line up with the first two coverage columns and the
other two columns are free for the metrics and cost cards.

### D11. Figures follow the calendar

A `useStartOfToday` hook returns the first instant of the local day and sets a timer for the next midnight (plus
a one-second buffer, so a timer that fires early cannot land back on the same day and stall), updating the value
when it fires. Both data hooks depend on that value: the activity hook derives its two periods from it, and
both reload when it changes, so a page left open across midnight or a month boundary shows the new day instead
of the old one. Within a day nothing reloads. The value is the day's start rather than `Date.now()` so the
periods stay deterministic for a given day.

_Alternative:_ a periodic refresh (every N minutes) — rejected, it would reload the whole page's figures
repeatedly, each reload costing the ~19 s listing, to fix a case that happens once a day.

## Risks / Trade-offs

- **`include_total` on a row query and group-by row counting are untested for these entities.** The
  test-suite list relies on `totalCount`, and the coverage query already groups the runs entity. → The
  numbers are compared with the `/test-suites` and `/runs` lists in the browser verification task.
- **"Suites run" counts runs of the suites that exist now.** A suite's run in the period is counted even if the
  suite was created after it was last edited, and a deleted suite's runs drop out of both periods, so the
  previous period's figure can shrink after a deletion. → Accepted; the delta compares like with like.
- **Local time.** The month boundaries are the browser's, not the server's, so two admins in different zones
  can see a slightly different count near midnight on the 1st. → Matches the cost card's behaviour.
- **Backend support for the query was unproven from the frontend side.** Grouping by a `::` snapshot path
  and a cross-entity `IN (subquery)` had precedent only in a same-entity subquery (Trends) and row-mode
  `::` selects (runs list). → Spike result: against the dev instance the backend accepted the query as
  written and returned rows, so the primary variant ships. Not separately checked: that the subquery really
  drops runs of deleted suites (the instance returned rows either way). If it turns out not to filter, the
  _A deleted suite's runs do not cover_ scenario must be revised rather than left unmet.
- **Large installs.** The one unpaged listing is ~1.8 MB uncompressed (~130 KB over the wire) on the instance
  read. → Revisit with the backend if it grows past a few thousand entries.
- **Run-time target versus current target.** Coverage reads the snapshot ref stored on the run, so an
  evaluatee renamed or re-pathed since the run stays "uncovered" until it is run again. → Intended: the
  run evaluated the thing under its old id.
- **Mock arithmetic.** The design's sample numbers do not add up (Total Evaluatees `342` equals models +
  applications, ignoring toolsets). → The spec defines the evaluatees card as the sum of all three kinds;
  the mock numbers are illustrative.

## Open Questions

- Does product want routes (a third suite target kind) counted as evaluatees later? It would add a fourth
  listing and card; nothing in this design blocks it.

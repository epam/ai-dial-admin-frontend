## Context

See proposal.md — Why. Four facts about the two datasets shape everything below.

- **The realtime telemetry dataset answers positionally.** `getDashboardData` returns
  `{ headers: string[], data: string[][] }`, every fold resolves columns through `headers.indexOf`,
  and numbers arrive as strings. The analytics data-access service answers typed `rows` instead, so
  a fold reads a field by name and a decimal arrives as a number.
- **The usage log carries what the design asks for.** `success`, `operation_duration_ms`,
  `deployment_price`, `prompt_tokens`, `completion_tokens`, `user_hash`, `event_kind` — which is
  what makes error rate and the latency percentiles computable here and impossible on the realtime
  dataset.
- **Its query grammar is a closed catalog.** `date_bin`, `date_trunc`, `count` (with `distinct`),
  `sum`, `avg`, `if`, `equals`, `not_empty`, `percentile_cont`. There is **no comparison operator
  in expression position**, so one aggregate cannot split its own rows into two windows.
- **Token figures are not row sums.** An orchestrating application gets a row carrying the tokens
  of the model calls it made. Measured: 5.1bn of 16.7bn prompt tokens are such repeats.

## Goals / Non-Goals

**Goals:**

- A module that can be deleted in one commit, leaving the existing dashboard byte-identical.
- Every figure on the page divisible by the same window total, so two widgets never disagree about
  what a share is.
- A request count that is a property of what is on screen, not of how many widgets exist.

**Non-Goals:**

- No change to the existing dashboard, its queries or its specs.
- No new server action or API client: the page issues structured queries through `executeQuery`.
- No new charting dependency. ECharts is already in the stack.
- No shared abstraction extracted from the two implementations. Deduplicating them would couple the
  thing being replaced to its replacement.

## Decisions

### D1. The page reads the analytics data-access service, not the realtime telemetry dataset

**Reverses the original decision.** This change was first planned to stay on
`dial_analytics_realtime`, on the grounds that the usage-log table "is filled by a once-a-day sync
of the previous day, so it holds nothing for the current day", and that it "carries neither `model`
nor a normalized route". Two of those three claims are false, measured against the live service:

- **Freshness.** `max(request_time)` against `now()` on the service's own clock: 11 minutes 25
  seconds. Re-measured on a later day: the same figure. The once-a-day sync was read out of a
  configuration default, not out of the data.
- **Model.** On a row whose `event_kind` is `llm_call`, `deployment` *is* the model
  (`anthropic.claude-sonnet-4-6`, `gpt-5.6-terra-2026-07-09`); `parent_deployment` is the
  application that called it. There is no separate `model` column because none is needed.
- **Route.** This one holds. There is no `route_path` and no ADAS equivalent of the telemetry
  dataset's `routes_analytics`; `event_kind = 'route'` names the routed deployment, not the path.
  Hence the Routes view is a non-goal rather than a third view.

What the move buys: `success` and `operation_duration_ms`, and so the error-rate card, the average
latency card and the p50/p95 latency plot — all three deferred in the original plan for want of the
columns. What it costs: the ~11-minute lag, which the page does not hide (see D10).

### D2. A new page in Analytics, not a second implementation of `/dashboard`

The original plan put both implementations behind one route, chosen by a flag, so the two could be
compared against the same data and rollback would be a configuration change. That reasoning assumed
both read the same dataset and answered the same question. They do not: one reads realtime
telemetry and breaks down by deployment, project and route; this one reads the usage log and breaks
down by model, application and project, with cost and latency the old one cannot compute.

Behind one URL, a reader could see only whichever the flag selected. As its own page they sit side
by side, which is what makes the comparison possible at all. The flag stays — it gates the route
and the menu item together — but it now decides whether the new page exists, not which of two
pages `/dashboard` is.

### D3. One request per widget per window

The grammar has no comparison in expression position, so a single aggregate cannot carry both
windows. Each shape is therefore asked once per window, and the client pairs them:

| Request | Grain | Issued |
| --- | --- | --- |
| Totals | one row, no `group_by` | always, ×2 with comparison |
| Bucketed | `date_bin` at the chart resolution | always, ×2 with comparison |
| Leading dimension | `group_by` the view's first dimension | always |
| Breakdown tab | `group_by` the active tab's dimension | always, ×2 with comparison |
| Split series | `group_by` bucket × dimension | only while the split plot is showing |
| Spend periods | `date_trunc` to a calendar unit | only while the spend plot is showing |
| Heatmap week | hourly bins over one week | always, on its own window |

Eight on mount with comparison on. The two conditional shapes are the expensive ones, and neither
is asked for until the reader chooses its plot.

Distinct users is why totals is its own request rather than a sum over buckets: a user active in
several buckets is one user, and no fold over the bucketed response can know that.

### D4. One denominator for the whole page: the window total

Every share — the donut's slices, the breakdown table's bar, the split plot's legend — divides by
`totals.calls`, never by the sum of whatever rows that widget happens to hold. A ranked response is
one page of a ranking; dividing by its own sum would rescale every share as the reader pages, and
two widgets holding different pages would disagree about the same entity.

The donut's residual follows from this: `Others` is `windowTotal` minus the named slices, not the
sum of the rows that did not make the cut. That is what makes the slices add to the window.

### D5. Top-N, ordering and search are pushed into the query

The breakdown table asks for a ranked, limited, optionally filtered aggregate; it does not sort or
sift what arrived. The grid therefore offers no column sort and, on the card, no column filters:
both would only reorder or sieve one page while hiding that the rest of the dimension was never
fetched. The full-list dialog does offer them, because there the page is the whole list.

The search field is a filter on the aggregate (`Ico` on the dimension column), so a term reaches
rows the page never held. It is debounced, because the field is live and every term it reports is a
request.

### D6. Every bucketed request states its row limit

The service applies `DEFAULT_LIMIT = 100` when a query states none, and refuses anything above
`MAX_LIMIT = 1000`. A truncation at 100 is silent — the response carries no marker for it — and the
chart resolution targets up to 200 buckets, which the split plot multiplies by its series count.
Every bucketed shape therefore names the ceiling explicitly.

### D7. The folds are the module's own, over typed rows

The service answers typed rows, so a fold reads a field by its select alias. The aliases are
exported constants shared by the builders and the folds, which is what keeps the two from drifting.
Nothing is shared with the existing dashboard's positional folds.

Two measure rules live in the builders, stated where the decision is made:

- **Tokens count only on rows that reached an upstream** (`not_empty(response_upstream_uri)`),
  which is what keeps an orchestrator's row from counting its children's tokens twice. Spend needs
  no such guard: an orchestrator row carries none.
- **Percentiles ride the bucketed request alone.** They are an ordered-set aggregate — the engine
  sorts each group — so the totals and the per-dimension rows, which plot no distribution, do not
  pay for them.

### D8. `TimeFilter` gains an `appearance` prop

This is a shared component, and the repository's rule is to handle a caller's mismatch in a wrapper
rather than add a prop. A wrapper cannot do it here: the control's trigger, its dropdown surface
and its option rows are all rendered inside `TimeFilter`, and none is a slot. Reproducing the 2.0
look from outside would mean reproducing the component.

The prop defaults to the existing appearance, and every Modern class sits in a named constant
beside its Legacy pair, so the old callers are unchanged by construction. If a second caller ever
wants the 2.0 look, the prop is already the seam.

### D9. The controls are ui-kit 2.0; the page backfills the tokens it needs

The control row and the dialogs use the 2.0 generation (`Select`, `Search`, `Popup`). Those
components read a token set the themes service does not serve yet, whose built-in fallbacks are a
light palette — so a 2.0 control rendered dark-on-dark came out white. `src/scss/ui-kit-2-tokens.scss`
declares dark values for the 22 names that are otherwise undefined. It is a stopgap with its removal
condition written at the top of the file: delete it once the themes service serves the set.

### D10. Spend is read on a calendar scale of its own

Every other widget follows the page window. Spend does not: at the page's own bucket, a three-hour
window turns a month's budget into eighteen bars of pocket change, which answers nothing about
whether spending is unusual. The plot reads 14 days when the page window is a week or less, and 12
months when it is longer, with the period the window ends in picked out and the rest its history.

Those periods are UTC calendar periods, because `date_trunc` produces them, and the axis is labelled
in UTC so the label matches the bucket.

### D11. No polling, and the lag is not hidden

The data is ~11 minutes behind by construction (D1), so an interval shorter than that re-reads the
same rows. The page offers a manual `Refresh` that re-takes the window and re-issues every request,
and the control stays disabled while any of them is in flight.

### D12. Module layout

```
Analytics/Usage/
  UsageDashboard.tsx          page root: view, compare, tabs, window snapshot
  use-usage-dashboard-data.ts every request except the heatmap's
  use-heatmap-week.ts         the heatmap's own week and request
  queries.ts                  structured-query builders and the select aliases
  Controls/ Kpi/ Charts/ Breakdown/ Card/ Delta/ Empty/
  utils/                      folds, windows, buckets, stack, spend-periods, donut, heatmap, format
```

## Risks / Trade-offs

- **The ~11-minute lag is visible.** A window ending now always has an empty tail. Mitigated by
  padding the bucket grid across the whole window (so the tail reads as "no rows yet" rather than
  as a short window) and by not pretending to poll.
- **Price coverage is partial.** `deployment_price` is null for some deployments, and null for
  every `mcp` row — measured: 76k MCP rows over a week, not one priced. Hence no spend card and no
  spend plot in the MCP view, rather than a flat zero line.
- **The 1000-row ceiling is a real bound.** The split plot at 200 buckets × 5 series sits exactly
  on it. Adding a sixth series or a finer resolution would truncate; the constant carries that
  arithmetic in its comment.
- **The 2.0 token file is a stopgap** that will drift if the themes service adds the names with
  different values. Its removal condition is written down; nothing else depends on it.
- **Two dashboards coexist**, which is a cost in navigation and in explanation until one is
  retired. Accepted deliberately: see D2.

## Migration Plan

1. Ship with `ANALYTICS_USAGE_ENABLED` off. Nothing changes for anyone.
2. Turn it on in a non-production deployment; both pages are reachable and can be read against the
   same traffic.
3. Turn it on in production. The Dashboard route is unaffected throughout.
4. Retiring `/dashboard`, if it is retired, is a later change with its own proposal.

Rollback is the flag.

## Open Questions

- **Routes.** Answering "which route path, how often" needs `route_path` in the usage log, or an
  ADAS entity equivalent to `routes_analytics`. Until then the question belongs to the old
  dashboard. Raised with the ADAS side; not blocking.
- **Auto-refresh.** Worth revisiting only if the ingestion lag drops; at ~11 minutes an interval
  buys nothing. If it is added, 5 minutes is the floor, paused on a hidden tab.

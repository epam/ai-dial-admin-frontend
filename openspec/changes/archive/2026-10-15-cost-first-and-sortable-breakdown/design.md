## Context

See proposal.md — Why. The share chart's measure lives in `UsageBlock` (`donutMetric`, reset to
`Calls` on a view change); the heatmap keeps its own `metric` state, opening on `Calls`. Both list
`Calls` before `Cost`. The breakdown card is titled `Breakdown` and holds `BREAKDOWN_PAGE_SIZE` rows.
The full-list dialog is an AG Grid infinite model fed by `useBreakdownDialogRows`, whose datasource
asks `buildTabQuery` for each block ordered by `calls` descending, then by the tab's columns; every
column is `sortable: false` (`BREAKDOWN_COLUMN_BASE`).

The analytics service orders an aggregate by any select alias, in either direction; measured on dev,
an error-rate alias computed as `failed / calls` in the select sorts as expected.

## Goals / Non-Goals

**Goals:**

- Cost leads wherever it is offered, and only there.
- The dialog's order is the backend's, whatever column the reader picks.

**Non-Goals:**

- No sort on the card, no sort by change against the previous window.

## Decisions

### D1. A view's default measure is a function of the view

`getDefaultDonutMetric(view, isCostOffered)` returns `Cost` where the share chart offers cost and
`Calls` elsewhere; `UsageBlock` seeds `donutMetric` from it and resets to it on a view change, where
it now resets to `Calls`. The heatmap seeds its `metric` the same way from its `isCostOffered`. The
option lists put `Cost` first. The first load issues the same requests as before; the share chart's
ranking is ordered by spend instead of calls.

### D2. The top-N label carries the cut it states

`BreakdownTable` titles the card with a new key, `Breakdown · Top {count}`, filled from the `rowLimit`
it already receives — the same number the card's request is limited by, so the label cannot drift
from the rows.

### D3. The dialog hands AG Grid's sort model to the tab request

The dialog's column definitions turn `sortable` on; the card's keep it off. AG Grid's infinite model
already passes `sortModel` to `getRows` and re-reads from the first block when it changes, so the
datasource maps the first sort entry to a sort key and direction and passes them to `buildTabQuery`
through `TabQueryShape` (`orderBy`, plus a new `orderDir`). The columns map to keys as follows:

| Column | Sort key |
| --- | --- |
| dimension | the tab's own column (its qualifiers lead, as in the ranking) |
| share, calls | `calls` |
| errors | a new `error_rate` alias: `failed` divided by `calls` |
| avg latency | `avg_latency` |
| cost | `spend` |

The tab's columns stay as the last keys, so a block is still a stable slice. The previous-window
request is unchanged: it asks for a block's rows by name, not by position.

`error_rate` is added to the tab request's select only, where it is sorted on; the folds keep
computing the displayed rate from `failed` and `calls`, so the two cannot disagree.

*Alternative rejected:* sort the dialog's rows on the client. They arrive in blocks of 25, so a
client sort orders the rows in hand and leaves the unread tail in calls order.

### D4. The card keeps its non-sort, and says nothing it cannot do

The card's calls column keeps announcing no sort state (`aria-sort` only where a reader can change
it); the dialog's sorted column announces its direction through AG Grid's own header.

The dialog opens on cost, descending, where the cost column exists, and on calls otherwise. The opening
order is an `initialSort`, not a `sort`: AG Grid re-applies `sort` whenever the column definitions
change, which put the opening column back beside the reader's choice as a second sort key. Multi-sort
is off (`suppressMultiSort`), because the backend ranks on one key.

## Risks / Trade-offs

- [Error rate sorted descending puts one-call entries with one failure on top] → The order is
  correct; ties fall back to calls, so the busiest of the 100% failures come first.
- [The default reading changes for everyone] → Stated as breaking in the proposal; a reader who wants
  calls is one click away.

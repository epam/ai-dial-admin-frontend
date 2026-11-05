## Context

See proposal.md for the motivation. The service contract this design is built on:

- `GET /v1/data-sync/failures` lists outstanding failures (`pending` or `parked`), newest first, filtered by
  `state`, `kind`, `reason`, `from`, `to`, `backfill_run_id` and `limit` (1–1000). It answers `failures[]`,
  `truncated`, `total` (matches under every filter, regardless of `limit`), `by_state { pending, parked }`
  (matches under every filter except `state`) and `retry_sweep { enabled, next_sweep_at?, max_per_sweep }`.
  There is no cursor. It needs `REGISTRY_READ`.
- `POST /v1/data-sync/failures/retry` writes a `requeued` event for every outstanding failure the body selects.
  The body takes the same filters plus `subjects` and `targets: [{ kind, subject }]` (up to 1000 pairs, kinds
  may be mixed). Members are ANDed, an empty body is refused, and the answer is `{ requeued, retry_sweep }`.
  It needs `DATA_SYNC_OPERATE`. Retrying is asynchronous: a requeued failure is `pending` until the next pass,
  and with the pass switched off it waits there.
- The number a retry will reach is the `total` of a `GET` with the same filters. `requeued` can be smaller,
  because failures resolve in between.
- A failure's subject is a blob key or an ISO day. A `records` failure's subject is its blob's key, so the same key
  can name two failures, and only `kind` tells them apart.
- Each failure carries `backfill_run_ids`, the runs it failed on since it was last resolved, absent when none.
- `failedBlobs` on a backfill run is an in-memory counter that only grows. The listing omits resolved failures.

The pipeline failures card (`components/Analytics/Pipelines/Failures/`) already presents a failure queue: a
summary with two tiles, a grid with in-place detail rows, a bulk-retry dialog, an outcome status line and a
failed-read state. The Tables page already hosts the backfill drawer on the shared `Common/Drawer`.

## Goals / Non-Goals

**Goals:**

- The drawer and the pipeline card read as one family: the same summary header, the same two-tile rule, the same
  detail region, dialog shell, outcome line and failed-read state.
- Every retry request names the kind of what it queues, so a blob and its skipped records are never queued
  together by accident.
- Every figure is the service's count, not the length of a returned page.

**Non-Goals:**

- No change to how the pipeline card reads, pages or filters its data.
- No client-side paging across the 1000-entry limit: rows beyond it are counted and reachable by group retry,
  not listed.

## Decisions

### 1. Shared presentational blocks under `components/Analytics/Common/Failures/`

Extract from the pipeline card the pieces that carry no DLQ knowledge:

| Block | Owns | Props it needs |
|---|---|---|
| `FailuresSummaryHeader` | total, "Last failure {age}" | `total`, `newestAt`, `now` |
| `FailuresTiles` | two tiles: left = needs your action (count, hint, optional Retry all); right = no action needed (count, hint) | worded labels and hints, counts, `onRetryAll?`, `isBusy` |
| `FailureDetailMessage` | full message, copy control, one-line-per-part, "no message recorded" | `lines`, `copyValue` |
| `RetryConfirmPopup` | the `ConfirmationPopup` (Info) shell with a title, a count line and caveat paragraphs | `title`, `countText`, `caveats[]`, `onConfirm`, `onClose` |
| `FailuresRunFilter` | the dismissible "Run {id}" indicator | `runId`, `onClear` |
| `FailuresOutcomeStatus` | `role="status"` `aria-live="polite"` line, visible only once set | `message?` |
| `FailuresReadFailed` | in-place "could not be read" statement with Read again | `message`, `onRetry` |

The pipeline card keeps all its data logic (`use-pipeline-failures`, `use-requeue-failures`, paging, path and run
filters) and only swaps its JSX for these blocks. `RequeueFailuresPopup` becomes a thin wrapper that builds its
caveats (paused pipeline, ordinary queue, active filters) and renders `RetryConfirmPopup`. The pipeline card's run
filter indicator moves onto `FailuresRunFilter`.

*Alternative considered:* one generic `FailuresCard<T>` parameterized by an adapter. Rejected: the two sources
differ in paging, filters and what "retryable" means, so the adapter would become a second copy of each caller's
logic. Shared leaves keep each caller's data logic where it is.

*Alternative considered:* leave the pipeline card alone and copy its markup. Rejected by the user: two copies
drift, which is the failure the unification is meant to prevent.

The tile rule is "left = needs your action, right = no action needed". The pipeline card already fits it
(retryable with Retry all | not retryable), so its wording stays unchanged.

### 2. Two row reads, one per state; counts come from the service

The drawer reads `state=parked` and `state=pending` in parallel, each with `limit=1000` and the run filter when
narrowed. Summary figures come from `by_state`, which is the same on both answers; the drawer takes it from the
parked read. "Shown N of M" compares the parked rows received with `by_state.parked`. `retry_sweep` comes from
the same answer. The toolbar count reads `state=parked&limit=1` and uses `total`.

*Alternative considered:* one read of both states. Rejected: newest-first across both states lets a burst of
transient failures push every parked one past the limit, and the parked ones are what the operator acts on.

### 3. Grouping is client-side, by `(reason, kind)`; three retry shapes

Groups are derived from the parked read in a pure util (`groupIngestFailures`) under
`components/Analytics/Tables/IngestFailures/`. The group key is `reason` and `kind` together, because
`rejected_by_server` occurs on both `blob` and `records`, and a group retry is a filter that names one kind. The
three request bodies:

| Retry | Body |
|---|---|
| Row | `{ targets: [{ kind, subject }] }` |
| Selected | `{ targets: [...] }`, one pair per selected row, kinds mixed |
| Group | `{ state: 'parked', reason, kind, backfill_run_id? }` |

A row and a selection both send `targets`, so one code path covers them, and `subjects` is not used. The
selection holds pairs keyed by `kind` + `subject`, never by subject alone. At most 1000 rows are shown, so a
selection never exceeds the 1000-pair limit.

### 3a. Exact count in the group dialog

When a group's dialog opens, the drawer sends the group's filters as a `GET` with `limit=1` and states `total`.
Confirm stays disabled until the count arrives. If the count read fails, the dialog states the reach in words
("every parked failure with this reason and kind") and stays confirmable. The outcome always states `requeued`.

*Alternative considered:* the group's shown row count. Rejected: it undercounts past 1000 rows, and the service
now answers the exact number.

### 3b. Selection

Selection lives in the drawer state as a `Map` keyed by `` `${kind}:${subject}` ``. A checkbox column on the
failure rows and a tri-state checkbox in each group header use the ui-kit checkbox, as `FailuresGrid` does. A
selection bar (`N selected`, Clear selection, Retry selected) sits above the grid while the selection is not
empty. Retry selected opens `RetryConfirmPopup` with the selection's size as its count. Every read clears the selection, so it can never name a failure the drawer no longer shows.

### 4. The list is one `AgGridWrapper` with full-width rows

The pipeline `FailuresGrid` already renders detail regions as full-width rows. The drawer uses the same grid with
three row types: a group header (full-width: group checkbox, reason, description, kind, count, Retry all,
deterministic caveat), a failure row (checkbox, subject, day, age, Retry), and a detail (full-width:
`FailureDetailMessage` plus labelled values, including `backfill_run_ids`). Clicks on the checkbox and Retry cells
stop before the row toggle.
The automatic-retry line and its rows sit below the grid as a second, collapsed grid of the same shape without
group headers or retry cells.

*Alternative considered:* a hand-built list. Rejected: the repo renders tabular collections through
`AgGridWrapper`, and the full-width-row toggle already has a solved double-click trap (see the pipelines spec, "A
dead letter's detail is opened in place").

### 5. Service wiring follows the backfill actions

Two methods go on `analytics-data-api.ts` (`listIngestFailures(filters, token)`, `retryIngestFailures(body, token)`), with two server actions in
`app/[lang]/tables/actions.ts` next to `listTableBackfillRuns`. A `404` on the list is treated as "this service
does not serve it" — the same shape as `isNoRunner` in the pipeline hook — and hides the toolbar entry. Models go in
`models/analytics/ingest-failure.ts`, with enums for kind, state, reason and path.

### 6. Outcome wording is "queued", never "fixed"

The status line is composed from the retry answer:

- `requeued = 0` → `Nothing was left to queue`.
- otherwise `Queued {requeued} for retry`, followed by one of:
  - `retry_sweep.enabled = false` → `Nothing runs until automatic retry is switched on`;
  - `requeued > max_per_sweep` → `This takes several passes, the next {time}`, or `This takes several passes` when the answer names no next pass;
  - else → `Next pass {time}` from `next_sweep_at`.

A switched-off pass is also stated as a warning above the groups while `retry_sweep.enabled` is false, and the
Retrying automatically tile's hint switches to "waiting". After any retry, success or not, both reads run again,
and the toolbar count refreshes when the drawer closes.

### 7. Failed blobs links into the drawer, narrowed by run

`TableBackfillRunView` adds a `BackfillMetric` for `failedBlobs` with an error tone above zero and an info hint.
`BackfillMetric.value` is a `ReactNode`, so the link is a ui-kit link button passed as the value and
`BackfillRunFacts` is used as-is. The link shows above zero and only while the listing is available; the
availability flag comes from the same hook that drives the toolbar button. Activating it closes the backfill
drawer and opens the ingest failures drawer with `backfillRunId`, which every read and the group retry carry as
`backfill_run_id`. `targets` retries need no run filter, because the pairs already name the failures.
`FailuresRunFilter` states the narrowing, and clearing it re-reads without the filter.

The link is narrowed by run id, not by dates: a blob's day is its last-modified date and can fall after the run's
last day, and a date range would also admit other paths' failures.

## Risks / Trade-offs

- [The retry pass is switched off: queued failures wait indefinitely] → Stated as a warning in the drawer and in
  every outcome message, from `retry_sweep.enabled`.
- [`requeued` is smaller than the dialog's count, because failures resolved in between] → The outcome states
  `requeued`, never the dialog's number.
- [Groups are derived from at most 1000 parked rows, so a group past the limit is shown partly] → "Shown N of M"
  is stated, and the group dialog's count is read from the service, so Retry all still reaches every match.
- [A run's link survives a manual retry but drops when the failure resolves] → The narrowed drawer lists only
  outstanding failures. Failed blobs keeps counting what the run met, so the figure can exceed what the link
  shows. The info hint states that ingested blobs drop out.
- [Refactoring the pipeline card can change what its tests see] → Its existing specs are the regression gate and
  must pass without editing their assertions. Only imports and mocks may move.
- [The toolbar read on every Tables page load adds one request] → One `limit=1` read for full admins only. It is
  skipped for everyone else.
- [A full admin without `DATA_SYNC_OPERATE` in the service's role mapping gets 403 on retry] → Reported with the
  service's message, the same path as a refused backfill start.

## Migration Plan

No data migration. The entry point appears only against a service that serves the listing, so the console can
ship before or after the service release. Rollback is a revert.

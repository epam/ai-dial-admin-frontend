## Context

See `proposal.md` — Why. What shapes the approach:

- **The runner's DLQ listing is paged and counted.** `GET /v1/dlq` takes `pipeline_name`, `run_id`,
  `lane`, `limit` (1..1000, default 100) and an opaque `cursor`, and answers
  `{items, next_cursor, has_more, total, requeueable_total}`. The two counters describe everything the
  **filter** matches, not the page, and the service reads them in the page's own repeatable-read
  snapshot — so a page can never disagree with its own total. That is what lets the card state a
  pipeline's failures without holding them.
- **`requeueable` cannot be improved on.** The mapper sets it from one fact: a payload was archived.
  `DlqRequeueService.foldEra` refuses a second class of item at requeue time — one whose payload
  predates the evaluator fold — and decides that on the payload, which is not served. The
  `pipeline_generation` column is not a stand-in: migration `V9` renamed `evaluator_version` into it
  and deliberately rewrote no rows, so a pre-fold item carries an ordinary-looking revision there. The
  backend's own `anArchivePredatingTheFoldIsRefusedRatherThanReRun` pins the divergence.
- **`error` is nullable and omitted when null.** The column has no `NOT NULL`, the runner's mapper is
  built with `JsonInclude.Include.NON_NULL`, and two catch-all arms pass `getMessage()` through, which
  is null for an `Objects.requireNonNull` NPE or a bare `TimeoutException`.
- **The bulk requeue ignores the UI.** `POST /v1/dlq/requeue` selects by `pipeline_name` and `run_id`
  only. The path, the search and the page the operator is looking at are not expressible.
- **`lane=live` with a `run_id` is a 400**, by design: the runner refuses the combination rather than
  answering an empty list, because on a failure listing an empty answer reads as "nothing failed".
- **Only a model-calling enrichment dead-letters.** A SQL enrichment and an aggregate are all-or-nothing
  — the statement either applies to the batch or fails it — so their failure is the run's, which the
  registry already reports as `last_error`.
- **The runtime surface already exists.** `AnalyticsRunnerApi`, the `isConfigured` guard, the four
  server actions, `usePausedPipelines`, the pause banner and the Runtime tab all landed in the
  preceding change. This one extends them rather than introducing a second way to reach the runner.

## Goals / Non-Goals

**Goals:**

- Everything about a pipeline's failures on the page where its pause already is, in one card, with at
  most one overlay layer in play at any moment.
- State only what a service answered. Nothing on this card is counted from the rows on screen or
  predicted from a field that cannot carry the answer.
- Degrade the way the rest of the runtime surface degrades: no host, no rights, no feature flag, or no
  answer → nothing presented, nothing logged as an error.

**Non-Goals:**

- A second presentation of the same data (side sheet, dedicated tab, listing column).
- Reading failures on the listing page. The runner has no cross-pipeline endpoint, and asking per row
  would be one request per pipeline.
- Presenting the dead letter's stored payload or the model's raw response. The ops API omits both.

## Decisions

### The card is a feature folder, not a Common component

New folder `components/Analytics/Pipelines/Failures/` holding `PipelineFailuresCard.tsx` (the card and
its summary), `FailuresGrid.tsx` (the grid and its paging), `FailuresFilterBar.tsx`,
`FailureRowDetail.tsx`, `RequeueFailuresPopup.tsx`, `use-pipeline-failures.ts` (the reads),
`use-requeue-failures.ts` (the three re-runs) and `failures.ts` (the derivations). It is domain-bound —
it knows pipeline kinds, runner stages and the requeue semantics — so it belongs under the feature, per
`components.md` §4. Nothing here is lifted into `Common/`.

### Two reads, two jobs

`usePipelineFailures(name, isAsked)` issues a **summary** read — the whole pipeline, `limit=1` — whose
counters are what the card and the tab state, and a **listing** read page by page under whatever the
reader narrowed to. Keeping them apart is what lets a path choice change the rows without moving the
headline above them; re-reading both on every reload is what stops the headline going stale.

`isAsked` is composed by the caller out of the rights, the feature flag and whether this kind of
pipeline dead-letters at all, so the hook has one condition rather than three and the frame is the one
place that knows when a read is pointless.

*Alternative considered:* one read serving both. Rejected: it makes the summary describe the filter, so
narrowing to the live path would announce ten failures for a pipeline holding sixty.

### Retryability is reported, never predicted

`isRetryable` is `item.requeueable` and nothing else. The console cannot know which payloads the service
will refuse, so it offers the re-run and reports the answer: a 422 for a single item, and for a bulk one
the gap between the count it asked for — the service's own `requeueable_total` — and the `requeued` it
answers with.

*Alternative considered:* `requeueable && pipeline_generation !== 0`, which was implemented and is
wrong. It catches only the rarer producer and marks the common one retryable; the deeper fix is for the
mapper to apply `foldEra`, which is filed under Open Questions.

### Paging is keyset, and a filter change starts a new walk

The grid asks for `DLQ_PAGE_SIZE` rows and appends the next page when the container scrolls to within a
screenful of its end. The cursor means "older than this item" in whatever set is being read and is not
bound to the filters, so changing the path or the run restarts from the newest item rather than
continuing into a set the reader never saw.

The grid uses `domLayout: 'autoHeight'` inside a `max-h` scroller: a short listing is then a short grid
rather than three rows floating in six hundred pixels, and the scroller is the element the paging
listens to. The cost is that ag-grid renders every loaded row; the page size is what bounds it.

### The chevron toggles from its own button, and that cell only

ag-grid listens for a click on the row element itself, below the point where React's root handler runs,
so a `stopPropagation` in a cell's button never reaches it. Both the chevron and the retry cells are
therefore excluded from `onCellClicked`, and each carries its own handler. Implemented the other way
round first, the chevron toggled twice and cancelled itself out — the detail never opened.

### The detail is presentation; the grid measures it

A full-width ag-grid row has no automatic height, so the grid wraps the detail in a div it owns and a
`ResizeObserver` reports what it came out as. The observer rather than a measurement on every render:
it fires only when the box really changes and does so off the render path, so nothing forces a
synchronous layout to find out. `FailureRowDetail` takes no grid types at all.

### Both bulk retries confirm in a dialog

`ConfirmationPopup` from the kit, the control the page already uses for the pause and the delete. One
`RequeueFailuresPopup` serves both the pipeline-wide and the run-scoped retry, taking the count, the
filters in force — the path and the run as much as the search — the run where there is one, and whether
the pipeline is paused. A dialog rather than something inline because the thing that has to be said does
not fit a tile: the retry reaches items no page on screen is showing, and "we are about to re-run more
than you are looking at, here is what" is three sentences.

### The run-scoped count comes from the service

Opening a backfill row's detail reads that run's `requeueable_total`. One number then feeds the button
label and the confirmation, which cannot disagree. Counted from the loaded rows the two were computed
from different windows and quoted different figures for one click.

### An unconfigured runner is marked, not merely false

Every runner action answers `{success: false, errorHeader: RUNNER_NOT_CONFIGURED}` when no host is set.
The presenter needs the distinction: an absent service means the card is simply not there, where a
refusal means it says so and offers to try again. Bare `success: false` made every enrich pipeline show
a red error with a retry that could never succeed.

### The tab carries a mark, and the count in text beside it

The kit's `TabItem.count` is drawn in the accent and has no hook to re-colour — its span carries only
utility classes, so tinting it would mean a positional selector into the kit's markup. A fault wants
red, so the tab takes a red `icon` instead. The kit wraps that icon in an `aria-hidden` span, which
makes it decorative whatever is put on it, so the number is stated in an `sr-only` status beside the
strip. Both halves are needed: the mark for the eye, the text for everything else.

### Stage is a column, not a filter and not a chart

The runner reports `stage` as its own column over a closed set of seven values — it is not parsed out of
the message — so each row states where it failed, and that is the only place it is stated. No breakdown
bar above the card, no chips inside it: both are a second reading of what the rows already say, and a
chip row is a third filter to reason about beside the path and the search.

`DLQ_STAGE_COLOR` in `constants/analytics/pipeline-dlq.ts` gives each stage one Tailwind background
token for the dot in that column — its own file, with no ui-kit import, because the server-side client
reads the page size from the same module and `constants/analytics/pipelines.ts` pulls in `MenuItemMark`.

### The redesign of the existing cards is layout only

Schedule, State and Failures-and-notices keep their names, their members and their order. They become
rimless cards on the raised layer, stacked full width. "State" is **not** renamed to "Progress": the
design artifact predates the decision recorded in the spec, which argues the point explicitly. The
re-read control keeps its label for the same reason.

## Risks / Trade-offs

- **A bulk retry reaches items the operator cannot see.** The request names the pipeline; the service
  re-runs every matching item, including ones on pages never loaded and ones the filters hide. → The
  dialog states the count it is sending, names the filters it is ignoring, and never implies the rows on
  screen; the result message states what the service actually re-ran.
- **A requeue into a paused pipeline looks like it did nothing.** → Both confirmations and the result
  message carry the paused caveat.
- **A large run-scoped retry throttles the pipeline's live scan** — requeued items count toward the
  pipeline's in-flight backpressure, as `DlqRequeueService` documents. → The run confirmation says the
  items go back on the ordinary queue rather than as a continuation of the replay.
- **`autoHeight` renders every loaded row.** A reader who pages to a thousand rows has a thousand rows in
  the DOM. → The page size bounds the growth and the reader has to ask for each page; a pipeline that
  deep in dead letters has a problem the DOM is not the worst part of.
- **The tab badge costs one read on mount.** It is the smallest page the service will serve, and it is
  not issued at all when the runner is unconfigured, the caller is not a full admin, analytics is off, or
  the pipeline is of a kind that cannot dead-letter.

## Migration Plan

None. Additive on the console side: no schema change, no new environment variable, no change to any
existing request. It does require the runner build that serves the paged listing; against an older one
the counters are absent and the card would state zero.

## Open Questions

- **Backend ask: apply `foldEra` in `DlqItemMapper`.** The mapper already derives `requeueable` from the
  payload and has the payload in hand; applying the same rule the requeue path applies would make the
  flag mean "can be re-run" and let the console stop reporting refusals after the fact.
- **Backend ask: expose `task_name` on `DlqItemDto`** (`enrich-chunk` → Chunk, `upsert-rows` → Write,
  `enrich-group` → Group, absent → Row). With it, Scope is exact and works on group pipelines too.
- **The DLQ retention window is not served.** It is 30 days by default, in `DlqProperties`, and the API
  exposes no value — so the card cannot say "older failures have expired". Left unsaid rather than
  hardcoded.

## Why

An operator who finds a pipeline misbehaving can read what it has done but cannot stop it. The console
presents `state` as four values in the header and three alerts above the tab strip, which was enough while
reading was all there was to do; the runner has since grown an ops API — `pause`, `resume` and a listing of
what is paused — and nothing in the console reaches it. Stopping a pipeline today means disabling it, which
re-declares the document, bumps `generation`, and on an aggregate pipeline is refused outright while it
runs.

Pausing and disabling are different acts. Disabling changes the declaration; pausing suspends the runner's
enqueue and leaves the document untouched, so the pipeline stays `enabled` while it is stopped. Presenting
the second as the first is what makes an operator reach for a re-declaration during an incident.

The runtime facts have also outgrown their row. Four values fit beside `generation`; the cursor pair, the
materialized-through pair and the drained-at probe do not, and they are what distinguishes a stalled
pipeline from a slow one.

## What Changes

- A third tab, **Runtime**, on the pipeline detail page, between `Properties` and `Audit`. It presents the
  server-owned `state` in three sections — schedule, progress, failures and notices — and states that the
  values were read at the moment they were asked for, with the age of that read and a control to read
  again.
- The measured runtime values — last run, next run, lag, backlog — **move** out of the read-only facts row
  into the Runtime tab, and `drained_at` goes with them. The facts row keeps what the declaration derives:
  grain key, version column, generation, created, updated. `drained_at` moves to the tab's progress
  section rather than its schedule section, because it advances only on an empty probe: beside
  `updated_at` it read as the pipeline's last sign of life, which is the one thing it does not report.
- The three runtime alerts — last failure, clamp, required rebuild — **stay** above the tab strip, where
  they are visible from any tab, and the Runtime tab restates the same three conditions as dated facts: the
  failure gains the run time that places it. The alert is the signal; the tab is the record. Moving them
  into the tab was considered and rejected — they were lifted out of the facts row precisely because a
  reader missed them there, and one tab away is further, not nearer.
- **Pause** and **Resume**, against a new upstream: the analytics enrichment runner, a service the console
  has not talked to before. A paused pipeline is stated as paused wherever its status is stated, and a
  banner above the tab strip carries the pause on every tab with a `Resume` beside it.
- A third runtime state the registry cannot show: **nothing is running this pipeline**. The runner takes
  on an `enrich` pipeline only when it is enabled and it can execute that declaration, and it schedules
  work from exactly that set — so an enrichment pipeline missing from it is driving nothing while the
  registry presents it as healthy. Today that is discoverable only from the runner's log. This applies
  to `enrich` alone: `aggregate` pipelines are run by the registry service itself, so the runner knows
  nothing about them, and nothing runtime-related is stated for them at all.
- The console distinguishes the two origins the runner reports. An **operator** pause never expires; a
  **breaker** pause — the runner's own dead-letter circuit breaker — lifts itself, and the banner says
  when.
- The pipelines listing gains a **runtime** column, filled from one listing request for the whole page
  rather than a request per row.
- Every runtime affordance — the tab, the chip, the banner, the buttons, the column — is withheld in full
  from a caller who is not a full admin. The runner authorizes `FULL_ADMIN` on reads as well as writes and
  offers no consumer-facing read, so there is nothing to present read-only.

- The pipeline pages move to the **2.0 design system**: buttons, tabs, inputs, checkboxes, radio groups,
  the empty state and the confirmations. Two 1.0 controls have no 2.0 twin — `DialSelectField` becomes a
  thin `Common/SelectField` over the 2.0 `Select`, and the shared change bar and JSON toggle gain an
  opt-in flag rather than a copy, so every other entity page is untouched. A mixed screen was the
  trigger: the runtime controls arrived on 2.0 beside 1.0 fields.
- The listing's **inputs** cell stops showing an em dash for an enrichment pipeline that declares no
  source. It follows its target's parent — an em dash said it had none.

Non-goals, each its own later change: the dead-letter queue (`Failed rows`), the groups tab, a pipeline's
own backfill runs, and the ingest-level `Backfill data` on the tables page. The runner serves all four
today; none is in this change.

## Capabilities

### New Capabilities

None. The behaviour belongs to the existing pipelines capability.

### Modified Capabilities

- `analytics/pipelines`: the tab strip grows a third tab and the requirement naming exactly two is
  rewritten; runtime state moves from the facts row and the alert strip into that tab; pausing and resuming
  a pipeline is new behaviour, as is the runtime chip, the pause banner and the listing's runtime column;
  the runner is a second analytics upstream with its own permission rule.

## Impact

- **New upstream.** `DIAL_ANALYTICS_RUNNER_API_URL`, a commented entry in `.env.template`, and an
  `AnalyticsRunnerApi` beside `analyticsDataApi` in `src/app/api/api.ts`. The runner's error envelope is
  byte-for-byte the one ADAS serves, so `BaseApi.parseErrorBody` is inherited rather than overridden.
- **Detail frame.** `PipelineDetailFrame` gains a tab and a banner; `PipelineReadOnlyFacts` loses four
  values; `PipelineRuntimeAlerts` stays where it is, unchanged.
- **Listing.** `PipelinesView` gains one column and one page-level request.
- **Server actions.** Three added to `app/[lang]/pipelines/actions.ts`.
- **Deployment.** An installation that does not configure the runner URL keeps every existing behaviour and
  presents no runtime affordance, rather than failing a read.
- **Not affected.** The pipeline document, the save path, the JSON editor, and the enable/disable control
  are untouched: a pause is not a declaration change and is never sent with one.

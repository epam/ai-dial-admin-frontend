## Why

When an enrichment pipeline's work fails non-retryably, the runner dead-letters the item and the console
says nothing about it. The operator learns there is a problem only from the breaker pause — which fires
at a threshold, long after the first failure — and even then the console can state that the pipeline is
paused but not what failed, how often, at which stage, or whether anything can be re-run. The runner has
served a full ops API over its dead-letter queue since before the Runtime tab existed; nothing reads it.

The Runtime tab is already where an operator goes to ask what a pipeline is doing right now, and it
already carries the pause control that a dead-letter burst triggers. Failures belong on the same screen
as the pause they caused.

## What Changes

- The Runtime tab gains a **Failures card** reading the runner's dead-letter queue for the pipeline.
  Collapsed it is a summary — total, time of the newest failure, and the retryable / not-retryable
  split with a bulk retry, all from the service's own counters. Expanded it opens a failures grid
  inside the same card, paged by cursor and extended on scroll, with a path filter, a search, per-row
  retry, and an expandable row detail.
- The card is presented for a **model-calling enrichment only**. A SQL enrichment and an aggregate are
  all-or-nothing — the statement either applies to the whole batch or fails it — so their failure is
  the run's, which the tab already reports as `last_error`. A per-row queue of them would list either
  nothing or everything.
- The **Runtime tab carries a red error mark** when there are failures, with the count stated in text
  beside the strip, so a reader on Properties sees that there is something to act on without opening
  the tab.
- The **pause banner starts stating the breaker's reason**. The runner has always sent it and the console
  has always dropped it: a breaker pause says which fraction of the recent work was dead-lettered, which
  is the sentence that connects the pause to the card below it. An operator pause records a fixed string
  saying only that an operator paused it, so that one stays unstated.
- Three new server actions over the runner's DLQ endpoints (list one page, requeue one, requeue in
  bulk), guarded the way the existing runner actions are: an installation with no runner host is
  answered without a request, and that answer is now **marked** so a caller can tell "there is no
  service" from "the service refused" — the first presents nothing, the second says so.
- The tab's **existing groups become cards**, stacked and rimless, replacing the rules that separated
  them. Rules under a control bar read as one undifferentiated column; the Failures card below them is
  a card, and two presentation idioms on one tab read as two unrelated screens.
- The tab's **failures group keeps its own place** for the registry's run-level `last_error`. With the
  card scoped to model-calling enrichments the two can no longer be confused: the kinds that
  dead-letter and the kinds that report a run-level failure are disjoint, structurally rather than by
  assumption.

## Capabilities

### New Capabilities

<!-- None: this extends the existing pipelines capability. -->

### Modified Capabilities

- `analytics/pipelines`: the Runtime tab presents the runner's dead-lettered failures and offers to
  re-run them; the tab's own groups are presented as cards; the failures group is subsumed by the
  failures card; the tab strip states the failure count; runtime control reaches a third set of runner
  endpoints.

## Impact

- **Code**: `components/Analytics/Pipelines/PipelineRuntime.tsx` (card layout, new card),
  `Common/PipelineDetailFrame.tsx` (tab count), a new `Failures/` folder under
  `components/Analytics/Pipelines/`, `server/analytics/analytics-runner-api.ts`,
  `app/[lang]/pipelines/actions.ts`, `models/analytics/pipeline-dlq.ts`,
  `Common/PipelinePauseBanner.tsx`, `constants/analytics/pipelines.ts`, `constants/i18n.ts`,
  `locales/en.ts`.
- **Upstreams**: the enrichment runner's `/v1/dlq` endpoints, in the keyset-paged form its
  `feat/paginate-dlq-listing` change introduced — every page carries `next_cursor`, `has_more`, `total`
  and `requeueable_total`. No ADAS change, no new environment variable: the runner host already
  configured for pause/resume serves these too.
- **Rights**: full admin only, as the rest of the runner surface is; the runner authorizes its reads the
  same way it authorizes its writes.
- **Depends on** the unmerged `feat/pipeline-runtime-and-pause` branch, which introduced the Runtime tab
  and the runner client this builds on.

## Non-goals

- The side-sheet presentation (the design's Option 1). The failures stay inside the card.
- A failed-rows tab of its own, which older mocks carried.
- A failures surface anywhere but the pipeline's own Runtime tab.
- Presenting the dead letter's stored payload or the model's raw response. The ops API omits both.
- Reading failures on the listing page. The runner has no cross-pipeline count endpoint, and asking per
  row would be one request per pipeline.

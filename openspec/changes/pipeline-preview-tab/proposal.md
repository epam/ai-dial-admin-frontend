## Why

An author can declare a pipeline, but can see what it would write only by enabling it. The service already
has a dry-run — `POST /v1/pipelines/{name}/preview` — that runs the declared read over real rows, writes
nothing, and works on a disabled pipeline; it is the gate that arming also applies. The console never calls
it, so a wrong group key, a coercion that would wrap values, or a read too heavy to run surfaces only after
the pipeline is live.

## What Changes

- A **Preview** tab on the pipeline detail page, between Properties and Runtime, for every pipeline kind:
  SQL and LLM enrichments (row-by-row and group trigger) and aggregates. Offered to a full admin, because the
  endpoint requires it, and only while analytics is enabled.
- The tab is **run on demand**: a first visit shows what the preview does and a `Run preview` button; later
  visits show the last result with `Run again`. The result is never wiped by a failed run.
- The result is a **grid of the sampled rows**, headed by each column's role, sampled type, target type and
  largest value size, under a run bar of count chips. An aggregate states "N of M groups" from `total_rows`;
  the others state their sample size.
- **Notes** from the service are shown by code and severity: coercion that would narrow or wrap values, an
  enrichment the pipeline is waiting on, a group cut by the fetch limit, truncated values, an output without a
  description, an unconstrained response, and the empty-sample causes.
- A **Statement** section for aggregate and SQL pipelines (formatted for reading, copied verbatim), and an
  **Outputs** section for LLM pipelines, built from the declaration, that flags outputs with no description.
- A **group chip** on a group-trigger pipeline naming the group the service chose, and the previous one when a
  rerun moved to another.
- **Error and access states** for each failure the endpoint documents, each with the action that fixes it.
- **Honest about what it ran on**: the preview uses the saved declaration, so unsaved edits get a banner (no save
  control: the page's own `Save` does that), and a result older than the pipeline's current generation says so.

Non-goals: a window or cursor control (`from`/`to`/`cursor` are not sent; the sample is always the newest
rows); choosing a group key (the service picks the newest); rendering the LLM prompt or calling the model; a
run timestamp and the read budget chips (the service returns neither); preview of the Runtime or Groups data;
running a preview on an unsaved draft.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the detail view's tab strip gains Preview, and the Preview tab's behaviour is added —
  run on demand, the sample grid and count chips, notes, Statement and Outputs, the group chip, error and
  access states, and the unsaved-edit and stale-result banners.

## Impact

- `PipelineDetailFrame.tsx` and `EntityViewTab` (`utils/tabs/utils.ts`) gain the tab; a new
  `components/Analytics/Pipelines/Preview/` feature folder holds the tab.
- A server action and an analytics API method for the preview endpoint, with the error envelope passed through
  so the 422, 403 and 503 codes can be told apart; new types in `models/analytics/`.
- Reuses the existing SQL formatter in `QueryBuilder/utils/sql-format.ts` and the pipeline grid conventions.
- Depends on the ADAS preview contract at `development` as of 2026-10-14: one response shape for both kinds
  (`rows`, typed `columns`, `statement`, `total_rows`, `group_key`, coded `notes`). A deployment running an
  older ADAS answers differently; the console does not support it.
- New i18n keys and tests; no change to other tabs, the list, or save and enable behaviour.

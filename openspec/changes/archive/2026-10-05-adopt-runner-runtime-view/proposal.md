## Why

The Runtime tab reads a pipeline's execution position out of `pipeline.state`, which the registry owns. For an
enrichment pipeline the registry deliberately records almost nothing there, because the enrichment runner owns that
position — so the tab the console added for exactly this question answers "has not run yet" for a pipeline that is
running perfectly. The runner now serves the answer directly: one per-pipeline runtime view covering every lane.

The same runner release renames two properties of the paused listing. The console parses both of them, so adopting
the view is no longer optional: the rename lands whether or not the view is adopted, and it breaks the pause banner,
the Resume control and the runtime chip when it does.

## What Changes

- **BREAKING (upstream):** `GET /v1/pipelines/paused` renames `pipelineName` → `pipeline_name` and
  `resumesAt` → `resumes_at`. The console keys its pause map on the first and states the lift time from the second,
  so without this change the request succeeds and nothing reads as paused: no banner, no Resume, and a Pause control
  offered for an already-paused pipeline. The console follows the rename; it does not read both spellings, because
  the two services are deployed together.
- The detail page reads the runner's new `GET /v1/pipelines/{name}/runtime` and presents it on the Runtime tab,
  grouped as the service groups it: status, schedule, progress, and — where the lane has them — queue, today's
  spend, group readiness and the dead-letter totals. A section the service omits is not drawn.
- The runtime view becomes the detail page's single runner read. It carries the pause, so the page no longer needs
  the global pause listing to decide a pipeline's own state; and it answers 404 for a pipeline absent from the
  runner's cache, which is precisely the state the page draws today from the cache listing. Both reads stay for the
  **listing**, which asks about every pipeline at once.
- The console learns three runtime states it could not express: `held`, `over_budget` and `backpressured`. The chip
  beside the pipeline's name and the Runtime tab both state them.
- The failures card is **not** moved onto the view. The view counts the live dead letters but carries no time for
  the newest of them, which is half of what the card's summary states — so the card keeps the one read that
  answers both, rather than assembling one summary out of two services that sample at different moments.
- A cold runner cache (503 `pipeline_cache_cold`) is stated as "not read yet" rather than as a failure, since it
  clears on its own.
- The console does not present the heartbeat's stall flag: the service deliberately does not serve it.

## Non-goals

- **No polling.** The view is read when the tab is opened and on the existing Read again control. Lag and queue
  depth age within seconds, which argues for stating when the answer was taken, not for a timer against the runner.
- **No change to the listing's runtime column.** It asks one question about every pipeline, which the global pause
  and cache listings already answer in two requests; a per-pipeline view would be one request per row.
- **No health verdict.** The console states what the service reports and does not derive "healthy" or "stalled" from
  lag, queue depth or failure counts.
- **No backfill or settings section.** Backfill runs have their own endpoint, and the settings echo the declaration
  the Properties tab already shows.
- **No compatibility with the previous runner.** The new contract only.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: the Runtime tab presents the runner's runtime view rather than the registry's state;
  the detail page reads the pause from that view; the runtime chip gains the three gate states; the paused listing
  is parsed in snake_case.

## Impact

- **APIs:** adds `GET /v1/pipelines/{name}/runtime` to the runner client. `GET /v1/pipelines/paused` changes shape.
  No registry change.
- **Code:** `server/analytics/analytics-runner-api.ts` and the pipelines server actions gain the runtime read;
  `models/analytics/pipeline-runtime.ts` gains the view's types and renames two members of `PausedPipeline`;
  `PipelineRuntime.tsx` is rebuilt around the view; `PipelineDetailFrame.tsx`, `PipelineRuntimeBadge.tsx` and
  `PipelinePauseBanner.tsx` follow. The failures card and its hooks are untouched.
- **Shared surfaces:** `use-paused-pipelines.ts` is still the listing's hook and keeps its current behavior; only
  the property it keys on changes. Nothing outside `components/Analytics/Pipelines/**` reads these models.
- **Tests:** the pause fixtures in five spec files carry the old property names and change with the model.

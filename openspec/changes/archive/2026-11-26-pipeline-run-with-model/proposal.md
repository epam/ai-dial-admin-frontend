## Why

The Preview tab shows what an LLM enrichment would read, but it never calls the model. A missing deployment, a
route that refuses the body, or a reply that does not fit the response schema surfaces only after the pipeline is
armed, as dead-lettered failures. The enrichment runner now evaluates a sampled row or group through the model
without writing anything (`POST /v1/pipelines/{name}/try`), so the console can let an author check the model's
answer before enabling the pipeline.

## What Changes

- The Preview tab of an `llm` enrichment gains a second run control, **Run with model**, beside `Run preview`. It
  follows the tab's existing wording: `Run again with model` once a result is held, `Run saved version with model`
  beside an unsaved edit, `Running with model…` while in flight.
- Activating it opens a confirmation that names the deployment, the number of model calls it may make, and that
  the calls count toward the pipeline's daily spend budget. Nothing runs until the author confirms.
- A confirmed run sends one request to the runner with no body, so the newest sampled row (or the newest group) is
  evaluated. Its answer carries the ordinary preview, which replaces the held preview result.
- The grid marks the evaluated row with its outcome and adds one column per output the model mapped; the other
  sampled rows read `Preview only`. A **Model result** panel beneath the grid states the outcome, the stage it
  stopped at, the attempts, usage, latency and deployment, the values the pipeline would write, any schema
  violations, and the request sent and reply received, each copyable and marked when the runner cut it at 64 KB.
- A group pipeline's result states how many members the model received and how many the input token budget left
  out.
- Each refusal the runner documents gets its own state: a run already in flight, the daily budget used up, the
  rate limit in use, a declaration the runner cannot run, the sample unreadable. Refusals the registry raises while
  the sample is read reuse the Preview tab's existing failure states. A runner that does not serve the endpoint
  disables the control for the rest of the visit. A refused run never wipes a held result.
- The control is not rendered for an aggregate, for an SQL enrichment, or when no runner host is configured.

## Non-goals

- No control for the number of rows, the window or the group key: the run sends no body, as `Run preview` does.
- No change to `Run preview`, its request or its failure states.
- No requests to the runner for more fields (output types, the evaluated generation, the corrective request, a
  capability flag). The console works from the response as it is.
- No cancellation: a run the author leaves is still made and billed, and the tab says so.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/pipelines`: the Preview tab adds a model run for LLM enrichments — its availability, confirmation,
  in-flight state, result presentation for row and group pipelines, and its refusals.

## Impact

- **Runner client** (`src/server/analytics/analytics-runner-api.ts`): a new `try` URL and method, sent with the
  caller's token, which the runner forwards to the registry.
- **Server actions** (`src/app/[lang]/pipelines/actions.ts`): a `runWithModel` action guarded like the other
  runner actions.
- **Models** (`src/models/analytics/`): the response and evaluation shapes.
- **Preview tab** (`src/components/Analytics/Pipelines/Preview/`): run bar, a model-run hook held by
  `PipelineDetailFrame` beside the preview hook, the confirmation modal, the grid's model columns, the Model
  result panel, refusal states.
- **i18n**: new `PipelinePreviewI18nKey` entries.
- **Dependency**: the runner build from epam/ai-dial-analytics-enrichment-runner#16 paired with the registry build
  from epam/ai-dial-analytics#97. With an older runner the control disables itself; nothing else on the page
  changes.

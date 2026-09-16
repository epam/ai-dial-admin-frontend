## Why

The analytics data service now **refuses** the projection the console asks for unconditionally. A
listing carrying `view=compiled` without `kind=enrich` answers 400 `bad_request`, and a single read
carrying `view=compiled` for a pipeline of any kind but `enrich` answers 422
`pipeline_validation_failed`. Both were 200 before, answering with the entries unresolved under the
compiled name — the service closed that hole because a consumer could not tell such an entry apart
from an enrich pipeline that genuinely resolves no members.

The console asks for `compiled` on every pipeline read, so two surfaces are broken outright: the
Pipelines page shows the service's `bad_request` notification and no rows, and an aggregate pipeline's
detail page renders a false 404 — the refusal leaves the response body empty, and the page reads an
empty body as "no such pipeline".

## What Changes

- The pipelines **listing** stops naming a projection. `source` is the service's default and already
  carries every member the grid renders, the declared inputs and the declared evaluator name and
  version included.
- The pipeline **detail read** chooses its projection from the kind it just read: `view=source` first,
  then `view=compiled` only when that answer says `kind=enrich`. An aggregate pipeline stays one
  request; an enrich pipeline costs two.
- A failed compiled read is **reported**, not downgraded to the declaration. The detail view prints an
  absent `grain_key` and `version_column` as "not set", which for an enrich pipeline would state
  something false rather than something missing.
- The **inputs** grid cell now renders the declared read source rather than the resolved one. They
  differ only for an enrich pipeline that declared no input and inherits its target's parent; that
  pipeline's resolved source stays readable on its own detail page.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/pipelines`: the requirement that every pipeline read asks for the compiled projection is
  now false against the service, and is replaced by one that ties the projection to the kind. The
  grid-column requirements that describe the listing's projection change with it.

## Impact

- `src/server/analytics/analytics-data-api.ts` — `PIPELINES_LIST_URL`, `PIPELINE_READ_URL`,
  `getPipeline`
- `src/server/analytics/tests/analytics-data-api.spec.ts`
- No change to any component, server action, page or model: `Pipeline` and `PipelineListItem` already
  type every resolved member optional, and the detail view already gates them behind the resolved
  evaluator.
- Callers unaffected in behavior: the evaluator pages already scope their listing to
  `kind=enrich`, which the service still serves — with or without a projection.

## Non-goals

- Asking the service to relax either gate. Both refusals are deliberate and their rationale is stated
  in the service's own code: a requested projection a read cannot honour is answered with an error,
  never with the unresolved object under the compiled name.
- Surfacing the declared-versus-inherited read source in the grid. That distinction is recovered from
  the target table, not from a projection, and belongs to the detail page.

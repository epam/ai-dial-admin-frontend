## 1. Pipeline read projections

- [x] 1.1 Take the projection as an argument in `PIPELINE_READ_URL` in
      `apps/ai-dial-admin/src/server/analytics/analytics-data-api.ts`, instead of hardcoding the
      compiled one, and state at that constant why the compiled view is not always servable
- [x] 1.2 Drop the `view` parameter from `PIPELINES_LIST_URL` in the same file, and return the bare
      `PIPELINES_URL` when no filter is set so the URL carries no dangling `?`
- [x] 1.3 Read the declaration first in `AnalyticsDataApi.getPipeline`, then request the compiled
      projection only when that answer carries `kind === PipelineKind.Enrich`; report a failed compiled
      read rather than returning the declaration in its place

## 2. Tests

- [x] 2.1 Update the pipeline cases in
      `apps/ai-dial-admin/src/server/analytics/tests/analytics-data-api.spec.ts`: the listing names no
      projection and leaves no dangling separator; an enrichment pipeline is read as declaration then
      compiled; a pipeline of another kind is read once and never asks for the compiled projection; a
      failed compiled read is returned as the failure

## 3. Quality checks

- [x] 3.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run test`

No browser-verification task: the change lives entirely in the API layer's URL construction and request
sequencing, which the unit tests above settle, and both service gates were checked directly against the
dev registry while diagnosing. Confirmed with the user rather than assumed.

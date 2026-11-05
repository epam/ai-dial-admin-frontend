## 1. Service contract

- [x] 1.1 Add `models/analytics/ingest-failure.ts`: enums `IngestFailureKind`, `IngestFailureState`, `IngestFailureReason`, `IngestFailurePath`; interfaces for one failure (with `backfill_run_ids?`), the list filters (with `backfill_run_id`), the list response (`failures`, `truncated`, `total`, `by_state`, `retry_sweep`), the retry sweep, a retry target, the retry request (filters, `targets`) and the retry response (`requeued`, `retry_sweep`)
- [x] 1.2 Add `failedBlobs` to the run type in `models/analytics/table-backfill.ts`
- [x] 1.3 Add `listIngestFailures(filters, token)` and `retryIngestFailures(body, token)` to `server/analytics/analytics-data-api.ts`, with URL constants beside `TABLE_BACKFILL_URL`
- [x] 1.4 Add the `listIngestFailures` and `retryIngestFailures` server actions to `app/[lang]/tables/actions.ts`, following `listTableBackfillRuns`
- [x] 1.5 Unit tests for the API methods in `server/analytics/tests/analytics-data-api.spec.ts`: query string including `backfill_run_id` and `limit`, a `targets` body, a `404` answer, and a refusal carrying the service's message

## 2. Shared failures blocks

- [x] 2.1 Create `components/Analytics/Common/Failures/` with `FailuresSummaryHeader`, `FailuresTiles`, `FailureDetailMessage`, `RetryConfirmPopup`, `FailuresRunFilter`, `FailuresOutcomeStatus` and `FailuresReadFailed`, per design.md §1
- [x] 2.2 Move `PipelineFailuresCard`, `FailureRowDetail`, `RequeueFailuresPopup` and the pipeline run filter indicator onto those blocks without changing their behavior or wording
- [x] 2.3 Component tests for each shared block in `components/Analytics/Common/Failures/tests/`, and confirm the existing `components/Analytics/Pipelines/Failures/tests/*` pass with their assertions unchanged

## 3. Ingest failures data

- [x] 3.1 Add the pure utils in `components/Analytics/Tables/IngestFailures/utils.ts`: `groupIngestFailures` (by reason and kind, ordered by newest failure), `isDeterministicReason`, `toRetryTarget` / the selection key, and `composeRetryOutcome` (per design.md §6)
- [x] 3.2 Add the `use-ingest-failures` hook: parallel parked and pending reads with an optional `backfillRunId`, counts from `by_state`, `retry_sweep`, `isUnavailable` on `404`, `hasFailed` with a notification carrying the service's message, `reload`
- [x] 3.3 Add the `use-ingest-failures-count` hook for the toolbar (`state=parked&limit=1`, `total`, `isUnavailable`, `reload`)
- [x] 3.4 Add the `use-retry-ingest-failures` hook: row and selected retry by `targets`, group retry by `state=parked`, `reason`, `kind` and the run filter, the group count read (`limit=1`, `total`) for the dialog, the outcome message, a reload after every retry, and a notification on refusal
- [x] 3.5 Unit tests for the utils and the three hooks, including a `targets` body that mixes `blob` and `records` on one key, the run filter on every read and on the group retry, and each outcome variant

## 4. Ingest failures drawer

- [x] 4.1 Build `IngestFailuresDrawer` on `Common/Drawer` (600px, close rules as the backfill drawer): summary header, the two tiles, the switched-off retry warning, the Run indicator, "shown N of M", empty states (including the narrowed one) and the failed-read state
- [x] 4.2 Build `IngestFailuresGrid` on `AgGridWrapper` with group header, failure and detail full-width rows; row Retry; group Retry all with the deterministic caveat; programmatic expansion state; checkbox and Retry clicks that do not toggle the detail; `backfill_run_ids` in the detail
- [x] 4.3 Add selection: row checkboxes, tri-state group checkboxes, the selection bar (`N selected`, Clear selection, Retry selected), cleared on every read
- [x] 4.4 Build the automatic-retry line with its collapsed grid: next attempt shown, no checkbox, no retry control
- [x] 4.5 Build the group and selection confirmations on `RetryConfirmPopup`: the exact count (from the count read for a group, from the selection size otherwise), Confirm disabled while the group count loads, the reach line when the count read fails, and the fix-the-cause caveat for deterministic reasons
- [x] 4.6 Add i18n keys (`AnalyticsTablesIngestFailuresI18nKey` or a section of the existing tables enum) and English strings in `locales/en.ts`, including reason names and their descriptions and every outcome variant
- [x] 4.7 Component tests for the drawer and grid covering every scenario in the delta's ingest failures requirements

## 5. Tables page integration

- [x] 5.1 Add the Ingest failures button to the `TablesView.tsx` toolbar before Backfill data, for full admins only: the exact parked count, the count in the accessible name, withheld when the listing is unavailable, re-read when the drawer closes; it opens the drawer without a run filter
- [x] 5.2 Add the Failed blobs metric to `TableBackfillRunView.tsx`: error tone above zero, info hint, a link above zero while the listing is available that closes the backfill drawer and opens the ingest failures drawer narrowed to the run
- [x] 5.3 Mock the new server actions as the sibling specs do (`vi.mock` of `tables/actions`), and add component tests for the toolbar button and the Failed blobs metric (link and plain variants)

## 6. Quality gates

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`, and fix anything they report

No browser verification task: the user chose unit and component tests only for this change.

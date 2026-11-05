## Why

The Analytics service now records every log blob and every day that failed to ingest into the system
tables, retries the transient ones on its own, and parks the rest until an operator acts. Until the
console shows that record, a parked failure means data is missing from analytics and nobody on the
Admin side can see it or act on it. The pipeline failures card already solves the same problem for
pipelines, so the two surfaces should read and behave alike rather than teach an operator two
vocabularies.

## What Changes

- An **Ingest failures** control on the Tables toolbar, beside Backfill data and offered to the same
  callers, that states how many failures need an operator.
- An **ingest failures drawer**: an exact summary (needs retry / retrying automatically), the failures that
  need an operator grouped by reason and kind, a per-group, a per-row and a selected-rows retry, each row's
  detail in place, and the failures that are retrying automatically behind one expandable line.
- Retry is a request to queue the failure for the service's next retry pass. The console states it as
  queued, never as fixed, states when the next pass is due or that the pass is switched off, and reads
  the list again afterwards. A group retry is confirmed with the exact number it reaches.
- A deterministic failure's retry tells the reader to fix the cause first, because retrying it unchanged
  parks it again.
- The backfill run block gains a **Failed blobs** figure, with a hint that blobs which later ingested on
  their own no longer appear among the ingest failures. Above zero it opens the drawer narrowed to that
  run, stated as a dismissible Run indicator.
- The pipeline failures card moves onto shared failures building blocks (summary header, the two tiles,
  in-place detail, bulk-retry confirmation, outcome status, failed-read state) that the drawer uses too.
  Its behavior does not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics/tables`: adds the ingest failures entry point and drawer, and the Failed blobs figure (a link
  into the drawer) in the backfill run block.

The pipeline failures card's requirements in `analytics/pipelines` are unchanged: the move onto shared
building blocks is a refactor.

## Non-goals

- No client-side paging past the first 1000 rows of a state. Counts and retries still reach every match.
- No per-table attribution. A blob feeds several system tables, and the record names the blob, not the
  table.
- No change to the pipeline failures card's behavior, paging, filters or wording.

## Impact

- Tables page: `components/Analytics/Tables/TablesView.tsx` (toolbar), a new ingest failures drawer under
  `components/Analytics/Tables/`, server actions in `app/[lang]/tables/actions.ts`, and two methods on
  `server/analytics/analytics-data-api.ts`.
- Backfill: `models/analytics/table-backfill.ts` and `components/Analytics/Tables/Backfill/TableBackfillRunView.tsx`
  for the new figure. The shared `BackfillRunFacts` is used as-is.
- Pipelines: `components/Analytics/Pipelines/Failures/*` move onto the new shared building blocks. Their
  tests must keep passing unchanged in what they assert.
- New models for the ingest failure listing and retry, and new i18n keys.
- Depends on the Analytics service release that serves `/v1/data-sync/failures`. Against an older service
  the entry point is withheld.

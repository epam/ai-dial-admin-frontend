## Why

The Analytics Conversations page (`/conversations-trace`) renders **fixtures** by default. Its data source
is a hand-flipped constant (`USE_CONVERSATIONS_MOCK = true`), and its live path recomputes the conversation
rollup on every request as an aggregate over `dial_usage_log` grouped by `chat_id`. The `conversations-trace`
proposal recorded the consequence: *"with the switch defaulting to mock, this change does not prove that
ADAS answers the query as expected."*

That is now obsolete twice over. The analytics backend has a **materialized conversation-grain table**,
`conversations`, fed by the `conversations_rollup` aggregate pipeline (one row per `chat_id` over
`dial_usage_log`, refreshed on a 15-minute cron). It is live on dev and provisioned on the local
environment — 1,886 conversations, drained, and listed by `GET /v1/queries/entities`. So the page can read a
real table instead of computing one, and the mock has nothing left to stand in for.

Reading a table is a **row-mode** query, and row mode returns `totalCount` while aggregate mode never does.
That retires the page's most-visible gap in the same move: the grid is currently one fixed page of 20 rows
with a "20+" lower-bound summary, because an aggregate query cannot tell it how many conversations exist.

## What Changes

- **Repoint the query at the `conversations` entity in row mode.** No `group_by`, no aggregate functions —
  the columns are stored. The time filter bounds `last_request_time`, so the period now means *"conversations
  whose last activity falls in the range"* rather than *"usage events in the range"*, which also removes the
  partial-group caveat the current design carries. Search stays two `ico` predicates, now over the table's own
  `chat_id` and `project_id` (no select-alias restriction, because both are base columns).
- **Delete the mock outright** — `src/mocks/analytics/conversations-trace.ts`, the `USE_CONVERSATIONS_MOCK`
  branch in the server action, the mock-mode filter replay, and the `vi.doMock` two-branch test machinery.
  One data path remains.
- **Add paging with exact totals.** Server-side offset paging via `include_total: true`, using the repo's
  existing server-paged grid pattern rather than a new one. The summary pills report the real count and cost
  instead of a lower bound, and `isTruncated` / the "20+" label are removed.
- **BREAKING (page behavior)**: **Turns changes meaning.** It maps to the stored `turn_count`, which the
  pipeline computes as `count()` over usage-log rows — including `embedding`, `mcp` and `route` spans — not
  `count(distinct trace_id)`. Pipeline measures have no `distinct` flag (`AggregateCompiler.measureField`
  hardcodes it to `false`), so the exact turn count is not expressible in a rollup. Measured on real local
  data: identical for 165 of 223 conversations, ~21% higher in aggregate.
- **Remove the title/snippet enrichment scaffolding.** `USE_CONVERSATION_SUMMARY_ENRICHMENT`,
  `SUMMARY_ENRICHMENT_FIELDS`, the gated select/search entries, the pending provenance entity and its
  "these are sample values" hint all go. Nothing can populate them: no `conversation_summary` enrichment
  exists, and a pipeline cannot roll up an enrichment column — `AggregateSpecValidator` resolves input
  columns against the input table's own `column_mapping` rows only.
- **Remove the model chip** from the Project cell. `deployment` is not rolled up into `conversations`, so
  `min(deployment)` and `count(distinct deployment)` have no source column.
- **Correct the wire-shape record.** ADAS returns timestamps as ISO-8601 with `Z` and decimals as JSON
  numbers at full 12-digit scale. The comment at `utils/analytics/conversation-formatting.ts:38` asserts the
  opposite ("the live query returns epoch millis"); the tolerant parser keeps behavior correct, but the stated
  fact is inverted and load-bearing for the next reader.
- **Ratings are unchanged.** Feedback still resolves through `rate_analytics` as separate queries; the DSL has
  no joins and `rate_analytics` is not part of the rollup.

## Non-goals

- **Provisioning the pipeline.** Creating the `conversations` table and `conversations_rollup` pipeline is
  backend/environment configuration, already done on dev and locally. This change consumes the entity; it does
  not create it. Making the provisioning reproducible (a seed migration, a script, or a Pipelines UI — the
  admin frontend has none today) is real but separate work.
- **An exact turn count.** Would require a `distinct` flag on `MeasureRequest`/`Measure` in the analytics
  backend and a re-declared pipeline.
- **Restoring the model chip** by adding `deployment` measures to the rollup.
- **Conversation title and snippet.** Their eventual source is an enrichment; the closest thing that exists is
  a per-*request* summary at `event_id` grain, which is not a conversation title.
- **The columns the rollup newly makes free** — `user_hash`, the prompt/completion token split,
  `success_count`, `duration_ms`, `avg_duration_ms`, and the `conversation_buckets` enrichment. Worth a
  deliberate column-set decision, not a drive-by addition.
- **Column sorting**, row-click navigation to a conversation detail view, and the 1,000-id cap on the feedback
  filter's candidate set.
- The Usage Log "Conversations" tab, which reads a different backend and stays as-is.

## Capabilities

### New Capabilities

None. Analytics requirements consolidate into the single master spec `openspec/specs/analytics/spec.md`, so
this ships as a delta against `analytics`.

### Modified Capabilities

- `analytics`: **REMOVES** the mock-switch requirement, the fixture-shape requirement, and the
  title/snippet-from-enrichment requirement. **MODIFIES** the conversation list query (aggregate over
  `dial_usage_log` → row-mode read of the `conversations` entity, with its field names, time-filter column and
  search targets), the read-only grid requirement (fixed single page → server-paged with `include_total`), the
  page's prefetch and server action contract (now carrying a total), the composed-cell requirements (no model
  chip), and the provenance band (no pending enrichment attribution).

## Impact

**Affected source** — `src/constants/analytics/conversations-trace.ts`,
`src/models/analytics/conversations-trace.ts`, `src/utils/analytics/conversations-queries.ts`,
`src/utils/analytics/query-build.ts` (a row-mode envelope alongside the existing aggregate one),
`src/utils/analytics/conversation-rows.ts`, `src/utils/analytics/conversation-formatting.ts`,
`src/app/[lang]/conversations-trace/{page.tsx,actions.ts}`,
`src/components/Analytics/ConversationsTrace/**`, `src/constants/grid-columns/grid-columns.tsx`,
`src/constants/i18n.ts`, `src/locales/en.ts`, and the co-located test suites.

**Deleted** — `src/mocks/analytics/conversations-trace.ts`, which empties `src/mocks/` entirely.

**Reused, not rebuilt** — the server-paged grid pattern (`infiniteGridOptions` / `PAGE_SIZE` in
`src/constants/ag-grid.ts`, exemplar `src/components/ActivityAudit/List/List.tsx`, and `GridView`'s existing
`rowModelType === 'infinite'` handling), `useProtectedRequest`, `useTimeFilter`, `TimeFilter`, and
`analyticsDataApi.executeAction`.

**Backend** — read-only, no new endpoint and no new API class: the same `POST /v1/queries/execute`, against a
different entity. Hard prerequisite: `conversations` must be registered and populated in the target
environment, or the page's query returns 400 while its access guard still passes.

**Shared code** — `grid-columns.tsx` touches only the conversations array. `query-build.ts` gains a row-mode
envelope; the existing primitives and the Query Builder are untouched.

**Coordination** — the requirements this delta modifies were introduced by `conversations-trace`, which is
complete but **not archived and not yet synced** into `openspec/specs/analytics/spec.md`. The two deltas must
therefore be synced in order — `conversations-trace` first, this one second — or this delta's edits will not
find the requirements they modify.

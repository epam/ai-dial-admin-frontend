> No browser-verification task: declined by the requester. The browser-observable scenarios (rows render,
> `Page403`, empty state, sorting disabled, no filter row, menu sub-item) are covered by component tests in
> task group 7.

## 1. Types, constants, and route enum

- [x] 1.1 Add `ConversationsTrace = '/conversations-trace'` to `ApplicationRoute` in `src/types/routes.ts`
- [x] 1.2 Create `src/models/analytics/conversations-trace.ts` with `ConversationRow` — `chat_id: string`,
      `project_id: string`, `turns: number | string | null`, `tokens: number | string | null`,
      `cost: number | string | null`, `last_activity: number | string | null` — plus any enum this change
      needs. No inline anonymous object types.
- [x] 1.3 Create `src/constants/analytics/conversations-trace.ts` with the entity name `dial_usage_log`,
      `CONVERSATION_PAGE_SIZE = 20`, the default time-period id `'7d'`, the select aliases, and
      `export const USE_CONVERSATIONS_MOCK: boolean = true` — the `: boolean` annotation is required so both
      branches stay reachable and testable
- [x] 1.4 Add `ConversationsTraceI18nKey` to `src/constants/i18n.ts` and a distinct `MenuI18nKey` member for
      the "Conversations" menu label (separate from the DIAL Core `/conversations` key), with English
      strings in `src/locales/en.ts`

## 2. Query layer

- [x] 2.1 Create `src/utils/analytics/query-build.ts` with primitives typed against
      `src/models/analytics/query.ts`: `field`, `value`, `and`, `ge`, `le`, `ne`, `fn`, `col`, `sortItem`,
      `offsetPage`, `aggregateQuery`. Import `timeRangePredicates` from
      `src/components/Analytics/QueryBuilder/utils/time.ts` rather than re-deriving the `ge`/`le`
      timestamp pair. Do not import from `src/utils/structured-query/build.ts`.
- [x] 2.2 Create `src/utils/analytics/conversations-trace-query.ts` with
      `buildConversationListQuery({ range }: { range: TimeRange }): StructuredQuery` — aggregate mode,
      `group_by: ['chat_id']`, the five aliases (`turns` as a `distinct` `count(trace_id)`,
      `sum(total_tokens)`, `sum(total_price)`, `max(request_time)`, `min(project_id)`), filter
      `and[ge/le on request_time, ne(chat_id, '')]`, sort `last_activity desc` then `chat_id asc`, page
      `{ offset: 0, limit: CONVERSATION_PAGE_SIZE, include_total: false }`. The function must not read the
      clock — the caller resolves the range.

## 3. Fixtures

- [x] 3.1 Create `src/utils/analytics/mocks/conversations-trace.mock.ts` with 10–20 `ConversationRow`
      fixtures reproducing real backend value shapes: at least one `cost` at the full fractional scale of a
      `Decimal(38, 12)` sum, at least one row with `tokens` and `cost` as `null`, at least one empty
      `project_id`, production-length `chat_id` values (not shortened display ids), and a wide spread of
      `turns`. Descending `last_activity` order.

## 4. Server action and page

- [x] 4.1 Create `src/app/[lang]/conversations-trace/actions.ts` (`'use server'`) exporting the
      conversations fetch: when `USE_CONVERSATIONS_MOCK` return the fixtures without calling the api
      client; otherwise resolve the range via `getTimeRangeById('7d')`, build the query, and delegate to
      `analyticsDataApi.executeAction(query, await token())` following the pattern in
      `src/app/[lang]/query-builder/actions.ts`. Return a `ServerActionResponse`.
- [x] 4.2 Create `src/app/[lang]/conversations-trace/page.tsx` — server component,
      `export const dynamic = 'force-dynamic'`, `isAnalyticsForbidden()` → `Page403` before any data
      access, then prefetch rows and pass them to the client view. Follow
      `src/app/[lang]/tables/page.tsx`.

## 5. Grid columns

- [x] 5.1 Add the conversations column array to `src/constants/grid-columns/grid-columns.tsx`: six columns
      (conversation id, project, turns, activity, tokens, cost) wrapped in the module-private
      `restrictSort` with an empty sortable list, each with `floatingFilter: false`. Reuse `numericColumn`
      for turns/tokens, `numberValueFormatter` and `currencyValueFormatter` for values, and
      `formatDateTimeToLocalString` for activity. Give the conversation column a larger `flex` than the
      shared default. Do not modify any existing column array.
- [x] 5.2 Confirm on the first column definition that per-column `flex` and `floatingFilter: false`
      override the wrapper's shared `defaultColDef` before the remaining five depend on it

## 6. View components

- [x] 6.1 Create `src/components/Analytics/ConversationsTrace/ConversationsTraceView.tsx` — client
      component taking the prefetched rows, rendering a title header above the list
- [x] 6.2 Create `src/components/Analytics/ConversationsTrace/List/ConversationsList.tsx` — `GridView`
      wrapper passing the column array, `emptyDataProps` for `DialNoDataContent`, and `rowHeight` via
      `additionalGridOptions`. Never pass `defaultColDef` through `additionalGridOptions`; do not set
      `storageKey`.
- [x] 6.3 Create the conversation-id cell renderer under
      `src/components/Analytics/ConversationsTrace/List/` and wire it as the conversation column's
      `cellRenderer`, so later commits add lines to it rather than replacing the column definition
- [x] 6.4 Add the "Conversations" sub-item to the existing Analytics group in
      `src/components/Menu/menu-configuration.tsx`, after the current items

## 7. Tests

- [x] 7.1 `src/utils/analytics/tests/query-build.spec.ts` — timestamp values are epoch-millisecond strings
      with `value_type: 'timestamp'` and no ISO punctuation; predicate node shape puts the field first;
      the aggregate envelope sets `mode` explicitly
- [x] 7.2 `src/utils/analytics/tests/conversations-trace-query.spec.ts` — aggregate mode grouped by
      `chat_id` with the five aliases and `distinct` on the `turns` count; epoch-millis time bounds from a
      fixed range; `ne(chat_id, '')` present and no null comparison on `chat_id`; `chat_id asc` is the
      final sort entry; page is `offset: 0, limit: 20, include_total: false`
- [x] 7.3 `src/utils/analytics/tests/conversations-trace.mock.spec.ts` — 10–20 rows, at least one
      full-scale decimal `cost`, at least one row with null `tokens` and `cost`
- [x] 7.4 `src/app/[lang]/conversations-trace/tests/actions.spec.ts` — switch on returns fixtures and does
      not call `analyticsDataApi.executeAction`; switch off calls it with the built query and returns its
      response unchanged
- [x] 7.5 Component test on `ConversationsTraceView` — rows render from fixtures in `last_activity`
      descending order; a header click leaves order unchanged and shows no sort indicator; no floating
      filter row is present; zero rows renders the no-data content; null `tokens`/`cost` render empty
      rather than `0` or `NaN`; `last_activity` renders a formatted date from both an epoch-millisecond
      number and an ISO string. Assert against the cell renderer's output, not raw cell text, so follow-up
      work does not invalidate these.
- [x] 7.6 Extend the menu configuration test to assert the Analytics group shows the "Conversations"
      sub-item linking to `/conversations-trace` when `analyticsEnabled` is true, and that all three
      sub-items are absent when it is false

## 8. Quality checks

- [x] 8.1 Run `npm run lint` and `npm run format` from the repo root and fix any findings
- [x] 8.2 Run `npx vitest run src/utils/analytics/ src/app/\[lang\]/conversations-trace/ src/components/Analytics/ConversationsTrace/`
      from `apps/ai-dial-admin/`, then the full `npm run test`, and fix any failures

## 9. Server-side search and time filtering

Follow-up scope: a search box and time-period control matching the dashboard, where each change re-queries
the backend rather than narrowing the rows the grid already holds.

- [x] 9.1 Add `or` and `ico` to `src/utils/analytics/query-build.ts`. `ico` takes the term as a `string` and
      builds the string literal itself — the service rejects a non-string or null right operand — and passes
      the term through verbatim, since `FilterTranslator.containsPattern` supplies `%…%` and escapes `\`,
      `%`, `_` on the server.
- [x] 9.2 Add `ConversationFilters` (`search`, `startMs`, `endMs`) to
      `src/models/analytics/conversations-trace.ts`, so the action boundary carries no `Date`.
- [x] 9.3 Extend `buildConversationListQuery` with an optional `search`, appending one
      `or[ico(chat_id), ico(project_id)]` group to the existing AND when the trimmed term is non-blank.
      Match the base `project_id`, not the `project` alias — `filter` resolves against base fields and only
      `having` resolves aliases. Add `CONVERSATIONS_SEARCH_DEBOUNCE_MS` to the constants module.
- [x] 9.4 Rework the fixtures to store `msBeforeRangeEnd` and resolve `last_activity` against the requested
      range end, with offsets spanning minutes to ~6.7 days so each preset returns a different subset.
      Export a pure `buildConversationsMock(filters)` applying the time bounds, the case-insensitive search
      over id and project, and the page limit.
- [x] 9.5 Change `getConversations` to take `ConversationFilters`: mock branch delegates to
      `buildConversationsMock`, live branch reconstructs the `TimeRange` from the millis and passes `search`
      to the query builder. Have `page.tsx` prefetch with the same defaults the toolbar mounts with.
- [x] 9.6 Create `Toolbar/ConversationsToolbar.tsx` — `DialSearch` plus the shared `TimeFilter`. Add a
      `SearchPlaceholder` i18n key naming only conversation and project; message content lives in the
      `sensitive` `request_body`, so the design mock's "conversations, messages, users" would be a false
      promise.
- [x] 9.7 Create `use-conversations.ts` owning rows, loading, search and the time filter: `useTimeFilter`
      for the period, a lodash debounce on the applied term, a monotonic request-id ref so a stale response
      cannot overwrite newer rows, and a mounted-ref guard so mounting does not duplicate the server
      prefetch.
- [x] 9.8 Wire the toolbar and hook into `ConversationsTraceView`, rendering `DialLoader` in place of the
      grid while a request is in flight so the empty state cannot flash between a filter change and its
      rows.
- [x] 9.9 Extend `query-build.spec.ts` for `or`/`ico` (string literal for any term, no added wildcards,
      metacharacters left for the service) and `conversations-trace-query.spec.ts` for the search group
      (two `ico` predicates on the base columns, blank term adds nothing, trimming, select/sort/page
      unchanged, `having` absent).
- [x] 9.10 Rewrite `conversations-trace.mock.spec.ts` against `buildConversationsMock`: existing value-shape
      assertions, plus range anchoring, narrower-preset subsets, and search matching, case-insensitivity,
      trimming and no-match.
- [x] 9.11 Extend `actions.spec.ts`: filters narrow the fixtures with the switch on; with it off, the
      supplied millis become the time predicates and the term becomes the `or` group, and an empty term
      sends no search predicate.
- [x] 9.12 Add `ConversationsToolbar.spec.tsx` and extend `ConversationsTraceView.spec.tsx` for the
      behaviours that matter: a typed term reaches the action, keystrokes collapse to one request, rows are
      replaced rather than narrowed, a preset change sends the new bounds and carries the applied term, no
      request on mount, the loader replaces the grid in flight, and a failed request does not leave stale
      rows.
- [x] 9.13 Re-run lint and the full test suite

## 10. Feedback filter

Feedback lives in `rate_analytics`, a separate entity, and the DSL takes one `entity` with no join construct —
so this resolves as two server-side queries rather than one.

- [x] 10.1 Add `gt`, `isNotNull` (`ne` against a null literal — the only operator besides `eq` that accepts
      one) and `inValues` to `query-build.ts`. Document that an empty `in` list is an HTTP 400, so callers must
      skip the query instead.
- [x] 10.2 Add the `FeedbackFilter` enum (all / positive / negative / rated), `RateAnalyticsField`,
      `FeedbackField`, and `feedback` on `ConversationFilters`. Add `FEEDBACK_ENTITY`,
      `FEEDBACK_CANDIDATE_LIMIT = 1000` and `POSITIVE_RATE_EXCLUSIVE_MIN` to the constants module.
- [x] 10.3 Create `conversations-feedback-query.ts` with `buildRatedConversationIdsQuery({ range, feedback })`
      — aggregate over `rate_analytics` grouped by `chat_id`, selecting `chat_id` and `max(request_time)`,
      ordered by most recent rating so a truncated candidate set keeps the likeliest ids. Rate predicates:
      `gt(rate, 0)` positive, `le(rate, 0)` negative (a `false` thumb normalizes to `0`), `ne(rate, null)`
      rated. No companion null guard — SQL three-valued logic already excludes NULL from both comparisons.
- [x] 10.4 Give `buildConversationListQuery` an optional `chatIds`, appending one `in` predicate when non-empty.
- [x] 10.5 Make the action two-step: resolve candidate ids first, propagate a candidate-query failure without
      running the second query, and return no rows without a second query when the candidate set is empty.
      Drop blank ids. `All` skips the candidate query entirely.
- [x] 10.6 Create `Toolbar/FeedbackFilterControl.tsx` using `DialSegmentedControl`. Give the icon-only thumb
      segments a visually hidden text label — the control renders the icon inside its own button, and an
      `aria-label` on a descendant does not name that button.
- [x] 10.7 Wire feedback through the hook and view without debouncing it, and fold the fixtures' `rate` into
      `buildConversationsMock` so the filter demos on the mock path too.
- [x] 10.8 Tests: the feedback query's shape and each rate predicate; `in` narrowing on the conversation query
      and the empty-list guard; the action's two-step order, token on both calls, empty-candidate short-circuit,
      blank-id drop and failure propagation; the control's four states and their accessible names; the view
      sending feedback immediately and carrying the applied search term.

## 11. Title and snippet ahead of the enrichment

- [x] 11.1 Add nullable `title` and `snippet` to `ConversationRow`, and `CONVERSATION_SUMMARY_ENRICHMENT` to the
      constants module documenting that no query may reference it yet, that enrichment columns arrive under a
      dotted flat name, and that a dotted name must be aliased or AG Grid reads it as a nested path.
- [x] 11.2 Populate both in the fixtures, covering all four null combinations, with snippets long enough to
      overflow the column. Keep the fixture-only `rate` and range offset off the produced rows.
- [x] 11.3 Render both in `ConversationCellRenderer`, treating an empty string as absent and letting the
      conversation id take whichever line has nothing better. Raise `CONVERSATIONS_ROW_HEIGHT` for two lines.
- [x] 11.4 Tests: every null combination, empty strings treated as absent, no row / empty id renders nothing,
      the fixtures' coverage of each combination, and that search still does not match a title.
- [x] 11.5 Re-run lint and the full test suite

## 12. Provenance header band

- [x] 12.1 Add `ColumnProvenance` and `ProvenanceGroup` to the models, and `CONVERSATION_PROVENANCE_GROUPS` plus
      `CONVERSATIONS_GROUP_HEADER_HEIGHT` to the constants module. Label groups by their real source — Tokens and
      Cost belong to `dial_usage_log`, not enrichment, since they are direct sums over its columns.
- [x] 12.2 Create `List/ProvenanceHeaderGroup.tsx` mapping each provenance to a theme colour token and rendering
      a decorative, aria-hidden icon for derived groups.
- [x] 12.3 Add `CONVERSATIONS_TRACE_COLUMN_GROUPS` to `grid-columns.tsx`, building `ColGroupDef`s from
      `CONVERSATION_PROVENANCE_GROUPS` by looking each field up in `CONVERSATIONS_TRACE_COLUMNS` so band and
      columns cannot drift. Set `marryChildren` and a per-group `headerTooltip`.
- [x] 12.4 Add a `.conversations-grid` block to `scss/ag-grid.scss` for the band's border and label alignment,
      following the `.heat-map-grid` precedent, and pass `groupHeaderHeight` from `ConversationsList`.
- [x] 12.5 Tests: the band's groups, labels, tooltips, derived marking, `marryChildren`, and that every column is
      attributed to exactly one group; the header component's colour-per-provenance, exhaustive mapping, and icon
      presence/absence and aria-hidden.
- [x] 12.6 Re-run lint and the full test suite

## 13. Rating column

- [x] 13.1 Add `rating_up`/`rating_down` (nullable) to `ConversationRow`, `ConversationRatingRow`, `RatingCounts`,
      the `Rating` column field and the `RatingCount`/`RatingPositive` output aliases.
- [x] 13.2 Add `buildConversationRatingsQuery({ range, chatIds })` selecting `count(rate)` and `sum(rate)` grouped
      by `chat_id`, with the conversation query's time bounds so the column and the feedback filter agree.
- [x] 13.3 Create `utils/analytics/conversation-ratings.ts`: derive the up/down split from count and sum, clamped
      to `[0, total]` since the DSL has no conditional aggregation and `sum` only equals the positive count while
      ratings are the 1/0 a DIAL thumb normalizes to. Include `unresolvedRatings` for the failure path.
- [x] 13.4 Resolve ratings in the action *after* the conversation query, restricted by `in` to the ids on screen
      rather than reusing the capped candidate set; skip it for an empty page and leave the counts unresolved when
      it fails, so the cell shows nothing instead of a false zero.
- [x] 13.5 Create `List/RatingCellRenderer.tsx` rendering both counts at all times, colouring only the side that
      carries ratings, with filled icons when active and a text label per side for assistive technology. Give the
      column the width the two pairs need.
- [x] 13.6 Give the fixtures a rating list per conversation covering positive-only, negative-only, both
      directions, unrated and multi-rated, and derive the counts from it.
- [x] 13.7 Correct the mock feedback tests: positive and negative are **not** disjoint. The candidate query filters
      rate rows before grouping, so a conversation rated both ways matches both states — the earlier disjointness
      assertion only held because each fixture carried a single rating.
- [x] 13.8 Tests: the split's derivation, clamping, string/number tolerance and unresolved cases; the action's
      post-fetch ordering, empty-page skip and failure path; the renderer's always-both-counts, per-side colouring
      and unresolved blank.
- [x] 13.9 Re-run lint and the full test suite

## 14. Header spacing and the leftover filter control

- [x] 14.1 Set `filter: false` alongside `floatingFilter: false` on every conversations column, applied once in
      `CONVERSATIONS_TRACE_COLUMNS` rather than repeated per column. The shared `defaultColDef` supplies
      `filter: 'agTextColumnFilter'`, so suppressing only the floating row left a working client-side filter
      control in each header — reachable, and contradicting the server-side filtering the page is built on.
- [x] 14.2 Give the band and the header row their own heights and add vertical padding to the band label and the
      body cells, so the two header rows are not flush against each other.
- [x] 14.3 Tests: every column reports `filter: false`; the list passes both header heights.
- [x] 14.4 Re-run lint and the full test suite

## 15. Header: enrichment toggle, provenance line, summary pills

- [x] 15.1 Add `includeEnrichment` to `ConversationFilters`, plus `ConversationSummary` and `ProvenanceEntity`
      models. Move the provenance colour map out of the header-group component into the constants module so the
      grid band and the provenance line share one source of truth.
- [x] 15.2 Create `Header/ConversationsProvenanceLine.tsx` listing the contributing entities by their real catalog
      names, coloured by provenance, with the enrichment marked pending and dropped from the list when the toggle
      is off.
- [x] 15.3 Create `Toolbar/EnrichmentsToggle.tsx` — a `DialButton` carrying the shared `PreviewTag` and reporting
      `aria-pressed`, named "Enrichments" rather than the design's "Classifications".
- [x] 15.4 Create `utils/analytics/conversations-summary.ts` computing the four pill values from the rows on
      screen, summing cost with `Big` and rounding for display, and flagging a full page as truncated.
- [x] 15.5 Create `Header/ConversationsSummary.tsx` rendering the pills, showing the count as a lower bound when
      the result is capped and explaining the scope in a hint.
- [x] 15.6 Thread `includeEnrichment` through the hook, page prefetch, server action and fixtures; restructure the
      view header (title + provenance line left, pills right) and the toolbar (search + period left, feedback +
      enrichments right).
- [x] 15.7 Tests: the summary's counts, cost precision, unresolved-rating handling and truncation flag; the
      provenance line's entity names, colours, pending marker and enrichment-off case; the toggle's pressed state
      and callback; the view sending the flag and rendering both header pieces; the fixtures dropping enrichment
      values while keeping the same conversations.
- [x] 15.8 Re-run lint and the full test suite

## 16. Remove the enrichment toggle

- [x] 16.1 Delete `EnrichmentsToggle` and the `includeEnrichment` plumbing it existed to drive — the hook state,
      the `ConversationFilters` field, the fixture branch, the provenance-line prop and the i18n strings — rather
      than leaving state no control can reach.
- [x] 16.2 Update the toolbar, view, mock and action specs; the provenance line now always lists the enrichment.
- [x] 16.3 Re-run lint and the full test suite

## 17. Composed cell rendering

- [x] 17.1 Add `first_activity`, `model` and `model_count` to `ConversationRow` and `ConversationField`, and
      `deployment` to `UsageLogField`. Select `min(request_time)`, `min(deployment)` and
      `count(distinct deployment)` — `deployment` is catalogued, non-sensitive, and the second ORDER BY column.
- [x] 17.2 Create `utils/analytics/conversation-formatting.ts` with compact numbers, significant-digit cost,
      relative time and conversation span. The clock is a parameter, not read inside, so the helpers stay
      deterministic. Add the model dot palette as theme-token constants.
- [x] 17.3 Create `List/ProjectCellRenderer.tsx` stacking project over a model chip with a name-derived colour dot
      and a `+N` when the conversation used several deployments, since `min(deployment)` reports only one.
- [x] 17.4 Create `List/ActivityCellRenderer.tsx` stacking relative activity over the span, keeping the absolute
      instant on hover.
- [x] 17.5 Point the tokens column at the compact formatter and the cost column at the significant-digit one, and
      colour cost. Leave `currencyValueFormatter` untouched so other price columns do not shift.
- [x] 17.6 Give the fixtures a model, a distinct-model count and a span.
- [x] 17.7 Tests: each formatter's cases and empty/unparseable inputs; both renderers' composed output and
      degraded states; the query's new aliases and which aggregates set `distinct`.
- [x] 17.8 Update the column spec, whose assertions encoded the previous formatting — including the one
      documenting the unrounded cost, now resolved for this page.
- [x] 17.9 Re-run lint and the full test suite

## 18. Search the conversation title and snippet

- [x] 18.1 Add `USE_CONVERSATION_SUMMARY_ENRICHMENT: boolean = false` and the dotted enrichment field names to the
      constants module, gating **both** the enrichment select entries and the enrichment search predicates behind
      one flag so a title can never be displayed without being searchable.
- [x] 18.2 Extend the fixture search to match title and snippet — the fixtures stand in for the enrichment, so they
      should behave as it will. On the live path no row carries a title, so nothing is missed today.
- [x] 18.3 Update the search placeholder, which promised only conversation and project.
- [x] 18.4 Replace the test asserting search does *not* match a title; add title, snippet, case-insensitivity and
      id-still-reachable cases, plus a spec exercising the flag's available branch through a module re-import so
      the enrichment path is not dead code.
- [x] 18.5 Re-run lint and the full test suite

## 19. Consolidate the utils and isolate the mock

- [x] 19.1 Merge `conversations-trace-query.ts` and `conversations-feedback-query.ts` into
      `conversations-queries.ts` — one module for the three queries this page issues, sharing the imports and the
      empty-string literal the two duplicated.
- [x] 19.2 Merge `conversation-ratings.ts` and `conversations-summary.ts` into `conversation-rows.ts`, and make the
      summary one pass instead of two filters plus a reduce.
- [x] 19.3 Extract `scalar.ts`: the ADAS "numeric arrives as a string" coercion was solved three times over
      (`toNumber`, `toMillis`, `toBig`), each with its own null/empty handling. `toBig` returns `null` rather than
      zero for an unparseable value, so a summary can treat it as zero while a cell renders nothing — collapsing
      the two behaviours into one silently turned an unparseable cost into `$0`.
- [x] 19.4 Share one unit-cascade helper across the three time/count formatters, which each repeated the same
      find-the-right-unit loop.
- [x] 19.5 Drop the `ge` primitive — nothing outside its own test used it, since `timeRangePredicates` builds both
      bounds inline.
- [x] 19.6 Move the mock to `src/mocks/analytics/conversations-trace.ts` and fold everything that dies with it into
      that file: the fixtures, the up/down split that had lived in production code as `ratingsFromRates` while only
      the mock called it, and `USE_CONVERSATIONS_MOCK`. Deleting the file plus one import in `actions.ts` now
      removes the mock whole. Outside `utils/` deliberately — `.claude/rules/utils.md` requires every util to be
      tested, and this is fixture data that should not be.
- [x] 19.7 Delete the mock's 363-line spec: temporary fixtures are test data, not a subject under test.
- [x] 19.8 Merge the specs that followed the merged sources and prune the assertions that restated each other,
      keeping the ones grounded in a real backend rejection. Add the missing coverage for
      `buildConversationRatingsQuery`, which had none of its own.
- [x] 19.9 Delete the enrichment-branch spec, folding its two load-bearing assertions into the query spec.
- [x] 19.10 Re-run lint and the full test suite

## 20. Fix the build, the rating split and the cost formatter

- [x] 20.1 Type `fetchRatedChatIds`/`withRatings` on `Token`, not `string` — `getUserToken` returns
      `NextAuthToken | undefined` and `executeAction` takes `Token`, so `string` broke in both directions.
- [x] 20.2 Cast the query result through `unknown`: `StructuredQueryResult.rows` is `Record<string, unknown>[]`,
      which does not overlap the row interfaces (TS2352).
- [x] 20.3 Give the four component specs a `row()` factory instead of inline row literals. Repeating the literal is
      why every field added to `ConversationRow` broke them; vitest does not typecheck, so only the build caught it.
- [x] 20.4 Add `build` to the change's quality gate. Lint and tests both stayed green while `nx build` failed —
      the type errors were only reachable through the build, and 8.1/8.2 checked lint and tests alone.
- [x] 20.5 Replace the derived rating split with one `count(rate)` query per direction, reusing the feedback
      filter's own `gt(rate, 0)` / `le(rate, 0)` predicates. `rate` is signed — `MessageRating { Like = 1,
      Dislike = -1 }` — so `sum(rate)` is not the positive count: one like and one dislike rendered as 0 👍 / 2 👎.
      Drop `deriveRatingCounts`, the `[0, total]` clamp that made every wrong answer look plausible, and
      `FeedbackField.RatingPositive`.
- [x] 20.6 Rewrite the tests that passed *because* of that bug, and the spec and design prose that asserted a
      `1`/`0` rate domain. The design section now records why the original reading was wrong, since the mistake was
      in reading the contract, not in the code.
- [x] 20.7 Fix `formatSignificantCost`: the trailing-zero strip was unanchored, so `10` rendered as `$1` — a silent
      10x understatement on a column read verbatim — and `toPrecision(2)` went exponential past two integer digits
      (`$1.2e+3`). From a dollar up, delegate to the shared `formatNumberWithExponent`; below one, derive the scale
      from the exponent so Big never switches to exponential.
- [x] 20.8 Point `formatCompactNumber` at the shared `formatNumberWithExponent` instead of a local units table, so
      a token count reads the same here as everywhere else in the app. Its output carries a space (`1.3 M`), which
      moves the two specs that asserted the local format.
- [x] 20.9 Re-run lint, the full test suite and `nx build`

## 21. Review nits

- [x] 21.1 Fix the shared `formatNumberWithExponent`: it chose the unit before rounding, so `999_999` read as
      `1000 K` rather than `1 M`, and anything past `T` indexed off the unit array into `1 undefined`. Fixed at the
      source rather than worked around locally — four other call sites carried the same defect. Existing outputs
      (`135 K`, `13.7 M`, `123`) are unchanged; boundary cases added to its own spec.
- [x] 21.2 Replace the mount-flag guard in `use-conversations.ts` with a comparison on filter identity. StrictMode
      runs effects twice and Next enables it by default for the App Router, so the flag treated the second pass as a
      change and refetched what the server had just prefetched. Dev-only, but the fix is smaller than the flag.
- [x] 21.3 `import { Big }` in `scalar.ts` and `conversation-rows.ts` — the convention in five other files, and the
      only two lint warnings this change had added (34 → 32).
- [x] 21.4 Gate the search placeholder on `USE_CONVERSATION_SUMMARY_ENRICHMENT`. It promised title search
      unconditionally while titles are reachable only on the mock path.
- [x] 21.5 Delete the unused `ConversationsTraceI18nKey.Project` and its string — the column uses `ProjectModel`.
- [x] 21.6 Make the summary pills' lower-bound caveat keyboard-reachable: `role="group"` + `tabIndex` with the hint
      as visually-hidden content. An `aria-label` was the wrong tool — it would have replaced the figure with its
      own caveat as the accessible name.
- [x] 21.7 Reword `ComposedOver` from "Domain view composed over generic entities" to "Data from" — the original was
      implementation vocabulary in a user-facing header.
- [x] 21.8 Re-run lint, the full test suite and `nx build`

## 22. Surface a failed request, and drop the last two glyphs

- [x] 22.1 Report a failed conversations request instead of rendering it as an absence: an error toast on the
      client refetch path (`getErrorNotification` + `useNotification`, the convention the Tables view already
      follows) and `ConversationsLoadFailed` as the empty state's title, replacing "No conversations". An
      emptied grid alone reads as a period with no traffic, which is the opposite of what an ADAS outage means.
- [x] 22.2 Make the server prefetch test `result.success`. The action returns a failure in its
      `ServerActionResponse` rather than throwing, so `result.response?.rows ?? []` had turned every failure
      into a silent empty period that the `try/catch` never saw. It reports the failure through
      `hasInitialLoadError` rather than a toast, which a server component cannot raise.
- [x] 22.3 Clear the failed state on the next successful request, so a recovered query stops claiming an error.
- [x] 22.4 Replace the last two unicode glyphs with tabler icons per `.claude/rules/components.md` §6:
      `IconCirclesRelation` for the `⋈` entity join and `IconAsterisk` for the `*` pending marker. The pending
      marker's meaning stays on the `title` attribute, so the icon is `aria-hidden` decoration.
- [x] 22.5 Point the mock-switch requirement in `spec.md` at `src/mocks/analytics/conversations-trace.ts` —
      task 19.6 moved the constant but the requirement still named the constants module, so an operator
      following the spec would find nothing to flip.
- [x] 22.6 Re-run lint, the full test suite and `nx build`

## 23. Spec review: drop what is not a functional requirement

- [x] 23.1 Fix the rate domain in the feedback-filter requirement. It still read "a negative thumb is stored as
      `0`", the premise 20.5 disproved, while the rating requirement in the same document already recorded the
      signed `1`/`-1`. The `le(rate, 0)` predicate is unchanged — only the reason for it was wrong, and it is the
      reason a later reader would build on.
- [x] 23.2 Stop requiring the `ge` builder primitive that 19.5 deleted. The `ge` *node* in the emitted query
      stays — `timeRangePredicates` supplies it — so only the primitive list and its scenario change; the
      requirement now says the builder deliberately has no lower-bound primitive of its own.
- [x] 23.3 Take the AG Grid wrapper internals out of the spec: the `defaultColDef`/`additionalGridOptions` spread
      order, `storageKey` vs `fitGridWidth`, `ROW_HEIGHT`, `ColGroupDef`/`marryChildren`/`groupHeaderHeight`,
      `restrictSort`, `GridView`, `DialNoDataContent`, and the dotted-`field` nested-path rule. The behaviour they
      existed to protect is kept in functional terms (no sortable column, no reachable column filter, own row
      height, a column cannot leave its provenance group, enrichment columns must be aliased). The two traps not
      already in `design.md` — needing *both* filter flags, and why the alias is required — moved there, since a
      later reader who does not know them reintroduces the bug.
- [x] 23.4 Delete the page-header provenance-badge paragraph. It specified the absence of a thing by narrating its
      removal, which is a changelog entry, not a requirement.

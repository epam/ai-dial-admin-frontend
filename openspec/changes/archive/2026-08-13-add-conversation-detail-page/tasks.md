> A browser-verification task (`spec-browser-verify`) was offered for this change's browser-observable
> scenarios and declined. Acceptance rests on the unit tests in group 8.

## 1. Confirm the data contract

- [x] 1.1 Query `conversations` in row mode for one `chat_id` selecting all 13 columns (`chat_id`,
      `project_id`, `user_hash`, `turn_count`, `first_request_time`, `last_request_time`, `prompt_tokens`,
      `completion_tokens`, `total_tokens`, `total_price`, `success_count`, `duration_ms`, `avg_duration_ms`)
      and record which return values — **all 13 return values**; `duration_ms`/`avg_duration_ms` are `0` and
      are not surfaced, `project_id` returned an empty string
- [x] 1.2 Query `rate_analytics` in row mode for a rated `chat_id` selecting `response_id`, `rate`,
      `request_time` with `include_total`, confirming the wire shape the feedback panel will consume —
      `totalCount` populated, `rate ∈ {0, 1}`, `response_id` of the form `chatcmpl-…`
- [x] 1.3 Record any column from 1.1 that does not return a value as a field definition bound to nothing in
      task 2.4, rather than treating it as available — none; no column needs an unbound definition

## 2. Query primitives, models and constants

- [x] 2.1 Add an `eq` predicate helper to `src/utils/analytics/query-build.ts` alongside the existing
      `le`/`ne`/`gt`/`ico` helpers, using the already-declared `QueryOperator.Eq`
- [x] 2.2 Add `buildConversationDetailQuery` to `src/utils/analytics/conversations-queries.ts` — row mode over
      `conversations`, `eq` on `chat_id`, all 13 columns, limit 1, and **no** time-range predicate
- [x] 2.3 Add `buildConversationFeedbackQuery` to the same file — row mode over `rate_analytics`, `eq` on
      `chat_id`, selecting direction, recorded time and response id, sorted most recent first, with
      `include_total` and no time-range predicate
- [x] 2.4 Add detail types to `src/models/analytics/conversations-trace.ts`: the full conversation record, a
      feedback row, a panel definition and a field definition whose column binding is optional
- [x] 2.5 Add the unavailable-value marker and the panel definitions (usage, metadata, feedback) to
      `src/constants/analytics/conversations-trace.ts`, keeping const values out of the models file. The
      classification panel was built and then removed: every field in it was unavailable, so it stated a
      shape the system does not record
- [x] 2.6 Add a no-source member to `ColumnProvenance` and its muted theme-token entry to
      `PROVENANCE_TEXT_CLASS`, so every provenance value still maps to a colour

## 3. Server actions and route

- [x] 3.1 Add `getConversationDetail(chatId)` and `getConversationFeedback(chatId)` to
      `src/app/[lang]/conversations-trace/actions.ts`, reusing its private `token()` helper and
      `analyticsDataApi.executeAction`, returning `ServerActionResponse`
- [x] 3.2 Create `src/app/[lang]/conversations-trace/[id]/page.tsx` — async server component,
      `export const dynamic = 'force-dynamic'`, `decodeURIComponent` of the id param, the
      `isAnalyticsForbidden()` guard rendering `Page403`, both queries awaited, and props passed to the view
- [x] 3.3 Call `notFound()` only when a query **succeeded and returned zero rows**; on a failed query render
      the error state from task 5.5 instead, so a backend outage cannot report a conversation as nonexistent

## 4. Shared rating component

- [x] 4.1 Extract `RatingCount` out of
      `src/components/Analytics/ConversationsTrace/List/RatingCellRenderer.tsx` into its own component file,
      leaving `RatingCellRenderer` as the AG-Grid adapter with its current early return when either count is
      `null`

## 5. Detail view

- [x] 5.1 Create the `src/components/Analytics/ConversationsTrace/Detail/` tree with a view shell laying out a
      main column and a right rail, reusing the class strings from
      `components/Analytics/QueryBuilder/Rail/BuilderRail.tsx`
- [x] 5.2 Build the header band: `chat_id` as the heading via `DialEllipsisTooltip` plus `CopyButton`, an
      unavailable title field, and the project / requests / span / last-activity / rating figures using the
      existing formatters in `src/utils/analytics/conversation-formatting.ts` and the shared `RatingCount`
- [x] 5.3 Build the timeline region in the chat-column layout mirrored from
      `components/Assets/Conversations/View/Conversations.tsx`, falling back to one labelled statement that
      message content is unavailable when a conversation has no turns
- [x] 5.4 Build the panel renderer that walks the definitions from task 2.5, resolving each field to
      available / empty / unavailable and rendering a zero as a number, reusing
      `components/Analytics/QueryBuilder/Common/SectionBlock.tsx` for panel headers and the
      `grid grid-cols-[auto_1fr]` row layout from `components/Runs/Details/DetailSection.tsx`
- [x] 5.5 Build the load-error state, naming the conversation and distinct from the not-found path
- [x] 5.6 Declare the feedback list partial when `totalCount` exceeds the number of rows requested

## 6. Navigation from the log

- [x] 6.1 Add a `conversationDetailHref(chatId)` helper that URL-encodes the id, mirroring `tableDetailHref`
      in `src/components/Analytics/Tables/utils.ts`
- [x] 6.2 Wire `onCellClicked` in `src/components/Analytics/ConversationsTrace/List/ConversationsList.tsx`
      through `navigateEntityUrl` from `src/components/EntityListView/utils/on-cell-clicked.ts`, add the
      row pointer affordance via `rowClassRules`, and handle `Enter` on a focused cell for keyboard parity

## 7. Strings

- [x] 7.1 Add the new `ConversationsTraceI18nKey` members to `src/constants/i18n.ts` and their values to
      `src/locales/en.ts` at matching nesting — including the requests label, which must not reuse the
      existing `Turns` string

## 8. Unit tests

- [x] 8.1 Spec both new query builders: entity and row mode, the `eq` filter on `chat_id`, the full 13-column
      selection, `include_total` on the feedback query, and the **absence** of any time-range predicate
- [x] 8.2 Spec the `eq` helper in `src/utils/analytics/tests/query-build.spec.ts`
- [x] 8.3 Spec the panel renderer across all three states, asserting a `0` renders as a number, an empty
      `project_id` renders its empty presentation, and an unbound field renders the marker with its label
      still present
- [x] 8.4 Spec both server actions in `src/app/[lang]/conversations-trace/tests/detail-actions.spec.ts`,
      mocking `@/src/app/api/api` as the existing specs do
- [x] 8.5 Spec the route: the forbidden path, `notFound()` on a zero-row success, the error state on a failed
      query, and id decoding for an id containing `/` and for an already-percent-encoded id — supplying a
      per-spec `next/navigation` mock, since `test-setup.tsx` provides neither `useParams` nor a `useRouter`
      return value
- [x] 8.6 Spec the header band: the heading is the id, the title renders unavailable, the count is labelled
      requests and not turns, and zero ratings render as `0`
- [x] 8.7 Spec row-open navigation from the grid: the encoded href, the new-tab modifier path, and that
      sorting and filtering remain off
- [x] 8.8 Confirm the existing `RatingCellRenderer` specs pass unchanged after the extraction in task 4.1 —
      any needed edit means the extraction altered behaviour

## 10. Real message content

- [x] 10.1 Add `USAGE_LOG_ENTITY`, `CONVERSATION_TURN_LIMIT` and a `UsageLogField` enum, plus turn, message
      and transcript models
- [x] 10.2 Add `buildConversationTurnsQuery` — an aggregate over `trace_id`, no body columns, cost summed
      from `deployment_price` so a chain is not double-counted
- [x] 10.3 Identify a turn by the trace's earliest hop, not by a null `core_parent_span_id`: most
      conversations have no hop with a null parent, so that filter returned nothing and no turns rendered
- [x] 10.4 ~~Read real message content from the stored bodies~~ — built and then removed: the per-view
      encrypted body read destabilised the local database, so message text is a labelled fixture
- [x] 10.5 Add `getConversationTurns`; drop the body-reading query, action and parser so no code path can
      name a body column
- [x] 10.6 Add `src/mocks/analytics/conversation-transcript.ts`, seeded from the conversation id, sized by
      the real turn count, with a visible sample-data notice on the timeline
- [x] 10.7 Render the transcript as user/assistant messages with per-turn model, tokens and cost, and state
      the real turn count in the header
- [x] 10.8 ~~Spec the transcript parser~~ — removed with the parser in 10.5; the sample transcript is
      specced instead in `src/mocks/analytics/tests/conversation-transcript.spec.ts`
- [x] 10.9 Update the affected component and route specs for the new props and actions

## 11. Turn trace view

- [x] 11.1 Add span/trace models, `CONVERSATION_SPAN_LIMIT` and a category palette keyed to theme tokens
- [x] 11.2 Add `buildConversationSpansQuery` (one trace's hops, metadata only) and `getConversationSpans`
- [x] 11.3 Add `src/utils/analytics/conversation-spans.ts`: parent-span tree with absent-parent roots, offset
      from trace start, failure-first categorisation, trace totals using longest-hop latency and own-cost sums
- [x] 11.4 Add `formatDurationMs`, and surface the rollup's duration columns — `operation_duration_ms` is
      populated on real data, contrary to the dev observation this change was originally designed against
- [x] 11.5 Build the trace view: headline stats, category legend, selectable span tree, span detail rail,
      partial-list notice, and a control returning to the transcript
- [x] 11.6 Add `use-conversation-trace.ts` holding the open trace in component state, fetching through
      `useProtectedRequest`
- [x] 11.7 Add a trace control to each assistant message and swap the content in place
- [x] 11.8 Spec the span utilities: tree nesting, absent-parent roots, offsets, categorisation, totals

## 12. Review response, ui-kit reuse and accessibility

- [x] 12.1 Replace the hand-rolled transcript placeholder and the loose error-page id line with
      `DialNoDataContent`, and the hand-styled sample-data strip with `DialNotification`
- [x] 12.2 Extract `SpanCategoryBadge` and `ConversationRailShell` for the markup duplicated across the span
      list, the span detail and the conversation rail
- [x] 12.3 Extract `Common/LoadingOverlay`, replacing the overlay and its duplicated loader size in both the
      list and detail views, and announce the loading state
- [x] 12.4 Take `nowMs` from the server component instead of reading the clock during a client render, so the
      relative times cannot disagree between server and client
- [x] 12.5 Mark the covered content `inert` while the loading overlay is up, so nothing under it stays
      tabbable
- [x] 12.6 Name the rating counts with visually-hidden text rather than an `aria-label` on a generic element,
      which assistive technology ignores
- [x] 12.7 Report a failed turns query distinctly from a conversation that recorded no messages
- [x] 12.8 Restore the analytics access guard's error handling, so an unreachable service cannot replace the
      application shell
- [x] 12.9 Remove the dead `COST_TEXT_CLASS` conditional in the span detail and apply the cost colour to the
      cost row; flatten the nested ternary picking the list view's overlay
- [x] 12.10 Drop the unused i18n keys, models and enum members the earlier groups left behind, and read the
      shared unavailable marker rather than a second local copy
- [x] 12.11 Spec the turn and span query builders — group-by grain, own-cost sum, longest-hop duration,
      bounded reads and the absence of any body column — and both their server actions
- [x] 12.12 Spec the trace view, span list and span detail: totals, failure status, partial notice, load
      failure, selection, indentation and the unavailable markers
- [x] 12.13 Make the read-only grid assertion check every column it renders, rather than asserting the
      datasource is defined

## 13. Quality checks

- [x] 13.1 Run `npm run lint`, `npm run test` and `npx nx build ai-dial-admin`, and resolve anything they
      report

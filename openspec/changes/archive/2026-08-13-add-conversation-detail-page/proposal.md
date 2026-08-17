## Why

The Analytics Conversations log at `/conversations-trace` lists conversations but every row is a dead
end — there is no way to open one. A design exists for a per-conversation detail view (header identity
band, message timeline, right-hand panels for usage, classification, feedback and metadata).

Investigating what can actually back that design found the available data is thinner than it assumes, and
distributed across three sources rather than one. Several of the design's fields have **no source at all**
(title, sentiment, topic, language, resolution, region), the conversation rollup carries no per-turn
structure, and its `turn_count` is a count of proxy hops rather than turns — 930 against 3 real turns on a
measured conversation.

The message content does exist, in `dial_usage_log`'s request and response bodies, but it is awkward to
reach: both columns are `sensitive` (stripped from the query model for anyone without the elevated role) and
`heavy`, one row measured 1.2 MB, a streamed response is stored as its raw event stream rather than a
document, and reads of these columns proved intermittent against the local service.

So this change reads what is cheap and proven for the page's structure, reconstructs the transcript from a
single bounded body read, and marks every genuinely absent field explicitly. Message content is optional by
construction: when it cannot be read the page still renders everything else.

## What Changes

- **New route** `/[lang]/conversations-trace/[id]`, keyed on `chat_id`, mirroring the existing
  `tables/[id]` detail-route shape (async server component, `force-dynamic`, `decodeURIComponent`,
  `notFound()`), behind the same `isAnalyticsForbidden()` gate as the list page.
- **Row-click navigation** from the list into the detail page, reusing `navigateEntityUrl` and the
  `tableDetailHref` href-helper convention. Ctrl/Cmd/middle-click opens in a new tab.
- **Reads three entities** — `conversations` (all 13 columns, filtered to one `chat_id`, **not**
  time-bounded so a deep link resolves regardless of the list's active period), `rate_analytics` for
  ratings, and `dial_usage_log` for the turn list and the message transcript.
- **Real turns, sample messages.** Turns come from each trace's earliest hop, giving a true turn count —
  measured at **3 turns against the rollup's 930 requests** — plus each turn's real tokens, cost and call
  count. The message text is **sample content**, seeded from the conversation id and carrying a visible
  notice saying so.
- **The body columns are never read.** They are `heavy` and encrypted at rest, reach megabytes per row, and
  the route re-renders on every view — so reading them charged a decompress-and-decrypt of a megabyte-scale
  column to every page load and destabilised the local database, while every other query on the page stayed
  under 0.3s.
- **The design's Classification panel is not built.** Sentiment, topic, language and resolution have no
  source on either environment, and a panel of nothing but `—` states a shape the system does not record.
  Fields that sit *alongside* real ones still render `—` next to their label, so individual gaps stay
  visible:

  | Design region | Real | Rendered `—` |
  |---|---|---|
  | Header | `chat_id` (h1), project, requests, span, last activity, 👍/👎 | title, model chip |
  | Message timeline | real turn count, per-turn tokens/cost/calls | message text is **sample content**, labelled as such |
  | Usage panel | tokens in, tokens out, total tokens, cost | — |
  | Feedback panel | rating direction, rated-at | turn attribution, comment |
  | Metadata panel | chat_id, user_hash, project_id, started, success count | trace_id, deployment, region |

- **The Turns figure is relabelled to requests.** `conversations.turn_count` is a `count()` of usage-log
  rows, not of turns — measured at 2,190 rows across 12 actual traces for one real conversation. The
  column's own description reads *"Number of turns (requests)"*. The real turn count is resolved instead by
  an aggregate over `dial_usage_log` grouped by `trace_id`, and the header states both figures under
  distinct labels. It cannot be materialised into the rollup, because pipeline measures have no `distinct`
  flag — so the grid's Turns column keeps the rollup's request count.
- **`eq` is added to the query-primitive set** in `utils/analytics/query-build.ts`. `QueryOperator.Eq`
  already exists in the query model but has no builder helper; filtering to a single `chat_id` needs one.
- **`RatingCount` is extracted** from inside `List/RatingCellRenderer.tsx` into a shared component so the
  header thumbs and the grid cell render identically from one source.
- The design's **"Open in Query" button is not built.** The query builder accepts no params and reads
  nothing from the URL, so a working deep link means new plumbing in a separate feature.

## Capabilities

### New Capabilities

None — this extends the existing analytics capability.

### Modified Capabilities

- `analytics`: adds requirements for the conversation detail route and its access guard, the
  single-conversation query over the `conversations` entity, the header identity band, the turn list derived
  from root hops, the message transcript read from the stored bodies and its fallback, the four sidebar
  panels and their provenance labelling, the explicit unavailable-value convention, and row-click navigation
  from the list. Amends
  `Read-only conversations grid` to cover the new row-click affordance, which today asserts the grid is
  inert.

## Non-goals

- Reading real message content. Verified reachable — one bounded single-row read reconstructs a whole
  exchange from the last turn's request body, and streamed replies rejoin from their event fragments — but
  charging a megabyte-scale encrypted column to every page view is not an acceptable cost for this route,
  so the transcript renders labelled sample content instead.
- Extending the `conversations_rollup` pipeline. Adding `model_first`/`model_last`,
  `reasoning_tokens`, `cached_prompt_tokens` or `cache_creation_tokens` would fill the model chip and
  the rest of the usage panel with ordinary measures and no backend code change, but it requires
  provisioning on two environments and re-declaring the pipeline (which resets its cursor to a full
  rebuild).
- A `conversation_turns` table at `(chat_id, trace_id)` grain. This is the single largest unlock — it
  converts the timeline from a placeholder into real per-turn rows — and needs no backend code change,
  but it is a new table on two environments plus a much larger frontend surface.
- An exact turn count via a `distinct` flag on pipeline measures (a backend change to
  `MeasureRequest`/`Measure`; the function catalog already advertises `distinct_supported: true` for
  `count`).
- A title/summary/classification enrichment on `conversations`. The group-grain enrichment mechanism
  keyed on `chat_id` exists and is unused; provisioning one needs an LLM evaluator and model access.
- "Open in Query" deep-linking, which requires `searchParams` plumbing and an `initialQuery` prop in
  the query-builder feature.
- Column sorting, filtering or paging on the detail page — it renders one conversation.

## Impact

- **New**: `app/[lang]/conversations-trace/[id]/page.tsx` and a `components/Analytics/ConversationsTrace/Detail/`
  component tree (view, header band, message timeline, sidebar rail and its four panels), plus
  `utils/analytics/conversation-transcript.ts`.
- **Modified**: `app/[lang]/conversations-trace/actions.ts` (a single-conversation action alongside the
  existing three), `utils/analytics/conversations-queries.ts` (detail-scoped, time-unbounded builders),
  `utils/analytics/query-build.ts` (`eq`), `models/` and `constants/analytics/conversations-trace.ts`
  (detail types, panel definitions, the unavailable-value marker),
  `List/ConversationsList.tsx` (`onCellClicked`), `List/RatingCellRenderer.tsx` (extract `RatingCount`),
  `constants/i18n.ts` + `locales/en.ts` (new `ConversationsTraceI18nKey` members).
- **Reused, unchanged**: the chat-bubble markup in `Assets/Conversations/View/Conversations.tsx`, the
  right-rail shell `QueryBuilder/Rail/BuilderRail.tsx`, `QueryBuilder/Common/SectionBlock.tsx`,
  `Runs/Details/DetailSection.tsx`, `Runs/Details/ExecutionStatusBar.tsx` chip/separator idioms, every
  formatter in `utils/analytics/conversation-formatting.ts`, `useProtectedRequest`, and the
  `PROVENANCE_TEXT_CLASS` / `ColumnProvenance` provenance convention.
- **Backend/env**: none. No new table, pipeline, column or permission.
- **Cross-feature risk**: extracting `RatingCount` touches a component the list grid renders, so the
  existing `RatingCellRenderer` specs must keep passing unchanged. `test-setup.tsx` mocks
  `next/navigation` as `{ useRouter, usePathname }` only, so the new route's specs need their own
  `useParams` mock and a `useRouter` return value.

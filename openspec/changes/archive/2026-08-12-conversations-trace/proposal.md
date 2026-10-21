## Why

The Analytics section can query `dial_usage_log` interactively (Query Builder) but has no purpose-built
view of it. The most-requested read of that data is conversation-level: one row per `chat_id` with turn
count, token spend, cost and last activity. Today an operator has to hand-author an aggregate query in
the Query Builder every time.

This change lands the **base visual** for that view — a real route, a real query, and a grid — so
subsequent work (feedback, enrichments, search, paging, detail navigation) extends a page that already
exists rather than starting from a blank one. It ships with a hardcoded mock switch so the page is
demonstrable and reviewable before a populated ADAS backend is available.

## What Changes

- New Analytics route `/conversations-trace`: server component, `force-dynamic`, `isAnalyticsForbidden()`
  → `Page403` guard, prefetches rows and passes them to a client view.
- New minimal query layer for the **analytics** structured-query DSL (`models/analytics/query.ts`):
  builder primitives plus one composed query, `buildConversationListQuery({ range })`.
- Aggregate query over `dial_usage_log` grouped by `chat_id`, selecting exactly the five aliases the grid
  displays — `turns`, `tokens`, `cost`, `last_activity`, `project_id` — over a fixed 7-day range, ordered
  by `last_activity desc, chat_id asc`, offset page limit 20.
- Server action with a **hardcoded, manually-flipped** mock switch (a typed `boolean` constant, no env
  var, read only on the server). Default `true`.
- Deliberately unpretty fixtures (10–20 rows) that reproduce real ADAS value shapes — full-scale
  decimals, null metrics, empty `project_id`, realistic `chat_id` length — so formatting and layout
  defects surface in this PR rather than on the first flip to the live backend.
- Read-only grid: six visible columns, sorting disabled, no filter row, no column-state persistence.
  The conversation column renders through a cell renderer and the page owns `rowHeight`, so later
  commits fill slots instead of replacing the grid.
- Filter toolbar — a debounced search box plus the shared `TimeFilter` control, matching the dashboard.
  **Every filter change re-queries the backend**: search becomes an `or` of two `ico` (ILIKE) predicates
  on `chat_id` and `project_id`, and the period becomes the query's time bounds. Nothing is filtered
  client-side; the grid only ever holds one page, so narrowing that would hide matches outside it and
  present a wrong answer as a complete one. Search covers the conversation id, the project and the enrichment's
  title and snippet; raw message content is not searchable, since `request_body` is catalogued `sensitive`. The
  enrichment columns are referenced only once the enrichment exists — one flag gates selecting and searching them
  together — and until then no row carries a title, so nothing is missed.
- Feedback filter (All / 👍 / 👎 / Rated) via the shared `DialSegmentedControl`. Feedback lives in the separate
  `rate_analytics` entity and the DSL has no joins, so a feedback state resolves as **two** server-side
  queries — candidate `chat_id`s first, then the conversation query narrowed by `in` — while the default All
  state stays a single query.
- Conversation title and snippet rendered in the conversation cell, populated by fixtures against the contract
  of a future `chat_id`-grain enrichment. No query references them yet (an unknown field is a 400), and the
  cell degrades to the conversation id when they are absent, which is every row on the live path.
- Provenance band above the column headers, reusing the evaluation grids' grouped-header pattern, attributing
  every column to the source it comes from and marking enrichment-derived data with its own colour and icon.
  Labels state only what is true: Tokens and Cost sit under `dial_usage_log`, not under enrichment, because they
  are direct sums over its columns.
- Rating column showing each conversation's positive and negative rating counts, attributed to `rate_analytics`.
  Resolved by a query issued after the conversation query and restricted to the ids on screen, so a displayed
  conversation can never be misreported as unrated. Each direction is counted by its own query under the same
  predicate the feedback filter uses. `rate` is signed (`-1` for a dislike, `0` for a normalized boolean
  `false`), so `count` and `sum` cannot separate the directions, and the language has no conditional aggregation
  to do it in one query.
- Header: a provenance line naming the entities the view is composed over — real catalog names, coloured to match
  the grid band, with the unregistered enrichment marked pending — plus summary pills for conversations, rated,
  negative and cost. The pills are computed from the rows on screen and marked as a lower bound when the result
  fills a page, since no total query is issued.
- Composed cells: project over a model chip with a name-derived colour dot, relative activity over the
  conversation span, compacted token counts, and cost rounded to significant digits. This adds `min(deployment)`,
  `count(distinct deployment)` and `min(request_time)` to the query. Cost rounding is local to this page and
  leaves the shared currency formatter — and every other price column — untouched.
- Wiring: `ApplicationRoute` entry, Analytics menu sub-item labelled "Conversations", i18n keys and
  English strings.

Naming: code identifiers and the route use `conversations-trace` (avoiding the existing
`/conversations` DIAL Core route); every user-facing string reads "Conversations".

## Non-goals

- Sorting, paging / Load more, stat tiles. Note that without paging the filtered
  result is still capped at 20 rows, so a broad search term shows the 20 most recent matches, not all of
  them. Paging is the fix and is the natural next change.
- Searching by user. `user_hash` is visible (deliberately not `sensitive`, so read-only roles can do
  per-user analytics), so it could be added to the `or` group cheaply — but it holds a de-identified
  surrogate, so free text never matches it and only someone pasting a known hash benefits. Deferred until
  there is a path that supplies the hash.
- A comment indicator on the Rating column. `rate_analytics.comment` is catalogued `sensitive`, so a
  non-FULL_ADMIN caller cannot select or even count it.
- Row-click navigation and conversation expansion — there is no detail page yet.
- Registering the `conversation_summary` enrichment that will actually supply the title and snippet. The
  frontend renders them from fixtures and its contract is fixed (`title`, `snippet`, both nullable, `chat_id`
  grain); creating the evaluator, rule and catalog entry is backend work in its own change.
- Replacing or merging the existing Usage Log "Conversations" tab, which reads a different backend
  (telemetry API) and stays as-is.

## Capabilities

### New Capabilities

None. Analytics requirements consolidate into the single master spec `openspec/specs/analytics/spec.md`
rather than a per-page capability folder, so this change ships as a delta against `analytics`.

### Modified Capabilities
- `analytics`: **ADDS** the requirements for the `/conversations-trace` page — route and access guard,
  the conversation aggregate query and its contract rules, server-side filtering via the search box and
  time control, the mock switch, and the read-only grid with its empty state. **MODIFIES** the three
  requirements that enumerate the Analytics menu group's
  sub-items as exactly "Query Builder" and "Tables" — the group definition, the feature-flag gating
  ("both its sub-items"), and the preview-tag rule ("Sub-items … MUST NOT each carry their own preview
  tag") — so all three account for a third sub-item.

## Impact

**New source** — `src/models/analytics/conversations-trace.ts`,
`src/constants/analytics/conversations-trace.ts`, `src/utils/analytics/query-build.ts`,
`src/utils/analytics/conversations-queries.ts`, `src/utils/analytics/conversation-rows.ts`,
`src/utils/analytics/conversation-formatting.ts`, `src/utils/analytics/scalar.ts`,
`src/mocks/analytics/conversations-trace.ts`,
`src/app/[lang]/conversations-trace/{page.tsx,actions.ts}`,
`src/components/Analytics/ConversationsTrace/{ConversationsTraceView.tsx,List/ConversationsList.tsx,List/ConversationCellRenderer.tsx,Toolbar/ConversationsToolbar.tsx,use-conversations.ts}`.

**Modified** — `src/types/routes.ts`, `src/components/Menu/menu-configuration.tsx`,
`src/constants/i18n.ts`, `src/locales/en.ts`, `src/constants/grid-columns/grid-columns.tsx`.

**Shared code touched** — `grid-columns.tsx` gains one column array and reuses the module-private
`restrictSort`; no existing array changes. `menu-configuration.tsx` gains one item inside the existing
Analytics group, which is already flag-gated, so the page is invisible when `analyticsEnabled` is false.

**Backend** — read-only, existing `POST /v1/queries/execute` via `analyticsDataApi.executeAction`. No new
endpoint, no new API class. With the mock switch at its default the only backend call is the existing
access check.

**Not touched** — `src/utils/structured-query/build.ts` (targets the *evaluation* DSL with different
enums; reusing it would be a type error) and the Usage Log feature.

**Risk carried forward** — with the switch defaulting to mock, this change does not prove that ADAS
answers the query as expected. Three assumptions stay open until the first manual flip: that sorting by
the aggregate alias `last_activity` resolves, the wire type of a `DateTime64` aggregate, and the scale of
a `Decimal(38,12)` sum. The design mitigates the latter two by typing row fields to accept either shape;
the first is asserted by the ADAS `structured-query` spec but unverified here.

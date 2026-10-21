## Why

The Conversations Trace pages ship four hardcoded em-dashes — header Title, header Model, metadata
Trace, metadata Region — that were placeholders for data the analytics service did not expose when the
view was built. The ADAS schema has since grown: `conversations` now carries `traces`,
`conversation_insights.*`, three cache/reasoning token columns and `chain_price_total`, and a `turns`
entity exists that does server-side what `buildConversationTurnsQuery` currently does by hand over
`dial_usage_log`. Every placeholder except Region is now answerable, the grid reaches the insight
columns only as unlabelled hidden columns, and the page still identifies a conversation by `chat_id`
while a human-readable title sits unread in the schema.

**Amended 2026-08-20.** The change as first built reached those fields two ways: a curated column written in
code, and a schema-derived column generated from whatever the entity reports. The generic path produces
actively misleading columns. `conversation_insights.model` is the evaluator's own deployment, its
`display_name` is "Model", and the catalog renders a column headed **Model** holding it — every row of
2026-08-17 reading `gemini-2.5-flash-lite` because one evaluator produced all 137 insights that day, beside a
`deployments` array holding `fw.deepseek-v4-flash-0731`, which is what actually served the conversation. It
never is the conversation's model. `chain_price_total` reads as an alternative cost where it is really a
coverage gap; `sentiment_score` and `topic` restate `sentiment` and `topics`. So the curated set becomes the
whole set: a field the schema does not report simply has no column. The cost is accepted deliberately — a new
rollup field no longer appears without a frontend release, and an undesigned column that misleads is worse
than no column.

## What Changes

Detail page (`/conversations-trace/[id]`):

- Header **Title** reads `conversation_insights.title` and becomes the view's `<h1>`; the id moves into the
  meta row beside the project, turn count, span and last activity, keeping its copy control. An untitled
  conversation shows the unavailable marker as the heading, carrying an accessible name — a heading whose
  only text is a dash names nothing for a screen reader. `truncated` is stated per conversation here, where
  there is room to explain it.
- Header **Deployments** reads the rollup's `deployments` as recorded. It was first built as a *Model*
  field narrowed by the existing `narrowToModels` helper, matching the grid's Models column; review
  measured that narrowing against `turns.models` on dev and it disagreed in both directions — keeping
  three orchestrating application deployments the rollup excludes and dropping two embedding deployments
  the rollup includes because they were billed. Which value is a model is not derivable from the array, so
  **both** the header entry and the grid column are now labelled for the field they read, render it
  unnarrowed, and `narrowToModels` is deleted. A real per-conversation model set needs a
  conversation-level field the rollup does not carry: `turns.models` is per turn, no server-side union
  over it is expressible, and a union over a bounded turn list would understate a long conversation.
- Metadata **Trace** reads `conversations.traces`. The column is `heavy`, so it is named explicitly in
  the single-conversation select; its array is ordered lexicographically, not by turn, and its length
  is not queryable, so `turn_count` remains the count of record.
- Metadata **Region** and its i18n key are **removed**. DIAL records no region; the entry claimed a
  field the platform does not have, which is a different statement from "not yet available".
- Metadata **Successful** keeps its value and gains wording that matches what `success_count` now
  means: a trace with at least one successful hop, not a top hop that succeeded.
- The turn timeline reads the **`turns`** entity in row mode instead of aggregating `dial_usage_log`.
  Mapping is 1:1 (`first_request_time`, `hop_count`, `total_tokens`, `total_price`, `duration_ms`), and
  `trace_id` is present, so the span lookup is untouched. **BREAKING (behavioural):** `turns` is
  rebuilt on a cron roughly every 15 minutes while `dial_usage_log` is live, so a conversation younger
  than the refresh window loads no turns. This is an accepted, spec-recorded limitation of the switch.

List page (`/conversations-trace`):

- **The schema-derived catalog is removed.** The curated set is the whole set. A field the schema does not
  report has no column; a field it reports but nobody designed a column for has no column either.
- **Ten columns, six visible.** Conversation (`chat_id` + `conversation_insights.title` as one identity
  cell), Project, User, Activity and Cost visible, plus Rating; Turns, Tokens, Deployments and Topics
  hidden by default.
- **Fourteen fields leave the curated set**: `duration_ms`; the insight `sentiment`, `sentiment_score`,
  `topic`, `language`, `resolution_status`, `model`, `evaluator_version`, `enriched_at`, `group_version`;
  `cache_creation_tokens`, `cached_prompt_tokens`, `reasoning_tokens`; `chain_price_total`. `sentiment` and
  `resolution_status` go because their value vocabulary is declared in the evaluator's `response_schema` on
  the ADAS side and `describe_entity` reports only `type: "string"` — a usable filter would mean a second
  copy of the enum in the frontend, drifting silently when the evaluator is re-versioned. Both stay
  reachable in Query Builder.
- **Title and id merge into one identity column.** `TitleCellRenderer` is deleted; the conversation cell
  renders the title above the id. `conversationTitle` returns `string | null` and no longer falls back to
  the id — substituting it printed the id twice in one cell and read as though the conversation were named
  after its own hash. An untitled conversation shows the unavailable marker on the first line only.
- **Origins are named readably, in three real column groups**: Conversation (the rollup), Conversation
  insights (the enrichment), Ratings (the feedback source). `ProvenanceConversations: 'conversations'` and
  `ProvenanceFeedback: 'rate_analytics'` stop being raw table identifiers. `marryChildren` forces columns of
  one origin to be adjacent, and the resulting column order is accepted rather than worked around with a
  custom columns panel.
- **Topics renders as chips.** The stored value is a string whose separator is inconsistent in real data
  (`security, code review, validation` alongside `capabilities,error`), so it is split on `,`, trimmed and
  emptied-out before rendering through `TagsCellRenderer`. Unrecognised values render as-is.
- Projection follows visibility for curated field-backed columns, and the identity column's enrichment
  fields are projected unconditionally because that column cannot be hidden.

Both pages (added 2026-08-18, after browser verification):

- **Queries name only fields the queried entity reports.** The columns this change reads are catalog
  objects provisioned per ADAS instance, not part of the service — `conversations`, `turns` and the
  `conversation_insights` enrichment all report `system: false`. An instance can therefore lag, and the
  service rejects a whole query that names one unknown field rather than returning the columns it does
  have. As first written, this change took both pages down against an instance without the enrichment:
  the list query failed on `conversation_insights.title` and the detail query failed on all seven insight
  fields. The select is now intersected with the entity schema the view already fetches, so a field the
  instance does not expose is never requested and the rest of the page renders.
- A curated column whose field the instance does not report is **not rendered at all**, so an operator
  cannot enable a column that could never fill. After the 2026-08-20 amendment this is the only
  schema-driven column behaviour left, and Topics is the only column it can drop.
- A field absent from the fetched payload renders as **unavailable** rather than as empty, which is what
  the view's existing three-state model already means.
- The detail route gains a schema read. It is server-side, like the list route's, and only the
  single-conversation query waits on it; the feedback and turn reads stay parallel.

## Non-goals

- **A column filter on Activity.** Time is a toolbar concern. The period control already predicates on
  `last_request_time`, and the grid requirement already forbids a second control over the same dimension.
  It would also need new infrastructure the presets do not cover: AG Grid's date filter emits a date string
  and the service rejects a timestamp literal that is not epoch millis.
- **A copy control in the identity cell.** It would put a focusable node in every row of an infinite grid.
  The full id stays reachable through `DialEllipsisTooltip`, and the detail page one click away has copy.
- **Clickable topic chips.** Display and tooltip only; a chip that filters is a separate interaction
  decision.
- **A per-row truncation marker in the grid.** 1235 of 1432 insight rows are truncated — 86%. A marker
  firing on six rows in seven is background, not signal, so the grid states it once and the detail page
  states it per conversation.
- **Message transcript.** `mockConversationTranscript` stays exactly as it is, disclosure requirement
  included. ADAS exposes metrics and insights, not message bodies, so nothing here closes it; whether to
  drop the block or read it from DIAL Core is a separate decision.
- **Qualifying token figures.** `sum(*_tokens)` is inflated on routed chains (a chain repeats one call's
  counts on every hop — ~3.5% fleet-wide, 2–3× on routed turns). Both `turns` and `conversations` carry
  the defect and it is fixed in the rollups or not at all. The page shows the data as it comes.
- **Per-message tokens, cost, duration and rating.** DIAL reports usage per request, so per-turn is the
  finest grain that exists, and the timeline already attaches figures only to each turn's assistant
  message. No code change; the backlog item closes as already-correct.
- **`conversation_buckets.*`** — pre-computed histograms with no page to render them.
- **Request-count and query-cost work** (`totalCount`, `loadTotals` gating, server-action merge, schema
  caching, always-projected columns) — same files, separate change, so the two stay reviewable.
- **The other new `turns` columns** — `llm_call_count`, `mcp_call_count`, `mcp_tools`,
  `failed_hop_count`, `max_response_status`, `hop_duration_total_ms`. Reachable once the timeline reads
  `turns`, but each needs its own UI decision.
- **`conversation_insights.summary`** — no slot in the current layout; adding one is a design decision,
  not a placeholder to fill.
- **Free-text search over title.** Search continues to reach `chat_id` and `project_id` only; widening
  it changes a stated search contract.
- **The `duration_ms` / `avg_duration_ms` defect.** Parked by decision on 2026-08-18. The backend notes
  record both as wrong wherever a turn fans out into a chain — `duration_ms` sums hop durations that
  already contain their nested hops, and `avg_duration_ms` averages per hop rather than per turn; 46% of
  the conversations carrying duration data read wrong. The defect is still parked — but the Duration **column**
  is removed by this amendment, and its header tooltip was the only place the behaviour was disclosed to a
  reader. The caveat therefore moves to the Usage panel, which states both figures and until now stated them
  unqualified. Removing the column rather than hiding it is deliberate: a hidden column is one click from
  showing a wrong number with no warning attached. Fixing it properly needs an **aggregate** query over `turns` grouped by `chat_id` — not the page's
  bounded turn list, which would report the first 200 turns of a 911-turn conversation as its total, the
  error the header's turn-count rule already forbids. Separate change.
- **Provisioning the missing catalog objects.** `turns` and the `conversation_insights` enrichment exist
  on the shared dev instance but not on the one this app reads, and they were created through the admin
  API with no script in the ADAS repo. Standing them up is an environment task, not a frontend one.

## Verification status

Browser verification (2026-08-18) ran against an instance carrying the conversation rollup but **neither**
the `conversation_insights` enrichment **nor** the `turns` rollup. Every scenario it covered is therefore a
degradation path: a column absent, a title falling back to the conversation id, a timeline reporting a failed
read. The supportable conclusion is **"safe to deploy against a non-provisioned instance"**, not "works".

Confirmed on that instance: the grid's Deployments column names the field and renders it unnarrowed while the
header does not restate it, the list and detail pages render, the insight columns are omitted rather than
offered empty, Rating survives a schema that never reports it, projection follows column visibility for the
four token and cost columns the instance does carry, `traces` renders from an explicit heavy-column select,
Region is gone, and the successful-request label is restated.

**Not yet verified anywhere** — these scenarios stay open until a provisioned instance is available:

- an insight title rendering in the header or the grid;
- the Topics column appearing and carrying values;
- the timeline reading a `turns` row, its ordering by `first_request_time`, the clipped-list disclosure, and
  the trace drawer opening from a rollup-sourced turn.

## Deploy blockers

**`turns` must be provisioned on the target instance before this change ships.** The turn timeline previously
read `dial_usage_log`, a system table present on every deployment, so it worked everywhere. It now reads the
`turns` rollup, which is provisioned per instance — so on an instance without it, a feature that used to work
does not. The degradation is correct and states itself ("Could not load the turns for this conversation"), but
it is a functional regression, not a neutral gap, and provisioning is therefore a release condition rather
than a follow-up.

The cost is not only the turn figures. The sample transcript is sized from the **loaded turns**
(`mockConversationTranscript(chatId, turns.length)`), so an instance without the rollup renders no messages
either and the timeline falls through to its empty state. Provisioning restores both together.

Dropping the `dial_usage_log` fallback was a deliberate decision, taken on the **freshness lag** (a
conversation younger than the refresh window). The case where the entity is absent entirely was discovered
later, during verification, and was decided only as far as which message to show. It was never weighed as a
deploy blocker — this section records it as one.

The `conversation_insights` enrichment is **not** a deploy blocker: without it the affected columns are
omitted and the title falls back, which is the behaviour verified above.

## Capabilities

### New Capabilities

None. Every requirement affected already lives in the Analytics master spec.

### Modified Capabilities

- `analytics`: as amended 2026-08-20, six requirements change, two are removed and one is added —
  - *Conversation detail header identifies the conversation and states its turn count* — Title and Model
    become real values with a stated degradation rule, replacing "surfaced as unavailable".
  - *Conversation detail side panels and their provenance* — Trace becomes a real field, Region is gone,
    Successful is restated.
  - *Conversation turn list comes from the earliest hop of each trace and discloses its bound* — the turn
    source becomes the `turns` entity, with the refresh-lag limitation recorded.
  - *Single-conversation query over the conversations entity* — the select names the heavy `traces`
    column and the insight columns explicitly.
  - *Conversation list query over the conversations entity* — the curated select grows, and projection
    follows the visibility of curated field-backed columns.
  - *Conversations grid with server-side ordering and per-column filtering* — the visible column set
    becomes six plus Rating, and the sort/filter table gains Deployments and Topics.
  - *Conversation cells render composed values, not raw aggregates* — the identity cell composes the title
    over the id, and Topics composes a delimited string into chips.
  - *Unavailable conversation values render an explicit placeholder* — the three-state model gains the
    insight case, and an absent insight title degrades to the unavailable marker rather than to the
    conversation id, because the id is already on the cell's second line.
  - *Conversation detail side panels and their provenance* — a panel field may carry a keyboard-reachable
    caveat, and the duration caveat lands there; the two registers of provenance are stated.

  Removed:

  - *Conversation grid columns are offered from the entity schema* — the capability is deleted, not
    narrowed. Four of its rulings are rehomed rather than dropped: dotted names are read whole, a curated
    column whose field the schema does not report is not rendered, enrichment-vs-source classification
    decides re-query cost, and a failed schema fetch degrades to the required core with a notice.
  - *Conversations grid states how long each conversation took* — the Duration column is removed. The
    requirement's own closing paragraph is the normative statement of the defect, so it is re-stated on the
    Usage panel rather than lost with the column.

  Added:

  - *Conversation grid columns are a fixed curated set gated by the entity schema* — the ten columns, their
    origins, their sort and filter affordances, and what each empty cell means.

## Impact

Code (all under `apps/ai-dial-admin/`):

- `src/models/analytics/conversations-trace.ts` — `ConversationsField` gains the insight, cache/reasoning
  token, `chain_price_total` and `traces` members; `ConversationDetailRow` and `ConversationRow` gain the
  matching keys; a `TurnsField` enum replaces the `UsageLogField` usage in the turn query.
- `src/constants/analytics/conversations-trace.ts` — `TURNS_ENTITY`; `CONVERSATION_DETAIL_PANELS` loses
  the Region entry and binds Trace; value-type and sortable/filterable field lists grow.
- `src/utils/analytics/conversations-queries.ts` — `buildConversationTurnsQuery` becomes a row read on
  `turns`; `CURATED_SELECT_FIELDS` gains `conversation_insights.title`.
- `src/utils/analytics/conversation-column-catalog.ts` and
  `src/components/Analytics/ConversationsTrace/use-conversations.ts` — projectable set includes curated
  field-backed columns.
- `src/constants/grid-columns/grid-columns.tsx` — the curated set is trimmed to ten columns and assigned
  to three provenance groups; `buildConversationColumnCatalog` is no longer called.
- `src/utils/analytics/conversation-column-catalog.ts` — `isOfferable`, `offerableSchemaFields`,
  `typeColumn`, `toCatalogColumn` and `buildConversationColumnCatalog` are deleted. `NON_SCALAR_FIELD_TYPES`,
  `NUMERIC_FIELD_TYPES`, `DATE_FIELD_TYPES` and `ANALYTICS_FIELD_QUERY_VALUE_TYPE` lose their last consumer.
  `ColumnProvenance.None` and `PROVENANCE_MARKER_CLASS` are dead already and go with them.
- `src/components/Analytics/ConversationsTrace/List/TopicsCellRenderer.tsx` — new; `TitleCellRenderer.tsx`
  is deleted.
- `src/components/Analytics/ConversationsTrace/Detail/ConversationFieldRows.tsx` — a panel field's caveat
  renders as a focusable control carrying the caveat as its accessible name.
- `src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader.tsx` — Title and Model.
- `src/components/Analytics/ConversationsTrace/List/ConversationsList.tsx` — dotted field names need
  AG Grid's field-dot-notation suppressed, or the flat `conversation_insights.title` key reads as a
  nested path and renders blank.
- `src/constants/i18n.ts` and `src/locales/en.ts` — new labels; `DetailRegion` removed.

Cross-cutting:

- No server-action signature changes and no new endpoints; every read goes through the existing
  `analyticsDataApi.executeAction`.
- `suppressFieldDotNotation` is set on the conversations grid only, so no other grid changes behaviour.
  It also fixes the schema-derived `conversation_insights.*` columns the catalog already offers, which
  render blank today for the same reason.
- The Region i18n key is referenced only by this panel, so removing it affects no other view.
- Existing specs for the transcript, the rating column and the trace drawer are untouched.

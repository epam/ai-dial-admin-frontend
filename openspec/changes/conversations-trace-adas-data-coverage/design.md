## Context

See `proposal.md` — Why. The constraints that actually shape the implementation:

- **`ConversationsField` is the enum the detail query enumerates.**
  `buildConversationDetailQuery` selects `Object.values(ConversationsField)`, so a member added to that enum
  is automatically requested for the detail view (intersected with the schema — decision 9). The list query
  does not use the enum wholesale; it uses its own ordered floor plus the caller's `visibleFields`.
- **Projection is driven by `projectableFields`, which excludes curated columns.**
  `use-conversations.ts` computes `visibleFields` as the visible grid columns intersected with
  `offerableSchemaFields(...)`, and `offerableSchemaFields` subtracts the curated columns by construction. A
  column that is curated *and* hidden by default therefore has no path into the select. Every insight column
  in this change is exactly that, so the gap has to close here or the columns render blank.
- **AG Grid reads a dotted `field` as a path.** The rows are flat maps keyed by the service's exposed names,
  so `conversation_insights.title` is one key. With AG Grid's default field-dot-notation, the grid looks for
  `row.conversation_insights.title` and finds nothing. This already affects the schema-derived
  `conversation_insights.*` columns the catalog offers today — they render blank when unhidden.
- **`traces` is `heavy` and an array.** Heavy columns are skipped by a default projection, and array fields
  are excluded from the catalog by the existing rule. The detail query's select is explicit, so naming
  `traces` is enough; the grid must not offer it.
- **The alias contract is honoured in row mode.** The analytics service resolves output-column names through
  one path for every query mode (`OutputColumnNaming`): an explicit `as` names the column, a bare field
  expression keeps its name verbatim, dot included. So a row query over `turns` can project its columns under
  the names the UI already reads.
- **`turns` is one row per trace** with `first_request_time`, `hop_count`, `total_tokens`, `total_price`,
  `duration_ms` and `trace_id` — a 1:1 replacement for what `buildConversationTurnsQuery` computes today with
  a group-by over `dial_usage_log`.

## Goals / Non-Goals

**Goals:**

- Every placeholder on the two pages either shows real data or is gone.
- The header and the grid agree about one conversation: same source, same formatting, and each field
  labelled for what it reads.
- The turn timeline stops maintaining a second definition of what a turn is.
- Projection follows visibility uniformly, so a curated hidden column behaves like a schema-derived one.
- No new server action, no new endpoint, no change to any existing action's signature.

**Non-Goals (design-level, beyond the proposal's scope boundary):**

- No new grid cell-renderer components beyond what the insight columns need; sentiment and resolution status
  render as text with a tooltip, not as badges. A badge system for closed vocabularies is a design decision of
  its own and would pull `SpanCategoryBadge` toward being a shared component.
- No change to `ConversationTurnField` / `ConversationTurnRow` shape, and therefore no change to
  `ConversationTimeline`, `attributeRatingsToTurns`, or `use-conversation-trace`.
- No caching or request-count work — that is the sibling change.

## Decisions

### 1. Keep `ConversationTurnRow`'s shape; alias the `turns` columns to it

`buildConversationTurnsQuery` becomes `rowQuery({ entity: 'turns', ... })` whose select aliases the rollup's
columns to the names the UI already consumes:

| `turns` column | alias (`ConversationTurnField`) |
|---|---|
| `trace_id` | `trace_id` |
| `first_request_time` | `started` |
| `hop_count` | `hops` |
| `total_tokens` | `tokens` |
| `total_price` | `cost` |
| `duration_ms` | `duration_ms` |

Filter `eq(chat_id, chatId)`, sort `[{ started, asc }]`, page `offsetPage(0, CONVERSATION_TURN_LIMIT)`.

*Why:* the alias is load-bearing exactly once — it keeps the change inside the query layer. The alternative,
renaming `ConversationTurnRow`'s keys to the rollup's field names, is arguably cleaner naming but spreads a
data-source swap across the timeline, the rating attribution util, the trace hook and four spec files, for no
behavioural gain. `OutputColumnNaming` guarantees the response keys are the aliases, so the row shape is
stable. Sorting by the alias matches what the existing aggregate query already does.

`UsageLogField` stays — `buildConversationSpansQuery` still reads `dial_usage_log`, and the span drawer is
untouched. A new `TurnsField` enum names the rollup's columns.

### 2. Suppress AG Grid's field-dot-notation on the conversations grid

Set `suppressFieldDotNotation: true` in the conversations grid's `additionalGridOptions`.

*Why over a `valueGetter` per column:* one option fixes every dotted column at once — the four curated
insight columns, and the schema-derived `conversation_insights.*` columns the catalog already offers and which
are broken today for the same reason. A `valueGetter` would have to be added to `toCatalogColumn` as well, and
anyone adding a curated enrichment column later would have to remember it. Scope is the conversations grid
only, so no other grid's behaviour changes.

*Consequence to hold onto:* `colId` still defaults to `field`, so the sort and filter models still carry
`conversation_insights.title` — which is exactly the name the service wants. Nothing in
`translateConversationSortModel` / `translateConversationFilterModel` needs a special case.

### 3. Projection: extend `projectableFields` to curated field-backed columns

`offerableSchemaFields` keeps its current meaning (what the *catalog* may offer). A second helper —
`projectableCatalogFields(curated, schemaFields)` in `conversation-column-catalog.ts` — returns the schema
fields offered **plus** every curated column whose `field` is a field of the entity schema. `use-conversations`
uses that for `modelScope.projectableFields`.

*Why the schema-membership test:* it excludes `rating` (composed from `rate_analytics`, no entity field)
without hardcoding an exclusion list, and it self-corrects if a curated column is ever added for a field the
service stops exposing.

*Alternative rejected:* adding all eleven new fields to the projection floor. That projects ten columns
nobody has shown on every page fetch — the exact cost the existing spec forbids ("MUST NOT name every field
the entity carries").

The floor gains **only** `conversation_insights.title`, because that column is visible by default and the
floor must cover the default view.

### 4. Header Title and Deployments are derived in the header component, from the detail row

**Superseded in part by decision 13.** This decision originally specified a *Model* field narrowed by
`narrowToModels`, and accepted the narrowing as a known imprecision. Measurement retired that; decision 13
records what replaced it and why. What still holds:

- Title: `conversation.['conversation_insights.title']?.trim() || conversation.chat_id`. A dedicated util
  (`conversationTitle(row)`) holds the rule so the grid's title column and the header cannot drift; the same
  util backs the column's cell renderer.
- Deployments: `conversation.deployments ?? []`, joined for display, straight from the detail row.

*Why not `turns.models`:* the header would then depend on the turn list loading, so a conversation with no
turn rows (the refresh lag, decision 6, or an instance without the rollup at all) would lose the field as well
as its timeline — and a union over the bounded turn list would understate a long conversation. `deployments`
is on the row the header already has.

### 5. Metadata Trace renders `traces` through the existing List format

`ConversationFieldFormat.List` already joins an array and hands it to `FieldValue`, which truncates with
`DialEllipsisTooltip` — so the full set stays reachable, satisfying the truncation rule in `a11y.md`. No new
format and no new component.

*Alternative rejected:* a count-plus-expand treatment (`3 traces ▾`). It reads better for a 900-turn
conversation, but the per-turn trace is already reachable in the timeline's trace drawer, so the panel's job
is to state what the record holds, not to be a navigator. Revisit if the tooltip proves unusable in practice.

### 6. The refresh lag is stated in the spec, not worked around in code

Reading `turns` and falling back to `dial_usage_log` on an empty result was considered and rejected: it keeps
both query paths alive forever, and it answers "what is a turn" by one rule for a conversation older than the
refresh and by another for a newer one — with the two disagreeing on hop count, since the rollup excludes the
Core entry row that carries no chat id. A conversation newer than the last refresh renders the existing
empty-turn-list presentation, which already exists and already reads as "no turns to show" rather than as an
error.

*Trade-off accepted by the user.* Recorded here because it is the one user-visible regression in the change.

### 7. New curated columns follow the existing column presets

Insight strings use `baseStringFilter`; `sentiment_score` uses `numericColumn` + `baseNumberFilter`; the three
token columns use `numericColumn` with `formatCompactNumber`, matching the existing tokens column;
`chain_price_total` uses `numericColumn` with `formatSignificantCost` and `COST_TEXT_CLASS`, matching cost.
Headers come from `ConversationsTraceI18nKey` entries, and each carries a `headerTooltip` — the insight
columns disclose that the value comes from an evaluation, `chain_price_total` discloses its coverage gap.

`SORTABLE_CONVERSATION_FIELDS`, `FILTERABLE_CONVERSATION_FIELDS` and `CONVERSATION_FIELD_VALUE_TYPE` gain the
ten scalar fields (not `traces`, which is an array and stays unsortable and unfilterable, like `deployments`).

### 8. Title's grid presentation extends `ConversationCellRenderer`

The conversation column stays the id (route, copy target, `getRowId`); the title becomes its own column
immediately after it, rendering through `DialEllipsisTooltip` and falling back to the id via
`conversationTitle`. Two columns rather than one two-line cell, so the operator can sort and filter the title
independently and hide it if the id is what they work with.

### 9. Required/optional field split, not a full schema-driven rewrite

Added 2026-08-18 after browser verification found the change taking both pages down on an instance without
the insight enrichment (see proposal — What Changes).

Each query builder takes the entity's available field names and intersects its select with them. The split
is a constant per query, not a computation:

- `REQUIRED_LIST_SELECT_FIELDS` — the ten the pre-existing curated columns read. Always named.
- `OPTIONAL_LIST_SELECT_FIELDS` — `conversation_insights.title` today. Named only when reported.
- `LIST_SELECT_FIELDS` — the two above in render order, which is what the builder passes.

`availableSelectFields(selectFields, optionalFields, schemaFieldNames?)` takes the **full ordered select**
rather than the required set alone, so the projection keeps its render order (the title beside the
conversation id) instead of appending optional fields at the end.
- The detail query's required set is the fourteen columns the view has always read; its optional set is the
  twelve this change adds.

*Why a declared split over "intersect everything":* a pure intersection would silently drop `chat_id` if a
schema fetch came back malformed, leaving a query that returns rows the view cannot key. The required set is
the contract the view genuinely cannot render without, so it fails loudly instead. It also gives the
fallback an obvious definition when the schema is unavailable: name the required set, which is exactly the
projection that worked before this change.

*Why not push the intersection into the server action:* every action would then pay for a schema fetch, and
the list page already has the schema on the server. The page passes field names down; the builders stay
pure.

### 10. Availability is inferred from the row, not threaded through the component tree

`resolveConversationField` maps `undefined` to **unavailable** and `null` / `''` to **empty**.

*Why:* the service returns every projected column in every row, `null` where the cell is null. So a key
missing from the row means the column was never projected, which is exactly "this instance does not carry
it". The distinction the spec asks for therefore falls out of the payload, with no `schemaFields` prop
threaded from the detail route through `ConversationDetailView` into `ConversationDetailRail`. One line in a
util replaces a three-component prop chain.

### 11. Omitting unavailable curated columns reuses the optional set

`CONVERSATIONS_TRACE_COLUMN_GROUPS` already receives `schemaFields`. A curated column is dropped when its
field is in the **optional** set and the schema does not report it. The original columns and `rating` are
never candidates, so `rating` cannot be mistaken for a missing entity field — the failure mode a naive
"drop any column whose field is absent from the schema" rule would have.

*Why omit rather than disable:* the Columns panel has no disabled state today, and a column that can never
fill has no use. Title is included in the rule rather than exempted by its id fallback: on an instance with
no enrichment it would degrade for every row and read as a duplicate of the conversation column.

### 12. The detail route's fetch sequence

```
Promise.all([conversationsSchema, feedback, turns])   // none of these name an optional field
  → detail(chatId, fieldsFrom(schema))                // only this waits
```

*Why not one `Promise.all`:* the detail query cannot be built before the schema answers. Feedback and turns
have no such dependency, so they stay in the first wave — one extra sequential hop, not four.

*Why no schema probe for `turns`:* that query names no optional field, so there is nothing to negotiate. If
the rollup is absent the query fails and the existing failed-to-load presentation is accurate. A probe would
add a round trip to every detail view to predict a failure the read already reports.

### 13. Both surfaces name `deployments`; the narrowing is deleted

Superseding decision 4's Model field. `narrowToModels` was measured against `turns.models` on the dev
instance and disagrees in both directions: for `wPadkdnxdO5HilHRW2ew4` it kept three orchestrating `statgpt-*`
deployments the rollup excludes and dropped two embedding deployments the rollup includes because they were
billed — two of four values correct.

The failure is structural, not a tuning problem. The rules available to a frontend are name-shaped (resource
prefix, an `embedding` substring, substring containment); a router or application deployed under a plain name
is indistinguishable from a model, and a billed embedding deployment is a legitimate member of the billed set.
So the grid column and the header entry both name the field they read, render it unnarrowed, and
`narrowToModels` with its two constants and its spec are deleted.

*Why not compute the real set:* `turns.models` is authoritative but per turn; no server-side union over it is
expressible (`group_uniq_array` over an array input is rejected — the same reason `conversations_rollup` could
not be repointed at `turns`), and a union over the view's bounded turn list would understate a conversation
longer than that bound. A real model set needs a conversation-level field the rollup does not carry.

### 14. A failed schema read must cost the optional columns, not the page

Both routes wrap `getConversationsSchema()` in `.catch`, returning `{ success: false }`. The request layer
rethrows a connection failure rather than reporting it in the payload, so an unguarded call inside the detail
route's `Promise.all` rejects the whole wave and renders the error state for a conversation the required-only
projection resolves fine — the opposite of what decision 9's fallback exists for. Both the `success: false`
path and the rejection path are tested.

## Risks / Trade-offs

- **A conversation younger than the `turns` refresh shows no turns.** → Stated in the spec as accepted
  behaviour; the empty-turn-list presentation already exists, and the header, panels and rollup figures still
  render, so the page is not broken, only incomplete for that window.
- **`suppressFieldDotNotation` is grid-wide.** → A future column that genuinely needs nested access on this
  grid would need a `valueGetter`. The rows are flat maps from the analytics service, so no such column is
  plausible here; the option is scoped to this one grid.
- **`chain_price_total` reads NULL for most conversations.** → Kept hidden by default, labelled as the
  top-down figure, with the coverage gap in its header tooltip. `total_price` remains the cost column, so a
  reader who never enables it is unaffected.
- **Token figures stay unqualified while the routed-chain inflation is unfixed.** → Explicitly out of scope
  per the proposal; the fix belongs in the `turns` and `conversations` rollups together.
- **The insight columns are empty for unevaluated conversations, and an operator may read empty as "neutral"
  or "no topic".** → Column tooltips state that the value comes from an evaluation; the empty presentation is
  the grid's existing blank cell, distinct from a rendered value.
- **Removing `DetailRegion` touches shared i18n files.** → The key is referenced by exactly one panel entry;
  `npm run lint` and the type checker catch a stale reference, and the enum member is removed in the same
  commit as its only use.
- **Eleven new columns lengthen the column panel.** → All but Title default to hidden and every one is
  attributed to the `conversations` provenance group, so the default view is unchanged apart from Title.
- **A column silently absent is harder to notice than one that renders empty.** An operator on a lagging
  instance sees no Sentiment column and no explanation. → Accepted deliberately: the alternative presents
  cells that look like missing data. The Tables page shows what the instance actually carries, which is the
  honest place to answer "why is that column gone".
- **The required/optional split is a second list to keep in step with the curated columns.** Adding a
  curated column without adding its field to the optional set brings back exactly the bug this decision
  fixes. → Tests assert the split covers every curated field beyond the original set, so the omission fails
  a spec rather than a page.
- **The detail route gains a sequential hop.** → One, not four: only the single-conversation query waits on
  the schema. The request-count change in flight separately can cache the schema if the hop matters.

## Why

The conversations listing header answers a smaller question than it looks like it does. The **Rated** and
**With 👎** pills count only the rows AG Grid has fetched so far, so on a fresh page they read `0/37` against a
result of thousands, and they climb as the operator scrolls — a figure that moves while the data does not.
The operator wants the period's standing: how much of the last 7 days carries feedback, and how much of it is
negative.

The **Data from** line under the title has the same shape of problem. It names a hardcoded pair —
`conversations` and `response_ratings` — decided when the view was written. The `conversations` entity has
since grown enrichments (`conversation_insights` everywhere, `conversation_buckets` on some instances), and the
line names none of them. It reports the composition the code remembers rather than the one the instance
actually has, and every new enrichment silently widens that gap.

## What Changes

- **BREAKING (spec)**: the four header pills stop being a summary of the filtered result and become the
  **selected period's overall figures**. Conversations, Rated, With 👎 and Cost are all resolved for the time
  period alone. The search box, the grid column filters and the feedback filter narrow the **grid only** and no
  longer move the pills.
- The Rated and With 👎 pills lose the `Loaded so far` caption and gain a caption naming the period they cover.
  Their figures come from the `response_ratings` rollup, aggregated by conversation over the period, rather
  than from counting fetched rows.
- The Data from line is derived from the fetched entity schema: the base entity, then every enrichment
  namespace the schema reports, in first-appearance order. `response_ratings` stays named for as long as the
  Rating column reads it — it is a real source of the grid, not an enrichment of `conversations`.
- An instance whose schema reports no enrichments renders the base entity alone. Nothing is marked pending or
  unregistered, and no source the page does not query is ever named.

## Non-goals

- Reading ratings from an enrichment on `conversations`. No such enrichment exists on the dev instance, which
  is the source of truth for what this frontend may assume; ratings stay in the `response_ratings` rollup.
- Changing the Rating **column**, the feedback filter, or the detail view's feedback panel. They keep reading
  ratings exactly as they do today.
- Reconnecting the pills to the grid's filters later by another route. Decoupling them is the decision, not a
  limitation being worked around.
- Turn-grain feedback (`turns.turn_feedback.*`). It exists on both instances but attaches to a turn only
  through its chain-entry `response_id`, which DIAL Core leaves unstamped for most turns.

## Capabilities

### New Capabilities

None. This modifies behaviour the analytics spec already describes.

### Modified Capabilities

- `analytics`: **Provenance line and result summary** is removed and replaced by **Provenance line and period
  summary**. The replacement is not a narrowing of the old requirement but a different contract — the pills
  describe the period rather than the filtered result — so the loaded-scope caption, the
  distinct-loaded-conversation counting rule and the unresolved-rating exclusion go with it, and the
  provenance clause changes from a fixed entity pair to a schema-derived list. The pill set, the colour
  agreement with the grid band, the decimal cost summing and every failure clause carry over unchanged.

## Impact

Frontend only. No backend or catalog change: both the dev and local ADAS instances already carry
`response_ratings`, and the enrichment list is read from the entity schema the page already fetches.

- `Header/ConversationsProvenanceLine.tsx` — takes the fetched schema instead of a constant
- `Header/ConversationsSummary.tsx` — period captions; rating pills read resolved totals
- `use-conversations.ts` — drops `summariseConversations`; rating totals arrive with the first page
- `conversations-trace/actions.ts` — `resolveConversationTotals` gains the rating aggregate
- `utils/analytics/conversations-queries.ts` — a period-scoped rating-totals query
- `utils/analytics/conversation-rows.ts` — `summariseConversations` is removed
- `constants/analytics/conversations-trace.ts` — `CONVERSATION_SOURCE_ENTITIES` is removed
- `locales/en.ts`, `constants/i18n.ts` — the loaded-scope strings give way to period ones

Affects no other view. `ConversationsProvenanceLine` and `ConversationsSummary` are used by this page only;
the detail view's own provenance registry is untouched.

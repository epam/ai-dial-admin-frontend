## Why

`5a968d9f` replaced the conversations grid's schema-derived column catalog with a fixed set of ten
designed columns. The reason was concrete and correct: `conversation_insights.model` carries the
`display_name` "Model", so a derived column rendered a header reading **Model** whose values were the
evaluator's own DIAL deployment — nothing to do with the models the conversation used. That single
mis-labelled column was reason enough to stop deriving columns at all.

The cost of that fix was disproportionate. The entity reports 32 fields on dev (19 rollup + 13
`conversation_insights`) and more where an instance carries further enrichments; the grid offers ten
columns. Fields with authoritative, caveat-bearing descriptions — `duration_ms`, `chain_price_total`,
`sentiment_score`, `resolution_status` — are unreachable in the log and only reachable through the
Query Builder. Meanwhile the schema already carries the thing that solves the Model problem
generically: every field has a `tag`, and the five evaluator-bookkeeping fields (`model`,
`evaluator_version`, `enriched_at`, `group_version`, `truncated`) are all and only the ones tagged
`provenance`. The narrowing can be reverted without reintroducing the defect that motivated it, and
without a hand-maintained exclusion list.

## What Changes

- **Restore the schema-derived column catalog.** Every field the fetched schema reports becomes an
  offered column, on top of the ten curated columns, which keep their designed cells and labels.
  A column's header is the field's `display_name`, falling back to a humanized form of `name`; its
  tooltip is the field's `description` verbatim; its formatting, sort and filter follow its declared
  type. Roughly 30 columns on dev, ~36 on an instance carrying `conversation_buckets`. The count is
  never hardcoded — it is whatever the instance reports.
- **Today's default-visible set is unchanged**: Conversation, Project, User, Activity, Cost, Rating.
  Every derived column ships hidden. **BREAKING** for column *order* only: grouping forces Activity
  adjacent to Conversation, so the visible order becomes Conversation, Activity, Project, User, Cost,
  Rating.
- **Group columns on the (origin, tag) pair**, one level deep. The tag names the group ("Token usage",
  "Performance", "Evaluator run"); the origin colours it and fills the columns panel's per-column
  caption. This is what keeps a bare **Model** column from existing: it lands under a group headed
  *Evaluator run*, captioned *Conversation insights · Evaluator run*, never unattributed.
- **Split the projection three ways by cost, not by visibility alone.** `projectableSchemaFields`
  returns cheap-source (always projected), heavy-source (`field.heavy`, projected on visibility) and
  enrichment (projected on visibility). The `columnVisible` purge extends to heavy-source columns.
  `field.heavy` is declared in `AnalyticsEntityField` today and read nowhere.
- **Overturn three normative statements** in the current analytics spec that forbid what is being
  restored: that the set "SHALL be exactly these ten columns"; that sentiment and resolution status
  "SHALL NOT be presented as columns at all"; and that "no row carries a separate truncation marker".
  The last two are unrelated to the Model defect and are reversed knowingly, not incidentally.
- **Offer `conversation_insights.summary`** as a hidden-by-default column. A product decision, taken
  on the record: it is derived text with `sensitive=false`, like the title the identity column already
  shows, and flags do not propagate from the `sensitive=true, heavy=true` bodies it came from.
- **State in code why body columns are impossible** rather than filtering for them. `request_body` and
  `response_body` are columns of `dial_usage_log`; the listing queries `conversations`, whose schema
  reports no body field. A filter would look load-bearing and would rot.

### Non-goals

- Listing performance. `read_rows` measured identical (7 760 — the whole table) across every
  projection variant, because the list query sorts by `last_request_time` with no filter. The sort is
  what scales with volume; the column list does not. Not touched here.
- A closed-vocabulary filter for `sentiment` or `resolution_status`. Both become plain string columns
  with the string operators the query language already expresses. Duplicating the evaluator's enum in
  the frontend is still refused.
- Array-typed fields as derived columns. A grid cell is not a structured-value viewer; `traces` stays
  unoffered even though the heavy bucket now exists to make it safe.
- Any change to the identity column, the Topics renderer, the provenance line, or the detail rail.
- Nested column groups. `toColumnLeaves` in `components/Grid/utils.ts` walks one level only, and that
  file is shared with four other entity lists.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the conversations grid's column set changes from a fixed curated ten to curated plus
  schema-derived; column grouping re-keys from origin alone to the (origin, tag) pair; the projection
  gains a heavy-source bucket gated on visibility; header, tooltip and filter derivation from
  `display_name`, `description` and `type` return.

## Impact

Code:

- `src/utils/analytics/conversation-column-catalog.ts` — restore `buildConversationColumnCatalog`,
  `catalogValueTypes`, `catalogSortableFields`/`catalogFilterableFields`; three-bucket
  `projectableSchemaFields`; tag-keyed grouping helper.
- `src/constants/grid-columns/grid-columns.tsx` — `CONVERSATIONS_TRACE_COLUMNS` composes the catalog;
  `CONVERSATIONS_TRACE_COLUMN_GROUPS` groups on (origin, tag).
- `src/constants/analytics/conversations-trace.ts` — restore `NON_SCALAR_FIELD_TYPES`,
  `DATE_FIELD_TYPES`, `NUMERIC_FIELD_TYPES`, `ANALYTICS_FIELD_QUERY_VALUE_TYPE`; add the tag→label map.
- `src/models/analytics/conversations-trace.ts` — third projection bucket; tag group model.
- `src/components/Analytics/ConversationsTrace/use-conversations.ts` — catalog-derived model scope;
  heavy-source fields in the visibility-gated projection and in the `columnVisible` purge.
- `src/constants/i18n.ts`, `src/locales/en.ts` — tag group labels.

Not changed: `components/Grid/**` (shared with other entity lists), `ProvenanceHeaderGroup`'s props,
`ConversationsProvenanceLine`, the detail rail, the server action's query construction.

Risks:

- Stored column state from the current ten-column grid is applied to a ~30-column set.
  `applyColumnStateOrderToGroupedColDefs` leaves a column absent from stored state at its coded
  default, so new columns arrive hidden as intended — asserted by test rather than assumed.
- Sorting or filtering a derived *enrichment* column carries a predicate onto a joined column. Filter
  narrowing on an enrichment field is already severe by nature (only evaluated conversations match);
  the existing hide-clears-the-filter behaviour covers the trap.
- On an instance where `display_name` is absent on every field (observed on a local stand), every
  derived header falls back to the humanized field name. Both paths are live and both are tested.

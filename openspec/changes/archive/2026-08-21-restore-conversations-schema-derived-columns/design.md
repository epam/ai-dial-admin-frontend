## Context

See `proposal.md` — Why. What matters for the approach:

- The catalog code being restored exists verbatim at `5a968d9f^`:
  `buildConversationColumnCatalog`, `offerableSchemaFields`, `catalogValueTypes`,
  `catalogSortableFields`, `catalogFilterableFields`, plus `NON_SCALAR_FIELD_TYPES`,
  `DATE_FIELD_TYPES`, `NUMERIC_FIELD_TYPES` and `ANALYTICS_FIELD_QUERY_VALUE_TYPE`. It is a starting
  point, not the target: the target adds tag grouping and a third projection bucket, neither of which
  existed then.
- `AnalyticsEntityField` already declares `tag`, `display_name`, `description`, `sensitive` and
  `heavy` (`src/models/analytics/entity.ts`). `heavy` is read nowhere in the app today.
- Verified against the live dev entity: 32 fields, nine tags — `identity`, `principal`, `response`,
  `token-usage`, `cost`, `performance`, `deployment`, `insight`, `provenance`. `heavy: true` on
  `traces` alone. `display_name` present on 19 of 32.
- `ColumnsPanel.tsx:78` already renders a per-column caption from `groupName`; `toColumnLeaves`
  (`components/Grid/utils.ts`) walks exactly **one** level of `children`. `components/Grid/**` is
  shared with four other entity lists.
- `suppressFieldDotNotation: true` is already set on this grid, so a qualified enrichment name is read
  as a single key.

## Goals / Non-Goals

**Goals**

- One derivation path for every offered column: schema field in, `ColDef` out, no per-field code.
- The Model defect impossible by construction rather than by exclusion list.
- Projection cost proportional to what is on screen, split by measured cost rather than by visibility.
- No edits under `components/Grid/**`.

**Non-Goals** (beyond the proposal's)

- Changing the columns panel's flat-list-with-caption presentation. It already carries the origin.
- A grouping abstraction reusable by other analytics grids. This grid is the only one with a
  tag-bearing schema; generalizing now would be speculative.

## Decisions

### D1 — Group on the (origin, tag) pair, at one level

**Chosen:** a group per distinct `(origin, tag)` pair the schema actually reports. The tag supplies the
group's translated label; the origin supplies its colour (`PROVENANCE_TEXT_CLASS`, unchanged) and the
panel caption. `ProvenanceHeaderGroup`'s existing `{ label, provenance }` props carry both with no
signature change.

*Why not nested groups (origin ▸ tag).* `toColumnLeaves` walks one level; a nested `ColGroupDef` child
yields a leaf with no `field` and is filtered out of the panel entirely. Making nesting work means
editing shared grid utils for four other lists' benefit — blast radius far beyond this view, for a
third header row.

*Why not tag alone.* The origin caption disappears from the panel, and on an instance whose extra
enrichment reuses a rollup tag (a `conversation_buckets` field tagged `cost`) rollup and enrichment
columns silently merge into one group — reinstating precisely the mis-attribution `5a968d9f` removed.
Keying on the pair keeps them apart automatically.

*Why not origin alone, as today.* It leaves the Model defect resting entirely on a caption reading
"Conversation insights", which reads as a location, not a warning.

Consequence accepted: `marryChildren` forces group adjacency, so `last_request_time` (tag `identity`)
sits beside `chat_id` and the default visible order shifts. The set is unchanged; the order is not.

### D2 — Tag labels are a frontend i18n map, with the raw tag as fallback

Tags are kebab-case catalog identifiers (`token-usage`); the spec already requires groups be named in
readable words. So a `Record<string, string>` of tag → i18n key lives in
`constants/analytics/conversations-trace.ts`, and a tag absent from it falls back to its raw value
rather than dropping the column.

This is a hand-maintained *label* table, which is categorically different from a hand-maintained
*exclusion* list: a missing entry costs an ugly header, never a wrong one and never a missing column.
`provenance` maps to a label that names what it is — the evaluator's own bookkeeping — never the word
"Provenance", which in this codebase means the origin of a column and would read as a category rather
than a caveat.

### D3 — Header from `display_name`, falling back to a humanized `name`

`display_name` when present; otherwise `name` with separators replaced and the first word capitalized
(`avg_duration_ms` → "Avg duration ms"). Not the raw snake_case name: on dev five derived headers
would show it, and on a stand where `display_name` is null throughout, every one would. Humanizing is
presentation, consistent with the existing requirement that groups read as words rather than
identifiers; it never invents meaning, because it only re-cases the name the service chose.

A curated column's designed header always wins — the catalog appends to the curated set and never
overrides it.

### D4 — `description` is the tooltip, verbatim

`headerTooltip: field.description`. The descriptions are authoritative and, for `duration_ms` and
`chain_price_total`, they contradict what the column looks like — nested hops double-counted, and a
NULL that is a coverage gap rather than a zero. Paraphrasing them into i18n strings would put a second
copy in the frontend to drift; quoting them keeps the service the source of truth. Untranslated for
the same reason: they are service-owned text, and `en` is the only shipped locale.

### D5 — Three projection buckets, keyed on `field.heavy`

`projectableSchemaFields` returns `{ cheapSource, heavySource, enrichment }`, replacing
`{ sourceBacked, enrichmentBacked, requiredEnrichment }` (the required-enrichment bucket survives
unchanged alongside them — the identity column still cannot be hidden).

Measured on the local rollup, 6 328 conversations:

| projection | read | ms |
|---|---|---|
| 2 columns | 492 KiB | 5 |
| 20 columns | 2.08 MiB | 7 |
| 10 scalar | 1.44 MiB | 11 |
| the same 10 + `traces` | 5.39 MiB | 12 |

Twenty ordinary columns over two costs 1.6 MiB and 2 ms, so gating them buys nothing and adds a
refetch flash on reveal. One heavy column costs 2.7× the other ten together, so it is gated. Splitting
on the flag the service already publishes, rather than on a count or a name, means a future heavy field
is classified without a code change.

The `columnVisible` purge extends to heavy-source columns for the same reason it exists for enrichment
ones: a field absent from the pages already fetched renders an empty column until the cache is purged.

### D6 — Arrays stay out of the derived catalog; the heavy bucket ships empty, and that is expected

`NON_SCALAR_FIELD_TYPES` continues to exclude `object` and `array` from derivation — a grid cell is not
a structured-value viewer, and that reasoning is independent of the Model defect.

**`heavySource` is empty against the real schema today. That is the correct result, not a gap**, and it
is worth being exact about why, because the obvious explanation is wrong.

The array test governs whether a field is *derived into a column*. It has nothing to do with projection.
`deployments` is also an array, has a hand-written column (`grid-columns.tsx:730`), and is projected on
every page like any other cheap source field — so "arrays are not projected" is not a rule and must not
be written down as one. `traces` falls out for a different reason: **nothing rendered reads it.** No
curated column binds to it and no derived column can, so no column's field set names it, so the
projection never sees it — heavy or not.

That distinction is what makes the bucket live rather than dead code, because it names exactly what
would populate it:

1. **the schema marks a scalar field `heavy`** — the flag is per field and set service-side, so this
   needs no frontend change at all; the field is derived into a hidden column and lands in `heavySource`
   the first time the grid loads against that instance;
2. **a column is added that reads `traces`** — a hand-written one, as `deployments` has. The moment that
   column exists, `traces` is a field a rendered column reads, and the bucket is what keeps it off every
   page until an operator actually reveals it.

Either trigger arrives without anyone revisiting this decision, which is the point of classifying on the
published flag rather than on a name or a count. The unit tests exercise the branch with a synthetic
scalar heavy field for trigger 1, and the measured 5.39 MiB is what trigger 2 would otherwise cost on
every page of every scroll — discovered by an operator, not by the author.

### D7 — Body columns get a comment, not a filter

`request_body`/`response_body` are columns of `dial_usage_log`. The listing queries `conversations`,
whose schema reports no body field, so no filter is needed and one would read as load-bearing and rot.
A comment at the derivation site states it. The adjacent real risk — derived text arriving through
enrichment with none of the source's flags — is settled in the proposal (summary offered hidden) and
belongs in the spec, not in a guard.

### D8 — Sort and filter affordances follow the field's type, gated by what the query can express

Restored from `catalogValueTypes`/`catalogSortableFields`: type → `QueryValueType` → numeric or string
filter preset. A derived column's affordances are stated on the `ColDef` and the sort/filter allow-lists
are then *derived from the columns*, keeping the existing structural gate — a predicate can only name a
field some rendered column reads, so a lagging instance cannot produce a query the service rejects
wholesale.

## Risks / Trade-offs

- **Stored ten-column state meets a ~30-column set.** →
  `applyColumnStateOrderToGroupedColDefs` leaves a column absent from stored state at its coded
  default, so new columns arrive hidden. Asserted by a unit test rather than assumed; no storage-key
  bump, which would discard operators' existing choices.
- **Default visible order shifts** (Activity moves left of Project). → Accepted in the proposal;
  stated in the spec so it reads as a decision, not a regression.
- **Filtering a derived enrichment column narrows severely** — only evaluated conversations can match.
  → Pre-existing for Topics and already mitigated: hiding a filtered column clears its filter and
  re-queries.
- **Sorting a derived enrichment column** carries an ORDER BY onto a joined column, whose backend
  support is unverified. → The column's own `ColDef` is the gate. If a sort proves unsupported the fix
  is one flag on the derived enrichment branch, not a query-layer change.
- **Descriptions are untranslated** and can be long in a header tooltip. → They are the shipped
  locale's text already; length is the service's editorial call, and a truncated authoritative caveat
  is worse than a long one.
- **The tag label map drifts** as the service adds tags. → Falls back to the raw tag: an ugly header,
  never a wrong one and never a dropped column.

## Migration Plan

No data or config migration. Behaviour arrives with the deploy; column state persists per browser in
`localStorage` under the unchanged `analytics/conversations` key. Rollback is the inverse commit — the
stored state stays readable both ways, since it only names columns that still exist and unknown names
are ignored on read.

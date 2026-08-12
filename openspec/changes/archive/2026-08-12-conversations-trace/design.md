## Context

Analytics already talks to the analytics-data-access-service (ADAS) through `analyticsDataApi` and can
express arbitrary structured queries via the Query Builder (`/query-builder`). What it lacks is a
purpose-built page for the most common read of `dial_usage_log`: conversation-level rollups by `chat_id`.

Three pieces of existing state shape this design:

- **Two DSL builders already exist, neither reusable.** `utils/structured-query/build.ts` exports exactly
  the primitive names this change needs (`field`, `value`, `and`, `fn`, `col`, `sortItem`, `offsetPage`,
  `aggregateQuery`) but is typed against the *evaluation* DSL (`models/evaluation/structured-query.ts`).
  Separately, `components/Analytics/QueryBuilder/utils/{serialize,time}.ts` builds the *analytics* DSL, and
  `time.ts` already owns the epoch-millisecond timestamp rule with tests.
- **A "Conversations" grid already ships**, as a tab inside Usage Log
  (`USAGE_LOG_CONVERSATIONS_COLUMNS`). It reads a different backend — the telemetry API via
  `getDashboardData` on an infinite row model — and uses telemetry column names (`completion_time`,
  `deployment_price`) rather than ADAS names (`request_time`, `total_price`). It is not a starting point.
- **`/conversations` is taken** by DIAL Core assets, which is why the route is `/conversations-trace`.

The intent is a *base visual*: the smallest page that is structurally the thing we will keep extending,
demonstrable before ADAS is populated.

## Goals / Non-Goals

**Goals:**

- A real route, real query layer, and real grid on screen in one reviewable PR.
- Encode the ADAS contract rules as tested code, so nobody has to remember them at the next call site.
- Structure the grid so follow-up work fills slots rather than replacing the grid.
- Be demonstrable with no populated backend, via a switch flipped by editing one line.
- Surface value-formatting and layout defects now, while the mock is the default.

**Non-Goals:**

- Proving ADAS answers the query as expected — the switch defaults to mock, so that arrives on the first
  manual flip.
- Any interaction beyond reading: no sort, filter, page, search, or navigation.
- Matching the design mock pixel-for-pixel. Most of its content (title, snippet, feedback, enrichments)
  is out of scope or, in the title's case, possibly unreachable.

## Decisions

### A new analytics-DSL primitives module, importing the time rule rather than restating it

`src/utils/analytics/query-build.ts` holds primitives typed against `models/analytics/query.ts`. It
imports `timeRangePredicates` from `QueryBuilder/utils/time.ts` instead of re-deriving the `ge`/`le` pair.

*Alternatives:* reuse `utils/structured-query/build.ts` — rejected, different enums, a type error not a
shortcut. Lift `time.ts`'s helpers up into the new shared module and have the Query Builder import
downward — cleaner long-term, rejected for now because it widens the diff into working, tested code for no
behavioural gain. Duplicate the epoch-millis rule — rejected: it is exactly the kind of hard-won fact that
must have one home.

The primitive names deliberately collide with the evaluation builder's. They are never imported together,
and inventing different names would obscure that these are the same concepts against a different DSL.

### The query builder takes a range; it never reads the clock

`buildConversationListQuery({ range })` receives a `TimeRange`. Resolving "last 7 days" via
`getTimeRangeById('7d')` happens in the caller. This keeps the builder pure and its assertions exact —
tests compare against literal epoch-millisecond strings with no clock stubbing.

### `include_total: false`, not omitted

The original intent was to omit `include_total` in aggregate mode. That is not expressible:
`QueryOffsetPage.include_total` is a required `boolean` in `models/analytics/query.ts`. It is also
unnecessary — ADAS does not enforce mode coherence, and returns `totalCount: null` for aggregate mode
regardless. `false` is the honest value and matches what the Query Builder's serializer already emits.

### The project alias is `project`, not `project_id`

Found while implementing. ClickHouse expands an alias into its own defining expression, so
`min(project_id) AS project_id` is self-referential and fails as a cyclic alias — it does not shadow the
source column the way a plain SQL alias would. Renaming the alias to `project` is the one-identifier fix;
grouping by `(chat_id, project_id)` instead was rejected because it changes row identity away from one row
per conversation and would make the `chat_id` tiebreaker non-unique.

`ConversationRow.project` and `ConversationField.Project` follow the alias, since the grid's field names
are the query's output aliases.

### The mock switch is a typed `boolean` constant read only on the server

```ts
// src/mocks/analytics/conversations-trace.ts
export const USE_CONVERSATIONS_MOCK: boolean = true;
```

The `: boolean` annotation is load-bearing. Without it TypeScript narrows to the literal `true`, the
`false` branch becomes statically dead, lint flags it, and the "switch off delegates to the api client"
test cannot exercise the real path. Annotating keeps both branches live while the flip stays a
one-character edit.

*Alternatives:* an env var — rejected by the requester. A `NEXT_PUBLIC_` var — rejected, and it would also
break the guarantee below. Runtime UI toggle — out of scope for a base visual.

Because the constant and the fixtures are referenced only from `actions.ts` (`'use server'`), no fixture
module can reach the client bundle. That property is a consequence of the module boundary, not something
the code must defend.

### The mock check runs *after* the 403 guard

The page keeps `isAnalyticsForbidden()` unconditionally, then the action decides its data source. So with
the mock on, exactly one backend call remains — the access check.

This trades literal "no backend call" for a page that is real in every respect except its data: analytics
access still governs it, and when ADAS is unreachable the check returns a non-403 status, so
`isAnalyticsForbidden()` yields `false` and the page still renders fixtures. Reversing the order would
save one request and lose the access contract.

### Fixtures reproduce backend shapes, not presentation-ready values

Because the switch will be flipped by hand, the failure mode to design against is fixtures that look
perfect and a first flip that looks broken with no way to tell whether the query, the formatter, or the
layout is at fault. Two concrete traps drive this:

- `currencyValueFormatter` is `` `$${new Big(v).toString()}` `` with **no rounding**. A `Decimal(38, 12)`
  sum renders every fractional digit. A fixture of `"0.09"` renders `$0.09` and hides this completely.
- `total_tokens` and `total_price` are both `Nullable`, so an aggregate over an all-null group is `null`,
  not `0`.

So fixtures carry full-scale decimals, null metrics, an empty `project_id`, and production-length
`chat_id` values. The design mock's ids (`c-b3f9e0`) are stylised; tuning the conversation column's flex
against eight characters would break on the first flip.

### Row fields accept either wire shape

`ConversationRow` types timestamps and metrics as `number | string` (plus `null` where nullable). The wire
type of an aggregate over `DateTime64` is genuinely unresolved: ADAS passes ClickHouse client values
through untouched (only array values are normalised) and its `JsonMapper` configures no date handling.
Rather than bet, we tolerate both — `formatDateTimeToLocalString`, `currencyValueFormatter` and
`numberValueFormatter` already accept `number | string`, so this costs nothing and removes the unknown
from the critical path.

### Grid: per-column overrides, page-owned row height, renderer from day one

`AgGridWrapper` sets `defaultColDef` as a JSX prop and then spreads `additionalGridOptions` *after* it, so
passing `defaultColDef` through that object replaces the shared `minWidth`, `flex`, `resizable`, filter
component, comparator, tooltip getter and arrow-key guard. Per-column overrides merge over the defaults
normally and are the customisation point. `storageKey` is omitted because the wrapper applies
`autoSizeStrategy: fitGridWidth` only when it is absent.

An enrichment column has to be aliased because AG Grid reads a dotted `field` as a path into nested row
data, so the service's table-qualified `conversation_summary.title` would resolve against a `conversation_summary`
object that no row has, and the cell would come out empty rather than erroring.

Suppressing the column filters takes **both** `filter: false` and `floatingFilter: false` per column. The
shared `defaultColDef` supplies `filter: 'agTextColumnFilter'`, so `floatingFilter: false` on its own only
hides the floating row — each header still offers a menu that opens a working client-side filter over the
page's rows, which is exactly the narrowing the section below rules out.

Two choices exist purely to make follow-up work additive. The design mock is composite multi-line cells at
roughly 64px; `ROW_HEIGHT` is a shared `40`. So the page owns `rowHeight` via `additionalGridOptions`, and
the conversation column goes through a cell renderer even though it renders one line today. Without these,
the next PR rewrites every column def, adds a height override, re-tunes widths, and invalidates the
component tests — replacement, not extension. The cost is roughly forty lines.

### Filters are query predicates, never a client-side narrowing

The grid holds one page — at most 20 aggregate rows. Narrowing those on the client would produce a result
that looks complete and is not: type `acme` and you would see only the `acme` rows *among the 20 most recent
conversations*, silently dropping every older match. Since the answer to "how many conversations match" is a
different query, not a subset of this one, filtering has to move into the query.

So each control maps to predicates and each change is a fresh request:

| Control | Query effect |
|---|---|
| Time period | the `ge`/`le` bounds on `request_time` |
| Search | `or[ ico(chat_id, term), ico(project_id, term) ]` in the WHERE clause |

Two things had to be checked against the service rather than assumed:

- **`ico` gets the raw term.** `FilterTranslator.containsPattern` builds `"%" + escapeLike(value) + "%"`
  itself, escaping `\`, `%` and `_`. So the builder passes the term through verbatim; adding wildcards would
  make them part of the searched text. It also *requires* a non-null string literal — anything else is a 400
  — which is why `ico` takes a `string` rather than a `QueryValueExpr` like its `ge`/`le`/`ne` siblings. The
  asymmetry buys a rule that cannot be got wrong at a call site.
- **`filter` resolves against base fields only.** `StructuredQueryBuilder` applies `filter` with base-field
  bindings before grouping and reserves alias bindings for `having`. So search matches `project_id`, not the
  `project` alias — the alias there would be an unknown field.

Filtering `project_id` in WHERE trims rows out of a group rather than dropping whole groups, so a
conversation spanning projects would report partial `turns`/`tokens`. `project_id` is effectively constant
per `chat_id`, so this cannot occur in practice, and WHERE keeps the daily-partition and `chat_id`
bloom-filter pruning that `having` on the alias would forfeit. Correctness-by-construction would be a
`having` on the alias; that trade is not worth a full-table scan for a case that does not arise.

The consequence worth naming: **filtered results are still capped at 20.** A broad term shows the 20 most
recent matches. That is a paging gap, not a filtering bug, and paging is the next change.

### Search reaches ids and projects, not messages

The design mock's placeholder reads "Search conversations, messages, users…". Only one third of that is
reachable:

| Promised | Column | Status |
|---|---|---|
| conversations | `chat_id` | visible — searched |
| projects | `project_id` | visible — searched |
| messages | `request_body` | `sensitive` (FULL_ADMIN only); a 400 for everyone else |
| users | `user_hash` | visible, but a de-identified surrogate — free text never matches it |

Shipping the mock's placeholder would promise message search that cannot work and user search that cannot
match, so the string names what search actually does: "Search by conversation or project". `user_hash` is one
extra `ico` away if a flow ever supplies a hash — the sensitivity of `request_body` is the real wall, and
`V3__add_sensitive_columns.sql` marks it deliberately, not incidentally.

### Filter state crosses the action boundary as epoch millis

`TimeRange` holds `Date` objects. Rather than rely on how those serialize through a server action, the
boundary carries `{ search, startMs, endMs }`. Epoch millis are already what the query's timestamp literals
need, so the action reconstructs a `TimeRange` in one line and `buildConversationListQuery` keeps the
`TimeRange` signature its 38 existing tests assert against.

### Fixtures anchor to the range end instead of fixed instants

Adding a time filter broke the original fixtures: absolute timestamps dated near authoring time drop out of
a sliding "last 7 days" window within a week, and a permanently empty page is indistinguishable from a
broken query — exactly the failure the mock exists to avoid.

So a fixture stores `msBeforeRangeEnd` and the row's `last_activity` is resolved against the requested
range's end. Anchoring to the range end rather than "now" keeps the function pure — no clock read in a util,
per the utils rule — and makes every preset return a plausible subset: offsets span 4 minutes to ~6.7 days,
so `Last 15m` yields 2 rows and `Last 7d` all 14. The time control visibly works with no backend.

Mock-mode filtering lives in the server action, applying the same three predicates the query would. That is
the one place the two data sources diverge, and it is deliberately *not* client-side filtering — the call
path, the debounce, the race handling and the loading state are identical either way, so flipping the switch
exercises wiring that has already been exercised.

### Debounce, race handling, and the mount request

Three details the "filter change → new request" rule forces:

- **Debounce** (400ms, lodash) so a burst of keystrokes is one request. The box is a controlled input on
  undebounced state, so typing stays instant while only the applied term triggers a query.
- **Latest-wins** via a monotonic request-id ref. A debounced search can overlap a range change, and a
  server action offers no cancellation, so a stale response must be dropped rather than allowed to overwrite
  newer rows.
- **No fetch on mount.** The refetch effect keys on `[appliedSearch, timeRange]`, which would fire once on
  mount and duplicate the server prefetch. A mounted-ref guard skips that first run; the alternative —
  dropping the prefetch and always fetching client-side — would trade a server-rendered first paint for a
  loading spinner on every page load.

### Title and snippet are mocked now against an enrichment contract, not invented client-side

The design's primary visual element — a bold title over a message snippet — has no source column. Earlier this
looked like a wall: the only column that could yield it is `request_body`, catalogued `sensitive`
(FULL_ADMIN-only, HTTP 400 for anyone else). Reading the service properly shows the intended path is an
**enrichment**, and that it is better than a workaround:

- `CatalogQueryService` publishes an enrichment's columns into the *source's* flat query schema and
  `EnrichmentJoin` LEFT-joins it on the grain key — `source.grain_key = enrichment.grain_key`, 0..1, "never
  inflates rows" — emitting the join only when a query references one of the exposed names. So an enrichment at
  `chat_id` grain is queryable **in the same aggregate query** as the rollup. No second query, no client-side
  merge.
- The enrichment registry is built for exactly this: an evaluator (`type=LLM`, `preset=CHAT_COMPLETION`) bound
  by a rule to a target enrichment table. A rule declares `input_bindings`, so the evaluator reads
  `request_body` **server-side** and writes a derived, non-sensitive column. That is the sanctioned way to
  surface something derived from a sensitive column without granting access to it — which is why the earlier
  "possibly unreachable" framing was wrong. It is reachable; it just is not a column, it is a pipeline.

So the fixtures carry `title` and `snippet` now, shaped as that enrichment will deliver them, and no query
references them: the enrichment does not exist, and an unknown field is an HTTP 400 indistinguishable from a
typo. `ConversationRow` types both as nullable **permanently**, not just until the enrichment lands — the join
is a LEFT join, so a conversation the evaluator has not processed has no row on that side.

Two details that will otherwise be discovered the hard way, recorded on `CONVERSATION_SUMMARY_ENRICHMENT`:

- Enrichment columns arrive under a **dotted** flat name (`conversation_summary.title`) so they cannot collide
  with source columns.
- AG Grid reads a dotted `field` as a path into nested row data, so a dotted key must be **aliased** in the
  select (`col(field('conversation_summary.title'), 'title')`) or the cell silently resolves to nothing.

Rejected: **creating backend tables purely to hold mock data.** It moves fixtures behind a network call without
making them more real, needs migrations and an encryption key for a throwaway, and gives up the one thing the
in-repo mock is good at — being edited in a test to reproduce a specific shape. Rejected too: **parsing
`request_body` in the frontend.** It requires FULL_ADMIN for every viewer, ships prompt payloads to the browser,
and puts prompt-shape parsing in the client.

The cell renderer was already the seam for this, so adding both lines changed no column definition. The one
consequence to note: with a title *and* a snippet the two lines are full, so a fully enriched row no longer
shows the raw `chat_id` anywhere. That is what the design shows, and it makes row-click navigation the
replacement for reading the id off the grid rather than a nice-to-have.

### The provenance band says what is true, which is less than the mock shows

The eval comparison grids already do grouped headers — plain `ColGroupDef` with `headerName` and `children`,
`groupHeaderHeight` in `additionalGridOptions`, and group-cell styling scoped by a container class in
`scss/ag-grid.scss`. Reused as-is, plus a `headerGroupComponent` for the per-source colour and the derived-data
icon, which the eval grids do not need.

The band is generated from one ordered list (`CONVERSATION_PROVENANCE_GROUPS`) that maps each column to its
source, and the group defs are built by looking columns up in the existing column array — so the band and the
columns cannot drift, and a column that changes source is a one-line edit.

The important part is what the labels say. The design mock shows four groups; only two are true of what this page
selects:

| Mock group | Over | Reality here |
|---|---|---|
| `CONVERSATION` | Conversation | ✅ but the cell also carries enrichment-derived title/snippet |
| `DIAL_USAGE_LOG` | Project · Model | ✅ for Project; there is no Model column |
| `FEEDBACK` | Rating | ❌ no Rating column — feedback is a filter here, not a column |
| `ENRICHMENT · USAGE` | Tokens, Cost | ❌ **wrong** — these are `sum(total_tokens)` and `sum(total_price)`, read straight from `dial_usage_log` |

Labelling Tokens and Cost as enrichment-derived would be the worst possible error in a provenance band: it exists
precisely so a reader can trust where a number came from, and a band that misattributes is worse than no band.
So the shipped band is:

- `CONVERSATION · ENRICHMENT` — the Conversation column, coloured as enrichment and carrying the derived-data
  icon, because that cell stacks a `dial_usage_log` id with an enrichment-derived title and snippet. The tooltip
  states which part comes from where **and** that the enrichment is not live, so the title is a sample value.
- `DIAL_USAGE_LOG` — Project, Turns, Activity, Tokens, Cost, all aggregates over the source table.

Colours map onto the mock's palette through theme tokens rather than literals: `text-accent-primary` (blue) for
the source table, `text-accent-secondary` (cyan) for enrichment, `text-warning` (amber) reserved for feedback,
`text-secondary` for identity. `ColumnProvenance` is exhaustively mapped, and a test asserts every value resolves
to a colour so adding one cannot silently render unstyled.

Two smaller notes. `AgGridProps.columnDefs` is typed `ColDef[]`, not `(ColDef | ColGroupDef)[]`; group defs pass
because `ColDef`'s properties are all optional and the value is a variable rather than a fresh literal, so no
excess-property check applies. `ComparisonPivotView` already relies on this. Widening the shared type would be
more correct but ripples into `GridView`'s state and the columns-panel utils, which is a bigger change than this
warrants. And the band is compatible with the omitted `storageKey` — column groups would have been the one thing
that made `storageKey` genuinely unsafe, and it is still absent.

### The rating split is counted per direction, not derived

`QueryFunctionCatalog` is a closed set: `abs`, `avg`, `count`, `date_bin`, `length`, `lower`, `max`, `min`,
`percentile_cont`, `percentile_disc`, `sum`, `trim`, `upper`, `width_bucket`. No `argMax`, no `CASE`, no
conditional aggregation. So "3 up, 1 down" is not expressible in a single query, and neither is "latest rating".

Each direction is therefore counted by its own query — `count(rate)` grouped by `chat_id`, restricted by `in` to
the displayed ids, filtered by `gt(rate, 0)` for the positive side and `le(rate, 0)` for the negative one. Those
are the **same** predicates `ratePredicates` builds for the feedback filter, reused rather than restated: that is
what guarantees the column and the filter agree, so a conversation the Positive filter selected cannot display a
zero positive count. The two run concurrently, so the cost is one extra round trip's latency, not two.

**This reverses the original decision, which was wrong.** It read the ADAS normalization rule — "a numeric value
passes through as its integer value; a boolean `true` maps to `1` and `false` to `0`" — and concluded a thumb is
always `1` or `0`, making `sum(rate)` the positive count and `count - sum` the negative one. The clause it skipped
is the first one. DIAL's own `MessageRating` is `{ Like = 1, Dislike = -1 }`, stored as a signed integer, so the
numeric path is the normal path and `-1` is the normal dislike. One like and one dislike then sum to zero and were
reported as **0 👍 / 2 👎**; two likes and one dislike as 1/2 instead of 2/1.

The clamp to `[0, total]` made this worse rather than safer. It was added so an out-of-domain value could not
render `👍 9 👎 -7`, but its real effect was to turn every wrong answer into a plausible one — bounded, correctly
totalled, and silently misattributed. A visibly broken count would have been caught on the first screenshot. The
lesson worth keeping: clamping a value whose *derivation* is unsound only hides the unsoundness.

The dismissal of the two-query route as "exact for any domain but costs two round trips for a case DIAL does not
produce" was the load-bearing error — DIAL produces that case by default. `0` still counts as negative, since that
is what a normalized boolean `false` is, which is also why the negative side uses `le` rather than `lt`.

The lookup is a **fresh** pair of queries rather than a reuse of the feedback filter's candidate set, deliberately. The
candidate set is capped at 1000; a displayed conversation could fall outside it and would then render as unrated
when it is not. Restricting a fresh query by `in` to the ≤20 ids actually on screen is exact, and the `in` list is
tiny. Cost: two concurrent extra queries on every load, three round trips when a feedback filter is active.
Reusing the candidate rows
would save one and is a safe optimisation later, but it needs a "which ids do I already know" branch that is not
worth the complexity yet.

Both counts render always, including zeros, because a cell showing only `👍 2` cannot be distinguished from one
where the negative side failed to load. Colours come from `text-success` and `text-error`; the unresolved case
(query failed) renders nothing at all rather than `0 / 0`, which would assert an absence of feedback that was
never established. That distinction is why `rating_up`/`rating_down` are nullable rather than defaulting to zero.

Two deviations from the design image, both forced:

- **No comment bubble.** `rate_analytics.comment` is seeded `sensitive` in `V3__add_sensitive_columns.sql`, so a
  non-`FULL_ADMIN` caller cannot select it or even `count` it. Same wall as message search.
- **Ratings outside the selected period are not counted.** The ratings query carries the same time bounds as the
  conversation query, so the column and the feedback filter agree — a conversation the filter matched as positive
  cannot then display as unrated. Unbounding the lookup would be friendlier in isolation and would make the
  filter and the column contradict each other, which is worse.

### Search covers the title, gated by one flag

Initially search stayed on `chat_id` and `project_id`, on the grounds that the mock must not offer behaviour the
live query cannot reproduce. That was the wrong trade: typing a visible title and getting nothing reads as broken,
and the reasoning had a hole — on the live path no row carries a title at all, so searching one matches nothing
either way. The only real obstacle is that referencing an unregistered column is a 400.

So `USE_CONVERSATION_SUMMARY_ENRICHMENT` gates **both** the enrichment's select entries and its search predicates.
One flag, because the failure mode worth designing out is a title that is displayed but not searchable. The
fixtures search title and snippet unconditionally, since they exist to stand in for the enrichment — including how
it will behave.

Worth correcting an earlier claim: enrichment columns are filterable, not just selectable. `addColumn` puts them
into the *same* `bindings` map as base columns under their dotted name, and `filter` is translated with those
bindings. The "filter resolves against base fields" note applies to select *aliases*, which never enter bindings —
not to enrichment columns. So the search predicate needs no special mechanism, and a filter reference is enough to
emit the join.

### Naming: `conversations-trace` in code, "Conversations" on screen

Every identifier, path, and route segment uses `conversations-trace`; every user-facing string reads
"Conversations". Verified safe: breadcrumbs resolve on the exact first path segment
(`Breadcrumbs/utils.ts`) and menu active state on `item.href === pathname` (`MenuContent.tsx`) — no prefix
matching, so `/conversations-trace` cannot shadow `/conversations`. The menu label needs its own
`MenuI18nKey` member distinct from the DIAL Core one despite the identical English string.

### No breadcrumb entry

Neither `/tables` nor `/query-builder` has a `breadcrumbConfig` entry, so adding one only here would make
this page the inconsistent sibling. If the mock's `Home / Analytics / …` trail is wanted, it should land as
its own change covering all Analytics pages.

## Risks / Trade-offs

**The query is unverified against real ADAS** → Three assumptions stay open: that sorting by the aggregate
alias `last_activity` resolves (ADAS's `structured-query` spec says aggregate sort resolves against base
fields *together with select aliases*, but this is untested here), the timestamp wire type, and the decimal
scale. Mitigated by typing row fields to accept either shape and by fixtures shaped like the worst case.
The real mitigation is flipping the switch early — it is one boolean and it retires the entire remaining
risk surface at once.

**Currency formatting is very likely wrong for ADAS decimals** → `Big#toString()` does not round, so real
sums will render a dozen fractional digits. Deliberately surfaced by the fixtures rather than fixed here,
because the fix (round in this page's formatter, or change the shared one) affects every price column in
the app and deserves its own decision.

**The design mock's title and snippet depend on an enrichment that does not exist yet** → They have no source
column: `dial_usage_log` has no `topic` or `title` (the `topic` in `USAGE_LOG_TRACES_COLUMNS` belongs to the
telemetry API), and `request_body` is `sensitive`. The path is a `chat_id`-grain enrichment whose evaluator
derives them server-side, which the query engine then LEFT-joins into the same query. Until that enrichment is
registered, only the fixtures populate them, so **the page looks like the design with the mock switch on and
like a plain id-only table with it off**. That gap is deliberate and visible in one place (the fixtures), but
reviewers comparing screenshots against the design need to know which mode produced them.

**Filtered results are silently capped at 20** → A search matching hundreds of conversations shows the 20
most recent, with nothing on screen saying so. Of the available mitigations — a result-count line, raising
the limit, or paging — only paging is honest, and it is the next change. Named here so it is a known gap
rather than a surprise.

**`ico` on `project_id` cannot use the index** → `chat_id` and `user_hash` have bloom-filter indexes;
`project_id` has none (it is the leading `ORDER BY` column, which helps equality far more than `ILIKE`). A
project search therefore scans the time-bounded partitions. The time bound caps the damage, and the default
7-day window keeps it small, but a 30-day project search on a large table will be slow. Not addressable
client-side.

**Two pages will say "Conversations"** → The Usage Log tab and this page, on different backends. Accepted
for now; the eventual relationship between them is an open question, not something this change resolves.

**Pre-existing spec/code drift on menu order** → The `analytics` spec states the sub-item order as Query
Builder then Tables; `menu-configuration.tsx` has Tables first. The delta spec preserves the existing claim
and appends Conversations rather than silently reversing an unrelated statement. Fixing the drift is out of
scope.

## Migration Plan

Additive and read-only: no schema change, no new endpoint, no data migration. The page is invisible unless
`ANALYTICS_ENABLED` is set, since it sits inside the already flag-gated Analytics menu group. Rollback is
reverting the commit; nothing persists (no `storageKey`, so no localStorage residue).

## Open Questions

1. **Who registers the `conversation_summary` enrichment, and what exactly does its evaluator emit?** The
   frontend contract is now fixed (`title`, `snippet`, both nullable, `chat_id` grain), so this is a backend
   task: an evaluator with a `request_body` input binding, a rule targeting the enrichment table, and the
   catalog registration that publishes the columns. Cost and cadence are the open part — an LLM call per
   conversation is not free, so sampling and `trigger_kind` matter.
2. **What does a production `chat_id` look like?** Needed to tune the conversation column's proportions. No
   sample exists in either repo; one real value from a live environment settles it.
3. ~~Where should decimal rounding live?~~ **Resolved for this page**: a page-local significant-digit formatter,
   leaving `currencyValueFormatter` and every other price column untouched. Whether the shared formatter should
   also round is still open, but no longer blocks this page.
4. **Does the Usage Log "Conversations" tab eventually become this page?** If so, this page's column set
   should converge toward that tab's rather than the mock's.
5. **Should search be a "search" or a "filter"?** Today it is one term matched against two columns. If
   operators actually want "this project, that date range, cost above X", the answer is per-field filters
   composed into the query — a different control, not a wider `or`. Worth learning before widening this one.
6. **Should the applied filters live in the URL?** They are component state, so a filtered view cannot be
   linked or survive a refresh. Search params would fix both and would suit a `force-dynamic` server
   component, but it is a wider pattern question — no sibling Analytics page does it either.
7. **Should feedback also become an enrichment?** `rate_analytics` is a source table, so filtering by feedback
   costs a second query and a 1000-id candidate cap. A `chat_id`-grain enrichment rolling up each
   conversation's rating would collapse that to one query with a plain predicate, remove the truncation cliff
   entirely, and make a feedback *column* nearly free. Same mechanism as `conversation_summary` and no LLM
   involved — the strongest follow-up of the three.

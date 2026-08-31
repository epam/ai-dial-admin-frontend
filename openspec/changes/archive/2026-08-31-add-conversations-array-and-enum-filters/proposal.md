## Why

Two columns of the conversations grid cannot be narrowed, for two unrelated reasons.

**Deployments offers no filter.** The column states `sortable: false, filter: false` with a comment saying
the query language expresses no predicate over an array. The comment is wrong: the service's function
catalog carries `array_has`, `array_has_any`, `array_has_all` and `array_length`, all returning boolean and
all valid in a filter. Only the *comparison operators* are scalar — `ILIKE` and `IN` against an array are
rejected, which is what was checked when the column was written.

Verified against a live instance: `array_has_any(deployments, ARRAY[...])` filters `sessions` correctly
today, with no service change.

**Columns with a closed value set offer a free-text box.** `sentiment` holds one of four values and
`resolution_status` one of five, but both are typed `string`, so both get a contains filter and the
operator must know and spell the value. The value sets exist only as prose in each field's `description`,
and the schema carries no signal that a field is an enum at all.

## What Changes

### Deployments gains a contains filter — no service change

The operator types text and gets the same contains, does-not-contain, equals and not-equals a text column
offers. Because the underlying array functions match whole elements rather than substrings, a contains
filter is answered in two steps:

1. resolve the deployment names matching the entered text, from the usage log's scalar `deployment` column;
2. filter sessions with `array_has_any(deployments, [those names])`.

Both steps work against the service as it stands. Measured on a live instance: `gpt` resolves to 92 names
and returns 920 sessions; the whole catalog is 1091 names, and a 300-element predicate was accepted
without complaint — so the list needs no cap and no truncation warning, because the worst case is bounded
by the number of deployments that exist.

The column stays unsortable. An array has no ordering the query language expresses, and that has not
changed.

### A column whose type is `enum` filters by selecting values

The operator picks from a list instead of typing. The selection becomes one `in` predicate. Values are
discovered by a grouped count when the filter opens, listed most frequent first with each value's count.

Enum-ness is read from the field's declared type — no list in the frontend, no cardinality heuristic. A
count-based rule misclassifies both ways on current data: `session_insights.language` shows six values but
is an open BCP-47 set, while `activity_sub_task_type` has twenty-two and is a genuine enum.

**This half depends on the service adding an `enum` member to its field-type set.** That work lives in the
analytics service's own repository and is not a task here. Until it ships, no field is typed `enum`, so
nothing changes — the frontend needs no flag to stay quiet.

### Non-goals

- **No service-side array operators.** An earlier draft assumed element-wise comparison operators had to be
  added. They do not: the catalog functions already cover it.
- **No value list for deployments.** With 1091 names the set is open and grows with every deployment added;
  a picker would present a moving set as a closed one. Deployments gets text, enums get the picker.
- **No "no value" entry in the value filter.** Null is common on enrichment-backed fields —
  `usage_scope` is null on most rows, having arrived in a later evaluator version — but selecting rows an
  enrichment has not reached is a different control from choosing among an enum's values.
- **No sort on any array column**, and no sort by frequency on an enum column.
- **No client-side filtering.** The grid pages server-side; narrowing loaded pages would report a slice as
  the whole answer.

## Capabilities

### New Capabilities

None. Both behaviours extend the conversations grid, whose requirements live in the analytics spec.

### Modified Capabilities

- `analytics`: three requirements change.
  - *Conversations grid with server-side ordering and per-column filtering* — its column table records
    deployments as offering no filter, and its operator list admits no set-membership operator.
  - *Conversations grid names the deployments a conversation used* — it requires the column to offer no
    filter, and gives a reason about the query language that is not correct. Removed and replaced, because
    its central claim is false rather than incomplete.
  - *Conversation grid columns are the curated set plus every field the entity schema reports* — its rule
    deriving a filter from the declared type carves out only timestamp and boolean, and has no enum branch.

## Impact

**Behaviour.** Deployments gains a filter it has never had, on deploy, with no backend coordination. Seven
scalar columns that offer a text box today gain a value picker once the service reports the enum type — on
the current schema those are `client_type`, `client_session_source`, `session_insights.activity_type`,
`.resolution_status`, `.sentiment`, `.usage_scope` and `.activity_sub_task_type`. No column loses a control.

**Frontend code.**

- `constants/grid-columns/grid-columns.tsx` — the deployments column's `filter: false` and its comment.
- `utils/analytics/conversations-queries.ts` — the name-resolution query and the grouped-count query.
- `app/[lang]/conversations-trace/actions.ts` — a server action for each.
- `models/analytics/entity.ts` — `AnalyticsFieldType` gains `Enum`.
- `models/analytics/conversations-trace.ts` — `ConversationFilterOperator` gains a set-membership member.
- `constants/analytics/conversations-trace.ts` — the two operator maps, and the field value-type map, which
  has no entry for `deployments` today.
- `utils/analytics/conversation-column-catalog.ts` — `typeColumn` gains an enum branch.
- `utils/analytics/conversation-grid-models.ts` — the filter model gains a values list.
- `components/Grid/AgGridWrapper.tsx` — `CustomFilterModule` for the value filter, which is written rather
  than configured because `agSetColumnFilter` is AG Grid Enterprise and this repo has the community package.

**Blast radius.** `AgGridWrapper` is shared by every grid, but registering a module is additive.
`AnalyticsFieldType` is shared with other analytics views; adding a member makes exhaustive switches over
it incomplete, which is a compile-time failure rather than a silent one.

**Cost.** The deployments filter costs one extra query per applied filter — the name resolution. The enum
filter costs one grouped count per filter opening, on enum columns only.

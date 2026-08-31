## Context

See proposal.md — Why. The constraints that shape the approach:

- **The service's array predicates are functions, not operators.** `array_has`, `array_has_any`,
  `array_has_all` and `array_length` are in the closed function catalog, return boolean, and are valid in a
  filter. The comparison operators (`ico`, `in`, …) are scalar and reject an array operand — which is what
  the existing `filter: false` comment was written against.
- **They match whole elements.** There is no lambda form, so no `arrayExists(x -> x ILIKE …)`. A substring
  test over elements has to be resolved to whole values first.
- **The filterable allow-list is derived, not held.** `filterableColumnFields` reads `filter !== false` off
  the column defs, so enabling a filter is one property and the predicate path follows.
- **`QueryOperator.In` and `inValues()` already exist**, used today for chat-id and trace-id narrowing.
- **Grouped queries are already built here** — `query-build.ts` takes a `groupBy`.
- **AG Grid here is the community package**, so `agSetColumnFilter` is unavailable and the value filter is
  a component we write; `CustomFilterModule` is not yet registered.

## Goals / Non-Goals

**Goals:**

- Deployments filterable on deploy, with no service change and no coordination.
- One switch per behaviour: `filter: false` for the array column, the declared type for enum columns.
- The frontend gains no knowledge of which fields are enums or what values they hold.

**Non-Goals:**

- Rebuilding the text and number filter menus. They keep AG Grid's own components.
- A general faceted-filter framework. The value filter is scoped to this grid.
- Extending the two-step filter to `client_types`, `auth_types`, `user_refs` or `traces` in this change.
  The mechanism is generic and they can follow later; only Deployments has a column today.

## Decisions

### A contains filter is two queries, both issued by one server action

`contains` on Deployments resolves the entered text against `dial_usage_log`'s scalar `deployment` column,
then narrows `sessions` with `array_has_any(deployments, [resolved names])`. `equals` skips the resolution
and calls `array_has` directly.

Both queries are issued inside the same server action, so the client makes one call and the two-step shape
does not leak into the grid's filter handling.

*Why the usage log as the source:* `sessions.deployments` is built from usage-log hops, so the names match
exactly. A list read from the deployments admin API would be the configured set, which can differ from what
actually appears in the data — a name present in one and absent from the other produces a filter that finds
nothing for no visible reason. The resolution query carries the view's period, which costs one predicate
and keeps the resolved set to names that can actually appear in the result.

*Alternative considered — a value picker instead of text:* rejected. 1091 distinct deployments exist; a
picker would present an open, growing set as a closed one. This is exactly the distinction that makes
Deployments text and enum columns a picker.

### The resolved set is not capped, which takes a paged walk rather than one query

Measured on a live instance: `gpt` resolves to 92 names; a 300-element `array_has_any` was accepted and
returned the correct count; the whole catalog is 1092 names.

*Why no cap:* the grid's pagination bounds the rows returned, not the predicate. Truncating the resolved
set would change what the filter means — the operator would get fewer conversations than match, with
nothing in the UI to say so. A wrong answer is worse than a large predicate, and the predicate is bounded
by how many deployments exist rather than by how much data there is.

*Why it cannot be one query.* An earlier draft of this design said the resolution should simply name no
page. That is wrong, and wrong in the silent direction: the service applies its own `DEFAULT_LIMIT` of 100
rows to a query carrying no page, so "unpaged" resolves to the first 100 names. Its `MAX_LIMIT` is 1000 and
a larger requested limit is **rejected rather than clamped**, so no single query can hold the 1092 names
that exist either. Measured: the same grouped query with no limit returned exactly 100 rows, and `%a%`
alone matches 977 names — so a moderately broad term was returning a small fraction of the matching
conversations under an active filter, which is precisely the outcome this decision forbids.

The resolution is therefore a walk: pages of `MAX_LIMIT`, ordered by the value so the pages are disjoint,
continuing while a page comes back full and ending on the first short one. Two requests cover the current
catalog. A page cap guards against a service that ignores the offset; reaching it abandons the filter
rather than truncating it, because a partial set is the wrong answer this decision exists to prevent.

*Why the large predicate is safe.* The DSL's `ArrayExpr` carries no item-count validation — only a
non-empty check — and this view already ships `in` lists of up to `FEEDBACK_CANDIDATE_LIMIT` (1000) chat
ids, which are longer strings than deployment names, through the same endpoint. A full-catalog predicate is
not a new risk class.

*Consequence:* a one-character search resolves to most of the catalog and produces a large predicate. That
is accepted; it is still correct, and it is the rare case.

### Enum-ness is a field type, and the branch belongs in `typeColumn`

`AnalyticsFieldType` gains `Enum`; `typeColumn` gains a branch returning the value filter. Every derived
column already routes through `typeColumn`, so a field an instance begins reporting as an enum gets the
filter with no frontend change.

*Why a type rather than a `values` array on the field:* values from the schema would be the declared
domain, which cannot express `activity_sub_task_type`'s dependence on `activity_type` and carries no
counts. The type says what the field is; the query says what is in it.

*Why not a cardinality probe:* it misclassifies both ways on current data — `language` shows six values and
is open, `activity_sub_task_type` has twenty-two and is closed. Tested against a live instance before the
type approach was chosen.

*Gating:* none needed. No field is typed `enum` until the service says so, so a frontend shipped ahead of
that service change simply shows nothing new.

*What adding the member costs elsewhere.* `AnalyticsFieldType` is shared with the table-catalog views, and
one consumer enumerates it rather than switching over it — the column-type dropdown builds its options from
`Object.values(AnalyticsFieldType)`. That is a **silent** break, not a compile-time one: it would offer
"Enum" as a declarable column type the catalog rejects. The declarable set is therefore named explicitly and
excludes it. The one exhaustive `Record<AnalyticsFieldType, …>` does fail to compile, as expected.

### Enum values come from a grouped count, faceted against the page's other narrowing

A server action issues `group_by: [field]` with a count, ordered descending, under the view's period,
search, feedback and **other** columns' predicates — never the opened column's own.

*Why exclude the column's own:* including it collapses the list to what is already selected, so a selection
could never be widened without first being cleared.

*Why include the rest:* a count that does not match the rows the selection would return is worse than no
count.

### The resolution belongs to the result, not to the page

The listing is an infinitely scrolling grid whose datasource is called once per block, so a resolution
issued inside it would run again for every page — and, because it reads a live table, could narrow page
five by a different set than page one, making rows duplicate or vanish across the scroll.

So the sets are resolved on the **first** page of a result, returned to the caller, and carried back into
every later page of it. This is the shape the feedback candidates already travel in, for a weaker reason —
there it saves a query; here it is what makes the pages describe one result. The value-discovery query
carries them too, so a facet count is computed under the same set the rows on screen are.

### The value list is bounded, unlike the resolved set

The grouped count that discovers an enum's values is read as one page of 200. This is a cap, and unlike the
resolution's it is deliberate: an enum's value set is closed and small — twenty-two on the widest field of
the current schema — so the bound is only reached by a field the service has typed `enum` when it is not
one. There, a truncated list is a better outcome than a menu of thousands. It is not a correctness
compromise the way a truncated resolution would be, because a value the operator cannot see is a value they
cannot select, whereas a name missing from a resolved set silently changes what a filter they already
applied means.

### The filter model carries a list; the translation maps it to one `in` predicate

`GridColumnFilter` gains an optional selected-values list. `toColumnFilter` returns a set-membership
`ConversationColumnFilter` when it is present and non-empty, mapping to the existing `QueryOperator.In`
through `inValues()`. An empty list falls through to the existing `null` return, so "no selection, no
predicate" needs no new branch.

### The value filter is a component we write, over `Checkbox` from the design system

AG Grid supplies the popup and lifecycle; the component supplies the list. `Checkbox` (2.0) per value
rather than `Select`, which brings its own field and overlay and would nest a second popup inside the
grid's.

Accessibility, per the project's rules: each option's accessible name carries the value and its count; the
list is a group named for the column; the loading, empty and failed states are announced through a live
region rather than being visual-only; the menu is keyboard-reachable and dismissible on the same terms as
the grid's own filter menus.

### Deployments keeps `sortable: false` and gains a value type

The column drops `filter: false` and gains an entry in `CONVERSATION_FIELD_VALUE_TYPE` (it has none today,
consistent with never having been filterable). It stays unsortable. The stale comment is replaced — it
currently records a conclusion that is not correct.

## Risks / Trade-offs

**A broad search term produces a large predicate.** A one-character term resolves to most of the 1091-name
catalog → accepted deliberately, because the alternative is a silently wrong result. Bounded by the
catalog size, not by data volume.

**The contains filter costs extra queries per applied filter.** → They run inside the one server action, on
the first page of a result only, and only when the operator applies a contains or does-not-contain filter;
`equals` skips the resolution entirely. The count is one per page of the resolution walk — two against the
current catalog — not one per page of the grid.

**Adding `Enum` to `AnalyticsFieldType` makes exhaustive switches over it incomplete.** → Compile-time
failures in a strict-mode build, not runtime fallthroughs. The enum is shared with other analytics views,
so the blast radius is wider than this grid. One consumer is **not** caught by the compiler — an
`Object.values` over the type set that would offer the new member as a declarable table-column type — so the
declarable set is named explicitly rather than derived from the enum.

**Faceting means the offered values shift as other filters change.** → Intended, and the reason counts are
shown, but it is a behaviour change from a text box that offered no list at all.

**Null is not selectable, and `usage_scope` is null on most rows.** → An operator wanting "not yet
labelled" has no control for it. Recorded as a non-goal; a coverage control is a different feature.

## Migration Plan

**Deployments ships on its own**, with no service dependency. Nothing is gated; the filter appears when the
frontend deploys.

**The enum filter is gated by the data.** No field is typed `enum` until the analytics service adds that
member to its field-type set, so the code can ship first and stay dormant. When the service starts
reporting the type, the value filters appear with no further frontend release.

Rollback is the ordinary frontend rollback. No stored state changes shape — no column is added, removed or
renamed, so persisted column state is unaffected.

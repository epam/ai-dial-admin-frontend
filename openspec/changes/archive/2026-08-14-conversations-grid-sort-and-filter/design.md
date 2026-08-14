## Context

See `proposal.md` — Why. The constraints that shape the approach:

- The grid uses AG Grid's **infinite** row model. `getRows` receives `params.sortModel` and
  `params.filterModel` on every call, and AG Grid purges its blocks and re-requests row 0 by itself when
  either changes. So sort and filter state need no mirror in React state and no explicit reset wiring.
- Usage Log is the in-repo precedent for server-side sort and filter, but only conceptually: it uses the
  client-side row model with manual scroll-append, so it has to keep `sortDirectionRef` / `filterModelRef` and
  hook `onSortChanged` / `onFilterChanged`. What *is* directly reusable is its translation layer —
  `translateUsageLogSortModel` and `translateUsageLogFilterModel` in `src/utils/telemetry.ts` — pure functions
  from grid models to backend clauses, with a per-type operator map and `null` for an incomplete entry.
- `src/constants/grid-columns/filters.ts` already defines `baseStringFilter`, `baseNumberFilter` and
  `dateFilter`, and their `filterOptions` already list exactly the operators the analytics DSL can express
  (`GridFilterType` carries no `startsWith` / `endsWith` at all). The untranslatable-operator problem is
  already solved by the presets.
- `restrictSort(cols, sortableFields)` already exists and already takes a whitelist; this grid passes an empty
  array today, which is what locks every column.
- This change assumes `conversations-summary-and-user-column` has landed: the totals resolution now happens
  inside the first-page branch of `getRows`, which is the seam that lets the totals pick up column filters.

## Goals / Non-Goals

**Goals**

- Sort and filter are query concerns; the fetched pages are never reordered or narrowed locally.
- A column offers a control only when the query can answer it over the whole result.
- The summary's whole-result figures stay in agreement with the rows under every sort and filter state.

**Non-Goals**

- No persistence of sort or filter state. The grid has no `storageKey`, and adding one belongs to the
  column-selection change — which is also where the "a restored filter must reach the first fetch" problem has
  to be solved. Keeping it out here keeps this change's surface to the query path.
- No filter on the Rating column and no rating-aware ordering. That needs rating counts on the rollup.
- No change to the feedback filter's two-query strategy or its 1000-id limit — only the disclosure that the
  limit was reached.
- No new column-filter UI. The existing AG Grid filter menu and floating filter row are the controls.

## Decisions

### The datasource reads the grid's models rather than mirroring them

`getRows` translates `params.sortModel` and `params.filterModel` on each call and passes the result through
the server action. No `useState`, no `onSortChanged` / `onFilterChanged` handlers, no explicit purge: AG Grid's
infinite model already discards its blocks and asks for row 0 when either model changes, which is exactly the
"restart paging" the spec requires. The `datasource` identity keeps changing only with the *page's* filters
(search, period, feedback), as today.

*Alternative considered:* Usage Log's shape — refs plus `onSortChanged` / `onFilterChanged`. It is the same
work done twice, and a mirrored model can disagree with the grid's own after a reset.

*Consequence:* because the models arrive as arguments rather than living in state, nothing outside the
datasource can read them. The candidate-cap disclosure therefore hangs off the candidate resolution, not off
the filter state, which is where it belongs anyway.

### Translation is two pure utils, and the boundary carries plain data

Two functions in `src/utils/analytics/` — one from `SortModelItem[]` to the DSL's sort keys, one from AG Grid's
filter model to a list of column-filter descriptors. They emit the repo's own serializable shapes (declared in
`src/models/analytics/conversations-trace.ts`), not `StructuredQuery` fragments, because they run on the client
and the descriptors cross a server-action boundary. `buildConversationListQuery` and
`buildConversationTotalsQuery` then turn descriptors into predicates server-side.

The split matters for a second reason: the descriptor list is what both queries consume, so the totals query
cannot drift from the list query — they are built from one input.

Unknown fields and unmapped operators are rejected at translation, not silently dropped, so a typo in a column
id surfaces as a failure rather than as a quietly unfiltered result. An *incomplete* entry — operator chosen,
value blank — is a different case and is skipped, matching how the grid itself treats it and how
`translateUsageLogFilterModel` already behaves.

*Alternative considered:* translating straight to `QueryFilterNode` on the client. The nodes are the wire
format and would then be built in two places; keeping the descriptor as the boundary type means the query
shape stays owned by `conversations-queries.ts`.

### Column configuration reuses the existing filter presets and the existing sort whitelist

`CONVERSATIONS_TRACE_COLUMNS` stops mapping `filter: false, floatingFilter: false` over every column. Instead
each column spreads the preset its type calls for — `baseStringFilter` for conversation, project and user,
`baseNumberFilter` for turns, tokens and cost — and `restrictSort` receives the list of field-backed columns
rather than an empty array. Activity and Rating keep `filter: false`; Rating additionally stays outside the
sort whitelist.

Two details this inherits for free: the presets' `filterOptions` are already the translatable subset, and
`maxNumConditions: 1` already prevents a two-condition filter the descriptor shape does not model.

The cost column's existing `filterValueGetter` is for client-side filtering and is not used on this grid; the
predicate is built from the raw field, so a formatted-value getter must not be introduced here — it would
filter on `"$0.001"` rather than on the number.

*Alternative considered:* a date filter on activity via the existing `dateFilter` preset. Rejected: the
period control already predicates on `last_request_time`, so a column filter there is a second control over
one dimension whose apparent range the period silently clips. Sorting has no such conflict.

### Sort keys carry an explicit nulls ordering, and the tiebreaker is appended not replaced

A user sort key becomes `{ field, dir, nulls: 'last' }`, and `{ chat_id, asc }` is appended after whatever the
user chose. The tiebreaker is what keeps offset paging stable, so it is appended in every case, including when
the user sorts by `chat_id` itself — a duplicate key is harmless and the alternative is a special case that
can be got wrong. An empty sort model produces the query's existing default.

Nulls ordering is stated rather than inherited because several of these columns are nullable (`project_id`,
`user_hash`, and the price and duration measures), and an unstated nulls position makes a descending sort's
first page backend-dependent.

Multi-column sort falls out of this for free — the DSL takes a list and AG Grid's shift-click already produces
one — so it is neither enabled specially nor suppressed.

### The candidate-cap disclosure lives with the candidate resolution

`resolveCandidates()` already knows how many ids came back; when the count equals the limit, it flags it, and
the view renders the disclosure near the feedback control for as long as that filter state applies. Because the
candidate set is resolved once per filter state and reused across pages, the flag changes only when the filter
state does — it does not flicker per page.

Rendering it as a persistent inline notice rather than a toast is deliberate: it qualifies the result currently
on screen, and a toast that has been dismissed leaves a truncated result looking complete.

## Risks / Trade-offs

- **Sorting by a non-indexed column can be slow** on a large rollup, and the page has no query-timeout
  handling of its own beyond the existing error path. → The failure surfaces as the existing error
  notification and empty-state wording; if it proves common, the fix is a backend index, not a client
  workaround.
- **An operator can now build a filter that matches nothing** and read it as "no traffic". → The existing
  no-data state and the error-vs-empty distinction already cover this; the filter itself stays visible in the
  header, so the narrowing is on screen.
- **The predicate value type must match the field**, and cost carries twelve fractional digits. Sending it as
  a float would round the bound. → Price predicates carry decimal literals, as the totals query's own
  handling of these values already establishes.
- **Column filters plus the feedback filter multiply the ways a result can be capped.** → Handled by making
  the cap disclosure a property of the candidate set rather than of the sort, so it holds under every
  combination.
- **The activity column sorts but does not filter**, which is an asymmetry an operator may read as an
  oversight. → It is the one dimension with a dedicated control at the top of the page; if it reads as a gap,
  the answer is to make the period control more discoverable, not to add a competing filter.
- **Nothing persists.** An operator who reloads loses their sort and filters, which will feel like a
  regression against grids that do persist. → Deliberate; it lands with the column-selection change, which
  introduces the `storageKey` this grid currently omits.

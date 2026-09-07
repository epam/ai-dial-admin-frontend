## Context

See proposal.md — Why. Two facts from the service's contract shape everything below:

- `source` is returned non-empty and **sorted alphabetically**, so its first element is not the
  statement's outer or governing relation — it is simply the first name in sort order.
- A composite SQL body is refused by `POST /v1/queries/translate-sql`, so such a query can never
  hydrate into the visual builder. It always opens, and stays, in the SQL view.

Today the frontend reads `source` in exactly two places: `savedQueryEntityName`
(`components/Analytics/QueryBuilder/utils/saved-query.ts`) and the saved-query `source` grid column
(`constants/grid-columns/grid-columns.tsx`). Both assume a string.

## Goals / Non-Goals

**Goals:**

- One derivation of "the single entity this query is about", used by every consumer that needs one.
- A Source column that stays sortable, filterable, and readable when a query has several sources.
- Tolerance for a `source` that is absent or empty, so a response shape change cannot blank the page
  again.

**Non-Goals:**

- Any new UI affordance for multi-source queries (see proposal.md — Non-goals).
- Changing how the SQL ↔ DSL translation guard behaves.

## Decisions

**Rename the derivation to say what it now is.** `savedQueryEntityName` keeps its call sites but its
contract changes from "the query's entity" to "the query's primary source", so it is renamed
`savedQueryPrimarySource` and returns `saved.query?.entity ?? saved.source?.[0] ?? ''`. The name is
the documentation here: a caller reading `savedQueryEntityName(saved)` on a joined query would
reasonably assume the value is the only entity in play. Alternative considered — keeping the name and
adding a comment — rejected because the misreading happens at the call site, where the comment is not.

**Primary source = `source[0]` for a SQL body, not a client-side parse of the SQL.** Picking the
outer relation would mean parsing SQL in the browser, which the spec already forbids the frontend to
do (the service is the only authority on translation). Alphabetically first is arbitrary but stable
across reloads and identical for every viewer, and it keeps autocomplete offering real columns.
Alternative considered — load no schema for a composite query — rejected because the SQL editor then
suggests no field names at all for a query whose author most needs them; the requirement records the
trade-off instead of hiding it.

**Empty string stays the "no primary source" signal.** `savedQueryPrimarySource` already returns
`''` when nothing resolves, and `resolveFieldsForEntity` already treats `''` as "load nothing".
Keeping that sentinel avoids threading a nullable entity name through `QueryBuilderState`, whose
`entityName` is a required `string` fed straight to `DialSelect`. The page-level guard becomes an
explicit "only fetch a schema when the name is non-empty", so `getEntitySchema('')` is never issued.

**The grid column derives its text once, through a helper.** The column moves from `field: 'source'`
to a `valueGetter` returning `source.join(', ')`, with `tooltipValueGetter` and `filterValueGetter`
reading the same helper — the pattern the container columns in this file already use
(`containerSourceNameLabel`). One derivation keeps sort order, the text filter, and the tooltip
consistent; a `valueFormatter` alone would leave sorting and filtering on the raw array. The helper
lives with the other saved-query utils, not in the grid file, so the list page and any future
consumer share it.

**Model the member as `source?: string[]`.** It stays optional for the same reason the other response
members are: the service omits absent members rather than emitting `null`. The array elements are
non-optional strings.

## Risks / Trade-offs

- **A composite query's toolbar shows one entity of several, which can read as "this query is about
  that table".** → The Source column on the list page shows the full set, and the selector's role is
  already "which schema the autocomplete follows", not "what the SQL reads". Accepted, and recorded
  in the requirement so a later reader sees it was chosen rather than overlooked.
- **Changing the selected entity on a composite query silently re-points autocomplete.** → Existing
  behaviour for SQL bodies: the selector never rewrites SQL text. No change.
- **A deployment running an older service returns `source` as a string.** → `source?.[0]` on a string
  yields its first character, which would be a silent wrong value. The derivation therefore checks
  `Array.isArray` before indexing and falls back to the string itself, so the page works against
  either build — the same tolerance `unwrapList` already applies to this service's list envelopes.

## Migration Plan

None. The change is client-side only, reads a member the frontend never writes, and the service
returns one-element arrays for every query saved before its own migration.

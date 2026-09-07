## Why

The analytics data-access service now accepts composite SQL saved queries — joins, CTEs, derived
tables, subqueries — so one saved query can read from several entities. Its `/v1/saved-queries`
responses therefore return `source` as a **non-empty array** of entity names, sorted
alphabetically, instead of a single string. The frontend still models `source` as a string, so a
composite saved query breaks the two surfaces that consume it: the Queries grid feeds an array into
a text-filtered column, and the query page feeds an array into `getEntitySchema()`, whose request
404s and leaves the builder with no fields.

## What Changes

- `SavedQuery.source` becomes `string[]` — server-derived, read-only, non-empty, alphabetically
  sorted. A structured (`query`) body always carries exactly one element; a SQL body carries one
  element per entity it reads.
- A saved query's **primary source** is defined and derived in one place: the structured body's
  `entity` when there is one, otherwise the first element of `source`. It is what the page's schema
  prefetch, the toolbar's source selector, the SQL autocomplete, and the assistant's schema message
  all use.
- The Queries grid's Source column shows every source, comma-separated, with sorting, text
  filtering, and its tooltip all reading that same rendered value.
- The query page prefetches the schema of the primary source. For a composite query that is the
  alphabetically first entity — an arbitrary but stable pick that keeps field autocomplete useful,
  rather than loading no schema at all.
- The `analytics` spec is updated where it currently states a saved query has one source.

No breaking change for callers: the write payload never carried `source`, and every response member
stays read-only to the frontend.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: the saved query storage contract (`source` is an array), the Queries list page (the
  Source column renders a set), and the query page's schema prefetch and builder seeding (the
  primary source, not "the" source).

## Non-goals

- Teaching the visual builder to represent or edit a composite SQL body. The backend refuses to
  translate a composite statement to the DSL, and the existing discard guard already covers the
  Builder/JSON switch — that behavior is unchanged.
- Parsing SQL on the client to work out which entity a column belongs to, or merging the schemas of
  several sources into one field list.
- A multi-select source control, or any new affordance for choosing which of a composite query's
  sources the autocomplete follows.
- Backfilling or migrating stored queries — the service already returns one-element arrays for
  everything saved before the change.

## Impact

- `src/models/analytics/saved-query.ts` — `source` type.
- `src/components/Analytics/QueryBuilder/utils/saved-query.ts` — `savedQueryEntityName` becomes the
  primary-source derivation.
- `src/constants/grid-columns/grid-columns.tsx` — the saved-query `source` column.
- `src/app/[lang]/queries/[id]/page.tsx` — unchanged call shape, now fed a real entity name.
- Specs: `openspec/specs/analytics/spec.md`.
- Tests: `utils/tests/saved-query.spec.ts`, `Queries/List/tests/QueriesList.spec.tsx`,
  `QueryBuilder/tests/SavedQueryPage.spec.tsx`.

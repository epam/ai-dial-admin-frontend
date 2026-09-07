## 1. Contract and derivation

- [x] 1.1 Widen `SavedQuery.source` to `source?: string[]` in `src/models/analytics/saved-query.ts`,
      leaving `SavedQueryRequest` untouched (the write payload never carried `source`).
- [x] 1.2 Rename `savedQueryEntityName` to `savedQueryPrimarySource` in
      `src/components/Analytics/QueryBuilder/utils/saved-query.ts` and make it return
      `saved.query?.entity`, else the first element of `source`, else `''`; guard the array read with
      `Array.isArray` and fall back to the value itself when an older service returns a bare string.
      Update its call sites — `src/app/[lang]/queries/[id]/page.tsx` and `toBuilderRestore` in the
      same utils file.
- [x] 1.3 Add a `savedQuerySourcesLabel` helper beside it that renders `source` as a comma-separated
      string, tolerating an absent, empty, or string-valued member.

## 2. Consuming surfaces

- [x] 2.1 In `src/app/[lang]/queries/[id]/page.tsx`, request the entity schema only when the derived
      primary source is non-empty, so `getEntitySchema('')` is never issued and a query with no
      source renders without a schema-load failure.
- [x] 2.2 In `src/constants/grid-columns/grid-columns.tsx`, replace the saved-query `source` column's
      `field` with a `valueGetter` built on `savedQuerySourcesLabel`, and give it a matching
      `tooltipValueGetter` and `filterValueGetter` so sorting, the text filter, and the tooltip all
      read the rendered text (the pattern the container `source` columns in this file already use).

## 3. Tests

- [x] 3.1 Update and extend `src/components/Analytics/QueryBuilder/utils/tests/saved-query.spec.ts`
      for `savedQueryPrimarySource` (structured body wins, single-element `source`, multi-element
      `source` yields the first, bare-string `source`, absent/empty `source`) and for
      `savedQuerySourcesLabel`.
- [x] 3.2 Cover the Source column in `src/components/Analytics/Queries/List/tests/QueriesList.spec.tsx`:
      a multi-source row renders both names comma-separated, an empty `source` renders an empty cell.
- [x] 3.3 Cover a composite query in `src/components/Analytics/QueryBuilder/tests/SavedQueryPage.spec.tsx`:
      a SQL body with a two-element `source` opens the SQL view with the stored statement, with the
      first source's fields seeded and no schema-load error surfaced.

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, the TypeScript typecheck gate, and `npm run test`;
      fix everything they report.

No browser-verification task: the user chose unit-test coverage only for this change.

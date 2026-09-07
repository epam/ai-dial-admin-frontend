## 1. Table detail header

- [x] 1.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx`, split the header
      into a column: the existing title/badges + actions row, then the description on its own row beneath
      it, so its `DialEllipsisTooltip` line spans the full header width instead of the remainder the
      action buttons leave over.
- [x] 1.2 Add `shrink-0` to the header's action container so button labels stay on one line.
- [x] 1.3 Show the enrichment's `source_table` as a `LabelledText` labelled
      `AnalyticsTablesI18nKey.SourceTable` in the schema-metadata summary row, before the grain key, and
      relax that row's render condition so an enrichment's summary renders at any status while a source
      table's stays `ACTIVE`-only.
- [x] 1.4 State the table's kind beside the status badge as a neutral tag (`bg-layer-4`, matching the
      system-table tag rather than the colored status badge), adding `AnalyticsTables.TypeSource` /
      `AnalyticsTables.TypeEnrichment` to `constants/i18n.ts` and `locales/en.ts`.

## 2. Tables catalog grid

- [x] 2.1 In `apps/ai-dial-admin/src/components/Analytics/Tables/TablesView.tsx`, add a
      `source_table` field column labelled `AnalyticsTablesI18nKey.SourceTable` after the Type column
      (`flex: 2`), leaving Description at `flex: 3`.

## 3. Unit tests

- [x] 3.1 Extend `tests/TableDetailView.spec.tsx`: the description shown for a draft table as well as
      an active one, the kind stated for a source and for an enrichment, and the source table shown for
      an `ACTIVE` enrichment, for a `PENDING` enrichment (with no grain key beside it), and absent for a
      source table. The existing description test stays presentation-agnostic — asserting the row's
      width or line count would be a styling assertion, which `.claude/rules/testing.md` §4 rules out.
- [x] 3.2 Add a case to `tests/TablesView.spec.tsx` asserting the catalog's column set carries the
      source-table column.

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against this change's browser-observable scenarios (the
      header's description, kind tag and enrichment source table, and the catalog's source-table column)
      and resolve any `fail` verdict before the change is complete.

## 5. Quality checks

- [x] 5.1 Run lint, format, and the test suite; fix anything they report. `npm run lint` and
      `npm run format` are clean (113 pre-existing warnings, 0 errors) and the suite passes at
      10968 tests. `tsc -p tsconfig.spec.json` reports errors only in files this change does not
      touch (`utils/tests/publications.spec.ts`, `utils/themes/tests/apply-theme.spec.ts`,
      `vitest.config.ts`) — pre-existing drift, and the subject of the separate
      `enable-typescript-typecheck-gate` change.

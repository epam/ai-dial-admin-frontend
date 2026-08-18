## 1. Read-SQL generation

- [x] 1.1 In `ConnectPanel/connect-snippets.ts`, replace `projection(table)` with
      `buildReadSql(table)` returning the whole `SELECT … FROM … LIMIT …` statement, and interpolate it
      into `buildPythonReadSnippet`, `buildCurlReadSnippet`, and `buildFlightReadSnippet` in place of
      their three hand-built statements.
- [x] 1.2 Implement the source-table projection from `table.ordering_key`: drop entries beginning with
      `PLATFORM_COLUMN_PREFIX` (a prefix check on the entry, not a lookup through `writableColumns()`,
      since the entries are emitted as the payload reports them), then fall back to `*` when nothing
      remains.
- [x] 1.3 Implement the enrichment form: read `FROM table.source_table`, project
      `table.grain.grain_key` plus `"<table.name>"."<column>"` where the column is the first declared
      non-platform column; grain key alone when there is no such column, `*` when there is neither.

## 2. Panel gating and read-only variant

- [x] 2.1 Add `ConnectReadOnlyReason` to `ConnectPanel/models.ts` and derive it in `ConnectPanel.tsx`
      in place of the boolean `isReadOnly` (system table vs. enrichment), keeping its three existing
      effects: Read tab active, no tab bar, no `getTableAccess` request.
- [x] 2.2 Render the reason-specific notice: keep `ConnectSystemReadOnly` for a system table, add a new
      `AnalyticsTablesI18nKey` entry (plus its `locales/en.ts` value) stating that an enrichment's rows
      come from the enrichment process.
- [x] 2.3 In `TableDetailView.tsx`, widen the **Connect** guard (L361) and the header-actions container
      guard (L343) from `!isEnrichment` to "source, or enrichment with a `source_table`"; leave the
      **Add rows** guard (L356) unchanged.

## 3. Read-tab notes

- [x] 3.1 Add the always-shown projection note to `ConnectReadTab.tsx` — the snippet projects a subset,
      any of the table's columns may be selected — with its i18n key and `en.ts` value.
- [x] 3.2 Add the enrichment-only note stating that every column of this enrichment is reachable as
      `"<enrichment>"."<column>"` and that the source table's own columns may be selected in the same
      query, interpolating the enrichment name the way `ConnectTitle` already does.
- [x] 3.3 Pass whatever `ConnectReadTab` needs to choose between the two from `ConnectPanel.tsx`,
      following the panel's existing prop shape (finished strings and flags, not the table object).

## 4. Tests

- [x] 4.1 `tests/connect-snippets.spec.ts` — update the existing read-projection assertions
      (L199-206, L241-246); the platform-column assertion (L208-212) stays as-is and must still pass.
      Add cases for: ordering-key projection across all three read snippets, an ordering key naming a
      platform column alongside an ordinary one, an absent/empty ordering key and a platform-only one
      both falling back to `*`, the enrichment statement reading `FROM` the source table with a
      qualified column, and an enrichment with neither grain key nor non-platform column.
- [x] 4.2 `tests/ConnectPanel.spec.tsx` — add the enrichment case: no **Write data** tab, no write
      snippet, no write-role list, no `getTableAccess` call, the enrichment read-only notice shown, and
      the enrichment note present; assert the system-table notice is *not* the one shown.
- [x] 4.3 `tests/TableDetailView.spec.tsx` — invert the enrichment-exclusion block (L515-524) to assert
      **Connect** present and **Add rows** absent for an `ACTIVE` enrichment, and add the
      no-`source_table` enrichment case asserting **Connect** absent.

## 5. Quality gate

- [x] 5.1 Run `npm run lint`, `npm run format`, and `npm run test` from the repo root, and fix
      anything they report.

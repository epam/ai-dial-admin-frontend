## Why

The Connect panel's read snippets project **every** declared column, so a wide table produces a
`SELECT` list that wraps over several lines and buries the shape of the query the reader is meant to
learn. The ordering key is the column set a reader actually filters, sorts, and joins on — a far
better first example than an exhaustive projection.

At the same time the panel is withheld from **enrichment** tables entirely, on the grounds that an
enrichment is "not a queryable entity in its own right". That is true of `FROM my_enrichment`, but its
columns *are* queryable — as table-qualified fields on its source table — and today a user looking at
an enrichment's detail page is told nothing about how to read them. That is exactly the reader who
needs the `"enrichment"."column"` form spelled out, because it appears nowhere else in the product.

## What Changes

**Read projection (source tables)**

- Read snippets (Python REST, `curl`, Flight SQL) SHALL project the table's **ordering-key columns**
  instead of every declared column, emitted exactly as the payload reports them.
- The panel's existing `_`-prefixed column exclusion keeps applying to the read projection, so an
  ordering-key entry naming a platform column is dropped and no part of the panel names one.
- When the ordering key is absent, empty, or names only platform columns — possible for a system
  table, whose metadata this app did not author — the projection falls back to `SELECT *`, as it
  already does for a table with no declared columns.
- The Read tab gains a short note that the snippet projects the ordering key and that any of the
  table's columns may be selected, so the shortened list does not read as a restriction.

**Connect for enrichment tables**

- **Connect** becomes available for an `ACTIVE` **enrichment** table whose `source_table` is known.
- Its panel shows the **read path only** — no tab bar, no write snippets, no write-role list —
  reusing the shape the panel already has for a system table. **Add rows** stays unavailable.
- Its read snippets query `FROM <source_table>`, projecting the enrichment's **grain key** plus the
  enrichment's first non-platform column, addressed as `"<enrichment>.<column>"` — one quoted name,
  dot included, which is how the service exposes an enrichment column on its source table.
- Every projected column is quoted, in both the source and the enrichment form, so a single `SELECT`
  list never mixes quoted and bare names.
- The Read tab states, for an enrichment, that the query reads through the source table (named, not
  "that table"), that every column of the enrichment is reachable there as `"<enrichment>.<column>"`,
  and that any column of the source table may be selected in the same query.

**Authentication block**

- The shared block above the tabs carries `DIAL_API_KEY` alone. `DIAL_ANALYTICS_BASE_URL` becomes its
  own setup block shown above each REST example (Python and `curl`), so the Flight SQL example — which
  needs the key but not the REST endpoint — no longer depends on half a block whose other half it never
  uses, and neither REST example makes the reader hunt for the variable it reads.
- The "replace `<analytics-base-url>`" warning moves with the export.

**Non-goals**

- No change to the write path, write snippets, format guidance, role lists, or the row-limit prose.
- No hand-written insert path for enrichment rows — those still come from the enrichment process.
- A **source** table's panel does not enumerate the enrichments defined over it: the table payload
  carries no such list, and discovering it would need a catalog fetch this panel does not make.
- No change to the query builder, the SQL editor, or the result grid.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `analytics`: **Table detail Connect panel** — the Connect action's gating changes from
  "source tables only" to "source tables, plus enrichment tables with a known source table", and the
  read-only (no tab bar) panel variant, so far reached only by a system table, gains a second reason
  to render.
- `analytics`: **Connect panel snippets are generated from the table schema** — the read-snippet
  projection changes from "the table's column names" to "the table's ordering-key columns, resolved
  to exposed names, falling back to `*`", and gains the enrichment read form (`FROM` the source
  table, grain key + a table-qualified enrichment column) with its accompanying note.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Tables/ConnectPanel/connect-snippets.ts` — the
  `projection` helper and the three read-snippet builders; a new enrichment read form; the
  `buildConnectSnippets` signature gains what the read note needs.
- `apps/ai-dial-admin/src/components/Analytics/Tables/ConnectPanel/ConnectPanel.tsx` — the read-only
  branch (`isReadOnly`) widens from `table.system` to "system **or** enrichment".
- `apps/ai-dial-admin/src/components/Analytics/Tables/ConnectPanel/ConnectReadTab.tsx` — the
  projection note and the enrichment note.
- `apps/ai-dial-admin/src/components/Analytics/Tables/TableDetailView.tsx` — the `!isEnrichment`
  guard on the Connect button, and the one on the header-actions container.
- `apps/ai-dial-admin/src/constants/i18n.ts` + `src/locales/en.ts` — new `AnalyticsTablesI18nKey`
  entries for the two notes.
- Tests: `tests/connect-snippets.spec.ts`, `tests/ConnectPanel.spec.tsx`,
  `tests/TableDetailView.spec.tsx` (the enrichment-exclusion assertions invert).
- No API, server-action, env-var, or dependency change. The enrichment panel needs no extra fetch:
  `source_table` and `grain.grain_key` are already on the table payload.

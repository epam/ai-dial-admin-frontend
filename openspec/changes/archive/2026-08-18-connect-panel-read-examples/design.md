## Context

See `proposal.md` — Why. The relevant current state:

- One helper produces the `SELECT` list for all three read snippets
  (`ConnectPanel/connect-snippets.ts:104-107`); it maps every non-`_` column to its exposed
  `column.name` and falls back to `*` only when the table declares no columns.
- The panel already has a read-only variant with no tab bar, reached today only by
  `table.system` (`ConnectPanel.tsx:31-32`, `110-114`), which also suppresses the `getTableAccess`
  request.
- Connect is withheld from enrichments by three independent `!isEnrichment` guards in
  `TableDetailView.tsx` (the header-actions container at L343, **Add rows** at L356, **Connect** at
  L361).
- Everything the enrichment snippets need is already on the table payload: `source_table`,
  `grain.grain_key`, `columns` (`models/analytics/table.ts:57-74`). No extra fetch, no new server
  action, no prop threading beyond what `ConnectPanel` already receives.

Worth knowing but deliberately **not** acted on: `ordering_key` holds physical source names
(`isRenameRestricted` matches it against `column.source_name`, `Tables/utils.ts:171`) while
`projection()` emits the exposed `column.name`. The two are equal on every table this app creates —
the column editor fills both from one input and a rename sets both (`spec.md:3709`) — and no confirmed
case of them diverging exists, so the entries are emitted as the payload reports them rather than
resolved through the column list. The header summary already prints them raw
(`TableDetailView.tsx:387`).

## Goals / Non-Goals

**Goals:**

- Keep snippet generation a pure function of `(AnalyticsTable, ConnectEndpoints)` — the existing unit
  tests exercise it with plain object fixtures and no rendering, which is why it is worth preserving.
- Keep one read-snippet shape. The Python, `curl`, and Flight builders should keep interpolating a
  single generated SQL string rather than each learning about ordering keys and enrichments.
- Make the enrichment path reuse the panel's existing read-only shape rather than introducing a third
  panel layout.

**Non-Goals:**

- No SQL builder, quoting utility, or identifier-escaping layer. The snippets are illustrative text
  the reader edits; a general escaper would be dead weight and would imply a safety guarantee the
  panel does not make.
- No validation that an enrichment's grain key exists on the source table. The backend derives it and
  the columns grid already backfills it defensively (`TableDetailView.tsx:270-277`); a snippet that
  names a stale grain key is a schema problem, not a snippet problem.

## Decisions

### 1. One `buildReadSql(table)` replacing `projection(table)`

The unit under test becomes the whole statement, not the column list, because the enrichment form
changes the `FROM` clause too — an enrichment reads `FROM <source_table>` while the panel title still
names the enrichment. Keeping `projection()` and branching the `FROM` separately in three builders
would put the same two-line branch in three places.

```
buildReadSql(table) -> `SELECT <projection> FROM <relation> LIMIT <READ_SNIPPET_LIMIT>`
```

with `relation` = `table.source_table` for an enrichment, `table.name` otherwise, and `projection`
resolved as below. The three read builders each interpolate that one string.

**Alternative considered:** a `ConnectSnippets.readSql` field threaded through the tab component so
the note could render the same string. Rejected — the note is prose about the *form*, not a copy of
the statement, and the tab already receives the finished snippets.

### 2. The ordering key is filtered for platform columns, then projected verbatim

```
ordering_key ?? []  ->  drop entries starting with '_'  ->  quote each  ->  empty => '*'  ->  join(', ')
```

Two deliberate halves:

- **The `_` exclusion stays panel-wide.** It originates as a write rule — `writableColumns()` strips
  platform columns because the row-insert endpoint rejects a row naming one (`spec.md:3707`) — and a
  read *could* legally project `_ingested_at`. Keeping one rule for the whole panel is chosen over the
  narrower-but-split alternative: the reader never has to work out which surface a platform column is
  valid on, and the existing `Platform columns are omitted` scenario and its test stay intact rather
  than being narrowed. Because the entries are filtered by name prefix rather than by looking columns
  up, this is a plain `startsWith('_')` check on the ordering key, not a trip through
  `writableColumns()`.
- **The physical/exposed distinction is not resolved.** See Context: the two names are equal on every
  table this app creates, and no diverging case is confirmed. A `find` per entry would be a no-op
  guarding a hypothetical, so surviving entries are emitted as given.

  **Superseded.** The diverging case is confirmed against the service: `CreateTableRequest` and
  `DefineSchemaRequest` accept a column whose `source_name` differs from its `name`, `TableDto` documents
  `ordering_key` as physical source names, and `CatalogQueryService.addColumn` publishes a source column
  under the exposed `col.getName()` — so a physical entry in the `SELECT` list is an unknown column, not a
  cosmetic difference. `orderingKeyProjection` now resolves each entry through the column list, which is
  what `proposal.md` originally promised. The grain key is still emitted as reported: it names a column of
  the *source* table, whose column mapping the enrichment payload does not carry.

The `*` fallback covers both empty cases — no ordering key, and an ordering key that filtering
empties — because `SELECT  FROM x` is not a statement.

**Trade-off accepted:** if a table ever does report differing `source_name`/`name`, its read snippet
names a column the query cannot resolve. The reader sees an unknown-column error against a name that
appears in the header's ordering-key summary — recognisable, not silent.

### 3. Enrichment projection: grain key bare, enrichment column qualified

```
SELECT "<grain_key>", "<enrichment>.<first non-_ column>" FROM <source_table> LIMIT 100
```

The grain key is a column *of the source table*; the enrichment column is the one that must be quoted —
as **one** identifier containing a dot. Verified against a running service: `"test2"."test"` is
rejected (`400 SQL validation error: Table 'test2' not found`) while `"test2.test"` returns rows, and
the result key comes back as the literal `test2.test`, which is what `QueryBuilder/utils/result.ts:27`
already documents about flat row keys. Showing exactly one qualified column keeps the statement on one line and makes the pattern
legible; the prose note carries the generalisation to every other column. The fallback chain matches
the source path: whatever survives, joined; nothing survives, `*`.

The qualified column is the first non-`_` declared column, by the same exclusion as Decision 2. An
enrichment declaring only platform columns therefore contributes nothing, leaving the grain key alone
— or `*` if it has no grain key either.

The enrichment's own name forms the first half of that name (the table name the reader sees in the
catalog and in the panel title), matching how the query builder's results surface enrichment columns
as dotted `table.column` keys (`QueryBuilder/utils/result.ts:27-30`).

**Alternative considered:** projecting every enrichment column qualified. Rejected with the user —
a wide enrichment produces a wrapping `SELECT` list, which is the exact failure this change is fixing
on the source side.

### 4. `isReadOnly` widens; no new panel layout

`ConnectPanel.tsx` currently derives `const isReadOnly = Boolean(table.system)`, and that flag already
does all three things the enrichment case needs: default the active tab to Read, hide the tab bar,
skip `getTableAccess`. It widens to `table.system || table.type === AnalyticsTableType.Enrichment`.

The one thing that must **not** be shared is the explanatory line — `ConnectSystemReadOnly` states
that the table is fed out of band and its row endpoint refuses writes, which is not true of an
enrichment. The read-only notice therefore selects between two i18n keys, and the component needs to
know *why* it is read-only rather than just *that* it is. A small enum in `models.ts`
(`ConnectReadOnlyReason`) keeps that from becoming a chain of booleans, per the enums-over-unions rule
in `code-standards.md`.

**Alternative considered:** passing a `readOnlyNoticeKey` string down. Rejected — it moves an i18n key
into a prop, so the reason for the state is no longer visible in the component that computes it.

### 5. The two Read-tab notes

Both are prose in `ConnectReadTab`, not generated text:

- **Projection note** — always shown: the snippet projects a subset, any column may be selected.
- **Enrichment note** — shown only in the enrichment case: it names the source table the query reads,
  states that every column of the enrichment is reachable there as `"<enrichment>.<column>"`, and that
  any source-table column may be selected alongside. It interpolates **both** table names, which is the
  point — an earlier draft said "that table's own columns", and with two tables in the sentence the
  pronoun resolved against either. Hence `ConnectEnrichmentRead` in `models.ts` rather than a lone
  name string.

The enrichment note carries the only bit of syntax the product teaches nowhere else, so it belongs
next to the snippet that demonstrates it rather than in a general help surface.

### 6. Gating

`TableDetailView.tsx` — the **Connect** guard changes from `!isEnrichment` to "source, or enrichment
with a `source_table`". The header-actions container guard (L343) must widen the same way or the
container collapses and Connect never renders for an enrichment with no other permitted action. The
**Add rows** guard at L356 is untouched.

### 7. The shared block is the key, not the key plus an endpoint

`buildAuthSnippet` exported `DIAL_API_KEY` and `DIAL_ANALYTICS_BASE_URL` together, which made the
Flight SQL section read as self-contained while silently depending on one of the two — and never using
the other. Splitting on "what does this example actually read" gives: key at the top (universal), base
URL with the `curl` examples, Flight URI with the Flight example.

The export renders as its own shell block above each REST example, which is the shape the Flight
section already has (setup block, then code). `curl` genuinely depends on it; the Python examples keep
`os.environ.get(NAME, "<configured default>")` so a copied script runs whether or not the reader ran
the export — the block tells them which variable governs it, rather than becoming a step. The
placeholder warning follows each export it warns about, which is what the requirement already asked
for ("positioned with the snippets that use it").

**Alternative considered:** leaving the block and noting the exception in the Flight prose. Rejected —
it asks the reader to hold an exception rather than removing it.

## Risks / Trade-offs

- **The ordering key is not always the most useful projection.** A single-column ordering key yields a
  one-column `SELECT`, which is a thin example. → Mitigated by the projection note, which tells the
  reader the list is a starting point; and by the fact that the reader is looking at the full column
  grid on the same page.
- **The enrichment note asserts a query syntax this app cannot verify.** If the analytics service
  changes how enrichment columns are addressed, the note goes stale silently — no test can catch it,
  because the snippet is never executed. → Same exposure the panel already carries for its REST paths
  and row-limit prose; the delta spec states the form explicitly so a future contract change has a
  named place to land.
- **`_`-filtering the ordering key can empty a system table's projection** — a table ordered by
  `(_ingested_at)` alone degrades to `SELECT *`, losing the ordering-key signal this change is adding.
  → Specified and acceptable: `*` is a correct, runnable statement, and the alternative would put a
  platform column in the panel that every other surface excludes.
- **Inverting the "no Connect for enrichment" rule touches an archived decision.** The archived change
  `2026-08-14-table-connect-panel` reasoned that an enrichment is not queryable. That reasoning stays
  true for `FROM <enrichment>`; what changes is that the panel now teaches the query that *does* work.
  The delta spec restates the rationale so the reversal is not read as an oversight.

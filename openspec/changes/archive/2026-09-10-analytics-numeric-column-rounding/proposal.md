## Why

The Analytics Query Builder's result grid (`analytics/query-viewer`) renders every cell — including
numeric and timestamp ones — through `renderCell` in `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/result.ts`,
which is `String(value)` with no numeric or datetime handling at all (`getResultColumns`'s
`valueFormatter` calls it directly). A row-mode or aggregate query that returns a large integer, a
sub-unit decimal, a cost figure, or an epoch-millis timestamp shows every digit unrounded and every
timestamp as a raw number, unlike the rest of the app: `grid-columns.tsx:1480-1495` already formats a
numeric column (`parameters`) with `formatNumberWithExponent`, and `openspec/specs/analytics/conversations-listing/spec.md`
already specifies the same discipline for two Analytics grid columns ("Token counts SHALL be
compacted..." / "Cost SHALL be rounded to significant digits..."). The result grid is the one
Analytics grid whose columns are derived at runtime from the query rather than declared in a
`ColDef[]`, so it is the one place this formatting was never wired in.

A single formatter for every number was measured and rejected against a real usage-log distribution:
a compact/exponent formatter renders a typical sub-unit decimal (a per-row average cost) as `0`, and a
thousand-delimited formatter renders the same value as a two-decimal figure indistinguishable from
zero — both destroy the money signal a `Decimal` column carries, while compaction is the only readable
choice for a multi-billion-value integer sum. The fix is a **formatter that branches by the result
column's value class**, not one formatter applied uniformly.

A fourth class was added to this same change after sections 1-5 shipped: the owner found a
`duration_ms` column (schema type `Long`) rendering compacted (`698.7 K`) under a header naming
milliseconds. Compacting a quantity that carries a unit is the same class of failure as rendering a
sub-unit cost as `0` — the failure this change already exists to fix — so it is fixed here rather than
as separate work.

## What Changes

- Add cell formatting to the Query Builder result grid (`getResultColumns` / `ResultArea.tsx`),
  branching by the result column's resolved value class:
  - **`Integer` / `Long`** — compact `K/M/B/T` notation, reusing `formatNumberWithExponent`
    (`src/utils/formatting/number-formatting.ts`), the same formatter `grid-columns.tsx:1480-1495`
    already uses for the `parameters` column.
  - **`Decimal`** — significant-digit formatting so a sub-unit value survives rather than rounding to
    zero. `formatSignificantCost` (`src/utils/analytics/conversation-formatting.ts`) already does
    significant-digit rounding but always prefixes `$` and is written for cost specifically — it
    cannot be reused as-is for a plain (non-money) decimal measurement. This change needs a
    currency-agnostic significant-digit formatter (an extraction of `formatSignificantCost`'s digit
    logic, or an equivalent); introducing it is in scope for this change, and its exact shape is SA's
    to design.
  - **`Timestamp` / `Date`** — reuse the existing `dateTimeColumn` partial `ColDef`
    (`src/constants/grid-columns/configs.ts:11`) rather than calling `formatDateTimeToLocalString`
    by hand, so the result column gets the same `valueFormatter` + `tooltipValueGetter` +
    `filterValueGetter` triplet every other datetime column in the app already gets.
  - **`Duration`** — reuse the existing `formatDurationMs`
    (`src/utils/analytics/conversation-formatting.ts`) unmodified, so a millisecond quantity reads in
    its own unit (`"698.7s"`, `"12ms"`) rather than as a compacted count of milliseconds. A column
    takes this class only when both hold: the declared-schema-type source below has already resolved
    it to a numeric class (`Integer`/`Long` → compact, `Decimal` → significant-digit), **and** the
    catalog tags that field `performance` — the same tag vocabulary the frontend already reads for
    the conversations column picker (`CONVERSATION_TAG_LABEL_KEY`,
    `src/constants/analytics/conversations-trace.ts:319-329`). The tag is consulted only after the
    type has already resolved a numeric class, so it narrows a numeric class and never creates
    formatting the type refused: a `Timestamp`/`Date`/`String`/`Enum`/`Boolean` field tagged
    `performance` keeps exactly what its declared type resolves, and the column's **name plays no
    part** in recognition. Measured against the provisioned catalog, the tag falls on exactly five
    millisecond-measurement fields and nothing else; one duration field on a seeded demo table
    carries no tag and deliberately falls through to plain compact rendering, which the delta pins as
    its own scenario ("An untagged millisecond column keeps its compact rendering",
    `specs/analytics/query-viewer/spec.md`). **Rejected:** recognizing a duration by an `_ms` name
    suffix instead of, or as a fallback behind, the tag — it would have additionally covered the
    untagged demo field, but it keys behaviour on a column's name/spelling rather than the catalog's
    own classification, and it risks a non-duration column named `*_ms` rendering as a time.
    `design.md` §10 records the rejection.
  - **Everything else** (a dimension column that is a `Uuid`/`Enum`/`Boolean`, or a computed column
    with no resolvable value class) — unchanged, through today's `renderCell`.
- **Where the value class comes from — two sources, in priority order:**
  1. **The declared schema type.** `buildColumnLabels` (`executed-meta.ts`) already matches a returned
     column against `AnalyticsEntityField[]` to resolve its display name; the same match yields the
     field's `type` (`AnalyticsFieldType`: `Integer`, `Long`, `Decimal`, `Timestamp`, `Date`, `Uuid`,
     `Enum`, `Boolean`, `String`). This is the primary and only source for a row-mode projection or a
     `group_by` dimension column, and it is the sole route by which a `Timestamp`/`Date` column, or a
     `Duration` column, is ever recognized — the mechanism does not infer either from a column's raw
     value or its name.
  2. **For an aggregate output column under an alias** (e.g. a `SUM`/`AVG` result with no schema
     field of its own), `ExecutedQueryMeta.aggregateColumns` already marks it a measure by query
     semantics (everything in the result that is not a `group_by` dimension), and `getStrictNumericColumns`
     (`Result/chart-options.ts:52`) already confirms every returned value is a number, rejecting a
     boolean or an array. With no declared sub-type available for an alias, whether the aggregate
     formats as compact (`Integer`/`Long`-like) or significant-digit (`Decimal`-like) is decided from
     the returned values themselves (whole-valued throughout vs. not) — the same shape of check
     `getStrictNumericColumns` already performs, extended to classify rather than merely confirm.
     This source never yields `Duration`: an aggregate alias carries no schema field to read a
     `performance` tag from, so it keeps the compact or significant-digit class its returned values
     resolve, whatever it is named or aliased as.
  - **This second source applies only outside the untranslated-SQL fallback.** For an untranslated
    SQL run, `ExecutedQueryMeta.aggregateColumns` is populated by `classifyResultColumns` calling the
    same `getStrictNumericColumns` directly over *every* returned column, including a raw id or an
    unrecognized epoch column — using that path to drive formatting would misclassify exactly the
    columns the SQL non-goal below excludes. The aggregate-column formatting path therefore only
    applies when `ExecutedQueryMeta` was built from a structured query or a successfully translated
    SQL query, where `aggregateColumns` is derived from `group_by` semantics, not from a blind
    value scan.
- No wiring of the query builder's function catalog return type into aggregate columns: the two
  sources above already answer the question that wiring would have answered, so it is not part of
  this change and no follow-up is filed for it.
- Keep the full, unrounded value reachable on a formatted cell — the grid's tooltip (already present in
  `getResultColumns` and, for the precedent column, in `grid-columns.tsx:1480-1495`) SHALL carry the
  formatted text on the same terms `formatNumberWithExponent` already establishes there, per
  `.claude/rules/a11y.md`'s rule against truncating a value with no way to reach the full one. For the
  `Timestamp`/`Date` branch, `dateTimeColumn`'s own `tooltipValueGetter` already satisfies this; for the
  `Duration` branch, the tooltip carries the millisecond count, thousand-delimited, not the duration
  text the cell shows.
- Excluded from this change (see Non-goals): the SQL view's untyped result columns, and the small
  integer counters elsewhere in Analytics.

## Impact

- **Affected capability:** `analytics/query-viewer` (the result grid) is the only sub-capability whose
  spec changes — now covering numeric, timestamp/date and duration result-column formatting, not
  numeric alone. `analytics/query-builder`'s `buildColumnLabels`/`ExecutedQueryMeta` plumbing (`executed-meta.ts`,
  shared by the chart views) is touched to carry a field's declared type, so a change there is shared
  with the chart axis/column-classification code in `Result/chart-options.ts` — that file's own
  value-based `getStrictNumericColumns`/`getNumericColumns` heuristics are read (not modified) by the
  aggregate-column path above, and remain otherwise unaffected: they still classify dimensions vs.
  measures for chart axes, not cell display.
- **Formatters reused unmodified:** `formatNumberWithExponent`
  (`src/utils/formatting/number-formatting.ts`), `dateTimeColumn`'s existing
  `formatDateTimeToLocalString`/`toDateOrNull` triplet (`src/constants/grid-columns/configs.ts`,
  `src/utils/formatting/date.ts`), and `formatDurationMs`
  (`src/utils/analytics/conversation-formatting.ts`) — the duration recognition rule adds one
  `DURATION_FIELD_TAG = 'performance'` constant and one field-tag check to the same classification
  path already built for the other three classes, with no new file and no change to
  `formatDurationMs` or its siblings (`formatHopDuration`, `formatSignificantCost`). **One formatter
  needs new or extracted code:** the `Decimal` branch's significant-digit formatting has no
  currency-agnostic existing implementation — `formatSignificantCost` is money-specific (always
  `$`-prefixed). This is the one place this change is not a pure reuse, and SA should treat the exact
  extraction/naming as a design decision.
- **`dateTimeColumn`'s `valueFormatter` calls `formatDateTimeToLocalString` (which uses
  `toLocaleString`) directly, with no SSR-hydration guard, and this is the established, safe pattern
  for a grid cell** — confirmed by the two existing call sites that already do this in an AG Grid
  `valueFormatter`/`valueGetter` (`Analytics/Pipelines/PipelinesView.tsx:192`,
  `Analytics/Evaluators/EvaluatorsView.tsx:37`), as opposed to `useLocalDateTimeString`
  (`src/hooks/use-local-date-time-string.ts`), which exists only for text rendered directly in a
  component's JSX during SSR (headers, detail panels) to avoid a server/client mismatch on first
  paint. A grid cell computed by AG Grid's own imperative rendering is outside that SSR-matched React
  tree, so reusing `dateTimeColumn` as-is carries no hydration risk.
- **Risk, not a decision:** reusing `numericColumn`'s `align-right` cell class / `numberValueComparator`
  (`src/constants/grid-columns/configs.ts`) on a dynamically derived result column may change how that
  column sorts today (string sort vs. numeric sort). Flagged for SA to decide, not decided here.
- **No backend or API contract change.** Scope stays inside
  `apps/ai-dial-admin/src/components/Analytics/**` and the grid-column/formatting utilities it uses.

## Non-goals

- **Other Analytics listing grids are reviewed and left out.** The Tables catalog's `columnsCount`
  (`TablesView.tsx`), the Pipelines listing's `generation` (`PipelinesView.tsx`), and the Evaluators
  listing's `latest_version` (`EvaluatorsView.tsx`) are the only other currently-raw numeric cells found
  in Analytics grids. All three are small sequence/version counters, not quantities, and stay
  unformatted permanently — not "for now."
- **`Uuid`/`Enum`/`Boolean` result columns stay excluded by construction**, not by a new rule: the
  formatting branch keys on a resolved value class of `Integer`/`Long`/`Decimal`/`Timestamp`/`Date`/
  `Duration`, so none of these ever reaches it.
- **The SQL view's result columns stay unformatted.** A SQL-authored query's columns carry no schema
  attribution at all (`openspec/specs/analytics/query-viewer/spec.md`: "A SQL-view run... SHALL head
  every column by its returned name"), confirmed by `executed-meta.ts` returning `columnLabels: {}`
  for an untranslated SQL request, so there is no declared type to format from and the aggregate-column
  path above is deliberately scoped to exclude this case too — applying a blind value scan here would
  risk formatting an id or a raw epoch column, which is exactly what must not happen.
- **No wiring of the query builder's function catalog's declared return type into aggregate columns.**
  The two existing sources this change relies on (declared schema type; `aggregateColumns` +
  value-shape classification) already answer the question that wiring would answer.
- **Byte-size columns (`request_body_bytes`, `response_body_bytes`) stay unformatted.** Their catalog
  tags (`request`, `response`) name the message part they belong to, not a unit, so the duration tag
  rule has nothing to key on for them — the unit exists only in the field's prose `description`, never
  in a machine-readable attribute.
- **The catalog carries no `unit` attribute.** This is the limitation behind both the byte-size gap
  above and the one untagged duration field falling through to compact rendering: there is no
  machine-readable place for a unit to live beyond the `performance` tag's narrow, free-text
  vocabulary.
- **No change to the conversations log, conversation trace, tables, pipelines or evaluators specs.**

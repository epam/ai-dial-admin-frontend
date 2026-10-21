# Design — numeric and temporal formatting for the Query Builder result grid

Read this in slices. Every section names the files it governs on its first line, so an implementer can
grep its own paths and read only that section. Section 1 is the only one everybody needs.

## 1. The shape of the change (everybody reads this)

Files, in dependency order:

| # | File | What it gains |
|---|---|---|
| 1 | `apps/ai-dial-admin/src/utils/formatting/number-formatting.ts` | `formatSignificantNumber` — currency-agnostic significant digits |
| 2 | `apps/ai-dial-admin/src/models/analytics/query-builder.ts` | `ResultValueClass` enum, `ExecutedQueryMeta.columnValueClasses` |
| 3 | `apps/ai-dial-admin/src/constants/analytics/query-builder.ts` | `FIELD_TYPE_VALUE_CLASS` lookup |
| 4 | `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/executed-meta.ts` | `buildColumnValueClasses`, wired into all three `buildExecutedMeta` branches |
| 5 | `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/chart-options.ts` | `strictNumber` becomes an export (one word, no logic change) |
| 6 | `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/result-column-format.ts` | **new** — value class → `Partial<ColDef>` |
| 7 | `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/ResultArea.tsx` | spreads the fragment onto each column |

**`apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/result.ts` is NOT touched.** Its
`getResultColumns` stays a pure, dependency-light description of the columns, exactly as its own comment
says, and it keeps being safe for `executed-meta.ts` to call. The formatting is layered on in
`ResultArea.tsx`, next to where `cellRenderer: ResultValueCell` is already attached, and for the same
stated reason: grid-runtime concerns are attached there, not in the column builder.

The dependency chain that matters for dispatch: 4 needs 2 and 3; 6 needs 1, 2 and 5; 7 needs 4 and 6.

**§12 adds a fourth value class — `Duration` — to files 2, 3, 4 and 6 and to nothing else.** It landed
after §1-§5 shipped, on a defect in the shipped behaviour: a millisecond column read `698.7 K`. If your
item is 7.1 or 7.2, read §12 plus §3, §4 and §6; if your item is anything else, §12 does not touch it.

## 2. The significant-digit formatter

File: `apps/ai-dial-admin/src/utils/formatting/number-formatting.ts`. Nothing else in section 2.

Add one export and one module-private helper. Do not touch `formatNumberWithExponent` or
`formatNumberByDelimiter`; do not touch `apps/ai-dial-admin/src/utils/analytics/conversation-formatting.ts`.

```ts
const SIGNIFICANT_DIGITS = 2;
// At and above one unit, two significant digits would report 19.74 as 20 and switch to exponential
// notation past two integer digits; the compact formatter reads better and keeps the leading digits.
const SIGNIFICANT_COMPACT_THRESHOLD = 1;

// Only meaningful after a decimal point: on an integer it would turn 20 into 2.
const stripTrailingZeros = (text: string): string => ...;

export const formatSignificantNumber = (value: number | string): string => ...;
```

Behaviour, and these are the boundaries the tests must name:

| Input | Output | Why |
|---|---|---|
| `0` | `'0'` | not `''`; a returned zero is a value |
| `0.0004792` | `'0.00048'` | two significant digits; the measured median cost, which `formatNumberWithExponent` renders as `0` and `formatNumberByDelimiter` as `0.00` |
| `19.74` | `'19.7'` | at/above 1 → compact, so the leading digits survive |
| `4897666958` | `'4.9 B'` | at/above 1 → compact |
| `-0.0004792` | `'-0.00048'` | sign preserved |
| unparseable (`'abc'`, `''`) | `''` | the call site substitutes today's rendering; see §6 |

Implementation constraint: derive the decimal count from `Big`'s own exponent
(`-amount.e + SIGNIFICANT_DIGITS - 1`) rather than calling `toPrecision`, which switches to exponential
notation below `1e-7`. This is the same technique `formatSignificantCost` uses, and the two functions are
deliberately separate — see §10.

## 3. The contract: value class and where it travels

Files: `apps/ai-dial-admin/src/models/analytics/query-builder.ts` and
`apps/ai-dial-admin/src/constants/analytics/query-builder.ts`.

An `enum`, not a string-literal union (`.claude/rules/code-standards.md`), in the models file beside
`ExecutedQueryMeta`:

```ts
// How a result cell renders its value. Resolved from the executed query, not from the live builder
// state, so what the grid shows follows the run that produced the shown result.
export enum ResultValueClass {
  Compact = 'compact',
  Significant = 'significant',
  DateTime = 'date-time',
}
```

and one **required** field on `ExecutedQueryMeta`:

```ts
columnValueClasses: Record<string, ResultValueClass>;
```

Required, not optional, on purpose: `buildExecutedMeta` returns from three branches, and a required field
makes TypeScript refuse a fourth branch that forgets it. An optional field would let a new branch silently
lose the formatting, and a column that is merely unformatted looks plausible — which is the exact failure
mode this change exists to fix. The cost is five fixture literals in two spec files
(`Result/tests/ResultArea.spec.tsx`, `Result/tests/ResultChart.spec.tsx`); they are in scope for the items
that own those files.

The type→class map is a const lookup, so it belongs in `constants/`, not in `models/`
(`.claude/rules/code-standards.md`, constants/models split). Put it in
`apps/ai-dial-admin/src/constants/analytics/query-builder.ts`:

```ts
// The schema's own statement about a column's value class. A type absent from this map is a type the
// result grid does not format — Uuid, Enum, Boolean, String, Object, Array.
export const FIELD_TYPE_VALUE_CLASS: Partial<Record<AnalyticsFieldType, ResultValueClass>> = {
  [AnalyticsFieldType.Integer]: ResultValueClass.Compact,
  [AnalyticsFieldType.Long]: ResultValueClass.Compact,
  [AnalyticsFieldType.Decimal]: ResultValueClass.Significant,
  [AnalyticsFieldType.Timestamp]: ResultValueClass.DateTime,
  [AnalyticsFieldType.Date]: ResultValueClass.DateTime,
};
```

A `Partial<Record<...>>` rather than a full one: the absent keys *are* the "everything else unchanged"
rule, and spelling them out as `undefined` would only invite someone to fill them in.

## 4. Resolving the class

File: `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/executed-meta.ts`.

A **new sibling function**, not an extension of `buildColumnLabels`. `columnLabels` is consumed as
`Record<string, string>` by `ChartBuildContext`, `ResultChart.tsx` and `getResultColumns`; widening its
element type to carry a second, unrelated resolution would change every one of those consumers for no
benefit, and it would conflate "what this column is called" with "how its values read".

```ts
export const buildColumnValueClasses = (
  columns: string[],
  fields: AnalyticsEntityField[],
  measureColumns: string[],
  rows: ResultRows,
): Record<string, ResultValueClass> => { ... };
```

The algorithm, in this order:

1. For each column, match it against `fields` by name — the **same match `buildColumnLabels` already
   makes**. **A column that matches a field is decided by the schema and by nothing else**: it takes
   `FIELD_TYPE_VALUE_CLASS[field.type]` when the map has an entry, and otherwise gets no class at all.
   The gate on step 2 is therefore *the absence of a schema field*, not the absence of a resolved class
   — `if (field) { … } else if (measureColumns.includes(column))`. `FIELD_TYPE_VALUE_CLASS` is a
   `Partial` record, so a declared `Enum`, `Uuid`, `Boolean` or `String` yields `undefined`; gating on
   the class would drop exactly those columns into step 2, where an `Enum` whose values are numeric
   strings would be compacted — contradicting the scenario *A non-numeric schema column is untouched*.
   (Settled on a QA finding during implementation; the ruling is recorded in the run's `run.json`. Do
   not re-derive the looser version from an earlier reading of this section.)
2. Only a column that names **no** schema field and appears in `measureColumns` goes into a candidate
   list.
   Classify the candidates with the existing exported `getStrictNumericColumns(rows, candidates)` — which
   already rejects a boolean and an array, unlike a plain `Number()` coercion — and then split the
   survivors: `rows.every((row) => Number.isInteger(Number(row[column])))` → `Compact`, otherwise
   `Significant`. A candidate that is not strictly numeric gets no class.
3. Everything else gets no entry. An empty `rows` yields no step-2 class at all, which is correct: there
   is nothing to render anyway.

`measureColumns` is a parameter rather than being read off the meta inside the function, because **the
caller is where the two exclusions live** and they are the part BA asked to be checked against the real
branches. Read `buildExecutedMeta` as it stands today: three returns.

| Branch (as the code stands) | `columnValueClasses` | `measureColumns` |
|---|---|---|
| `request.kind === Sql` and `!translated` | `{}` | — |
| `request.kind === Sql` and `translated` | `{}` when `translated.entity !== entityName`, else `buildColumnValueClasses(...)` | `translated.mode === QueryMode.Aggregate ? aggregateColumns : []` |
| structured | `buildColumnValueClasses(...)` | `request.query.mode === QueryMode.Aggregate ? aggregateColumns : []` |

Three decisions are encoded in that table, and each is load-bearing:

- **The untranslated-SQL branch gets `{}`.** In that branch `aggregateColumns` comes from
  `classifyResultColumns`, i.e. `getStrictNumericColumns` over *every* returned column with no group-by
  semantics behind it — so a raw id or an unrecognised epoch column lands in it. Driving formatting from
  that list would compact an id, which is precisely what the proposal's SQL non-goal exists to prevent.
  Verified against the code, not inferred from the prose: `executed-meta.ts` lines 64-72.
- **The entity gate is shared with the labels.** A translated SQL run over another entity already
  withholds `columnLabels`; withholding the classes on the same condition gives one rule instead of two,
  and the justification is the same one — the selected schema does not describe these columns.
- **The value-shape source applies only in aggregate mode.** In row mode `dimensionColumns` is empty, so
  `aggregateColumns` degenerates to *every* returned column, and a scalar-function projection such as a
  time bucket returning epoch millis would be whole-valued and compact as `1.8 T`. Gating on
  `QueryMode.Aggregate` removes that whole class of misclassification, and it matches the proposal's own
  wording that the declared schema type is "the primary and only source for a row-mode projection".

## 5. `strictNumber` becomes an export

File: `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/chart-options.ts`. One word.

Add `export` to the existing `strictNumber`; change nothing else in the file. §6 needs the same
definition of "this value really is a number" that produced the class in §4 — a column classified by
`getStrictNumericColumns` must be formatted by a parser that agrees with it, or a `true` or an `[]` reads
as a number in one place and not the other. A third private copy of that four-line parse would be the one
that drifts.

## 6. Value class → `Partial<ColDef>`

File: `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/result-column-format.ts` — **new**.
It sits in `Result/` rather than in `utils/` for the same reason `Result/chart-options.ts` does: it
describes grid/chart output and it may import `'use client'` modules and shared `ColDef` partials, which a
file under `utils/` should not (`.claude/rules/utils.md`).

```ts
export const getValueClassColumn = (valueClass?: ResultValueClass): Partial<ColDef> => { ... };
```

One export, one switch on the enum (a switch, not nested ternaries — `.claude/rules/code-standards.md`),
returning `{}` for `undefined` so an unclassified column is untouched.

| Class | Fragment |
|---|---|
| `Compact` | `...numericColumn`, `...baseNumberFilter`, `valueFormatter` → `formatNumberWithExponent`, `tooltipValueGetter` → exact text (below) |
| `Significant` | the same, with `valueFormatter` → `formatSignificantNumber` |
| `DateTime` | `...dateTimeColumn`, `...dateFilter` — nothing else |

Both numeric fragments share one private builder taking the `(n: number) => string` formatter, so the
branch that differs is one argument.

**Spread the shared partials; do not re-implement them.** `numericColumn`
(`apps/ai-dial-admin/src/constants/grid-columns/configs.ts`) carries the `align-right` cell and header
classes, `numberValueComparator`, and a `filterValueGetter` that feeds `toNumberOrNull` — see §7 for why
all three are wanted. `dateTimeColumn` carries the triplet the proposal asks for:
`formatDateTimeToLocalString` as both the `valueFormatter` and the `tooltipValueGetter`, and
`toDateOrNull` as the `filterValueGetter`.

**`dateFilter` is not optional — but not because the alternative throws.** Verified against
`node_modules/ag-grid-community` and against this repository's own columns, because an earlier draft of
this section had the reason inverted:

- Spreading `dateTimeColumn` alone, under the inherited `agTextColumnFilter` +
  `floatingFilter: true` from `AgGridWrapper`'s `defaultColDef`, does **not** throw. ag-grid's text
  filter runs both sides through `defaultLowercaseFormatter = (from) => from == null ? null :
  from.toString().toLowerCase()` (`node_modules/ag-grid-community/dist/package/main.cjs.js:54856`),
  and a `Date` has a `toString()`. Columns ship that combination in production today —
  `CREATED_AT_COLUMN` and `UPDATED_AT_COLUMN` in `constants/grid-columns/base-columns.ts:20-32`, and
  `keyGeneratedAt`, `expiresAt` and `firstTimestamp` in `constants/grid-columns/grid-columns.tsx`
  (lines 347, 352, 1056).
- What actually happens is **silent incoherence**: the user types text that is matched against
  `"mon mar 30 2026 … gmt+0300"` — the `Date`'s own `toString()` — while the cell shows
  `toLocaleString()`. Nothing the user can see explains a miss.
- The crash recorded at `apps/ai-dial-admin/src/constants/grid-columns/filters.ts:7-9`
  (`date.getFullYear is not a function`) is the **other** direction: `agDateColumnFilter` receiving the
  `contains` model a *text* floating filter sends. That is why `dateFilter` itself carries
  `floatingFilter: false`, and it is why `filter: 'agDateColumnFilter'` and `floatingFilter: false` can
  only be adopted together.

So the pairing stays required — for filter/cell coherence, and because `dateFilter`'s
`floatingFilter: false` clause is what makes its own `filter` safe. The real hazard is hand-assembling
the filter (a `filter: 'agDateColumnFilter'` without the `floatingFilter` clause) rather than spreading
`dateFilter` whole. `dateTimeColumn` + `dateFilter` is exactly the combination shipped at
`constants/grid-columns/grid-columns.tsx:1314-1316`; take it as one unit. `baseNumberFilter` pairs with
the numeric fragment for the same coherence reason — `toNumberOrNull` in a `filterValueGetter` under a
text filter would have the user filtering digits the cell no longer shows — and that pairing is shipped at
`grid-columns.tsx:558-559`.

Two rules the fragment must implement itself:

- **Fall back, never blank.** `valueFormatter` parses with the exported `strictNumber` (§5) and, on
  `null`, returns `renderCell(value)` — today's rendering. A `formatSignificantNumber` that returned `''`
  straight into a cell would hide a value the run returned.
- **The tooltip carries the value, not the text — within double precision.** A private
  `exactNumberText(value)`: `strictNumber` it; if it parses and `Number.isInteger` holds, return
  `formatNumberByDelimiter(value)` passing the **raw** value rather than the formatted text; otherwise
  return `renderCell(value)` verbatim. Passing the raw value is the right design — it is strictly
  better than repeating the shortened text — but it buys **no exactness guarantee at the extremes**,
  and no test asserts one. `formatNumberByDelimiter` coerces with `+value` before it ever reaches `Big`
  (`apps/ai-dial-admin/src/utils/formatting/number-formatting.ts:27` and `:59`), so a `Long` past 2^53
  has already lost digits whichever way it is passed; and `splitNumber` splits the `Big`'s string on
  `'e'` and discards the exponent (`:64`), so `1e21` comes back as `"1"`. Both ranges are outside what
  this change's measured cases cover; the limit is named in §11 rather than worked around here.
  Never route a fractional value through
  `formatNumberByDelimiter`, whose default precision rounds it to two decimals — that is one of the two
  measured failures this change exists to fix. Do **not** copy the precedent at
  `grid-columns.tsx:1487`, which repeats the compacted string in its own tooltip; `.claude/rules/a11y.md`
  forbids shortening a value with no way to reach the full one, and that precedent is a defect this change
  should not spread.

## 7. Alignment, sorting and filtering — the risk BA left open, decided

Files: the fragment in §6; the behaviour under test in
`apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/tests/result-column-format.spec.ts`.

**Decision: adopt `numericColumn` whole — the `align-right` classes, `numberValueComparator` and the
numeric `filterValueGetter`.** BA flagged that this may change how a result column sorts today. It does,
and the change is a fix rather than a regression:

- Today a result column inherits `baseColumnComparator` from `AgGridWrapper`'s `defaultColDef`
  (`apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx:217`). That comparator lowercases strings and
  then compares with `>`. For a `Decimal(38,12)` that arrives as a JSON string — which is how a backend
  preserves precision — that is a lexicographic sort, so `"9"` sorts after `"10"`. It also has
  `if (!aLower)`, so a legitimate `0` is treated as absent and pushed to the end of the result.
- `numberValueComparator` coerces a string through `Big` and tests `=== undefined` rather than
  falsiness, so both defects disappear.
- Nothing depends on the current order: `getResultColumns` sets no `sort` and no `sortIndex`, and the
  saved-query payload carries the view and the chart config, not a grid sort. The Chart view does its own
  ordering in `sortRowsByX`, untouched here.

Right-alignment comes along with it and is wanted: it is what every other numeric column in this app does,
and a compacted figure is much easier to compare down a right-aligned column.

**What the spread can and cannot clobber — settled, not a risk.** An earlier draft treated this as an
open hazard; all four questions are now answered by reading the sources, so do not re-open them:

- **No member of the fragment declares a `valueGetter`** — not `numericColumn` or `dateTimeColumn`
  (`constants/grid-columns/configs.ts:11-23`), not `baseNumberFilter` or `dateFilter`
  (`constants/grid-columns/filters.ts`). The result column's deliberate getter, which resolves a dotted
  column name as a literal key instead of a nested path (`utils/result.ts:38`), therefore survives the
  spread in §8. The constraint in §8 stands as a constraint on future edits, not as a live doubt.
- **The result column sets no `cellClass` and no `headerClass`**, so `numericColumn`'s `align-right`
  pair adds alignment rather than replacing anything.
- **A dotted column name resolves in the filter too.** Both shared `filterValueGetter`s read
  `data?.[colDef.field || '']` — a literal key lookup, not a path walk — so `usage.tokens` reaches
  `toNumberOrNull` / `toDateOrNull` correctly even though `field` alone would not have.
- **`ResultValueCell` keeps a populated `valueFormatted`.** Both branches of the fragment return a
  string from `valueFormatter` — the numeric one via `format(parsed)` or `renderCell(value)`, the
  date-time one via `formatDateTimeToLocalString`, which returns `''` rather than `undefined` for an
  absent value (`utils/formatting/date.ts:20-27`). The cell's `valueFormatted ?? ''` never falls
  through to the empty string by accident, and a formatted number or date is far below
  `RESULT_TOOLTIP_MAX_CHARS`, so the preview/dialog path stays unreached for these classes.

The residual hazards are named in §11.

## 8. Wiring

File: `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/ResultArea.tsx`. One `useMemo`.

```tsx
const columns = useMemo(
  () =>
    getResultColumns(result, meta?.columnLabels).map((col) => ({
      ...col,
      ...getValueClassColumn(meta?.columnValueClasses?.[col.field ?? '']),
      cellRenderer: ResultValueCell,
    })),
  [result, meta?.columnLabels, meta?.columnValueClasses],
);
```

Spread order is the whole of the correctness here, and getting it backwards is silent
(`.claude/rules/components.md` §3): the fragment must come **after** `...col` so its `valueFormatter` and
`tooltipValueGetter` win, and it must never carry a `valueGetter` — `getResultColumns` sets one
deliberately, because `field` alone makes AG Grid read a dotted column name as a nested path. Add
`meta?.columnValueClasses` to the dependency list; forgetting it leaves a stale formatter across two runs
whose columns happen to be named the same.

`ResultValueCell` needs no change: it already renders `valueFormatted`, so the formatter drives the cell
text, and a formatted number or date is far below `RESULT_TOOLTIP_MAX_CHARS`, so the preview/dialog path is
never reached for these classes.

## 9. Tests

Files, one per implementation slice:

| Spec file | What it must pin |
|---|---|
| `apps/ai-dial-admin/src/utils/formatting/tests/number-formmating.spec.ts` (note the existing typo in the name) | the table in §2, each boundary by value: `0`, a sub-unit decimal, `19.74`, a multi-billion integer, a negative sub-unit, an unparseable string |
| `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/tests/executed-meta.spec.ts` | the branch table in §4: declared `Integer`/`Long`/`Decimal`/`Timestamp`/`Date`, a `Uuid` getting no class, an aggregate alias whole vs fractional, a row-mode alias getting nothing, untranslated SQL `{}`, translated SQL over another entity `{}`, empty rows |
| `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/tests/result-column-format.spec.ts` (new) | call the fragment's own `valueFormatter`, `tooltipValueGetter`, `filterValueGetter` and `comparator` directly — the way `constants/grid-columns/tests/configs.spec.ts` already tests `dateTimeColumn` — for `999` vs `1000`, a sub-unit decimal, an epoch-millis timestamp, a non-numeric value in a numeric column, `9` vs `10` as strings through the comparator |
| `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/tests/ResultArea.spec.tsx` | that the fragment reaches the grid: the existing `GridView` mock must also capture `columnDefs`, and one case asserts a compacted string and one an unformatted column |

Two facts about this repository that change what a green run means here (both from the studio's durable
notes, both measured): spec files are **eslint-ignored repo-wide**, and `npm run typecheck` excludes
`*.spec.ts(x)` — so a passing test is not a type-correct test, and a final "run lint" task says nothing
about the specs. Assert on values, not on shapes: a test that checks a `ColDef` merely *has* a
`valueFormatter` passes against any function.

**One boundary case is not independently guarded, and that is accepted.** `999 → '999'` in
`result-column-format.spec.ts` cannot be reddened: `renderCell(999)` also yields `'999'`, so the
assertion passes whether the value went through the compact formatter or through the fallback. What it
does constrain is `formatNumberWithExponent`'s `.replace(/\.0$/, '')`, which lives in
`utils/formatting/number-formatting.ts` — outside the ColDef fragment. `1000 → '1 K'` in the same
describe is the case that actually pins the fragment's formatter, and the scenario *The compact
threshold is exact* is verified by the pair, not by the `999` assertion alone. This is a known weakness
of that one assertion, not a defect: nothing about the change would make it fail.

Run them the cheap way, from `apps/ai-dial-admin/`:
`npx vitest run src/components/Analytics/QueryBuilder/Result/tests/result-column-format.spec.ts --reporter=dot`.

## 12. The duration class — recognising a millisecond column

Files: `apps/ai-dial-admin/src/models/analytics/query-builder.ts` (the enum),
`apps/ai-dial-admin/src/constants/analytics/query-builder.ts` (the tag constant),
`apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/executed-meta.ts`
(`buildColumnValueClasses`) and
`apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/result-column-format.ts`
(`getValueClassColumn`). Rejected alternatives for this rule are in §10 and its risks in §11 — it is placed
ahead of those two so they stay the document's closing sections, which is why the numbering runs
1-9, 12, 10, 11. Read §1, §3,
§4 and §6 alongside this section — it adds a fourth value class to all four files those sections govern
and changes nothing else in them.

**What went wrong.** `duration_ms` is a schema `Long`, so §3's map resolves it `Compact` and the cell reads
`698.7 K` under a header that names milliseconds. Compacting a quantity that carries a unit is the same
failure class as rendering a sub-unit cost as `0` — the failure this change exists to fix — so it is fixed
here rather than deferred.

**What went wrong the second time, and the decision that replaced it.** The first fix rendered the cell
through `formatDurationMs`, so `698700` read `698.7s`. The owner rejected it, on a point nothing in this
design had caught: **the header still says `Duration (ms)`, so a cell reading `698.7s` under it is a lie.**
Two ways out — strip the unit from the header, or leave the value in the unit the header declares — and the
owner chose the second: **a duration column is shown unformatted.** Stripping the unit was declined because
the header is the catalog's `display_name` and the delta already requires that a schema column be headed by
it ("Result grid heads schema columns by display name"); rewriting catalog display text in the client to
accommodate a client-side formatter inverts which of the two is authoritative. So the recognition below
survives intact and only its consequence changes — see "The consequence" further down, which is the whole of
what §12 now asks for in `result-column-format.ts`.

### The recognition rule

A column that matched a schema field, and whose class §3's map resolved to `Compact` or `Significant`,
becomes `Duration` when **`field.tag === 'performance'`**. The column's **name is not read**. Nothing else
ever produces `Duration`.

```ts
// constants/analytics/query-builder.ts
// The catalog's own classification of what a column measures, and the only machine-readable unit signal a
// field carries that is not its name: there is no unit attribute, `description` states the unit in prose
// and `display_name` states it in parentheses on some rows only. The frontend already depends on this same
// tag vocabulary — CONVERSATION_TAG_LABEL_KEY in constants/analytics/conversations-trace.ts maps nine tag
// values, `performance` among them, to the conversations column picker's group labels.
export const DURATION_FIELD_TAG = 'performance';
```

```ts
// executed-meta.ts — module-private, called from step 1 of buildColumnValueClasses
const schemaValueClass = (field: AnalyticsEntityField): ResultValueClass | undefined => {
  const declared = FIELD_TYPE_VALUE_CLASS[field.type];
  const isUnitBearing = declared === ResultValueClass.Compact || declared === ResultValueClass.Significant;

  return isUnitBearing && field.tag === DURATION_FIELD_TAG ? ResultValueClass.Duration : declared;
};
```

Step 1 of `buildColumnValueClasses` changes to `const declaredClass = schemaValueClass(field);` and nothing
else in §4's algorithm moves. Two properties of that ordering are load-bearing:

- **The tag narrows, it never creates.** It is consulted only after the type map has already resolved a
  numeric class, so a `Timestamp`/`Date` field keeps `DateTime` however it is tagged, and a `String`,
  `Enum`, `Uuid` or `Boolean` field tagged `performance` stays unformatted. Matching the tag before the
  type is the implementation mistake this ordering forbids, and it is what bounds the blast radius of the
  tag being free text (below).
- **It cannot reach the neighbours that must not move.** `duration_bucket`, `token_bucket` and
  `turn_bucket` are ordinals tagged `bucket`, `response_status` / `max_response_status` are untagged codes,
  and `request_body_bytes` / `response_body_bytes` are tagged `request` / `response`; all of them keep the
  `Compact` class they have today.

**Coverage, measured — including what falls through.** Read straight out of the provisioned catalog
(`column_mapping`, the table behind the entity-schema endpoint), not inferred:

| Field | Type | Tag | Class it gets |
|---|---|---|---|
| `conversations.avg_duration_ms` | decimal | `performance` | `Duration` |
| `conversations.duration_ms` | long | `performance` | `Duration` |
| `turns.duration_ms` | long | `performance` | `Duration` |
| `turns.hop_duration_total_ms` | long | `performance` | `Duration` |
| `dial_usage_log.operation_duration_ms` | long | `performance` | `Duration` |
| `demo_conversations.duration_ms` | long | *(none)* | **`Compact`** — falls through |
| `dial_usage_log.request_body_bytes` | long | `request` | `Compact` (a non-goal; see §10) |
| `conversation_buckets.duration_bucket` | integer | `bucket` | `Compact` (correct — an ordinal) |

Two facts settle the rule. First, `performance` falls on **exactly** those five columns and on nothing
else in the whole catalog — so the tag has no false positive to defend against as provisioned, only a
future one. Second, the **one** millisecond field it misses is `demo_conversations.duration_ms`, on a
seeded demo table, and what it degrades to is `Compact` — the rendering that column has today. So the
whole cost of refusing to read the name is: one demo column keeps a defect the four real duration
fields lose.

**Why the name is not read, even as a fallback.** A `_ms` suffix would have covered the demo column too,
and it was the rule an earlier draft of this section carried. It is rejected on three counts:

- The name is **the same provisioned catalog data as the tag** (`column_mapping.name`), re-versionable in
  exactly the same way, so "the tag can change under us" is not a reason to prefer the name — it applies
  identically to both. What differs is that the tag is the column's *classification*, maintained as a
  vocabulary (`tag_order` on the table-management API exists so a table's tags stay curated and ordered
  for exactly this kind of UI consumption), while the name is a spelling.
- The earlier draft's premise — "the name is the only per-field unit statement the schema carries" — is
  **false as written**. `description` states the unit in prose on the tagged rows ("Wall-clock duration of
  the operation, in milliseconds", "Size of the request body, in bytes") and `display_name` states it in
  parentheses on four of them ("Duration (ms)"). The catalog knows the unit; what it lacks is a field to
  put it in — `column_mapping` has thirteen columns and none of them is `unit`.
- A suffix rule commits the result grid to a naming convention it cannot enforce, and the failure it
  admits is the worse direction: a non-duration column someone names `*_ms` renders as a time, which
  states something false, where the tag's failure mode as provisioned is a demo column that keeps
  rendering as it does today.

**Follow-up, not designed here:** ask the analytics service for a real `unit` attribute on
`column_mapping`, surfaced on `QuerySchemaFieldDto` beside `tag` and `display_name`. That is where this
belongs long-term — it closes the untagged demo column, it removes the free-text risk below, and it is the
one thing that would let the bytes non-goal in §10 be reopened cheaply. Filing it is the owner's; the
design records the dependency so the tag gate can be replaced by one read of `field.unit` when it lands.

**The residual risk this leaves is in §11:** `tag` is free text on the wire (`QuerySchemaFieldDto` calls it
"Optional label identifying the column"), so a future numeric field tagged `performance` in some other unit
— a rate, a ratio, a percentile — would render as a time. The class gate keeps it to numeric fields, and
§11 names what it looks like and how it is undone.

### Aggregate aliases stay as they are

An output column with no schema field keeps §4 step 2's value-shape class — `Compact` when every returned
value is whole, `Significant` otherwise — and **never** becomes a `Duration`. An alias is authored, not
declared: `computedColumnNames`/`deriveAlias`
(`apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/fields.ts:118-184`) builds it from the
argument field's *display name* and the function's label, and the user may retype it, so it carries no unit
the client can read. Recovering the unit would mean walking the executed query's select expression to the
argument field **and** knowing whether the function preserves the unit — `SUM`/`AVG`/`MIN`/`MAX` do,
`COUNT` does not — which is either a hardcoded function vocabulary against a catalog that is
runtime-supplied, or the function catalog's declared return type, which the proposal's Non-goals exclude.
Getting it wrong is worse than not formatting: `COUNT(duration_ms)` over 1 200 conversations would read
`1.2s`. The consequence is stated plainly in the delta and in §11: an `AVG(duration_ms)` column reads as a
compact figure under an alias naming the field, with the exact number in its tooltip.

### The consequence: no formatting at all

File: `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/result-column-format.ts` — one case
and one import.

```ts
// A duration column is left unformatted on purpose. Its header is the catalog's `display_name`, which
// states the unit ("Duration (ms)"), so a formatted cell would contradict its own header — and the client
// does not rewrite catalog display text. The recognition's whole job is to keep this column out of
// `Compact`, which rendered a millisecond count as `698.7 K`. Do not "fix" this back to a duration
// formatter without first moving the unit out of the header; see design.md §12.
case ResultValueClass.Duration:
  return {};
```

The `formatDurationMs` import goes with it — nothing else in the file uses it, and an unused import is a
lint error. **`formatDurationMs` itself is not deleted and not edited**: it predates this change, it belongs
to `analytics/conversation-trace-listing`, and four trace-view call sites depend on its current shape.

**Why the class still exists when it maps to `{}`.** This is the question a future reader will ask, and the
answer is the measurement above: without the recognition, `turns.duration_ms` is a schema `Long`, §3's map
resolves it `Compact`, and the cell reads `698.7 K` — the defect this section was opened for. The class is
doing real work; the work is *negative*. `{}` is not "nothing happened", it is "this column is deliberately
excluded from the numeric formatting the rest of §3 applies", and it is the only value that leaves the
figure in the unit the header declares.

**Why the member keeps the name `Duration`** rather than something like `Unformatted`. The enum names what
the column *is*, and `executed-meta.ts` is where that is decided: `schemaValueClass` reads a `performance`
tag and concludes "this column is a time measurement", which is a statement about the data and is true
whatever the grid then does with it. Naming it `Unformatted` would move the confusion rather than remove
it — the resolver would then read "a `performance` tag means unformatted", which hides the reason — and it
would make the enum a mix of two vocabularies, three members naming a rendering and one naming its absence.
The formatting decision belongs in the formatting module, so that is where the comment lives.

**What follows from `{}`, stated as limits rather than left to be discovered:**

- **A recognised duration column gets no numeric column configuration.** No `align-right`, no
  `numberValueComparator`, no `agNumberColumnFilter` — it keeps the result grid's defaults, exactly as it
  did before this change. That is a smaller column than a `Compact` one, and it is the price of `{}`. The
  alternative considered was `{ ...numericColumn, ...baseNumberFilter }` with no `valueFormatter`: raw text,
  right-aligned, numeric sort. Declined because the owner's instruction was the unclassified outcome, and
  because adopting `numberValueComparator` on a column this change no longer formats would import that
  comparator's `new Big('')` throw (§11) for no rendering benefit. Trigger to revisit: a report that a
  duration column sorts wrongly — at which point that fragment is the one-line answer.
- **A tagged millisecond column reads raw while an untagged one reads compacted.** `turns.duration_ms`
  shows `698700`; `demo_conversations.duration_ms`, which the catalog leaves untagged, shows `698.7 K`. Two
  columns of the same quantity, two renderings, possibly in the same result. This is the fall-through of the
  tag rule meeting the new consequence, and it is a real inconsistency — it is written into the delta as a
  scenario so it is visible rather than discovered. It is not closed by reading the column name (declined,
  measured, §10) but by the catalog declaring a unit (the follow-up above).
- **An aggregate over a duration field still compacts.** `AVG(duration_ms)` under a derived alias reads
  `698.7 K`, because an alias carries no tag. Unchanged from the previous decision, and now the second face
  of the same inconsistency.
- **`formatHopDuration` and `formatDurationMs` are both moot here**, so the earlier comparison between them
  is gone. It survives in §10 only as a rejected alternative, because "render it as a duration" is the
  decision that was reversed and a future reader has to be able to see that it was considered twice.

**What would have to change if the shape of the problem changed.** If the analytics service grows a `unit`
attribute on `column_mapping` (the follow-up above), the tag gate becomes one read of `field.unit` and the
question of whether to format reopens — with the header still the deciding fact. If instead a design decides
the result grid owns its own headers and may drop a unit from a display name, then the duration formatter
comes back and this section's `{}` becomes `getNumericColumn(formatDurationMs)` again. Both of those are
decisions about the header, not about the cell; that is the invariant this section leaves behind.

### Tests

| Spec file | What it must pin |
|---|---|
| `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/utils/tests/executed-meta.spec.ts` | a `Long` field tagged `performance` resolving `Duration` where its type alone would have resolved `Compact`; the same for a `Decimal`-typed tagged field, where the type alone resolves `Significant`; a millisecond-**named** but untagged field resolving `Compact` — the fall-through, asserted so it is a decision rather than an accident — beside a tagged field in the same result resolving `Duration`; a `String`-typed and a `Timestamp`-typed field both tagged `performance`, keeping what their types resolve (no class and `DateTime`); a `bucket`-tagged ordinal and an untagged status code resolving `Compact`; an aggregate alias over a tagged field resolving `Compact`/`Significant` and never `Duration` |
| `apps/ai-dial-admin/src/components/Analytics/QueryBuilder/Result/tests/result-column-format.spec.ts` | that the `Duration` fragment is empty, and empty in the ways that matter rather than by a deep-equality check alone: it carries no `valueFormatter`, no `tooltipValueGetter`, no `comparator`, no `filter` and no `cellClass`, so the column keeps the result grid's own rendering; and it equals the fragment an unclassified column gets. Pin the negative directly — a test that only asserted `toEqual({})` would pass if a future edit returned a differently-shaped no-op, and the point is which members are absent |

The `Duration` fragment is now the one case whose correctness is an absence, which inverts §9's usual
advice: for the two formatting classes, assert values and never shapes; for this one, assert the specific
members that must not be there, because an absence has no value to assert. What the `executed-meta` spec
pins is unchanged — the recognition still resolves the same classes — so no assertion in that file moves,
only the comments that described what the class then rendered.
Run them the cheap way, from `apps/ai-dial-admin/`:
`npx vitest run src/components/Analytics/QueryBuilder/utils/tests/executed-meta.spec.ts src/components/Analytics/QueryBuilder/Result/tests/result-column-format.spec.ts --reporter=dot`.

## 10. Alternatives rejected

- **One formatter for every numeric column.** Rejected upstream in the proposal on measured evidence: over
  a real usage-log distribution a compact formatter renders a median cost of `0.0004792` as `0` and a
  delimited formatter as `0.00`, while a multi-billion token sum is only readable compacted. Recorded here
  because it is the decision the whole design hangs off.
- **Extract the digit logic out of `formatSignificantCost` and have it delegate.** This was the tidier
  option and it loses on three counts. `analytics/conversations-listing` requires that cost rounding "be
  local to this page and MUST NOT change the shared currency formatter" — moving its implementation into a
  shared util puts a spec-owned behaviour where a later edit to the generic silently changes the money
  column. The two functions differ where it matters: cost renders `$0` for zero, the result cell renders
  `0`. And `formatSignificantCost` parses through `toBig` from
  `apps/ai-dial-admin/src/utils/analytics/scalar.ts`; a cross-cutting formatter must not import an
  analytics helper (`.claude/rules/utils.md` placement). Cost of the rejection: the six-line technique
  exists twice. Trigger to revisit: a third caller.
- **Move `stripTrailingZeros` into `number-formatting.ts` and import it back into
  `conversation-formatting.ts`.** Rejected: it is a two-line private helper, the rule of three is not met
  (`.claude/rules/components.md` §3), and it is the only thing that would have put a file the
  conversations-listing spec owns into this change's blast radius. Duplicate the two lines with its
  comment.
- **Extend `buildColumnLabels` to return label *and* type.** Rejected in §4: it changes three consumers of
  `Record<string, string>` for no benefit and conflates two resolutions.
- **Put the formatting into `getResultColumns` in `utils/result.ts`.** Rejected in §1: it would drag
  `configs.ts` (a `'use client'` module that imports a React header component) into a pure util that
  `executed-meta.ts` and `chart-options.ts` both import, and `ResultArea.tsx` is already the stated place
  for grid-runtime concerns.
- **Infer a temporal column from epoch-looking values.** Rejected by the proposal and re-encoded here as
  an explicit scenario: an aggregate alias whose values are all epoch millis must not become a date
  column. There is no way to tell it from a large count.
- **Reuse `numericColumn` for alignment but keep the inherited comparator.** Rejected in §7 — the
  inherited comparator sorts a string decimal lexicographically and sorts a `0` to the end, so declaring a
  column numeric and leaving it sorting as text is the worse of the two inconsistencies.
- **Recognise a duration from the column's name** — a `_ms` suffix, alone or as a fallback behind the
  `performance` tag. This was the rule an earlier draft of §12 carried, and it is rejected there on
  measured catalog evidence. In summary: the name is the same provisioned catalog data as the tag, so it
  is no more stable, while being a spelling rather than a classification; the premise that the name is the
  schema's only unit statement is false (`description` says "in milliseconds" and `display_name` says
  "(ms)"); and the suffix admits the worse failure direction, a non-duration column named `*_ms` rendering
  as a time. Taken as a *fallback* behind the tag it would have covered the one field the tag misses
  (`demo_conversations.duration_ms`, a seeded demo table) — that is the whole of what the rejection costs,
  and what that column degrades to is the compact rendering it already has. Trigger to revisit: none. The
  fix for the gap is the catalog unit attribute in §12's follow-up, not a second heuristic.
- **Recognise bytes columns too** (`request_body_bytes`, `response_body_bytes`), since `formatBytes`
  already exists. Rejected and recorded as a non-goal, and the reason is now precise: the catalog gives
  them no unit signal at all. Their tags (`request`, `response`) name the message part they belong to, not
  a unit, so the tag rule has nothing to key on — the unit lives only in their `description` ("in bytes")
  and their `display_name` ("Request body size"), which are prose and display text. This is a catalog gap
  rather than a frontend one: the frontend already has the formatter and the call site, and is missing only
  the declaration. A byte count compacted to `4.2 M` is coarse rather than nonsense, where a duration
  compacted to `698.7 K` states a nonsense figure, so the gap is also cheap to leave open. Trigger to
  revisit: the catalog unit attribute in §12's follow-up, which would let bytes join in one line.
- **Render a recognised duration column as a duration** — `formatDurationMs`, so `698700` reads `698.7s`.
  This shipped, and the owner rejected it: the column's header is the catalog display name and states the
  unit ("Duration (ms)"), so a converted cell contradicts its own header. Rejected in §12, and with it the
  alternative way out, **stripping the unit from the header** — the client does not rewrite catalog display
  text, and the delta requires a schema column to be headed by it. Cost of the rejection: a long duration
  reads as a large millisecond count, which is at least the count its header claims. Trigger to revisit: the
  catalog `unit` attribute of §12's follow-up, or a decision that the result grid owns its own headers.
- **Reuse `formatHopDuration`**, which escalates to minutes and hours and would render 698 700 ms as
  `11m 39s`. Rejected before the decision above made every duration formatter moot, and recorded because it
  is the first thing a reader will reach for if the header question is ever reopened: it returns `''` for
  any value `<= 0`, encoding a conversations-trace ruling that `analytics/conversation-trace-listing` owns
  as a requirement, and the result grid must not implement another capability's spec over data from any
  table — the same objection this list already raises against `formatSignificantCost`.
- **Keep `numericColumn` and `baseNumberFilter` on a duration column while dropping only the
  `valueFormatter`** — raw text, right-aligned, numeric sort and filter. Rejected in §12: the owner's
  instruction was that a recognised duration render exactly as an unclassified column does, and adopting
  `numberValueComparator` on a column this change no longer formats would import its `new Big('')` throw
  (§11) for no rendering benefit. Cost of the rejection: that column loses right-alignment and numeric
  sorting. Trigger to revisit: a report that a duration column sorts wrongly.
- **Carry the unit through an aggregate function** to a `SUM`/`AVG` alias. Rejected in §12: it needs either
  a hardcoded function vocabulary against a runtime-supplied catalog or the function catalog's declared
  return type, which the proposal's Non-goals exclude — and a wrong answer (`COUNT(duration_ms)` reading
  `1.2s`) states something false, where today's answer merely fails to shorten.
- **A browser-verification pass over every scenario.** Narrowed rather than rejected; see
  `plan.json`'s `browser_verification`. Two scenarios go to the browser, because the grid is mocked in
  every unit test in this area and the date-time branch is the only one that changes filter machinery. The
  other fifteen are a formatter's output asserted directly.

## 11. Risks — what could be wrong here, and where it shows up first

- **A schema `Long` that is really an id compacts to `1.2 T`.** The design takes the declared type as the
  schema's own statement about the value class and has no way to tell a quantity from an identifier.
  Shows up first as a nonsense figure in a row-mode projection of such a column. If it bites, the fix is a
  denylist by field name in `FIELD_TYPE_VALUE_CLASS`'s neighbourhood, not a value heuristic.
- **An aggregate alias that is decimal by nature but whole in every returned row classifies as
  `Compact`.** `AVG` returning exactly `2` across a short result is the case. Shows up as a compacted
  average; the next run with a fractional value classifies correctly, so it presents as inconsistency
  between runs rather than as a wrong number. Accepted: the alternative is wiring the function catalog's
  return type, which the proposal excludes.
- **The tooltip is not digit-exact past double precision.** `formatNumberByDelimiter` coerces with
  `+value` before constructing `Big`, and its `splitNumber` discards the exponent of a `Big` that
  stringifies in exponential form — so a `Long` past 2^53 loses low-order digits and `1e21` renders as
  `"1"` (§6). Shows up as a tooltip that disagrees with the backend on the last few digits of a very
  large id-like `Long`, which is the same column §11's first bullet says should not have been compacted
  in the first place. Not pre-empted: `formatNumberByDelimiter` is shared and this repository's rule is
  to use rather than edit a shared helper. If it bites, the fix is a string-path delimiter in
  `result-column-format.ts`, not a change to the shared formatter.
- **`numberValueComparator` throws on `new Big('')`.** A declared `Decimal` column that returns an empty
  string in a row would throw inside AG Grid's sort. `null` is safe (it takes the non-string path).
  Shows up first as a crash on the first click of that column's header, not as a wrong order — so it is
  loud rather than silent. Not pre-empted here, because `numberValueComparator` is shared and this
  repository's rule is to use rather than edit a shared helper; if it bites, wrap the comparator inside
  `result-column-format.ts`.
- **`formatNumberWithExponent` does not compact a negative magnitude** — its first branch is
  `num < 1000`, so `-5000` renders `-5000`. Pre-existing in the shared formatter and out of scope. Shows
  up on a negative measure (a delta or a difference aggregate), which analytics measures here are not.
- **`AnalyticsFieldType.Date` renders through `toLocaleString`, so a date-only value grows a
  `00:00:00`.** The proposal mandates reusing `dateTimeColumn`, which has no date-only variant. Shows up
  on a `Date`-typed column. If it matters, it is a new partial in `configs.ts` and a fourth value class.
- **A long duration reads as a large millisecond count.** A recognised duration column is unformatted
  (§12), so a five-minute conversation reads `312450` rather than `5m 12s`. It is the figure its header
  claims and no digit is lost, so this is legibility rather than accuracy — and it is the shipped state of
  every millisecond column in this grid before this change, minus the compaction. Shows up first on
  `duration_ms` for a long conversation. The fix is not a formatter at this call site while the header
  states the unit: it is the catalog `unit` attribute of §12's follow-up, or a decision about who owns the
  header.
- **A recognised duration column loses right-alignment and numeric sorting.** `{}` carries no
  `numericColumn`, so the column sits with the grid's defaults and a millisecond value arriving as a string
  sorts lexicographically — `'9'` after `'10'` — exactly as it did before this change. Shows up on the first
  click of that column's header. If it bites, the one-line fix is the fragment §10 records as rejected:
  `{ ...numericColumn, ...baseNumberFilter }` with no `valueFormatter`.
- **`performance` is a classification, not a declared unit, and it is free text on the wire.**
  `QuerySchemaFieldDto` types `tag` as an optional label with no value set (`user_email` is the example in
  its own schema annotation), so nothing but current practice keeps `performance` meaning "a millisecond
  measurement". Two directions, and they cost differently. A duration field that arrives **untagged** or
  retagged loses its duration rendering and compacts — the defect returns for that one column, visibly,
  and that is already the state of `demo_conversations.duration_ms` today (§12). A **non-duration numeric**
  field tagged `performance` — a rate, a ratio, a percentile — loses its compact rendering and shows raw
  digits. Both directions are now benign, which is the one thing the reversal in §12 bought: when the
  consequence was a duration formatter, a mistagged percentile read "0.9s" and stated something false;
  with no formatter, the worst a mistag can do is leave a large number uncompacted. Shows up as one column
  rendered unlike its numeric neighbours. If it bites, the fix is one line in `schemaValueClass` — a
  field-name denylist beside the tag gate, or the catalog `unit` attribute of §12's follow-up read in place
  of the tag. Do not reach for the column name as a second signal without re-reading §12: that trade was
  measured and declined.
- **The rule is verified against the catalog as provisioned locally, which is not a contract.** The
  five-column coverage table in §12 was read out of `column_mapping` on the local instance, and this
  repository's own notes record that local and dev provisioning differ in places. A dev or production
  catalog that tags fewer fields shows up as a duration column compacting — the same benign direction as
  the untagged demo field, and the reason item 7.3 puts one duration cell in front of a real backend
  rather than trusting a hand-written field fixture. Item 7.3 is now withdrawn, so nothing below the
  browser proves the fetched entity schema delivers `tag: performance` at all, and a catalog that tags
  fewer fields than the local one silently degrades every duration column to a compacted count.
- **An aggregate over a duration field still compacts.** `AVG(duration_ms)` under the builder's derived
  alias — which names the field, so its header still implies milliseconds — reads `698.7 K`. This is the
  reported defect surviving in aggregate mode, accepted deliberately in §12 and pinned by a scenario so it
  is visible rather than silent. Shows up on any grouped duration query. If the owner wants it, the fix is
  select-expression resolution plus a unit-preserving function set, and it needs the proposal's Non-goal on
  the function catalog reopened.
- **The `Timestamp` branch changes a column's filter type**, not only its text. If `dateFilter` were
  omitted or paired wrongly the failure is a runtime throw inside the grid, and every unit test in this
  area mocks `GridView` away. This is the reason the browser subset is not empty.

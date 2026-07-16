# Design — consume the served function catalog

## Context

The builder currently encodes the function catalog in three static places (`QueryAggregateFn`,
`QueryScalarFn`, `QueryBucketUnit`, `SQL_FUNCTIONS`) and hand-codes `date_bin`'s shape in
`serialize`/`deserialize`/`fields` plus a bespoke `amount + unit` editor. The backend now serves the
whole catalog at `GET /v1/queries/functions`, guaranteed in parity with the translator. The product
decision is that the FE keeps **no** function knowledge and consumes only the served catalog.

## The wire contract (mirrored, not invented)

```
QueryFunction {
  name: string
  group: 'scalar' | 'aggregate' | 'ordered_set_aggregate'
  signature: string
  returns: 'string'|'integer'|'long'|'numeric'|'timestamp'|'same_as_argument'
  distinct_supported: boolean
  description: string
  args: QueryFunctionArg[]
}
QueryFunctionArg {
  name: string
  kind: 'expression' | 'integer_literal' | 'numeric_literal' | 'string_literal'
  optional?: boolean                         // present only when true
  constraints?: { allowed_values?: string[]; min?: number; max?: number }  // members present only when applicable
}
```

Mirror as `src/models/analytics/query-function.ts` with `enum`s for the three closed value sets (per
code standards) and interfaces for the object shapes. `optional`/`constraints` and the constraint
members are optional to match the backend's `NON_NULL` omission.

## Central decision: one generic arg model replaces two bespoke rows

Both current rows assume "≤ 1 expression arg, plus date_bin's amount/unit bolted on":

```
GroupByRow  { fn, field, alias, amount, unit }
AggregateRow{ fn, field, distinct, alias }
```

New shape — a row holds an ordered arg-value list, one slot per catalog arg:

```
FnArgValue { field?: string; literal?: string }   // exactly one populated, per the arg's kind

GroupByRow  { id; fn: string | null; field: string; alias: string; args: FnArgValue[] }
            //   fn === null  → plain column (field holds the column; args empty)
            //   fn !== null  → scalar function (args, one per catalog arg)
AggregateRow{ id; fn: string; alias: string; distinct: boolean; args: FnArgValue[] }
```

`fn` becomes a plain `string` (a catalog function name) — there is no enum to hold it. Plain columns
keep the `fn: null` sentinel and the `field` slot so the existing chip-vs-row rendering and the
Having/Sort option derivation are undisturbed.

### The arg editor is a pure function of the catalog arg

```
kind = expression        → CategorizedFieldDropdown, value ↔ args[i].field
kind = integer_literal    → numeric CompactInput, min/max from constraints, value ↔ args[i].literal
kind = numeric_literal    → numeric CompactInput, min/max from constraints, value ↔ args[i].literal
kind = string_literal      →
    constraints.allowed_values present → CompactSelect of those values, value ↔ args[i].literal
    else                               → text CompactInput, value ↔ args[i].literal
optional = true            → slot may be left empty (e.g. count's arg); omitted from serialization
```

Consequence: `date_bin` needs **no special case** — its args
(`amount:integer_literal(min 1)`, `unit:string_literal(allowed_values)`, `timestamp:expression`)
render as numeric input + unit select + field dropdown by the rules above. `QueryBucketUnit`
disappears; the unit select is fed by `allowed_values`. `width_bucket` (4 × expression) and the
percentiles (numeric-literal fraction `0..1` + expression) also render with no bespoke code.

**Lost UX niceties (accepted):** date_bin no longer prefers a temporal field for its timestamp arg
(any expression arg lists all fields), no default `"bucket"` alias, no hand-tuned one-line layout.
These are consistent with "consume only what the BE gives"; args render in catalog order.

## Serialize / deserialize become catalog walks

**Serialize** (`groupByFnExpr` and the aggregate branch collapse into one helper):

```
fnExpr(row, catalogFn):
  args = catalogFn.args.map((arg, i) =>
    arg.kind === expression
      ? { type: Field, name: row.args[i].field }
      : { type: Value, value_type: valueTypeFor(arg.kind), value: row.args[i].literal })
    .filter(drop empty optional slots)
  return { type: Fn, name: row.fn, args, ...(row.distinct ? {distinct:true} : {}) }

valueTypeFor: integer_literal→Integer, numeric_literal→Decimal, string_literal→String
```

**Deserialize** (`parseAggregateSelect` stops special-casing date_bin / single-arg):

```
for each select column with a Fn expr:
  fn = catalog.find(name === expr.name)
  if !fn → skip (unknown function: not builder-representable, stays in JSON/SQL view)
  slots = fn.args.map((arg, i) => arg.kind === expression
      ? { field: expr.args[i]?.name }
      : { literal: expr.args[i]?.value })
  fn.group === scalar → push GroupByRow{ fn: fn.name, args: slots, alias }
  else                → push AggregateRow{ fn: fn.name, args: slots, distinct: !!expr.distinct, alias }
```

`SCALAR_FNS` (the `Set` used to route select entries) is derived from the catalog
(`group === scalar`) instead of the enum. A function absent from the catalog makes the query
non-representable in the visual builder — it remains editable in JSON/SQL, matching how the builder
already treats over-deep filter trees.

## Result typing from `returns`

`fields.ts::scalarFnResultType` (a hardcoded switch) is replaced by reading the catalog `returns`:

```
returns = numeric|integer|long → the corresponding AnalyticsFieldType
returns = string|timestamp     → the corresponding AnalyticsFieldType
returns = same_as_argument     → type of the first expression-kind arg's field, from the schema
                                 (min, max, percentile_disc); fall back to a neutral type if unresolved
```

This is the one place resolution combines catalog metadata with schema types — still zero local
function knowledge.

## Implicit aggregate measure without a hardcoded name

Aggregate mode with no explicit aggregate still needs a value column (charts require one). Instead of
literal `count()`, pick from the catalog: **the first `aggregate`-group function whose every arg is
`optional`** (or which has no args) — which resolves to `count` by metadata (its sole arg is
optional), not by name. If no such function exists in the catalog, emit no implicit measure and let
the existing "empty aggregate" warning stand. `IMPLICIT_COUNT_ALIAS` (the alias string) is retained.

## DISTINCT reversal (deliberate spec change)

The master spec currently states "DISTINCT controls SHALL NOT be rendered" — a blanket
simplification from the builder redesign, made when the FE could not know which functions accept
distinct. The catalog now advertises `distinct_supported` per function, so this change renders a
per-aggregate distinct toggle **only** on rows whose catalog entry allows it, diffed into the
serializer's existing `distinct` field (already supported for JSON-authored queries). The spec delta
reverses the prior requirement and records why.

## Data flow / failure mode

`query-builder/page.tsx` already fetches entities + schema server-side under `force-dynamic` and
seeds the client builder via props. The catalog fetch slots in identically: `getFunctions()` →
`initialFunctions` prop → builder context, one source read by every section.

No local fallback catalog exists (that would reintroduce FE function knowledge). If the fetch fails
or returns empty, `functions` is `[]`:

```
Group by dropdown   → Functions group empty; plain columns still addable
Aggregate section    → no fn options; user cannot add metrics
Implicit measure     → no aggregate-group fn found → omitted; "empty aggregate" warning shows
Row mode             → fully functional (no functions involved)
SQL autocomplete     → no function names suggested (keywords/fields still suggested)
```

This is the accepted "degrade — hide function features" behavior: a transient catalog outage guts
aggregate-mode function editing but never breaks plain-column querying or the page.

## Alternatives considered

- **Extend the enums by hand** (keep static, add the 3 functions + constraints): rejected — it is
  exactly the drift the backend endpoint was built to end.
- **Bundle a static fallback catalog** for resilience: rejected — reintroduces FE function knowledge,
  against the product decision. Degrade-to-empty is accepted instead.
- **Client-side fetch** in the builder: rejected — the page already fetches discovery data
  server-side; matching that keeps one loading model and avoids a client waterfall.

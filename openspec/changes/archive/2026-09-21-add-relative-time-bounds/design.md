## Context

See `proposal.md` — Why. The constraints that shape the approach:

- **The builder holds no function knowledge of its own.** Every name, argument shape, allowed value
  and bound comes from `GET /v1/queries/functions` (`models/analytics/query-function.ts`). Any design
  that teaches the frontend what "relative time" means as a concept fights that rule.
- **A condition's two sides are asymmetric today.** The left operand is `fn: string | null` +
  `field` + `args: FnArgValue[]`; the right is `valueType` + `value` + `isNull`. The serializer and
  the representability checks both encode that asymmetry.
- **`FnArgValue` is flat** — `{ field?: string; literal?: string }` — so a call cannot hold a call.
- **The toolbar preset is already relative at rest.** A saved query stores `{mode: 'relative',
  period: '2d'}` in its `time` member and the body persists without a time bound
  (`analytics/saved-queries` — *Saving persists authored intent, not a resolved range*). This change
  is about the **serialized** body, not about storage.

## Goals / Non-Goals

**Goals:**

- One general mechanism — a call where a value was allowed — that makes the relative bound
  expressible, rather than a time-specific feature.
- Symmetric serialize / deserialize: every shape the builder can emit, it can read back.
- A preset's serialized body that is correct on its own, wherever it is executed from.

**Non-Goals:**

- Unbounded nesting. One level, capped by the editor, matching how the filter tree caps at two.
- A general "expression editor". The right operand gains a function kind; it does not gain columns,
  arithmetic, or parentheses.
- Changing the saved-query payload. `time` intent keeps its meaning and shape.

## Decisions

### D1 — Mirror the left operand's shape on the right, don't unify them

`FilterPredicateNode` gains `rightKind: FilterOperandKind` (`Literal` | `Function`), `rightFn:
string | null`, `rightArgs: FnArgValue[]`. The literal members stay as they are.

*Why not a shared `Operand` union for both sides?* It is the tidier model and it costs a rewrite of
every consumer — `FilterCondition`, `operandSummary`, `serializeNode`, `parseFilterNode`, the
representability checks and their specs — for symmetry nothing in this change needs. The two sides
genuinely differ: the left offers columns and withholds array-returning functions; the right offers
no columns and, under `in`, no functions either.

*Why an explicit `rightKind` rather than deriving it from `rightFn !== null`?* "The user switched to
a function but has not picked one yet" is a real state with its own editor. Deriving the kind would
make that state indistinguishable from a literal condition and snap the UI back on every render.

### D2 — `FnArgValue` gains a recursive `call` member

```ts
export interface FnCallValue {
  fn: string;
  args: FnArgValue[];
}

export interface FnArgValue {
  field?: string;
  literal?: string;
  call?: FnCallValue;
}
```

The type permits any depth; the **editor** and the representability rules cap it at one. That split
is deliberate: the depth limit is a property of what the argument editor can render, not of what a
query may say, and the two move independently — a later change that renders deeper nesting touches
the editor and the checks, not the model or the serializer.

*Alternative considered:* a separate non-recursive `NestedFnArgValue` so the compiler enforces the
one-level cap. Rejected: it duplicates the serialize and deserialize walks for the nested case, and
the cap it enforces is exactly the one the editor already has to enforce at runtime for a
JSON-authored query.

### D3 — Presets carry their own `(unit, amount)` pair

`TimePeriodOption` gains `unit: string` and `amount: number` beside `offset`, filled in
`timePeriodOptionsConfig` (`15m` → `minute`/15, `24h` → `hour`/24, `2d` → `day`/2, …).

*Why not derive the pair from `offset`?* Derivation is ambiguous in the direction that matters:
86400000 ms is both `hour`/24 and `day`/1, and lifting has to match a served body back to the preset
the user picked. Declaring the pair makes the round trip exact and keeps `24h` from reading back as
`1d`. `offset` stays — it is what the absolute fallback, the range picker and `maxRangeMs` use.

Anchored options (`AnchoredTimePeriodOption`) get no pair: their start is a fixed instant, so they
serialize absolutely.

### D4 — The toolbar names two functions, and verifies them against the catalog

Relative serialization needs to name `date_sub` and `now`. These two names live in
`constants/analytics/query-builder.ts`, and the toolbar path emits a relative bound only when the
served catalog carries both, the subtraction's unit argument lists the preset's unit among its
`allowed_values`, and its amount argument's `min` does not exceed the preset's amount. Otherwise it
serializes the resolved instants exactly as today.

*Why this does not violate "no hardcoded function knowledge":* that rule governs the function set
**offered to the user** — what the dropdowns list, how options are labelled, which arguments are
editable. The toolbar offers no choice; it expresses one fixed semantic and must therefore name the
function that carries it. The catalog check is what keeps the naming honest: a deployment whose
catalog lacks the functions degrades to absolute bounds instead of emitting a call the service
rejects — and a rejected predicate takes the whole query down, not just the bound.

*Alternative considered:* find the function by shape (a scalar returning `timestamp` with a unit
literal, an amount literal and a timestamp expression). Rejected as too clever: `date_add` matches
that shape exactly and means the opposite.

### D5 — Lifting reads three right-hand shapes, and yields a preset id

`matchTimePredicate` currently returns a `Date` or null. It becomes a matcher returning a small
descriptor: an absolute instant, the current instant (`now()`), or a relative bound (`unit`,
`amount`) — and `liftTimeRange` decides from the pair:

| lower bound | upper bound | lifted as |
| --- | --- | --- |
| absolute | absolute | custom range (as today) |
| `date_sub(unit, n, now())` | `now()` | the preset whose pair matches |
| anything else | anything else | not lifted — stays a filter condition |

`LiftedTimeRange` gains an optional `periodId`, and the page applies it to the toolbar the way a
saved query's relative intent is already applied. A relative pair matching **no** offered preset is
deliberately not lifted: the toolbar can only show a preset or a custom range, and turning it into a
custom range would silently freeze a window the author wrote as moving.

### D6 — The condition editor renders the nested call with the editor it already has

`FnArgEditor` takes an `isFunctionOffered` flag. At the top level of a call it renders the same
`CategorizedFieldDropdown` the left operand uses, with the catalog's whole `scalar` set in its
Functions group (no array-return exclusion — see the spec delta for why), and renders the picked
call's own arguments below with the flag off. A zero-argument function (`now()`) renders as the
picked call with no argument editors, which is exactly what the shape needs.

## Risks / Trade-offs

- **A preset's window is now measured by the data store's clock, not the browser's.** → This is the
  correct behaviour and removes client skew, but a user comparing a "Last 15m" result against a
  wall clock may see a boundary shift by the skew amount. Documented in the spec's rationale; no
  mitigation needed beyond that.
- **A relative pair matching no preset lands in the Filters tree while the toolbar still contributes
  its own bound** → the query then carries two time bounds, narrowing the result. This is exactly
  how an unrecognized absolute pair already behaves, so it introduces no new failure mode; the
  visible conditions make it diagnosable.
- **The recursive `FnArgValue` lets code construct depth the editor cannot show.** → The
  representability check is the single gate, and it is covered by its own scenarios; a body that
  gets past it would hydrate with a dropped argument, which is the failure this change's spec
  explicitly forbids.
- **Four call sites read `FnArgValue` today** (serialize, deserialize, `functionArgSummary`,
  `isArgFilled`/`requiredArgsFilled`). Missing one means an incomplete nested call silently
  serializes as an empty argument. → Each is covered by a task and a test; `requiredArgsFilled` must
  recurse, which is the easiest of the four to overlook.
- **Unsaved-change detection compares payloads, and the payload's body carries no time bound** → the
  serialization change cannot make a clean page look dirty. Worth a regression test rather than a
  mitigation.

## Migration Plan

No data migration and no feature flag. Previously serialized bodies keep their meaning: absolute
pairs still lift, and no stored artifact holds the new shape until a user re-saves. Rollback is a
plain revert — a body carrying `date_sub`/`now` written before the revert stays valid and executable
against the service, and reverts to opening in the JSON view rather than the Builder.

## Context

`Pricing.tsx` renders four flat `PriceControl`s (prompt, completion, cacheRead, cacheWrite) on both
model surfaces, storing per-token rates but displaying them per-million via the scalar transforms in
`Pricing/utils.ts`. DIAL Core now accepts `cacheRead`/`cacheWrite` as a flat rate string **or** a
recursive decision tree (`{ test: { field, operator, value }, ifTrue?, ifFalse? }` — see core's
`PricingRate`/`Condition`/`Operator`/`StandardField`), where each branch is itself the same union and
an omitted branch means "fall back to the prompt rate". Two existing consumers read these values
blindly as scalars and will misrender objects: the models grid `tooltipValueGetter`
(`constants/grid-columns/grid-columns.tsx:195-205`) and the audit comparison's `convertPricing`
(`ActivityAudit/View/utils/compare-helpers.ts:35-46`), which would emit `NaN` / `[object Object]`.

## Goals / Non-Goals

**Goals:**

- Author and round-trip flat-or-tree cache rates from both model surfaces with one shared control.
- Mirror core's contract exactly: five standard fields, `$`-prefixed JSONPath free text, six
  operators, string-or-number condition values, unbounded nesting, omitted-branch fallback.
- Keep every existing guarantee of the flat path (token-unit gating, absent-vs-`"0"`, per-million
  scaling) intact for tree leaf rates at every depth.
- Render tree values readably in the grid tooltip and the activity-audit comparison.

**Non-Goals:**

- Raw-JSON/Monaco editing of the tree, client-side evaluation/preview, depth caps, `rate`-keyed leaf
  objects (the UI stores flat values as bare strings, matching core's serializer).
- Touching prompt/completion controls or the cost-unit gating logic.

## Decisions

### D1. Data model: a two-member union, no wrapper discriminant

```ts
// models/dial/model.ts
export enum PricingOperator { EQ = '==', NE = '!=', GT = '>', LT = '<', GE = '>=', LE = '<=' }

export interface PricingCondition {
  field: string;              // bare standard field or '$'-prefixed JSONPath
  operator: PricingOperator;
  value: string;              // always string on the wire; core accepts string | number
}

export interface PricingRateNode {
  test: PricingCondition;
  ifTrue?: PricingRate;
  ifFalse?: PricingRate;
}

export type PricingRate = string | PricingRateNode;
```

`DialModelPricing.cacheRead`/`cacheWrite` become `PricingRate`. `typeof value === 'string'` is the
flat check — no `type` discriminant field, because the wire format has none and adding one would
break round-tripping. An enum (not a literal union) for operators per code-standards; the symbol
values are what core's `@JsonValue` emits. The standard-field vocabulary
(`cachedReadTokens`, `cachedWriteTokens`, `promptTokens` numeric; `serviceTier`, `ttl` string) lives
as a const list with an `isNumeric` flag in `ModelView/Pricing/constants.ts` — it is pricing-domain
data, not a domain-free constant. *Alternative rejected:* a class-style `PricingRate` model with
`isLeaf()` — Java-side convenience that adds nothing to a discriminated-by-`typeof` TS union.

### D2. One recursive control, feature-local

`ModelView/Pricing/PricingRateControl.tsx` renders a single cache rate slot in either shape:

```
PricingRateControl(value: PricingRate, onChange, disabled)
├─ value is string → PriceControl (existing) + toggle button
└─ value is node   → ConditionRow (field autocomplete | operator DialSelect | value DialInput)
                     + "If true"  → PricingRateControl   ← recursion: branch may become a tree
                     + "If false" → PricingRateControl
                     + toggle back to flat
```

Recursion gives unbounded depth for free and keeps branch editing identical to top-level editing
(the ticket's requirement that `ifTrue`/`ifFalse` "can be another tree"). The control is
feature-local, not `Common/`, because it is pricing-domain; only the field input's generic part is
pushed down (D3). `Pricing.tsx` swaps its two cache `PriceControl`s for `PricingRateControl`; the
generic `{ pricing? }` prop means both call sites (`ModelView/ModelProperties`,
`Assets/Platform/Models/Properties`) need no changes.

### D3. Field input: a single-value sibling of MultiValueAutocomplete in Common/

New `Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx`, modeled on
`Common/MultiValueAutocomplete` and reusing its `Suggestions` dropdown
(`Common/AttachmentInput/Suggestions`): arrow-key highlight, Enter/Escape handling, free text
accepted when no suggestion matches. Differences from its sibling: one string value in/out (no tag
list), suggestions filtered by prefix/substring, `disabled` support. ui-kit has no 2.0
autocomplete/combobox that accepts free text (verified via the MCP server), and `MultiValueAutocomplete`
is tag-shaped by design — a sibling is cheaper and less risky than forcing either to double duty.
The five standard fields arrive as `availableItems` props from the pricing feature; the Common
component stays domain-free.

### D4. Mode switch: ghost icon button with `aria-pressed`, conversion seeding

A `DialGhostIconButton` (tree icon, `aria-hidden` on the icon, `aria-pressed` for the mode, an
`aria-label` like "Configure conditional rate") next to each cache rate, rather than a
`DialSelectField` mode picker. The pricing row is already four `w-[120px]` controls; a select per
cache field doubles the row's width for a mode the user toggles once. `aria-pressed` exposes the
state programmatically per the a11y rules.

Conversion rules (the product decision the exploration flagged):

- **flat → tree**: both branches seeded with the current flat value — `0.0000003` becomes
  `{ test: <empty>, ifTrue: "0.0000003", ifFalse: "0.0000003" }`, so billing semantics are unchanged
  until the user edits something. Seeding only `ifTrue` would silently reprice the false path to the
  prompt rate.
- **tree → flat**: the flat field is seeded from `ifTrue` when that branch is a flat string;
  otherwise left empty. The user sees the value they are keeping, and discarding the tree is an
  explicit, visible act (the toggle is not a silent data transform).

### D5. Operator availability follows field type; invalid operator resets

The operator `DialSelect` offers all six symbols. When the field is a known **string-typed**
standard field (`serviceTier`, `ttl`), the four ordering operators are unavailable — preempting
core's `ValidConditionValidator` rejection at config load, which would otherwise bounce the whole
model at save time with no pointer back to the field. If the field changes such that the current
operator becomes invalid, the operator resets to `==`. For `$`-prefixed paths and numeric standard
fields all six stay available (a JSONPath can resolve to a number; core only guards bare names).
*Alternative rejected:* always offering six and surfacing a validation error on save — later
feedback for a two-control coupling the UI can prevent inline.

### D6. Scaling walks the tree

`getMultipliedValue`/`getPriceRealValue` gain union-aware siblings (or become union-aware in place —
same call sites) that map over every leaf rate of a `PricingRate` in both directions. Leaf rates in
a tree are per-token exactly like flat rates (the issue's example: `ifTrue: "0.000006"` = $6/M), so
one level of forgetting the transform is a 10⁶ billing error. The transforms stay pure and
co-located in `Pricing/utils.ts` with round-trip unit tests as the guard.

### D7. One formatter feeds grid tooltip and audit comparison

New pure util `formatPricingRate(value, isToken, t)` in `Pricing/utils.ts` producing a compact
conditional expression with per-million-scaled leaves:

```
ttl == 1h ? 6 : 3.75
cachedReadTokens > 1024 ? (promptTokens > 2048 ? 6 : 4) : 3.75
```

- Grid columns: `tooltipValueGetter` returns the formatter output for tree values (flat values
  unchanged).
- Audit: `convertPricing`'s per-key branch becomes union-aware — flat rate → scaled number (as
  today), tree → `formatPricingRate`, so a revision that changed a tree shows a readable diff
  instead of `NaN`. Audit keeps importing from the feature's utils rather than duplicating the
  scaling knowledge.

### D8. Omitted branches stay omitted

An empty branch field (user cleared the flat input and never typed) is **removed** from the node
before save, so the key is absent on the wire and core's prompt-rate fallback applies — the same
absent-means-fallback discipline the flat path already has for absent-vs-`"0"`. The mode-conversion
seeding (D4) means a freshly-converted tree never starts with omitted branches.

## Risks / Trade-offs

- **[Leaf-rate scaling missed at some depth]** → the transform is one recursive util used by every
  path (editor, formatter, audit); round-trip tests assert `store(display(store(x))) == x` for
  nested trees.
- **[Deep trees render an unbounded column of nested blocks]** → visual nesting via left
  padding/indent per level; if real-world depth makes this unwieldy it is a follow-up UX question,
  not a contract one (core is unbounded and the editor must be too).
- **[Free-text field typos (`$` path or bare name) evaluate to non-match at runtime]** → core
  degrades unresolvable fields to non-match by design; the UI does not validate JSONPath syntax
  (RFC 9535 parsing is out of scope). The autocomplete suggestions make the common case
  mistake-free.
- **[Audit diff for large trees is one long string]** → accepted: the audit comparison is
  line-oriented text today; a structured tree diff is a separate capability if ever needed.
- **[Read-only/disabled states multiply across the recursion]** → `disabled` propagates through the
  recursive control; component tests cover a disabled tree render on both surfaces.

## Migration Plan

None. The union is additive: existing flat-string data round-trips unchanged, both surfaces share
the one control, and no API or server-action signature changes. Rollback is reverting the UI —
core data with trees simply displays via the formatter until then.

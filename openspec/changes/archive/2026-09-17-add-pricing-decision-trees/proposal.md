## Why

DIAL Core now accepts `pricing.cacheRead` / `pricing.cacheWrite` as either a flat per-token rate
string or a decision-tree object that resolves a rate from the current call's usage data
(`cachedReadTokens`, `serviceTier`, `ttl`, …, or a `$`-prefixed JSONPath). The admin UI only edits
the flat shape — a model configured with a conditional rate can be viewed but not authored or
faithfully round-tripped from either model surface. Issue #4577.

## What Changes

- `DialModelPricing.cacheRead` / `cacheWrite` become a union: flat rate string **or** a decision-tree
  node (`{ test: { field, operator, value }, ifTrue?, ifFalse? }`), mirroring core's `PricingRate`
  (de)serializers — branches are themselves the same union, recursively.
- Each cache rate control gains a flat ↔ conditional mode switch:
  - flat → conditional seeds both branches with the current flat value, so the switch is
    semantics-preserving rather than silently changing billing;
  - conditional → flat seeds the flat field from the `ifTrue` branch when that branch is a flat rate,
    otherwise leaves it empty.
- The conditional editor renders per node:
  - **field** — a new single-value autocomplete sibling of
    `Common/MultiValueAutocomplete` (same `Suggestions` dropdown, free text allowed for `$`-prefixed
    JSONPath), suggesting the five standard fields: `cachedReadTokens`, `cachedWriteTokens`,
    `promptTokens`, `serviceTier`, `ttl`;
  - **operator** — `DialSelect` with core's six operators: `==`, `!=`, `>`, `<`, `>=`, `<=`. Ordering
    operators are unavailable when the field is a known string-typed standard field (`serviceTier`,
    `ttl`), preempting core's config-load rejection;
  - **value** — `DialInput` (always sent as a string; core accepts string or number);
  - **ifTrue / ifFalse** — each renders the same recursive control, so a branch can itself become a
    tree. Depth is unbounded, matching core.
- Per-million display scaling (existing `Pricing/utils.ts` transforms) applies to **every leaf rate
  in a tree**, in both directions.
- Models grid cache-rate columns and the activity-audit pricing comparison render tree values as a
  readable summary instead of `[object Object]`.

No change to prompt/completion editing, cost-unit gating (cache rates still token-unit-only), or the
absent-vs-`"0"` persistence distinction — an empty branch stays omitted so core's prompt-rate
fallback semantics are preserved.

## Non-goals

- Editing the decision tree as raw JSON/Monaco — the structured editor is the only authoring surface.
- A depth cap on nesting — core is unbounded; the editor recurses to match.
- Client-side evaluation or preview of a tree against sample usage data.
- Extending the tree shape beyond `test`/`ifTrue`/`ifFalse` (no `rate`-keyed leaf objects in the UI
  model — flat values are stored as bare strings, matching core's serializer output).
- Changes to prompt/completion price fields.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `model-cache-pricing`: cache read/write rates become flat-or-decision-tree values; new requirements
  for the conditional editor (field suggestions, operator set and type coupling, recursive branches,
  mode-conversion seeding, per-million scaling of every leaf, grid/audit summary rendering of tree
  values).

## Impact

- `apps/ai-dial-admin/src/models/dial/model.ts` — `DialModelPricing` union types (new
  `PricingRateNode`/`Condition` models).
- `apps/ai-dial-admin/src/components/ModelView/Pricing/` — `Pricing.tsx` mode switching, recursive
  tree editor (feature-local), recursive scaling utils.
- `apps/ai-dial-admin/src/components/Common/` — new single-value autocomplete (domain-free).
- `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — tooltip/value getters for union
  values.
- Activity audit pricing comparison — union-aware display.
- No server-action or API-layer changes: the backend already stores whatever JSON the model carries;
  the type union is the whole contract change.
- Both consumers of `Pricing` (`ModelView/ModelProperties`, `Assets/Platform/Models/Properties`)
  inherit the new control through the shared `{ pricing? }` generic.

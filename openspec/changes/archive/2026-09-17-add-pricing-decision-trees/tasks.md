## 1. Data model and pure utils

- [x] 1.1 Add `PricingOperator` enum, `PricingCondition` and `PricingRateNode` interfaces, and the
  `PricingRate` union to `apps/ai-dial-admin/src/models/dial/model.ts`; change
  `DialModelPricing.cacheRead`/`cacheWrite` to `PricingRate`
- [x] 1.2 Add the standard-field vocabulary (`cachedReadTokens`, `cachedWriteTokens`, `promptTokens`
  numeric; `serviceTier`, `ttl` string) with an `isNumeric` flag and the six operator options to a
  new `apps/ai-dial-admin/src/components/ModelView/Pricing/constants.ts`
- [x] 1.3 Make the per-million scaling transforms in
  `apps/ai-dial-admin/src/components/ModelView/Pricing/utils.ts` union-aware so they map over every
  leaf rate of a `PricingRate` in both directions, and add the pure `formatPricingRate` formatter
  (conditional summary with per-million leaves, e.g. `ttl == 1h ? 6 : 3.75`)
- [x] 1.4 Add unit tests in `apps/ai-dial-admin/src/components/ModelView/Pricing/tests/utils.spec.ts`
  covering the scaling round-trip (`store(display(store(x))) === x`) for flat values, one-level and
  nested trees, omitted branches, `"0"` preservation, and formatter output

## 2. Single-value autocomplete

- [x] 2.1 Create `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx`
  modeled on `MultiValueAutocomplete` (reusing `Common/AttachmentInput/Suggestions`): one string
  value in/out, substring-filtered suggestions, keyboard select (arrows/Enter/Escape), free text
  accepted when nothing matches, `disabled` support, accessible labelling
- [x] 2.2 Add component tests in
  `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/tests/SingleValueAutocomplete.spec.tsx`
  for suggestion filtering, keyboard selection, free-text entry, and disabled state

## 3. Conditional rate editor

- [x] 3.1 Create `apps/ai-dial-admin/src/components/ModelView/Pricing/PricingRateControl.tsx`: flat
  mode renders the existing `PriceControl` plus a `DialGhostIconButton` mode toggle (`aria-pressed`,
  labelled, icon `aria-hidden`); conditional mode renders the test row (field via
  `SingleValueAutocomplete`, operator via `DialSelect`, value via `DialInput`) and recursive
  if-true/if-ifalse `PricingRateControl` branches with visual indentation per depth
- [x] 3.2 Implement conversion seeding: flat → tree seeds both branches with the current flat value;
  tree → flat seeds from a flat `ifTrue`, else empty; empty branches are stripped from the node on
  change so they stay omitted on the wire
- [x] 3.3 Implement operator/field coupling: ordering operators (`>`, `<`, `>=`, `<=`) unavailable
  when the field is `serviceTier` or `ttl`; operator resets to `==` when a field change invalidates
  it; all six available for numeric standard fields and `$`-prefixed free text
- [x] 3.4 Wire `PricingRateControl` into `apps/ai-dial-admin/src/components/ModelView/Pricing/Pricing.tsx`
  for both cache rate slots (prompt/completion unchanged); keep token-unit gating, read-only admin,
  and cost-unit-clears-rates behavior working over the union
- [x] 3.5 Add component tests in `apps/ai-dial-admin/src/components/ModelView/Pricing/tests/` covering:
  mode toggle and seeding in both directions, nested branch authoring, operator availability per
  field type and reset, field suggestions plus `$`-path free text, per-million leaf display,
  omitted-branch persistence, and disabled rendering for a read-only admin

## 4. Grid and audit surfaces

- [x] 4.1 Update the cache rate column `tooltipValueGetter`s in
  `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` to render
  `formatPricingRate` output for tree values (flat values unchanged); update
  `tests/grid-columns.spec.ts` accordingly
- [x] 4.2 Make `convertPricing` in
  `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/compare-helpers.ts` union-aware: flat
  rates scale as today, tree values render via `formatPricingRate`; update
  `tests/compare-helpers.spec.ts` and `tests/create-complex-diffs.spec.ts` fixtures for a
  tree-valued revision

## 5. Quality gates

- [x] 5.1 Run the full gate from `apps/ai-dial-admin/`: lint (`npm run lint`), format
  (`npm run format`), typecheck (`npm run typecheck`), and the full test suite
  (`npm run test` — see memory note for the Windows NODE_OPTIONS prefix), fixing what they surface

> No browser-verification task is included: the user declined it when asked (required question per
> `openspec/config.yaml`); the scenarios are covered by the component/unit tests in 2.2, 3.5, 4.1
> and 4.2.

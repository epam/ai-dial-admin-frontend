> No browser-verification task: the user declined one for this change. Coverage of the
> browser-observable scenarios comes from the component tests in section 4.

## 1. Model type and labels

- [x] 1.1 Add optional `cacheRead` and `cacheWrite` (both `string`) to `DialModelPricing` in
      `src/models/dial/model.ts`. `DialModelResource` in `src/models/dial/resource.ts` already
      references this interface and needs no edit.
- [x] 1.2 Add `CacheReadPrice` and `CacheWritePrice` to `ModelViewI18nKey` in `src/constants/i18n.ts`,
      keyed under `ModelView.Pricing`, with matching entries in the `ModelView.Pricing` block of
      `src/locales/en.ts`.

## 2. Pricing block

- [x] 2.1 Add `onChangeCacheRead` and `onChangeCacheWrite` handlers to
      `src/components/ModelView/Pricing/Pricing.tsx`, each calling `getPriceRealValue(value, isTokenType)`
      exactly as the existing prompt and completion handlers do, so an empty field yields `undefined`
      and an explicit zero yields `'0'`.
- [x] 2.2 Render two `PriceControl` inputs for the new rates, valued via
      `getMultipliedValue(model.pricing?.cacheRead, isTokenType)` (and the cache-write equivalent), and
      `disabled` unless `isTokenType` — also disabled for `isReadOnlyAdmin`, matching the existing
      price fields.
- [x] 2.3 Rework `onChangePricingType` so any unit change clears all four rates: selecting Tokens or
      Char without whitespace leaves `{ unit }` alone, and selecting None leaves the model with no unit
      and no rates instead of today's `{ prompt: '0', completion: '0' }`.
- [x] 2.4 Re-lay out the block per `design.md` — cost-unit select on its own line, the four
      `PriceControl`s in one row below it — keeping the existing sub-`lg` stacked variant unchanged.

## 3. Model grid columns

- [x] 3.1 Append hidden `pricing.cacheRead` and `pricing.cacheWrite` columns to `MODELS_COLUMNS` in
      `src/constants/grid-columns/grid-columns.tsx`, mirroring the existing `pricing.prompt` and
      `pricing.completion` entries (`hide: true` plus a `tooltipValueGetter`).

## 4. Tests

- [x] 4.1 Add component tests for `Pricing.tsx` under
      `src/components/ModelView/Pricing/tests/` covering: both cache fields render with their labels;
      they are enabled under the Tokens unit and disabled under Char without whitespace, None, and
      read-only admin; an empty field is reported as `undefined` while an entered `0` is reported as
      `'0'`; and changing the unit clears all four rates with no `'0'` left behind.
- [x] 4.2 Extend `src/constants/grid-columns/tests/grid-columns.spec.ts` to assert the two new
      columns exist on `MODELS_COLUMNS` and are hidden by default.
- [x] 4.3 Add a case to
      `src/components/ActivityAudit/View/utils/tests/compare-helpers.spec.ts` asserting `convertPricing`
      renders `cacheRead` / `cacheWrite` with the per-million scaling under the token unit — the helper
      is key-agnostic, so this pins behavior rather than changing it.

## 5. Quality checks

- [x] 5.1 Run `npm run lint`, `npm run format`, and the full `npm run test` suite, resolving anything
      they surface.

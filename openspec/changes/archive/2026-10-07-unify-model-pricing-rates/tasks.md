## 1. Pricing contract and editor

- [x] 1.1 Update `apps/ai-dial-admin/src/models/dial/model.ts` so prompt and completion values use `PricingRate`, and generalize the rate documentation.
- [x] 1.2 Update `apps/ai-dial-admin/src/components/ModelView/Pricing/Pricing.tsx` to render all four rates with `PricingRateControl`, reuse recursive display/storage conversions, and retain the distinct prompt/completion and cache disable rules.
- [x] 1.3 Remove the obsolete `isAsset` prop from `Pricing` and its `apps/ai-dial-admin/src/components/Assets/Platform/Models/Properties.tsx` call site.
- [x] 1.4 Update `apps/ai-dial-admin/src/components/ModelView/Pricing/Pricing.tsx` so all four flat rate controls share one row and the whole group switches to a vertical layout when any rate uses conditional editing.

## 2. Model-grid presentation

- [x] 2.1 Generalize the conditional-rate tooltip formatter in `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` and apply it to prompt and completion columns as well as cache columns.

## 3. Automated coverage

- [x] 3.1 Update `apps/ai-dial-admin/src/components/ModelView/Pricing/tests/Pricing.spec.tsx` to cover all four controls without `isAsset`, conditional prompt/completion editing, recursive token scaling, and disabled states.
- [x] 3.2 Add model-grid tests covering readable conditional prompt/completion rate tooltips and token scaling.
- [x] 3.3 Update `apps/ai-dial-admin/src/components/ModelView/Pricing/tests/Pricing.spec.tsx` to cover the flat-rate row and the vertical group layout when any rate is conditional.
- [x] 3.4 No automated browser-verification task: the user explicitly declined `spec-browser-verify` for this browser-observable change.

## 4. Quality checks

- [x] 4.1 Run focused Pricing and grid-column Vitest specs from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite. (The full suite previously had unrelated dataset-export assertion failures.)

## 1. Pricing grid rendering

- [x] 1.1 Update `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` so the prompt, completion, cache read, and cache write columns render conditional `PricingRate` trees with the same shared readable formatter used by their tooltips, while preserving flat-rate output.

## 2. Read-only decision-tree controls

- [x] 2.1 Update `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx` so its selected-value remove action honors `disabled` and cannot call `onChange` when disabled.

## 3. Regression tests

- [x] 3.1 Extend `apps/ai-dial-admin/src/constants/grid-columns/tests/grid-columns.spec.ts` to cover conditional cell formatting and tooltip parity for prompt, completion, cache read, and cache write columns.
- [x] 3.2 Extend `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/tests/SingleValueAutocomplete.spec.tsx` to verify that a disabled selected-value remove action is unavailable or disabled and cannot clear the field.

## 4. Quality checks

- [x] 4.1 Run the targeted grid-column and `SingleValueAutocomplete` Vitest specs from `apps/ai-dial-admin/`.
- [x] 4.2 Run `npm run lint`, `npm run format`, `npm run typecheck`, and `npm run typecheck:specs` as the final quality gate. (Lint and format passed; both typecheck gates remain blocked by the pre-existing `GridColorScheme` ui-kit API drift in `Grid/AgGridWrapper`.)

## Verification decision

No browser-verification task was added because the user declined automated browser verification for this change. Focused unit and component regression tests remain required.

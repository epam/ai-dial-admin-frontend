## 1. Preserve decimal price drafts

- [x] 1.1 Update `apps/ai-dial-admin/src/components/BaseControls/Price.tsx` so `PriceControl` retains valid non-negative decimal drafts while focused, including a trailing separator and repeated fractional zeroes, while continuing to reject negative values.
- [x] 1.2 Keep external value synchronization, empty-versus-zero behavior, and the existing `min={0}` constraint compatible with all current `PriceControl` consumers.

## 2. Regression coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/components/ModelView/Pricing/tests/Pricing.spec.tsx` to prove a price can be entered as `0.0002` without losing the decimal draft, and that it reaches the existing pricing conversion boundary.
- [x] 2.2 Add focused coverage that an attempted negative price is not accepted by the shared price control.

## 3. Quality checks

- [ ] 3.1 Run the affected Vitest specs from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, and the relevant formatting check.

> Automated browser verification was offered and explicitly declined; component regression tests cover this focused input interaction.

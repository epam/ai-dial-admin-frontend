## Context

The shared `Pricing` component currently handles prompt and completion rates as flat strings through `PriceControl`, while cache rates use `PricingRateControl`, which supports DIAL Core's recursive flat-or-tree `PricingRate` wire format. The cache controls are further gated by an `isAsset` prop even though both model surfaces use the same component. Existing recursive scaling and formatting utilities already handle a `PricingRate`, and Core continues to prohibit cache rates under non-token units.

## Goals / Non-Goals

**Goals:**

- Provide one accessible conditional-rate editor for all four model pricing values on both model surfaces.
- Preserve the stored wire format, per-million display conversion for token pricing, explicit-zero semantics, and omitted branch behavior.
- Keep model-list representations readable when prompt or completion is a decision tree.

**Non-Goals:**

- Change DIAL Core pricing evaluation or API endpoints.
- Relax the token-only validation for cache rates.
- Add a new pricing-tree type, new unit, or new pricing surface.

## Decisions

### Use `PricingRate` for every stored model rate

`DialModelPricing.prompt` and `.completion` will use the existing `PricingRate` union, matching cache rates. This reuses Core's one wire representation and allows recursive conditional branches without adapters. A separate prompt/completion tree type was rejected because it would duplicate conversion and formatting behavior and could drift from Core's contract.

### Reuse the recursive editor and conversion boundary

All four controls will use `PricingRateControl`; their stored values will be converted through `getMultipliedRate` for display and `getRealRate` on change. This keeps scaling at the same model-boundary point and preserves empty branches as omitted values. Keeping flat `PriceControl` for prompt/completion was rejected because it prevents conditional editing and creates two divergent control paths.

### Switch the group layout when conditional editing is active

The pricing group will render its four flat-rate controls in one responsive row. When any rate is a conditional decision tree, the group will switch as a whole to a vertical layout. The layout is derived from the current pricing values rather than per-control local UI state, so an initially stored decision tree and a newly opened tree use the same layout.

### Remove the surface discriminator

`isAsset` will be removed from `Pricing` and its asset caller. Cache controls will always render; only their existing token-unit and read-only disabled state remains. Retaining an unused compatibility prop was rejected because it conceals the required render invariant.

### Format every conditional rate in model grid tooltips

The existing cache-specific tooltip helper will be generalized and applied to prompt and completion columns. Flat strings retain their current display, while tree values use `formatPricingRate` with token scaling. This prevents object serialization from becoming a user-visible grid value.

## Risks / Trade-offs

- **Widened TypeScript type exposes incompatible consumers** → Run both app and spec typechecks and update only consumers that assume a flat string.
- **Conditional rate leaves scale incorrectly** → Reuse the established recursive helpers and cover prompt/completion leaves in focused tests.
- **Visible cache controls could imply unsupported character-unit editing** → Preserve the cache controls' token-only disabled rule and its coverage.
- **Model grid renders a tree as an object** → Route prompt/completion tooltip values through the generalized formatter.

## Migration Plan

This is backward-compatible at the wire level: existing prompt and completion strings remain valid `PricingRate` values. Deploy as a normal frontend change; no data migration or backend rollout is required. If rollback is needed, restore flat editor rendering; persisted tree values remain Core-compatible but would not be editable in the old UI.

## Open Questions

None. The existing cache decision-tree contract establishes the rate shape and behavior for all controls.

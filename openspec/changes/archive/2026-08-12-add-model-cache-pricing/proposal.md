## Why

DIAL Core bills prompt-cache traffic at its own rates: `ModelCostCalculator` subtracts cached and
cache-write tokens from the prompt total and charges them at `pricing.cacheRead` / `pricing.cacheWrite`.
Both fields now exist end to end — in Core's `Pricing` config class and, as of
[admin-backend#1125](https://github.com/epam/ai-dial-admin-backend/pull/1125), through the admin BE's
DTO, domain, and persistence layers (Flyway `V1.119`, including `model_entity_aud`).

The admin console is the missing link: its pricing block still exposes only `prompt` and `completion`,
so an administrator cannot price cached tokens on either model surface. Until they can, every model
served through this console bills cache reads at the full prompt rate — Core's fallback when the
field is absent.

## What Changes

- **Two new price inputs, `Cache read price` and `Cache write price`**, added to
  `components/ModelView/Pricing/Pricing.tsx`. Because that component is already shared, the fields
  appear on **both** model surfaces from a single edit: `Entities > Models` (admin-BE-backed) and
  `Assets > Models` (Core-backed).
- **Cache rates are gated to the token unit.** Core's `ConfigPostProcessor.validatePricing()` raises a
  validation warning when either cache rate is set with `unit != "token"`, and in the merged-config
  rebuild a warned model is *removed from the config and recorded as invalid*. The two inputs are
  therefore disabled unless `Cost unit` is `Tokens`, and their values are cleared when the unit
  changes away from it.
- **An omitted cache rate is preserved as omitted, never coerced to `"0"`.** Core reads a missing rate
  as "bill cache tokens at the prompt rate" and `"0"` as "free" — materially different bills. This
  makes the existing `onChangePricingType` reset (which writes `{ prompt: '0', completion: '0' }`
  when the unit is cleared, and drops both prices when it is set) a correctness problem rather than
  a cosmetic one, so it is fixed as part of this change.
- **The pricing block is re-laid out** so four price inputs fit the form column. `Cost unit` moves to
  its own line above the prices, leaving one row of four 120px inputs (504px) inside the 640px
  `CONTROL_WIDTH` every other control on the page uses. Keeping the select inline would need 732px and
  silently shrink the inputs out of alignment. The sub-`lg` stacked variant is unchanged.
- **Two hidden model-grid columns** (`pricing.cacheRead`, `pricing.cacheWrite`) alongside the existing
  hidden prompt/completion price columns.
- **Two i18n labels** in `ModelViewI18nKey` for the new controls. No audit labels are needed:
  `convertPricing()` renders each pricing sub-field as a raw `key: value` pair, so the cache rates
  appear in diffs exactly as `prompt` and `completion` already do.

### Non-goals

- No backend work. Core and the admin BE already carry both fields; this change is frontend-only.
- No frontend cost calculation or analytics change. Cost is computed by Core and surfaced through
  the analytics pipeline; `analytics-deployment-price` is untouched.
- No new Activity Audit logic. `convertPricing()` iterates `Object.entries` over the pricing object
  and applies the ×1,000,000 token scaling per key, so the new fields render in diffs from the label
  additions alone.
- No change to how `char_without_whitespace` pricing behaves beyond disabling the new inputs under it.

## Capabilities

### New Capabilities

- `model-cache-pricing`: the cache-read/cache-write rate fields in the model pricing block — their
  presence on both the entity and asset model surfaces, the token-unit gating Core requires, the
  omitted-vs-zero persistence contract, and the reset behaviour when the cost unit changes.

### Modified Capabilities

None. `assets-models` already requires the Properties tab to expose "pricing" as a whole and that
requirement is unchanged; the new fields are covered by the capability above, which applies to both
surfaces.

## Impact

**Code**

| File | Change |
| --- | --- |
| `src/models/dial/model.ts` | `DialModelPricing` gains optional `cacheRead` / `cacheWrite` |
| `src/components/ModelView/Pricing/Pricing.tsx` | two inputs, two handlers, unit gating, reset fix, layout |
| `src/constants/i18n.ts`, `src/locales/en.ts` | two control labels under `ModelView.Pricing` |
| `src/constants/grid-columns/grid-columns.tsx` | two hidden columns on `MODELS_COLUMNS` |

`src/models/dial/resource.ts` needs no edit — `DialModelResource.pricing` already references
`DialModelPricing`. Both `ModelProperties.tsx` and `Assets/Models/Properties.tsx` pick up the new
fields through the shared component without modification.

**Backend paths** — the two surfaces do not share a backend, and both are ready:

```
Entities > Models ──► admin BE /api/v1/models ──► ModelDto.PricingDto   (PR #1125)
Assets   > Models ──► DIAL Core PUT /v1/models/platform/{name}          (Core Pricing)
```

Core-version compatibility needs no frontend gate: `VersionAwareFieldFilter` allowlists config fields
against the target version's schema at export time, so a deployment pinned below 0.47.0 has the cache
rates stripped on the way to Core.

**Release ordering** — the admin BE's request mapper runs with
`FAIL_ON_UNKNOWN_PROPERTIES = false`, so an admin backend older than #1125 accepts a cache rate with
`200 OK` and silently discards it: the user sees a success toast and an empty field after reload. This
frontend change must not reach an environment ahead of the backend carrying #1125. The frontend has no
way to detect the difference, so this is a deployment-sequencing constraint, not something to guard at
runtime.

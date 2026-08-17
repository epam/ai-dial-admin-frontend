## Context

See `proposal.md` — Why. Requirements are in `specs/model-cache-pricing/spec.md`.

The constraints that shape this design come from outside the frontend:

- `ModelCostCalculator` in DIAL Core reads an absent cache rate as "bill cached tokens at the prompt
  rate" and `"0"` as "bill them as free". The difference is a real invoice, so the frontend's
  representation of "empty" must survive the round trip untouched.
- `ConfigPostProcessor.validatePricing()` warns when a cache rate is set under a non-token unit, and a
  warned model is removed from the merged config. A UI that lets a user reach that state produces an
  invalid model with no local error.
- `components/ModelView/Pricing/Pricing.tsx` is already shared by `ModelProperties.tsx` (entity) and
  `Assets/Models/Properties.tsx` (asset). The two surfaces write to different backends — the admin BE
  and Core respectively — but neither passes surface-specific props to the pricing block today.
- Every other control on both properties pages is laid out at `CONTROL_WIDTH`
  (`large_tablet:640px desktop:640px large_desktop:40%`). The pricing block is the only control that
  opts out, sizing itself from its own content.

## Goals / Non-Goals

**Goals:**

- One implementation serving both model surfaces.
- Make the invalid states Core rejects unreachable from the UI rather than merely discouraged.
- Keep the four rate inputs at a readable width without breaking alignment with the rest of the form.

**Non-Goals:**

- Surfacing Core's `validationWarnings` for pricing in the UI. The asset surface already renders Core's
  invalid status and warnings generically; this change prevents the pricing warning from being
  produced, and does not add pricing-specific warning presentation.
- Detecting whether the connected admin backend supports the fields. See `proposal.md` — Impact for
  why this is a deployment-sequencing constraint instead.

## Decisions

### Extend the shared component rather than branch per surface

`Pricing.tsx` stays a single generic component (`<T extends { pricing?: DialModelPricing }>`), and
`DialModelPricing` gains the two optional fields. Both surfaces then pick up the change with no edit
of their own.

*Alternative considered:* a surface-specific variant for assets, on the theory that the Core-backed
path may diverge. Rejected — the two surfaces need identical pricing behavior because they feed the
same Core config, and a fork would drift on exactly the validation rule that must not drift. The
project's component rules already call a second implementation of the same field a review failure.

### Cost unit moves out of the rate row

The rates render as one row of four `PriceControl`s at 120px, with the cost-unit select on its own
line above them.

| Layout | Width at `lg` | Verdict |
| --- | --- | --- |
| Select inline with four rates | 220 + 4×120 + 4×8 = **732px** | Overflows the 640px column; flex shrinks the inputs out of alignment |
| Select inline, rates narrowed | 220 + 4×95 + 4×8 = 632px | Fits, but ~95px is too narrow for a `$` affordance plus a six-decimal value |
| **Select on its own line, four rates in a row** | **4×120 + 3×8 = 504px** | **Fits with headroom; nothing shrinks** |
| Select on its own line, rates 2×2 | 248px | Fits, but splits four comparable values across two rows |

The chosen layout also carries meaning the inline version doesn't: the unit governs all four rates, so
it reads better above them than beside them as a fifth sibling. The sub-`lg` stacked variant already
handles any number of fields and is unchanged.

### Disable the cache inputs under a non-token unit; don't hide them

Both cache fields are disabled whenever the unit is not Tokens, using the same `disabled` mechanism
the prompt and completion fields already use for the None unit and for read-only administrators.

*Alternative considered:* hiding them unless the unit is Tokens. Rejected — a hidden input holding a
stale value is how the invalid state gets saved without anyone seeing it, and a control that vanishes
gives a screen-reader user no signal that the option exists. A disabled control stays announced, and
disabled controls are exempt from the contrast minimum, so the existing disable styling applies
unchanged.

### Any cost-unit change clears all four rates

`onChangePricingType` resets every rate to unset on any unit change, and selecting None leaves the
model with neither a unit nor rates.

This both fixes an existing defect and prevents a new one. Today the None branch writes
`{ prompt: '0', completion: '0' }` — under Core's reading that is "prompt and completion are free",
not "unpriced". Extending that pattern to the cache fields would silently make cached tokens free on
every model whose unit was ever cleared. Clearing to *unset* is also what the existing Token/Char
branch already does for prompt and completion, so this makes one rule out of two behaviors rather than
inventing a third.

*Alternative considered:* preserving entered rates across a unit switch. Rejected — a rate's magnitude
is only meaningful under its unit (token rates are entered per million, character rates per
character), so a preserved number silently changes meaning by six orders of magnitude.

### Reuse the scaling helpers unchanged

`getMultipliedValue` / `getPriceRealValue` in `Pricing/utils.ts` already take `(value, isTokenType)`
and are field-agnostic, and `getPriceRealValue` already returns `undefined` for empty input and `'0'`
only for an explicit zero — exactly the omitted-vs-zero contract the spec requires. The two new
handlers call them the same way the prompt and completion handlers do. No new utility is needed, and
the existing util tests continue to cover the scaling.

### Grid columns follow the existing hidden-price pattern

Two `ColDef` entries appended to `MODELS_COLUMNS`, matching the `pricing.prompt` / `pricing.completion`
entries exactly — `hide: true` plus a `tooltipValueGetter`. These use literal `headerName` strings
because the surrounding price columns do; introducing translated headers for two columns in a list
where the neighbours are hardcoded would be a partial migration, not a fix.

## Risks / Trade-offs

**A user reaches an invalid model by a path that bypasses the pricing block** (raw JSON editor, config
import, an entity created before this change) → Not addressed here, and not made worse. Core still
validates on merge, and the asset surface already surfaces the resulting invalid status and warnings.
The UI guarantee is over what this control can produce, not over the whole config.

**Clearing rates on every unit change loses data the user typed** → Accepted, and already today's
behavior for prompt and completion. The alternative silently changes what a number means; losing a
value the user can see is empty is the safer failure.

**The cost unit moving to its own line adds vertical height to two long forms** → Accepted. It is one
row on pages that already scroll, and it buys alignment with every other control.

**A cache rate entered against an older admin backend is silently dropped** → Deployment sequencing,
covered in `proposal.md` — Impact. Not detectable from the frontend.

## Migration Plan

No data migration. The fields are additive and optional at every layer; a model with no cache rates
behaves exactly as it does today, which is also Core's documented fallback. The admin backend's Flyway
migration (`V1.119`) ships with the backend, not with this change.

Rollback is a plain revert: reverting the frontend leaves any already-saved `cacheRead` /
`cacheWrite` values intact in storage and in Core, no longer editable from the console but still
applied when billing.

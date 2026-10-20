## Context

`PriceControl` wraps `DialNumberInput` for model pricing. The input is controlled by model values that are parsed and scaled after every change. Numeric conversion removes the trailing separator and insignificant zeroes from an in-progress value such as `0.0002`, preventing precise rates from being typed. The wrapper also sets a zero minimum so price values cannot be negative.

## Goals / Non-Goals

**Goals:**

- Retain valid non-negative decimal draft values while the price field is being edited.
- Preserve the current callback contract, rate scaling, and distinction between an empty value and explicit zero.
- Keep the zero minimum that prevents negative prices.

**Non-Goals:**

- Change the pricing data model, API payloads, or rate-scaling rules.
- Alter the behavior of non-price number inputs.
- Support negative, exponent, or locale-specific decimal formats.

## Decisions

- Give the shared `PriceControl` a local string draft state that mirrors the external numeric value when it is not actively edited. This preserves intermediate input syntax (`0.`, `0.0`) that cannot be represented by the parent model.
- Validate draft changes as empty or non-negative decimal syntax before notifying the existing `onChange` callback. This maintains the current numeric callback behavior while refusing negative input.
- Keep `min={0}` on `DialNumberInput` as a native/UI-level constraint, with the draft validation providing the controlled-component guarantee.
- Add component-level regression coverage through the model pricing surface, which exercises the real shared control and existing scaling boundary.

**Alternatives considered:**

- Rely solely on `min={0}`: this does not stop the parent-controlled numeric normalization that drops the decimal draft.
- Store every rate as a string in the parent model: this broadens the change beyond the shared input and risks existing scaling/serialization behavior.
- Commit only on blur: this would change the current immediate-update behavior and leave other consumers with stale values while editing.

## Risks / Trade-offs

- [A parent value changes while the field has focus] → Keep the draft synchronized only when it is not being actively edited, so typing is never overwritten.
- [Validation differs from the ui-kit number input] → Cover accepted decimal precision, explicit zero, empty input, and rejected negative input with focused regression tests.
- [Browser-level behavior is not exercised in this change] → The user chose to omit the optional automated browser-verification task; component tests cover the interaction contract.

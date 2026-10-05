## Why

A long free-text JSONPath committed as the Field of a conditional cache rate can make its selected tag's clear control invisible. Administrators cannot remove the value through the UI, even though short field values remain removable.

## What Changes

- Keep the selected Field tag within the conditional-rate field control regardless of its length, with its clear control visible and usable.
- Preserve access to the complete Field value when its tag text is visually truncated.
- Add regression coverage for removing a long free-text JSONPath field value.

## Non-goals

- Restoring or changing conditional cache-rate editing on the Entities > Models surface.
- Changing the pricing decision-tree model, JSONPath acceptance, rate scaling, persistence, or backend contracts.
- Changing multi-value autocomplete behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `model-cache-pricing`: A committed conditional-rate test field remains removable and its clear control remains available when the selected free-text value is longer than the available control width.

## Impact

- `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx` — selected-tag layout and long-value presentation.
- `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/tests/SingleValueAutocomplete.spec.tsx` — long-value removal regression coverage.
- No API, model, dependency, or backend changes.

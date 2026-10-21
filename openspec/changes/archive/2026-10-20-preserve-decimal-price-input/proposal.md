## Why

Price inputs normalize their controlled value on every keystroke, discarding a trailing decimal separator and zeroes after it. Administrators therefore cannot author precise rates such as `0.0002`, even though stored pricing supports them.

## What Changes

- Preserve an in-progress non-negative decimal price string while its input is focused, including `0.`, `0.0`, and arbitrarily many zeroes after the separator.
- Continue to reject negative values for every use of the shared price control.
- Commit valid decimal values to the existing pricing callbacks without changing their storage scaling or empty-versus-zero semantics.
- Add regression coverage for precise decimal price entry.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `model-cache-pricing`: Price fields accept precise non-negative decimal rates without losing intermediate decimal input states.

## Impact

- `apps/ai-dial-admin/src/components/BaseControls/Price.tsx`
- Model pricing component tests that exercise the shared price field
- No API or dependency changes

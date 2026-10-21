## 1. Long selected-field handling

- [x] 1.1 Update `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/SingleValueAutocomplete.tsx` so a long selected `DialTag` stays constrained to its field control, keeps its clear control visible and keyboard-accessible, and exposes truncated text through `DialEllipsisTooltip`.

## 2. Regression coverage

- [x] 2.1 Extend `apps/ai-dial-admin/src/components/Common/SingleValueAutocomplete/tests/SingleValueAutocomplete.spec.tsx` with a long free-text JSONPath case that locates the clear control by its accessible role/name, removes the value, and verifies the change callback receives an empty string.

## 3. Quality checks

- [x] 3.1 Run the affected `SingleValueAutocomplete` Vitest spec from `apps/ai-dial-admin/`, then run `npm run lint`, `npm run typecheck`, `npm run typecheck:specs`, the relevant formatting check, and `npm run test`.

> Automated browser verification was offered and explicitly declined; the focused component regression test covers the selected-value interaction.

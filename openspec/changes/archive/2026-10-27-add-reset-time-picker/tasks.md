## 1. Reset-time control integration

- [x] 1.1 Replace the reset-time Input in `apps/ai-dial-admin/src/components/SystemProperties/RateLimitSchedule.tsx` with ui-kit Calendar in CalendarMode.Time, retaining the existing id, translated label/placeholder, disabled/invalid state, and enabling the visual picker without a viewer-timezone hint. Adapt CalendarValue callbacks to keep the schedule as an HH:mm string; retain existing defaults, full-object materialization, and validation.
- [x] 1.2 Add reset-time blur synchronization in `RateLimitSchedule.tsx` for cleared/incomplete visible drafts, avoiding no-op edits, and render the existing translated validation message accessibly. Ensure attempts to move to Save cannot persist a stale complete time; keep shared SaveValidationContext and vendor internals unchanged.

## 2. Automated regression tests

- [x] 2.1 Update `apps/ai-dial-admin/src/components/SystemProperties/tests/RateLimitSchedule.spec.tsx` with role/name-based tests using the real Calendar for visual selection and callback payloads, 00:00/23:59, one keyboard selection path, normalized complete typing, incomplete/cleared blur validation and correction, malformed stored segments, absent defaults/no-op opening or blur, first-edit materialization, and read-only input/clock behavior. Reuse centralized mocks in `apps/ai-dial-admin/test-setup.tsx`; put any required new infrastructure mock there.
- [x] 2.2 Add targeted cases in `apps/ai-dial-admin/src/components/SystemProperties/tests/SystemProperties.spec.tsx` for saving the chosen HH:mm with other settings preserved and the existing success notification, Discard restoring the stored time, and clicking Save with a cleared/partial focused time causing validation with no update call or success notification. Run the two targeted specs from `apps/ai-dial-admin/` with `npx vitest run`; resolve any blur-to-Save race rather than accepting stale persistence. Any added helper must have focused unit coverage.

## 3. Final quality gates

Automated browser verification was offered for these UI scenarios and explicitly declined by the user; no spec-browser-verify task is included.

- [x] 3.1 Run final lint, formatting, app and spec typechecks, and the full test suite (`npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, `npm run test`) from the workspace root; validate the change with `openspec validate add-reset-time-picker --strict`. Resolve change-related failures and report unrelated failures accurately. Preserve the existing unrelated edit in `apps/ai-dial-admin/src/locales/en.ts`; confirm the diff is limited to this change and no dependency/API/vendor modifications were introduced.

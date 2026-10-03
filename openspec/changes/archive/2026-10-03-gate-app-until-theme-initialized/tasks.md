## 1. Theme Initialization Gate

- [x] 1.1 Update `apps/ai-dial-admin/src/context/ThemeContext.tsx` so `ThemeProvider` tracks initial theme readiness and withholds its children until configured or fallback colors plus theme-dependent context state are initialized.
- [x] 1.2 Add guarded fallback initialization in `ThemeProvider` so storage or selected-theme failures attempt `fallbackDarkTheme`, readiness is always finalized, and later `setTheme` calls do not close the gate.

## 2. Automated Tests

- [x] 2.1 Add focused `ThemeProvider` component tests under `apps/ai-dial-admin/src/context/tests/` covering hidden-before-ready ordering, stored and configured-default themes, unavailable or unmatched themes, initialization failures, and post-initialization theme changes without child remounting.
- [x] 2.2 Extend `apps/ai-dial-admin/src/utils/themes/tests/apply-theme.spec.ts` where needed to assert the existing configured-theme and `fallbackDarkTheme` color behavior relied on by the initialization gate.

## 3. Quality Checks

- [x] 3.1 Run the focused theme tests from `apps/ai-dial-admin/`, then run formatting, lint, `npm run typecheck`, `npm run typecheck:specs`, and the full test suite; resolve regressions and record any unrelated known suite flakiness. Browser verification is intentionally omitted because the user selected automated tests only. The full coverage suite was user-stopped before completion.

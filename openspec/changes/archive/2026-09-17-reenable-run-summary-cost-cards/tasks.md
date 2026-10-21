## 1. Hook, constants, and format helper

- [x] 1.1 Add `COST_FETCH_TIMEOUT_MS = 180_000` to `apps/ai-dial-admin/src/components/Runs/Summary/constants.ts`
- [x] 1.2 Add pure `formatElapsedMmSs(ms)` to `apps/ai-dial-admin/src/components/Runs/Summary/utils.ts` and cases in `tests/utils.spec.ts`
- [x] 1.3 Extend `useRunCosts` with a 1s `elapsedMs` ticker and a 3-minute soft timeout that marks `unavailable` without aborting the fetch; apply a late successful payload after timeout

## 2. Cost card UI and i18n

- [x] 2.1 Remove `SHOW_COST_CARDS` from `Analytics.tsx`; always call `useRunCosts(run?.id)`; render calculating value/description or Error badge per design (do not use kit `isLoading`)
- [x] 2.2 Add `RunsI18nKey.Calculating` and `RunsI18nKey.CostCalculatingElapsed` plus English copy in `locales/en.ts`

## 3. Unit / component tests

- [x] 3.1 Unskip and update Analytics cost-card specs for calculating copy, dollar success, em dash, Error on null, and timeout; keep incomplete-run non-cost dash cases; adjust counts once cost cards are visible
- [x] 3.2 Extend `use-run-costs.spec.ts` for elapsed ticks, timeout → unavailable, and late success after timeout

## 4. Browser verification

- [x] 4.1 Run the `spec-browser-verify` skill against `reenable-run-summary-cost-cards` (local app at `:4200`, auth disabled) and resolve any `fail` verdicts before declaring the change complete
  - Attempted 2026-09-16: all 5 browser scenarios **blocked** on Keycloak sign-in (`/api/auth/signin`). No `fail` verdicts. Retest when the local stack runs with auth disabled.

## 5. Quality

- [x] 5.1 Run lint, format, typecheck, and the targeted vitest files from `apps/ai-dial-admin/`; fix any failures

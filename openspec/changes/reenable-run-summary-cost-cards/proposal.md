## Why

Cost cards (Test Case LLM Cost, Metric-Eval Cost) on Run Summary are temporarily hidden via
`SHOW_COST_CARDS = false` because a slow `getRunCosts` call left a bare spinner and felt like a
broken page ([#4574](https://github.com/epam/ai-dial-admin-frontend/issues/4574)). Re-enable them
with a calculating elapsed-time state so other Summary KPIs stay available while costs resolve.

## What Changes

- Remove the temporary `SHOW_COST_CARDS` gate and always fetch/render the two cost cards.
- Extend `useRunCosts` with a 1s elapsed ticker and a 3-minute client-side soft timeout (does not
  abort the server action; a late success still wins).
- Replace kit `isLoading` with a Figma calculating UI: spinner + **Calculating…**, description
  **`MM:SS elapsed · usually under 2 min`**.
- Show the red Error badge only after a real failure (`null` / throw) or the 3-minute timeout.
- Restore skipped Analytics cost-card tests and add calculating / timeout coverage.
- Add i18n keys for Calculating and the elapsed description.

## Non-goals

- Compare Summary cost cards (that strip has no cost KPIs).
- Backend changes to `getRunCosts` or dial-adas.
- Changing incomplete-run dash/error behavior for non-cost KPI cards (#4553).
- Documentation under `docs/` (issue remains `to-be-documented`).

## Capabilities

### New Capabilities

- `run-summary-cost-cards`: How Run Summary KPI cost cards fetch, show calculating elapsed-time
  state, succeed, fail, and soft-timeout independently of the rest of the Summary strip.

### Modified Capabilities

_(none)_

## Impact

- `apps/ai-dial-admin/src/components/Runs/Summary/Analytics.tsx` — drop gate; custom calculating UI.
- `apps/ai-dial-admin/src/components/Runs/Summary/use-run-costs.ts` — elapsed ticker + timeout.
- `apps/ai-dial-admin/src/components/Runs/Summary/constants.ts` / `utils.ts` — timeout constant +
  `formatElapsedMmSs`.
- `apps/ai-dial-admin/src/constants/i18n.ts` + `locales/en.ts` — Calculating / elapsed copy.
- Co-located unit and component tests; browser verification against the live Summary tab.

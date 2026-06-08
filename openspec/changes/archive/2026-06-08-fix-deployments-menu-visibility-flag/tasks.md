## 1. Fix the group-visibility filter

- [x] 1.1 In `apps/ai-dial-admin/src/components/Menu/menu-configuration.tsx`, change the feature-flag filter block at the end of `MENU_CONFIGURATION()` so each branch filters the accumulated `result` (not the original `config`): `result = result.filter(...)` in both the `!deploymentsEnabled` and `!evaluationEnabled` branches

## 2. Tests

- [x] 2.1 In `apps/ai-dial-admin/src/components/Menu/tests/menu-configuration.spec.ts`, add/extend coverage for the group-visibility filter across the flag matrix: both enabled (both groups present), Deployments off + Evaluation on (Deployments absent, Evaluation present), Deployments on + Evaluation off (Evaluation absent, Deployments present), and **both off** (both groups absent — the regression case from #3589)

## 3. Browser verification

- [x] 3.1 Run the `spec-browser-verify` skill scoped to the reported configuration — app booted with `DEPLOYMENTS_ENABLED=false` and `DIAL_EVAL_API_URL` unset — to confirm the Deployments group is absent from the sidebar. Resolve any `fail` verdicts before completing the change. (Full flag-matrix coverage lives in the unit tests in task 2.)

## 4. Quality checks

- [x] 4.1 Run `npm run lint`, `npm run format`, and `npx vitest run` (from `apps/ai-dial-admin/`) for the touched files; ensure all pass

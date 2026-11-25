# Tasks

## 1. Data layer

- [x] 1.1 Add `TotalCostsRequest` and `TotalCosts` to `apps/ai-dial-admin/src/models/evaluation/run.ts`,
  `TOTAL_COSTS_URL` and `RunsApi.getTotalCosts(fromMs, toMs, token)` to `server/eval/runs-api.ts` (design D1),
  and the `getEvalPeriodCosts(currentFromMs, currentToMs, previousFromMs, previousToMs)` server action in
  `app/[lang]/runs/actions.ts`, returning `{ current, previous }` with `null` for a window that failed
  (`== null`, so a 403's `undefined` is caught). Done when `server/eval/tests/runs-api.spec.ts` asserts the
  request is a `POST` to the costs URL with a `{ from, to }` body and no `deploymentIds`, and the parsed body
  is returned; and `app/[lang]/runs/actions.spec.ts` asserts the token is passed, both windows are requested,
  and a `null` or `undefined` result for one window yields `null` for that window only.

## 2. Shared delta helper

- [x] 2.1 Make `formatMonthCostDelta` in `components/EvalTrendsTab/deployment-month-cost.ts` compare the
  difference in whole cents and return `null` when it rounds to zero (design D3). Done when
  `components/EvalTrendsTab/tests/deployment-month-cost.spec.ts` covers a sub-cent difference (`0.003`
  returning `null`), a half-cent rounding case, and that the existing positive, negative, equal and missing
  cases are unchanged.

## 3. Card model and loading

- [x] 3.1 Add the `EvalCostCardModel` type to `components/EvalSystemHealth/models.ts` and the pure
  `utils/build-eval-cost-card.ts` of design D2: loading and error pass-through, a ready source with a `null`
  window becomes error, the three figures read with `?? null`, and `deltaLabel` from `formatMonthCostDelta`.
  Done when its spec covers loading, error, a ready source, either window `null`, fields omitted by the
  backend, a `0` judge cost kept as `0`, an all-absent current window, an absent previous window (no label),
  a rise, a fall and a sub-cent change.
- [x] 3.2 Add `use-eval-cost-data.ts` of design D4: `useEvalCostData(windows)` loads through
  `getEvalPeriodCosts` with the windows' four bounds, resets to loading and reloads when `windows` changes,
  drops a superseded response, treats a thrown action as error, and returns the card from the builder. Done
  when a hook spec covers loading, a ready card, the arguments passed, a reload on new windows with the stale
  response dropped, a throw, and no reload for an unchanged `windows` object.

## 4. Card UI

- [x] 4.1 Add the i18n entries of design D6 (`EvalSystemHealthI18nKey` in `constants/i18n.ts`, strings in
  `locales/en.ts`). Done when `npm run typecheck` is clean and no key is unused.
- [x] 4.2 Build `EvalCostCard` (design D5) and render it in `ActivityCardRow` after the count cards, fed by
  `useEvalCostData(windows)` with the windows from `useActivityData`. Confirm the kit `Spinner` and
  `Notification` props through the `ai-dial-ui-kit` MCP server first. Done when component specs query by role
  and accessible name and cover: the title, a formatted total, the split line, the split hidden and an em dash
  shown when there is no cost, an em dash for one missing part, the badge's red colouring on a rise and green
  on a fall, no badge on a missing or sub-cent delta, the sr-only periods text, the loading indicator, and the
  error alert; and `ActivityCardRow.spec.tsx` asserts three cards in order, that the cost card gets the same
  windows as the count cards, and that one card failing leaves the others showing their figures.

## 5. Docs and spec

- [x] 5.1 Add the Eval cost card to the System Health entry in `docs/MENU-DOCUMENTATION.md`, and update the
  `## Purpose` of `openspec/specs/eval-system-health/spec.md` (a delta cannot change it) to say the page now
  holds three activity cards. Done when the doc entry names the card, its split and its cost-direction badge,
  and the Purpose matches the page.

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` at zero,
  then the full `npm run test`; run `openspec validate add-eval-system-health-cost-card --strict`. Done when
  all of them pass.

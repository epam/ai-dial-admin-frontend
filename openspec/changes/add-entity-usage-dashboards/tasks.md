Two PRs, in order, each off `development` after the previous one merges: PR 1 is groups 1–4 (the
split, scopes, models and toolsets), PR 2 is groups 5–7 (applications). Each ends with its own
verification and quality gate.

## 1. Block and shells (PR 1)

- [x] 1.1 Extract `UsageBlock` from `components/Analytics/Usage/UsageDashboard.tsx`: it owns the
      per-view state, `useUsageDashboardData`, `useHeatmapWeek` and the widgets, and takes `view`,
      `scope`, `windows`, `resolution`, `refreshToken`, `notice` and its tab list (design D1); the
      page renders one block with its current view and an empty scope.
- [x] 1.2 Make the leading tab a block input instead of `VIEW_BREAKDOWN_TABS[view][0]` in
      `use-usage-dashboard-data.ts`, `UsageBlock` and the donut/split wiring (design D3).
- [x] 1.3 Make `view` / `onViewChange` optional on `Controls/UsageControls.tsx`; without them no
      `View by` renders (design D5).

## 2. Scopes (PR 1)

- [x] 2.1 Replace `QueryScope.entityFilter` / `projectFilter` with resolved `entityClauses`, and
      thread a `UsageScope` (`own`, `made?`) (design D2) through `use-usage-dashboard-data.ts`, `use-breakdown-dialog-rows.ts` and
      `use-heatmap-week.ts`.
- [x] 2.2 Add `utils/entity-scope.ts` building a `UsageScope` from the route and entity: models and
      toolsets by name, asset toolsets and asset applications by `<kind>/` + `encodeCorePath` of the
      path, applications with `own` and `made` (design D2).

## 3. Entity dashboard for models and toolsets (PR 1)

- [x] 3.1 Add `ENTITY_BLOCKS` to `constants.ts` (design D3) with the Models, PlatformModels, Toolsets
      and AssetsToolsets entries, and the `EntityBlock` type to `models.ts`.
- [x] 3.2 Add `EntityUsageDashboard.tsx`: controls without `View by`, the window snapshot seeded from
      and written back to the Audit period, and one headed `UsageBlock` per entity block.
- [x] 3.3 Add a server action wrapping the analytics access check and render `Page403` in the tab on a
      refusal (design D6).
- [x] 3.4 In `components/EntityTabs/Audit/EntityAudit.tsx`, render `EntityUsageDashboard` for the
      `Dashboard` tab when `analyticsEnabled && analyticsUsageEnabled`, the telemetry `Dashboard`
      otherwise.
- [x] 3.5 Head each block with its view's label (`VIEW_LABEL_KEY` in `utils/labels.ts`, reusing the
      existing `View by` keys — no new i18n keys).

## 4. PR 1 tests, verification, gate

- [x] 4.1 Tests: `UsageBlock` (renders one view's widgets from a scope), `UsageDashboard` still issues
      exactly its eight reads, `UsageControls` without `View by`, `utils/entity-scope.ts` (each route,
      a path with a space), the `own` clause on every builder, `EntityUsageDashboard` (one block, no
      `View by`, hidden tab, period written back), `EntityAudit` (flag on/off, 403 state).
- [x] 4.2 Run the `spec-browser-verify` skill for the model and toolset scenarios of this change on
      the local stack with the analytics flags on; resolve every `fail` before continuing.
- [x] 4.3 From the repo root run `npm run lint`, `npm run format`, `npm run typecheck`,
      `npm run typecheck:specs` and `npm run test`; all must pass.

## 5. Applications (PR 2)

- [ ] 5.1 Add the Applications and AssetsApplications entries to `ENTITY_BLOCKS` (LLM, MCP, Routes
      when `entity.routes` is non-empty), with the `made` readers of design D3.
- [ ] 5.2 Add `spendColumn` to `commonMeasures` and sum `total_price` on an application's `own` totals
      (design D4).
- [ ] 5.3 Issue the `made` totals request on a block that has `made` readers; feed tokens, cost per 1M
      and the `Models` tab's and donut's share denominator from it (design D4).
- [ ] 5.4 Add the optional caption to the `Tokens` card and pass "direct model calls" on the
      application LLM block, with its i18n key.

## 6. Asset applications tab (PR 2)

- [ ] 6.1 Offer `Dashboard` for `ApplicationRoute.AssetsApplications` in `getAuditTabs`
      (`utils/tabs/utils.ts`) only when both analytics flags are on (design D6).

## 7. PR 2 tests, verification, gate

- [ ] 7.1 Tests: application scope (`own` vs `made` per figure and tab), `total_price` summed on own
      rows, the `made` totals request issued only where needed, shares under one hundred per cent on
      the `Models` tab, the Routes block skipped without routes, the `Tokens` caption, `getAuditTabs`
      for Assets applications with the flags on and off.
- [ ] 7.2 Run the `spec-browser-verify` skill for the application scenarios on the local stack with
      the analytics flags on; resolve every `fail` before continuing.
- [ ] 7.3 From the repo root run `npm run lint`, `npm run format`, `npm run typecheck`,
      `npm run typecheck:specs` and `npm run test`; all must pass.

# Tasks

## 1. Route listing data layer

- [x] 1.1 Add `AssetApi.listStrict(token, type, path)` to `apps/ai-dial-admin/src/server/core/asset-api.ts`
      (design D1): the same `getMetadata` paging and `toResourceInfoList` row mapping as `list`, returning `null` as
      soon as any page's node is `null`. Add the `listPlatformRoutes()` server action beside `getRoutes` in
      `app/[lang]/test-suites/actions.ts`, authenticating like it and calling
      `listStrict(token, ResourceType.ROUTE, 'platform/')`. Leave `list` and `getRoutes` untouched. Done when
      `npm run typecheck` is clean and the specs of task 6.1 pass.

## 2. Card model, constants and i18n

- [x] 2.1 In `components/EvalSystemHealth/models.ts` add `CoverageKind.Routes`, `routes: CoverageSource<string[]>`
      to `CoverageSources`, and replace the `CoveredIds` set with an interface holding a `deployments` set and a
      `routes` set (design D2). In `constants.ts` add `Routes` last in `COVERAGE_KIND_ORDER`, its
      `COVERAGE_KIND_TITLE_KEY` entry, and `COVERAGE_KIND_SOURCES` — the sources each kind depends on (design D4).
      Add `EvalSystemHealthI18nKey.TotalRoutes` in `constants/i18n.ts` and `TotalRoutes: 'Total routes'` in
      `locales/en.ts`. Done when `npm run typecheck` shows only the call sites that tasks 3.1–3.3 then fix, and
      `npm run lint` reports no unused key.

## 3. Query, parser, builder and hook

- [x] 3.1 Add `ROUTES_REF_NAME_FIELD` to the select and the `groupBy` of `buildCoverageQuery`
      (`utils/build-coverage-query.ts`), and make `parseCoverageRows` (`utils/parse-coverage-rows.ts`) return the
      two sets: deployment ids from the two deployment refs as before, route names from `routes_ref::name` through
      `fromCanonicalRouteName` (design D2, D3). Done when the specs of task 6.2 pass.
- [x] 3.2 Make `buildCoverageCards` (`utils/build-coverage-cards.ts`) derive each card's status from
      `COVERAGE_KIND_SOURCES` — error wins over loading, per card — and count each kind from only its own sources:
      routes by comparing the listed names with the covered route set, evaluatees as the sum of all four kinds
      (design D4). Done when the specs of task 6.3 pass.
- [x] 3.3 In `use-coverage-data.ts` add `loadRouteNames()` (design D1): it calls `listPlatformRoutes()`, keeps
      rows whose `nodeType` is `DialFileNodeType.ITEM` or absent, never rejects, and treats a thrown call or an
      `== null` result as failed. Add `routes` to `LOADING` and run it in the same `Promise.all` and effect as the
      other two sources, so the day-rollover reload covers it. Done when the specs of task 6.4 pass.

## 4. Activity caption

- [x] 4.1 Add `ROUTES_REF_NAME_FIELD` to the select of `suitesAddedQuery` in `utils/build-activity-queries.ts`,
      and make `countTargetedEvaluatees` in `utils/parse-activity-results.ts` count distinct route names, through
      `fromCanonicalRouteName`, in a set apart from the deployment ids and return the sum of the two (design D7).
      Done when the specs of task 6.6 pass and `npm run typecheck` is clean.

- [x] 4.2 Rework the page layout (design D5). `SystemHealth.tsx` calls `useCoverageData` once and passes the
      cards on: `ActivityCardRow` draws its `children` (the Total Evaluatees card) before the three activity
      cards on `md:2 lg:3 xl:4` columns; `CoverageCardRow` takes a `cards` prop and draws the Models,
      Applications, Toolsets and Routes cards two wide on `xl` (`md:2 lg:3` below) with `auto-rows-fr`; that
      block and `HealthDistributionSection` share one `xl:grid-cols-2` row with equal-height cells (the section
      uses the filling `SummarySection`; the chart is 160 px high); and `RunTrendsSection` is alone below at
      full width. Done when the specs of task 6.7 pass and `npm run typecheck` is clean.

## 5. Docs and spec

- [x] 5.1 Update the `## Purpose` of `openspec/specs/eval-system-health/spec.md` (a delta cannot change it) to
      name routes beside models, applications and toolsets, and add the Total routes card, routes in Total
      Evaluatees and in the Test suites added caption, and the per-card error behaviour to the System Health entry
      of `docs/MENU-DOCUMENTATION.md`. Done
      when the Purpose and the doc entry match the page and `openspec validate --strict` still passes.

## 6. Unit and component tests

- [x] 6.1 `server/core/tests/asset-api.spec.ts` — cases for `AssetApi.listStrict`: a multi-page listing returns
      every row in order, a `null` first page returns `null`, a `null` later page returns `null` rather than the
      rows so far, and an empty node returns `[]`; `list` still returns `[]` for a `null` node. In
      `app/[lang]/test-suites/actions.spec.ts` assert `listPlatformRoutes` passes the token, the route type and the
      `platform/` path, and returns the listing and `null` unchanged. Follow `.claude/rules/testing.md`.
- [x] 6.2 `utils/tests/build-coverage-query.spec.ts` — the route ref is selected and grouped; the filter,
      limit and existing columns are unchanged. `utils/tests/parse-coverage-rows.spec.ts` — a deployment ref, an MCP
      ref and a route ref each land in their own set; a prefixed route name is stored without the prefix and an
      already plain one is unchanged; empty and non-string values are dropped; a null result gives two empty sets;
      a route name equal to a deployment id covers neither.
- [x] 6.3 `utils/tests/build-coverage-cards.spec.ts` — five cards in order; routes counted against the route
      set and a deployment id never covering a route; evaluatees summing four kinds (including routes alone);
      zero routes giving a null rate; and the status matrix of the spec: routes loading while the three
      deployment cards are ready, a route failure erroring only Routes and Evaluatees, a deployment failure
      erroring all but Routes, a coverage failure erroring all five, and error winning over loading.
- [x] 6.4 `tests/use-coverage-data.spec.ts` — the route listing is requested once with the other two sources;
      items are kept and folders dropped; a thrown, `null` and `undefined` result each become a route failure that
      leaves the three deployment cards ready; sources are applied as they settle; and a day rollover reloads all
      three while an unchanged day does not.
- [x] 6.5 `tests/CoverageCardRow.spec.tsx` — five cards in order with the Total routes title and its caption;
      a route failure shows the alert on exactly Total routes and Total evaluatees. `tests/SystemHealth.spec.tsx`
      and `tests/ActivityCardRow.spec.tsx` — updated if they count cards. Query by role and accessible name only.
- [x] 6.6 `utils/tests/build-activity-queries.spec.ts` — the suites-added query also selects the route name; the
      other four queries are unchanged. `utils/tests/parse-activity-results.spec.ts` — a route-targeted row adds one
      evaluatee; rows on the same route count it once; routes and deployments add up (2 models, 1 toolset and 3
      routes give 6); a prefixed and a plain name of one route count once; a row with no route name adds none; a
      route name equal to a deployment id still counts as a second evaluatee.

- [x] 6.7 `tests/SystemHealth.spec.tsx` — the hook is called once; the Total Evaluatees card leads the key
      figures and is not repeated beside the chart; Models, Applications, Toolsets and Routes sit beside the
      chart in that order, the cards first; the key figures come first and the run trends last. The route-listing
      failure puts the alert on exactly Routes and Evaluatees. `tests/CoverageCardRow.spec.tsx` — draws the cards
      it is given and does not call the hook. `tests/ActivityCardRow.spec.tsx` — its `children` precede the three
      activity cards in order, the cost card gets the same windows, and one failing card leaves the others
      showing their figures. Query by role and accessible name only.

## 7. Browser verification

- [x] 7.1 (verified by driving the signed-in browser directly, not through the skill) Run the `spec-browser-verify` skill against this change's browser-observable scenarios (the three blocks
      of the layout in order, four key figures in the first row, the four coverage cards in a two-by-two block
      beside the chart, three, two and one to a line as the screen narrows, the Total routes figures, folders not
      counted, routes in Total evaluatees and in the Test suites added caption, and the per-card loading and error
      states) on the local stack with auth disabled, and resolve every `fail` verdict. Done when the gate reports
      no `fail`.
- [ ] 7.2 With the same stack, note what Core answers for a platform route bucket with no routes (design
      Risks) — the one backend behaviour not yet checked, since the local instance has routes. Done when the answer
      is recorded in the PR description, and if it is an error status `listStrict` tells it apart from a failure
      before the change is complete.

## 8. Quality checks

- [ ] 8.1 Run `npm run lint`, `npm run format`, `npm run typecheck` and `npm run typecheck:specs` at zero, then
      the full `npm run test`; run `openspec validate add-eval-system-health-routes-card --strict`. Done when all
      of them pass.

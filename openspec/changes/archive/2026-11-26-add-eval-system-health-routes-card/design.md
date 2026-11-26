## Context

See `proposal.md` for motivation and scope, and the `eval-system-health` spec delta for the requirements. What
shapes the approach:

- **Two sources, one status.** `useCoverageData` loads the deployment listing (`getDeployments()`) and the
  coverage query (`executeStructuredQuery(buildCoverageQuery(windowStartMs))`) in parallel, applies each as it
  settles, and `buildCoverageCards` derives **one** status for all four cards (`statusOf`: error wins over
  loading). That single status is what the spec's "four cards share one state" describes, and what this change
  replaces.
- **Routes are not deployments.** The deployment listing's `$type` is `dial-model`, `dial-application` or
  `dial-toolset`; `groupDeploymentIds` drops anything else. Routes are a Core resource: `getRoutes()` is
  `assetApi.list(token, ResourceType.ROUTE, 'platform/')`, the call behind the Routes tab of the Create Test
  Suite dialog, and returns `ResourceInfo[]` whose `name` is the plain route name and whose `nodeType` is
  `item` or `folder`. The other route listing in the app, `routesApi.getRoutesList`, reads the admin backend's
  `/routes` — a different set from the platform routes a suite can target — so it is not a candidate.
- **`assetApi.list` cannot report a failure.** `getMetadata` returns `null` for a failed request, and
  `fetchAllPages` + `toResourceInfoList` turn a `null` node into no rows. A failed first page therefore reads as
  "no routes", and a failed later page as a shorter list. That is harmless for a picker, which shows an empty
  state; for a count it would show a wrong total with no error, which the spec forbids.
- **A suite's route reference has only a name.** `RoutesRef` is `{ name }`, written by the dialog as
  `toCanonicalRouteName(name)` (`routes/platform/<name>`). The run entity exposes it as `routes_ref::name`,
  which `runs-query.ts` already selects and filters on; there is no `routes_ref::id`.
- **The coverage query already groups by every ref that can carry an evaluatee**
  (`deployment_ref::id`, `mcp_deployment_ref::id`), with a 10,000-row cap and a subquery that drops runs of
  deleted suites. A third group column keeps the same shape.
- **Server actions run one after another** on the client's behalf (see the archived
  `add-eval-system-health-coverage` design, D4). The page already queues the deployment listing, coverage,
  the activity batch, run trends and the distribution; each consumer owns its state, so a card shows its
  spinner until its turn and no card waits on another's result beyond its own sources.

## Goals / Non-Goals

**Goals:**

- A card's status follows only the sources it needs, declared in one place and derived by one function, so a
  fourth source later is a table entry and not a new branch.
- Routes ride the existing coverage query: the change adds no query and exactly one request (the listing).
- The route name comparison lives in one pure, tested function.

**Non-Goals:**

- A generic "evaluatee source" abstraction. Two shapes of source (a deployment listing and a route listing) do
  not justify one.
- Paging or capping the route listing beyond the page-following the listing already does.
- Changing `CoverageCard`: it renders a model, it does not know about kinds beyond the Evaluatees tooltip.

## Decisions

### D1. The route listing is a third source, read through a failure-aware listing

`CoverageSources` gains `routes: CoverageSource<string[]>`.

**A strict listing.** `AssetApi` gains `listStrict(token, type, path): Promise<ResourceInfo[] | null>` beside
`list`. It walks the same pages with the same `getMetadata` call and the same row mapping, but returns `null`
as soon as any page's node is `null`, instead of treating it as empty. `list` and every one of its callers are
untouched. A server action `listPlatformRoutes()` in `app/[lang]/test-suites/actions.ts`, beside `getRoutes`,
authenticates and calls `listStrict(token, ResourceType.ROUTE, 'platform/')`.

**The loader.** `use-coverage-data.ts` gains `loadRouteNames()` beside `loadDeploymentIds()` and
`loadCoveredIds()`, with the same contract: it never rejects, a thrown call or a `null` result is `FAILED`
(`== null`, so a 403's `undefined` is caught too), and otherwise it returns `ready(names)`. Names come from the
rows whose `nodeType` is `DialFileNodeType.ITEM`; a row with no `nodeType` is treated as an item, as the
dialog (which does not filter) does today. A route listed twice counts once — the card builder de-duplicates
by set.

`LOADING` gains `routes`, and the effect runs `apply('routes', loadRouteNames())` in the same `Promise.all`. The
day-rollover reload re-reads the route listing with the other two, so the three sources always describe the
same moment.

_Alternatives:_ reusing `getRoutes()` as is — rejected, see Context: a failed read would show as zero routes.
Changing `list` to return `null` on failure — rejected, a dozen list views rely on it returning `[]`, and each
would need its own error state. Filtering folders inside `getRoutes()` — rejected, the Create Test Suite dialog
relies on its current return. Loading routes lazily when the card scrolls into view — rejected, Total
Evaluatees needs the route total on first paint.

### D2. The coverage query also selects and groups by `routes_ref::name`; the parser returns two sets

`buildCoverageQuery` adds `col(field(ROUTES_REF_NAME_FIELD))` to `select` and `ROUTES_REF_NAME_FIELD` to
`groupBy` (the constant already exists in `ListView/Evaluation/utils/constants.ts`). Rows stay one per distinct
combination of refs, and a run carries exactly one ref, so the 10,000-row cap is unaffected in practice.

`CoveredIds` stops being a bare `Set<string>`: it becomes an interface
`{ deployments: Set<string>; routes: Set<string> }`. `parseCoverageRows` fills `deployments` from the two
deployment refs as before and `routes` from the route ref, each non-empty string normalised.

Keeping two sets, rather than adding route names to the one set, is the point: a route reference SHALL cover
only a route and a deployment reference only a deployment (spec: Coverage definition). One set would let a
deployment whose id happened to equal a route's canonical name look covered, and the opposite; the two
namespaces are unrelated and the sets say so.

_Alternatives:_ a second structured query for routes — rejected, it is a second request that re-reads the
runs, an extra row-cap to maintain, and a coverage window computed twice. Reading `routes_ref` from the
existing per-suite activity queries — rejected, they count suites, not evaluatees.

### D3. Route names are compared in their listing form, through one pure helper

The listing's names are plain; the suite's reference carries the prefix. `parseCoverageRows` stores the route
ref as `fromCanonicalRouteName(name)` (already exported by `utils/evaluation/route-reference.ts`), and the card
builder compares those against the listing's names verbatim. A name already without the prefix (a suite written
by an older client, if one exists) passes through `fromCanonicalRouteName` unchanged, so both forms match. The
helper does not call `normalizeDeploymentId`: that decodes URI segments for deployment ids as Core stores
them, and a route name is never stored encoded in a suite reference — the dialog writes `route.name` as the
listing returns it.

_Alternative:_ canonicalising the listing instead (`toCanonicalRouteName`) — equivalent, but the listing's form
is the one a reader of the card model and its tests expects to see.

### D4. Status is derived per card from a declared dependency table

`constants.ts` gains `COVERAGE_KIND_SOURCES: Record<CoverageKind, (keyof CoverageSources)[]>`:

| Kind | Sources |
|---|---|
| Models, Applications, Toolsets | `deployments`, `covered` |
| Routes | `routes`, `covered` |
| Evaluatees | `deployments`, `routes`, `covered` |

`buildCoverageCards` replaces the shared `statusOf(sources)` with `statusOf(sources, kind)` over that table,
keeping its rule (error wins over loading, so a card that already knows it cannot be drawn does not keep
spinning). Counts are computed per kind from only the sources it lists, and a kind whose status is not ready
gets the not-ready count, as today. The Evaluatees counts sum models, applications, toolsets and routes.

This is what produces the spec's per-card behaviour: a route-listing failure errors Total Routes and Total
Evaluatees and leaves the three deployment cards showing figures; a coverage failure errors all five.

_Alternatives:_ keep one shared status and add routes to it — rejected, the proposal's decision is that one
slow or failed listing should not blank cards that never needed it, and the cost card already sets that
precedent. Show Total Evaluatees from the kinds that did load — rejected, a total that silently omits routes
is the understatement this change exists to remove; an error is honest.

### D5. Page layout: key figures, coverage cards beside the chart, then the table

`SystemHealth` becomes three stacked blocks:

1. `ActivityCardRow` — the key figures: the Total Evaluatees card, then the three activity cards, on
   `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
2. A row `grid grid-cols-1 gap-4 xl:grid-cols-2`, its two cells stretched to one height: on the left
   `CoverageCardRow` — the Models, Applications, Toolsets and Routes cards on
   `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2` with `auto-rows-fr` — and on the right
   `HealthDistributionSection`.
3. `RunTrendsSection`, full width.

The column counts are the requested steps: four to a line on a wide screen (`xl`), then three (`lg`), two
(`md`) and one. Below `xl` the row of block and chart is one column, so the chart takes the full width below
the cards.

**Data plumbing.** The Total Evaluatees card comes from `useCoverageData`, the same hook that feeds the block,
and calling it in two components would send every request twice. So `SystemHealth` calls it once and passes
the cards down: `CoverageCardRow` takes `cards` and draws what it is given, and `ActivityCardRow` takes the
Total Evaluatees `CoverageCard` as `children`, drawn before its own three. `SystemHealth` splits by kind
(`CoverageKind.Evaluatees` to the row, the rest to the block).

**Heights.** The cards stretch, the chart does not: the chart keeps its fixed height (so the row does not move
as it loads), the row takes the chart section's height, and `auto-rows-fr` shares it equally between the
block's two lines. `HealthDistributionSection` uses the filling `SummarySection` so its panel fills the cell,
and the card frames, being direct grid items, stretch on their own. The key figures row takes the height of
its tallest card (the Eval cost card, whose split line wraps) on every card.

_Alternatives:_ calling `useCoverageData` in both components and sharing through a module cache — rejected,
hidden state for a one-line prop. A React context for the coverage cards — rejected, one provider and one
consumer pair for a value `SystemHealth` can hand over directly. Making the chart as short as the cards —
rejected, the chart needs its height to be legible; the cards can grow.

### D6. i18n and the card itself

`EvalSystemHealthI18nKey.TotalRoutes` and `en.ts` `TotalRoutes: 'Total routes'`;
`CoverageKind.Routes = 'routes'` last in `COVERAGE_KIND_ORDER`, with its `COVERAGE_KIND_TITLE_KEY` entry.
`CoverageCard` needs no change: the title, percentage, bar, caption and error/loading states are driven by
the model, and the info tooltip stays on Evaluatees only. `CoverageCardRow` iterates the model, so the fifth
card appears when the builder returns it.

### D7. The Test suites added caption counts routes

`suitesAddedQuery` in `utils/build-activity-queries.ts` also selects `ROUTES_REF_NAME_FIELD`.
`countTargetedEvaluatees` in `utils/parse-activity-results.ts` keeps its set of deployment ids and adds a
second set of route names (each through `fromCanonicalRouteName`), and returns the sum of the two sizes. As in
D2 the namespaces are kept apart rather than mixed in one set. A row that carries no route name adds nothing
to the second set, as a row with no deployment adds nothing to the first.

The count is of routes the new suites _target_, as the deployment count is of deployments they target: it is
not checked against the route listing, so a route deleted since the suite was created still counts, as a
deleted deployment does today.

_Alternative:_ leaving the caption as a deployments-only count — rejected, the card would then call a number
"evaluatees" that disagrees with Total Evaluatees on the same page.

## Risks / Trade-offs

- **An empty platform route bucket may answer with an error, not an empty node** → `listStrict` would then
  report a deployment with no routes as a failed listing, and Total Routes and Total Evaluatees would show the
  error. Core's answer for a bucket with no routes is not visible from code; the verification task checks it
  against the live stack, and if it is an error status the strict listing must tell it apart from a failure.
- **Cards stretched to the chart's height** → at the chart's earlier heights (320 and then 240 px) the cards,
  stretched to match, were about twice as tall as their content and read as empty. The chart is now 160 px,
  which makes the block roughly its natural height (the cards at about 160 px each at 1440 px wide); the bars
  and week labels stay legible at that height. If a taller chart is wanted later, the cards will stretch again.
- **Route names with special characters** → the listing decodes names and the dialog writes that decoded name,
  so the two should match; confirm with a route whose name contains a space or `%`.
- **One more queued server action** → the route listing is the last piece of a long queue; it only delays the
  Routes and Evaluatees cards, and only they show a spinner for it.

## Verified against the local backend

Replaying the page's own coverage query with `routes_ref::name` added to `select` and `groupBy` returned 200
with the same 33 rows as before. The group that carries neither deployment ref — which the current parser
silently ignores — is the route group, and now shows its name: `routes/platform/als-asset-route`. Selecting
`routes_ref::name` on `test_suites` rows returned 200 with 354 rows (`totalCount` 354), four of them
route-targeted (`jev-openrouter` twice, `als-asset-route` twice), so suites on the same route are the case D7's
set de-duplicates. Both forms carry the `routes/platform/` prefix, as D3 assumes, and the platform routes grid
lists plain names.

## Migration Plan

None: no persisted data, no env variable, no backend change. Reverting is deleting the change.

## Why

The Dashboards page answers "which models and which MCP servers, how often" but not "which routes,
how often" — the one question the telemetry dashboard's Route view answered and this page does not.
`redesign-system-dashboard` left it out on two grounds, and both are refuted:

- **"The usage log has no `route_path`."** True of the column, not of the data. A deployment route's
  path is the part of `request_uri` after `/route/`, and the DSL's string functions extract it.
- **"Routes live in `routes_analytics`, pre-templated."** The table was written by
  `ai-dial-analytics-realtime`, which cut the path out of the raw URI with
  `^/v1/deployments/(.+?)/route/(.+?)$` and templated nothing. Every field the old Route view read —
  deployment, path, method, parent deployment, project, user — has a source column in the usage log.

The same writer dropped every call to a global Core route (one configured under `Entities > Routes`
or `Assets > Routes`) as an unsupported message, so the old view never showed them. The usage log
keeps them, and today the LLM view counts them: their event kind is empty, which the LLM view reads
as an LLM call, so router and proxy traffic is folded into the LLM figures as a nameless row.

## What Changes

- Add a third `View by` option, **Routes**, beside LLM and MCP on the analytics Dashboards page.
- The Routes view reads two kinds of row:
  - **application routes** — calls to a route a deployment declares
    (`/v1/deployments/<deployment>/route/<path>`), owned by that deployment;
  - **global routes** — calls Core resolved against its global routes map. The log records no route
    name and no deployment for them, so their owner is the first segment of the request path.
- The view renders the page's existing widgets with what route rows carry: KPI cards for calls,
  unique callers, error rate and average latency; the time series (calls, calls by owner, latency);
  the share donut by owner; the heatmap on calls; and a breakdown table with `Owners`, `Paths`,
  `Callers` and `Projects` tabs, each row stating which kind of route it is.
- The view offers no spend, no tokens and no cost switch: route rows carry no price.
- **The LLM view stops counting global route calls.** Its request count, error rate and latency
  change by those rows; its spend and tokens do not, since route rows carry neither.
- The archived `redesign-system-dashboard` design gains a one-line pointer at its Routes non-goal,
  naming this change as the one that supersedes it.

## Non-goals

- **Templating ids out of paths.** A path that carries an id ranks as one row per id, as it did in
  the old view. Grouping `/schedules/<id>/pause` into one row is a separate change.
- **Naming a global route.** Resolving a path to the route whose `paths` pattern matched it needs
  every route's configuration on the page; the owner stays the path's first segment.
- **What a route called downstream.** A route shares its owner's name, so a model call it made is
  indistinguishable from a chat call of the same application. The old view did not show it either.
- **Embedding the dashboard on entity pages**, including a Route entity's or an application's Audit
  tab. A separate change.
- **Keys, roles, interceptors and other entities.**

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/dashboards`: a third view, Routes, with its rows, KPI set, plots, donut, heatmap and
  breakdown tabs; the LLM view excludes global route rows.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Usage/` — `models.ts` (`UsageView.Routes`, the new
  breakdown tabs), `constants.ts` (per-view KPI, time-series and tab sets, the routes filter),
  `queries.ts` (the owner, path and kind expressions; the view filter), `Controls/UsageControls.tsx`
  (the third option), `Breakdown/` (the kind column, fallback labels), `utils/labels.ts`, and the
  i18n keys in `src/constants/i18n.ts` / `src/locales/en.ts`.
- No backend change: every expression is built from DSL functions the analytics service already
  accepts, and its aggregate mode already groups by an aliased select expression.
- The telemetry dashboard and its Route view are untouched.
- `openspec/changes/archive/2026-09-22-redesign-system-dashboard/design.md` — one added line.

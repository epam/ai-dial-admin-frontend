## Why

The standalone Dashboards page reads the usage log; every entity's Audit tab still reads the
telemetry dataset. Turning the analytics flags on therefore gives an admin two dashboards that
disagree — different spend, different caller counts, different error rates — depending on whether
they open the page or the entity. The usage dashboard can now answer per entity what the telemetry
one does, and for one entity type it did not cover (asset applications) as well.

## What Changes

- **Behind the existing flags**, an entity's Audit `Dashboard` tab renders the usage dashboard for
  that entity instead of the telemetry one. With either flag off, the telemetry dashboard stays, as
  today. The decision follows `/dashboards`: `ANALYTICS_ENABLED` and `ANALYTICS_USAGE_ENABLED`.
- Six entity types, five of which have the telemetry dashboard today:

  | Entity | Views in `View by` | Rows the views read |
  |---|---|---|
  | Models | LLM | calls to the model |
  | Platform models | LLM | calls to the model |
  | Toolsets | MCP | tool calls to the toolset |
  | Assets toolsets | MCP | tool calls to the toolset |
  | Applications | LLM, MCP, Routes | the application's own calls, and the calls it made |
  | Assets applications (**new tab**) | LLM, MCP, Routes | as Applications |

- An entity dashboard looks like `/dashboards`: the same controls and one view's widgets, with
  `View by` offering only the views its entity has traffic of — shown even when that is one view.
  The period is the one the other Audit tabs share.
- Each view hides the breakdown tab that would rank the entity against itself — `Models` on a
  model, `MCP Servers` on a toolset, `Applications` on an application, `Owners` on its routes.
- **An application's figures rest on its own calls.** Requests, callers, errors and latency count
  the calls made *to* the application; spend is their `total_price`, which covers every call the
  request fanned out into. Which models it called is a breakdown tab read from the calls it made.
  `Tokens` counts only its direct model calls and says so, until the backend answers how a tree's
  tokens can be read (see the backend requests document).
- An application offers the Routes view only when it declares routes.

## Non-goals

- **Global routes** (`Entities > Routes`, `Assets > Routes`). Telemetry never covered them, and naming
  a call by its route needs either regex matching against every route's `paths` or a backend field.
  A separate change.
- **Keys, roles, interceptors, adapters, runners.** The log identifies none of them well enough
  today.
- **Removing the telemetry dashboard.** It stays behind the flags.
- **Backend changes.** Everything reads columns the usage log has now.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `analytics/dashboards`: the entity Audit tab serves the usage dashboard behind the flags, with
  per-entity views, filters and hidden tabs; the requirement that the Audit tab keeps the
  telemetry dashboard is replaced.

## Impact

- `apps/ai-dial-admin/src/components/Analytics/Usage/` — the dashboard is split into a page shell and
  a reusable per-view block; `QueryScope` gains the entity's scope; new entity-dashboard shell.
- `apps/ai-dial-admin/src/components/EntityTabs/Audit/EntityAudit.tsx` and `utils/tabs/utils.ts`
  (`getAuditTabs`, `getTabsForAsset`) and `components/Assets/Apps/View.tsx` — the flag decision, the
  Assets applications tab.
- `apps/ai-dial-admin/src/components/Analytics/Usage/use-heatmap-week.ts` — the heatmap reads the
  block's scope.
- An i18n key for the direct-call token caption.
- The standalone `/dashboards` page renders exactly as before.

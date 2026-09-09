# Extend Activity Audit to the analytics tables feature

Issue: epam/ai-dial-admin-frontend#4450

## Why

The console has one activity-audit capability with three surfaces: the global list at
`/activity-audit` with a `View:` selector (`ActivityAuditList`,
`src/components/ActivityAudit/List/List.tsx`), a per-entity **Audit** tab
(`src/components/EntityTabs/Audit/EntityAudit.tsx`), and a per-activity diff page at
`/activity-audit/{activityId}` (`AuditView` + `src/utils/audit/get-activity-audit-detail-data.ts`).

The Analytics **Tables** feature is outside all three. `src/components/Analytics/Tables/TableDetailView.tsx`
(route `/tables/[id]`, `ApplicationRoute.AnalyticsTables`) is a single untabbed surface — header,
key summary, column grid, and modals for Add columns / Add rows / Manage access / Connect. Who
dropped a column, who marked one sensitive, who changed a table's access lists, and what the schema
looked like before, is invisible in the console. `openspec/specs/analytics/spec.md` has no audit
requirement, and `ActivityAuditResourceType` in `src/types/activity-audit.ts` has no analytics member.

The gap is entirely in this frontend. The analytics backend (`DIAL_ANALYTICS_API_URL`) already
records this history under its own `audit-trail` capability and already exposes it on a surface built
to match this grid — it audits the table definition row, every column, and each pipeline and saved
query, and its `POST /v1/activities` returns `{total, totalPages, data}` where each entry carries
`activityId / activityType / resourceType / resourceId / epochTimestampMs / initiatedAuthor /
initiatedEmail / revision / parentActivityId`. Those are the field names of `DialActivity`
(`src/models/activity-audit.ts`) and the shape of `AuditPageData` (`src/models/request.ts`); its
`{column, operator, value}` filters use `eq|ne|co|nc|lt|gt|le|ge|in`, which are the exact wire values
of `FilterOperatorDto` (`src/types/request.ts`); its `activityType` values are `Create|Update|Delete`
in PascalCase, and `GET /v1/tables/{name}/revision/{revision}` returns a snapshot the existing diff
engine already knows how to walk. The console simply never calls any of it.

Adding a second backend behind the same audit surface is a solved problem here, not new ground: the
`Deployments` option in the view selector did exactly this for the deployment-manager backend
(`openspec/specs/activity-audit-deployments-view/spec.md`), and the container/image Audit tabs reused
`EntityAudit` with the Activities sub-tab only (`openspec/specs/activity-audit-deployments-tab/spec.md`).
This change repeats that pattern a third time.

## What Changes

**Analytics activities are sourced.** A new `AnalyticsAuditApi` under `src/server/analytics/`, with
the same two methods as `src/server/deployments/audit-api.ts` (`getActivitiesList`,
`getActivityById`), constructed in `src/app/api/api.ts` on `process.env.DIAL_ANALYTICS_API_URL`
beside the existing `analyticsDataApi`, and reached through a `getAnalyticsActivities` server action
in `src/app/[lang]/activity-audit/actions.ts` alongside `getActivities` / `getDeploymentActivities`.
`ActivityAuditResourceType` gains the resource types the analytics backend emits (`Table`, `TableColumn`, `Pipeline`,
`SavedQuery`) with a predicate colocated beside the existing `isDeploymentManagerResource`.

**The table detail view becomes tabbed** (ask 3). `TableDetailView` renders today's whole content
under a **Properties** tab and gains an **Audit** tab that renders the existing `EntityAudit` with a
fixed `viewMode`, so it shows the **Activities** sub-tab only and no view selector — the same
arrangement the deployment Audit tabs already use. The list is filtered to this table's
`(resourceType, resourceId)` pair, which `ActivityAuditList` already does from its `entity` /
`entityType` props. No change to `EntityAudit`, `ActivityAuditList`, `TimeFilter`, or the audit grid.

**The global audit list gains an Analytics option** (ask 4, and it is feasible — see below). The
`View:` selector, currently `Config` / `Deployments` via `ActivityAuditView`, gains `Analytics`,
sourced from `getAnalyticsActivities`. The `isDeploymentsView ? … : …` fetcher ternary in
`List.tsx:211` becomes a per-view lookup rather than a nested ternary.

**The Analytics option is gated on the analytics feature flag** (ask 4's second half). `EntityAudit`
already takes `featureFlags` from `useAppContext` and hands them to `getAuditTabs`
(`src/utils/tabs/utils.ts`), and `MENU_CONFIGURATION` already drops the whole Analytics menu group on
`!featureFlags.analyticsEnabled` (`src/components/Menu/menu-configuration.tsx:267`) — the flag is set
from `ANALYTICS_ENABLED` in `src/app/[lang]/layout.tsx:61`. This change reuses that flag: with
analytics disabled the `Analytics` option is absent from the selector, no analytics fetch is issued,
and the analytics rows never reach the grid. The gate is on the option, not on a post-fetch filter,
so "not shown" and "not requested" are the same state.

**Row click opens the existing diff page.** `getActivityAuditDetailData` already falls back from the
admin backend to the deployment-manager backend and dispatches a snapshot fetcher per resource type;
it gains analytics as a third fallback, with the snapshot read from
`GET /v1/tables/{name}/revision/{revision}` via the existing `getRevisionRouteForEntityType` table.
The generic diff engine renders a table snapshot as an ordinary object — no analytics-specific
section shaping (unlike the container and firewall cases).

**Rollback does not carry over, deliberately.** The analytics backend's audit-trail capability states that it exposes
no endpoint which creates, edits or deletes an audit record, revision or snapshot, and there is no
table-rollback route. So the row-action Rollback and the system-Rollback button are absent for
analytics activities. The list already hides the system Rollback outside `ActivityAuditView.Config`
(`List.tsx:529`), and `activity-audit-deployments-view` established hiding rollback affordances for a
backend that does not support it. This is the one capability of today's audit that cannot be matched.

**Sub-tabs that do not apply are absent.** `getAuditTabs` returns Dashboard / Traces / Conversations
only for routes that name a DIAL deployment; those read request telemetry keyed by a deployment name
(`Telemetry/Dashboard.tsx`, `UsageLog/UsageLog.tsx`, `src/utils/telemetry.ts`) and mean nothing for a
catalog table. The analytics Audit tab is Activities-only, exactly as the container Audit tabs are.

## Capabilities

### New Capabilities

None. Audit behavior belongs in the audit specs; analytics behavior belongs in the analytics master
spec, per `openspec/config.yaml`.

### Modified Capabilities

- `analytics`: the master spec (`openspec/specs/analytics/spec.md`) gains the tables detail view's
  tab set — Properties carrying today's content, Audit carrying the Activities list — and states that
  the tab is present on an active table and hidden on a draft (pending) one, and requires no
  permission beyond reading the table.
- `activity-audit-deployments-view`: this spec owns the `View:` selector, the per-view column state
  and the per-view rollback rules; its "View selector exposes a Deployments option" and "Rollback
  affordances hidden in Deployments view" requirements have to account for a third option. SA decides
  whether the delta amends it in place or whether the selector's requirements move to a
  view-neutral home.

*(The precise requirement/scenario wording is the architect's, not this proposal's.)*

## Impact

- **Shared component — `ActivityAuditList` (`src/components/ActivityAudit/List/List.tsx`)**: the
  fetcher selection, the `ActivityAuditView` enum, the row-click and row-class predicates
  (`isDeploymentManagerResource` today) and the `storageKey` for per-view AG Grid column state all
  branch on the view. Every existing branch is `Config`-or-`Deployments`; a third value makes the
  binary shape wrong rather than merely incomplete. Both existing views are on this component's
  regression surface.
- **Shared util — `buildResourceTypeLabelMap` / `getFormattedResourceType`
  (`src/constants/grid-columns/formatters.ts`)**: the label map is built by iterating
  `Object.values(ActivityAuditResourceType)`, so adding analytics members changes the map that the
  Resource-type free-text filter uses **in every view**, including Config and Deployments. A new
  member whose formatted label collides with an existing one would silently widen an existing view's
  filter (the map's values are arrays for exactly that reason). This is the sharpest cross-cutting
  risk in the change.
- **Shared component — `EntityAudit` (`src/components/EntityTabs/Audit/EntityAudit.tsx`)**: gains a
  call site, unmodified, provided a `viewMode` fixes the fetcher. Its `entity` prop is typed
  `BaseEntity`; an `AnalyticsTable` (`src/models/analytics/table.ts`) is not one, so the adaptation
  has to happen at the call site — per the house rule, no new prop on a shared component to fit one
  caller.
- **Shared util — `getActivityAuditDetailData` (`src/utils/audit/get-activity-audit-detail-data.ts`)**:
  a third backend in the by-id fallback chain adds a request to the detail page's critical path for
  every activity that is not an admin one. Its existing two-step fallback is already sequential.
- **Feature component — `TableDetailView` (599 lines)**: restructured into a tab shell. Its header
  actions (Manage access / Delete table / Add columns / Add rows / Connect) and its
  draft-vs-active branch (`DraftSchemaEditor` vs the column `GridView`) both live in the body being
  moved; where those actions sit relative to the tab strip is a design decision, not a requirements
  one.
- **New API client and server action**, no new API route: `src/server/analytics/` and
  `src/app/[lang]/activity-audit/actions.ts`. No change to any backend.
- **No new environment variable.** `DIAL_ANALYTICS_API_URL` and `ANALYTICS_ENABLED` already exist in
  `.env.template`; `ANALYTICS_ENABLED` is already surfaced as `featureFlags.analyticsEnabled`.
- **i18n**: new keys for the Analytics view-selector option (beside
  `TelemetryI18nKey.ActivityViewConfig` / `ActivityViewDeployments`), the Properties/Audit tab labels
  on the tables view (`TabsI18nKey.Properties` / `TabsI18nKey.Audit` already exist), and labels for
  the new resource types.
- **Contexts**: none. `AppContext` already carries the flag; `NotificationContext` is untouched.
- **Authorization**: none added. The analytics backend authorizes its activity feed at exactly the bar reading the
  catalog already requires, so anyone who can open a table's detail view can read its history.
  `useAnalyticsTablePermissions` (`src/hooks/use-analytics-table-permissions.ts`) is not consulted for
  the Audit tab.

## Non-goals

- **No rollback, revert or restore for analytics resources.** The analytics backend exposes no mutating audit endpoint
  and no table-rollback route; this cannot be built in the frontend, and pretending otherwise with a
  disabled control would be worse than its absence. If rollback is wanted it is a change to the analytics backend first.
- **No Audit tab on Analytics → Pipelines or Analytics → Queries.** The analytics backend audits `Pipeline` and
  `SavedQuery` too, so those tabs are cheap follow-ups once this lands, but the request names the
  tables feature and each is its own detail-view restructure. Their activities do still appear in the
  global Analytics view — the feed is not filtered down to tables, because hiding rows the backend
  returned would make an audit surface quietly incomplete.
- **No Dashboard / Traces / Conversations sub-tabs on the analytics Audit tab.** They report DIAL
  request telemetry keyed by a deployment name and have no meaning for a catalog table.
- **No analytics-specific diff rendering.** A table snapshot goes through the generic diff engine.
  The bespoke section shaping that `activity-audit-deployments-detail` defines for containers, images
  and the global firewall is not replicated; if a table's `columns` array reads poorly as a generic
  diff, that is a follow-up.
- **No entity-namespaced audit detail route** (`/tables/{name}/{activityId}`). Rows open the existing
  global `/activity-audit/{activityId}` page. The deployment feature added namespaced routes in a
  separate change; the same split applies here.
- **No change to the Config or Deployments views' own behavior**, beyond the shared-code changes the
  Impact section names.
- **No new feature flag.** `ANALYTICS_ENABLED` is the gate; no separate audit toggle.
- **No changes to the analytics backend.** Every endpoint this change calls already exists and is already specified.
- **No change to what the audit list stores or how it pages.** Time filter, infinite row model,
  column-state persistence and parent/child aggregation are reused as they are.

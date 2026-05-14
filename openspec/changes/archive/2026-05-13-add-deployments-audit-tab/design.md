## Context

The audit feature already has two layers in production:

1. **Per-entity Audit tab** on admin entity edit pages (Models, Applications, Adapters, Interceptors, Routes, Roles, Keys, Toolsets, Application Runners, Interceptor Templates). Implemented by `EntityAudit` (`apps/ai-dial-admin/src/components/EntityTabs/Audit/EntityAudit.tsx`) which renders a vertical sidebar of sub-tabs and an `ActivityAuditList` filtered to `(resourceType, resourceId)`.
2. **Activity detail diff** at `/activity-audit/[id]`. The recent `add-deployments-audit-container-detail-view` change extended this to all 6 container deployment subtypes and all 4 image-definition types, so the diff page already renders correctly for them.

What is missing: the *entry point* on the deployment edit pages. A user who is looking at a Model Serving today must leave the entity, open the global `/activity-audit`, switch to the `Deployments` view, and filter by ID. Admin entities have always had a one-click `Audit` tab; deployments do not.

Three gaps prevent direct reuse of `EntityAudit`:

| # | Gap | File |
|---|-----|------|
| G1 | `routeAuditResource` maps only admin `ApplicationRoute`s to `ActivityAuditResourceType`s. Deployment routes resolve to `undefined`, so the resource-type filter is dropped. | `View/Header/constants.ts:29` |
| G2 | `ActivityAuditList` defaults to `ActivityAuditView.Config` and uses `getActivities` (admin backend). Deployment activities live in `getDeploymentActivities` (deployment-manager backend). The view-mode toggle that selects between them is hidden when `entity` is set. | `ActivityAudit/List/List.tsx:89, 417` |
| G3 | `getDeploymentsViewTabs` does not include an audit tab for any container or image route. | `utils/tabs/utils.ts:442` |

A fourth wrinkle (G4): **Model Servings** hosts two resource types in one page — `NIM_DEPLOYMENT` (`$type: 'nim'`) and `INFERENCE_DEPLOYMENT` (`$type: 'inference'`). The page-level route can't disambiguate; the loaded container can.

Container model field references:
- `Container.$type: CONTAINER_TYPE` — values `'mcp' | 'interceptor' | 'nim' | 'inference' | 'adapter' | 'application'`.
- `Container.name: string` — the deployment-manager backend stamps this on audit `resourceId`.

`ActivityAuditResourceType` values are PascalCase (`'NimDeployment'`, `'InferenceDeployment'`, etc.) — distinct strings from `CONTAINER_TYPE`, so a bridge is needed.

## Goals / Non-Goals

**Goals:**
- Provide a one-click **Audit** tab on the 5 container deployment edit pages and on the Deployment Images edit page, filtered to *this exact entity's* activity history.
- Reuse `EntityAudit` and `ActivityAuditList` rather than duplicating them.
- Route the list to the correct backend (`getDeploymentActivities`) without exposing the view toggle inside an entity tab.
- For Model Servings, show only the activities matching the loaded container's subtype (NIM vs Inference), not both.

**Non-Goals:**
- Adding Dashboard / Traces / Conversations sub-tabs to deployment Audit tabs.
- Adding audit tabs to Prompts, Files, Assets Applications, or Publications (no audit resource type today).
- Modifying the global `/activity-audit` page or the existing `activity-audit-deployments-view` toggle.
- Modifying the Before/After diff renderer or the resolver routing — both already support these resource types.
- Adding new audit i18n keys — reuse `TabsI18nKey.Audit` and the existing `Activities` sub-tab key.

## Decisions

### 1. Resolve resource type per-instance from `container.$type` (Option 1)

A small mapping table converts `CONTAINER_TYPE` → `ActivityAuditResourceType`:

```ts
// One canonical mapping, six entries.
export const CONTAINER_TYPE_TO_AUDIT: Record<CONTAINER_TYPE, ActivityAuditResourceType> = {
  [CONTAINER_TYPE.MCP]:         ActivityAuditResourceType.MCP_DEPLOYMENT,
  [CONTAINER_TYPE.NIM]:         ActivityAuditResourceType.NIM_DEPLOYMENT,
  [CONTAINER_TYPE.HF]:          ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  [CONTAINER_TYPE.ADAPTER]:     ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
  [CONTAINER_TYPE.APPLICATION]: ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
  [CONTAINER_TYPE.INTERCEPTOR]: ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
};
```

`EntityAudit` is passed the container and consults `CONTAINER_TYPE_TO_AUDIT[container.$type]` when computing the `entityType` filter — falling back to `routeAuditResource[view]` for admin entities. The list filter uses the existing `eq` operator unchanged.

**Why not Option 2 (route → array)?**

- Requires extending the filter operator vocabulary to `in` on `resourceType`. Today every audit filter uses `eq`; introducing `in` is an unverified backend change.
- For all routes except Model Servings the array would be of length 1, so the abstraction earns its keep only for one case.
- `resourceId` is already unique to one container; once the `resourceId` filter applies, the result set is identical to Option 1, so `in` over types is functionally redundant.
- The type signature change ripples through admin callers that read a single value (back-links, header rendering, etc.).

Per-instance keeps the route map admin-only, uses a single-row mapping that fits in one file, and matches the "this exact entity's history" semantic.

**Mapping table location.** Co-locate it with existing audit-route mappings in `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/constants.ts` next to `routeAuditResource` and `auditResourceRoute`. Keeping all three maps together is the existing convention and minimizes import sprawl.

### 2. Add a `viewMode?: ActivityAuditView` prop to `ActivityAuditList` (G2 fix)

Current state: `ActivityAuditList` uses local state `activityViewType` initialized to `ActivityAuditView.Config`, and the radio toggle is hidden when `entity` is set (line 417 — `!entity && ...`). Hidden but still defaulted to `Config` → admin fetcher is used.

Decision: add an optional `viewMode?: ActivityAuditView` prop. When provided:
- the radio toggle remains hidden (existing `!entity` guard already does this);
- the internal `activityViewType` is treated as fixed to `viewMode` (initialize from the prop and skip the toggle handler);
- the column-set selection and the `isDeploymentsView` branch resolve to the supplied mode.

When `viewMode` is undefined, behavior is unchanged for the global `/activity-audit` callers.

**Why a prop, not a derived value?** The list has no awareness of `ApplicationRoute` and intentionally so — it's reused on the global audit page where there is no route. Passing the mode in is the smallest, most localized change. The caller (`EntityAudit` → indirectly the deployment edit page) is already route-aware.

**Why not introduce a separate `DeploymentEntityAuditList` component?** It would duplicate ~250 lines of grid wiring, sorting, filtering, time-period plumbing, and row-click navigation. The only branch that differs is the fetcher selection — a one-prop conditional is far smaller surface area.

### 3. `EntityAudit` forwards `viewMode` and entity-resolved `entityType`

`EntityAudit` gains two changes:
- Accepts an optional `viewMode?: ActivityAuditView` prop and forwards it to `ActivityAuditList`.
- When `entity` is a container (detectable by `'$type' in entity && entity.$type in CONTAINER_TYPE_TO_AUDIT`), it resolves `entityType` via the mapping table; otherwise it falls back to `routeAuditResource[view]` as today.

Admin call sites pass neither prop change and behavior is unchanged.

**Why detect via duck-typing on `$type` rather than a new explicit `entityType` prop?** Two reasons:
- The container is already passed in via `entity`; there is one source of truth and the detection is one membership check.
- Admin entities don't have `$type`, so the branch is unambiguous.

**Open variant considered.** Have the deployment-page caller pass an explicit `entityType={ActivityAuditResourceType}` prop and bypass the mapping in `EntityAudit`. This is cleaner on paper but means every deployment caller has to import the mapping table or repeat the same lookup. The duck-typing keeps deployment callers minimal — just `<EntityAudit entity={container} view={route} viewMode={Deployments} />` — and centralizes the mapping in `EntityAudit`.

### 4. Audit tab inclusion in `getDeploymentsViewTabs`

Append `auditTab(t)` to the returned tab arrays for:
- `ApplicationRoute.ModelServings` (the default branch — currently `[propertiesTab, firewallTab, executionLogTab, eventsTab]`).
- `ApplicationRoute.McpContainers`.
- `ApplicationRoute.AdapterContainers`.
- `ApplicationRoute.ApplicationContainers`.
- `ApplicationRoute.InterceptorContainers`.
- `ApplicationRoute.Images`.

`auditTab` is the existing factory used for admin entities (already imported in `tabs/utils.ts`). Tab position: last, matching admin convention.

### 5. Images edit page integration

The Images edit page uses a different View component (`components/Deployments/Images/View/*`, not `Containers/View`). Image audit resource types (`ADAPTER_IMAGE_DEFINITION`, etc.) are not in `CONTAINER_TYPE_TO_AUDIT`. Resolution strategy for Images:
- The image entity carries its own discriminator (`$type` or equivalent — verify in the actual model). Add an analogous `IMAGE_TYPE_TO_AUDIT` mapping next to the container one, keyed by the image's `$type`.
- `EntityAudit` detection extends to check the image mapping when the container mapping misses.

Same `viewMode={Deployments}` prop wires the list to `getDeploymentActivities`.

### 6. `routeAuditResource` is unchanged

Per Decision 1, deployment routes are not added to `routeAuditResource`. The entity-resolved type takes precedence inside `EntityAudit`. This keeps the map's purpose narrow (route → single canonical admin resource type) and avoids the Model Servings ambiguity.

### 7. Row-click navigates to an entity-namespaced detail URL

Admin entities (Models, Adapters, Roles, etc.) route Audit-tab row clicks to `/<route>/<entityName>/<activityId>` — handled by a per-entity `[subId]/page.tsx` that loads the activity in entity context and renders `<AuditView ... isEntityActivity />`. Deployments currently lack these per-entity routes, and `getAuditActivityHref` (`List/utils.tsx`) has a hardcoded switch covering only the 10 admin resource types — so deployment row clicks resolve to `''` and silently no-op.

To close the gap and match the admin pattern:

- Replace the switch in `getAuditActivityHref` with a lookup against the existing `auditResourceRoute` map (in `View/Header/constants.ts`), which already maps all 20 resource types — admin, container deployment, image-definition, system properties. The function becomes:

  ```ts
  export const getAuditActivityHref = (entity, entityType, activityId) => {
    if (!entityType || !entity || !activityId) return '';
    const route = auditResourceRoute[entityType];
    if (!route) return '';
    return `${getUrnForEntity(route, entity)}/${encodeURIComponent(activityId)}`;
  };
  ```

  Removes ~30 lines of duplicated case statements. Single source of truth.

- Create 6 new entity-namespaced route files under `apps/ai-dial-admin/src/app/[lang]/`:
  - `model-servings/[id]/[subId]/page.tsx`
  - `mcp-containers/[id]/[subId]/page.tsx`
  - `adapter-containers/[id]/[subId]/page.tsx`
  - `application-containers/[id]/[subId]/page.tsx`
  - `interceptor-containers/[id]/[subId]/page.tsx`
  - `deployment-images/[id]/[subId]/page.tsx`

  Each is a thin wrapper that resolves the activity + revisions via the shared deployment resolver (Decision 8) and renders `<AuditView ... isEntityActivity />`.

**Why not route to the global `/activity-audit/<activityId>` instead?** That was the smaller alternative (one-line URL change, no new route files). It works functionally and the detail page renders, but the URL stops referencing the entity — the user navigates away from `/model-servings/gpt-4-turbo` to `/activity-audit/abc-123`, losing the entity URL anchor. The admin pattern keeps the entity in the URL and that's the parity the user expects.

**Why not extend the switches case-by-case?** Adding 10 new cases to `getAuditActivityHref` keeps the same data in two places (the switch and `auditResourceRoute`); future audit types need two updates. The lookup version reuses the existing map and removes the duplication.

**Why not also fix `getRollbackRedirectHref`?** Rollback is not exposed for deployment audit activities, so that function's admin-only switch is unreachable for the new flows. Leave it untouched.

### 8. Consolidate audit-detail resolution into a single unified function

The codebase previously had two audit-detail resolvers:

- `apps/ai-dial-admin/src/utils/audit/get-audit-activity-data.ts` — admin-only, called by all 10 admin `[subId]/page.tsx` pages. Sequential await chain: `getActivityById` → `getActivitiesList` → (optional) `getRevisionDetails(latest)` → (optional) `getRevisionDetails(current)` → `getRevisionDetails(previous)`. 4–5 round-trips.
- `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` — deployment-aware, called only by the global `/activity-audit/[id]/page.tsx`. Tries the admin API first, falls back to the deployment-manager API, dispatches via `pickActivityHandlers` to admin / image / firewall / container handlers.

The deployment-aware resolver's `adminHandlers` branch already calls exactly the same admin APIs as the admin-only resolver. Its orchestration uses `Promise.all` for the current revision + previous revision + activities list — 3 of the 4–5 round-trips collapse into one. Net effect: the deployment-aware resolver is a strict superset of the admin-only one, **and** faster.

Decision: collapse both into a single unified resolver at `apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts`, exporting `getActivityAuditDetailData(activityId, token)`. The function name reflects that it serves every audit detail page, not just deployments. All 17 consumers re-pointed:

- 1 global `/activity-audit/[id]/page.tsx`
- 6 new deployment `[subId]/page.tsx` wrappers (this change)
- 10 admin `[subId]/page.tsx` pages (Models, Adapters, Applications, Interceptors, Roles, Keys, Routes, Toolsets, ApplicationRunners, InterceptorTemplates)

The legacy `get-audit-activity-data.ts` is deleted.

**Why this location?** `src/utils/audit/` is the established home for cross-route audit helpers. Both predecessors lived there or moved there; keeping the unified resolver alongside `get-revision-route.ts`, `get-rollback-request.ts`, etc., preserves discoverability.

**Why not keep two resolvers?** Two copies of similar resolution logic means every future bug fix or new resource type needs two updates. The factory pattern in the deployment-aware resolver (`pickActivityHandlers`, `makeRouteSnapshotFetcher`, `makeListActivities`) was already designed to be reusable; the admin-only resolver was always redundant once that pattern existed — we just hadn't migrated the admin pages.

**Why not import from inside the original route folder?** Next.js allows it, but no other file in this codebase imports from a `src/app/[lang]/<route>/` folder — it would be the first place a route-folder file is imported from outside its own route. The convention is `src/utils/` for shared helpers; following that keeps the codebase consistent.

**Why rename to `getActivityAuditDetailData`?** The original deployment-resolver name (`getDeploymentAuditData`) was misleading once the function also serves admin pages. The new name reflects what the function actually does. The 10 admin pages now read clearly: "load activity audit detail data for this entity".

**Performance impact on admin pages.** Every admin audit-detail load (Models, Roles, etc.) now uses the parallel `Promise.all` path. Three previously-sequential server-side `await`s collapse into one round-trip's worth of latency. No behavioral change — same handler set, same API contracts, same response shape.

## Risks / Trade-offs

- **[Risk] Backend stamps audit `resourceId` as something other than `Container.name`** → The existing global Deployments view filters by `resourceId` already; if those filters worked for containers, the same field will work here. Confirm during implementation by reading one real activity event for a container; if the field is e.g. a UUID, surface and adjust the filter source.
- **[Risk] Duck-typing on `$type` mis-fires for an entity that happens to have a `$type` field but isn't a container** → Restrict the check to `entity.$type in CONTAINER_TYPE_TO_AUDIT` (membership in the typed mapping). Non-matching `$type` values fall through to `routeAuditResource[view]` and produce the original behavior.
- **[Risk] Hiding the view-toggle behind a `viewMode` prop diverges from the global page over time** → Document the prop's intent (forced mode, hidden toggle) in JSDoc and add a test that confirms the toggle is not rendered when `viewMode` is passed.
- **[Trade-off] `ActivityAuditList` grows another optional prop** → Keeps two distinct caller use cases (global page vs entity tab) in one component. Component does not own an `ApplicationRoute`-aware branch, so the prop is the right boundary.
- **[Trade-off] Audit tab on deployments has only the `Activities` sub-tab** → Sidebar with one tab is visually a slight overweight, but `EntityAudit` already handles the "Activities only" case (when `dashboardEnabled` is off or the route is not in the if-branch). No special-casing needed; intentional UX.

## Open Questions

- Image entity model: what is the discriminator field name (assumed `$type`)? Confirm before defining `IMAGE_TYPE_TO_AUDIT`.
- Image edit page tab integration: does the Images View component use `getDeploymentsViewTabs` or its own tab list factory? (If its own, the inclusion change applies there instead.)
- Should the audit tab be hidden when the entity has no name yet (during create flow)? Admin entities behave the same way (audit tab exists but list is empty); reuse that behavior.

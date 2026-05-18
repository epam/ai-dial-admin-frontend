## Why

Admin entities (Models, Applications, Adapters, etc.) expose an **Audit** tab on their edit pages that lists this entity's activity history and links into the per-activity Before/After diff. Container deployment entities (Model Servings, MCP / Adapter / Application / Interceptor Containers) and Deployment Images do not, even though the just-shipped `add-deployments-audit-container-detail-view` change wired the detail view for those resource types. Users must currently leave the entity, navigate to the global `/activity-audit` page, switch to the `Deployments` view, and filter by resource ID to see the same data — the entry point that admin entities have always had is missing for deployments.

## What Changes

- Add an **Audit** tab to the 5 container deployment edit pages (Model Servings, MCP / Adapter / Application / Interceptor Containers) and to the Deployment Images edit page.
- Reuse the existing `EntityAudit` component used by admin entities; render only the `Activities` inner tab on deployment pages (no Dashboard / Traces / Conversations, since deployment pages already host their own standalone Metrics / Execution log / Events tabs).
- Introduce a `CONTAINER_TYPE_TO_AUDIT` mapping table from the container model's `$type` (lowercase, e.g. `'nim'`, `'inference'`) to the audit `ActivityAuditResourceType` (PascalCase, e.g. `NimDeployment`, `InferenceDeployment`) so the per-entity filter resolves to the correct single resource type for any container, including Model Servings whose page hosts two subtypes.
- Add an optional `viewMode?: ActivityAuditView` prop to `ActivityAuditList`. When set, the list skips the `Config / Deployments / Asset` toggle and uses the supplied mode for fetcher selection. Deployment audit tabs pass `viewMode={ActivityAuditView.Deployments}` so the list calls `getDeploymentActivities` instead of `getActivities`.
- Wire row-click navigation to **entity-namespaced** detail URLs — `/<route>/<entityName>/<activityId>` — mirroring how admin entities (Models, Adapters, Roles, etc.) navigate from their Audit tab. This requires:
  - Replacing the hardcoded resource-type switch in `getAuditActivityHref` (`List/utils.tsx`) with a lookup against the existing `auditResourceRoute` map, which already covers every audit resource type including the 6 container deployments and 4 image-definition types.
  - Creating 6 new entity-namespaced detail routes: `[lang]/model-servings/[id]/[subId]/page.tsx`, `[lang]/mcp-containers/[id]/[subId]/page.tsx`, `[lang]/adapter-containers/[id]/[subId]/page.tsx`, `[lang]/application-containers/[id]/[subId]/page.tsx`, `[lang]/interceptor-containers/[id]/[subId]/page.tsx`, `[lang]/deployment-images/[id]/[subId]/page.tsx`.
  - Promoting the existing deployment-aware audit resolver from `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` to a shared location at `apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts`, so both the global `/activity-audit/[id]` page and the new entity-namespaced pages call the same resolver.
- Consolidate the two audit-detail resolvers into one. The promoted resolver is a strict superset of the legacy admin-only `getAuditActivityData` (in `src/utils/audit/get-audit-activity-data.ts`) — its admin handler set already covers exactly what the legacy function does, and uses `Promise.all` to fetch the current revision, previous revision, and activities list in parallel (vs the legacy's sequential awaits, which translated to 3 extra round-trips on every admin audit-detail load). All 10 admin entity-namespaced `[subId]/page.tsx` pages (Models, Adapters, Applications, Interceptors, Roles, Keys, Routes, Toolsets, ApplicationRunners, InterceptorTemplates) are repointed at the unified resolver and the legacy file is deleted. The unified function is renamed to `getActivityAuditDetailData` to reflect that it serves every audit detail page, not just deployments.

### Non-goals

- Adding audit tabs to Prompts, Files, Assets Applications, or Publications pages — those resource types are not in the `ActivityAuditResourceType` enum and need a separate backend conversation.
- Adding Dashboard / Traces / Conversations sub-tabs to deployment audit tabs — Conversations is chat-history (irrelevant for infra) and Dashboard / Traces would overlap with the existing standalone Metrics / Execution log / Events tabs. Out of scope here; revisit if/when a unified Audit drawer is desired.
- Changing how the global `/activity-audit` Deployments view works — that surface is unchanged.
- Modifying the Before/After diff renderer or the resolver routing — both already support these resource types.

## Capabilities

### New Capabilities
- `activity-audit-deployments-tab`: Per-entity Audit tab on container deployment and image-definition edit pages, listing this entity's activity history filtered to the entity's resource type and ID, with row clicks navigating to the existing activity-detail diff page.

### Modified Capabilities
<!-- None — `activity-audit-deployments-view` (the global Deployments toggle on /activity-audit) is unchanged. `audit-tab-return-state` is reused as-is for save/restore on row click. -->

## Impact

- **Affected components**:
  - `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx` + `TabsContent.tsx` — add Audit tab branch.
  - `apps/ai-dial-admin/src/components/Deployments/Images/View/*` (image edit page) — add Audit tab branch.
  - `apps/ai-dial-admin/src/components/EntityTabs/Audit/EntityAudit.tsx` — accept and forward a `viewMode` prop.
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx` — honor a `viewMode` prop that forces fetcher and hides the view toggle.
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/utils.tsx` — replace the hardcoded switch in `getAuditActivityHref` with an `auditResourceRoute` lookup so deployment row clicks navigate.
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/constants.ts` — extend `routeAuditResource` for deployment routes (or introduce a parallel deployment-aware resolver).
  - `apps/ai-dial-admin/src/utils/tabs/utils.ts` — append `auditTab(t)` to `getDeploymentsViewTabs` for the 5 container routes and the Images route.
- **Moved files**: `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/resolver.ts` → `apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts` (unified resolver for every audit detail page — global and all entity-namespaced).
- **Deleted files**: `apps/ai-dial-admin/src/utils/audit/get-audit-activity-data.ts` (admin-only resolver — subsumed by the unified one).
- **New route files**: 6 new `[subId]/page.tsx` thin wrappers under each deployment route folder (model-servings, mcp-containers, adapter-containers, application-containers, interceptor-containers, deployment-images).
- **Modified import sites**: 10 admin entity-namespaced `[subId]/page.tsx` pages re-pointed at the unified resolver.
- **New file**: a small `CONTAINER_TYPE_TO_AUDIT` mapping (likely co-located with existing container/audit utilities).
- **APIs / dependencies**: No backend changes. Uses the existing `getDeploymentActivities` server action that is already wired and consumed by the global Deployments view.
- **Feature flags**: None. The tab is unconditional for container and image-definition pages.
- **i18n**: Reuses existing `TabsI18nKey.Audit` and `EntityViewTab.Activities` strings.
- **Tests**: Component-level tests for `ContainerView` / image View tab inclusion, `ActivityAuditList` `viewMode`-forced fetcher selection, and `EntityAudit` prop forwarding.

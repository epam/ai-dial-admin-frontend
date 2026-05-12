## Why

Today the Activity Audit page at `/activity-audit` only displays activities tracked by the admin backend (`DIAL_ADMIN_API_URL`), so administrators cannot audit changes to deployment-managed resources (containers, images, domain whitelist) from the same place. The deployment-manager backend now exposes a shape-compatible activities API at `DIAL_DEPLOYMENTS_API_URL`, but the front end has no way to surface it. This change connects that endpoint to the existing audit UI so changes to deployments and images become visible alongside config activities.

GitHub issue: [#3105 — \[Deployments\] Implement Audit](https://github.com/epam/ai-dial-admin-frontend/issues/3105).

## What Changes

- Add a new `Deployments` option to the existing View dropdown on the Activity Audit page (alongside `Config` and the disabled `Asset`). Default selection remains `Config`.
- When the user selects `Deployments`, the grid fetches from the deployment-manager backend (`POST /api/v1/activities` at `DIAL_DEPLOYMENTS_API_URL`) instead of the admin backend.
- Extend `ActivityAuditResourceType` with eleven new resource types: `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`, `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`, `ImageBuildDomainWhitelist`.
- Display localized singular labels in the `Resource type` column: `Adapter container`, `Application container`, `Interceptor container`, `MCP container`, `Model serving` (flattens both `NimDeployment` and `InferenceDeployment`), `Image` (flattens all four `*ImageDefinition` types), `Global firewall` (`ImageBuildDomainWhitelist`).
- In the Deployments view, the grid uses a tailored column set: `Activity type`, `Resource type`, `Resource identifier`, `Version`, `Time`, `Initiated`, `Activity ID`, `Parent ID`. No row-expander. The `Parent ID` column is included for visual consistency with the Config view but renders empty for every row — the deployment-manager backend emits flat activities and does not populate `parentActivityId`.
- The new `Version` column is shown only when the Deployments view is active and is populated only for `*ImageDefinition` rows. **Depends on a backend change**: `AuditActivityDto` in `ai-dial-admin-mcp-manager-backend` must expose a nullable `version: String` field projected from the image entity snapshot. Until that field exists the column stays empty for every row.
- Hide the system-level `Rollback` button and the per-row `Rollback` action menu item whenever the Deployments view is active.
- The Deployments view has a row action menu with a single item: `Open in new tab`. The item is rendered as a visible affordance but clicking it is a no-op in this change (short-circuits in the handler). Row-body clicks are also no-ops. The existing audit detail route at `/activity-audit/{activityId}` stays admin-backend only. The follow-up change that ships the dedicated deployment-activity detail experience will wire both the menu action and the row body click.
- Switching the View dropdown clears all AG Grid column filters (resource type, activity type, resource identifier, initiated, activity ID). Time period and sort order are preserved.
- Consolidate the user-facing view enum: rename `ACTIVITY_VIEW_TYPE` (previously in `types/telemetry.ts`) to `ActivityAuditView` and relocate it to `types/activity-audit.ts`. Values are `Config | Deployments | Asset`. The column factory accepts this enum directly together with an optional `isSingleEntity` flag (used by the entity-tab embed).
- New i18n keys covering the resource-type singular labels and the `Deployments` view option.

## Capabilities

### New Capabilities

- `activity-audit-deployments-view`: Renders the Deployments option in the Activity Audit View selector, fetches activities from the deployment-manager backend, applies Deployments-specific columns/labels/actions, and hides rollback affordances. Covers the request lifecycle, label mapping, view-switch reset behavior, and the open-in-new-tab routing rules.

### Modified Capabilities

- None. No existing capability spec describes the current Activity Audit page (no `activity-audit` spec exists in `openspec/specs/`), so this change introduces a fresh capability scoped to the deployments view rather than modifying an existing one.

## Impact

- **New code**:
  - `apps/ai-dial-admin/src/server/deployments/audit-api.ts` — `DeploymentAuditApi` extending `BaseApi`, bound to `DIAL_DEPLOYMENTS_API_URL`.
  - `deploymentAuditApi` instance wired in `apps/ai-dial-admin/src/app/api/api.ts`.
  - New server action `getDeploymentActivities(...)` in `apps/ai-dial-admin/src/app/[lang]/activity-audit/actions.ts`.
- **Modified code**:
  - `apps/ai-dial-admin/src/types/activity-audit.ts` — eleven additional members in `ActivityAuditResourceType`; new `ActivityAuditView` enum (`Config | Deployments | Asset`).
  - `apps/ai-dial-admin/src/types/telemetry.ts` — `ACTIVITY_VIEW_TYPE` enum removed (callers now use `ActivityAuditView`).
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx` — view-aware datasource, column set, action menu, system-rollback visibility, view-switch filter reset, per-view AG Grid column-state key, key-based remount on view switch (works around `GridView` only reading `columnDefs` on first mount).
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/utils.tsx` — `getDeploymentActivityAuditColumns(t, open)` adds only the Open-in-new-tab row action; `getActivityAuditColumns` updated to pass the new view enum.
  - `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` — single `ACTIVITY_AUDIT_COLUMNS(t, view, isSingleEntity?)` factory: Config view has the row expander + resource columns; Deployments view adds `Version` and omits the expander; `Parent ID` is present in both for visual consistency; embedded single-entity Config drops expander + resourceType + resourceId.
  - `apps/ai-dial-admin/src/constants/grid-columns/formatters.ts` — extended `getFormattedResourceType` covering the new resource types and singular labels.
  - `apps/ai-dial-admin/src/constants/i18n.ts` and `apps/ai-dial-admin/src/locales/en.ts` — new singular-label keys and the Deployments view option label.
  - `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/page.tsx` — unchanged (admin-backend only; deployment activities deliberately have no detail page in this change).
- **Untouched (intentional)**:
  - Rollback flow (`utils/audit/get-rollback-request.ts`, the rollback modal, and related helpers) — Config-only.
  - `components/EntityTabs/Audit/EntityAudit.tsx` and any per-entity Audit tabs — deferred to a follow-up spec, after the deployment activity detail view exists.
  - Existing `TimeFilter`, `ResetFiltersButton`, AG Grid wrapper components — reused as-is.
- **External dependency**: `ai-dial-admin-mcp-manager-backend` must add a nullable `version` field on `AuditActivityDto` for image rows. Until that ships the front end behavior is fully functional except the `Version` column will display empty strings for every image row. The change should not be blocked on the BE work, but the proposal flags it so the dependency is tracked.
- **Non-goals** (called out to keep scope clean):
  - Detail/diff rendering for deployment activities (follow-up spec). Until then, the row action menu shows `Open in new tab` as a visible affordance but clicking it (and clicking the row body) is a no-op.
  - Per-entity Audit tab embedded in container or image detail pages (follow-up spec).
  - Rollback for deployment activities (out of scope, ever — per issue requirement #4).
  - Activity types beyond `Create | Update | Delete` (the deployment-manager backend emits only these three; design mockup's `Launch Succeeded` / `Launch Stopped` / `Installation Succeeded` etc. are ignored — per issue requirement #6).
  - Replacing the resource-type free-text filter with a select dropdown (accepted UX trade-off: typing the displayed singular label will not always match the raw BE value).

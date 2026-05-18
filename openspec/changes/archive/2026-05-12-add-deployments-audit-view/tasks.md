## 1. Types and view enum

- [x] 1.1 Add the eleven new resource-type members to `ActivityAuditResourceType` in `apps/ai-dial-admin/src/types/activity-audit.ts`: `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`, `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`, `ImageBuildDomainWhitelist`. Match the BE enum string values exactly.
- [x] 1.2 Consolidate the view enum: rename `ACTIVITY_VIEW_TYPE` to `ActivityAuditView`, move it from `apps/ai-dial-admin/src/types/telemetry.ts` to `apps/ai-dial-admin/src/types/activity-audit.ts`, add the `Deployments` member. Final values: `Config | Deployments | Asset`. Update all callers.
- [x] 1.3 Extend `DialActivity` in `apps/ai-dial-admin/src/models/activity-audit.ts` with an optional `version?: string` field for image-row support.

## 2. Backend client and server action

- [x] 2.1 Create `apps/ai-dial-admin/src/server/deployments/audit-api.ts` with a `DeploymentAuditApi` class extending `BaseApi`. Implement `getActivitiesList(pageSize, pageNumber, token, sorts, filters)` posting to `${API}/activities` returning `AuditPageData<DialActivity>`. (`getActivityById` is intentionally omitted — see scope change.)
- [x] 2.2 Wire a `deploymentAuditApi` instance in `apps/ai-dial-admin/src/app/api/api.ts` bound to `process.env.DIAL_DEPLOYMENTS_API_URL`.
- [x] 2.3 Add `getDeploymentActivities(pageSize, pageNumber, sorts, filters)` server action in `apps/ai-dial-admin/src/app/[lang]/activity-audit/actions.ts`, mirroring the existing `getActivities` action signature. Authenticate via `getUserToken` and delegate to `deploymentAuditApi.getActivitiesList`.
- [x] 2.4 ~~Add `getDeploymentActivityById(id)` server action~~ — **superseded** by scope change: deployment activities have no detail page in this change, so no per-id fetch is needed.

## 3. i18n keys

- [x] 3.1 Choose the smallest viable home for the new i18n keys (reuse an existing enum in `apps/ai-dial-admin/src/constants/i18n.ts` if one fits — check `EntitiesI18nKey`, `MenuI18nKey`, `TelemetryI18nKey`; otherwise add scoped keys under an existing enum, do not create a new one if avoidable). Chose `EntitiesI18nKey` for resource labels (next to existing `InterceptorContainer`, `ModelServing`) and `TelemetryI18nKey.ActivityView` for view dropdown.
- [x] 3.2 Add singular-label keys: `AdapterContainer`, `ApplicationContainer`, `InterceptorContainer` (reused; English value updated to lowercase second word), `McpContainer`, `ModelServingLabel` (suffix avoids collision with existing template `ModelServing`), `Image`, `GlobalFirewall`.
- [x] 3.3 Add `ActivityViewDeployments` for the View dropdown option.
- [x] 3.4 Add `Version` key for the new column header.
- [x] 3.5 Populate the English strings in `apps/ai-dial-admin/src/locales/en.ts` for every key added above.

## 4. Resource-type label formatter

- [x] 4.1 Extend `getFormattedResourceType` in `apps/ai-dial-admin/src/constants/grid-columns/formatters.ts` so it returns the localized singular label for each of the eleven new `ActivityAuditResourceType` members, flattening per the mapping in `specs/.../spec.md` (all `*ImageDefinition` → `Image`; `NimDeployment` and `InferenceDeployment` → `Model serving`; `ImageBuildDomainWhitelist` → `Global firewall`). Existing branches stay intact.
- [x] 4.2 Add unit tests for the new mappings in `apps/ai-dial-admin/src/constants/grid-columns/tests/formatters.spec.ts` covering each new resource type and each flattened group.

## 5. Deployments column definition

- [x] 5.1 Refactor `ACTIVITY_AUDIT_COLUMNS` in `apps/ai-dial-admin/src/constants/grid-columns/grid-columns.tsx` into a single view-aware factory: `ACTIVITY_AUDIT_COLUMNS(t, view: ActivityAuditView, isSingleEntity?: boolean)`. Per view: `Config` → expander + activityType + resourceType + resourceId + time + initiatedEmail + activityId + parentActivityId; `Config` with `isSingleEntity=true` → activityType + time + initiatedEmail + activityId + parentActivityId; `Deployments` → activityType + resourceType + resourceId + version + time + initiatedEmail + activityId + parentActivityId (no expander); `Asset` → falls back to Config. The `parentActivityId` column appears in both Config and Deployments for visual consistency and renders empty for deployment activities (BE emits flat rows).
- [x] 5.2 Add unit tests in `apps/ai-dial-admin/src/constants/grid-columns/tests/grid-columns.spec.ts` covering: Config view (expander + resource columns present, version absent), Config single-entity (expander + resource columns absent, activityType + activityId present), Deployments view (eight fields in the documented order, expander absent).

## 6. List utils for Deployments view

- [x] 6.1 Add `getDeploymentActivityAuditColumns(t, open)` in `apps/ai-dial-admin/src/components/ActivityAudit/List/utils.tsx`. It returns `[...ACTIVITY_AUDIT_COLUMNS(t, ActivityAuditView.Deployments), ACTION_COLUMN([getOpenInNewTabOperation(open)])]` — the only row action is `Open in new tab`. Also update `getActivityAuditColumns` to pass `ActivityAuditView.Config` + the `isSingleEntity` flag.
- [x] 6.2 Add a unit test in `apps/ai-dial-admin/src/components/ActivityAudit/List/tests/utils.spec.tsx` asserting the helper returns the deployment columns plus an action column with exactly one `open` operation.

## 7. List component — view-aware datasource and column branching

- [x] 7.1 In `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`, add `ActivityAuditView.Deployments` to the `activityViewOptions` array (between `Config` and the disabled `Asset`).
- [x] 7.2 Update the `gridDataSource` memo to branch on `activityViewType`: invoke `getDeploymentActivities` when the view is `Deployments`, otherwise keep `getActivities`. Add `activityViewType` to the memo's dependency list.
- [x] 7.3 When `activityViewType === ActivityAuditView.Deployments`, skip the `getProcessedActivityMap` / `fullActivityList` aggregation entirely and pass the response rows directly to `params.successCallback(res.data, ...)`.
- [x] 7.4 Swap the column set: use `getActivityAuditColumns(...)` for `Config`, `getDeploymentActivityAuditColumns(...)` for `Deployments` (only when no `entity` prop is set; the single-entity embedded path is unchanged).
- [x] 7.5 Conditionally hide the `Rollback` button: the existing condition `!entity && !isReadOnlyAdmin && activityViewType === ActivityAuditView.Config` already excludes `Deployments` (equality with `Config` is required).
- [x] 7.6 Add a `useEffect` keyed on `activityViewType` that, when the view changes, calls `gridApi?.setFilterModel(null)` and triggers `gridApi?.setGridOption('datasource', gridDataSource)` so the new request fires with cleared filters. Also resets `fullActivityList`.
- [x] 7.7 Scope the AG Grid column-state storage key per view via the existing `storageKey` prop on `ListView`.
- [x] 7.8 Memoize `columnDefs` via `useMemo` with `activityViewType`-aware deps; `gridDataSource` includes `isDeploymentsView` in deps.

## 8. Detail page dual-backend resolution

- [x] 8.1 ~~Update detail page to fall back to deployment-manager backend.~~ **Superseded** by scope change: detail page stays admin-only. `[id]/page.tsx` was reverted to its original implementation.
- [x] 8.2 ~~Render placeholder for deployment activities.~~ **Superseded**. `DeploymentAuditView.tsx` was removed.
- [x] 8.3 Detail page 404 behavior unchanged (no regression).
- [x] 8.4 ~~Add placeholder component test.~~ **Superseded**. `DeploymentAuditView.spec.tsx` was removed.
- [x] 8.5 Short-circuit both the row-body click (`onCellClicked`) and the `Open in new tab` callback (`openInNewTab`) when `activityViewType === Deployments`. The menu item is rendered as a visible affordance but its click is intentionally a no-op until the follow-up detail spec ships.
- [x] 8.6 Force `ListView` to remount on view change by adding `key={!entity ? activityViewType : void 0}`. Required because `GridView` (shared component) only initializes its internal `currentColDefs` state once and does not react to subsequent `columnDefs` prop changes — without the remount, switching views would keep stale columns.

## 9. Component tests for the List

- [x] 9.1 Add or extend `apps/ai-dial-admin/src/components/ActivityAudit/List/tests/List.spec.tsx` covering:
  - Default View is `Config` on initial render.
  - Selecting `Deployments` causes the next datasource call to invoke `getDeploymentActivities` (mock both server actions).
  - On view switch, the AG Grid filter model is cleared (`setFilterModel(null)` is called).
  - Rollback button is not rendered when view is `Deployments`.
  - The row-expander column is absent from the rendered header when view is `Deployments` (Parent ID is present but rendered empty).
- [x] 9.2 Reuse mocks from `apps/ai-dial-admin/test-setup.tsx`; do not introduce new ones unless strictly necessary, and do not use `data-testid` attributes.

## 10. Final quality pass

- [x] 10.1 Run `npm run lint` from the repo root and resolve any new findings introduced by the change. (0 errors; the 29 warnings are all pre-existing `@typescript-eslint/no-explicit-any` notices in files this change did not touch.)
- [x] 10.2 Run `npm run format:write` from the repo root. (No files needed reformatting.)
- [x] 10.3 Run `npm run test` from the repo root and ensure all tests pass. (4577 tests passing.)

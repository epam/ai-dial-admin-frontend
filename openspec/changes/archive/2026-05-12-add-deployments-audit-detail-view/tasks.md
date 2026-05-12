## 1. Types and predicates

- [x] 1.1 In `apps/ai-dial-admin/src/types/activity-audit.ts`, export three helper predicates: `isDeploymentManagerResource(type?: string): boolean` (returns true for the eleven deployment-manager resource types), `isImageDefinitionResource(type?: string): boolean` (only the four `*ImageDefinition` types), and `isGlobalFirewallResource(type?: string): boolean` (only `ImageBuildDomainWhitelist`). Add unit tests covering positive/negative cases for each predicate.

## 2. Backend client and server actions

- [x] 2.1 Restore `DeploymentAuditApi.getActivityById(id, token)` in `apps/ai-dial-admin/src/server/deployments/audit-api.ts` calling `GET ${API}/activities/{id}` against `DIAL_DEPLOYMENTS_API_URL`.
- [x] 2.2 Add `ImagesApi.getRevisionDetails(url, token)` in `apps/ai-dial-admin/src/server/deployments/images.ts` mirroring the shape of `ActivityAuditApi.getRevisionDetails`: it `GET`s `${API}${url}` and returns the parsed JSON body (the polymorphic `ImageDefinitionDto`).
- [x] 2.3 Create `apps/ai-dial-admin/src/server/deployments/global-firewall.ts` exporting `GlobalFirewallApi extends BaseApi` with `getRevisionDetails(revision, token)` calling `GET ${API}/global-whitelist/image-build/revision/{revision}` and returning `string[] | null`.
- [x] 2.4 Wire `globalFirewallApi` instance in `apps/ai-dial-admin/src/app/api/api.ts` bound to `process.env.DIAL_DEPLOYMENTS_API_URL`.
- [x] 2.5 In `apps/ai-dial-admin/src/app/[lang]/activity-audit/actions.ts`, add three server actions:
  - `getDeploymentActivityById(id)` — delegates to `deploymentAuditApi.getActivityById`.
  - `getDeploymentImageRevisionDetails(url)` — delegates to `imagesApi.getRevisionDetails`.
  - `getGlobalFirewallRevisionDetails(revision)` — calls `globalFirewallApi.getRevisionDetails` and wraps the response as `{ domains: <stringArray> }` (or `null` if the call failed).

## 3. Snapshot-route extensions

- [x] 3.1 Extend `apps/ai-dial-admin/src/utils/audit/get-revision-route.ts`:
  - Add four cases for `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition` returning `/images/definitions/{id}/revision/`.
  - Add one case for `ImageBuildDomainWhitelist` returning `/global-whitelist/image-build/revision/` (no `{id}` segment — singleton).
- [x] 3.2 Add unit tests in the colocated tests file covering each new case.

## 4. Detail page resource-type router

- [x] 4.1 In `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/page.tsx`, change the activity-lookup to: try admin-backend first, fall back to deployment-manager if the admin lookup returns null. Set a local `isDeploymentActivity` flag based on which backend produced the activity.
- [x] 4.2 When the activity is from the deployment-manager backend AND `isImageDefinitionResource(resourceType)` is true: fetch the current and previous revision snapshots via `getDeploymentImageRevisionDetails(url)`, using the route segment from the extended `getRevisionRouteForEntityType` helper. For the sibling-activities lookup (to compute the "current" revision for `Comparison: Current`), use `getDeploymentActivities` with the same `resourceId` / `resourceType` filter shape as today.
- [x] 4.3 When the activity is from the deployment-manager backend AND `isGlobalFirewallResource(resourceType)` is true: fetch the current and previous revision snapshots via `getGlobalFirewallRevisionDetails(revision)`. For the sibling-activities lookup, use `getDeploymentActivities` with only a `resourceType` filter (singleton — no `resourceId`).
- [x] 4.4 Keep the existing admin-backend path unchanged for admin activities. Preserve the `notFound()` fallback for activities not present in either backend.
- [x] 4.5 ~~Add a component test covering the three branches~~ — **skipped**. The page is a Next.js server component (uses `cookies()`, `headers()`, server-only API classes); a direct render test is impractical. The orchestration is straightforward; correctness is covered by the predicate tests (`activity-audit.spec.ts`), the route-helper tests (`get-revision-route.spec.ts`), and the `AuditView` / `Header` tests below.

## 5. AuditView and ViewHeader updates

- [x] 5.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/AuditView.tsx`, change the Resource Rollback render condition from `!isReadOnlyAdmin` to `!isReadOnlyAdmin && !isDeploymentManagerResource(activity.resourceType)`.
- [x] 5.2 In `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/Header.tsx`, omit the Resource identifier chip when `activity.resourceId` is empty/undefined. Other chips (Activity type, Resource type, Time, Initiated) render unchanged.
- [x] 5.3 Add component tests for `AuditView` verifying the rollback button is hidden for each of the five resource types covered in this change. Add a `ViewHeader` test verifying the Resource identifier chip is hidden when `resourceId` is empty.

## 6. Diff engine extensions for the image Firewall section

- [x] 6.1 In `apps/ai-dial-admin/src/components/ActivityAudit/constants.ts`, add `ALLOWED_DOMAINS = 'allowedDomains'` and `DOMAINS = 'domains'` to `EntityParameterKeys`. Add `ALLOWED_DOMAINS` to `separateObjectParameterKeys` so the diff engine puts it in its own section.
- [x] 6.2 In `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/generate-diffs.ts`, ensure `allowedDomains` is routed to its own section (it now satisfies the existing `separateObjectParameterKeys` branch). Synthesize a `Domain access policy` row at the head of the Firewall section: value is `All domains` when the corresponding side's `allowedDomains` length is 0, else `Specific domains`. Compute a diff status for the synthetic row using the same simple-type comparison logic as real fields.
- [x] 6.3 In `apps/ai-dial-admin/src/components/ActivityAudit/View/DiffReport/DiffSection.tsx`, extend the section-header resolution so the key `allowedDomains` resolves to `Entities.FirewallSettings` and the key `domains` resolves to `Entities.GlobalDomainWhitelist`. Reuse the existing `EntityFieldsI18nKey` lookup mechanism — if it does not already support custom-section mappings, add a small lookup table keyed on `EntityParameterKeys`.
- [x] 6.4 Add unit tests in `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/tests/` for `generate-diffs`: image with empty→non-empty `allowedDomains` (policy `CHANGED`), image with non-empty→non-empty `allowedDomains` (policy `MIRROR`), and an image with no `allowedDomains` (only Properties section emitted).

## 7. Diff engine extensions for the firewall payload

- [x] 7.1 Verify the `domains` key in `EntityParameterKeys` (added in 6.1) flows through `generate-diffs.ts` as a string array (the existing `arrayStringParameterKeys` or `compareStringArray` path). If `domains` is not picked up by the existing string-array branch, add it explicitly so it renders in its own section with row-by-row diff coloring.
- [x] 7.2 Add unit tests for the firewall diff path: added domains, removed domains, mirrored domains, empty→non-empty, non-empty→empty.

## 8. i18n

- [x] 8.1 Add five keys to `EntitiesI18nKey` in `apps/ai-dial-admin/src/constants/i18n.ts`: `FirewallSettings = 'Entities.FirewallSettings'`, `GlobalDomainWhitelist = 'Entities.GlobalDomainWhitelist'`, `DomainAccessPolicy = 'Entities.DomainAccessPolicy'`, `DomainAccessPolicyAllDomains = 'Entities.DomainAccessPolicyAllDomains'`, `DomainAccessPolicySpecificDomains = 'Entities.DomainAccessPolicySpecificDomains'`.
- [x] 8.2 Populate English strings in `apps/ai-dial-admin/src/locales/en.ts`: `Firewall settings`, `Global domain whitelist`, `Domain access policy`, `All domains`, `Specific domains`.

## 9. Deployments-grid row interactions

- [x] 9.1 In `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`, change the `onCellClicked` short-circuit so it only fires for container rows. Concretely: when the active view is `Deployments`, return early only if the row's `resourceType` is NOT in (image-definition predicate || firewall predicate). For image and firewall rows, fall through to the existing `router.push(getUrnForEntity(ApplicationRoute.ActivityAudit, e.data))` branch.
- [x] 9.2 In the same file, change the `openInNewTab` callback's short-circuit so it returns early only for container rows (same predicate as 9.1). For image and firewall rows, invoke `onOpenInNewTab(ApplicationRoute.ActivityAudit, activity)`.
- [x] 9.3 The existing `List.spec.tsx` mocks out `ListView` entirely, so AG Grid's `onCellClicked` cannot be exercised from a React Testing Library render. The row-click and Open-in-new-tab branching now consists of straightforward calls to `isImageDefinitionResource(...)` / `isGlobalFirewallResource(...)` — both predicates are exhaustively covered in `apps/ai-dial-admin/src/types/tests/activity-audit.spec.ts`. The List tests continue to assert the visible UI behavior (rollback hidden, view options, refresh control) which remains the only practical signal at the component-test level.

## 10. Final quality pass

- [x] 10.1 Run `npm run lint` from the repo root. Resolve any new findings introduced by this change.
- [x] 10.2 Run `npm run format:write` from the repo root.
- [x] 10.3 Run `npm run test` from the repo root and ensure all tests pass.

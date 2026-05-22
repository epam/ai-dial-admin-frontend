## 1. Verify Backend Contract

- [x] 1.1 Read the merged controllers in the backend repo (`DeploymentController`, `ImageDefinitionController`, `GlobalDomainWhitelistController` — see PR #327) and confirm the exact rollback URLs, HTTP methods, and request bodies.
  - Container deployment: `POST {API}/deployments/{id}/revision/{revision}/rollback` → `DeploymentDto`, no body.
  - Image definition: `POST {API}/images/definitions/{id}/revision/{revision}/rollback` → `ImageDefinitionDto`, no body.
  - Global whitelist: `POST {API}/global-whitelist/image-build/revision/{revision}/rollback` → `List<String>`, no body.
  - All POST, no request body, `@FullAdminOnly` (HTTP 403 for read-only).
- [x] 1.2 Capture the confirmed shapes inline (as comments next to each new API method) so the spec and implementation match.

## 2. API Layer

- [x] 2.1 In `apps/ai-dial-admin/src/server/deployments/containers.ts`, add `rollbackToRevision(id: string, revision: number, token: Token): Promise<ServerActionResponse>` to `ContainersApi`. URL per §1.
- [x] 2.2 In `apps/ai-dial-admin/src/server/deployments/images.ts`, add `rollbackToRevision(id: string, revision: number, token: Token): Promise<ServerActionResponse>` to `ImagesApi`. URL per §1.
- [x] 2.3 In `apps/ai-dial-admin/src/server/deployments/global-firewall.ts`, add `rollbackToRevision(revision: number, token: Token): Promise<ServerActionResponse>` to `GlobalFirewallApi`. URL per §1.

## 3. Server Actions

- [x] 3.1 Add `rollbackContainerToRevision(id: string, revision: number)` server action (`'use server'`, `getUserToken()`, delegate to `containersApi.rollbackToRevision`).
- [x] 3.2 Add `rollbackImageDefinitionToRevision(id: string, revision: number)` server action.
- [x] 3.3 Add `rollbackImageBuildWhitelistToRevision(revision: number)` server action.
- [x] 3.4 Co-located all three in `apps/ai-dial-admin/src/app/actions/deployments.ts` alongside the existing `containersApi` / `imagesApi` / `globalFirewallApi` actions — that file is the canonical home for every deployment-manager server action in this repo. The config-entity rollback dispatcher imports config actions from `[lang]/<entity>/actions.ts`, but deployment-manager entities don't follow that per-route convention; their actions live in the shared file.

## 4. Live-Status Fetch in Detail Data

- [x] 4.1 In `apps/ai-dial-admin/src/utils/audit/get-activity-audit-detail-data.ts`, extend `ActivityAuditDetailData` with `currentResourceStatus?: string`.
- [x] 4.2 For container-deployment activities, additionally call `containersApi.getContainer(activity.resourceId, token)` in parallel with the existing snapshot fetches; extract `.status` into `currentResourceStatus`.
- [x] 4.3 For image-definition activities, additionally call `imagesApi.getImage(activity.resourceId, token)`; extract `.buildStatus` into `currentResourceStatus`.
- [x] 4.4 Leave `currentResourceStatus` undefined for whitelist activities and all non-deployment-manager activities.
- [x] 4.5 Wrap each extra fetch in a try/catch (or `.catch(() => null)`) so a transient failure doesn't blow up the page; log via `errorObjLog`. The button stays enabled in that case.
- [x] 4.6 Update both consuming pages to pass `currentResourceStatus` through to `AuditView`:
  - `apps/ai-dial-admin/src/app/[lang]/activity-audit/[id]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/adapter-containers/[id]/[subId]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/application-containers/[id]/[subId]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/interceptor-containers/[id]/[subId]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/mcp-containers/[id]/[subId]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/model-servings/[id]/[subId]/page.tsx`
  - `apps/ai-dial-admin/src/app/[lang]/deployment-images/[id]/[subId]/page.tsx`

## 5. Rollback Dispatcher

- [x] 5.1 In `apps/ai-dial-admin/src/utils/audit/get-rollback-request.ts`, add a branch at the top of `rollbackEntityPerRevision`: when `isDeploymentManagerResource(activity.resourceType)`, dispatch to the new deployment-manager rollback path with `activity.resourceId` and the target revision number. Skip the `activityType` create/update/delete switch entirely for these types.
- [x] 5.2 Implement a helper `rollbackDeploymentManagerResource(activity, targetRevision)` that selects the right server action by `isContainerDeploymentResource` / `isImageDefinitionResource` / `isGlobalFirewallResource` and calls it with the appropriate id + revision. Target revision is `activity.revision - 1` (the revision being restored); chose this over reading `previousRevision.revision` because `previousRevision` is an opaque snapshot Record without a guaranteed revision field — `activity.revision - 1` is what the existing `rollbackEntityPerType` already uses.
- [x] 5.3 Added the same branch defensively at the top of `rollbackEntityPerType`. Today it is only reached from the Config activity-list row action (deployment-manager rows have no rollback row action), but the branch makes the dispatcher safe if that ever changes.

## 6. AuditView — Unhide + Disable

- [x] 6.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/AuditView.tsx`, accept a new optional prop `currentResourceStatus?: string`.
- [x] 6.2 Remove the `!isDeploymentManagerResource(activity.resourceType)` exclusion at line 165 — render the button for all non-read-only admins.
- [x] 6.3 Compute a `rollbackBlock` value for deployment-manager activities (positive allow-lists `CONTAINER_ROLLBACK_ALLOWED_STATUSES` and `IMAGE_ROLLBACK_ALLOWED_STATUSES`; whitelist is never blocked; non-deployment-manager paths untouched).
- [x] 6.4 Render disabled button wrapped in `DialTooltip` when blocked; plain enabled button otherwise.
- [x] 6.5 `rollbackDisabledTooltip` is undefined when `currentResourceStatus` is undefined (live-fetch failed) — button stays enabled.

## 7. Redirect Mapping

- [x] 7.1 In `apps/ai-dial-admin/src/components/ActivityAudit/View/utils/get-rollback-redirect-href.ts`, add cases for: `ADAPTER_DEPLOYMENT` → `AdapterContainers`, `APPLICATION_DEPLOYMENT` → `ApplicationContainers`, `INTERCEPTOR_DEPLOYMENT` → `InterceptorContainers`, `MCP_DEPLOYMENT` → `McpContainers`, `NIM_DEPLOYMENT` → `ModelServings`, `INFERENCE_DEPLOYMENT` → `ModelServings`, and all four `*_IMAGE_DEFINITION` → `Images`.
- [x] 7.2 Leave `IMAGE_BUILD_DOMAIN_WHITELIST` to fall through to the `ActivityAudit` default.

## 8. Notification Copy

- [x] 8.1 Extended `rollbackEntityMap` with the 6 container deployments → `Deployment`, 4 image definitions → `ImageDefinition`, and the whitelist → `ImageBuildDomainWhitelist`. All four notification helpers (`getRollbackSuccessTitle` / Description / `getRollbackErrorTitle` / Description) now resolve via the map.

## 9. Translations

- [x] 9.1 Added `DisabledDeploymentTooltip` and `DisabledImageDefinitionTooltip` to `RollbackI18nKey`.
- [x] 9.2 Added matching strings under `Rollback.Disabled.*` in `en.ts`.
- [x] 9.3 Added three entity-label keys (`Deployment`, `ImageDefinition`, `ImageBuildDomainWhitelist`) to `RollbackI18nKey` and their strings to `Rollback.Entities.*` in `en.ts`.

## 10. Tests

- [x] 10.1 Added `get-rollback-request-dispatch.spec.ts` covering all 6 container types, all 4 image-definition types, the whitelist, and a config-entity sanity case for both `rollbackEntityPerRevision` and `rollbackEntityPerType`.
- [x] 10.2 Extended `get-rollback-redirect-href.spec.ts` with mappings for all 6 deployment types, all 4 image-definition types, and the whitelist fall-through.
- [x] 10.3 Added `get-activity-audit-detail-data.spec.ts` mocking `containersApi.getContainer` and `imagesApi.getImage`; covers status populated for container / image-definition, undefined for whitelist + config, and undefined on live-fetch failure.
- [x] 10.4 Extended `AuditView.spec.tsx` with all seven button states (existing `MODEL` enabled test retained; new tests for `STOPPED`/`RUNNING` deployment, `BUILD_FAILED`/`BUILDING`/`BUILT` image-def, whitelist always-enabled, and the live-fetch-failure → enabled case).
- [x] 10.5 Added rollback-URL POST tests to `containers.spec.ts`, `images.spec.ts`, and a new `global-firewall.spec.ts` for each API class method. Server actions are thin wrappers (3 lines each) over the API class methods and `getUserToken` — the API-class tests prove the URL contracts; the dispatcher test proves the actions are wired up.

## 11. Quality Checks

- [x] 11.1 `npm run lint` clean. Only 30 pre-existing `@typescript-eslint/no-explicit-any` warnings across unrelated files; no new errors or warnings from this change.
- [x] 11.2 `npm run format` clean.
- [x] 11.3 `npm run test` (run from `apps/ai-dial-admin/`) green — 499/500 files pass, 1 file skipped (pre-existing), 5026 tests pass, 9 skipped (pre-existing).

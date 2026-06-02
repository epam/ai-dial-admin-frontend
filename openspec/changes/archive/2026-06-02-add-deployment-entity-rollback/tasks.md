## 1. Server API — rollback endpoints

- [x] 1.1 `src/server/deployments/containers.ts`: add `CONTAINER_ROLLBACK_URL = (id, revision) => `${BASE_CONTAINERS_URL}/${id}/revision/${revision}/rollback`` and `rollbackContainer(id, revision, token): Promise<ServerActionResponse>` doing `postAction(CONTAINER_ROLLBACK_URL(id, revision), {}, token)`
- [x] 1.2 `src/server/deployments/images.ts`: add `IMAGE_ROLLBACK_URL = (id, revision) => `${IMAGES_URL}/${id}/revision/${revision}/rollback`` and `rollbackImage(id, revision, token): Promise<ServerActionResponse>`
- [x] 1.3 `src/server/deployments/global-firewall.ts`: add `GLOBAL_FIREWALL_ROLLBACK_URL = (revision) => `${GLOBAL_FIREWALL_BASE_URL}/revision/${revision}/rollback`` and `rollbackWhitelist(revision, token): Promise<ServerActionResponse>` (no id segment)
- [x] 1.4 Confirmed `containersApi.getContainer(id)` returns `status` and `imagesApi.getImage(id)` returns `buildStatus` — no new getters needed

## 2. Server actions

- [x] 2.1 `src/app/actions/deployments.ts`: added `'use server'` actions `rollbackDeploymentContainer(id, revision)`, `rollbackDeploymentImage(id, revision)`, `rollbackDeploymentWhitelist(revision)` (placed in the existing deployment actions file, not activity-audit/actions.ts, since they use `containersApi`/`imagesApi`/`globalFirewallApi`)
- [x] 2.2 Added `getDeploymentEntityState(resourceType, id): DeploymentEntityState | null` (routes to container/image GET; null for whitelist) + `getDeploymentRevisionDetails(resourceType, id, revision)` for the recreate snapshot fetch (deployment backend, since the existing `getRevisionDetails` action hits the admin backend). New model `src/models/deployments/rollback.ts`.

## 3. Snapshot → create-DTO mapper

- [x] 3.1 Created `src/utils/audit/build-create-body-from-snapshot.ts`: pure, non-mutating; KEEPs config fields incl. `$type` and raw `source`; DROPs `id`/`createdAt`/`updatedAt` plus `status`/`url`/`author` (containers) and `status`/`buildStatus` (images), selected by resource family
- [x] 3.2 Tests `src/utils/audit/tests/build-create-body-from-snapshot.spec.ts`: keeps `$type`; drops server-managed/runtime fields; preserves raw internal-image `source`; passes through null secure env values; no input mutation

## 4. Rollback dispatch util

- [x] 4.1 Created `src/utils/audit/get-deployment-rollback-request.ts`: `rollbackDeploymentEntity(activity)` (self-fetches the snapshot it needs rather than taking `previousRevision`, so both List and AuditView call it identically) dispatching on `activityType` with `R = revision − 1` — `Update` → rollback endpoint; `Create` → delete; `Delete` → create with `buildCreateBodyFromSnapshot`; whitelist → `rollbackDeploymentWhitelist(R)` regardless of type
- [x] 4.2 Added `getDeploymentRollbackAction` / `getDeploymentCreateAction` / `getDeploymentDeleteAction` helpers (sibling to `get-rollback-request.ts`)
- [x] 4.3 Tests `src/utils/audit/tests/get-deployment-rollback-request.spec.ts`: Update→rollback endpoint at `revision−1`; Create→delete (container by name, image by id); Delete→create with mapped body; whitelist→whitelist rollback without id

## 5. Lifecycle pre-check gate

- [x] 5.1 Created `src/utils/audit/get-rollback-block-reason.ts`: container blocked on `PENDING/RUNNING/FAILED(crashed)/STOPPING`; image blocked on `BUILDING/BUILT(build_successful)`; whitelist never blocked; returns the i18n key or null
- [x] 5.2 Tests `src/utils/audit/tests/get-rollback-block-reason.spec.ts`: blocked/allowed per status; whitelist always allowed; null state returns null

## 6. AuditView wiring (detail view)

- [x] 6.1 `AuditView.tsx`: routes rollback through `rollbackDeploymentEntity` when `isDeploymentManagerResource`; recreate (`Delete`) shows the secure-values re-supply hint; keeps existing notification + redirect
- [x] 6.2 Renders the Resource Rollback button for deployment-manager types; fetches current state on load for container/image `Update` and disables the button with a tooltip when blocked; whitelist/non-Update render enabled
- [x] 6.3 Pre-check runs in a guarded `useEffect` keyed on `resourceType`/`resourceId` (no refetch on diff-control toggles)

## 7. List wiring (Deployments view — main menu)

- [x] 7.1 `List/utils.tsx`: `getDeploymentActivityAuditColumns` accepts `resourceRollback` and appends `getResourceRollbackOperation` (suppressed on parent/aggregate rows); doc comment updated
- [x] 7.2 `List.tsx`: deployment view passes `onOpenConfirmationModal` as the rollback handler (gated by `isReadOnlyAdmin`); confirm branches to `rollbackDeploymentEntity` for deployment-manager activities, reusing notifications + refresh
- [x] 7.3 System-level header `Rollback` button remains Config-view only (unchanged)

## 8. Confirmation modal pre-check

- [x] 8.1 Implemented inline in `List.tsx` (the list's `DialConfirmationPopup`): on open for a container/image `Update`, fetch current state and on block show the explanation (`text-error`) + `disableConfirmButton`
- [x] 8.2 `isCheckingState` disables confirm while the fetch is in flight; fetch failure clears the block (backend 400 governs)

## 9. i18n

- [x] 9.1 `src/constants/i18n.ts`: added `BlockedActiveDeployment`, `BlockedImageBuilding`, `NotificationSuccessRecreateDescription`, and entity labels `Deployment`/`ImageDefinition`/`GlobalWhitelist`
- [x] 9.2 `src/locales/en.ts`: added English values for all new keys
- [x] 9.3 `src/utils/entities/rollback-entity.ts`: extended `rollbackEntityMap` to cover the six container, four image-definition, and whitelist resource types

## 10. Tests & verification

- [x] 10.1 `AuditView.spec.tsx` rewritten for the new behavior: rollback rendered for deployment-manager types; disabled while building/active; enabled when inactive; whitelist ungated
- [x] 10.2 `List/tests/utils.spec.tsx`: added case asserting the `Rollback` action is appended when a handler is provided
- [x] 10.3 `npx nx lint ai-dial-admin` clean (no errors); 757 tests pass across `ActivityAudit`, `utils/audit`, `utils/entities`, `server/deployments`, `app/actions`

## 11. Post-rollback navigation

- [x] 11.1 `get-rollback-redirect-href.ts`: rewritten to resolve entity detail hrefs via `auditResourceRoute` (covers admin + deployment-manager types), falling back to the audit list
- [x] 11.2 New `components/ActivityAudit/View/utils/get-rollback-navigation.ts`: `getRollbackNavigation(activityType, resourceType, resourceId, isEntityContext)` → `{ target, entityListHref, entityDetailHref, auditView }`; Create→audit-list/entity-list, Delete→entity-detail, Update→audit-list/refresh; fallbacks when no entity route
- [x] 11.3 `AuditView.tsx` and `List.tsx`: route post-rollback navigation through the helper; AuditView pushes (saving the `AuditListPreselect` view before going to the audit list), List reloads in place for the audit-list target and `router.refresh()` for the entity-tab refresh
- [x] 11.4 View-type preserved via extended `AuditListPreselect` (`Config`/`Deployments`), consumed + cleared once on list mount; time period intentionally not preserved (investigation showed the detail page opens in a separate tab and never held the list's period — global persistence rejected)
- [x] 11.5 Tests: `get-rollback-navigation.spec.ts` + extended `get-rollback-redirect-href.spec.ts` with deployment-manager + fallback cases; lint clean; audit/util tests pass
- [x] 11.6 Recreated-entity detail href: `getRollbackNavigation` takes the create response entity (`res.response`) and builds the `EntityDetail` href via `getUrnForEntity`, so image definitions navigate to their NEW backend-assigned id instead of the stale `resourceId` (containers/servings are name-keyed and resolve the same either way)

## Why

Backend PR #327 (https://github.com/epam/ai-dial-admin-deployment-manager-backend/pull/327) added per-resource rollback endpoints for the three deployment-manager resources — **container deployments**, **image definitions**, and the global **image-build domain whitelist** — restoring a chosen audit revision in one call. The frontend already has the per-revision "Rollback resource" button on `AuditView`, but it is intentionally hidden for deployment-manager resource types (`AuditView.tsx:165` — `!isDeploymentManagerResource(...)`) because no per-entity rollback endpoint existed before. With PR #327 merged, that exclusion is the only thing blocking users from rolling back these resources from the existing audit detail page (`/activity-audit/[id]` and the per-entity audit tabs).

The rollback flow for these resources must **not** go through `SystemRollback` — that flow is explicitly multi-entity / cross-cutting and the backend was designed to make each deployment-manager rollback target a single resource with no cascade.

## What Changes

- **Unhide the Rollback button** for deployment-manager resource types on `AuditView`. One guard removed in `AuditView.tsx`. This single change covers every entry point: the `/activity-audit/[id]` detail page and the per-entity audit tabs on `/adapter-containers/[id]/[subId]`, `/application-containers/[id]/[subId]`, `/interceptor-containers/[id]/[subId]`, `/mcp-containers/[id]/[subId]`, `/model-servings/[id]/[subId]`, `/deployment-images/[id]/[subId]`.
- **Status-gated disable with tooltip.** Backend rejects rollback when:
  - a deployment is anything other than `NOT_DEPLOYED` / `STOPPED` (i.e. live or transitioning), or
  - an image definition is `BUILDING` / `BUILD_SUCCESSFUL`.
  When the current resource is in a blocking state, the button is **disabled** with a tooltip explaining the required precondition (e.g. *"Undeploy this deployment before rolling back."*). Whitelist rollback is never blocked. No proactive UI for the side effects (env-var secrets nulled, build status reset, identical-state no-op) — backend will succeed and we show a success toast.
- **New per-resource rollback API wiring.** Three new endpoint calls behind `ContainersApi.rollbackToRevision`, `ImagesApi.rollbackToRevision`, `GlobalFirewallApi.rollbackToRevision`, exposed via three server actions. `rollbackEntityPerRevision` branches on `isDeploymentManagerResource(type)` and calls the dedicated endpoint instead of the existing create/update/delete replay path.
- **Current-status plumbing.** Extend `getActivityAuditDetailData` to additionally `GET` the live resource (`containersApi.getContainer(id)` for container deployments, `imagesApi.getImage(id)` for image definitions) for deployment-manager activities and return its status alongside `entity`. `AuditView` reads this to decide disabled/tooltip state. The whitelist needs no fetch.
- **Redirect after success.** Extend `getRollbackRedirectHref` with cases for the six container deployment types (→ their respective container detail routes) and the four image-definition types (→ `/deployment-images/{id}`). The whitelist has no entity page and falls back to `/activity-audit` (current default behaviour).

## Non-goals

- **No row-level rollback action in the Deployments audit list.** `getDeploymentActivityAuditColumns` deliberately exposes only "Open in new tab" today; we keep it that way. Users open the per-revision detail view and roll back from there. This matches the backend's deliberate one-resource-at-a-time stance.
- **No SystemRollback inclusion.** Deployment-manager types stay out of `SYSTEM_ROLLBACK_ENTITIES`. The system-rollback "rebuild whole config to revision N" flow is not extended.
- **No proactive UI for side effects.** We do not show messaging about sensitive env-var values being nulled out, image build status resetting to `NOT_BUILT`, or whitelist identical-state no-ops. Successful rollback shows the standard success notification.
- **No changes to the per-entity activity grids** beyond what unhiding the AuditView button transitively enables.
- **No new error-message copy.** Backend 4xx responses are surfaced via the existing `getRollbackErrorTitle`/`getRollbackErrorDescription` helpers.

## Capabilities

### New Capabilities

- `audit-rollback-deployment-resources`: per-resource rollback of container deployments, image definitions, and the global image-build domain whitelist from the activity-audit detail view, with status-gated availability and post-rollback redirect.

## Impact

- **Components**: `ActivityAudit/View/AuditView.tsx` (drop deployment-manager exclusion; read current status; disable+tooltip).
- **Routing/utils**: `utils/audit/get-rollback-request.ts` (branch for deployment-manager types), `components/ActivityAudit/View/utils/get-rollback-redirect-href.ts` (new cases), `utils/audit/get-activity-audit-detail-data.ts` (fetch live resource status).
- **API layer**: `server/deployments/containers.ts`, `server/deployments/images.ts`, `server/deployments/global-firewall.ts` (new `rollbackToRevision` methods).
- **Server actions**: new actions in `app/[lang]/activity-audit/actions.ts` (or co-located deployment-manager actions) wrapping the three API methods.
- **Types**: no new enums; reuses existing `CONTAINER_STATUS`, `IMAGE_STATUS`, and `ActivityAuditResourceType` predicates.
- **i18n**: new `RollbackI18nKey` entries for the two disabled-state tooltips (`DisabledDeploymentTooltip`, `DisabledImageDefinitionTooltip`) plus corresponding `en.ts` strings.
- **Tests**: unit tests for the rollback request branch, redirect helper additions, and detail-data status fetch; component test for AuditView button enabled/disabled/hidden states across the new resource types.

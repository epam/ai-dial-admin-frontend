## Why

Deployment-manager entities (container deployments, image definitions, and the global domain whitelist) have full audit history and diff views, but no way to roll an entity back to a past revision — rollback was deliberately hidden for these types when the Deployments audit view shipped. The deployment-manager backend now exposes a per-resource rollback endpoint (`POST /{id}/revision/{revision}/rollback`), so we can finally let admins restore a deployment, image definition, or whitelist to a prior state directly from the audit list and the audit detail view.

## What Changes

- **New rollback orchestration for deployment-manager entities** — a dispatch util that reverts the viewed activity by restoring the entity to the state immediately before it (target revision `R = activity.revision − 1`), choosing the strategy from the activity type:
  - `Update` → call the new backend rollback endpoint `POST /{id}/revision/{R}/rollback` (backend applies Envers point-in-time semantics, preserves immutable fields, nulls sensitive env values, resets build status).
  - `Create` → `DELETE` the entity (it did not exist at `R`).
  - `Delete` → recreate the entity via the existing create endpoint, with a body rebuilt from the `R` snapshot.
- **Three new server API methods** — container rollback (`/deployments/{id}/revision/{R}/rollback`), image-definition rollback (`/images/definitions/{id}/revision/{R}/rollback`), and whitelist rollback (`/global-whitelist/image-build/revision/{R}/rollback`, no id — singleton, full replacement).
- **`$type`-aware create-body mapper** — for the `Delete` (recreate) scenario, transform the revision snapshot into a valid create DTO: keep config fields (`$type`, `source`, `metadata.envs`, resources, scaling, …), drop server-managed/runtime fields (`id`, `createdAt`, `updatedAt`, `status`, `url`, `author`). Distinct from the diff layer's display hidden-key sets, which strip `$type` (required by create).
- **Lifecycle pre-check gate** for the `Update` → rollback path — fetch the entity's current `status` (deployments) / `buildStatus` (image definitions); when active (`PENDING/RUNNING/CRASHED/STOPPING`) or building (`BUILDING/BUILD_SUCCESSFUL`), block rollback and explain why. In `AuditView` (single entity) the rollback control is disabled with a tooltip; in the list the check is deferred to the confirmation modal. The whitelist has no lifecycle constraint.
- **Re-enable rollback affordances in the Deployments audit view** — restore the per-row `Rollback` action and the `AuditView` Resource Rollback button for deployment-manager resource types (reversing the current "hidden" behavior). The system-level rollback button stays hidden for Deployments.

## Capabilities

### New Capabilities
- `deployment-entity-rollback`: Activity-type dispatch (`Create`→delete, `Delete`→recreate-from-snapshot, `Update`→backend rollback endpoint) at target revision `R = revision − 1`; the three new server rollback endpoints (container, image-definition, whitelist); the `$type`-aware snapshot→create-DTO mapper for the recreate scenario; the lifecycle pre-check gate; and the success/error notifications keyed by deployment-manager resource type.

### Modified Capabilities
- `activity-audit-deployments-view`: The per-row action menu gains a `Rollback` action for deployment-manager resource types (previously the menu was Open-in-new-tab only, and rollback was explicitly hidden). The system-level header `Rollback` button remains hidden in the Deployments view.
- `activity-audit-deployments-detail`: The `AuditView` Resource Rollback button is rendered for the eleven deployment-manager resource types (previously suppressed), gated by the lifecycle pre-check rather than unconditionally hidden.

## Impact

### Code
- **Modified server API**: `src/server/deployments/containers.ts`, `src/server/deployments/images.ts`, `src/server/deployments/global-firewall.ts` — add rollback methods + URL builders.
- **Modified actions**: `src/app/[lang]/activity-audit/actions.ts` (and/or deployment entity actions) — expose the rollback server actions and a current-state fetch for the pre-check.
- **New util**: `src/utils/audit/get-deployment-rollback-request.ts` — dispatch by activity type (sibling to `get-rollback-request.ts`); `src/utils/audit/build-create-body-from-snapshot.ts` — the `$type`-aware mapper.
- **Modified util**: `src/utils/audit/get-revision-route.ts` — rollback route builders if not already derivable.
- **Modified components**:
  - `components/ActivityAudit/View/AuditView.tsx` — render + gate rollback for deployment-manager types.
  - `components/ActivityAudit/List/utils.tsx` — `getDeploymentActivityAuditColumns` gains the rollback row action.
  - `components/ActivityAudit/List/List.tsx` — wire the deployment rollback handler + confirmation modal pre-check.
  - `components/ActivityAudit/Modals/Confirmation.tsx` — show the lifecycle-blocked explanation / disabled confirm.
- **i18n**: `src/constants/i18n.ts` + `src/locales/en.ts` — rollback success/error titles + descriptions and lifecycle-blocked messages for deployment-manager resource types.

### APIs consumed (BE-provided)
- `POST /api/v1/deployments/{id}/revision/{revision}/rollback`
- `POST /api/v1/images/definitions/{id}/revision/{revision}/rollback`
- `POST /api/v1/global-whitelist/image-build/revision/{revision}/rollback`
- existing: `DELETE /deployments/{id}`, `DELETE /images/definitions/{id}`, `POST /deployments`, `POST /images/definitions`, `GET /deployments/{id}/revision/{R}`, `GET /images/definitions/{id}/revision/{R}`, `GET /deployments/{id}` & `GET /images/definitions/{id}` (current-state pre-check).

### Non-goals
- **System-wide rollback** stays unchanged; this is per-entity only.
- **Admin/config entity rollback** (`rollbackEntityPerRevision`/`rollbackEntityPerType`) is untouched.
- **Delete-while-active handling** for the `Create`→DELETE path: no frontend pre-check; the backend owns that rule and the UI surfaces whatever it returns.
- **Restoring secure env values** on recreate: snapshots return them masked/null; operators re-supply before deploy (matches backend spec).
- **Auto re-deploy** after rollback: out of scope; the operational flow remains undeploy → rollback → deploy, performed manually.
## Context

The activity-audit subsystem already supports a per-revision **Rollback resource** button on `AuditView` (`apps/ai-dial-admin/src/components/ActivityAudit/View/AuditView.tsx`). For "config" resource types (models, applications, adapters, routes, roles, keys, etc.) the rollback is *replayed* client-side: `rollbackEntityPerRevision` looks at the activity's `activityType` (Create / Update / Delete) and calls the appropriate create / update / remove server action with the previous revision payload.

Deployment-manager resources — container deployments, image definitions, and the global image-build domain whitelist — had no equivalent flow. The Rollback button was therefore hidden when `isDeploymentManagerResource(activity.resourceType)`. Backend PR #327 adds dedicated rollback endpoints for those three resources with strict status preconditions, and this change wires the existing UI surface to them.

The detail page already loads two pieces of data we'll lean on:

- `activity` + `activityRevision` + `previousRevision` (the audit-history snapshots).
- `entity` — the **latest audit revision snapshot** (not the live runtime resource). For deployment-manager types this is *not* enough to decide whether rollback is currently allowed: deployment runtime status (`DEPLOYED`, `STOPPING`, etc.) and image build status (`BUILDING`, `BUILD_SUCCESSFUL`) live on the live resource, not on the latest audit revision. We therefore need an extra live-state fetch.

## Goals / Non-Goals

**Goals**

- Unblock the existing Rollback button for deployment, image-definition, and image-build-domain-whitelist activities at a single site (`AuditView`).
- Route the call to the new per-resource rollback endpoints (no CRUD replay).
- Block the button — disabled, with tooltip — when the live resource is in a state the backend will reject (deployment not in `NOT_DEPLOYED` / `STOPPED`; image not in `NOT_BUILT` / `BUILD_FAILED` / `BUILD_STOPPED`).
- After a successful rollback, redirect entity-context activities to the resource's detail page (same pattern as config entities); non-entity activities fall back to the activity-audit list.

**Non-Goals**

- No surfacing of side effects (env-var nulls, build status reset, identical-state no-op).
- No row-level rollback action on the Deployments audit grid.
- No inclusion in `SystemRollback` / `SYSTEM_ROLLBACK_ENTITIES`.
- No new "Deployments" tab UX or audit list changes beyond what the unhide transitively enables on the existing detail pages.

## Decisions

### 1. One unhide site

**Decision**: Remove the `!isDeploymentManagerResource(activity.resourceType)` guard on `AuditView.tsx:165` and replace it with a `disabled` prop driven by the live-status check.

**Why**: Every entry point — the `/activity-audit/[id]` detail page, the per-entity audit tabs on `/adapter-containers/[id]/[subId]`, `/application-containers/[id]/[subId]`, `/interceptor-containers/[id]/[subId]`, `/mcp-containers/[id]/[subId]`, `/model-servings/[id]/[subId]`, `/deployment-images/[id]/[subId]` — funnels through this single component. One change unhides everywhere.

### 2. Branch in the rollback action dispatcher

**Decision**: Extend `rollbackEntityPerRevision` so that when `isDeploymentManagerResource(activity.resourceType)` is true, it skips the existing create/update/delete logic entirely and calls a new dedicated server action with the activity's `resourceId` and the revision number (`previousRevision`'s revision, i.e. the target revision being restored).

```
if (isDeploymentManagerResource(activity.resourceType)) {
  return rollbackDeploymentResource(activity, /* targetRevision */);
}
// existing CRUD-replay path
```

**Why**: The two flows have different semantics. Config rollback replays the previous state via CRUD. Deployment-manager rollback is a single state-replacement call. They share the UI but not the request shape.

### 3. New API methods + server actions

**Decision**: Add `rollbackToRevision(id, revision, token)` methods to the three API classes and three server actions wrapping them. URLs confirmed against the merged backend controllers:

```
POST /deployments/{id}/revision/{revision}/rollback              → ContainersApi.rollbackToRevision
POST /images/definitions/{id}/revision/{revision}/rollback       → ImagesApi.rollbackToRevision
POST /global-whitelist/image-build/revision/{revision}/rollback  → GlobalFirewallApi.rollbackToRevision
```

All three are POST, return the rolled-back resource representation, take no request body, and are gated by `@FullAdminOnly` (HTTP 403 for read-only).

**Why**: Each lives next to that resource's other APIs. URL shape mirrors the existing `revision/{revision}` GET routes, with `/rollback` appended as the action verb.

### 4. Live-status fetch path

**Decision**: Extend `getActivityAuditDetailData` to, when the activity is a container deployment or image definition, additionally fetch the live resource and return its status alongside the existing `entity` field. The whitelist needs no fetch (rollback is never blocked).

Return shape grows by one optional field:

```typescript
interface ActivityAuditDetailData {
  activity: DialActivity | null;
  activityRevision: ActivityAuditEntity | null;
  previousRevision: ActivityAuditEntity | null;
  entity: BaseEntity | undefined;
  currentResourceStatus?: string; // CONTAINER_STATUS | IMAGE_STATUS | undefined
}
```

Implementation:
- Container deployment activities → `containersApi.getContainer(activity.resourceId, token)` → read `.status`.
- Image-definition activities → `imagesApi.getImage(activity.resourceId, token)` → read `.buildStatus`.
- Other activities (including whitelist) → leave undefined.

The fetch runs in parallel with the existing `Promise.all` so it doesn't add a round-trip in series. Failures are non-fatal: a missing status leaves the rollback button enabled (the backend remains the authoritative gate).

**Why**: Pages are rendered with `dynamic = 'force-dynamic'`; this is a server component fetch with the same auth token already in play. No client-side flicker, no loading state on the button. The alternative (client-side fetch in `AuditView`) requires a loading state and a 'use client' refactor of more logic — not worth it for a single extra GET.

### 5. Disabled-state UX

**Decision**: When the current status blocks rollback, render the same `DialNeutralButton` with `disabled={true}` and an accompanying tooltip via `DialEllipsisTooltip` or a wrapping `DialTooltip` (whichever the design system uses for disabled buttons; component test confirms).

**Status → blocking table:**

```
Deployment status                Rollback allowed?   Tooltip
─────────────────                ─────────────────   ───────
NOT_DEPLOYED                     yes                 —
STOPPED                          yes                 —
RUNNING                          no                  "Undeploy this deployment before rolling back."
PENDING                          no                  "Undeploy this deployment before rolling back."
FAILED                           no                  "Undeploy this deployment before rolling back."
STOPPING                         no                  "Undeploy this deployment before rolling back."

Image build status               Rollback allowed?   Tooltip
──────────────────               ─────────────────   ───────
NOT_BUILT                        yes                 —
BUILD_FAILED                     yes                 —
BUILD_STOPPED                    yes                 —
BUILDING                         no                  "Stop the build before rolling back."
BUILT (BUILD_SUCCESSFUL)         no                  "Cannot roll back a built image. Stop or rebuild it first."

Whitelist                        always allowed      —
```

(Exact tooltip copy decided during implementation; the keys are wired in `RollbackI18nKey`.)

**Why**: Disabling makes the precondition discoverable before the user attempts the action. Tooltip names the next step, matching the operator flow documented in the backend PR (`undeploy → rollback → deploy`).

### 6. Redirect after success

**Decision**: Extend `getRollbackRedirectHref` with cases for the new types.

```
ADAPTER_DEPLOYMENT            → /adapter-containers/{id}
APPLICATION_DEPLOYMENT        → /application-containers/{id}
INTERCEPTOR_DEPLOYMENT        → /interceptor-containers/{id}
MCP_DEPLOYMENT                → /mcp-containers/{id}
NIM_DEPLOYMENT                → /model-servings/{id}
INFERENCE_DEPLOYMENT          → /model-servings/{id}
ADAPTER_IMAGE_DEFINITION      → /deployment-images/{id}
APPLICATION_IMAGE_DEFINITION  → /deployment-images/{id}
INTERCEPTOR_IMAGE_DEFINITION  → /deployment-images/{id}
MCP_IMAGE_DEFINITION          → /deployment-images/{id}
IMAGE_BUILD_DOMAIN_WHITELIST  → (no entity page; default → /activity-audit)
```

`AuditView` already chooses between this helper and the `/activity-audit` fallback based on the existing `isEntityActivity` prop. No call-site changes needed.

**Why**: Lands the user on the resource they just changed, matching the behaviour for `MODEL`, `APPLICATION`, etc. The whitelist has no dedicated detail page (today it's a modal launched from the Images list), so the existing fallback is appropriate.

### 7. Read-only admins

**Decision**: No changes. Existing `useIsReadOnlyAdmin()` already hides the Rollback button entirely on `AuditView`, and the backend rejects with HTTP 403 (`@FullAdminOnly`) as a second line of defence.

### 8. Notifications

**Decision**: Reuse existing `getRollbackSuccessTitle` / `getRollbackSuccessDescription` / `getRollbackErrorTitle` / `getRollbackErrorDescription` and the existing notification helpers. No new copy. Verify each helper resolves a sensible string for the deployment-manager resource types; add the missing branches in `utils/entities/rollback-entity.ts` if any (likely yes — they currently switch only on the config types).

**Why**: Matches the user's "no edge-case messaging — just rollback and show success" instruction. Side effects (env-var nulls, build status reset, whitelist no-op) are not surfaced.

## Component Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│ Page (/activity-audit/[id] OR per-entity audit tab)                  │
│   ↓ getActivityAuditDetailData(activityId, token)                    │
│   ↓ + extra GET to containersApi.getContainer / imagesApi.getImage   │
│   ↓ for deployment-manager types                                     │
│   → { activity, activityRevision, previousRevision,                  │
│       entity, currentResourceStatus? }                               │
│                                                                      │
│ AuditView                                                            │
│   isReadOnlyAdmin?                  → hide                           │
│   isDeploymentManagerResource?                                       │
│     status blocks rollback?         → render disabled + tooltip      │
│     otherwise                       → render enabled                 │
│   otherwise                         → existing (config) path         │
│                                                                      │
│ onConfirm → rollbackEntityPerRevision(activity, ...)                 │
│   isDeploymentManagerResource(type) → new dedicated server action    │
│   otherwise → existing CRUD replay                                   │
│                                                                      │
│ onSuccess → success toast →                                          │
│   isEntityActivity → router.push(getRollbackRedirectHref(type, id))  │
│   otherwise        → router.push(/activity-audit)                    │
└──────────────────────────────────────────────────────────────────────┘
```

## Risks / Trade-offs

- **Endpoint URL drift**: the conjectured URLs in §3 are not verified against the merged controller files. Implementation must read the actual `DeploymentController` / `ImageDefinitionController` / `GlobalDomainWhitelistController` in the backend repo and adjust.
- **Live-status GET failures**: a transient failure of `getContainer` / `getImage` leaves `currentResourceStatus` undefined and the button enabled; the user may click and get a backend rejection. Acceptable degradation — backend remains the gate. Worth a single log line on the server side for observability.
- **Side-effect surprises**: per the "no edge cases" directive, users are not warned that deployment rollback nulls sensitive env-vars or image rollback resets build status. A follow-up change can layer this on if support tickets show up. Documented as a non-goal so reviewers don't flag it as a miss.
- **Whitelist no-op success toast**: backend may return success without creating a revision on identical-state rollback. We still show the standard success notification — the user is informed the action succeeded; the audit-history view simply won't show a new entry. Acceptable.
- **Status enum coverage**: the disable predicate is a positive allow-list of the three image statuses and two deployment statuses the backend accepts. If the backend later adds new "safe" statuses (e.g. `BUILD_CANCELLED`), the button stays disabled until the frontend catches up. Safer than an exclude-list.

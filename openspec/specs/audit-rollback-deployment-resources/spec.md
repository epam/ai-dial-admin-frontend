## Capability: audit-rollback-deployment-resources

**Summary**: Per-resource rollback of container deployments, image definitions, and the global image-build domain whitelist from the existing activity-audit detail view (`AuditView`), with status-gated availability, dedicated backend endpoints (no CRUD replay), and post-rollback redirect to the resource's detail page.

## Requirements

### Functional Requirements

**FR1: Button visibility on AuditView**

- The Rollback button MUST be rendered on `AuditView` for activities whose `resourceType` satisfies `isDeploymentManagerResource(...)`, i.e. all six container-deployment types (`ADAPTER_DEPLOYMENT`, `APPLICATION_DEPLOYMENT`, `INTERCEPTOR_DEPLOYMENT`, `MCP_DEPLOYMENT`, `NIM_DEPLOYMENT`, `INFERENCE_DEPLOYMENT`), all four image-definition types (`ADAPTER_IMAGE_DEFINITION`, `APPLICATION_IMAGE_DEFINITION`, `INTERCEPTOR_IMAGE_DEFINITION`, `MCP_IMAGE_DEFINITION`), and `IMAGE_BUILD_DOMAIN_WHITELIST`.
- The button MUST NOT render when `useIsReadOnlyAdmin()` returns true (existing behaviour preserved).
- The button MUST NOT render in the modal view path (`isModalView === true`) — only on the standalone detail page or per-entity audit tab (existing behaviour preserved).

**FR2: Status-gated availability**

- For activities on container-deployment resource types, the button MUST be rendered with `disabled` when the live resource's `status` is anything other than `CONTAINER_STATUS.NOT_DEPLOYED` or `CONTAINER_STATUS.STOPPED`.
- For activities on image-definition resource types, the button MUST be rendered with `disabled` when the live resource's `buildStatus` is anything other than `IMAGE_STATUS.NOT_BUILT`, `IMAGE_STATUS.BUILD_FAILED`, or `IMAGE_STATUS.BUILD_STOPPED`.
- For activities on `IMAGE_BUILD_DOMAIN_WHITELIST`, the button MUST always be rendered enabled (subject to FR1).
- When the live-status fetch fails (returns null/undefined/error), the button MUST be rendered enabled — the backend remains the authoritative gate.

**FR3: Disabled-state tooltip**

- A disabled button rendered per FR2 MUST display a tooltip on hover/focus.
- Container-deployment tooltip MUST resolve to `RollbackI18nKey.DisabledDeploymentTooltip` (English copy: "Undeploy this deployment before rolling back." or equivalent finalised copy).
- Image-definition tooltip MUST resolve to `RollbackI18nKey.DisabledImageDefinitionTooltip` (English copy describing the build-status precondition).
- Enabled buttons MUST NOT carry a tooltip.

**FR4: Confirmation modal**

- Clicking the enabled Rollback button MUST open the existing `DialConfirmationPopup` with header `RollbackI18nKey.ConfirmResourceRollbackTitle` and the existing description copy (`ConfirmSelectionRollbackDescription` + revision timestamp + `ConfirmRollbackAsking`). No new copy is introduced for the deployment-manager flow.
- Confirming MUST trigger the rollback dispatcher (FR5). Cancelling MUST close the modal without action.

**FR5: Rollback dispatcher branching**

- `rollbackEntityPerRevision(activity, activityRevision, previousRevision)` MUST short-circuit when `isDeploymentManagerResource(activity.resourceType)` is true and route to a deployment-manager-specific path that calls one of the three new server actions:
  - `isContainerDeploymentResource(...)` → container deployment rollback action.
  - `isImageDefinitionResource(...)` → image-definition rollback action.
  - `isGlobalFirewallResource(...)` → whitelist rollback action.
- The deployment-manager path MUST NOT consult `activity.activityType`; the backend rollback endpoints accept a target revision regardless of whether the source revision was a Create / Update / Delete.
- The target revision passed to the backend MUST be `previousRevision`'s revision number (the revision being restored).

**FR6: API endpoints**

- `ContainersApi` MUST expose `rollbackToRevision(id: string, revision: number, token: Token): Promise<ServerActionResponse>` calling the per-resource rollback endpoint defined in backend PR #327's `DeploymentController`.
- `ImagesApi` MUST expose `rollbackToRevision(id: string, revision: number, token: Token): Promise<ServerActionResponse>` calling the per-resource rollback endpoint defined in `ImageDefinitionController`.
- `GlobalFirewallApi` MUST expose `rollbackToRevision(revision: number, token: Token): Promise<ServerActionResponse>` calling the global-whitelist rollback endpoint defined in `GlobalDomainWhitelistController`.
- Each method MUST authenticate via the supplied `Token`.
- Each method MUST return a `ServerActionResponse` shaped consistently with the other API methods on its class.

**FR7: Server actions**

- Three server actions, marked `'use server'`, MUST wrap the three API methods. Each acquires the user token via `getUserToken(getIsEnableAuthToggle(), headers(), cookies())` and forwards arguments to the API.
- The actions MUST surface backend errors via the existing `ServerActionResponse` shape (`{ success, errorHeader?, errorMessage?, requestId? }`); the UI consumes these via the existing error-notification path.

**FR8: Live resource status fetch**

- `getActivityAuditDetailData` MUST be extended to additionally fetch the live resource for container-deployment and image-definition activities, in parallel with the existing audit-revision and activity-list fetches.
  - Container deployments → `containersApi.getContainer(activity.resourceId, token)` → extract `.status`.
  - Image definitions → `imagesApi.getImage(activity.resourceId, token)` → extract `.buildStatus`.
- The function MUST return a new optional field `currentResourceStatus?: string` on `ActivityAuditDetailData`.
- For `IMAGE_BUILD_DOMAIN_WHITELIST` and all non-deployment-manager activities, `currentResourceStatus` MUST be undefined.
- A failure of the live-status fetch MUST NOT cause the page to error; it logs via `errorObjLog` and leaves `currentResourceStatus` undefined.
- All consuming pages (`/activity-audit/[id]` and each per-entity `[id]/[subId]` audit page for the deployment-manager entities) MUST forward `currentResourceStatus` through to `AuditView`.

**FR9: Success redirect**

- On a successful rollback for an entity-context activity (`isEntityActivity === true`), `AuditView` MUST `router.push(getRollbackRedirectHref(activity.resourceType, activity.resourceId))`.
- `getRollbackRedirectHref` MUST map the resource type to the resource's detail page:
  - `ADAPTER_DEPLOYMENT` → `${ApplicationRoute.AdapterContainers}/{encoded resourceId}`
  - `APPLICATION_DEPLOYMENT` → `${ApplicationRoute.ApplicationContainers}/{encoded resourceId}`
  - `INTERCEPTOR_DEPLOYMENT` → `${ApplicationRoute.InterceptorContainers}/{encoded resourceId}`
  - `MCP_DEPLOYMENT` → `${ApplicationRoute.McpContainers}/{encoded resourceId}`
  - `NIM_DEPLOYMENT` → `${ApplicationRoute.ModelServings}/{encoded resourceId}`
  - `INFERENCE_DEPLOYMENT` → `${ApplicationRoute.ModelServings}/{encoded resourceId}`
  - `ADAPTER_IMAGE_DEFINITION` → `${ApplicationRoute.Images}/{encoded resourceId}`
  - `APPLICATION_IMAGE_DEFINITION` → `${ApplicationRoute.Images}/{encoded resourceId}`
  - `INTERCEPTOR_IMAGE_DEFINITION` → `${ApplicationRoute.Images}/{encoded resourceId}`
  - `MCP_IMAGE_DEFINITION` → `${ApplicationRoute.Images}/{encoded resourceId}`
- For `IMAGE_BUILD_DOMAIN_WHITELIST` the helper MUST fall through to the default `${ApplicationRoute.ActivityAudit}` (no entity page exists).
- Non-entity-context activities MUST continue to redirect to `${ApplicationRoute.ActivityAudit}` (existing behaviour preserved).

**FR10: Notifications**

- Successful rollback MUST trigger the existing success notification via `getRollbackSuccessTitle` / `getRollbackSuccessDescription` keyed by `activity.resourceType`. If those helpers lack cases for the deployment-manager resource types, the missing branches MUST be added so the notification resolves to a sensible string for every supported type.
- Backend errors MUST trigger the existing error notification path with `getRollbackErrorTitle` / `getRollbackErrorDescription` plus the backend-supplied `errorHeader`, `errorMessage`, and `requestId`.
- No new informational notification is shown for the side effects documented in backend PR #327 (sensitive env-var values nulled, build status reset, identical-state whitelist no-op).

**FR11: Read-only admins**

- Read-only admins MUST NOT see the Rollback button for any of the new resource types. This is enforced by the existing `useIsReadOnlyAdmin()` check on `AuditView` and by the backend's `@FullAdminOnly` authorisation (HTTP 403).

**FR12: System-rollback scope unchanged**

- `SYSTEM_ROLLBACK_ENTITIES` MUST NOT include deployment-manager resource types. The `SystemRollback` flow MUST NOT be reachable for these resources via this change.
- The Deployments-view activity-audit grid (`getDeploymentActivityAuditColumns`) MUST continue to expose only the "Open in new tab" row action — no new per-row rollback action is added.

### Non-Functional Requirements

**NFR1: Consistency**

- Button styling, position, and modal pattern MUST match the existing config-entity rollback flow on `AuditView`.
- Redirect behaviour MUST match the pattern established by config entities in `getRollbackRedirectHref` (entity detail page on success, audit list as fallback).
- Tooltip rendering on disabled buttons MUST use the same `@epam/ai-dial-ui-kit` component already used elsewhere for disabled-button tooltips in the audit area.

**NFR2: Performance**

- The added live-status fetch MUST run in parallel with the existing audit-detail fetches; it MUST NOT serialise the page-load critical path.
- A failed or slow live-status fetch MUST NOT block rendering of the audit detail page; the button stays enabled and the backend acts as the gate.

**NFR3: Internationalisation**

- All user-facing strings MUST resolve via `useI18n()` and `RollbackI18nKey`.
- Two new keys MUST be added (`DisabledDeploymentTooltip`, `DisabledImageDefinitionTooltip`) with English values in `apps/ai-dial-admin/src/locales/en.ts`. Any further keys required by FR10's helper coverage MUST follow the same pattern.

**NFR4: Authorisation**

- The frontend MUST defer to the backend's `@FullAdminOnly` for authorisation; the read-only-admin client-side hide is a UX convenience, not a security boundary.

**NFR5: Observability**

- Live-status fetch failures in `getActivityAuditDetailData` MUST be logged via `errorObjLog` with a context message identifying the resource type.

## UI Specifications

### Button states

```
Read-only admin                  → no button (hidden)

Container deployment activity
  status = NOT_DEPLOYED          → [Rollback]    (enabled)
  status = STOPPED               → [Rollback]    (enabled)
  status = RUNNING / PENDING /
           FAILED / STOPPING     → [Rollback]    (disabled + tooltip)
  status unknown (fetch failed)  → [Rollback]    (enabled — backend gates)

Image-definition activity
  buildStatus = NOT_BUILT        → [Rollback]    (enabled)
  buildStatus = BUILD_FAILED     → [Rollback]    (enabled)
  buildStatus = BUILD_STOPPED    → [Rollback]    (enabled)
  buildStatus = BUILDING / BUILT → [Rollback]    (disabled + tooltip)
  buildStatus unknown            → [Rollback]    (enabled — backend gates)

Image-build domain whitelist     → [Rollback]    (always enabled)
```

### Disabled tooltip copy (English)

```
Deployment:        "Undeploy this deployment before rolling back."
Image definition:  "Stop the build or roll back to an earlier
                    revision before rolling back this image."
                    (final wording at implementation time)
```

### Flow diagram

```
┌────────────────────────────────────────────────────────────────┐
│ User on /activity-audit/[id] or per-entity audit tab           │
│                                                                │
│  Server page fetch:                                            │
│   getActivityAuditDetailData()                                 │
│    ├── activity + revisions (existing)                         │
│    ├── entity (latest audit snapshot, existing)                │
│    └── currentResourceStatus (NEW — live GET for containers /  │
│        image defs; undefined for whitelist + config)           │
│                                                                │
│  AuditView renders Rollback button based on:                   │
│   - useIsReadOnlyAdmin()                                       │
│   - isDeploymentManagerResource(activity.resourceType)         │
│   - currentResourceStatus vs. allowed-status set               │
│                                                                │
│  User clicks → DialConfirmationPopup                           │
│  User confirms → rollbackEntityPerRevision()                   │
│                                                                │
│  Dispatcher                                                    │
│   isDeploymentManagerResource?                                 │
│     → rollbackContainer/Image/Whitelist server action          │
│        → POST {backend rollback URL} with target revision      │
│   else → existing CRUD replay path                             │
│                                                                │
│  Success                                                       │
│   → success toast                                              │
│   → isEntityActivity                                           │
│       ? router.push(getRollbackRedirectHref(type, id))         │
│       : router.push(/activity-audit)                           │
│  Error                                                         │
│   → error toast with backend errorHeader/errorMessage/         │
│     requestId                                                  │
└────────────────────────────────────────────────────────────────┘
```

## API Specifications

Endpoint URLs confirmed against the merged backend controllers (`DeploymentController`, `ImageDefinitionController`, `GlobalDomainWhitelistController`).

**Container deployment rollback** — `ContainersApi.rollbackToRevision`

```
POST {API}/deployments/{id}/revision/{revision}/rollback
Authorization: Bearer {token}
(no request body)
```

**Image-definition rollback** — `ImagesApi.rollbackToRevision`

```
POST {API}/images/definitions/{id}/revision/{revision}/rollback
Authorization: Bearer {token}
(no request body)
```

**Image-build domain-whitelist rollback** — `GlobalFirewallApi.rollbackToRevision`

```
POST {API}/global-whitelist/image-build/revision/{revision}/rollback
Authorization: Bearer {token}
(no request body)
```

All three endpoints are POST, are gated by `@FullAdminOnly` (HTTP 403 for read-only callers), and return the rolled-back resource representation. The frontend does not consume the response body — the redirect re-fetches resource state on the destination page.

Error responses (400 / 403 / 409 / 500) are surfaced verbatim to the user via the existing error-notification path.

## Acceptance Criteria

1. The Rollback button is visible on the activity-audit detail page and per-entity audit tabs for every deployment-manager resource type (subject to read-only-admin hide).
2. Clicking Rollback on a `STOPPED` container deployment activity calls the new container-rollback endpoint and, on success, shows the rollback success toast and routes to the deployment's detail page.
3. Clicking Rollback on a `BUILD_FAILED` image-definition activity calls the new image-rollback endpoint and routes to the deployment-images detail page.
4. Clicking Rollback on an `IMAGE_BUILD_DOMAIN_WHITELIST` activity calls the new whitelist-rollback endpoint and routes to `/activity-audit`.
5. The Rollback button is disabled with the deployment tooltip when the underlying deployment is `RUNNING`, `PENDING`, `FAILED`, or `STOPPING`.
6. The Rollback button is disabled with the image tooltip when the underlying image is `BUILDING` or `BUILT` (`BUILD_SUCCESSFUL`).
7. A failed live-status fetch leaves the Rollback button enabled.
8. Read-only admins never see the Rollback button for any deployment-manager activity.
9. The Deployments audit list still shows no per-row rollback action; only "Open in new tab".
10. `SystemRollback` continues to exclude deployment-manager resource types — they are reachable only via the per-resource flow specified here.
11. No new informational notification is shown for env-var nulling, build-status reset, or whitelist no-op rollbacks.
12. Existing config-entity rollback flows (models, applications, adapters, routes, etc.) are unchanged.

# deployment-entity-rollback Specification

## Purpose

Defines per-entity rollback for deployment-manager audit activities: how rollback is dispatched by activity type (Update → rollback endpoint, Create → delete, Delete → rollback endpoint with backend resurrect), the deployment-manager rollback endpoints, the lifecycle pre-check gate that governs the in-place rollback path, the success/error notifications keyed by resource type, and the post-rollback navigation rules by scenario and entry point.

## Requirements

### Requirement: Per-entity rollback restores the entity to the state before the selected activity

Triggering rollback from a deployment-manager audit activity SHALL restore the entity to the snapshot at the revision immediately preceding the activity, i.e. target revision `R = activity.revision − 1`. The strategy SHALL be selected from `activity.activityType`:

- `Update` → call the deployment-manager rollback endpoint for the entity at revision `R`.
- `Create` → delete the entity (it did not exist at `R`).
- `Delete` → call the deployment-manager rollback endpoint for the entity at revision `R`. The backend resurrects the currently-deleted entity from audit history and resets sensitive values server-side. The frontend SHALL NOT fetch the snapshot or build a client-side create request for this case.

A dispatch utility (`get-deployment-rollback-request`) SHALL encapsulate this selection, sibling to the existing admin `get-rollback-request` util, and SHALL branch on the resource family (container deployment, image definition, or global firewall whitelist).

#### Scenario: Update activity calls the rollback endpoint
- **GIVEN** a deployment-manager activity with `activityType: "Update"`, a resolvable `resourceId`, and `revision: 42`
- **WHEN** the user confirms rollback
- **THEN** the dispatch issues the rollback request for that entity at revision `41`
- **AND** no client-side create or delete request is issued

#### Scenario: Create activity deletes the entity
- **GIVEN** a deployment-manager activity with `activityType: "Create"`
- **WHEN** the user confirms rollback
- **THEN** the dispatch issues a delete request for the entity
- **AND** no rollback-endpoint or create request is issued

#### Scenario: Delete activity calls the rollback endpoint to resurrect the entity
- **GIVEN** a deployment-manager activity with `activityType: "Delete"` and `revision: 42`
- **WHEN** the user confirms rollback
- **THEN** the dispatch issues the rollback request for that entity at revision `41`
- **AND** no snapshot is fetched and no client-side create request is issued

#### Scenario: Resurrecting a deleted entity with secure env values does not error
- **GIVEN** a `Delete` activity for a container deployment that had secure environment values
- **WHEN** the user confirms rollback
- **THEN** the rollback endpoint resurrects the entity with secure values reset server-side
- **AND** no Internal Server Error is shown

### Requirement: Deployment-manager rollback endpoints

The server API SHALL expose rollback methods that POST to the deployment-manager backend (`DIAL_DEPLOYMENTS_API_URL`):

- Container deployments → `POST /api/v1/deployments/{id}/revision/{revision}/rollback`
- Image definitions → `POST /api/v1/images/definitions/{id}/revision/{revision}/rollback`
- Global domain whitelist (singleton, no id) → `POST /api/v1/global-whitelist/image-build/revision/{revision}/rollback`

Each method SHALL be reachable through a `'use server'` action and SHALL return the standard `ServerActionResponse` so success and `{ success: false, errorHeader, errorMessage }` are surfaced uniformly. The backend resolves the target via point-in-time semantics (latest revision ≤ `revision`); the frontend SHALL NOT attempt to pre-resolve revision gaps.

#### Scenario: Container rollback hits the deployment-manager backend
- **GIVEN** a container deployment with id `abc` and target revision `41`
- **WHEN** the rollback action runs
- **THEN** it issues `POST /api/v1/deployments/abc/revision/41/rollback` against `DIAL_DEPLOYMENTS_API_URL`

#### Scenario: Image-definition rollback hits the deployment-manager backend
- **GIVEN** an image definition with id `img1` and target revision `41`
- **WHEN** the rollback action runs
- **THEN** it issues `POST /api/v1/images/definitions/img1/revision/41/rollback`

#### Scenario: Whitelist rollback omits the id segment
- **GIVEN** an `ImageBuildDomainWhitelist` activity with target revision `41`
- **WHEN** the rollback action runs
- **THEN** it issues `POST /api/v1/global-whitelist/image-build/revision/41/rollback` with no id segment

#### Scenario: Backend rejection surfaces as an error notification
- **WHEN** a rollback request returns a non-success response (e.g. HTTP 400/403/404)
- **THEN** an error notification is shown carrying the backend `errorHeader`/`errorMessage`
- **AND** the entity is left unchanged in the UI

### Requirement: Lifecycle pre-check gate for the in-place rollback path

Before allowing the `Update`→rollback path, the system SHALL determine whether the entity's current lifecycle state permits rollback. A container is blocked when its `status` is `PENDING`, `RUNNING`, `CRASHED`, or `STOPPING`; an image definition is blocked when its `buildStatus` is `BUILDING` or `BUILD_SUCCESSFUL`. The global whitelist is never blocked. The current state SHALL be fetched via the entity's GET endpoint, since the audit activity record does not carry live status. When blocked, the UI SHALL prevent submission and SHALL explain why. The gate is advisory; the backend 400 remains authoritative and any slip-through SHALL surface as an error notification. Neither the `Create`→delete path nor the `Delete`→rollback (resurrect) path is gated by this check — a currently-deleted entity has no live status to block on.

#### Scenario: Active container blocks in-place rollback
- **GIVEN** a container deployment whose current `status` is `RUNNING`
- **WHEN** the user attempts to roll back an `Update` activity for it
- **THEN** the rollback submission is prevented
- **AND** an explanation is shown indicating the deployment must be undeployed first

#### Scenario: Building image blocks in-place rollback
- **GIVEN** an image definition whose current `buildStatus` is `BUILDING`
- **WHEN** the user attempts to roll back an `Update` activity for it
- **THEN** the rollback submission is prevented
- **AND** an explanation indicates the image is building

#### Scenario: Inactive entity permits in-place rollback
- **GIVEN** a container deployment whose current `status` is `STOPPED`
- **WHEN** the user attempts rollback
- **THEN** submission is allowed and the rollback endpoint is called

#### Scenario: Whitelist is never gated
- **GIVEN** an `ImageBuildDomainWhitelist` activity
- **WHEN** the user attempts rollback
- **THEN** no lifecycle pre-check is performed and submission is allowed

#### Scenario: Delete activity is not gated by the lifecycle pre-check
- **GIVEN** a `Delete` activity for a container deployment or image definition
- **WHEN** the user attempts rollback
- **THEN** no lifecycle pre-check is performed and submission is allowed

### Requirement: Rollback success and error notifications keyed by resource type

On a successful rollback the system SHALL show a success notification whose title and description are localized per deployment-manager resource type, following the existing `rollback-entity` messaging pattern. On failure it SHALL show an error notification. All user-facing strings SHALL be provided through next-international i18n keys. After a successful rollback the UI SHALL navigate following the existing rollback flow (entity page when initiated from an entity-scoped audit, otherwise the activity-audit list) so the next datasource fetch reflects the new state.

#### Scenario: Success notification on container rollback
- **WHEN** a container rollback returns success
- **THEN** a success notification with a container-specific title/description is shown
- **AND** the UI navigates per the existing rollback redirect rule

#### Scenario: Recreate success hints secure values need re-supply
- **WHEN** a `Delete`-activity recreate succeeds for an entity that had secure environment values
- **THEN** the success notification indicates secure values must be re-supplied before deploy

### Requirement: Post-rollback navigation by scenario and entry point

After a successful rollback the UI SHALL navigate based on the activity type and where rollback was triggered, so the user never lands on a now-deleted entity's page:

- `Create` (entity no longer exists): from the activity-audit context → the activity-audit list; from an entity audit tab/detail → the entity **list** for that resource type.
- `Delete` (entity resurrected via rollback): → the resurrected entity's **detail** page, built from the id returned in the rollback response.
- `Update`: from the activity-audit context → the activity-audit list; from an entity audit tab/detail → reload in place.

When navigating to the activity-audit list, the destination SHALL open in the view matching the rolled-back resource (`Deployments` for deployment-manager types, otherwise `Config`), carried via the existing `AuditListPreselect` sessionStorage mechanism and consumed once on mount. The list's time period is NOT preserved (it opens at its default). Targets that need an entity route SHALL fall back to the activity-audit list (audit context) or an in-place reload (entity context) when the resource type has no route or the identifier is missing.

#### Scenario: Create rollback from the audit detail page returns to the audit list
- **GIVEN** a `Create` activity opened from `/activity-audit/{id}`
- **WHEN** the rollback (delete) succeeds
- **THEN** the app navigates to the activity-audit list, not to the deleted entity's page
- **AND** the list opens in the `Deployments` view for a deployment-manager resource

#### Scenario: Create rollback from an entity audit tab returns to the entity list
- **GIVEN** a `Create` activity opened from an entity audit tab/detail
- **WHEN** the rollback (delete) succeeds
- **THEN** the app navigates to the entity list route for that resource type

#### Scenario: Delete rollback navigates to the resurrected entity page
- **GIVEN** a `Delete` activity
- **WHEN** the rollback (resurrect) succeeds
- **THEN** the app navigates to the resurrected entity's detail page

#### Scenario: Resurrected entity detail href uses the new backend-assigned id
- **GIVEN** an image-definition `Delete` rollback where the backend assigns a new id on resurrect
- **WHEN** the rollback response returns the resurrected entity
- **THEN** the detail href is built from the response entity's new id, not the stale `resourceId`
- **AND** name-keyed entities (containers, model-servings) resolve to the same path either way

#### Scenario: Update rollback reloads in place from an entity audit tab
- **GIVEN** an `Update` activity opened from an entity audit tab/detail
- **WHEN** the rollback succeeds
- **THEN** the current entity page is reloaded rather than navigating away

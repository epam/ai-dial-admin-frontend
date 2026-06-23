## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Snapshot-to-create-DTO mapper for the recreate scenario

**Reason**: The `Delete` rollback no longer recreates the entity via a client-built create request. It calls the backend rollback endpoint, which resurrects the deleted entity from audit history server-side. The mapper sent masked/null secure env values to the create path, causing an Internal Server Error (Issue #3700), and is now dead code.

**Migration**: Delete `src/utils/audit/build-create-body-from-snapshot.ts` and its spec. The `Delete` branch of `get-deployment-rollback-request` calls the rollback action (`rollbackDeploymentContainer` / `rollbackDeploymentImage`) at revision `R` instead of fetching the snapshot and mapping a create DTO. No new mapper replaces it.
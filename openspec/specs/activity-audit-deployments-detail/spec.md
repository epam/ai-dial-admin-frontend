# activity-audit-deployments-detail Specification

## Purpose

Defines the audit-detail experience for deployment-manager activities at `/activity-audit/{activityId}`: how the detail page resolves activities by falling back from the admin backend to the deployment-manager backend, how image-definition and global-firewall snapshots are fetched and shaped for the diff engine, how the `AuditView` is adapted (rollback hidden, identifier chip omitted when absent, new section headers and synthesized rows for image and firewall activities), the predicates colocated with the resource-type enum, and the i18n keys required to localize the new labels.

## Requirements

### Requirement: Audit detail page resolves image and firewall activities from the deployment-manager backend

The audit detail route at `/activity-audit/{activityId}` SHALL first attempt to fetch the activity from the admin backend via `activityAuditApi.getActivityById`. When the admin lookup returns no record, the page SHALL fall back to `deploymentAuditApi.getActivityById`. If both backends fail to return a record, the page SHALL preserve the existing not-found behavior. The page SHALL render `AuditView` once the activity is resolved, regardless of which backend produced it.

#### Scenario: Admin-backend activity opens through the existing path
- **GIVEN** an `activityId` that belongs to the admin backend
- **WHEN** the user opens `/activity-audit/{activityId}`
- **THEN** the admin-backend lookup returns the activity
- **AND** the deployment-manager lookup is not invoked
- **AND** `AuditView` renders the existing diff body

#### Scenario: Deployment-manager activity falls back successfully
- **GIVEN** an `activityId` that belongs to the deployment-manager backend
- **WHEN** the user opens `/activity-audit/{activityId}`
- **THEN** the admin-backend lookup returns null
- **AND** the deployment-manager lookup returns the activity
- **AND** `AuditView` renders the detail body for the activity

#### Scenario: Unknown activity falls through to not-found
- **GIVEN** an `activityId` that exists in neither backend
- **WHEN** the user opens `/activity-audit/{activityId}`
- **THEN** the page invokes the existing `notFound()` flow

### Requirement: Image-definition snapshots are fetched from the deployment-manager backend

For activities whose `resourceType` is one of `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, or `McpImageDefinition`, the detail page SHALL fetch the current and previous revision snapshots from `GET /api/v1/images/definitions/{id}/revision/{revision}` on `DIAL_DEPLOYMENTS_API_URL`. The route segment SHALL be composed via the existing `getRevisionRouteForEntityType` helper, extended with the four image-definition cases returning `/images/definitions/{id}/revision/`. The response shape is the polymorphic `ImageDefinitionDto` with a `$type` discriminator (`mcp` / `adapter` / `interceptor` / `application`); the detail page SHALL pass the response object through to `AuditView` without restructuring.

#### Scenario: Mcp image snapshot loads
- **GIVEN** an activity with `resourceType: "McpImageDefinition"`, `resourceId: <uuid>`, and `revision: 42`
- **WHEN** the detail page resolves the snapshot
- **THEN** the page issues `GET /api/v1/images/definitions/<uuid>/revision/42` against `DIAL_DEPLOYMENTS_API_URL`
- **AND** the response is rendered through `AuditView` like any other entity

#### Scenario: Previous-revision snapshot fetches `revision - 1`
- **GIVEN** the activity above has `revision: 42`
- **WHEN** the detail page resolves the previous-revision snapshot
- **THEN** the page issues `GET /api/v1/images/definitions/<uuid>/revision/41`

### Requirement: Global firewall snapshots wrap the bare list into a diff-engine-compatible map

For activities whose `resourceType` is `ImageBuildDomainWhitelist`, the detail page SHALL fetch the current and previous revision snapshots from `GET /api/v1/global-whitelist/image-build/revision/{revision}` on `DIAL_DEPLOYMENTS_API_URL`. The endpoint returns a bare `List<String>` (no DTO wrapper). The server action SHALL wrap the response as `{ domains: <stringArray> }` before passing it to the page. The page SHALL pass the wrapped object through to `AuditView` like any other entity.

#### Scenario: Firewall snapshot wrapping
- **GIVEN** the BE returns `["aws.com", "azure.com"]` at revision 8
- **WHEN** the server action returns to the page
- **THEN** the page receives `{ domains: ["aws.com", "azure.com"] }`
- **AND** the diff engine treats it like a single-key entity with the `domains` key

#### Scenario: Empty firewall snapshot
- **GIVEN** the BE returns `[]` at some revision
- **WHEN** the server action returns to the page
- **THEN** the page receives `{ domains: [] }`
- **AND** the diff engine treats the entity as having an empty string array under `domains`

### Requirement: Resource Rollback button is hidden for deployment-manager activities

The `AuditView` component SHALL NOT render the Resource Rollback button when `activity.resourceType` is one of the eleven deployment-manager resource types (`AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`, `ImageBuildDomainWhitelist`, `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`). A predicate `isDeploymentManagerResource(resourceType)` SHALL be exposed alongside `ActivityAuditResourceType` to centralize this check. The existing `isReadOnlyAdmin` gate continues to hide the button for read-only admins on admin-backend activities.

#### Scenario: Image detail hides rollback
- **GIVEN** the user opens the detail page for an image-definition activity
- **THEN** the Resource Rollback button is not rendered

#### Scenario: Firewall detail hides rollback
- **GIVEN** the user opens the detail page for an `ImageBuildDomainWhitelist` activity
- **THEN** the Resource Rollback button is not rendered

#### Scenario: Admin activity keeps rollback for non-read-only admins
- **GIVEN** the user opens the detail page for an admin-backend activity such as `Model` or `Application`
- **AND** the user is NOT a read-only admin
- **THEN** the Resource Rollback button is rendered as it is today

### Requirement: ViewHeader omits the Resource identifier chip when absent

The header that summarizes activity metadata at the top of `AuditView` SHALL omit the Resource identifier chip when the activity's `resourceId` is absent or empty. All other chips (Activity type, Resource type, Time, Initiated) SHALL render as today.

#### Scenario: Firewall activity hides the resource identifier chip
- **GIVEN** the user opens the detail page for a `ImageBuildDomainWhitelist` activity whose `resourceId` is empty
- **THEN** the Resource identifier chip is not rendered
- **AND** the remaining chips render normally

#### Scenario: Image activity renders the resource identifier chip
- **GIVEN** the user opens the detail page for an image-definition activity whose `resourceId` is a UUID
- **THEN** the Resource identifier chip renders the UUID as it does today

### Requirement: Image detail renders Properties and Firewall settings sections

For image-definition activities, the diff body SHALL render two sections in the existing `Accordion` (default-open):

1. **Properties** — every image field except `allowedDomains`.
2. **Firewall settings** — `allowedDomains` plus a synthesized `Domain access policy` row.

The `allowedDomains` key SHALL be configured in `EntityParameterKeys` and `separateObjectParameterKeys` so the diff engine moves it out of the default Properties bucket and into its own section. The section header SHALL be the localized string `Firewall settings`.

#### Scenario: Image diff has the two expected section headers
- **GIVEN** the user opens an image-definition activity
- **WHEN** the diff body renders
- **THEN** two section headers are present: `Properties` and `Firewall settings`

#### Scenario: `allowedDomains` rows appear only in the Firewall settings section
- **GIVEN** the image's `allowedDomains` changed between revisions
- **WHEN** the diff body renders
- **THEN** the diff rows for `allowedDomains` appear under the `Firewall settings` section header
- **AND** no `allowedDomains` row appears under the `Properties` section header

### Requirement: Image detail synthesizes a Domain access policy row in the Firewall section

When constructing the Firewall settings section for an image-definition activity, the diff engine SHALL prepend a synthetic `Domain access policy` row. Its value SHALL be derived from `allowedDomains` length:

- length `0` → `All domains`.
- length `> 0` → `Specific domains`.

The synthetic row SHALL participate in diff status calculation: when the before/after policies differ (one side empty, the other non-empty) the row's diff status SHALL be `CHANGED`; when they match, the row SHALL be emitted with no diff status. The `View: Diff` filter SHALL hide the row when it has no diff status, matching the existing behavior for unchanged fields.

#### Scenario: Empty → non-empty list yields policy change
- **GIVEN** an image whose `allowedDomains` went from `[]` to `["aws.com"]`
- **WHEN** the Firewall section renders
- **THEN** the synthesized `Domain access policy` row shows `All domains` (before) and `Specific domains` (after) with diff status `CHANGED`

#### Scenario: Same list state yields unchanged policy
- **GIVEN** an image whose `allowedDomains` went from `["aws.com"]` to `["aws.com", "github.com"]`
- **WHEN** the Firewall section renders
- **THEN** the synthesized `Domain access policy` row shows `Specific domains` on both sides with no diff status
- **AND** the row is hidden by the `View: Diff` filter

### Requirement: Global firewall detail renders a single Global domain whitelist section

For `ImageBuildDomainWhitelist` activities, the diff body SHALL render a single section in the existing `Accordion` (default-open). The section header SHALL be the localized string `Global domain whitelist`. The section content SHALL render the before/after domain lists using the existing string-array diff path: each domain appears as a row tagged with its diff status (added, removed, mirrored, or changed).

#### Scenario: Single section header
- **GIVEN** the user opens a global-firewall activity
- **WHEN** the diff body renders
- **THEN** exactly one section header is present: `Global domain whitelist`

#### Scenario: Added domains highlight as added
- **GIVEN** the firewall went from `["aws.com"]` to `["aws.com", "google.com"]`
- **WHEN** the section renders
- **THEN** the `aws.com` row is mirrored on both sides
- **AND** the `google.com` row appears only on the `After` side with status `ADDED`

#### Scenario: Removed domains highlight as removed
- **GIVEN** the firewall went from `["aws.com", "gmail.com"]` to `["aws.com"]`
- **WHEN** the section renders
- **THEN** the `gmail.com` row appears only on the `Before` side with status `REMOVED`

### Requirement: Resource-type predicates colocated with the type enum

The predicates `isDeploymentManagerResource`, `isImageDefinitionResource`, and `isGlobalFirewallResource` SHALL be exported from `src/types/activity-audit.ts`. Each SHALL accept `string | undefined` and return `boolean`. `isDeploymentManagerResource` SHALL return true for all eleven deployment-manager resource types. `isImageDefinitionResource` SHALL return true only for the four `*ImageDefinition` resource types. `isGlobalFirewallResource` SHALL return true only for `ImageBuildDomainWhitelist`.

#### Scenario: `isDeploymentManagerResource` accepts all eleven types
- **WHEN** the predicate is called with each of `AdapterImageDefinition`, `ApplicationImageDefinition`, `InterceptorImageDefinition`, `McpImageDefinition`, `ImageBuildDomainWhitelist`, `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `McpDeployment`, `NimDeployment`, `InferenceDeployment`
- **THEN** the result is `true` in every case

#### Scenario: `isDeploymentManagerResource` rejects admin-backend types
- **WHEN** the predicate is called with `Model`, `Application`, `Adapter`, or `Role`
- **THEN** the result is `false`

#### Scenario: `isImageDefinitionResource` is strictly narrower
- **WHEN** the predicate is called with `ImageBuildDomainWhitelist` or any of the six `*Deployment` types
- **THEN** the result is `false`

### Requirement: i18n keys for the new section headers and synthesized rows

The locale dictionary SHALL include new keys under `EntitiesI18nKey`: `FirewallSettings` (English: `Firewall settings`), `GlobalDomainWhitelist` (English: `Global domain whitelist`), `DomainAccessPolicy` (English: `Domain access policy`), `DomainAccessPolicyAllDomains` (English: `All domains`), `DomainAccessPolicySpecificDomains` (English: `Specific domains`). All user-facing strings introduced by this change SHALL resolve through these keys.

#### Scenario: Section headers resolve through i18n
- **WHEN** the diff body renders an image-definition or firewall activity
- **THEN** the section headers shown are the values of the corresponding i18n keys resolved through `useI18n`
- **AND** the keys exist in `apps/ai-dial-admin/src/locales/en.ts`

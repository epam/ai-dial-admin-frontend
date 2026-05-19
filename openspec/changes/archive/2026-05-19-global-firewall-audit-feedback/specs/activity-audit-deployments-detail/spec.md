## ADDED Requirements

### Requirement: Resource identifier row hidden for global firewall activities

The `AuditView` header SHALL NOT render the Resource identifier `LabelledText` row (the identifier text together with its "open in new tab" icon) when the activity's `resourceType` is `ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST` (global firewall). This SHALL be implemented by adding `IMAGE_BUILD_DOMAIN_WHITELIST` to the existing exclusion chain that already suppresses the row for `SYSTEM_PROPERTIES` and `ADMIN_PROPERTIES`.

Rationale: the `auditResourceRoute` map has no entry for `IMAGE_BUILD_DOMAIN_WHITELIST`, so the icon goes nowhere, and the synthetic resource identifier for a global-firewall audit entry is not a meaningful user-facing reference. Suppressing the entire row brings global-firewall activities in line with the existing suppression for `SYSTEM_PROPERTIES` and `ADMIN_PROPERTIES`.

#### Scenario: Row hidden for global firewall activity
- **GIVEN** an audit-detail page is open for an activity whose `resourceType` is `IMAGE_BUILD_DOMAIN_WHITELIST`
- **WHEN** the header renders
- **THEN** the Resource identifier `LabelledText` row SHALL NOT be rendered (no identifier text, no icon)

#### Scenario: Row still rendered for container activities
- **GIVEN** an audit-detail page is open for an activity whose `resourceType` is any of `McpDeployment`, `AdapterDeployment`, `ApplicationDeployment`, `InterceptorDeployment`, `NimDeployment`, or `InferenceDeployment`
- **WHEN** the header renders
- **AND** the activity type is not Delete
- **THEN** the Resource identifier row SHALL be rendered with both text and the clickable "open in new tab" icon
- **AND** clicking the icon SHALL behave as defined by the existing "Resource identifier chip navigates to the container's edit page" requirement

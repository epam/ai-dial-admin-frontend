## ADDED Requirements

### Requirement: Alias bulk selection is isolated by source

The system SHALL offer bulk selection and deletion on both the Public and Platform Alias grids, independently for each source. Confirming deletion SHALL delete the selected aliases from the active source using DIAL Core's `DELETE /v1/aliases/<bucket>/<name>` contract and SHALL NOT delete aliases in another bucket or their targets.

#### Scenario: Delete Public aliases

- **WHEN** an admin selects and confirms deletion of multiple aliases on the Public tab
- **THEN** the system requests deletion of those `aliases/public/` resources, and their targets and any Platform aliases remain untouched

#### Scenario: Delete Platform aliases

- **WHEN** an admin selects and confirms deletion of multiple aliases on the Platform tab
- **THEN** the system requests deletion of those `aliases/platform/` resources, and their targets and any Public aliases remain untouched

#### Scenario: Same name in both buckets

- **WHEN** an alias with the same name exists in both buckets and an admin bulk-deletes the Public alias
- **THEN** only the Public alias is requested for deletion

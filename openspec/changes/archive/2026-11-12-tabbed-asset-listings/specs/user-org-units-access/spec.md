## ADDED Requirements

### Requirement: Unit mode lists the Public source only

For a caller in unit mode, the listing, the folder breadcrumbs, the create dialog and the entity picker SHALL offer the Public source only. The Platform and config.json sources SHALL NOT be offered, no tab row SHALL be rendered, and no platform-bucket or config-file request SHALL be made.

#### Scenario: Create dialog
- **WHEN** a unit user opens the create dialog for an application
- **THEN** only the Public folder tree is offered and no Destination control is shown

#### Scenario: Listing has no tab row
- **WHEN** a unit user opens `/assets-applications`
- **THEN** the Public file manager is shown with no tab row and no Platform or config.json request is made

## REMOVED Requirements

### Requirement: File roots exclude the config-file and platform buckets
**Reason**: There are no `file` or `platform` roots to exclude; sources are tabs.
**Migration**: Replaced by "Unit mode lists the Public source only".

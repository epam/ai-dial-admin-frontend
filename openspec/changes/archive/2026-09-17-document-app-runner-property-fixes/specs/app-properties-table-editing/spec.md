## ADDED Requirements

### Requirement: Asset-origin runner preset parameters are treated as schema rows
The table's schema-derived rows SHALL be built from an Asset-origin App Runner's Core-resolved
schema, the same way they are built from the admin-BE-resolved schema for other runners, when the
application's currently-selected App Runner is Asset-origin (see the Parameters-tab
scheme-resolution requirement in `platform-app-runners`). A parameter contributed by an Asset-origin
runner's resolved schema is therefore a schema row, not a user-added row: it renders read-only
key/type and hides the Remove action, per the existing "Schema rows are read-only for key and type"
requirement.

#### Scenario: Preset parameter from an Asset-origin runner cannot be removed
- **WHEN** a user opens the Parameters Table view of an application whose selected App Runner was
  created through `Assets > App Runners` and defines a configuration schema
- **THEN** each parameter contributed by that schema appears as a schema row
- **AND** its row's Remove action is hidden, matching schema rows from admin-BE-origin runners

#### Scenario: A user-added parameter on the same application remains removable
- **WHEN** the same application also has a user-added parameter not defined by the runner's schema
- **THEN** that row's Remove action remains available


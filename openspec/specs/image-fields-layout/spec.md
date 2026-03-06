## ADDED Requirements

### Requirement: ImageBuildPrivileges grouped with base fields

The `ImageBuildPrivileges` component SHALL be rendered in the same visual group as `ImageBase` (name, description, version). A single divider SHALL separate this base group from the source group (`ImageSource` + `ImageTransport`).

#### Scenario: Properties view layout grouping
- **WHEN** the ImageFields component renders in Properties view (non-modal)
- **THEN** ImageBuildPrivileges SHALL appear after ImageBase, before the divider, and ImageSource + ImageTransport SHALL appear after the divider

#### Scenario: Modal view unchanged
- **WHEN** the ImageFields component renders in modal mode
- **THEN** ImageBuildPrivileges SHALL NOT be rendered (same as current behavior)

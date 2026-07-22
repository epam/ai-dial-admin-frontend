## ADDED Requirements

### Requirement: Toolset-resource `intro` and `vendorWebsite` carried through Core content/metadata mapping
The system SHALL include `intro` and `vendorWebsite` in the fields read from and written to DIAL Core when getting, creating, or updating a toolset resource, so both round-trip through the same content+metadata merge already used for other `AssetToolset` fields.

#### Scenario: Get returns intro and vendorWebsite
- **WHEN** `getToolset` fetches a toolset resource that has `intro` and `vendorWebsite` values in Core
- **THEN** the returned `AssetToolset` includes both values

#### Scenario: Create and update send intro and vendorWebsite
- **WHEN** `createToolset` or `updateToolset` is called with an `AssetToolset` that has non-empty `intro` and/or `vendorWebsite`
- **THEN** the request sent to Core includes those values

#### Scenario: Export includes intro and vendorWebsite
- **WHEN** a toolset with `intro` and/or `vendorWebsite` set is exported (JSON or archive)
- **THEN** the exported `AssetToolset` entry includes both fields, matching how other toolset fields are exported today

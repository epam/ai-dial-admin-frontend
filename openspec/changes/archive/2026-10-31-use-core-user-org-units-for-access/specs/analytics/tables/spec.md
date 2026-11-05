## MODIFIED Requirements

### Requirement: Analytics table role capability model

The system SHALL expose, on `AppContext`, the capability inputs for Analytics tables: `isFullAdmin`
(true when the caller's access resolves to full: authentication is disabled, org units are off, or Core reports
`adminAccess` `FULL`), the existing `isReadOnlyAdmin`, and `isEnableAuth`. The `AnalyticsTable` model SHALL
carry an optional
`permissions` object supplied by the data-access service, with the boolean flags `get`, `read`,
`sensitive`, `write`, `modify` and `rows_restricted`: the calling identity's effective per-table privileges
and whether a row policy confines it. A hook `useAnalyticsTablePermissions(table?)` (`src/hooks/`) SHALL
derive:

- `canCreate` SHALL equal `isFullAdmin`.
- `canDelete` SHALL equal `isFullAdmin && !table.system`.
- `canManageRoles` SHALL equal `isFullAdmin`, including on a system table, because the read-side grants and row policies of a system table are manageable.
- `canWrite` SHALL equal `table.permissions.write` when present, otherwise `!isEnableAuth`.
- `canModify` SHALL equal `table.permissions.modify` when present, otherwise `!isEnableAuth`.
- `canChangeSensitive` SHALL equal `canModify && table.permissions.sensitive` when `sensitive` is present, otherwise `!isEnableAuth`.
- `isRowsRestricted` SHALL equal `table.permissions.rows_restricted` when present, otherwise `false`.

#### Scenario: Full admin can act on a non-system table

- **WHEN** authentication is enabled, Core reports `adminAccess` `FULL`, and a non-system table reports
  `permissions {write:true, modify:true, sensitive:true}`
- **THEN** `canCreate`, `canDelete`, `canManageRoles`, `canWrite`, `canModify`, and `canChangeSensitive` are all `true`

#### Scenario: Per-table write without modify

- **WHEN** a table reports `permissions {write:true, modify:false}` and the caller is not a full admin
- **THEN** `canWrite` is `true`, `canModify` is `false`, and `canCreate`/`canDelete`/`canManageRoles`
  are `false`

#### Scenario: System table exposes no edits, even for a full admin

- **WHEN** a system table reports `permissions {write:false, modify:false}` (as the backend does for
  every caller) and the caller is a full admin
- **THEN** `canWrite`, `canModify`, and `canDelete` are `false`, and `canManageRoles` stays `true` so the read-side grants remain manageable

#### Scenario: Modify without the clearance cannot change sensitivity

- **WHEN** a table reports `permissions {modify:true, sensitive:false}`
- **THEN** `canModify` is `true` and `canChangeSensitive` is `false`

#### Scenario: Missing permissions default safely

- **WHEN** a table omits `permissions` and authentication is enabled
- **THEN** `canWrite`, `canModify`, and `canChangeSensitive` are `false` and `isRowsRestricted` is `false`; **AND WHEN** authentication is disabled the first three are `true` and `isRowsRestricted` stays `false`

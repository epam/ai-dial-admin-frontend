## ADDED Requirements

### Requirement: Analytics table role capability model

The system SHALL expose, on `AppContext`, the capability inputs for Analytics tables: `isFullAdmin`
(true when authentication is disabled, or when `userInfo.roles` includes `FULL_ADMIN`), the existing
`isReadOnlyAdmin`, and `isEnableAuth`. The `AnalyticsTable` model SHALL carry an optional
`permissions: { write: boolean; modify: boolean }` object supplied by the data-access service. A hook
`useAnalyticsTablePermissions(table?)` (`src/hooks/`) SHALL derive:

- `canCreate` and `canManageRoles` SHALL equal `isFullAdmin`.
- `canDelete` SHALL equal `isFullAdmin && !table.system`.
- `canWrite` SHALL equal `table.permissions.write` when present, otherwise `!isEnableAuth`.
- `canModify` SHALL equal `table.permissions.modify` when present, otherwise `!isEnableAuth`.

#### Scenario: Full admin can act on a non-system table

- **WHEN** authentication is enabled, the user is `FULL_ADMIN`, and a non-system table reports
  `permissions {write:true, modify:true}`
- **THEN** `canCreate`, `canDelete`, `canManageRoles`, `canWrite`, and `canModify` are all `true`

#### Scenario: Per-table write without modify

- **WHEN** a table reports `permissions {write:true, modify:false}` and the user is not `FULL_ADMIN`
- **THEN** `canWrite` is `true`, `canModify` is `false`, and `canCreate`/`canDelete`/`canManageRoles`
  are `false`

#### Scenario: System table exposes no edits

- **WHEN** a system table reports `permissions {write:false, modify:false}` (as the backend does for
  every caller)
- **THEN** `canWrite`, `canModify`, and `canDelete` are `false`

#### Scenario: Missing permissions default safely

- **WHEN** a table omits `permissions` and authentication is enabled
- **THEN** `canWrite` and `canModify` are `false`; **AND WHEN** authentication is disabled they are
  `true`

### Requirement: Tables catalog gates catalog-level actions to full admins

The Tables catalog view (`components/Analytics/Tables/TablesView.tsx`) SHALL render the "Create source"
and "Create enrichment" buttons and the per-row Delete action only when the user is `FULL_ADMIN`
(`canCreate` / `canDelete`). The existing per-row rule keeping Delete unavailable for system tables
SHALL be preserved. Read paths (listing and opening tables) SHALL be unaffected.

#### Scenario: Full admin sees catalog actions

- **WHEN** the catalog renders for a `FULL_ADMIN`
- **THEN** both create buttons and the row Delete action are present

#### Scenario: Non-admin sees a read-only catalog

- **WHEN** the catalog renders for a user who is not `FULL_ADMIN` (auth enabled)
- **THEN** neither create button nor the row Delete action is rendered

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating
affordances independently:

- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Write rows** SHALL be shown only when `canWrite`.
- **Add columns**, per-column **edit/drop** (grid action column), **inline column rename**,
  column-metadata edits, and **description edits** SHALL be shown only when `canModify`.

Because the backend reports `permissions {false,false}` for system tables, these edit affordances hide
for system tables without a separate check.

#### Scenario: Write-capable, not modify-capable

- **WHEN** a table reports `permissions {write:true, modify:false}`
- **THEN** "Write rows" is present, and "Add columns", the per-column action column, and inline rename
  are absent

#### Scenario: Modify-capable, not write-capable

- **WHEN** a table reports `permissions {write:false, modify:true}`
- **THEN** the schema-edit affordances and per-column action column are present, and "Write rows" is
  absent

#### Scenario: Delete stays admin-only

- **WHEN** a non-system table reports edit permissions but the user is not `FULL_ADMIN`
- **THEN** the "Delete table" button is absent

### Requirement: Full-admin per-table role management panel

The table detail view SHALL provide a panel to view and manage the table's `write` / `modify`
provider-role lists, backed by `AnalyticsDataApi.getTableAccess` / `replaceTableAccess`
(`GET` / `PUT /v1/tables/{name}/access`) and a `TableAccess { write: string[]; modify: string[] }`
model. Because the backend restricts `GET /access` to `FULL_ADMIN`, the panel SHALL be shown only when
`canManageRoles` (`FULL_ADMIN`); a save SHALL full-replace the lists via `replaceTableAccess`. Role
names SHALL be entered as free text (no roles-list source); blank role names SHALL be rejected before
submit and duplicates de-duplicated.

#### Scenario: Full admin edits the role lists

- **WHEN** a `FULL_ADMIN` opens the role panel, adds a role to the `write` list, and saves
- **THEN** `replaceTableAccess` is called with the full updated `{write, modify}` lists

#### Scenario: Panel hidden for non-admins

- **WHEN** the detail view renders for a user who is not `FULL_ADMIN`
- **THEN** the role-management panel is not shown

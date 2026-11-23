# user-org-units-access Specification

## Purpose
The caller's access as DIAL Core reports it (`GET /v1/user/role-assignments`: `adminAccess` plus the units the caller
works in, with roles and permissions): the start-mode gate (full, unit or denied, with 404 and auth-off as
full), how `AppContext` exposes it, and the unit-mode rules for menu sections, folder write actions, approve
and reject, and the role-assignments tab. Replaces the admin backend's security-info as the source of roles —
created by archiving change `use-core-user-org-units-for-access`.
## Requirements
### Requirement: The caller's access is read from Core
The system SHALL read the caller's access with one `GET /v1/user/role-assignments` call to DIAL Core per request,
authenticated with the caller's token, and expose it as `adminAccess` (`FULL`, `NONE`) and `units` (each with
`id`, `name`, `displayName`, `path`, `folder`, `roles`, and `permissions` as actions by namespace). The admin
backend SHALL NOT be asked about roles. The layouts and server-side checks SHALL share that one call within a
request.

#### Scenario: One Core call serves the whole request
- **WHEN** the root layout, the `[lang]` layout and a server-side admin check all need the caller's access in
  the same request
- **THEN** `GET /v1/user/role-assignments` is issued once

#### Scenario: Roles never come from the admin backend
- **WHEN** `DIAL_ADMIN_API_URL` is set and the access is read
- **THEN** no request goes to the admin backend's security-info endpoint

### Requirement: Start mode follows the access read
The system SHALL resolve one of three modes. Authentication disabled SHALL resolve to full without calling
Core. A `404` answer (org units off) SHALL resolve to full. `adminAccess` `FULL` SHALL resolve to full.
`adminAccess` `NONE` with at least one unit that grants `read` on a namespace the panel shows a section for SHALL
resolve to unit mode. `NONE` with no units, with units that grant `read` on no such namespace (a caller whose only
role is `member` holds `org-units: read` alone), or any other failure, SHALL resolve to denied, which renders the 403
page with no menu.

#### Scenario: Full admin
- **WHEN** Core answers `adminAccess: FULL`
- **THEN** the full panel renders and `isFullAdmin` is `true`

#### Scenario: Unit user
- **WHEN** Core answers `adminAccess: NONE` with one or more units, one of which grants `read` on a content namespace
- **THEN** the panel renders in unit mode, `isFullAdmin` is `false` and `isUnitMode` is `true`

#### Scenario: Unit user holding only a publications read
- **WHEN** Core answers `adminAccess: NONE` with a unit that grants `publications: [read]` and nothing else
- **THEN** the panel renders in unit mode

#### Scenario: No access
- **WHEN** Core answers `adminAccess: NONE` with no units
- **THEN** the 403 page renders

#### Scenario: Member-only caller
- **WHEN** Core answers `adminAccess: NONE` with a unit whose permissions are `org-units: [read]` only
- **THEN** the 403 page renders, with no menu and no panel
- **AND** `isUnitMode` is `false`

#### Scenario: Member above a unit with content
- **WHEN** Core answers `adminAccess: NONE` with `public/Acme/` granting `org-units: [read]` and `public/Acme/Risk/`
  granting `applications: [read]`
- **THEN** the panel renders in unit mode
- **AND** both units remain in the caller's units

#### Scenario: Org units off
- **WHEN** Core answers `404` for the access read
- **THEN** the caller is treated as a full admin and the full panel renders

#### Scenario: Authentication disabled
- **WHEN** authentication is disabled
- **THEN** the caller is treated as a full admin and Core's access endpoint is not called

#### Scenario: Access read fails
- **WHEN** the access read answers `401`, `403` or `5xx`
- **THEN** the 403 page renders

### Requirement: Identity stays on Core's user info
`AppContext.userInfo` SHALL carry `id` and `email` from `GET /v1/user/info` and no roles. A failed identity read
SHALL leave `userInfo` undefined and SHALL NOT change the start mode.

#### Scenario: Identity read fails for an admin
- **WHEN** the access read reports `FULL` and the `/v1/user/info` read fails
- **THEN** the full panel renders with `userInfo` undefined

### Requirement: AppContext exposes access and derived flags
`AppContext` SHALL expose the resolved access and derive `isFullAdmin` (mode is full), `isUnitMode` (mode is
unit) and `isReadOnlyAdmin` (the existing config-file entity override, or `adminAccess` `READ_ONLY`). Until Core
reports a read-only level, `isReadOnlyAdmin` SHALL be `false` for every caller except under the config-file
override. It SHALL also expose `canReadNamespace(namespace)` and `canWriteAt(namespace, path)`.

#### Scenario: Read-only is false for now
- **WHEN** Core answers `adminAccess: FULL` or `NONE`
- **THEN** `isReadOnlyAdmin` is `false` unless a config-file entity view has set the override

#### Scenario: Full admin may write anywhere
- **WHEN** the mode is full
- **THEN** `canReadNamespace` and `canWriteAt` are `true` for every namespace and path

#### Scenario: Write follows the owning unit
- **WHEN** the mode is unit, `public/Acme/Risk/` grants `applications: [read, write]` and `public/Acme/`
  grants only `org-units: [read]`
- **THEN** `canWriteAt('applications', 'public/Acme/Risk/models/')` is `true`
- **AND** `canWriteAt('applications', 'public/Acme/')` is `false`
- **AND** `canWriteAt('applications', 'public/Other/')` is `false` because no unit owns it

### Requirement: Unit-mode menu shows sections the caller can read
In unit mode the menu SHALL show a section only when any unit grants `read` on its namespace: Applications
`applications`, Toolsets `toolsets`, Prompts `prompts`, Files `files`, Skills `skills`, Projects `projects`,
Conversations `conversations`, Approvals `publications`, Folders Storage `role-assignments`. Items with no namespace
(every platform and admin-backend page) SHALL NOT be shown, and neither SHALL the Import config, Export config or
System properties actions. The layout SHALL NOT issue admin-only config reads, and file-manager views SHALL NOT
load the `platform` bucket root.

#### Scenario: Section needs read in some unit
- **WHEN** the only `read` on `prompts` is in one unit
- **THEN** the Prompts section is shown and a section with no `read` anywhere is hidden

#### Scenario: Platform is hidden in unit mode
- **WHEN** the mode is unit
- **THEN** no Platform group is shown, the admin config actions are absent, and the telemetry datasets read is not issued
- **AND** a dual-bucket file-manager view loads no `platform/` root

### Requirement: Unit-mode create, edit and delete follow write at the owning unit
In unit mode, create, edit and delete actions for a folder SHALL be offered only when `canWriteAt` holds for the
view's namespace and the folder path; otherwise the same action lists SHALL be the read-only ones.

#### Scenario: Writable folder
- **WHEN** the caller holds `write` on the namespace at the owning unit
- **THEN** the folder's create, edit and delete actions are offered

#### Scenario: Read-only folder
- **WHEN** the owning unit grants only `read`, or no unit owns the folder
- **THEN** those actions are not offered

#### Scenario: Detail view follows the owning unit
- **WHEN** a unit user opens a prompt, skill, application or toolset
- **THEN** its edit controls are enabled only if the unit owning its folder grants `write` on that namespace

### Requirement: Approve and reject need publications access in every touched unit
In unit mode, Approve and Reject SHALL be enabled only when the caller holds `read` and `write` on
`publications` at every unit the request touches: its target folder and each resource's target.

#### Scenario: One touched unit lacks write
- **WHEN** a request touches two units and `publications` `write` is held in only one
- **THEN** Approve and Reject are disabled

#### Scenario: All touched units allow it
- **WHEN** `publications` `read` and `write` are held at every touched unit
- **THEN** Approve and Reject are enabled

### Requirement: Role assignments tab follows role-assignments permission
The unit Role assignments tab SHALL be shown when `role-assignments` `read` is held at the unit, and its
mutating controls SHALL be enabled only with `write`. Renaming and removing the unit SHALL need `write` on
`org-units` there, and creating a top-level unit SHALL be unavailable in unit mode. The panel SHALL NOT probe
the call and handle a 403.

#### Scenario: Read without write
- **WHEN** a unit grants `role-assignments: [read]`
- **THEN** the tab lists assignments and add/remove controls are disabled

#### Scenario: No read
- **WHEN** a unit grants no `role-assignments` read
- **THEN** the tab is not shown

### Requirement: Admin-only reads are gated by admin access
The panel SHALL make admin-only Core reads (the config-file endpoints, platform runners and translators, roles, interceptors, the global interceptor chain and platform settings) only when `adminAccess` is `FULL`, never by testing for unit mode. A failed access read resolves to denied and SHALL NOT fall back to admin reads. One server helper SHALL make the decision for every page.

#### Scenario: Unit user
- **WHEN** `adminAccess` is `NONE` with units
- **THEN** no admin-only read is made on the application, applications-list, publication or toolset pages

#### Scenario: Access read failed
- **WHEN** the access read resolved to denied
- **THEN** the pages still make no admin-only read

#### Scenario: Full admin
- **WHEN** `adminAccess` is `FULL`
- **THEN** every picker reads the same sources as before

### Requirement: Dependency pickers use caller-scoped lists
For a caller without full admin access, runner options SHALL come from `GET /v1/application_type_schemas/schemas`, models from `GET /openai/models` and applications from `GET /openai/applications`. These hold exactly the deployments Core accepts as a dependency from that caller, which can be fewer than the config-file lists (a model limited by `userRoles` is refused even to an admin without the role). Platform runners, translators, roles, interceptors and global interceptors SHALL be skipped because no non-admin source exists.

#### Scenario: Pickers in the application editor
- **WHEN** a unit user opens the application editor
- **THEN** the runner, model and application pickers list the caller-scoped options and the roles and interceptor pickers have no options

### Requirement: Runner details resolve through the schema read
A runner's routes, interceptors and features SHALL be read through `GET /v1/application_type_schemas/schema?id=` for a caller without full admin access.

#### Scenario: Interceptors tab for a unit user
- **WHEN** a unit user opens an application whose runner is from the config file
- **THEN** the tab shows the resolved schema's interceptors and no config-file read is made

### Requirement: Interceptors and user roles are read-only without admin access
Interceptors and user roles SHALL be shown read-only to a caller without full admin access, because Core refuses interceptors from non-admins and drops their `userRoles` without an error. Whether unit users should see the roles field at all remains a product decision.

#### Scenario: Unit user with write permission
- **WHEN** a unit user with `write` on applications opens an application
- **THEN** the Interceptors and user-roles controls cannot be edited

### Requirement: Unit mode lists the Public source only

For a caller in unit mode, the listing, the folder breadcrumbs, the create dialog and the entity picker SHALL offer the Public source only. The Platform and config.json sources SHALL NOT be offered, no tab row SHALL be rendered, and no platform-bucket or config-file request SHALL be made.

#### Scenario: Create dialog
- **WHEN** a unit user opens the create dialog for an application
- **THEN** only the Public folder tree is offered and no Destination control is shown

#### Scenario: Listing has no tab row
- **WHEN** a unit user opens `/assets-applications`
- **THEN** the Public file manager is shown with no tab row and no Platform or config.json request is made


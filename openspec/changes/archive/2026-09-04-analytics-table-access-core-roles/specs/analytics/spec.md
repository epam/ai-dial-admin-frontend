## MODIFIED Requirements

### Requirement: Full-admin per-table role management panel

The table detail view SHALL provide a panel to view and manage the table's `write` / `modify` provider-role lists, backed by `AnalyticsDataApi.getTableAccess` / `replaceTableAccess` (`GET` / `PUT /v1/tables/{name}/access`) and a `TableAccess { write: string[]; modify: string[] }` model. Because the backend restricts `GET /access` to `FULL_ADMIN` and system tables carry no per-table roles to manage, the panel SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system); a save SHALL full-replace the lists via `replaceTableAccess`.

Role names SHALL be picked from a closed option list rather than typed. The catalog behind that list SHALL be DIAL Core's own merged role population — the union of the roles written through Core's API and the roles declared in Core's configuration file, merged by bare name with an API-written entry superseding a configuration-file entry of the same name, and degrading to whichever population could be read rather than to an empty catalog. The admin backend's roles list SHALL NOT be requested: it is a third copy that is neither population, it can hold a role Core does not, and it is being retired — every other role picker in the application already reads Core. Each option's value SHALL be the role's bare name, which is the raw provider-role string the backend matches against; there is no separate role id, and no resource reference is ever stored.

The options SHALL be presented in alphabetical order, independently of the order the two populations were read in, so a role can be found by name.

The options SHALL additionally include every role name the table already grants, even when the catalog does not offer it. A closed select renders only the values that match an option, so without this a grant naming a role outside the catalog — one declared only in Core's configuration file, or any of them when the catalog read failed — would be invisible and would be dropped by the next unrelated edit, silently revoking access that is still in effect.

While the initial fetch (the table's current access and the role catalog, requested together) is in flight the panel SHALL show a loading spinner in place of the role pickers. A failed access fetch and a failed role-catalog fetch SHALL each surface their own error notification (the two requests can fail independently); Save SHALL stay disabled until the access fetch succeeds. A failed role-catalog fetch SHALL still leave the table's existing grants selected and selectable rather than emptying the lists.

#### Scenario: Full admin edits the role lists

- **WHEN** a `FULL_ADMIN` opens the role panel, checks a role in the `write` list, and saves
- **THEN** `replaceTableAccess` is called with the full updated `{write, modify}` lists

#### Scenario: Panel hidden for non-admins

- **WHEN** the detail view renders for a user who is not `FULL_ADMIN`
- **THEN** the role-management panel is not shown

#### Scenario: Panel hidden for system tables even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail view
- **THEN** the role-management panel is not shown

#### Scenario: Loading spinner while fetching

- **WHEN** the panel opens
- **THEN** a loading spinner is shown until both the table's current access and the role catalog have been fetched

#### Scenario: Every catalog role is offered, not just the granted ones

- **WHEN** the role catalog loads
- **THEN** each write/modify picker offers every catalog role as an option, with already-granted roles selected

#### Scenario: Options are ordered alphabetically

- **WHEN** the catalog resolves in an order other than alphabetical
- **THEN** each picker presents its options sorted by name

#### Scenario: The admin backend's roles list is not requested

- **WHEN** the panel opens
- **THEN** no request is made to the admin backend's roles endpoint

#### Scenario: A granted role outside the catalog stays offered and survives a save

- **WHEN** the panel opens for a table whose stored `write` list contains a role the catalog does not offer
- **THEN** that role is offered as a selected option in the `write` picker
- **AND** a save made after editing only the `modify` list sends the `write` list back unchanged

#### Scenario: Roles-catalog fetch failure is surfaced independently

- **WHEN** the role catalog fails to load even though the table's current access loads successfully
- **THEN** an error notification distinct from the access-load-failure notification is shown
- **AND** the roles the table already grants remain offered and selected

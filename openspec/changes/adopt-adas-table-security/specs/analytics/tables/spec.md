## ADDED Requirements

### Requirement: Access tab lists a table's roles

The table detail view SHALL offer an **Access** tab to a user for whom `canManageRoles` is true, on a table that has an `ACTIVE` status (see "Table detail view is organized into Properties, Access and Audit tabs"). Its content SHALL be backed by `GET /v1/tables/{name}/access` and `GET /v1/tables/{name}/row-policies` of the data-access service, requested together when the detail view of such a table loads, so the tab's presence is known before the tab is opened.

The tab SHALL NOT be offered when the access read answers `403` — the service requires `TABLE_GRANT` for it, which `FULL_ADMIN` normally carries but an operator may configure away — and that answer SHALL produce no notification, because a user who cannot manage grants has nothing to be told. Any other failure of either request SHALL surface an error notification, SHALL leave the tab offered with an empty roles table, and SHALL keep **Add role** and every row action disabled until a reload succeeds.

The tab SHALL render a roles table with one row per such role, sorted by role name, with these columns:

- **Role**: the role name, with a sensitive indicator when the role is in the `sensitive` list.
- **Get**, **Read**, **Write**, **Modify**: a mark per privilege. A privilege the role holds through its own stored list SHALL show a full mark. A privilege the role holds only by implication — `get` through `read` or `modify` — SHALL show a lighter mark, and a stored list SHALL NOT be reported as expanded by that implication. A privilege the role does not hold SHALL show a neutral placeholder.
- **Rows**: the role's row limit rendered as a readable condition summary when the role has a row policy; otherwise **All rows** when the role holds `read`; otherwise **Cannot read rows**.

A role that has a row policy and no grant SHALL be listed, with every privilege mark neutral and its row limit shown. The roles table SHALL offer a role-name search and two filters, **Can read** and **Rows limited**, applied on the client to the loaded rows. Selecting a row SHALL open the role drawer on that role (see "Role drawer edits one role's access and row limit"); **Add role** SHALL open it on a new role.

Every row SHALL be operable by keyboard, and a row's mark cells SHALL carry an accessible name stating the privilege and whether it is stored or implied.

#### Scenario: A table's roles are listed with their grants

- **GIVEN** a table whose `read` list names `team-x` and whose `write` list names `ingest-bot`
- **WHEN** a `FULL_ADMIN` opens its Access tab
- **THEN** one row is shown for each role, sorted by name
- **AND** `team-x` shows a lighter **Get** mark and a full **Read** mark, and `ingest-bot` shows a full **Write** mark

#### Scenario: The stored list is not shown as expanded

- **GIVEN** a table whose `read` list names `team-x` and whose `get` list is empty
- **WHEN** the tab renders
- **THEN** the **Get** mark of `team-x` is the lighter, implied mark, not the full one

#### Scenario: Rows column states what each role reads

- **GIVEN** `team-x` has a row policy, `pii-analysts` holds `read` and has none, and `ingest-bot` holds only `write`
- **WHEN** the tab renders
- **THEN** `team-x` shows its condition summary, `pii-analysts` shows **All rows**, and `ingest-bot` shows **Cannot read rows**

#### Scenario: A role with only a row policy is listed

- **GIVEN** a role that has a row policy and appears in no grant list
- **WHEN** the tab renders
- **THEN** the role is listed with every privilege mark neutral and its row limit shown

#### Scenario: The tab is hidden when the access read is forbidden

- **GIVEN** a `FULL_ADMIN` whose `GET /access` answers `403`
- **WHEN** the detail view of an `ACTIVE` table loads
- **THEN** no Access tab is offered and no notification is shown

#### Scenario: Another failure is surfaced and keeps the tab

- **WHEN** the access read fails with a status other than `403`
- **THEN** an error notification is shown, the Access tab is offered with an empty roles table, and **Add role** is disabled

#### Scenario: Filters narrow the loaded rows

- **WHEN** the user selects **Can read**
- **THEN** only the roles that hold `read` remain listed, without a new request

### Requirement: Role drawer edits one role's access and row limit

The Access tab SHALL edit a role in a **drawer** that opens over the right edge of the page, keeps the roles table visible, and closes with its close control, with Escape, and with **Cancel**. The drawer SHALL hold the following steps in order, each addressable by a numbered heading:

1. **Role**: for a new role, a single-choice picker over the role catalog described in "Role catalog for the drawer", offering only roles that have no entry on the table; for an existing role, the role's name, read-only. A role that already has an entry is edited by selecting its row.
2. **What it can do**: shown only once a role is chosen (always, for an existing role); four selectable cards — **Get**, **Read**, **Write**, **Modify**. **Get** SHALL show as held, with the note that it comes from **Read** or **Modify**, while either is selected, and SHALL then be neither separately togglable nor stored by this save unless it was already stored.
3. **Sensitive columns**: a switch that grants the sensitive clearance, naming the table's sensitive columns. A note beneath it SHALL state that the clearance belongs to the role and covers everything it can do on this table. This step SHALL be offered only while **Get**, **Read** or **Modify** is held, stored or implied, because the clearance authorizes nothing by itself.
4. **Which rows can it read?**: **All rows** or **Only some rows**. This step SHALL be offered only while **Read** is selected. **Only some rows** reveals the row-limit editor (see "Row-limit editor"). A note in this step SHALL state that the limit also applies to SQL, CSV export and Flight SQL.

On a `system` table, **Write** and **Modify** SHALL be locked and unselected, with the reason that the service feeds system tables so they cannot be written to or changed, and that read access and row limits work as on any table. Steps 3 and 4 SHALL work as on any other table.

The footer SHALL offer the actions **Cancel** and **Save role**.

**Save role** SHALL be disabled until the role is chosen and at least one privilege is held or a row limit is set, and while a request is in flight. It SHALL change the role's membership in each of the five grant lists and nothing else: the drawer SHALL read the table's lists again immediately before saving, add or remove only this role in each list whose membership for it changed, and send only the keys that changed through `PUT /v1/tables/{name}/access`, which merges by key. The roles of every other grantee in every list SHALL be preserved. The row policy SHALL then be saved by a second request (see "Row-limit editor").

A successful save SHALL show a success notification, update the roles table from the service's response, and close the drawer, unless the response reports grants that change nothing (see "Drawer reports grants that change nothing"). A save that fails SHALL show an error notification carrying the service's message and request id, SHALL leave the drawer open with the user's input intact, and SHALL change nothing in the roles table.

Turning **Read** off SHALL leave the role's existing row policy untouched: that policy still narrows the role if it reads the table by another path, and removing it would widen the role's access.

#### Scenario: Adding a role grants Read and implies Get

- **WHEN** the user chooses **Add role**, picks `team-z`, selects **Read**, and saves
- **THEN** `PUT /access` is sent with a `read` list that contains `team-z` and every previous member
- **AND** the roles table shows `team-z` with a full **Read** mark and an implied **Get** mark

#### Scenario: Other roles' membership is preserved

- **GIVEN** the `read` list contains `team-x` and `pii-analysts`
- **WHEN** the user grants **Write** to `ingest-bot` and saves
- **THEN** only the `write` key is sent, and the `read` list is not sent

#### Scenario: The lists are read again before they are changed

- **GIVEN** another admin added `analysts` to the `read` list after this view loaded
- **WHEN** the user grants `team-z` **Read** and saves
- **THEN** the `read` list sent contains `analysts` as well as `team-z`

#### Scenario: Nothing below the role is shown until a role is chosen

- **WHEN** the drawer opens on a new role and no role is chosen
- **THEN** only the **Role** step is shown, with no privilege cards
- **AND WHEN** a role is chosen
- **THEN** the **What it can do** step appears

#### Scenario: Sensitive is offered only with a verb

- **WHEN** no privilege is selected
- **THEN** the **Sensitive columns** step is not offered
- **AND WHEN** **Modify** is selected
- **THEN** the step is offered

#### Scenario: The row step is offered only for Read

- **WHEN** only **Write** is selected
- **THEN** the **Which rows can it read?** step is not offered
- **AND WHEN** **Read** is selected
- **THEN** it is offered with **All rows** chosen for a role that has no row policy

#### Scenario: A system table locks Write and Modify

- **WHEN** the drawer is opened on a `system` table
- **THEN** **Write** and **Modify** are locked with the stated reason, and **Read**, the sensitive switch and the row step behave as on any table

#### Scenario: Turning Read off keeps the row policy

- **GIVEN** a role with a row policy
- **WHEN** the user deselects **Read** and saves
- **THEN** no request to the row-policies endpoint is sent

#### Scenario: A failed save keeps the drawer open

- **WHEN** `PUT /access` fails
- **THEN** an error notification shows the service's message and request id
- **AND** the drawer stays open with the selections unchanged and the roles table unchanged

#### Scenario: The drawer closes with Escape

- **WHEN** the drawer is open and the user presses Escape
- **THEN** it closes without sending a request

### Requirement: Role catalog for the drawer

The role picker SHALL be fed from DIAL Core's own merged role population, and the option rules of the earlier per-table role panel SHALL be kept: the catalog is the union of the roles written through Core's API and the roles declared in Core's configuration file, merged by bare name with an API-written entry superseding a configuration-file entry of the same name, and degrading to whichever population could be read rather than to an empty catalog. The admin backend's roles list SHALL NOT be requested. Each option's value SHALL be the role's bare name, which is the raw provider-role string the service matches against; no resource reference is ever stored.

Options SHALL be presented in alphabetical order, independently of the order the two populations were read in. A role the table already names in any list or policy SHALL always be offered when editing that role, even when the catalog does not contain it, so a grant to a role outside the catalog is never invisible and never silently revoked.

While the catalog is being fetched the picker SHALL show a loading state. A failed catalog fetch SHALL surface its own error notification, distinct from the access-load failure, and SHALL leave the roles already on the table listed and editable.

#### Scenario: Options are ordered alphabetically

- **WHEN** the catalog resolves in an order other than alphabetical
- **THEN** the picker presents its options sorted by name

#### Scenario: The admin backend's roles list is not requested

- **WHEN** the drawer opens
- **THEN** no request is made to the admin backend's roles endpoint

#### Scenario: A granted role outside the catalog stays editable

- **GIVEN** the table's `write` list names a role the catalog does not offer
- **WHEN** the user opens that role's row
- **THEN** the drawer shows that role and a save made after changing only another step keeps the role in the `write` list

#### Scenario: A catalog failure is surfaced independently

- **WHEN** the role catalog fails to load while the table's access loads
- **THEN** an error notification distinct from the access-load failure is shown
- **AND** the roles on the table remain listed

#### Scenario: Roles that already have an entry are not offered for a new role

- **GIVEN** `team-x` already has an entry on the table
- **WHEN** the user opens **Add role**
- **THEN** `team-x` is not offered in the picker

### Requirement: Row-limit editor

When the user chooses **Only some rows**, the drawer SHALL show a row-limit editor that builds a predicate over the table's own columns. The editor SHALL be the filter-condition editor of the Query Builder's Filter section, shared rather than duplicated, and SHALL show the same condition and group controls, operators, value inputs and operator rules for the same column types. It SHALL NOT depend on a Query Builder's state: its columns SHALL be the table's stored columns — sensitive columns included, whatever the viewer sees — and it SHALL offer no function operand, no parameter and no aggregate, because the service refuses a row-policy filter that uses them. A column the table does not store, including a dotted enrichment field, SHALL NOT be offered.

The editor SHALL also offer a **JSON** view of the same predicate in the service's stable filter serialization — the one the Query Builder's JSON view uses — and a predicate that nests deeper than the visual editor can hold SHALL open in the JSON view with a note saying why, without changing it. Editing the predicate in either view SHALL keep the other in step when the predicate is representable visually.

Saving a role with **Only some rows** SHALL send `PUT /v1/tables/{name}/row-policies/{role}` with the body `{"filter": …}`. Saving with **All rows** for a role that has a row policy SHALL send `DELETE /v1/tables/{name}/row-policies/{role}`; a `404` answer to that delete SHALL be treated as success, because it means the policy is already gone. Saving with **All rows** for a role that has no row policy SHALL send nothing to that endpoint. **Only some rows** with an empty predicate SHALL NOT be savable. A visual predicate holding a condition that names no column, or a nested group with no members, SHALL NOT be savable either, and the editor SHALL say so: serialization skips such an element, so what would be stored is wider than what the editor shows. An invalid JSON predicate SHALL NOT be sent, and leaving the JSON view for text that is not a filter (an empty or blank document is an empty predicate, not such text) SHALL keep the JSON view with a message of its own, distinct from the one for a predicate that is too deep.

The two requests of **Save role** are independent. When the grants save succeeds and the row-policy request fails, the drawer SHALL stay open, the roles table SHALL show the saved grants, an error notification SHALL carry the service's message — which names the offending field for a `422` — and the footer's action SHALL become **Save row limit**, which repeats only the row-policy request. The note on screen SHALL state exactly what was saved. A predicate the service rejects for a field the user can see in JSON SHALL have that field highlighted there when the service names it.

#### Scenario: A row limit is saved with the grants

- **WHEN** the user selects **Read**, chooses **Only some rows**, builds `project_id is one of Z-PRJ-3, Z-PRJ-4`, and saves
- **THEN** `PUT /access` is sent, then `PUT /row-policies/{role}` with a `filter` for that predicate

#### Scenario: Switching to All rows removes the limit

- **GIVEN** a role with a row policy
- **WHEN** the user chooses **All rows** and saves
- **THEN** `DELETE /row-policies/{role}` is sent
- **AND** a `404` answer does not produce an error notification

#### Scenario: All rows on a role without a policy sends nothing

- **GIVEN** a role without a row policy
- **WHEN** the user keeps **All rows** and saves
- **THEN** no request to the row-policies endpoint is sent

#### Scenario: A rejected row limit keeps the saved grants

- **GIVEN** the grants save succeeds and the row-policy request answers `422` naming `region`
- **THEN** an error notification shows the service's message
- **AND** the drawer stays open, the roles table shows the saved grants, and the footer action reads **Save row limit**
- **AND WHEN** the user fixes the predicate and chooses **Save row limit**
- **THEN** only the row-policy request is sent again

#### Scenario: A deeply nested predicate opens as JSON

- **GIVEN** a role whose stored predicate nests deeper than the visual editor holds
- **WHEN** the drawer opens on it
- **THEN** the row-limit editor shows the JSON view with a note that the predicate is too deep for the visual editor, and the predicate is unchanged

#### Scenario: Only the table's own columns are offered

- **WHEN** the user adds a condition
- **THEN** the column picker lists the table's stored columns, including a sensitive column, and no dotted enrichment field

#### Scenario: Function operands are not offered

- **WHEN** the user edits a condition in the row-limit editor
- **THEN** no function operand is offered for either side

#### Scenario: An unfinished condition keeps the limit from being saved

- **GIVEN** one condition on `project_id` is filled and a second condition has no column chosen
- **THEN** the editor says an unfinished condition is not stored, and **Save role** is disabled

#### Scenario: An empty JSON document returns to the visual view

- **WHEN** no condition was added, the user switches to the JSON view, and then back to the visual view
- **THEN** the visual view returns with no conditions and no message, and the empty document is not treated as invalid JSON

#### Scenario: Text that is not a filter keeps the JSON view with its own message

- **WHEN** the JSON text is not a filter and the user switches to the visual view
- **THEN** the JSON view stays, with a message that the JSON is not a valid filter, not the too-deep message

#### Scenario: An empty predicate cannot be saved

- **WHEN** **Only some rows** is chosen and no condition has been added
- **THEN** **Save role** is disabled

### Requirement: Drawer reports grants that change nothing

When `PUT /access` answers with `ineffective_grants`, the drawer SHALL stay open after the save, SHALL render one in-drawer banner entry per reported grant beside the card or step it concerns, using the entry's `message` verbatim, and SHALL change its primary action from **Save role** to **Done**. A banner is for a grant that was stored and has no effect — it is not an error and SHALL NOT be shown as a notification. An entry whose `key` is `read` SHALL mark the **Read** card; an entry whose `key` is `sensitive` SHALL mark the sensitive step.

The row limit of a role whose grant changed nothing SHALL still be saved and shown, because a row policy applies to its role whatever path the role reads the table by.

An error response to `PUT /access` — a `403`, a `404`, a `409 table_is_system` or a `422`, including `sensitive_grant_widens` — SHALL be an error notification carrying the service's message and request id, and SHALL NOT be shown as a banner.

#### Scenario: A grant the service reports as redundant shows a banner

- **GIVEN** the service answers with `ineffective_grants` of reason `already_global` for the `read` key
- **THEN** the drawer stays open and the **Read** card carries a banner with the entry's `message`
- **AND** the primary action reads **Done**
- **AND** no notification is shown for it

#### Scenario: Done closes the drawer

- **WHEN** the drawer shows **Done** and the user selects it
- **THEN** the drawer closes without sending a request

#### Scenario: A refusal is a notification

- **WHEN** `PUT /access` answers `422` with the code `sensitive_grant_widens`
- **THEN** an error notification shows the service's message and request id
- **AND** the drawer stays open, nothing is saved, and no banner is shown for it

#### Scenario: A row limit is still saved beside a banner

- **GIVEN** the save reports a redundant grant and the role has a row limit
- **THEN** the row-policy request is sent and the roles table shows the limit

### Requirement: Remove a role from a table

The roles table SHALL offer **Remove role** on each row, which opens a confirmation dialog titled with the role name. The dialog SHALL list what will be removed: the table, the role's privileges (**Read (with Get)** where Get is implied), and its row limit when it has one, and SHALL state that both the access and the row limit are removed and that, if the role also reads every table through its privilege mapping, its users will then see every row of this table.

Confirming SHALL remove the role from every grant list that names it and delete its row policy when it has one: one `PUT /access` sending only the keys that named the role, and one `DELETE /row-policies/{role}`. A `404` answer to that delete SHALL be treated as success. A confirmed removal SHALL show a success notification and drop the role from the roles table. A failure of either request SHALL show an error notification and SHALL leave the roles table reflecting only what was actually removed.

#### Scenario: The dialog names what is removed

- **GIVEN** `team-x` holds `read` and has a row limit
- **WHEN** the user selects **Remove role** on its row
- **THEN** the dialog names `team-x`, the table, **Read (with Get)** and the row limit
- **AND** it warns that the users of the role may then see every row

#### Scenario: Confirming removes grants and policy

- **WHEN** the user confirms
- **THEN** a `PUT /access` carrying only the changed keys without `team-x` is sent and `DELETE /row-policies/team-x` is sent
- **AND** the role disappears from the roles table

#### Scenario: Cancelling changes nothing

- **WHEN** the user cancels the dialog
- **THEN** no request is sent

#### Scenario: A role without a row limit sends no policy delete

- **GIVEN** a role that has no row policy
- **WHEN** the user confirms its removal
- **THEN** no request to the row-policies endpoint is sent

### Requirement: Rows restricted badge

A table whose `permissions.rows_restricted` is true SHALL show a **Rows restricted** badge, with a filter icon, on the table detail header beside the status badge, and in the Tables catalog row beside the table name. The detail header badge SHALL carry a tooltip stating that a row policy limits which rows of the table the user reads through every query surface. The limit itself — the policy's predicate — SHALL NOT be shown or requested for this user. A table whose `rows_restricted` is false or missing SHALL show no such badge.

The badge SHALL be shown to every viewer the service reports confined, whether or not the viewer can manage access.

#### Scenario: A confined user sees the badge

- **WHEN** a table reports `permissions.rows_restricted = true`
- **THEN** the detail header and the catalog row each show **Rows restricted**
- **AND** hovering the header badge shows the explanation

#### Scenario: An unconfined user sees no badge

- **WHEN** a table reports `rows_restricted = false` or omits it
- **THEN** no Rows restricted badge is shown

#### Scenario: The policy is not revealed

- **WHEN** a non-admin user views a table that reports `rows_restricted = true`
- **THEN** no request is made to the row-policies endpoint and no predicate is displayed

### Requirement: Changing a column's sensitivity is locked without the clearance

In the column editor, the **Sensitive** switch SHALL be locked, with a lock icon and a tooltip stating that changing sensitivity needs the sensitive clearance on this table, whenever the viewer's per-table permissions do not report both `modify` and `sensitive`, because the service refuses the change with `403` otherwise. A locked switch SHALL keep its current value visible and SHALL NOT be togglable. The rest of the editor SHALL stay editable.

#### Scenario: The switch is locked without the clearance

- **GIVEN** a viewer with `permissions.modify = true` and `permissions.sensitive = false`
- **WHEN** the column editor opens
- **THEN** the Sensitive switch shows the column's value, is not togglable, and shows the lock with its reason

#### Scenario: The switch is togglable with the clearance

- **GIVEN** a viewer with `permissions.modify = true` and `permissions.sensitive = true`
- **WHEN** the column editor opens
- **THEN** the Sensitive switch can be toggled

## MODIFIED Requirements

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown regardless of permission, as the header's primary action, for every `ACTIVE` **source** table and for every `ACTIVE` **enrichment** table whose payload names a source table (see "Table detail Connect panel").
- The **JSON-editor toggle** SHALL be shown on every `ACTIVE` table regardless of permission, because there it opens a read-only view of the stored definition and writes nothing (see "An ACTIVE table's definition is readable as JSON"); on a `PENDING`/`FAILED` table it SHALL be shown only when `canModify`, because there it authors the schema (see "JSON editor for a table draft"). It follows that an `ACTIVE` table always presents at least one header action, whatever the viewer's permissions are and whether or not Connect can be offered for it.
- **Add rows** SHALL NOT be offered for an **enrichment** table whatever its `write` permission reports: those rows come from the enrichment process, so a hand-written insert is not a path this UI offers.
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Managing who can do what on the table is **not** a header action: it lives in the **Access** tab, whose offer is decided by `canManageRoles` (see "Access tab lists a table's roles").
- Header controls SHALL be ordered **Delete table, Add columns, Add rows, Connect, copy JSON definition, JSON-editor toggle** — the **JSON-editor toggle last**, after the primary **Connect**, with the copy-definition control immediately before the toggle and present only while the JSON view is on (see "The displayed definition is copyable in one action"). **Connect** remains the header's only primary action, and it remains the last **action**; it is no longer the last control, because the two controls that follow it act on the view rather than on the table. The rule that replaces "primary action last" is therefore: **actions on the table come before Connect, view controls after it**, so a later header addition has a rule to follow rather than a precedent to guess at. While the JSON view of an `ACTIVE` table is on, only the copy-definition control and the toggle are rendered. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema"; its own JSON-editor toggle is likewise the last control of its row, where no primary action precedes it.

Because the backend reports `permissions {write:false, modify:false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Delete table** is gated on `FULL_ADMIN`, which the backend does not scope per-table, so it carries its own explicit `!table.system` check. The JSON-editor toggle is deliberately outside that set on an `ACTIVE` table: it mutates nothing, and a system table is exactly the table whose definition an operator most often needs to read as a document.

#### Scenario: Write-capable, not modify-capable

- **WHEN** a table reports `permissions {write:true, modify:false}`
- **THEN** the header shows an **Add rows** button and no **Add columns** button, and the per-column action column and inline rename are absent

#### Scenario: Modify-capable, not write-capable

- **WHEN** a table reports `permissions {write:false, modify:true}`
- **THEN** the schema-edit affordances and per-column action column are present, and the header shows an **Add columns** button and no **Add rows** button

#### Scenario: Neither capability hides the Add dropdown entirely

- **WHEN** a table reports `permissions {write:false, modify:false}`
- **THEN** neither **Add columns** nor **Add rows** is rendered, and no **Add** dropdown is rendered in their place either

#### Scenario: Add actions keep a fixed emphasis

- **WHEN** a table reports both permissions, and separately when it reports only one
- **THEN** **Add columns** and **Add rows** each render as a neutral action whenever present, and neither is promoted to primary by the other's absence
- **AND** **Connect** is the only primary action in the header

#### Scenario: Delete stays admin-only

- **WHEN** a non-system table reports edit permissions but the user is not `FULL_ADMIN`
- **THEN** the "Delete table" button is absent

#### Scenario: No header action manages access

- **WHEN** a `FULL_ADMIN` opens a non-system `ACTIVE` table's detail page
- **THEN** the header has no Manage access button, and access is managed from the Access tab

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the header has no Manage access button, as on any table, while the Access tab remains offered for its read-side grants

#### Scenario: A system table still offers Connect

- **WHEN** a user opens an `ACTIVE` system table's detail page
- **THEN** **Connect** is present while **Add rows**, **Add columns**, and **Delete table** are all absent
- **AND** the JSON-editor toggle is present, since it writes nothing

#### Scenario: An enrichment table offers Connect but never Add rows

- **WHEN** a user opens an `ACTIVE` enrichment table's detail page and its payload names a source table
- **THEN** **Connect** is present as the header's primary action
- **AND** no **Add rows** action is present, whatever the table's `write` permission reports

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the controls appear in the order Delete table, Add columns, Add rows, Connect, JSON-editor toggle — the toggle last, after the primary Connect
- **AND** with the JSON view on, only the copy-definition control and the toggle remain, the toggle last

#### Scenario: A not-yet-active table shows Save in their place

- **WHEN** the detail header renders for a `PENDING` or `FAILED` table and the user has `canModify`
- **THEN** **Save** is shown, and none of **Connect**, **Add columns**, or **Add rows** is

### Requirement: System-owned tables are read-only

The catalog and detail views SHALL reflect the table's server-provided `system` flag. System-owned tables are seeded server-side and reject every modifying request (`409 table_is_system`), so the UI SHALL NOT offer modify actions for them: in the catalog the row's delete action SHALL be hidden and a System indicator SHALL be shown; in the detail view the delete-table / write-rows / add-columns actions and the per-column edit/drop actions and inline rename SHALL be suppressed, replaced by a read-only indicator. System tables SHALL remain fully viewable and navigable, including their column display names and descriptions.

The **read-side** controls are the exception, because the service accepts read grants and row policies on a system table, which carries the shared data a policy most often narrows: a `FULL_ADMIN` SHALL still be offered the Access tab on an `ACTIVE` system table, where **Get**, **Read**, the sensitive clearance and row limits are editable and **Write** and **Modify** are locked with the reason (see "Role drawer edits one role's access and row limit").

#### Scenario: System table in the catalog

- **WHEN** the catalog lists a table whose `system` flag is true
- **THEN** the row shows a System indicator
- **AND** the row's delete action is not offered

#### Scenario: System table detail is read-only

- **WHEN** the user opens a system table's detail page
- **THEN** the delete-table, write-rows, and add-columns actions are absent and a read-only indicator is shown
- **AND** the column grid offers no edit/drop actions and no inline editing
- **AND** the table, its columns, and their display names and descriptions remain viewable

#### Scenario: A system table's access can still be managed

- **WHEN** a `FULL_ADMIN` opens an `ACTIVE` system table's detail page
- **THEN** the Access tab is offered
- **AND** its drawer allows **Read**, the sensitive switch and a row limit and locks **Write** and **Modify**

### Requirement: Analytics table role capability model

The system SHALL expose, on `AppContext`, the capability inputs for Analytics tables: `isFullAdmin`
(true when authentication is disabled, or when `userInfo.roles` includes `FULL_ADMIN`), the existing
`isReadOnlyAdmin`, and `isEnableAuth`. The `AnalyticsTable` model SHALL carry an optional
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

- **WHEN** authentication is enabled, the user is `FULL_ADMIN`, and a non-system table reports
  `permissions {write:true, modify:true, sensitive:true}`
- **THEN** `canCreate`, `canDelete`, `canManageRoles`, `canWrite`, `canModify`, and `canChangeSensitive` are all `true`

#### Scenario: Per-table write without modify

- **WHEN** a table reports `permissions {write:true, modify:false}` and the user is not `FULL_ADMIN`
- **THEN** `canWrite` is `true`, `canModify` is `false`, and `canCreate`/`canDelete`/`canManageRoles`
  are `false`

#### Scenario: System table exposes no edits, even for a full admin

- **WHEN** a system table reports `permissions {write:false, modify:false}` (as the backend does for
  every caller) and the user is `FULL_ADMIN`
- **THEN** `canWrite`, `canModify`, and `canDelete` are `false`, and `canManageRoles` stays `true` so the read-side grants remain manageable

#### Scenario: Modify without the clearance cannot change sensitivity

- **WHEN** a table reports `permissions {modify:true, sensitive:false}`
- **THEN** `canModify` is `true` and `canChangeSensitive` is `false`

#### Scenario: Missing permissions default safely

- **WHEN** a table omits `permissions` and authentication is enabled
- **THEN** `canWrite`, `canModify`, and `canChangeSensitive` are `false` and `isRowsRestricted` is `false`; **AND WHEN** authentication is disabled the first three are `true` and `isRowsRestricted` stays `false`

### Requirement: Table detail view is organized into Properties, Access and Audit tabs

The table detail view (`/tables/{name}`) SHALL, for a table whose `status` is `ACTIVE`, present its
content under a horizontal tab strip, built from the design system's 2.0 tabs component, with the tabs
**Properties**, **Access** and **Audit**, in that order. The **Access** tab SHALL be offered only as
"Access tab lists a table's roles" states; where it is not offered the strip carries **Properties** and
**Audit** alone. `Properties` SHALL be the selected tab when the view is first opened. The selected tab is
held by the view, as the other entity views' tabs are, and is not part of the URL.

The view header — the table name, the lifecycle status badge, the Rows restricted badge, the kind tag, the
system tag, the description row, and the whole header action row (Delete table, Add columns, Add rows,
Connect, and the draft **Save** action) — SHALL render **above** the tab strip and SHALL be otherwise unchanged
by this reorganization: the same controls, in the same order, under the same permission and status
conditions as before, visible whichever tab is selected. Every other element the "Table detail column
schema management", "Define and materialize a table schema", and "Table detail row writes"
requirements describe as being on the detail page — the read-only schema-metadata summary, the
columns grid or the draft schema editor, and the modals those actions open — SHALL render inside the
**Properties** tab where a tab strip is rendered, and directly beneath the header where it is not
(see the status and feature-flag conditions below). Whichever of the two applies, that content SHALL
be the same content, in the same order, as before this change.

The Audit tab SHALL be offered **only** on a table whose `status` is `ACTIVE`. On a table at any other
status — `PENDING` (Draft), `FAILED`, or a table whose status the backend does not report — the detail
view SHALL render no tab strip and no Audit or Access tab, SHALL render the Properties content directly, and
SHALL issue no request to the analytics activity feed or to the access and row-policy endpoints. A table that
has not been materialized has no audit history for the tab to show: it has no columns, and the analytics
activity feed returns zero activities for its name, so the tab could only ever be empty. On an `ACTIVE`
table the Audit tab SHALL require no permission beyond the one that already allows reading the table, and
SHALL NOT consult the per-table `write` / `modify` permissions.

The tab strip SHALL therefore be rendered only when `featureFlags.analyticsEnabled` is true **and**
the table's status is `ACTIVE`. With analytics disabled the detail view SHALL render the Properties
content directly, with no tab strip and no Audit or Access tab, and SHALL issue no request to the analytics
activity feed or to the access and row-policy endpoints — the same rendering as the non-`ACTIVE` case above.
The route itself is not guarded —
`/tables/{name}` renders whenever it is reached, today and after this change; hiding the Analytics
menu group is not a route guard, so a bookmarked or pasted link still opens this view and the tab
condition is what keeps an analytics-disabled installation from issuing an activity request. Guarding
the route is a separate concern about the whole tables feature and is out of scope here.

#### Scenario: Properties is the selected tab when the detail view opens

- **WHEN** the user opens the detail view of a table whose `status` is `ACTIVE`
- **THEN** a tab strip showing `Properties`, `Access` (for a viewer who can manage it) and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only schema-metadata summary and the columns grid are shown beneath it

#### Scenario: Header and its actions stay above the tab strip

- **GIVEN** the detail view of a table whose `status` is `ACTIVE`
- **WHEN** the user switches from `Properties` to `Access` or `Audit`
- **THEN** the table name, status badge, kind tag, description row, and every header action button
  the user's permissions allow remain rendered above the tab strip, unchanged

#### Scenario: A viewer who cannot manage access sees two tabs

- **GIVEN** a table whose `status` is `ACTIVE` and a user who is not `FULL_ADMIN`
- **WHEN** the detail view renders
- **THEN** the strip shows `Properties` and `Audit` only, and no request is made to the access or row-policy endpoints

#### Scenario: Audit tab is hidden on a draft table

- **GIVEN** a table whose `status` is `PENDING`
- **WHEN** the user opens its detail view
- **THEN** no tab strip and no `Audit` or `Access` tab are rendered
- **AND** the schema-metadata summary and the draft schema editor are shown directly, as they are
  before this change
- **AND** no request is issued to the analytics activity feed or to the access and row-policy endpoints

#### Scenario: Audit tab needs no permission beyond reading the table

- **GIVEN** a table whose `status` is `ACTIVE`
- **AND** a viewer whose per-table permissions report `write: false` and `modify: false`
- **WHEN** the user opens the table detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **AND** a table whose `status` is `ACTIVE` — so the flag alone decides
- **WHEN** the user reaches `/tables/{name}` by a direct link
- **THEN** no tab strip and no `Audit` or `Access` tab are rendered
- **AND** the schema-metadata summary and the columns grid or draft schema editor are shown directly
- **AND** no request is issued to the analytics activity feed or to the access and row-policy endpoints

### Requirement: An ACTIVE table's definition is readable as JSON

For a table whose `status` is `ACTIVE`, the table detail view SHALL offer among the header's actions the **same JSON-editor toggle a draft offers**, and activating it SHALL replace the view's whole body — the Properties/Audit tab strip included — with the table's stored definition rendered as a JSON document, **read-only**. The only difference from the draft's arrangement SHALL be that nothing inside the document can be changed. Toggling the control off SHALL restore the body as it was, on the tab the reader had selected; the toggle SHALL stay in the header while the document is shown, so the way back is visible at all times and no other surface of the page is reachable behind it.

The document SHALL be the **paste-ready write shape**, not the `GET /v1/tables/{name}` read body: the schema body for the table's kind — for a **source** `columns`, `ordering_key`, `partition_by`, and `identity_column`/`version_column` when the stored definition declares them; for an **enrichment** `columns`, `grain_key`, `cardinality` — plus the catalog metadata `description` and `tag_order`. It SHALL carry none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object. It SHALL be the identical document a `PENDING`/`FAILED` table's JSON editor seeds ("JSON editor for a table draft"), so a definition read here pastes into that editor on another environment with no member removed, renamed or unpacked. Each declared column SHALL carry the metadata the stored definition holds for it — its physical `source_name`, its exposed `name`, `type`, `nullable`, and `element_type`, `enum_values`, `tag`, `display_name`, `description` and `sensitive` where they are set — so that a column renamed after materialization contributes both names and the target environment reproduces the rename rather than losing it.

The toggle SHALL be offered on every `ACTIVE` table to every caller who can open its detail page:

- whatever the table reports for `permissions.write` and `permissions.modify` — including a system table, which reports `{write: false, modify: false}` to everyone — on the same reasoning that already keeps **Connect** free of a permission gate ("Table detail gates edits by per-table permissions"); and
- whatever `ANALYTICS_ENABLED` reports: with analytics disabled the detail view renders the Properties content as the whole body and no tab strip, and the toggle SHALL swap that body for the document just the same.

The JSON view SHALL offer no way to change the table. Its editor SHALL reject typing and pasting; no **Save**, no **Discard** and no changed-entity header SHALL be presented in any state a reader can reach from it; and no table write SHALL be issued from it — neither `updateTable` (`PUT /v1/tables/{name}`) nor `defineTableSchema` (`POST /v1/tables/{name}/schema`) nor `updateTableSchema` (`PATCH /v1/tables/{name}/schema`). Because the view is read-only there are no form fields to validate and no request to report on, so it raises no success or error notification of its own; the only notification it can produce is the copy confirmation specified in "The displayed definition is copyable in one action".

A save that materializes a draft **from its JSON editor** SHALL leave the reader on the live column surface of the now-`ACTIVE` table, not on the read-only JSON view: after a successful `defineTableSchema` the toggle SHALL be off, so that "Define and materialize a table schema" — "the view SHALL refresh showing the table `ACTIVE` with its live column surface" — keeps holding now that the same control has a meaning on an `ACTIVE` table.

While the JSON view is on, the header SHALL offer only the **copy control** and the toggle: Delete table, Add columns, Add rows and Connect are not rendered, and they return, each behaving exactly as before, when the view is turned off. The per-column edit/drop and inline-rename actions are unaffected. The JSON-editor toggle SHALL be the **last** control of the header row (see "Table detail gates edits by per-table permissions"). It is a view switch rather than an action on the table, and it is the one control that persists across the swap and that the reader returns to.

#### Scenario: The JSON-editor toggle is offered in an ACTIVE table's header

- **WHEN** the detail view of an `ACTIVE` table renders
- **THEN** the header offers the same JSON-editor toggle a draft's header offers, as the last control of the row, after **Connect**
- **AND** activating it shows the table's stored definition as a read-only JSON document

#### Scenario: Opening the JSON view replaces the whole body

- **WHEN** a reader activates the toggle on an `ACTIVE` table whose body is showing the Properties/Audit tab strip
- **THEN** the document takes over the body, the tab strip is no longer rendered, and neither the columns grid nor the Audit tab's content is on screen
- **AND** the toggle is still in the header, showing that the JSON view is the active surface

#### Scenario: Closing the JSON view restores the tab the reader was on

- **WHEN** a reader on the **Audit** tab of an `ACTIVE` table opens the JSON view and then toggles it off
- **THEN** the tab strip is rendered again with **Audit** still selected and its content shown
- **AND** the same holds for the **Properties** tab

#### Scenario: A source table's document is the write shape, not the GET response

- **WHEN** a reader opens the JSON view on an `ACTIVE` source table whose stored definition declares columns, an ordering key, a partition and a scan-metadata pair
- **THEN** the document shows `columns`, `ordering_key`, `partition_by`, `identity_column`, `version_column`, `description` and `tag_order`
- **AND** it shows none of `status`, `system`, `permissions`, `column_count`, `name`, `type`, `source_table`, nor a nested `grain` object
- **AND** on a source table whose scan-metadata pair is unset, neither `identity_column` nor `version_column` is present

#### Scenario: An enrichment table's document carries its enrichment members

- **WHEN** a reader opens the JSON view on an `ACTIVE` enrichment table
- **THEN** the document shows `columns`, `grain_key`, `cardinality`, `description` and `tag_order`
- **AND** it shows no source-only member — no `ordering_key`, no `partition_by`, no `identity_column`, no `version_column` — and no `source_table`

#### Scenario: A column's stored metadata survives into the document

- **WHEN** a reader opens the JSON view on an `ACTIVE` table one of whose columns was renamed after materialization and carries a tag, a display name, a description and the sensitive flag
- **THEN** that column appears with both its physical `source_name` and its exposed `name`, and with its `tag`, `display_name`, `description` and `sensitive` as stored
- **AND** a member the stored definition does not set is absent from that column rather than present and empty

#### Scenario: The document is the shape a draft editor seeds

- **WHEN** the document shown for an `ACTIVE` table is compared with the document a `PENDING` table of the same kind seeds its JSON editor with
- **THEN** the two are built from the same shape, so the text read here needs no member removed, renamed or unpacked before it is saved from that editor

#### Scenario: A caller with no write or modify permission still sees it

- **WHEN** the detail view of an `ACTIVE` table renders for a caller the table reports `permissions {write: false, modify: false}` for — which is every caller on a system table
- **THEN** the JSON-editor toggle is offered and opens the document
- **AND** no permission-gated action appears alongside it

#### Scenario: The JSON view is reachable with analytics disabled

- **WHEN** the detail view of an `ACTIVE` table renders with `ANALYTICS_ENABLED` off, so that no Properties/Audit tab strip is rendered and the Properties content is the whole body
- **THEN** the JSON-editor toggle is offered, and activating it replaces that body with the document

#### Scenario: The view cannot be edited

- **WHEN** a caller with every permission opens the JSON view of an `ACTIVE` table and types or pastes into the document
- **THEN** the document's content is unchanged

#### Scenario: No save path exists from an ACTIVE table's JSON view

- **WHEN** the JSON view is shown on an `ACTIVE` table, in any state a reader can put it in
- **THEN** neither Save nor Discard is offered, the changed-entity header is never presented, and no `updateTable`, `defineTableSchema` or `updateTableSchema` request is issued from it

#### Scenario: The ACTIVE view's own actions are unaffected

- **WHEN** the detail view of an `ACTIVE` table renders for a caller with every permission and the JSON view is off
- **THEN** Delete table, Add columns, Add rows and Connect are all offered, each behaving exactly as before
- **AND** **Connect** is still the header's only primary action, though it is no longer the header's last control — the JSON-editor toggle follows it

#### Scenario: Turning the JSON view on leaves only copy and the toggle

- **WHEN** the reader turns the JSON view on
- **THEN** the header shows the copy control and the JSON-editor toggle and no other control, and turning the view off restores Delete table, Add columns, Add rows and Connect

#### Scenario: Materializing a draft from the JSON editor lands on the live column surface

- **WHEN** an author saves a `PENDING` table from its JSON editor and the schema request succeeds, so the refreshed table is `ACTIVE`
- **THEN** the body shows the live column surface of the now-`ACTIVE` table, not the read-only JSON view
- **AND** the toggle is off, so the reader turns it on again to read the definition as a document

#### Scenario: A not-yet-materialized table is untouched

- **WHEN** the detail view of a `PENDING` or `FAILED` table renders
- **THEN** the toggle authors the draft exactly as before — it opens the editable JSON editor, not a read-only view — and the column-by-column schema-definition surface, the changed-entity header and the toggle's own `canModify` gate are all as before

### Requirement: The displayed definition is copyable in one action

While the read-only JSON view of an `ACTIVE` table is shown, the header SHALL offer a copy control — a button with a copy icon and the text **Copy** — immediately before the JSON-editor toggle that opened the view, and no other table action (see "An ACTIVE table's definition is readable as JSON"), so the document can be taken without scrolling it. Its accessible name SHALL state that it copies, and that name SHALL be unchanged by a copy; the confirmation of the copy names the value. The control SHALL be shown **only while the document is** — it copies what is displayed, so it has no meaning when nothing is, and a permanent control in the header would offer to copy a document that is not on screen.

The read-only view itself SHALL carry no toolbar and no heading of its own: it is reached by a labelled toggle that names the surface, and the copy control travels with that toggle, so the whole body below the header is the document.

Activating the control SHALL place the **entire** document on the clipboard — the same text the read-only view displays, character for character including its indentation, whatever part of the document is scrolled into view and whatever the editor's own selection happens to be. The control SHALL be offered to every caller the view itself is offered to, including one the table reports `permissions {write: false, modify: false}` for.

A successful copy SHALL be confirmed by a notification raised through the console's notification container, which is itself a polite live region (`role="status"`, `aria-live="polite"`) distinct from the control's own accessible name, so the outcome is announced without the reader having to see a transient visual cue. The change SHALL introduce no new error path: a clipboard write the browser rejects is the shared copy control's existing behaviour and raises no notification.

#### Scenario: The copy control is offered with the document

- **WHEN** a reader opens the JSON view of an `ACTIVE` table
- **THEN** a **Copy** button with a copy icon is offered in the header, immediately before the JSON-editor toggle, with no other table action beside it
- **AND** it is offered to every caller the view is offered to, including one the table reports `permissions {write: false, modify: false}` for

#### Scenario: The copy control is absent while the JSON view is off

- **WHEN** the detail view of an `ACTIVE` table renders with the JSON view off, and again after a reader turns the view on and then off
- **THEN** no copy-definition control is present in the header in either case, and the JSON-editor toggle is still the header's last control
- **AND** on a `PENDING` or `FAILED` table no copy-definition control is present in any state, whether that table's own JSON editor is open or closed

#### Scenario: Copying places the whole displayed document on the clipboard

- **WHEN** the reader activates that control
- **THEN** the clipboard holds the entire document the view displays — the paste-ready shape, complete and identically formatted — whatever part of it is scrolled into view and whatever the editor's own selection is

#### Scenario: The copy is announced to assistive technology

- **WHEN** the copy succeeds
- **THEN** a confirmation naming the copied value is announced politely through the console's notification container, a live region distinct from the control's own accessible name
- **AND** the control's accessible name is unchanged by the copy

## REMOVED Requirements

### Requirement: Full-admin per-table role management panel

**Reason**: The popup managed only the `write` and `modify` lists of a closed set of five that the service now serves, and was hidden for system tables. It is replaced by the Access tab, whose roles table, role drawer, role catalog, row-limit editor and Remove role dialog carry its role-picking, ordering, catalog-source and failure-reporting rules forward.

**Migration**: Use the Access tab ("Access tab lists a table's roles", "Role drawer edits one role's access and row limit", "Role catalog for the drawer", "Row-limit editor", "Remove a role from a table"). The popup's full replacement of `{write, modify}` becomes a key-wise merge of the changed lists, because `PUT /v1/tables/{name}/access` merges by key.

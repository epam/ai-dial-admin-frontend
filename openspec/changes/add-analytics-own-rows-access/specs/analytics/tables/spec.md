## ADDED Requirements

### Requirement: Everyone grantee on the Access tab

The Access tab SHALL treat the grantee `*` of the analytics-data-access-service as the **Everyone** grantee, which stands for every authenticated caller. Wherever a role name is displayed — the roles table, the drawer's role step, the remove dialog and its notifications — `*` SHALL be shown as **Everyone (all authenticated users)** and never as a role name, and SHALL be distinguishable from a provider role by more than its text. In every request and in every comparison with the service's responses (`GET /v1/tables/{name}/access`, `GET /v1/tables/{name}/row-policies`, `ineffective_grants`) it SHALL remain the literal string `*`.

For a new role, the role picker SHALL offer **Everyone** as its first option, ahead of the catalog roles, with a description saying that it covers every authenticated caller, whenever the table has no entry for `*`. The option SHALL NOT depend on the role catalog: it SHALL be offered while the catalog is loading and when the catalog failed to load. The roles table's role-name search SHALL find the Everyone row by its displayed label.

For the Everyone grantee the **Write** and **Modify** cards SHALL be locked and unselected, with the reason that everyone can be given read-side access only. **Get**, **Read**, the sensitive switch and the row step SHALL behave as for any role. A refusal the service still returns for a grant to `*` SHALL be an error notification carrying the service's message and request id.

Requests that name the grantee in the URL path — `PUT` and `DELETE /v1/tables/{name}/row-policies/{role}` — SHALL percent-encode `*` as `%2A`.

#### Scenario: Everyone is offered ahead of the catalog roles

- **GIVEN** a table that has no entry for `*`
- **WHEN** the user opens **Add role** and opens the role picker
- **THEN** the first option reads **Everyone (all authenticated users)** with its description, followed by the catalog roles

#### Scenario: Everyone is offered when the catalog failed

- **GIVEN** the role catalog failed to load
- **WHEN** the user opens the role picker for a new role
- **THEN** **Everyone (all authenticated users)** is offered

#### Scenario: Everyone is not offered twice

- **GIVEN** the table's `read` list names `*`
- **WHEN** the user opens **Add role**
- **THEN** the picker does not offer **Everyone**

#### Scenario: The roles table labels the grantee

- **GIVEN** the table's `read` list names `*`
- **WHEN** the Access tab renders
- **THEN** that row's role reads **Everyone (all authenticated users)**, not `*`
- **AND** searching the roles table for `everyone` keeps the row listed

#### Scenario: Write and Modify are locked for Everyone

- **WHEN** the drawer is open on the Everyone grantee
- **THEN** **Write** and **Modify** are locked and unselected with the stated reason
- **AND** **Get**, **Read** and the sensitive switch are selectable

#### Scenario: The grant is sent as the literal grantee

- **WHEN** the user picks **Everyone**, selects **Read** and saves
- **THEN** `PUT /access` is sent with a `read` list that contains `*` and every previous member

#### Scenario: The row-policy path encodes the grantee

- **WHEN** a row limit is saved or removed for the Everyone grantee
- **THEN** the request path ends with `/row-policies/%2A`

### Requirement: Everyone reading every row is warned about and saved in a safe order

While the drawer is open on the Everyone grantee with **Read** selected and **All rows** chosen, the row step SHALL show a warning, before anything is saved, stating that every authenticated caller will read every row of the table and that the row limits of every other role on the table will stop applying. The warning SHALL NOT disable **Save role**: the service accepts the grant, and a table read in full by everyone is a legitimate configuration. The warning SHALL disappear once **Only some rows** is chosen or **Read** is deselected.

When the Everyone grantee is saved with **Read** selected and **Only some rows**, the drawer SHALL send the row-policy request first and the `PUT /v1/tables/{name}/access` request second, so that no moment exists in which everyone reads the table unconfined. When the row-policy request fails, no access request SHALL be sent, an error notification SHALL carry the service's message and request id, and the drawer SHALL stay open in its editing state with the input intact and **Save role** still offered. When the row-policy request succeeds and the access request fails, an error notification SHALL carry the service's message, the roles table SHALL show the stored row limit, and **Save role** SHALL repeat both requests.

A `PUT /access` response that reports `ineffective_grants` with the reason `lifts_row_policies` SHALL be shown as described in "Drawer reports grants that change nothing": the entry's `message` verbatim in the in-drawer warning banner, not as a notification.

#### Scenario: The warning appears before saving

- **GIVEN** the drawer is open on **Everyone**
- **WHEN** the user selects **Read** and keeps **All rows**
- **THEN** the row step warns that every authenticated caller will read every row and that other roles' row limits will stop applying
- **AND** **Save role** stays enabled

#### Scenario: A row limit removes the warning

- **GIVEN** the warning is shown
- **WHEN** the user chooses **Only some rows**
- **THEN** the warning is no longer shown

#### Scenario: The warning is not shown for a provider role

- **WHEN** the drawer is open on a role other than **Everyone** with **Read** and **All rows**
- **THEN** no such warning is shown

#### Scenario: The row limit is stored before the grant

- **WHEN** the user picks **Everyone**, selects **Read**, builds a row limit and saves
- **THEN** `PUT /row-policies/%2A` is sent first and `PUT /access` second

#### Scenario: A refused row limit leaves the grant unsent

- **GIVEN** the row-policy request for **Everyone** answers `422`
- **THEN** an error notification shows the service's message
- **AND** no `PUT /access` request is sent, the drawer stays open, and the primary action still reads **Save role**

#### Scenario: The service's lifted-policies message is a banner

- **GIVEN** `PUT /access` answers with `ineffective_grants` of reason `lifts_row_policies` for the `read` key of `*`
- **THEN** the drawer stays open, a warning banner shows the entry's `message`, and the primary action reads **Done**
- **AND** no notification is shown for it

### Requirement: Caller value operand in the row-limit editor

The row-limit editor SHALL let a condition compare a column with a **caller value** instead of a literal: the reading caller's user hash (`caller.user_hash`) or the reading caller's project (`caller.project`). In the visual view the compared value SHALL offer a choice between **Value** and **Caller value**, and **Caller value** SHALL reveal a picker of the two values, each with a description saying which callers have it and that a caller without it reads no rows.

**Caller value** SHALL be offered only while the condition's operator is **Equals** or **Not equals** and its column is of the `string` type. Changing the operator or the column to one outside that rule SHALL return the compared value to an empty literal. A condition set to **Caller value** with no value picked SHALL count as unfinished and SHALL keep the limit from being saved.

A caller-value condition SHALL be serialized as a predicate whose arguments are the column and `{"type":"param","name":"<caller value>"}`. A stored predicate holding a caller value SHALL open in the visual view when the rest of it is representable, with the column shown first whichever side the service stored the caller value on, and SHALL be editable in the JSON view like any other.

The roles table's Rows column and the kept-filter note SHALL summarize such a condition with the caller value's name, for example `project_id = caller.project`.

The editor SHALL NOT judge parameter names typed in the JSON view: a predicate the service refuses — another parameter name, or a caller value outside an equality on a string column — SHALL be reported with the service's message as described in "Row-limit editor".

The Query Builder's Filter section, which shares the condition editor, SHALL NOT offer **Caller value**.

#### Scenario: A caller value is offered for an equality on a string column

- **GIVEN** a condition on a `string` column with the operator **Equals**
- **WHEN** the user opens the compared-value kind choice
- **THEN** **Value** and **Caller value** are offered
- **AND WHEN** the user chooses **Caller value**
- **THEN** a picker offers the caller's user hash and the caller's project

#### Scenario: A caller value is not offered for another operator or type

- **WHEN** the condition's operator is **Contains**, or its column is not of the `string` type
- **THEN** **Caller value** is not offered

#### Scenario: Leaving the rule returns the condition to a literal

- **GIVEN** a condition compared with the caller's project
- **WHEN** the user changes the operator to **is one of**
- **THEN** the compared value is an empty literal and the condition counts as unfinished

#### Scenario: A caller-value limit is saved as a parameter

- **WHEN** the user builds `project_id` **Equals** the caller's project and saves
- **THEN** the row-policy request carries a `filter` whose `eq` arguments are the field `project_id` and `{"type":"param","name":"caller.project"}`

#### Scenario: A caller value with nothing picked cannot be saved

- **GIVEN** a condition set to **Caller value** with no value picked
- **THEN** the editor says an unfinished condition is not stored, and **Save role** is disabled

#### Scenario: A stored caller-value policy is listed and opens visually

- **GIVEN** a role whose stored row policy compares `user_hash` with `caller.user_hash`
- **WHEN** the Access tab renders
- **THEN** the role's Rows column reads `user_hash = caller.user_hash`
- **AND WHEN** the user opens the role
- **THEN** the row-limit editor shows the condition in the visual view with **Caller value** chosen

#### Scenario: A refused parameter is reported with the service's message

- **GIVEN** the JSON view holds a predicate with a parameter the service does not accept
- **WHEN** the user saves and the row-policy request answers `422`
- **THEN** an error notification shows the service's message

#### Scenario: The Query Builder does not offer a caller value

- **WHEN** the user edits a condition in the Query Builder's Filter section
- **THEN** no **Caller value** choice is offered

## MODIFIED Requirements

### Requirement: Role drawer edits one role's access and row limit

The Access tab SHALL edit a role in a **drawer** that opens over the right edge of the page, keeps the roles table visible, and closes with its close control, with Escape, and with **Cancel**. The drawer SHALL hold the following steps in order, each addressable by a numbered heading:

1. **Role**: for a new role, a single-choice picker over the role catalog described in "Role catalog for the drawer", offering only roles that have no entry on the table, preceded by the **Everyone** grantee while it has no entry (see "Everyone grantee on the Access tab"); for an existing role, the role's name, read-only. A role that already has an entry is edited by selecting its row.
2. **What it can do**: shown only once a role is chosen (always, for an existing role); four selectable cards — **Get**, **Read**, **Write**, **Modify**. **Get** SHALL show as held, with the note that it comes from **Read** or **Modify**, while either is selected, and SHALL then be neither separately togglable nor stored by this save unless it was already stored.
3. **Sensitive columns**: a switch that grants the sensitive clearance, naming the table's sensitive columns. A note beneath it SHALL state that the clearance belongs to the role and covers everything it can do on this table. This step SHALL be offered only while **Get**, **Read** or **Modify** is held, stored or implied, because the clearance authorizes nothing by itself.
4. **Which rows can it read?**: **All rows** or **Only some rows**. This step SHALL be offered only while **Read** is selected. **Only some rows** reveals the row-limit editor (see "Row-limit editor"). A note in this step SHALL state that the limit also applies to SQL, CSV export and Flight SQL.

On a `system` table, **Write** and **Modify** SHALL be locked and unselected, with the reason that the service feeds system tables so they cannot be written to or changed, and that read access and row limits work as on any table. Steps 3 and 4 SHALL work as on any other table.

The footer SHALL offer the actions **Cancel** and **Save role**.

**Save role** SHALL be disabled until the role is chosen and at least one privilege is held or a row limit is set, and while a request is in flight. It SHALL change the role's membership in each of the five grant lists and nothing else: the drawer SHALL read the table's lists again immediately before saving, add or remove only this role in each list whose membership for it changed, and send only the keys that changed through `PUT /v1/tables/{name}/access`, which merges by key. The roles of every other grantee in every list SHALL be preserved. The row policy SHALL then be saved by a second request (see "Row-limit editor"), except for the **Everyone** grantee, whose row limit is saved before its grants (see "Everyone reading every row is warned about and saved in a safe order").

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

### Requirement: Row-limit editor

When the user chooses **Only some rows**, the drawer SHALL show a row-limit editor that builds a predicate over the table's own columns. The editor SHALL be the filter-condition editor of the Query Builder's Filter section, shared rather than duplicated, and SHALL show the same condition and group controls, operators, value inputs and operator rules for the same column types. It SHALL NOT depend on a Query Builder's state: its columns SHALL be the table's stored columns — sensitive columns included, whatever the viewer sees — and it SHALL offer no function operand, no aggregate, and no parameter other than the caller values of "Caller value operand in the row-limit editor", because the service refuses a row-policy filter that uses them. A column the table does not store, including a dotted enrichment field, SHALL NOT be offered.

The editor SHALL also offer a **JSON** view of the same predicate in the service's stable filter serialization — the one the Query Builder's JSON view uses — and a predicate that nests deeper than the visual editor can hold SHALL open in the JSON view with a note saying why, without changing it. Editing the predicate in either view SHALL keep the other in step when the predicate is representable visually.

Saving a role with **Only some rows** SHALL send `PUT /v1/tables/{name}/row-policies/{role}` with the body `{"filter": …}`. Saving with **All rows** for a role that has a row policy SHALL send `DELETE /v1/tables/{name}/row-policies/{role}`; a `404` answer to that delete SHALL be treated as success, because it means the policy is already gone. Saving with **All rows** for a role that has no row policy SHALL send nothing to that endpoint. **Only some rows** with an empty predicate SHALL NOT be savable. A visual predicate holding a condition that names no column, a condition compared with a blank literal value (other than an explicit null comparison), an **is one of** condition with no non-blank item, or a nested group with no members, SHALL NOT be savable either, and the editor SHALL say so: serialization skips such an element, so what would be stored is wider than what the editor shows. An invalid JSON predicate SHALL NOT be sent, and leaving the JSON view for text that is not a filter (an empty or blank document is an empty predicate, not such text) SHALL keep the JSON view with a message of its own, distinct from the one for a predicate that is too deep.

The two requests of **Save role** are independent. For every role but the **Everyone** grantee the grants are saved first: when the grants save succeeds and the row-policy request fails, the drawer SHALL stay open, the roles table SHALL show the saved grants, an error notification SHALL carry the service's message — which names the offending field for a `422` — and the footer's action SHALL become **Save row limit**, which repeats only the row-policy request. The note on screen SHALL state exactly what was saved. A predicate the service rejects for a field the user can see in JSON SHALL have that field highlighted there when the service names it.

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

#### Scenario: A condition with a blank value cannot be saved

- **GIVEN** a condition on `status` with the operator **Equals** and an empty value
- **THEN** the editor says an unfinished condition is not stored, and **Save role** is disabled
- **AND WHEN** the user fills the value
- **THEN** **Save role** is enabled

#### Scenario: An explicit null comparison is complete

- **WHEN** the user compares a column with null instead of typing a value
- **THEN** the condition is complete and **Save role** is enabled

#### Scenario: An empty JSON document returns to the visual view

- **WHEN** no condition was added, the user switches to the JSON view, and then back to the visual view
- **THEN** the visual view returns with no conditions and no message, and the empty document is not treated as invalid JSON

#### Scenario: Text that is not a filter keeps the JSON view with its own message

- **WHEN** the JSON text is not a filter and the user switches to the visual view
- **THEN** the JSON view stays, with a message that the JSON is not a valid filter, not the too-deep message

#### Scenario: An empty predicate cannot be saved

- **WHEN** **Only some rows** is chosen and no condition has been added
- **THEN** **Save role** is disabled

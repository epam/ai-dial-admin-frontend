## ADDED Requirements

### Requirement: Table detail Connect panel

The Table detail page SHALL offer a **Connect** header action, shown only while the table is `ACTIVE` and shown regardless of the viewer's per-table `write`/`modify` permissions — the panel is documentation, and a viewer who cannot yet write is precisely the one who needs to learn which role to request. It SHALL NOT be shown for a `PENDING` or `FAILED` table, which has no materialized table to connect to.

**Connect SHALL be the header's primary action**, because a custom table is populated by a client writing to it programmatically; the manual row editor is a hand-check, not the ingestion path. Consequently the header always presents exactly one primary action on an `ACTIVE` table, whatever the viewer's per-table permissions are.

Activating **Connect** SHALL open a right-side overlay panel titled `Connect to <table name>`, dismissible by its close control, by the `Escape` key, and by activating the backdrop. The panel SHALL overlay the page rather than reflow it, and SHALL occupy the full viewport width on mobile.

The panel body SHALL be organised by **task, not by technology**: two tabs, **Write data** and **Read data**, with **Write data** selected by default when the panel is opened from the header. Writing and reading are typically done by different people, and they carry different authorization — a write needs a role on this table, a read does not — so each tab SHALL carry its own authorization statement and its own set of language examples, and neither SHALL require reading the other.

The API-key instruction, which is identical for both, SHALL be shown once above the tabs rather than duplicated inside each.

The **Write data** tab SHALL cover posting rows to this table in Python (standard library only) and as a `curl` command, followed by the troubleshooting notes. The **Read data** tab SHALL cover querying this table in Python, as a `curl` command, and over Arrow Flight SQL with pandas and the ADBC driver. Flight SQL SHALL appear only under Read, because that endpoint rejects write statements; the panel SHALL say so rather than leaving a reader to discover it. For Flight SQL the panel SHALL state that it needs its own Python packages and that the key travels as a call header rather than an HTTP one. The panel SHALL assume the Flight endpoint is served: it SHALL neither detect the backend's Flight configuration nor caveat its availability.

Each tab SHALL state the prerequisites and the key-passing mechanism for the surfaces it shows (an `Api-Key` request header for the REST surfaces, an `api-key` call header for Flight SQL). Each code block SHALL offer a copy action that places that block's exact text on the clipboard.

#### Scenario: Connect is offered on an active table

- **WHEN** the detail view renders an `ACTIVE` table
- **THEN** a **Connect** header action is present, rendered as the header's primary action

#### Scenario: Connect is not offered before materialization

- **WHEN** the detail view renders a `PENDING` or `FAILED` table
- **THEN** no **Connect** action is present

#### Scenario: Connect is offered to a viewer with no write or modify permission

- **WHEN** an `ACTIVE` table reports `permissions {write:false, modify:false}`
- **THEN** the **Connect** action is still present, even though no **Add rows** or **Add columns** action is

#### Scenario: Opening the panel

- **WHEN** the user activates **Connect**
- **THEN** a side panel titled `Connect to <table name>` opens with the **Write data** and **Read data** tabs, and **Write data** is the selected tab

#### Scenario: Each tab carries only its own authorization

- **WHEN** the **Write data** tab is selected
- **THEN** it states which roles a key must carry to write to this table, and does not state the read-access rules
- **AND WHEN** the **Read data** tab is selected
- **THEN** it states that reading is not scoped per table, and does not repeat the write roles

#### Scenario: Flight SQL appears only under Read

- **WHEN** the user looks for a Flight SQL example
- **THEN** it is present on the **Read data** tab only, accompanied by a statement that the endpoint rejects write statements

#### Scenario: Dismissing the panel

- **WHEN** the panel is open and the user activates its close control, presses `Escape`, or activates the backdrop
- **THEN** the panel closes and the detail page is unchanged

#### Scenario: Copying a snippet

- **WHEN** the user activates a code block's copy action
- **THEN** that block's exact text is placed on the clipboard and a success notification is shown

### Requirement: Connect panel snippets are generated from the table schema

Every snippet the Connect panel renders SHALL be generated from the table currently being viewed, so that a copied snippet runs against that table without editing. Snippets SHALL be derived from the table's declared columns; a column whose physical name begins with `_` SHALL be omitted, because those belong to the platform and naming one in a row is rejected.

**Write snippets** SHALL key each row field by the column's **name** — the identifier the columns grid shows and every read surface projects — so the panel presents one vocabulary and never explains a second. For an **enrichment** table the row SHALL additionally carry the grain key as a top-level field. Each field's value SHALL be a mock literal of the column's declared type, chosen so the row is valid input:

- `uuid` — a well-formed UUID literal
- `string` — a quoted example string
- `integer` / `long` — a whole number
- `decimal` — a **quoted** numeric string, so the digits arrive exactly; the panel SHALL note that a plain number is also accepted but rounds past roughly 17 significant digits, since a quoted number otherwise reads as a mistake
- `boolean` — a boolean literal in the snippet's own syntax (`True` in Python, `true` in JSON and shell)
- `date` — a `YYYY-MM-DD` literal
- `timestamp` — an ISO-8601 literal with a `Z` suffix, matching the form the read surfaces return, so a value can be copied out of a query result and written straight back
- `object` — an empty object literal
- `array` — a literal array of two values shaped by the column's `element_type`

A nullable column SHALL still receive a value rather than a null, so the snippet stays a working example.

**The panel's format guidance SHALL be generated from the schema, exactly as its snippets are, and SHALL name this table's own columns rather than the types they happen to have.** For each declared column whose type carries a value-format rule — a timestamp or date's representation, a decimal's quoting, an array's element shape — the panel SHALL state the rule against the column's name, listing the columns of that type when there is more than one. A rule whose type no declared column uses SHALL be omitted entirely, so a table of strings and integers shows no format guidance at all. Stating rules per type instead would ask every reader to first work out which of their columns each rule applies to, and would show all of them to every table regardless of relevance.

Rules that are not per-column — the maximum rows per request, for instance — SHALL be stated separately from the per-column list rather than mixed into it.

The panel SHALL surface, **after** the write snippets rather than before them, the rejections a first-time writer is most likely to hit — an unknown column (the caller sent a column's display name rather than its name, or named a `_`-prefixed platform column) and an authorization failure — each phrased as the message the caller would see and what to change. It SHALL NOT present them as warnings to read before attempting the write, since the generated snippet already satisfies them.

**Read snippets** SHALL project the table's column names and SHALL carry an explicit row limit.

The Read tab SHALL state the row-limit rules once, covering every surface it shows rather than attaching them to one of them, and SHALL state them as the backend behaves: a query without an explicit limit **runs with** the default limit rather than having a larger result trimmed, and a limit above a surface's ceiling is **rejected rather than reduced**. Where the ceilings differ per surface, the panel SHALL give each rather than quoting one as universal.

#### Scenario: Row limits are stated per surface and as rejection

- **WHEN** the **Read data** tab renders
- **THEN** it states that a query without a limit runs with the default limit, that exceeding a ceiling is rejected rather than reduced, and gives the ceiling for each read surface shown

Snippets SHALL read the endpoint from an `ADAS_BASE_URL` environment variable whose default is the deployment's configured public Analytics endpoint when one is configured. When none is configured the default SHALL be a literal `<adas-base-url>` placeholder, and the panel SHALL show a note telling the user to replace it.

A table with no declared columns SHALL still render every tab, with the write snippet carrying an empty row rather than failing to render.

#### Scenario: One vocabulary throughout

- **WHEN** the user opens the Connect panel
- **THEN** every snippet, read and write alike, names each column exactly as the columns grid does
- **AND** the panel contains no explanation of a second, internal column identifier

#### Scenario: Timestamp columns round-trip

- **WHEN** a table has a `timestamp` column
- **THEN** its value in the write snippets is an ISO-8601 literal, in the same form the read snippets' results carry

#### Scenario: Decimal columns are quoted

- **WHEN** a table has a `decimal` column
- **THEN** its value in the write snippets is a quoted numeric string

#### Scenario: Array columns are shaped by their element type

- **WHEN** a table has an `array` column whose `element_type` is `string`
- **THEN** its value in the write snippets is an array of quoted strings, and an `array` of `long` yields an array of whole numbers

#### Scenario: Format guidance names columns, not types

- **WHEN** a table has a `decimal` column named `score` and a `timestamp` column named `recorded_at`
- **THEN** the format guidance states the quoting rule against `score` and the representation rule against `recorded_at`, naming neither type

#### Scenario: Several columns share a rule

- **WHEN** a table has two `timestamp` columns
- **THEN** the representation rule is stated once, naming both columns

#### Scenario: Irrelevant rules are omitted

- **WHEN** a table declares no `decimal`, `timestamp`, `date`, or `array` column
- **THEN** the panel shows no per-column format guidance at all

#### Scenario: Platform columns are omitted

- **WHEN** a table has a column whose physical name begins with `_`
- **THEN** that column appears in no snippet

#### Scenario: Enrichment write snippet carries the grain key

- **WHEN** the user opens the Connect panel for an enrichment table
- **THEN** the write snippets include the grain key as a top-level row field alongside the declared columns

#### Scenario: Endpoint defaults to the configured public URL

- **WHEN** the deployment configures a public Analytics endpoint and the user opens the panel
- **THEN** the snippets default `ADAS_BASE_URL` to that endpoint

#### Scenario: Endpoint falls back to a placeholder

- **WHEN** no public Analytics endpoint is configured
- **THEN** the snippets default `ADAS_BASE_URL` to `<adas-base-url>` and the panel shows a note to replace it

#### Scenario: A table with no columns still renders

- **WHEN** the user opens the Connect panel for an `ACTIVE` table that declares no columns
- **THEN** every tab renders and the write snippet carries an empty row

### Requirement: Connect panel states the authentication and role contract

The Connect panel SHALL carry an authentication section, shown on every tab, that tells the user how to authenticate the snippets and what authorization they need for **this** table.

The section SHALL instruct the user to supply a DIAL API key through an `ADAS_API_KEY` environment variable rather than pasting it into the script, and SHALL show how each surface carries it — the REST surfaces as an `Api-Key` request header, the Flight SQL surface as an `api-key` call header. The panel SHALL NOT render, echo, or offer to generate an actual API key; the value in every snippet SHALL be a placeholder.

The panel SHALL read this table's access lists when it opens and render the `write` role names as a list, described as the roles a **key** must carry to write rows to this table. These are the only role names the panel SHALL render.

Alongside the list the panel SHALL state two facts, plainly and without elaboration: that a key with administrator access can write to this table as well, with the note that a role scoped to this table is the better choice for a job that only appends rows; and that read access is not scoped per table, so a key able to query this table can query the whole catalog. The first is true and a user diagnosing an unexpected success needs it; the second prevents implying a least-privilege story for read-back keys that the backend does not offer. Neither SHALL be presented as a step to follow.

The panel SHALL NOT name the analytics backend's internal application roles. Those are derived by that service from its own provider-role mapping, which this application cannot read; they are not names an operator can attach to a key; and the application role this app knows about (`isFullAdmin`, from the console session) is a *different service's* notion of the same word and may not agree. Where the panel must refer to that level of access it SHALL do so descriptively (an administrator key can write regardless of the list) rather than by naming a constant.

For the same reason the panel SHALL NOT present the current viewer's own per-table permissions as a statement about the key the snippets will use. The two are different principals: `permissions` describes this console session, while the snippets run under an API key the user supplies.

When the `write` list is empty the panel SHALL treat that as a **call to action rather than a statement**: with no write role configured, the only key that can write is an administrator key — the very thing the section warns against — so the panel SHALL name that consequence and offer the route to granting a role. A neutral "no roles are configured" would leave the reader with the anti-pattern as their only working option. When the access lists cannot be read — including the `403` a caller without an application role receives — the panel SHALL omit the role list, keep every other part of the panel rendered, and SHALL NOT surface an error notification. When the viewer can manage roles on a non-system table, the section SHALL offer a **Manage access** shortcut that closes the panel and opens the table's access management surface.

#### Scenario: Write roles are listed

- **WHEN** the panel opens for a table whose `write` access list contains `analytics-writer`
- **THEN** the authentication section lists `analytics-writer` as a role a key must carry to write to this table

#### Scenario: No internal role names are rendered

- **WHEN** any part of the panel renders
- **THEN** no analytics-backend application-role constant appears anywhere in it, and the only role names shown are those returned by the table's access lists

#### Scenario: Administrator access is a caution, not an option

- **WHEN** the authentication section renders
- **THEN** it states that an administrator key can write to this table regardless of the list, together with what else such a key permits, and advises against using one for row writes
- **AND** it offers no step, link, or instruction for obtaining one

#### Scenario: Read scope is stated honestly

- **WHEN** the authentication section renders
- **THEN** it states that a key able to query this table can query the whole catalog, and that no per-table read-only role exists

#### Scenario: Empty write list is a call to action

- **WHEN** the panel opens for a table whose `write` access list is empty
- **THEN** the section states that only an administrator key can write to this table as configured, and offers the route to granting a write role
- **AND** it does not present using an administrator key as the resolution

#### Scenario: Access is unreadable

- **WHEN** the request for the table's access lists fails
- **THEN** the section omits the role list, no error notification is shown, and the tabs and snippets still render

#### Scenario: No key is ever rendered

- **WHEN** any tab renders
- **THEN** the API key in every snippet is a placeholder, and the panel offers no way to reveal or generate a real key

#### Scenario: Manage access shortcut

- **WHEN** a full admin viewing a non-system table activates the section's **Manage access** shortcut
- **THEN** the Connect panel closes and the table's access management surface opens

#### Scenario: Manage access shortcut is absent without the permission

- **WHEN** a user who is not a full admin opens the panel
- **THEN** no **Manage access** shortcut is shown, while the role information still is

## MODIFIED Requirements

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Manage access** SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system).
- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown for every `ACTIVE` table regardless of permission, as the header's primary action (see "Table detail Connect panel").
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header actions SHALL be ordered **Manage access, Delete table, Add columns, Add rows, Connect** — the primary action last, matching the placement of the primary action the header shows today. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema".

Because the backend reports `permissions {false,false}` for system tables, the write/modify-gated affordances (Add rows, Add columns, per-column edit/drop, inline rename, description edits) hide for system tables without a separate check. **Manage access** and **Delete table** are gated on `FULL_ADMIN`, which the backend does not scope per-table, so each carries its own explicit `!table.system` check.

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

#### Scenario: Manage access is hidden for a system table even for a full admin

- **WHEN** a `FULL_ADMIN` opens a system table's detail page
- **THEN** the "Manage access" button is absent

#### Scenario: A system table still offers Connect

- **WHEN** a user opens an `ACTIVE` system table's detail page
- **THEN** **Connect** is present while **Add rows**, **Add columns**, **Manage access**, and **Delete table** are all absent

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the actions appear in the order Manage access, Delete table, Add columns, Add rows, Connect

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add rows** button. The popup is a **hand-check** — a way for an admin to confirm the table accepts the shape they expect — and SHALL be presented as such, not as the way a table is populated; a table is populated by a client writing to its row endpoint programmatically (see "Table detail Connect panel"). Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared columns' **physical source names** (not their exposed names, which the backend's row-insert endpoint does not accept), each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. For an **enrichment** table the template SHALL additionally include the grain key as a top-level field, since the backend requires it on every inserted row. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

The popup SHALL carry, above its editor, a statement of its purpose — that it inserts rows by hand for checking a schema, and that ongoing ingestion goes through the table's row endpoint — together with a **Write rows programmatically** action which closes the popup, discarding the editor's content, and opens the Connect panel on its **Python** tab (see "Table detail Connect panel"). Both SHALL sit at the top of the popup body, above the editor and away from the submit controls, so a user who opened the popup for real ingestion is redirected before typing rather than after.

#### Scenario: The popup states that it is a hand-check

- **WHEN** the user opens the Add rows editor
- **THEN** the popup shows, above the editor, that it is for inserting rows by hand and that ongoing ingestion uses the row endpoint

#### Scenario: Opening Add rows prefills a type-shaped template

- **WHEN** the user opens the Add rows editor for a table with declared columns
- **THEN** the editor is prefilled with one row object keyed by each column's physical source name, with type-appropriate placeholder values

#### Scenario: Add rows template keys a renamed column by its source name

- **WHEN** a column's exposed name differs from its physical source name and the user opens Add rows
- **THEN** the template key for that column is its source name, not its exposed name

#### Scenario: Enrichment template includes the grain key

- **WHEN** the user opens the Add rows editor for an enrichment table
- **THEN** the template includes the grain key as a top-level field alongside the declared columns

#### Scenario: Insert rows is disabled while the JSON is invalid

- **WHEN** the editor's content is not valid JSON, or is valid JSON that is not an array
- **THEN** the Insert rows action is disabled
- **AND** it re-enables once the content becomes a valid JSON array

#### Scenario: Valid rows are inserted

- **WHEN** the user enters a valid JSON array of objects and submits
- **THEN** the rows are posted to the table and a success notification is shown

#### Scenario: Invalid rows JSON is rejected

- **WHEN** the user enters text that is not a JSON array
- **THEN** an error is shown and no request is issued

#### Scenario: Escalating from the editor to a script

- **WHEN** the user activates **Write rows programmatically** in the Add rows popup
- **THEN** the popup closes and the Connect panel opens with its **Python** tab selected

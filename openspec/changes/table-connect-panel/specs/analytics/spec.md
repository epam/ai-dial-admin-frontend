## ADDED Requirements

### Requirement: ANALYTICS_PUBLIC_URL is surfaced to the table detail page

The system SHALL expose an optional environment variable `ANALYTICS_PUBLIC_URL` carrying the Analytics endpoint an external client would call. It SHALL be read server-side in the table detail page (`app/[lang]/tables/[id]/page.tsx`) and passed to the detail view; it SHALL NOT be added to the `FeatureFlags` object, which carries booleans consumed app-wide. When the variable is unset or blank the detail view SHALL receive an empty value.

#### Scenario: Configured endpoint reaches the view

- **WHEN** `process.env.ANALYTICS_PUBLIC_URL` is set and the table detail page renders
- **THEN** the detail view receives that value

#### Scenario: Unset endpoint yields a blank value

- **WHEN** `process.env.ANALYTICS_PUBLIC_URL` is not set
- **THEN** the detail view receives an empty value rather than `undefined` leaking into a snippet

### Requirement: Table detail Connect panel

The Table detail page SHALL offer a **Connect** header action, shown only while the table is `ACTIVE` and shown regardless of the viewer's per-table `write`/`modify` permissions. It SHALL NOT be shown for a `PENDING` or `FAILED` table, which has no materialized table to connect to. **Connect** SHALL be the header's primary action, so an `ACTIVE` table always presents exactly one primary action whatever the viewer's permissions are.

Activating **Connect** SHALL open a right-side overlay panel titled `Connect to <table name>`, dismissible by its close control, by the `Escape` key, and by activating the backdrop. The panel SHALL overlay the page rather than reflow it, and SHALL occupy the full viewport width below the layout's tablet breakpoint.

The panel SHALL be a modal dialog for assistive technology: it SHALL carry a dialog role and modal state with an accessible name matching its title, SHALL move focus into the panel on open, SHALL confine `Tab` cycling to the panel while open, and SHALL return focus to the **Connect** button on close.

The panel body SHALL be organised by **task, not by technology**: two tabs, **Write data** and **Read data**, with **Write data** selected by default from every entry point. Writing and reading are done by different people and carry different authorization, so each tab SHALL carry its own authorization statement and its own language examples, and neither SHALL require reading the other.

For a **system** table the panel SHALL offer the read path only: no **Write data** tab, no write snippets, and no write-role list. Such a table is fed out of band and its row endpoint refuses every write regardless of any access list, so a write tab would teach a path that cannot succeed. The panel SHALL say why the read path is the only one shown, and SHALL NOT request the table's access lists, which cannot authorize anything there.

The API-key instruction, identical for both, SHALL be shown once above the tabs rather than duplicated inside each.

The **Write data** tab SHALL cover posting rows to this table in Python (standard library only) and as a `curl` command. The **Read data** tab SHALL cover querying this table in Python, as a `curl` command, and over Arrow Flight SQL with pandas and the ADBC driver. Flight SQL SHALL appear only under Read, because that endpoint rejects write statements, and the panel SHALL say so. For Flight SQL the panel SHALL state that it needs its own Python packages.

Each code block SHALL offer a copy action that places that block's exact text on the clipboard and announces the result to assistive technology.

The panel assumes the deployment has API-key authentication and the Flight endpoint enabled. Both are backend configuration this application cannot read; the panel SHALL neither detect nor caveat either.

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

#### Scenario: The panel takes and returns focus

- **WHEN** the panel opens
- **THEN** focus moves into the panel and `Tab` cycles within it
- **AND WHEN** the panel is closed by any of its dismissal routes
- **THEN** focus returns to the **Connect** button

#### Scenario: A system table offers the read path only

- **WHEN** the panel opens for a `system` table
- **THEN** no **Write data** tab, write snippet, or write-role list is present, and the read path is shown with a statement of why it is the only one
- **AND** no request is made for the table's access lists

#### Scenario: Each tab carries only its own authorization

- **WHEN** the **Write data** tab renders
- **THEN** it names the roles a key must carry to write to this table, and states no read-access rule
- **AND WHEN** the **Read data** tab renders
- **THEN** it states that reading is not scoped per table, and names no write role

#### Scenario: Flight SQL appears only under Read

- **WHEN** the **Read data** tab renders
- **THEN** a Flight SQL example is present, with a statement that the endpoint rejects write statements
- **AND WHEN** the **Write data** tab renders
- **THEN** no Flight SQL example is present

#### Scenario: Dismissing the panel

- **WHEN** the panel is open and the user activates its close control, presses `Escape`, or activates the backdrop
- **THEN** the panel closes and the detail page is unchanged

#### Scenario: Copying a snippet

- **WHEN** the user activates a code block's copy action
- **THEN** that block's exact text is placed on the clipboard and a success notification is shown

### Requirement: Connect panel snippets are generated from the table schema

Every snippet the Connect panel renders SHALL be generated from the table currently being viewed, so that a copied snippet runs against that table without editing. Snippets SHALL be derived from the table's declared columns; a column whose physical name begins with `_` SHALL be omitted, because the platform sets those and a row naming one is rejected.

**Write snippets** SHALL key each row field by the column's **physical source name**, which is what the row-insert endpoint accepts. The panel SHALL NOT explain that identifier or contrast it with the exposed name: the two are equal on every table this application can produce — its column editor fills both from one input, and a rename sets both — so the distinction is invisible here and naming it would teach a concept the reader cannot act on. For an **enrichment** table the row SHALL additionally carry the grain key as a top-level field; an enrichment row without it cannot join to its source.

Each field's value SHALL be a mock literal of the column's declared type, chosen so the row is valid input:

- `uuid` — a well-formed UUID literal
- `string` — a quoted example string
- `integer` / `long` — a whole number
- `decimal` — a **quoted** numeric string, so the digits reach the store exactly rather than through a JSON float
- `boolean` — a boolean literal in the snippet's own syntax (`True` in Python, `true` in JSON and shell)
- `date` — a `YYYY-MM-DD` literal
- `timestamp` — a **space-separated** `YYYY-MM-DD HH:MM:SS.mmm` literal, which is what the insert path accepts; an ISO-8601 `T` separator or `Z` suffix is rejected on write
- `object` — an empty object literal
- `array` — a literal array of two values shaped by the column's `element_type`

A nullable column SHALL still receive a value rather than a null, so the snippet stays a working example.

**Read snippets** SHALL project the table's column names and SHALL carry an explicit `LIMIT` no greater than the REST maximum.

Snippets SHALL read the endpoint from an `ADAS_BASE_URL` environment variable whose default is the configured public Analytics endpoint. When none is configured the default SHALL be a literal `<adas-base-url>` placeholder and the panel SHALL show a note to replace it.

A table with no declared columns SHALL still render every tab, with the write snippet carrying an empty row rather than failing to render.

**The panel's format guidance SHALL be generated from the schema, exactly as its snippets are, and SHALL name this table's own columns rather than the types they happen to have.** For each declared column whose type carries a value-format rule — a timestamp's representation, a decimal's quoting, an array's element shape — the panel SHALL state the rule against the column's name, listing the columns of that type when there is more than one. A rule no declared column's type uses SHALL be omitted entirely, so a table of strings and integers shows no format guidance.

The timestamp entry SHALL state the write format **and** that queries return ISO-8601, so the reader learns the two directions differ rather than discovering it from a rejected insert.

Rules that are not per-column SHALL be stated separately from the per-column list. These are the write batch maximum (10 000 rows per request) and, on the Read tab, the row limits below.

The Read tab SHALL state the row limits per surface, because they differ in kind and not only in value:

- **REST** (`/v1/queries/execute-sql`) — a query with no `LIMIT` runs with a default of 100; an explicit `LIMIT` above 1 000 is **rejected**, not reduced.
- **Flight SQL** — an oversized `LIMIT` is **clamped** to the endpoint's cap, never rejected; a query whose result exceeds that cap fails outright and returns no partial page. The cap is deployment-configured, so the panel SHALL describe it rather than printing a number.

After the write snippets — not before them, since the generated snippet already satisfies the rules above — the panel SHALL surface the two likeliest rejections, phrased as the message the caller sees and what to change: an unknown column, and an authorization failure. The unknown-column rejection SHALL be presented as one message covering both a mistaken display name and a `_`-prefixed platform column, because the backend does not distinguish them.

#### Scenario: Write snippets key by the physical source name

- **WHEN** the user opens the Connect panel
- **THEN** each write snippet's row fields are keyed by the columns' physical source names

#### Scenario: The panel teaches no second column identifier

- **WHEN** any part of the panel renders
- **THEN** it contains no explanation of, or contrast between, the physical and exposed column identifiers

#### Scenario: Timestamp columns use the insert format and name the asymmetry

- **WHEN** a table has a `timestamp` column
- **THEN** its value in the write snippets is a space-separated `YYYY-MM-DD HH:MM:SS.mmm` literal, with no `T` separator and no `Z` suffix
- **AND** the format guidance states that queries return that column as ISO-8601

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
- **THEN** the panel shows no per-column format guidance

#### Scenario: Row limits are stated per surface

- **WHEN** the **Read data** tab renders
- **THEN** it states that a REST query without a limit runs with a default of 100 and that an explicit limit above 1 000 is rejected
- **AND** it states that Flight SQL clamps an oversized limit rather than rejecting it, and fails without a partial page when a result exceeds its cap

#### Scenario: Platform columns are omitted

- **WHEN** a table has a column whose physical name begins with `_`
- **THEN** that column appears in no snippet

#### Scenario: Enrichment write snippet carries the grain key

- **WHEN** the user opens the Connect panel for an enrichment table
- **THEN** the write snippets include the grain key as a top-level row field alongside the declared columns

#### Scenario: Endpoint defaults to the configured public URL

- **WHEN** a public Analytics endpoint is configured and the user opens the panel
- **THEN** the snippets default `ADAS_BASE_URL` to that endpoint

#### Scenario: Endpoint falls back to a placeholder

- **WHEN** no public Analytics endpoint is configured
- **THEN** the snippets default `ADAS_BASE_URL` to `<adas-base-url>` and the panel shows a note to replace it

#### Scenario: A table with no columns still renders

- **WHEN** the user opens the Connect panel for an `ACTIVE` table that declares no columns
- **THEN** every tab renders and the write snippet carries an empty row

#### Scenario: Rejections are shown after the snippets

- **WHEN** the **Write data** tab renders
- **THEN** the unknown-column and authorization rejections appear below the write snippets, each naming the message the caller would see

### Requirement: Connect panel states the authentication and role contract

The panel SHALL instruct the user to supply a DIAL API key through an `ADAS_API_KEY` environment variable rather than pasting it into the script. Every surface the panel shows takes the same key in the same `Api-Key` header; the Flight SQL client sends it as a gRPC call header, which is why its driver option carries the lower-cased name. The panel SHALL NOT render, echo, or offer to generate an actual key; the value in every snippet SHALL be a placeholder.

The panel SHALL read this table's access lists when it opens. The **Write data** tab SHALL render the `write` role names as the roles a key must carry to write rows to this table. These are the only role names the panel SHALL render.

The panel SHALL NOT name the analytics backend's application roles. Those are derived by that service from a provider-role mapping this application cannot read, they are not names an operator can attach to a key, and the similarly named role this application holds is a different service's notion of the same word. Where the panel must refer to that level of access it SHALL do so descriptively.

For the same reason the panel SHALL NOT present the current viewer's own per-table permissions as a statement about the key the snippets will use: `permissions` describes this console session, while the snippets run under a key the user supplies.

The **Write data** tab SHALL state that a key with administrator access can write to this table regardless of the list, together with the note that a role scoped to this table is the better choice for a job that only appends rows. It SHALL offer no step or instruction for obtaining such a key. Where the panel points at role management it SHALL attribute it to a full administrator rather than implying an on-screen control, since the header's **Manage access** action renders only for full admins on non-system tables. The panel SHALL offer no access-management control of its own; the header already carries one for those who can use it.

When the `write` list is empty the panel SHALL say so and name the consequence — that as configured, only a key with administrator access can write to this table.

The **Read data** tab SHALL state that read access is not scoped per table: a key able to query this table can query the whole catalog, and no per-table read-only role exists.

While the access request is in flight the panel SHALL show a loading state in place of the role list, and SHALL render every other part of the panel immediately. When the request fails — including the `403` returned to a caller holding neither application role — the panel SHALL omit the role list, keep every other part rendered, and SHALL NOT surface an error notification. Because that failure hides the role names from exactly the reader who cannot yet write, the panel SHALL NOT be described as guaranteeing that reader an answer.

#### Scenario: Write roles are listed

- **WHEN** the panel opens for a table whose `write` access list contains `analytics-writer`
- **THEN** the **Write data** tab lists `analytics-writer` as a role a key must carry to write to this table

#### Scenario: No application-role constant is rendered

- **WHEN** any part of the panel renders
- **THEN** neither `FULL_ADMIN` nor `READ_ONLY_ADMIN` appears in it, and the only role names shown are those returned by the table's access lists

#### Scenario: Administrator access is a caution, not an option

- **WHEN** the **Write data** tab renders
- **THEN** it states that a key with administrator access can write to this table regardless of the list, and that a scoped role is the better choice for a job that only appends rows
- **AND** it offers no step or instruction for obtaining such a key

#### Scenario: Role management is attributed, not pointed at

- **WHEN** the panel refers to granting a role
- **THEN** it attributes that to a full administrator rather than directing the reader to a control that may not be rendered for them

#### Scenario: Read scope is stated on the Read tab

- **WHEN** the **Read data** tab renders
- **THEN** it states that a key able to query this table can query the whole catalog, and that no per-table read-only role exists

#### Scenario: Empty write list names its consequence

- **WHEN** the panel opens for a table whose `write` access list is empty
- **THEN** the **Write data** tab states that as configured, only a key with administrator access can write to this table
- **AND** it does not present using such a key as the resolution

#### Scenario: Access is loading

- **WHEN** the access request has not yet resolved
- **THEN** the role list shows a loading state and every other part of the panel is already rendered

#### Scenario: Access is unreadable

- **WHEN** the request for the table's access lists fails
- **THEN** the role list is omitted, no error notification is shown, and the tabs and snippets still render

#### Scenario: No key is ever rendered

- **WHEN** any tab renders
- **THEN** the API key in every snippet is a placeholder, and the panel offers no way to reveal or generate a real key

#### Scenario: The panel offers no access-management control

- **WHEN** the panel renders for a viewer who can manage roles
- **THEN** it contains no control that opens the table's access management surface

## MODIFIED Requirements

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Manage access** SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system).
- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown for every `ACTIVE` table regardless of permission, as the header's primary action (see "Table detail Connect panel").
- For an `ACTIVE` table, **Add columns** (schema evolution) and **Add rows** (inserting rows) SHALL each be offered as its own standalone header button — **not** as items of a shared dropdown. **Add columns** SHALL be shown only when `canModify` and **Add rows** only when `canWrite`; when neither permission is held, neither button renders. Both SHALL render as neutral actions, never primary and never dependent on whether the other is present, so each keeps the same appearance whatever the viewer's other permissions are. **Add rows** is deliberately not the emphasized way to put data in the table — see "Table detail row writes".
- Per-column **edit/drop** (grid action column), **inline column rename**, column-metadata edits, and **description edits** SHALL be shown only when `canModify`.
- Header actions SHALL be ordered **Manage access, Delete table, Add columns, Add rows, Connect** — the primary action last, where the header's primary action already sits. A not-yet-`ACTIVE` table shows neither Connect nor the two Add buttons, and shows **Save** in their place — see "Define and materialize a table schema".

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

#### Scenario: A not-yet-active table shows Save in their place

- **WHEN** the detail header renders for a `PENDING` or `FAILED` table and the user has `canModify`
- **THEN** **Save** is shown, and none of **Connect**, **Add columns**, or **Add rows** is

### Requirement: Table detail row writes

The Table detail page SHALL let the user write rows by entering a JSON array of row objects in a popup editor, opened via the header **Add rows** button. The popup is a **hand-check** — a way for an admin to confirm the table accepts the shape they expect — and SHALL be presented as such, not as the way a table is populated; a table is populated by a client writing to its row endpoint programmatically (see "Table detail Connect panel"). Opening the editor SHALL prefill it with a one-row JSON template whose keys are the table's declared columns' **physical source names** (not their exposed names, which the backend's row-insert endpoint does not accept), each mapped to a value matching that column's type (`0` for Integer/Long/Decimal, `false` for Boolean, `{}` for Object, `[]` for Array, `""` otherwise) rather than a bare empty array, so the example stays valid input for every column. For an **enrichment** table the template SHALL additionally include the grain key as a top-level field, since an enrichment row cannot join to its source without it. The **Insert rows** submit action SHALL be disabled while the editor's content does not parse as a JSON array, re-enabling as soon as it does; submitting invalid or non-array input SHALL additionally surface an error and SHALL NOT issue a request. Valid rows SHALL be posted via `addRows`, with a success or error notification.

The popup SHALL carry, above its editor, a statement of its purpose — that it inserts rows by hand for checking a schema, and that ongoing ingestion goes through the table's row endpoint — together with a **Write rows programmatically** action which closes the popup, discarding the editor's content, and opens the Connect panel on its **Write data** tab (see "Table detail Connect panel"). Both SHALL sit at the top of the popup body, above the editor and away from the submit controls, so a user who opened the popup for real ingestion is redirected before typing rather than after.

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
- **THEN** the popup closes and the Connect panel opens with its **Write data** tab selected

## MODIFIED Requirements

### Requirement: Table detail gates edits by per-table permissions

The table detail view (`components/Analytics/Tables/TableDetailView.tsx`) SHALL gate its mutating affordances independently:

- **Manage access** SHALL be shown only when `canManageRoles` (`FULL_ADMIN` and non-system).
- **Delete table** SHALL be shown only when `canDelete` (`FULL_ADMIN` and non-system).
- **Connect** SHALL be shown regardless of permission, as the header's primary action, for every `ACTIVE` **source** table and for every `ACTIVE` **enrichment** table whose payload names a source table (see "Table detail Connect panel").
- **Add rows** SHALL NOT be offered for an **enrichment** table whatever its `write` permission reports: those rows come from the enrichment process, so a hand-written insert is not a path this UI offers.
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

#### Scenario: An enrichment table offers Connect but never Add rows

- **WHEN** a user opens an `ACTIVE` enrichment table's detail page and its payload names a source table
- **THEN** **Connect** is present as the header's primary action
- **AND** no **Add rows** action is present, whatever the table's `write` permission reports

#### Scenario: Header actions follow the fixed order

- **WHEN** the detail header renders for a user with every permission on an `ACTIVE` table
- **THEN** the actions appear in the order Manage access, Delete table, Add columns, Add rows, Connect

#### Scenario: A not-yet-active table shows Save in their place

- **WHEN** the detail header renders for a `PENDING` or `FAILED` table and the user has `canModify`
- **THEN** **Save** is shown, and none of **Connect**, **Add columns**, or **Add rows** is

### Requirement: Table detail Connect panel

The Table detail page SHALL offer a **Connect** header action, shown only while the table is `ACTIVE`, and otherwise regardless of the viewer's per-table `write`/`modify` permissions. It SHALL be offered for a table of type **source**, and for a table of type **enrichment** whose payload names a source table: an enrichment is not queryable under its own name, but its columns are readable as table-qualified fields on its source table, and its detail page is the one place a reader is shown how. An enrichment whose payload names no source table SHALL offer no Connect action, since no runnable query can be generated for it. It SHALL NOT be shown for a `PENDING` or `FAILED` table, which has no materialized table to connect to. **Connect** SHALL be the header's primary action, so an `ACTIVE` table always presents exactly one primary action whatever the viewer's permissions are.

Activating **Connect** SHALL open a right-side overlay panel titled `Connect to <table name>`, dismissible by its close control, by the `Escape` key, and by activating the backdrop. The panel SHALL overlay the page rather than reflow it, and SHALL occupy the full viewport width below the layout's tablet breakpoint.

The panel SHALL be a modal dialog for assistive technology: it SHALL carry a dialog role and modal state with an accessible name matching its title, SHALL move focus into the panel on open, SHALL confine `Tab` cycling to the panel while open, and SHALL return focus to the **Connect** button on close.

The panel body SHALL be organised by **task, not by technology**: for a table a client can write, two tabs — **Write data** and **Read data** — with **Write data** selected by default from every entry point. Writing and reading are done by different people and carry different authorization, so each tab SHALL carry its own authorization statement and its own language examples, and neither SHALL require reading the other.

For a **system** table and for an **enrichment** table the panel SHALL offer the read path only: no **Write data** tab, no write snippets, and no write-role list. It SHALL state which reason applies. A system table is fed out of band and its row endpoint refuses every write regardless of any access list, so a write tab would teach a path that cannot succeed. An enrichment's rows are produced by the enrichment process, which is the same reason this UI offers no hand-written insert for one. In neither case SHALL the panel request the table's access lists, which cannot authorize anything there.

The API-key instruction SHALL be shown once at the top of the panel rather than duplicated inside each tab, and SHALL state that every example the panel shows takes the same key. It SHALL NOT be phrased in terms of the two tabs, since the read-only variants render no tabs at all.

That shared block SHALL carry the key **and nothing else**. An endpoint belongs to the surface that reads it: the REST base URL SHALL be shown as its own setup block above **each** REST example — Python and `curl` alike — and the Flight endpoint above the Flight example, so no example asks the reader to set a variable it never uses, and none asks them to find a variable it does. The Python examples SHALL additionally keep their endpoint default inline, so a copied script still runs when the export is skipped; `curl`, which can carry no default, depends on it.

The **Write data** tab SHALL cover posting rows to this table in Python (standard library only) and as a `curl` command. The **Read data** tab SHALL cover querying this table in Python, as a `curl` command, and over Arrow Flight SQL with pandas and the ADBC driver. Flight SQL SHALL appear only under Read, because that endpoint rejects write statements, and the panel SHALL say so. For Flight SQL the panel SHALL state that it needs its own Python packages.

Each code block SHALL offer a copy action that places that block's exact text on the clipboard and announces the result to assistive technology.

The panel assumes the deployment has API-key authentication and the Flight endpoint enabled. Both are backend configuration this application cannot read; the panel SHALL neither detect nor caveat either.

#### Scenario: Connect is offered on an active table

- **WHEN** the detail view renders an `ACTIVE` table
- **THEN** a **Connect** header action is present, rendered as the header's primary action

#### Scenario: An enrichment table offers Connect with the read path only

- **WHEN** the panel opens for an `ACTIVE` enrichment table
- **THEN** no **Write data** tab, write snippet, or write-role list is present, and the read path is shown with a statement of why it is the only one
- **AND** no request is made for the table's access lists

#### Scenario: An enrichment table offers no Connect action

- **WHEN** the detail view renders an `ACTIVE` enrichment table whose payload names no source table, the only case in which no runnable query can be generated for it
- **THEN** no **Connect** action is present
- **AND** the schema and catalog actions its permissions allow are still present

#### Scenario: Connect is not offered before materialization

- **WHEN** the detail view renders a `PENDING` or `FAILED` table
- **THEN** no **Connect** action is present

#### Scenario: Connect is offered to a viewer with no write or modify permission

- **WHEN** an `ACTIVE` table reports `permissions {write:false, modify:false}`
- **THEN** the **Connect** action is still present, even though no **Add rows** or **Add columns** action is

#### Scenario: Opening the panel

- **WHEN** the user activates **Connect** on a source table a client can write
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

Every snippet the Connect panel renders SHALL be generated from the table currently being viewed, so that a copied snippet runs against that table without editing. Snippets SHALL be derived from the table's declared columns; a column whose physical name begins with `_` SHALL be omitted, because the platform sets those and a row naming one is rejected. The exclusion SHALL hold for the read projection as well as the write snippets, so no part of the panel names a platform column.

**Write snippets** SHALL key each row field by the column's **physical source name**, which is what the row-insert endpoint accepts. The panel SHALL NOT explain that identifier or contrast it with the exposed name: the two are equal on every table this application can produce — its column editor fills both from one input, and a rename sets both — so the distinction is invisible here and naming it would teach a concept the reader cannot act on.

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

**Read snippets** SHALL carry an explicit `LIMIT` no greater than the REST maximum, and SHALL project a **key subset** of the table rather than every column, so the example teaches the shape of a query instead of the width of the table:

- For a **source** table the projection SHALL be the table's **ordering-key columns** — the set a reader filters, sorts, and joins on — named as the table's payload reports them, less any entry naming a `_`-prefixed platform column.
- For an **enrichment** table the query SHALL read `FROM` the enrichment's **source table**, never from the enrichment's own name, since an enrichment is not queryable under its own name. Its projection SHALL be the enrichment's **grain key**, which is a column of that source table, together with one of the enrichment's own columns — the first declared column whose physical name does not begin with `_`. The enrichment's column SHALL be addressed as `"<enrichment>.<column>"`, quoted as a **single** identifier with the dot inside it: the service exposes an enrichment column on the source table under a name that literally contains a dot, and quoting it as two identifiers (`"<enrichment>"."<column>"`) is rejected with `Table '<enrichment>' not found`.
- Every projected column SHALL be quoted, not only the enrichment column that has to be, so that one `SELECT` list does not mix quoted and bare names for no reason a reader can see.
- Where the rules above yield no column at all — a table declaring no ordering key or one naming only platform columns, an enrichment with neither a grain key nor a non-platform column — the projection SHALL be `*`, so no snippet is ever generated with an empty projection.

The **Read data** tab SHALL state that its snippet projects a subset and that any of the table's columns may be selected, so the shortened projection is not read as a restriction. For an **enrichment** it SHALL additionally state that the query reads through the table it enriches, that every column of the enrichment is reachable as `"<enrichment>.<column>"`, and that any column of the source table may be selected in the same query. That statement SHALL **name** the source table rather than referring to it by a pronoun: two tables are in play, so "that table" resolves against either.

Snippets SHALL read each endpoint from an environment variable whose default is the corresponding configured public endpoint: `DIAL_ANALYTICS_BASE_URL` for the REST surfaces and `DIAL_ANALYTICS_FLIGHT_SQL_URL` for Flight SQL, with the key in `DIAL_API_KEY`. When an endpoint is not configured its default SHALL be a visible placeholder — `<analytics-base-url>` and `grpc://<analytics-host>:32010` respectively — and the panel SHALL show a note to replace it, positioned with the snippets that use it.

Every name a snippet asks the reader to set SHALL be one the product uses publicly. The analytics service's internal name SHALL NOT appear in any snippet, placeholder, or panel string — a reader configuring a client has no way to connect it to anything they were given.

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

#### Scenario: Read snippets project the ordering key

- **WHEN** the panel opens for a source table declaring columns `event_id`, `request_time`, and `total` with an ordering key of `event_id, request_time`
- **THEN** every read snippet — Python, `curl`, and Flight SQL — queries `SELECT "event_id", "request_time" FROM <table> LIMIT <limit>`, and `total` appears in none of them

#### Scenario: A platform column named by the ordering key is not projected

- **WHEN** a source table's ordering key names a `_`-prefixed platform column such as `_ingested_at` alongside an ordinary column
- **THEN** the read snippets project only the ordinary column

#### Scenario: A table with no usable ordering key projects everything

- **WHEN** the panel opens for a source table whose payload declares no ordering key, or one naming only `_`-prefixed platform columns
- **THEN** the read snippets query `SELECT * FROM <table> LIMIT <limit>`

#### Scenario: An enrichment reads from its source table

- **WHEN** the panel opens for an enrichment named `widget_scores` over source table `widget_events`, with grain key `event_id` and first declared column `score`
- **THEN** every read snippet queries `SELECT "event_id", "widget_scores.score" FROM widget_events LIMIT <limit>`
- **AND** no snippet queries `FROM widget_scores`

#### Scenario: The enrichment read tab states the qualified form

- **WHEN** the **Read data** tab renders for an enrichment
- **THEN** it names the source table the query reads through, states that every column of the enrichment is reachable there as `"<enrichment>.<column>"` quoted as one name, and states that any column of the source table may be selected in the same query

#### Scenario: The read tab states that the projection is a subset

- **WHEN** the **Read data** tab renders
- **THEN** it states that any of the table's columns may be selected, so the snippet's projection is not read as a restriction

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

#### Scenario: Endpoint defaults to the configured public URL

- **WHEN** a public Analytics endpoint is configured and the user opens the panel
- **THEN** the snippets default `DIAL_ANALYTICS_BASE_URL` to that endpoint

#### Scenario: Flight endpoint falls back to its own placeholder

- **WHEN** no public Flight endpoint is configured
- **THEN** the Flight snippets default `DIAL_ANALYTICS_FLIGHT_SQL_URL` to a `grpc://` placeholder, never to the REST endpoint, and the Read tab shows a note to replace it

#### Scenario: Endpoint falls back to a placeholder

- **WHEN** no public Analytics endpoint is configured
- **THEN** the snippets default `DIAL_ANALYTICS_BASE_URL` to `<analytics-base-url>` and the panel shows a note to replace it, positioned with the `curl` example that exports it

#### Scenario: The shared block carries only the key

- **WHEN** the panel renders
- **THEN** the block above the tabs exports `DIAL_API_KEY` and no endpoint variable
- **AND** the Flight SQL example, which needs the key but not the REST endpoint, sets no `DIAL_ANALYTICS_BASE_URL`
- **AND** each REST example is preceded by its own `DIAL_ANALYTICS_BASE_URL` export block

#### Scenario: A table with no columns still renders

- **WHEN** the user opens the Connect panel for an `ACTIVE` table that declares no columns
- **THEN** every tab renders and the write snippet carries an empty row

#### Scenario: Rejections are shown after the snippets

- **WHEN** the **Write data** tab renders
- **THEN** the unknown-column and authorization rejections appear below the write snippets, each naming the message the caller would see

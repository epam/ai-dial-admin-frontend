# Analytics Evaluators

## Purpose

The evaluators console: the listing, version-addressed detail, the Properties and Pipelines tabs, JSON editing, and the append-only version model.
## Requirements
### Requirement: Evaluators page route and access guard

The system SHALL expose an Analytics page at `/evaluators`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsEvaluators`, with the route directory `src/app/[lang]/evaluators/`. The
page SHALL be a server component declaring `export const dynamic = 'force-dynamic'` that calls
`isAnalyticsForbidden()` before any data access and renders `Page403` when it returns `true`, matching the
guard the Tables, Pipelines, Queries, and Conversations pages already use. User-facing strings SHALL
read "Evaluators".

Reaching either page SHALL be governed by that guard **alone**. `GET /v1/evaluators`,
`GET /v1/evaluators/{name}`, and `GET /v1/evaluators/{name}/versions/{version}` carry no `@FullAdminOnly` on
the service, so no role gate SHALL keep a caller off either route or withhold any value either page reads.
The listing mutates nothing at all and therefore carries no role-gated control whatsoever.

Registering a version is the one exception and is gated separately on the detail page — see "Registering a
version requires full-admin rights". Page access and mutation access are distinct questions here because the
service answers them differently.

A registry holding no evaluators is an ordinary state and SHALL render as the console with an empty grid. A
**failed** listing fetch SHALL also render the console, with the load failure stated on the page, and SHALL
NOT resolve to a not-found result — the same reasoning the pipelines listing already applies: an operator must
be able to tell "nothing registered" from "the service is unreachable".

The route SHALL be registered in the breadcrumb configuration so the trail reads from the Evaluators
listing to the evaluator.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and `/evaluators` is requested
- **THEN** the page fetches the evaluators list on the server and renders the listing seeded with it

#### Scenario: An empty registry renders as an empty grid

- **WHEN** the evaluators listing resolves with no evaluators
- **THEN** the console renders with an empty grid and no failure message

#### Scenario: A failed listing states the failure instead of a not-found page

- **WHEN** the server-side evaluators listing fetch fails
- **THEN** the console still renders, reporting that the evaluators could not be loaded
- **AND** the page does not resolve to a not-found result

#### Scenario: Forbidden caller sees Page403 and no evaluators are fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/evaluators` is requested
- **THEN** `Page403` is rendered
- **AND** no evaluators request is issued

#### Scenario: A caller who is not a full admin reaches both pages and reads everything

- **WHEN** a caller who is not a full admin opens the listing or an evaluator's detail page
- **THEN** neither page resolves to a forbidden result
- **AND** every value either page reads is presented, with nothing withheld

### Requirement: Evaluators listing grid

The Evaluators page SHALL render the fetched evaluators as a grid whose columns are **name**, **latest
version**, **registered at**, and **used by**. Every data column SHALL remain sortable and filterable
through the grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar.

The grid SHALL NOT carry a **type** column. `GET /v1/evaluators` returns only `{name, latest_version,
created_at}`, so a type column could be filled only by a per-row version read — which the pipelines listing
requirement already forbids for its own evaluator cell — or by a join from the pipelines listing, which
leaves every unreferenced evaluator blank, where an em dash reads as "this evaluator has no type" rather
than "no pipeline names it". Type is presented on the detail page instead.

Activating a row SHALL navigate to that evaluator's detail route, `/evaluators/{name}`, honouring the
modifier keys that open a new tab. The **name** cell SHALL be plain text rather than a link, for the same
reason the pipelines listing renders its name as text: the column is read and compared across rows, and a link
per row makes it harder to scan.

The listing SHALL offer **no edit and no delete action**, on a row or anywhere else on the page, and the grid
SHALL carry no action column — *A registered version is never changed or removed; the only mutation is
appending a new one* forbids both for every caller. It SHALL offer exactly one write: a **page-level create
control in the page header**, opening the create-evaluator modal specified by *The listing's create modal
presents the members registration requires and nothing else*. The control is page-level rather than
per-row because registering is not an operation on any row: it names a new evaluator, and posting against
an existing name is how a *version* is made, which the detail page owns.

The header control SHALL be rendered only for a caller carrying `FULL_ADMIN`, per *Registering a version
requires full-admin rights*. The listing's empty state SHALL offer no create control of its own; the header
is the single door, matching the pipelines listing.

#### Scenario: Listing renders the four columns

- **WHEN** the listing renders a registered evaluator
- **THEN** its name, latest version, registration timestamp, and used-by count are presented
- **AND** no type column is present

#### Scenario: Navigating to an evaluator

- **WHEN** the user activates an evaluator's row
- **THEN** the browser navigates to `/evaluators/{name}` for that evaluator

#### Scenario: The name is plain text

- **WHEN** the listing renders an evaluator
- **THEN** its name is presented as text rather than as a link

#### Scenario: Data columns stay sortable and filterable

- **WHEN** the listing renders
- **THEN** no data column disables sorting or filtering
- **AND** no separate filter toolbar is rendered above the grid

#### Scenario: No row offers a mutation

- **WHEN** the listing renders for a full admin
- **THEN** no row exposes a create, edit, or delete action
- **AND** the grid carries no action column
- **AND** the only write the page offers is the create control in its header

#### Scenario: An empty registry offers no create control of its own

- **WHEN** the listing renders for a full admin and the registry holds no evaluator
- **THEN** the empty state states that there are no evaluators
- **AND** the page's only create control is the one in its header

### Requirement: The used-by count is derived from one pipelines listing and never guesses zero

The **used by** figure SHALL be the number of registered enrichment pipelines whose declared evaluator name
equals that row's name, counted across every version. It SHALL be derived from a single pipelines-listing
fetch the page makes on the server, narrowed to the enrichment kind, and joined in memory; the grid SHALL NOT
issue a per-row request of any kind. Only an enrichment pipeline declares an evaluator, so an aggregate one
can never contribute to this count.

An evaluator that no pipeline references SHALL report **0**, presented as a value in its own right rather
than as an em dash or a blank. This figure is the only signal the console can give that a registry entry is
dead weight, and it is the reason the column exists: no endpoint deletes an evaluator, so an operator can
never learn this by the entry disappearing.

When the pipelines listing fails, the column SHALL state that the count is unavailable and SHALL NOT render
**0**. A fabricated zero would tell an operator an evaluator is unused when the console simply could not find
out, which is the one wrong answer this column must never give.

#### Scenario: A referenced evaluator reports its pipeline count

- **WHEN** three registered enrichment pipelines declare the same evaluator name and the listing renders
- **THEN** that evaluator's used-by cell reads 3
- **AND** no per-row request is issued for any evaluator

#### Scenario: Pipelines pinned to different versions of one evaluator all count

- **WHEN** one pipeline pins version 2 of an evaluator and another tracks its latest version
- **THEN** that evaluator's used-by cell counts both pipelines

#### Scenario: An unreferenced evaluator reports zero

- **WHEN** no registered pipeline names an evaluator
- **THEN** that evaluator's used-by cell reads 0 rather than blank or an em dash

#### Scenario: A failed pipelines listing is not reported as unused

- **WHEN** the pipelines listing fetch fails while the evaluators listing succeeds
- **THEN** the listing still renders every evaluator
- **AND** the used-by column states that the count is unavailable rather than reading 0

### Requirement: Evaluator detail route addresses one version through a search param

The system SHALL expose an evaluator detail page at `/evaluators/{name}`, with the route directory
`src/app/[lang]/evaluators/[name]/`, and SHALL address a single version through the `version` search param:
`/evaluators/{name}?version=2`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'` that calls `isAnalyticsForbidden()` before any data access and
renders `Page403` when it returns `true`. The `{name}` segment SHALL be URL-decoded before use.

With no `version` param the page SHALL read the evaluator's latest version through
`GET /v1/evaluators/{name}`. With a `version` param that is a positive integer it SHALL read
`GET /v1/evaluators/{name}/versions/{version}`. A `version` param that is not a positive integer SHALL be
ignored and the latest version read, so a mistyped URL still shows the evaluator rather than a dead end.

A version read that resolves to nothing SHALL produce a not-found result — a detail page addressed by name
and version has nothing to show when that pair does not resolve. This covers both an unregistered name and
a version above the latest.

Because the page is server-rendered and its version lives in the URL, a link to one version SHALL resolve
to that version for anyone who opens it.

#### Scenario: No version param reads the latest version

- **WHEN** `/evaluators/{name}` is requested with no `version` param
- **THEN** the evaluator's latest version is read and the detail view renders seeded with it

#### Scenario: A version param reads that version

- **WHEN** `/evaluators/{name}?version=2` is requested and version 2 is registered
- **THEN** version 2 is read and the detail view renders seeded with it

#### Scenario: An unknown name is not found

- **WHEN** the evaluator read resolves to no evaluator
- **THEN** the page resolves to a not-found result

#### Scenario: A version above the latest is not found

- **WHEN** `?version=9` is requested for an evaluator whose latest version is 4
- **THEN** the version read resolves to nothing and the page resolves to a not-found result

#### Scenario: A malformed version param falls back to the latest

- **WHEN** `?version=abc` or `?version=0` is requested for a registered evaluator
- **THEN** the latest version is read and rendered
- **AND** the page does not resolve to a not-found result

#### Scenario: Forbidden caller sees Page403 and no evaluator is fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/evaluators/{name}` is requested
- **THEN** `Page403` is rendered
- **AND** no evaluator request is issued

### Requirement: The version switcher enumerates every version without a per-version request

The detail page SHALL present a version switcher offering every version from `1` to the evaluator's
`latest_version`, marking which one is currently shown. Selecting a version SHALL navigate to that
version's URL rather than re-fetching in place, so the address bar always names what is on screen — the
same navigate-on-change behaviour the deployment-images version select already has.

A version response carries its own `version` but not the evaluator's `latest_version`, so the page SHALL
read the evaluators listing alongside the addressed version to obtain it. The switcher SHALL therefore
issue **no** request of its own, and no request per offered version.

When that listing read fails while the version read succeeds, the page SHALL still render the version it
was asked for, the switcher SHALL offer only that version, and the page SHALL state that the version list
could not be loaded. A degraded switcher is preferable to a page that cannot render a version it
successfully read.

#### Scenario: Every version is offered

- **WHEN** an evaluator whose latest version is 4 is opened
- **THEN** the switcher offers versions 1, 2, 3, and 4
- **AND** no request is issued per offered version

#### Scenario: Selecting a version navigates

- **WHEN** the user selects version 2 while version 4 is shown
- **THEN** the browser navigates to that evaluator's URL carrying `version=2`

#### Scenario: The shown version is marked

- **WHEN** `?version=2` is open
- **THEN** the switcher presents version 2 as the current selection

#### Scenario: A failed version list degrades the switcher rather than the page

- **WHEN** the evaluators listing read fails and the addressed version read succeeds
- **THEN** the version's own content is rendered
- **AND** the switcher offers only that version and the page states that the version list could not be
  loaded

### Requirement: The two registration timestamps are labelled by what each dates

An evaluator carries two distinct `created_at` values, and the service does not relate them: the one in the
evaluators listing dates when the **name** was first registered, and the one in a version response dates
when **that version** was registered. They routinely differ — a name registered days before the version now
running is the normal case, not an anomaly.

The detail page SHALL present both, each labelled by what it dates, and SHALL NOT present either as the
other or fold them into a single value. When the name's registration timestamp is unavailable because the
listing read failed, it SHALL be reported as unavailable rather than filled in from the version's.

#### Scenario: Both timestamps are shown with distinct labels

- **WHEN** an evaluator whose name was registered before the version being shown is opened
- **THEN** both timestamps are presented
- **AND** each is labelled to say whether it dates the evaluator or the version

#### Scenario: An unavailable name timestamp is not substituted

- **WHEN** the evaluators listing read failed
- **THEN** the name's registration timestamp is reported as unavailable
- **AND** the version's own timestamp is not presented in its place

### Requirement: A sql evaluator omits the members its type forbids

The service accepts a different member set per evaluator `type`, enforced on registration rather than by
schema: an `llm` evaluator requires `preset` and `model`, while a `sql` evaluator is **rejected** if it
carries `preset`, `model`, `params`, `request_template`, `input_vars`, or `response_schema`, and must give
every output variable a `sql` expression.

For a `sql` evaluator the detail page SHALL therefore omit those six members entirely — no section, no
label, no placeholder. Presenting them as "not set" would state that they could be set, which for this type
is false.

For an `llm` evaluator a member the type permits but the version does not carry SHALL be presented as
explicitly unset rather than omitted, so an operator can tell a member that is absent from one that is
forbidden. `type` and `output_vars` are the only members both types carry, and both SHALL always be
presented.

An evaluator whose `type` is neither `llm` nor `sql` SHALL render the members the version actually carries
rather than an empty page, so a value added to the service later degrades to a plain reading instead of a
blank screen.

#### Scenario: A sql evaluator hides the forbidden members

- **WHEN** a `sql` evaluator version is opened
- **THEN** no preset, model, params, request template, input variables, or response schema section is
  present
- **AND** its type and output variables are presented

#### Scenario: An llm evaluator distinguishes unset from forbidden

- **WHEN** an `llm` evaluator version carrying no `params` is opened
- **THEN** the params section is present and states that none are set
- **AND** the request template and response schema sections are present

#### Scenario: An unrecognised type still renders what the version carries

- **WHEN** a version reports a `type` that is neither `llm` nor `sql`
- **THEN** the members that version actually carries are presented

### Requirement: Evaluator facts and params are presented as fields, not as a blob

The Properties tab SHALL present `type`, `preset`, and `model` as labelled controls, and `params` as a
key/value editor — one row per entry, each key labelled and its value beside it. In that presentation
`params` SHALL NOT be rendered as a JSON blob: the map holds a handful of model knobs such as
`max_tokens` and `temperature`, and those are read and changed one at a time.

This governs the tab's **form** presentation. It does not forbid the JSON editor, which presents the
whole definition — `params` among it — as one JSON document on purpose, as the escape hatch for the
values the key/value editor cannot type. The form remains what the tab opens on.

`preset` has exactly one value the service defines, `chat_completion`, which the model layer SHALL name as
an enum member rather than a bare string. A value the enum does not name SHALL still be rendered verbatim.

#### Scenario: Params are readable and changeable one entry at a time

- **WHEN** an `llm` version carrying `max_tokens` and `temperature` is opened
- **THEN** each key is presented with its own value
- **AND** the params are not presented as a single JSON document

#### Scenario: An unknown preset renders as reported

- **WHEN** a version reports a preset the console does not know
- **THEN** that value is presented as the service reported it

### Requirement: The request template is bounded and never reformatted; the schema is edited as JSON

`request_template` and `response_schema` are different kinds of value and SHALL be treated differently.

`request_template` is a **string** on the wire — a single-line JSON document that can run to thousands of
characters, and one the service accepts whether or not it parses. It SHALL be presented inline within a
bounded height that scrolls on its own, readable without a further interaction, since it is the member an
operator opens this page for. It SHALL NOT be validated or reformatted: pretty-printing a string changes the
bytes that would be sent, so a template that is not parseable JSON SHALL be presented verbatim rather than
reported as an error, and submitting an untouched template SHALL send exactly the string that was read.

`response_schema` is an **object** on the wire, so its formatting carries no meaning. It SHALL be edited
through the console's existing JSON editor control rather than inline, keeping a large schema from
dominating the tab, and it MAY be pretty-printed for reading because doing so cannot change what is sent.

#### Scenario: The template is bounded and scrolls on its own

- **WHEN** a version whose request template is several thousand characters long is opened
- **THEN** the template is presented within a bounded height that scrolls
- **AND** the members below it remain reachable

#### Scenario: The template is readable on arrival

- **WHEN** an `llm` version is opened
- **THEN** its request template content is presented without a further interaction

#### Scenario: An unparseable template is presented as stored

- **WHEN** a version's request template is not valid JSON
- **THEN** it is presented verbatim and no error is reported
- **AND** submitting without touching it sends the same string back

#### Scenario: The schema is edited as a document

- **WHEN** an `llm` version's response schema is opened for editing
- **THEN** it is presented through the JSON editor rather than inline in the tab

### Requirement: Declared variables are edited as rows carrying the expression that produces each

The Properties tab SHALL present `input_vars` and `output_vars` as rows of **name**, **type**, and — for
output variables — the **expression** that produces the value: the variable's `jsonata` for an `llm`
evaluator and its `sql` for a `sql` evaluator. A row SHALL be addable and removable, and the expression
SHALL be written to whichever member the current type requires, so changing the evaluator's type moves an
expression rather than losing it.

The **type** control SHALL offer the catalog's own wire codes — `string`, `integer`, `long`, `decimal`,
`boolean`, `date`, `timestamp`, `uuid`, `object`, `array`, `map`. It SHALL NOT offer the aliases the service
also accepts (`double`/`float`, `datetime`, `int`, `bool`), because each resolves to a different stored
code and offering both would let an operator pick a value the service silently renames.

A stored value the control does not offer — an alias, or anything the service starts returning later —
SHALL remain selected rather than reading as unset. A control that blanks an unrecognised value invites a
save that replaces a member nobody chose to change.

An evaluator declaring no input variables SHALL state that rather than render an empty frame.

#### Scenario: Output variables carry their producing expression

- **WHEN** a `sql` version whose output variables each carry a `sql` expression is opened
- **THEN** each variable is presented with its name, type, and that expression

#### Scenario: A stored type is selected, including one outside the offered set

- **WHEN** a version declares variables typed `integer`, `timestamp`, and the alias `datetime`
- **THEN** each control shows that variable's own type as its selection
- **AND** none of them reads as unset

#### Scenario: Changing the evaluator type moves the expression

- **WHEN** the type is changed from `sql` to `llm` and the version is submitted
- **THEN** each output variable's expression is sent as `jsonata` rather than as `sql`

#### Scenario: No declared input variables is stated

- **WHEN** a version declares no input variables
- **THEN** the tab states that none are declared

### Requirement: The Pipelines tab lists the referencing pipelines as a grid

The **Pipelines** tab SHALL present the registered enrichment pipelines whose declared evaluator name is this
evaluator's, across every version, derived from the pipelines listing the page reads on the server. It SHALL
be a grid whose columns are **name**, **target**, **trigger**, the **version this pipeline resolves to**,
**enabled**, and **updated at**. The resolved-version cell SHALL mark the pin as "latest" when the pipeline
declares no `evaluator_version`. Activating a row SHALL navigate to `/pipelines/{name}`.

When no pipeline references the evaluator, the tab SHALL say so explicitly. That is the state an operator is
looking for: nothing else in the console reports it, and no endpoint lets them act on it by deleting the
entry.

When the pipelines listing fails, the tab SHALL state that the referencing pipelines could not be loaded, and
SHALL NOT state that none reference it.

#### Scenario: Referencing pipelines are listed with their own facts

- **WHEN** two registered pipelines declare this evaluator
- **THEN** both are presented with their name, target, trigger, resolved version, enabled state, and last
  update

#### Scenario: A pipeline's pin is stated

- **WHEN** one referencing pipeline pins version 2 and another declares no version
- **THEN** the first shows version 2 and the second is marked as tracking the latest

#### Scenario: Navigating to a referencing pipeline

- **WHEN** the user activates a row
- **THEN** the browser navigates to `/pipelines/{name}` for that pipeline

#### Scenario: An unreferenced evaluator says so

- **WHEN** no registered pipeline declares this evaluator
- **THEN** the tab states that no pipeline references it

#### Scenario: A failed pipelines listing is not reported as unreferenced

- **WHEN** the pipelines listing fetch fails
- **THEN** the tab states that the referencing pipelines could not be loaded
- **AND** it does not state that no pipeline references the evaluator

### Requirement: The evaluator detail page presents Properties and Pipelines as tabs

The detail page SHALL split into two tabs following the console's established entity-view shape — a
`Properties` tab holding the version's definition, and a `Pipelines` tab holding the pipelines that reference
the evaluator. `Properties` SHALL be the tab the page opens on.

The identity row — the evaluator name, the version control, and any action the caller may take — SHALL sit
**above** the tabs, and each tab SHALL own the content below them. The read-only facts that describe the
version, rather than define it, SHALL sit inside `Properties`, separated from the fields by a divider, so the
tab reads as an entity view rather than as a form with a header bolted on.

The active tab SHALL be view state, not part of the URL: the addressed version is the page's shareable
identity, and a tab is a way of looking at it.

#### Scenario: Both tabs are offered and Properties opens

- **WHEN** an evaluator version is opened
- **THEN** a `Properties` tab and a `Pipelines` tab are offered
- **AND** the definition fields are presented without a further interaction

#### Scenario: Switching to Pipelines replaces the content, not the identity row

- **WHEN** the user activates the `Pipelines` tab
- **THEN** the referencing pipelines are presented
- **AND** the definition fields are no longer presented
- **AND** the evaluator name and the version control remain

#### Scenario: The version facts sit inside Properties

- **WHEN** the `Properties` tab is active
- **THEN** the evaluator's type and both registration timestamps are presented above the fields, separated
  from them

### Requirement: The Properties tab presents the version's definition as a form

The `Properties` tab SHALL present every member `POST /v1/evaluators` accepts as a control seeded from the
version on screen, so a version can be corrected or extended by editing what is already there rather than
by composing a request by hand.

`name` SHALL NOT be editable, for any caller. The name is what identifies the evaluator, and posting a
different one registers version 1 of a **separate** evaluator rather than a new version of this one — a
mistake the form must make impossible rather than merely discourage. The tab SHALL say why.

`type` SHALL be editable, and changing it SHALL change which members the tab presents, following the
service's own per-type shape rule. The members a `sql` evaluator forbids SHALL be dropped from the
submission rather than sent and rejected.

#### Scenario: The form is seeded from the version shown

- **WHEN** version 4 of an `llm` evaluator is opened
- **THEN** each control holds that version's value

#### Scenario: The name cannot be changed

- **WHEN** the `Properties` tab is open for any caller
- **THEN** the name is not editable
- **AND** the tab states that a different name would create a separate evaluator

#### Scenario: Changing the type changes what is submitted

- **WHEN** the type is changed from `llm` to `sql` and the version is submitted
- **THEN** the request carries no preset, model, params, request template, input variables, or response
  schema

### Requirement: The Properties tab can be edited as JSON instead of as fields

The evaluator detail page SHALL offer a JSON editor as an alternative to the `Properties` tab's
fields: a toggle in the identity row above the tabs, and the whole definition as one JSON document in
place of the tabs and everything they present. One JSON document, rather than JSON per member, is the
point — `response_schema` is already edited as JSON inside the form, and this is the whole definition
at once.

The editor and the fields SHALL edit **one** draft, not two. Enabling the editor SHALL seed it from the
version on screen, and what the JSON holds at submission SHALL be what is submitted: a member deleted
in the JSON SHALL be absent from the request rather than retained from its previous value.

Submitting SHALL go through the same path either way — the same control, the same confirmation, and
the same assembled request — so that the same JSON produces the same request no matter which way it
was submitted. The editor SHALL NOT introduce a second write path.

The toggle SHALL be offered to every caller, and the JSON SHALL be read-only for a caller who may not
register a version, matching the gating the fields already apply. Reading the definition as JSON is
useful without the rights to change it.

The JSON SHALL hold the members `POST /v1/evaluators` accepts, seeded from the version on screen, and
SHALL NOT hold `version` or `created_at`. The service assigns both and rejects both on write, and the
page already reports them — the version through its own control, the timestamp as a labelled fact. An
editable field the service will not accept only invites the caller to set it.

#### Scenario: Enabling the editor replaces the fields with JSON

- **WHEN** the caller enables the JSON editor on the `Properties` tab
- **THEN** the version's definition is presented as one block of JSON
- **AND** the definition fields are no longer presented
- **AND** the evaluator name and the version control remain

#### Scenario: The JSON is seeded from the version on screen

- **WHEN** the caller enables the JSON editor on version 4 of an evaluator
- **THEN** the JSON holds that version's values

#### Scenario: A member deleted in JSON is not resurrected

- **WHEN** the caller deletes an optional member from the JSON and submits
- **THEN** the registered version does not carry that member

#### Scenario: The JSON leaves out the fields the service assigns itself

- **WHEN** a version is presented as JSON
- **THEN** the JSON contains no `version` and no `created_at`

#### Scenario: A caller without registration rights may read the JSON but not edit it

- **WHEN** a caller who may not register a version enables the JSON editor
- **THEN** the JSON is presented
- **AND** it cannot be edited

#### Scenario: Submitting from JSON uses the same flow as the fields

- **WHEN** the caller submits from the JSON editor
- **THEN** the same confirmation naming the predicted next version is presented
- **AND** confirming registers the next version exactly as submitting from the fields would

### Requirement: The name is not editable in JSON either

`name` SHALL NOT be editable in the JSON editor, for any caller, for the same reason it is not
editable as a field: posting a different name registers version 1 of a separate evaluator rather than
a new version of this one.

Because JSON cannot disable one of its own members, a name changed in the JSON SHALL be disregarded
rather than sent: the registered version SHALL carry the name of the evaluator being edited. The
editor SHALL NOT be the one place in the console where a name change quietly forks the entity.

A change to the name alone therefore counts as no change at all: the document keeps showing what was
typed, and nothing is offered to save. This follows the console's existing treatment of a protected
member and is preferable to the alternatives — rewriting the caller's document under the cursor, or
offering a Save that registers a version identical to the one on screen.

#### Scenario: A name changed in JSON does not fork the evaluator

- **WHEN** the caller changes `name` in the JSON and submits
- **THEN** the next version of the evaluator on screen is registered
- **AND** no separate evaluator is created

#### Scenario: Changing only the name counts as no change

- **WHEN** the caller changes `name` in the JSON and nothing else
- **THEN** neither Discard nor Save is offered

### Requirement: The JSON editor takes the whole view, and an unsaved change closes the way out

While the JSON editor is open, the page SHALL present the JSON and nothing else below the identity
row. The tabs SHALL NOT be offered, for any caller. A caller who wants the definition fields, the
version facts, or the referencing rules SHALL leave the editor to reach them — this is a mode, not a
panel that shares the page.

Once the draft differs from the version on screen, the toggle itself SHALL NOT be offered either,
following the console's established behaviour: while a change is pending, the identity row offers
Discard and Save in the toggle's place. Leaving the editor is therefore **discarding or registering**,
not toggling back — which is what keeps a pending change from being parked out of sight behind a
presentation the caller switched away from.

Discarding SHALL restore the version as stored and SHALL bring the toggle back. Disabling the editor
with nothing pending SHALL return the caller to the tab that was active when they enabled it.

The identity row SHALL otherwise remain: the evaluator name, the version control, and whichever of the
toggle or the Discard/Save pair applies.

#### Scenario: The tabs are withdrawn while the editor is open

- **WHEN** the caller enables the JSON editor
- **THEN** the tabs are no longer offered
- **AND** the referencing rules are not presented

#### Scenario: A caller with read-only rights also loses the tabs

- **WHEN** a caller who may not register a version enables the JSON editor
- **THEN** the tabs are no longer offered

#### Scenario: Editing the JSON withdraws the toggle

- **WHEN** the caller edits the JSON so that it differs from the version on screen
- **THEN** the toggle is no longer offered
- **AND** Discard and Save are offered instead

#### Scenario: Discarding from the editor restores the stored version and the toggle

- **WHEN** the caller discards while the JSON editor is open
- **THEN** the JSON holds the version as stored
- **AND** the toggle is offered again

#### Scenario: Leaving the editor with nothing pending returns to the tab that was active

- **WHEN** the caller enables the JSON editor from the `Rules` tab, changes nothing, and disables it
- **THEN** the tabs are offered again
- **AND** the referencing rules are presented

### Requirement: Registering carries every member on the draft, presented or not

Assembling the version to register SHALL carry through every member on the draft, including members no
control presents, rather than copying a fixed list of the members the console happens to name. Two things
depend on this: a member introduced in the JSON editor must survive to the request, and a member the
service has added since this console was built must not be dropped from the next version registered
through it.

The exceptions SHALL be exactly these, and each exists to keep a request the service would refuse from
being sent:

- the members the service assigns (`version`, `created_at`), which it rejects on write — including when
  they are typed back into the document;
- the llm-only members when the type is `sql`, since the service answers 422 for a member belonging to the
  other type;
- empty optional members, omitted rather than sent blank — which means an explicit `null`, `{}`, `[]` or
  `""` is the one value neither presentation can send;
- a declared variable that is not an object, or carries no name, which SHALL be dropped from the request
  rather than sent, because the service rejects the whole registration over one such entry rather than
  skipping it;
- a declared variable's expression, which SHALL be restated under the member its evaluator type uses —
  `sql` for a `sql` version, `jsonata` otherwise — so a document naming the other one registers
  successfully instead of being refused.

Carry-through SHALL reach inside a declared variable as well as the top level: a member the console does
not name on a variable SHALL survive to the request.

A value of the wrong type SHALL read as absent rather than raising: both assembling the request and
checking the shape run while the page renders, so a `"model"` holding a number or an `"output_vars"`
holding an object must not fault. Such a value SHALL still be carried to the request, where the service
refuses it — the console SHALL NOT be what fails.

Because a change is detected by comparing the assembled request against the stored version, an assembly
that discarded unnamed members would also report **no change** for an edit that only introduced one — the
editor would appear to accept the edit while offering no way to save it.

#### Scenario: A member the console does not present is registered as written

- **WHEN** the caller adds a member the fields do not present to the JSON and submits
- **THEN** the request carries that member

#### Scenario: An unnamed member on a declared variable is registered too

- **WHEN** the caller adds a member the fields do not present to one of the declared variables and submits
- **THEN** the request carries that member on that variable

#### Scenario: A value of the wrong type does not break the page

- **WHEN** the caller sets a member to a value of a type the service does not accept, such as an
  `output_vars` holding an object rather than a list
- **THEN** the page continues to present the document and the controls
- **AND** submitting reports the service's refusal rather than failing in the console

#### Scenario: Adding an unpresented member counts as a change

- **WHEN** the caller adds a member the fields do not present to the JSON
- **THEN** Discard and Save are offered

#### Scenario: The members the service assigns are still not sent

- **WHEN** a version is registered
- **THEN** the request carries neither `version` nor `created_at`

#### Scenario: A sql version still omits the members its type forbids

- **WHEN** the type is `sql` and the version is registered
- **THEN** the request carries no preset, model, params, request template, input variables, or response
  schema

### Requirement: JSON that does not parse blocks submission and reports where

While the JSON editor is open, the form's own shape check SHALL NOT block submission: the JSON is the
input, and JSON the form's controls could not have produced is not thereby wrong.

JSON that does not parse SHALL block submission, and each parse error SHALL be reported with the line
it occurred on.

Text that does not parse reaches no draft, so the controls SHALL be offered on the strength of the parse
failure itself and not only on a difference from the stored version. Otherwise a caller whose **first**
edit breaks the document is offered neither a Save to be told what is wrong nor a Discard to back out of
it — the page silently ignores everything typed into it. The controls SHALL withdraw again once the
document parses.

The Save control SHALL remain enabled and refuse on use, rather than being disabled —
a caller who has broken the JSON is better served by being told where than by a control that has gone
quiet. This deliberately differs from the two other JSON surfaces in this console, the query builder's
JSON view and the table Add-rows popup, which both disable their submit action while the content does
not parse; the alternative here is the entity JSON editor's own established behaviour, which this page
follows rather than re-deciding.

No evaluator-specific validation SHALL be added beyond parseability: contract violations SHALL continue
to surface as the service's own error, reported as the console reports every other failed registration.

#### Scenario: Unparseable JSON is reported per line and nothing is registered

- **WHEN** the caller submits JSON that does not parse
- **THEN** each parse error is reported with its line number
- **AND** no version is registered

#### Scenario: Breaking the document before changing anything still offers a way out

- **WHEN** the caller's first edit to the JSON leaves it unparseable
- **THEN** Discard and Save are offered
- **AND** using Save reports the parse errors

#### Scenario: The controls withdraw once the document parses again

- **WHEN** the caller repairs unparseable JSON back to the stored version
- **THEN** the toggle is offered again

#### Scenario: The Save control stays usable while the JSON does not parse

- **WHEN** the JSON does not parse
- **THEN** the Save control is still offered as enabled

#### Scenario: JSON the service rejects reports the service's message

- **WHEN** the caller submits parseable JSON the service rejects
- **THEN** the service's own message is reported
- **AND** no version is registered

#### Scenario: A value the fields could not have produced is accepted

- **WHEN** the caller submits parseable JSON carrying a `params` value the key/value editor cannot
  express, such as a boolean or a numeric-looking string
- **THEN** submission is not blocked by the console
- **AND** the registered version carries that value as written

### Requirement: Registering a version requires full-admin rights

`POST /v1/evaluators` is the one evaluator endpoint the service marks `@FullAdminOnly`; every read is open.
The console SHALL therefore gate the write on the caller's application role (`isFullAdmin` from
`AppContext`) and SHALL NOT gate anything else on this surface.

The gate SHALL be `isFullAdmin`, **not** `isReadOnlyAdmin`. The two are not complements — a caller carrying
neither role satisfies neither predicate — so gating on `isReadOnlyAdmin` would leave a role-less caller an
enabled submit. A `READ_ONLY_ADMIN` and a caller with no role SHALL be treated identically, because the
service distinguishes only `FULL_ADMIN`.

On the **detail page** a caller without the right SHALL see the same tabs and the same values, with every
control rendered as disabled rather than hidden, and no submit or discard offered. Reading is what the
service permits them; withholding it would be the console's own invention.

On the **listing** the one control this gate governs is the header's create control, and it SHALL be
**withheld entirely rather than rendered disabled**. This is not an exception to the sentence above but its
consequence: disabled-not-hidden exists so a caller who may not write can still read every value of a
definition, and a create control carries no value to read. A permanently disabled create button on a page
that is otherwise fully readable states a permission rather than a fact. Nothing else on the listing SHALL be
gated — every column, every row, and every value SHALL be presented to every caller, and no evaluator read
SHALL be withheld.

The client gate is presentation, not enforcement. A submission that reaches the service anyway SHALL surface
the service's own rejection.

#### Scenario: A full admin can edit and submit

- **WHEN** a full admin edits a field
- **THEN** a discard and a submit are offered

#### Scenario: A read-only admin reads everything and edits nothing

- **WHEN** a caller carrying only `READ_ONLY_ADMIN` opens the detail page
- **THEN** both tabs and every value are presented
- **AND** every control is disabled
- **AND** no submit or discard is offered

#### Scenario: A caller with no role is treated the same

- **WHEN** a caller carrying neither role opens the detail page
- **THEN** the surface matches what a read-only admin sees

#### Scenario: A rejected submission reports the service's message

- **WHEN** a submission is rejected by the service
- **THEN** the service's own error is surfaced

#### Scenario: The listing offers a full admin the create control

- **WHEN** a full admin opens the evaluators listing
- **THEN** a create control is present in the page header

#### Scenario: The listing withholds the create control from a caller without the right

- **WHEN** a caller carrying only `READ_ONLY_ADMIN`, or carrying neither role, opens the evaluators listing
- **THEN** no create control is present anywhere on the page, disabled or otherwise
- **AND** every row and every column is presented, with nothing withheld

### Requirement: Saving creates the next version after the latest, not after the version shown

`register()` assigns `latest_version + 1` and admits no version in its body, so submitting an edit to
version 2 while the latest is 4 creates version **5**. There is no branching: an operator who expects to
have edited "version 2 into version 3" is wrong in a way nothing on screen would otherwise correct.

The submit control SHALL therefore be labelled as creating a new version rather than as saving, and the
console SHALL name the version that will be created **before** the request is sent, so the number is
visible while the choice is still reversible. Where the latest version could not be read, the console SHALL
say the number is unknown rather than guess it.

A successful registration SHALL report success and open the created version, since that is the definition
the operator now cares about. The version that was on screen SHALL be left as it was.

#### Scenario: The number is named before the request

- **WHEN** a full admin submits an edit to version 2 of an evaluator whose latest version is 4
- **THEN** the confirmation names version 5 as the one that will be created
- **AND** no request has been sent yet

#### Scenario: An unknown latest version is not guessed

- **WHEN** the evaluators listing could not be read and a submission is confirmed
- **THEN** the console states that the version number is unknown rather than naming one

#### Scenario: The created version is opened

- **WHEN** a registration succeeds
- **THEN** success is reported and the created version is opened

#### Scenario: The submitted request carries the whole definition

- **WHEN** one field is changed and the edit is submitted
- **THEN** the request carries every member of the definition, not only the changed one

### Requirement: A registered version is never changed or removed; the only mutation is appending a new one

`POST /v1/evaluators` is the service's only evaluator mutation. `PUT /v1/evaluators/{name}/versions/{version}`
and `DELETE /v1/evaluators/{name}/versions/{version}` exist only to answer HTTP 409 with error code
`evaluator_immutable`, and no endpoint deletes an evaluator by name.

The console SHALL therefore offer **no** edit-in-place and **no** delete affordance anywhere — not on the
listing, not on the detail page, and not for any caller. The only write it SHALL offer is registering a new
version, and it SHALL be labelled as creating a version rather than as saving the one on screen, so the
control never implies a change that the service would reject.

#### Scenario: Nothing edits or deletes an existing version

- **WHEN** the listing or a detail page renders for any caller, full admin included
- **THEN** no control edits an existing version in place
- **AND** no control deletes a version or an evaluator

#### Scenario: The write is labelled as creating a version

- **WHEN** a full admin has unsaved edits on the detail page
- **THEN** the control that submits them states that it creates a new version

### Requirement: One evaluator type badge is shared by both consoles

The evaluator type badge SHALL be a single component that both the pipelines listing and the evaluators
console render, so the two never disagree about how `llm` and `sql` look.

The badge SHALL carry the type as text. Colour SHALL NOT be the only carrier of the distinction.

#### Scenario: Both consoles render the same badge

- **WHEN** the pipelines listing shows a pipeline's resolved evaluator and the evaluator detail page shows
  the same evaluator
- **THEN** both present the type through the same badge

#### Scenario: The type is legible without colour

- **WHEN** a type badge renders
- **THEN** the type is stated as text

### Requirement: Evaluator reads are served by their own server-action module

The three evaluator readers — the listing, the latest version, and one pinned version — SHALL live in
`src/app/[lang]/evaluators/actions.ts`, so the module a reader lives in matches the surface that owns it. The
pipelines console SHALL call all three, importing them from that module; their behaviour SHALL NOT change.

#### Scenario: The pipelines console still resolves an evaluator

- **WHEN** the create-pipeline modal or the pipeline detail page resolves an evaluator
- **THEN** the same evaluator definition is returned as before

#### Scenario: The pipelines action module declares no evaluator reader

- **WHEN** the pipelines action module is read
- **THEN** it declares no evaluator reader

### Requirement: The listing's create modal presents the members registration requires and nothing else

The listing's header control SHALL open a modal that registers version 1 of a new evaluator through the
existing `createEvaluator` server action (`src/app/[lang]/evaluators/actions.ts`, `POST /v1/evaluators`).
No new route and no new server action SHALL be introduced.

The modal SHALL present exactly the members registration requires, and no member registration treats as
optional:

- **Name** — required; validated by *An evaluator's name is validated for format and for uniqueness
  against the listing, inline*.
- **Type** — required, one of `llm` or `sql`, presented **before** the members that depend on it as a
  radio group (the shape the pipelines create popup uses for a pipeline's kind).
- **Output variables** — at least one, each carrying a non-blank name and a type; for a `sql` evaluator
  each SHALL also carry a non-blank expression. The rows SHALL be authored by the same
  `EvaluatorVarsEditor` the detail page uses, reused **without new props**: a mismatch between that editor
  and this caller is handled in the modal, not by widening the shared editor. While no variable is
  declared the section SHALL present **only the control that adds one** — no empty-state text and no
  validation message. The detail page keeps both, because there an existing version's variables have been
  taken away; here nothing has been lost yet.
- **Preset** and **Model** — presented and required **only** when the selected type is `llm`.

For a `sql` evaluator the modal SHALL present **no control at all** for `preset`, `model`, `params`,
`request_template`, `input_vars`, or `response_schema` — the service answers 422 for any of them on that
type, so a disabled or empty control would state that they could be set. This is the same rule *A sql
evaluator omits the members its type forbids* applies to the detail page.

Validity SHALL be decided by `isEvaluatorShapeValid` (`src/utils/analytics/evaluator-dto.ts`) reused
unchanged, so one POST has one notion of a valid shape across both surfaces. That function is deliberately
stricter than the service on one point — it requires at least one output variable for an `llm` evaluator
too, which the service requires only for `sql` — and that SHALL NOT be re-decided here. Submission SHALL be
disabled while the shape is invalid, and no request SHALL be sent from a disabled submit.

**When a validation message appears.** An untouched form SHALL report no error. It SHALL withhold
submission and nothing more; the disabled submit is the whole feedback for a member the operator has not
reached yet. A validation message SHALL appear only once the operator has entered something that is
wrong. Two consequences, both stated here so neither reads as an omission: a blank name carries no inline
error (*An evaluator's name is validated for format and for uniqueness against the listing, inline*), and a
missing output variable carries **no message at all**. The second is stronger than touch-gating because a
missing output variable cannot be reached by a submit attempt — the submit is disabled until one exists —
so the only path to such a message would be adding a variable and then removing it. A message the operator
sees before doing anything states a rule rather than reporting a mistake, which is what the two duplicate-name
bugs (#3551, #3580) were filed about from the other direction.

The modal SHALL offer **no** editor for a member registration treats as optional — no params key/value
editor, no request template, no input variables, no response schema — and **no** JSON-editing mode. Each is
authored on the detail page, whose presentation the shipped spec constrains in detail, by registering a
further version. The consequence is deliberate and SHALL NOT be worked around: an `llm` evaluator created
here is a valid registered version that carries no request template until a second registration adds one.

#### Scenario: The header control opens the create-evaluator modal

- **WHEN** a full admin activates the create control on the evaluators listing
- **THEN** a modal opens presenting a name field, a type choice, and an output-variables editor

#### Scenario: An llm evaluator requires a preset and a model

- **WHEN** `llm` is the selected type and either the preset or the model is blank
- **THEN** submission is disabled and no registration request is sent
- **AND** once both are set alongside one named, typed output variable, submission is offered

#### Scenario: A sql evaluator offers none of the members its type forbids

- **WHEN** `sql` is the selected type
- **THEN** no preset, model, params, request-template, input-variables, or response-schema control is
  present in the modal
- **AND** the name, type, and output-variables controls are present

#### Scenario: At least one output variable is required for either type

- **WHEN** the selected type is `llm` or `sql` and no output variable is declared
- **THEN** submission is disabled
- **AND** no validation message and no empty-state text is shown for the missing output variable
- **AND** the output-variables section presents the control that adds one

#### Scenario: A sql output variable requires its expression

- **WHEN** `sql` is the selected type and an output variable carries a name and a type but no expression
- **THEN** submission is disabled

#### Scenario: An llm evaluator is registered with no request template

- **WHEN** a full admin submits a valid `llm` evaluator through the modal
- **THEN** the registration request carries no `request_template` member
- **AND** the registration is not blocked by its absence

#### Scenario: The modal offers no optional-member editor and no JSON mode

- **WHEN** the modal renders for either type
- **THEN** no params editor, request-template field, input-variables editor, response-schema editor, or
  JSON toggle is present

### Requirement: A type change rebuilds the registration request rather than accumulating it

The request SHALL be **rebuilt from the selected type at submission** by `buildEvaluatorDto`
(`src/utils/analytics/evaluator-dto.ts`) rather than posted as the accumulated draft. That function already
deletes the six llm-only members for a `sql` draft and restates each output variable's expression under
`sql` for a `sql` evaluator and `jsonata` for an `llm` one. This is what keeps a type flipped mid-modal from
carrying a member the service answers 422 for.

While the modal is open the values already entered for the other type SHALL be kept on screen, so flipping
the type and flipping back does not silently discard what the operator typed. Correctness is therefore a
property of the request that is built, not of the draft that is held: the presentation withdraws the
forbidden controls, and the rebuild is what guarantees the wire.

#### Scenario: Flipping to sql drops the llm-only members from the request

- **WHEN** a preset and a model are entered as an `llm` evaluator, the type is then switched to `sql`, and a
  valid evaluator is submitted
- **THEN** the registration request carries neither `preset` nor `model`
- **AND** it carries no `params`, `request_template`, `input_vars`, or `response_schema`

#### Scenario: Flipping the type back restores what was typed

- **WHEN** the type is switched from `llm` to `sql` and back to `llm`
- **THEN** the model that was entered before the switch is still presented in the modal

#### Scenario: A sql output variable's expression is posted as a sql expression

- **WHEN** an output variable's expression is entered while `llm` is selected, the type is switched to
  `sql`, and the evaluator is submitted
- **THEN** that variable carries its expression under `sql` in the request
- **AND** it carries no `jsonata` member

### Requirement: An evaluator's name is validated for format and for uniqueness against the listing, inline

The service constrains an evaluator name to `@NotBlank` and nothing more, and no surface renames an
evaluator, so this modal is the only place the console can ever constrain it.

**Format.** The name SHALL match `/^[a-z][a-z0-9_-]{0,63}$/` — the pattern the console already applies to
the sibling registry name (`isValidPipelineName`), itself a console convention rather than a mirror of a
service constraint. Because nothing renames an evaluator, no already-registered name is retro-invalidated,
and no name already on the listing SHALL be re-validated against this pattern.

**Uniqueness.** It SHALL be decided **client-side, before the request**, against the names the listing
already holds. `EvaluatorService.register` reads a name that already exists as *append
`latest_version + 1`* and answers `201`, so a duplicate typed here would silently add a version to an
evaluator somebody else owns and be reported as a success. No request SHALL be issued to the analytics
service to decide uniqueness, and none SHALL be sent while the name duplicates one on the listing.
Comparison and submission SHALL both use the trimmed value.

**Reporting.** A format violation and a duplicate SHALL both be reported **inline on the name field** and
SHALL disable submission. Neither SHALL be reported as a notification — a duplicate name surfacing as a
backend notification instead of inline validation in a create modal was filed twice as a bug (#3551,
#3580). A **blank** name SHALL NOT be reported as an inline error: emptiness is carried by the field's
required marker and the disabled submit, matching `getAnalyticsIdentifierError`, the sibling validator for
an analytics identifier.

The decision SHALL be a pure function of the entered value and the names already on the listing, so it is
decidable and testable without a server round trip.

#### Scenario: A name that does not match the pattern is reported inline

- **WHEN** a name that does not match the pattern is entered — an uppercase letter, a leading digit, a
  space, or more than 64 characters
- **THEN** the name field carries an inline error stating the format
- **AND** submission is disabled and no notification is shown

#### Scenario: A name already on the listing is reported inline and sends no request

- **WHEN** a name equal to one already on the listing is entered
- **THEN** the name field carries an inline error stating that the name is already registered
- **AND** submission is disabled and no registration request is sent

#### Scenario: A blank name is not reported as an inline error

- **WHEN** the name field is empty
- **THEN** no inline error is shown on it
- **AND** submission is disabled

#### Scenario: Correcting the name clears the inline error

- **WHEN** an invalid or duplicate name is corrected to a valid, unused one
- **THEN** the inline error is gone
- **AND** submission is offered once the rest of the shape is valid

### Requirement: A successful registration reports which of the two happened and refreshes the listing without a per-row request

**Where the operator ends up.** On success the modal SHALL close and the operator SHALL stay on the
listing. The competing rule *Saving creates the next version after the latest, not after the version
shown* — "a successful registration SHALL report success and open the created version" — governs the detail
page, where the operator was already looking at a version; it is not the listing's rule.

**What the success message says.** Success SHALL be reported by notification, and the message SHALL be told
apart by the `version` the response carries: `1` means a new evaluator was created; any other number means
the request appended a version to an evaluator that already existed, and the message SHALL say so and name
the version. This is the only signal available for the residual race the client-side uniqueness check
cannot close — a name registered elsewhere since the page loaded — because the service answers `201`
either way. Where the response carries no version the console SHALL report success **without naming a
version** rather than guessing one, as *Saving creates the next version after the latest* already requires
of an unknown version number.

**How the listing is refreshed.** The created evaluator SHALL appear in the grid with a **real used-by count
of 0**, never as unknown. The count is joined on the server in `src/app/[lang]/evaluators/page.tsx` from a
single pipelines fetch, `getEvaluators()` carries no `usedBy`, and *The used-by count is derived from one
pipelines listing and never guesses zero* forbids the grid from issuing a per-row request. The refresh
SHALL therefore re-run the page's server component, keeping the join where that requirement puts it. A
client-side re-read of the evaluators listing alone SHALL NOT be used — it would leave the new row's count
unknown — and no per-row request SHALL be issued for any evaluator.

**A rejection.** A registration the service rejects SHALL surface the service's own error as an error
notification, carrying its message and its request id where the response provides them, and SHALL leave the
modal open with the entered values intact so the operator can correct and resubmit.

#### Scenario: A created evaluator is reported as created and the modal closes

- **WHEN** a registration succeeds and the response carries version 1
- **THEN** a success notification states that the evaluator was created
- **AND** the modal closes and the listing is still the page shown

#### Scenario: The refreshed listing reports the created evaluator's used-by count as a real zero

- **WHEN** a registration succeeds and no pipeline references the created evaluator
- **THEN** the created evaluator is present in the grid with a used-by count of 0 rather than unknown
- **AND** no per-row request is issued for any evaluator

#### Scenario: A version other than 1 is reported as a version appended to an existing evaluator

- **WHEN** a registration succeeds and the response carries a version other than 1
- **THEN** the notification states that a version was appended to an evaluator that already existed and
  names that version
- **AND** it does not report a plain creation

#### Scenario: A response carrying no version is not guessed

- **WHEN** a registration succeeds and the response carries no version
- **THEN** the notification reports success without naming a version

#### Scenario: A rejected registration keeps the modal open and shows the service's error

- **WHEN** the service rejects the registration
- **THEN** the service's own error message is shown as an error notification
- **AND** the modal stays open with the entered values still present


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
**failed** listing fetch SHALL also render the console and SHALL NOT resolve to a not-found result — the same
reasoning the pipelines listing already applies: an operator must be able to tell "nothing registered" from
"the service is unreachable". That failure SHALL be reported by an error notification carrying the service's
own header, message and request id, under *An Analytics read failure is reported by notification, in the
service's own words*, and SHALL NOT be stated as text above the grid.

The page's second read — the enrichment pipelines the **used by** column is derived from — SHALL be reported
the same way when it fails. No text SHALL be inserted above the grid for it: the column's own cells already
state that the count is unavailable, so a sentence above the grid repeats per page what the cells state per
row.

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
- **THEN** the console still renders
- **AND** an error notification reports the failure, carrying the service's message and request id
- **AND** no failure text is rendered above the grid
- **AND** the page does not resolve to a not-found result

#### Scenario: A failed usage read notifies and leaves the cells to state the absence

- **WHEN** the enrichment pipelines read fails while the evaluators listing succeeds
- **THEN** every evaluator is still listed
- **AND** an error notification reports the failure
- **AND** the used-by cells state that the count is unavailable
- **AND** no failure text is rendered above the grid

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
was asked for and the switcher SHALL offer only that version. A degraded switcher is preferable to a page
that cannot render a version it successfully read. The failure SHALL be reported by an error notification
carrying the service's own header, message and request id, and SHALL NOT be stated as text in the page
header — the switcher standing at one version is itself the visible degradation, and the notification is
what says why.

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
- **AND** the switcher offers only that version
- **AND** an error notification reports the failure, carrying the service's message and request id
- **AND** no failure text is rendered in the page header

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
schema: an `llm` evaluator requires `model` and gives every output prose, while a `sql` evaluator is
**rejected** if it carries `preset`, `model`, `params` or `request_template`, and must give every output
a non-blank expression.

For a `sql` evaluator the detail page SHALL therefore omit those members entirely — no section, no
label, no placeholder. Presenting them as "not set" would state that they could be set, which for this
type is false.

For an `llm` evaluator a member the type permits but the version does not carry SHALL be presented as
explicitly unset rather than omitted, so an operator can tell a member that is absent from one that is
forbidden. `type` and the outputs are the only members both types carry, and both SHALL always be
presented.

`preset` SHALL NOT be presented for either type. The service defines one accepted value and applies it
when the member is absent, so a control offering a single choice states a decision the operator does not
have.

An evaluator whose `type` is neither `llm` nor `sql` SHALL render the members the version actually
carries rather than an empty page, so a value added to the service later degrades to a plain reading
instead of a blank screen.

#### Scenario: A sql evaluator hides the forbidden members

- **WHEN** a `sql` evaluator version is opened
- **THEN** no preset, model, params or request template section is present
- **AND** its type and outputs are presented

#### Scenario: An llm evaluator distinguishes unset from forbidden

- **WHEN** an `llm` evaluator version carrying no `params` is opened
- **THEN** the params section is present and states that none are set
- **AND** the request template section is present

#### Scenario: The preset is presented for neither type

- **WHEN** a version of either type is opened
- **THEN** no preset control is present

#### Scenario: An unrecognised type still renders what the version carries

- **WHEN** a version reports a `type` that is neither `llm` nor `sql`
- **THEN** the members that version actually carries are presented

### Requirement: The Pipelines tab lists the referencing pipelines as a grid

The **Pipelines** tab SHALL present the registered enrichment pipelines whose declared evaluator name is this
evaluator's, across every version, derived from the pipelines listing the page reads on the server. It SHALL
be a grid whose columns are **name**, **target**, **trigger**, the **version the pipeline declares**,
**enabled**, and **updated at**. Activating a row SHALL navigate to `/pipelines/{name}`.

The version cell SHALL state the pinned version, and SHALL mark a pipeline declaring none as tracking the
**latest** rather than naming a number. A listing carries what each pipeline declares and never what
`@latest` resolves to, so a number shown there would be one the response did not carry.

When no pipeline references the evaluator, the tab SHALL say so explicitly. That is the state an operator is
looking for: nothing else in the console reports it, and no endpoint lets them act on it by deleting the
entry.

When the pipelines listing fails, the failure SHALL be reported by an error notification carrying the
service's own header, message and request id. The tab SHALL NOT state that none reference the evaluator, and
SHALL keep a statement in its place that the referencing pipelines are unavailable — the tab has no content
of its own to render, and an unexplained blank tab is exactly the "nothing references it" reading this rule
exists to prevent. That statement SHALL say only that the list is unavailable; the cause, the service's
message and the request id belong to the notification.

The notification SHALL be raised from a surface that outlives the tab. This tab is mounted only while it is
the open one, so a report raised inside it is discarded on every tab switch and re-raised on every return —
the same failure reported as many times as the operator changes tabs.

#### Scenario: Referencing pipelines are listed with their own facts

- **WHEN** two registered pipelines declare this evaluator
- **THEN** both are presented with their name, target, trigger, declared version, enabled state, and last
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
- **THEN** an error notification reports the failure, carrying the service's message and request id
- **AND** the tab states in place that the referencing pipelines are unavailable
- **AND** it does not state that no pipeline references the evaluator
- **AND** dismissing the notification leaves that statement on the tab

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

The `Properties` tab SHALL present every member `POST /v1/evaluators` accepts as a control seeded from
the version on screen, so a version can be corrected or extended by editing what is already there rather
than by composing a request by hand.

`name` SHALL NOT be editable, for any caller. The name is what identifies the evaluator, and posting a
different one registers version 1 of a **separate** evaluator rather than a new version of this one — a
mistake the form must make impossible rather than merely discourage. The tab SHALL say why.

`type` SHALL be editable, and changing it SHALL change which members the tab presents, following the
service's own per-type shape rule. The members a `sql` evaluator forbids SHALL be dropped from the
submission rather than sent and rejected.

Changing the type SHALL **clear the declared outputs** rather than carry them across. An `llm` output
carries prose — what the model is told — and a `sql` one carries the expression that produces the
value; neither reads as the other, and the service refuses each on the other's type. Carrying them
would present as a declaration a list whose every entry has to be rewritten. A type stated by the same
edit that states the outputs — a document replaced wholesale in the JSON editor — SHALL keep them, since
that is a caller declaring both rather than an operator flipping a control.

#### Scenario: The form is seeded from the version shown

- **WHEN** a version of an `llm` evaluator is opened
- **THEN** each control holds that version's value

#### Scenario: The name cannot be changed

- **WHEN** the `Properties` tab is open for any caller
- **THEN** the name is not editable
- **AND** the tab states that a different name would create a separate evaluator

#### Scenario: Changing the type changes what is submitted

- **WHEN** the type is changed from `llm` to `sql` and the version is submitted
- **THEN** the request carries no preset, model, params or request template

#### Scenario: Changing the type clears the declared outputs

- **WHEN** outputs are declared as `llm` and the type is then changed to `sql`
- **THEN** no output remains declared

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
control presents, rather than copying a fixed list of the members the console happens to name. Two
things depend on this: a member introduced in the JSON editor must survive to the request, and a member
the service has added since this console was built must not be dropped from the next version registered
through it.

The exceptions SHALL be exactly these, and each exists to keep a request the service would refuse from
being sent:

- the members the service assigns (`version`, `created_at`), which it rejects on write — including when
  they are typed back into the document;
- the llm-only members when the type is `sql`, since the service answers 422 for a member belonging to
  the other type;
- empty optional members, omitted rather than sent blank — which means an explicit `null`, `{}`, `[]` or
  `""` is the one value neither presentation can send;
- an output carrying no name, which SHALL be dropped from the request rather than sent, because the
  service rejects the whole registration over one such entry rather than skipping it;
- an output's value, which SHALL be restated in the shape its evaluator type admits — a bare expression
  for a `sql` version, prose for an `llm` one — so a document written for the other type registers
  successfully instead of being refused.

`preset` SHALL be carried through when the draft holds one even though no control presents it, under the
same rule as any other unpresented member: a version that recorded a preset keeps it.

The superseded members SHALL NOT be reconstructed on write. A draft read from a version stored in the
superseded shape is normalized on read, so what is registered is always the current shape, whatever the
version it was seeded from carried.

A value of the wrong type SHALL read as absent rather than raising: both assembling the request and
checking the shape run while the page renders, so a `"model"` holding a number or an `"outputs"` holding
a list must not fault. Such a value SHALL still be carried to the request, where the service refuses
it — the console SHALL NOT be what fails.

Because a change is detected by comparing the assembled request against the stored version, an assembly
that discarded unnamed members would also report **no change** for an edit that only introduced one —
the editor would appear to accept the edit while offering no way to save it.

#### Scenario: A member the console does not present is registered as written

- **WHEN** the caller adds a member the fields do not present to the JSON and submits
- **THEN** the request carries that member

#### Scenario: A recorded preset survives a save

- **WHEN** a version carrying a preset is opened and registered without touching it
- **THEN** the request carries that preset

#### Scenario: An unnamed member on a declared variable is registered too

- **WHEN** the caller adds a member the fields do not present to one of the outputs and submits
- **THEN** the request carries only the members an output declares, because the service refuses an
  unknown one inside it with HTTP 400 naming it

#### Scenario: A version seeded from a superseded one registers in the current shape

- **WHEN** a version stored with `output_vars` is opened and registered
- **THEN** the request carries `outputs` and carries no `output_vars`, `response_schema` or `input_vars`

#### Scenario: A value of the wrong type does not break the page

- **WHEN** the caller sets a member to a value of a type the service does not accept
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
- **THEN** the request carries no preset, model, params or request template

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

### Requirement: A type change rebuilds the registration request rather than accumulating it

The request SHALL be **rebuilt from the selected type at submission** rather than posted as the
accumulated draft: the llm-only members are dropped for a `sql` draft, and each output is written in the
shape the selected type admits. This is what keeps a type flipped mid-modal from carrying a member the
service answers 422 for.

The **outputs** are the exception to keeping what was typed: changing the type clears them, for the
reason *The Properties tab presents the version's definition as a form* gives — prose and an expression
do not read as one another. Every other member entered for the other type SHALL be kept on screen, so
flipping the type and flipping back does not silently discard what the operator typed. Correctness is
therefore a property of the request that is built, not of the draft that is held: the presentation
withdraws the forbidden controls, and the rebuild is what guarantees the wire.

#### Scenario: Flipping to sql drops the llm-only members from the request

- **WHEN** a model is entered as an `llm` evaluator, the type is then switched to `sql`, and a valid
  evaluator is submitted
- **THEN** the registration request carries no `model`
- **AND** it carries no `params` or `request_template`

#### Scenario: Flipping the type back restores what was typed

- **WHEN** the type is switched from `llm` to `sql` and back to `llm`
- **THEN** the model that was entered before the switch is still presented in the modal

#### Scenario: Flipping the type clears the declared outputs

- **WHEN** an output's prose is entered while `llm` is selected and the type is switched to `sql`
- **THEN** no output remains declared, and one is declared again in the shape `sql` admits

#### Scenario: A sql output is posted as a bare expression

- **WHEN** an output's expression is entered while `sql` is selected and the evaluator is submitted
- **THEN** that output is carried as a bare expression string rather than as an object

#### Scenario: A sql output variable's expression is posted as a sql expression

- **WHEN** a version seeded from a superseded `sql` one is submitted
- **THEN** each output is carried as a bare expression string
- **AND** the request carries no `output_vars`

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

### Requirement: What an evaluator produces is authored as one ordered list of outputs

The Properties tab SHALL present the version's outputs as one ordered list, one entry per output, and
SHALL NOT present a per-output logical type. The target column owns the type, the enum domain and the
column name; the evaluator declares only what the column cannot carry.

Each entry SHALL carry a **name**, which is the target column that receives the value, and the members
its evaluator type admits:

- **`sql`** — one expression. Nothing else: the service rejects an object value on this type.
- **`llm`** — **prose**, required and non-blank, being what the model is told about the field; plus a
  **refinement**, which is a closed **value list** or a **jsonata** transform. The prose control SHALL
  accommodate a paragraph rather than a single line, because a live declaration runs to roughly a
  hundred words.

The two refinements SHALL be offered as a **selection followed by the field the selection names**,
rather than as two fields of which one must be left alone: the service refuses an output declaring
both, so a shape that admits both invites the refusal. The unselected member SHALL be kept on the row
and left out of the request, so changing the selection does not erase what was typed.

The selection SHALL offer the transform and the value list and nothing else. An output declaring
neither is legal on the service and is in fact the common form, but it is reached by leaving the
transform empty rather than by a third choice — an explicit "no refinement" would present as a
declaration a state that is only an omission.

The value list SHALL be authored through the same list popup a table column's enum values use, since
the two are the same set: a pipeline composing them refuses a value the target column does not
declare.

The order of the entries SHALL be preserved and SHALL be reorderable by dragging, because for an `llm`
evaluator the order is the order in which the model fills the fields in: a field placed before the
facts it is instructed to derive itself from is answered by invention. The tab SHALL state this rather
than leaving the ordering to look cosmetic.

Two entries SHALL NOT share a name, and the form SHALL report the collision. The request carries the
outputs as an object keyed by name, so a duplicate is silently collapsed by the parser before the
service ever validates it.

An entry SHALL be addable and removable, and at least one SHALL be required.

#### Scenario: A sql output carries only its expression

- **WHEN** a `sql` version is opened
- **THEN** each output is presented with its name and its expression
- **AND** no type, prose, value-list or jsonata control is present

#### Scenario: An llm output carries prose and one refinement at a time

- **WHEN** an `llm` version is opened
- **THEN** each output is presented with its name and its prose
- **AND** a refinement selection is offered, together with the field the selection names and no other

#### Scenario: Changing the refinement leaves out what the other holds

- **WHEN** an output declaring a value list has its refinement changed to the transform
- **AND** the version is registered
- **THEN** the request carries neither the value list nor an empty transform for that output
- **AND** the value list is still presented on the row

#### Scenario: Outputs are reordered by dragging

- **WHEN** an entry of an `llm` version is dragged above another and the version is registered
- **THEN** the request carries the outputs in the new order

#### Scenario: A duplicate output name is reported

- **WHEN** two entries are given the same name
- **THEN** the collision is reported and submission is withheld

#### Scenario: At least one output is required

- **WHEN** a version declares no output
- **THEN** submission is withheld

### Requirement: A version stored in either shape is presented the same way

The service keeps versions registered before this change exactly as they were written, so a read
answers with either the current `outputs` member or the superseded `output_vars`, `response_schema` and
`input_vars`. The console SHALL normalize both into one model and present one form: the current member
first, the superseded members as the fallback, and empty where neither carries the value.

For a superseded `llm` version the fallback SHALL take the entry list and each entry's jsonata from
`output_vars`, its prose from the matching property's description in `response_schema`, and its value
list from that property's enum. The entry **order** SHALL be taken from `output_vars` and SHALL NOT be
taken from `response_schema`, whose key order is assigned by the store rather than by the author.

No presentation SHALL mark a version as being in either shape — no badge, no read-only mode, no second
view. Which shape a version is stored in is not a fact the operator is asked to act on.

#### Scenario: A superseded sql version renders in the current form

- **WHEN** a `sql` version stored with `output_vars` is opened
- **THEN** each output is presented with its name and expression, exactly as a current version is
- **AND** no logical type is presented

#### Scenario: A superseded llm version composes its prose from the stored schema

- **WHEN** an `llm` version stored with `output_vars` and `response_schema` is opened
- **THEN** each output carries the description of its matching schema property as its prose
- **AND** the entries appear in the order `output_vars` declares, not the order the schema's keys are
  stored in

#### Scenario: Neither shape carries the value

- **WHEN** a superseded version's schema declares no description for an output
- **THEN** that output's prose is presented empty rather than blocking the page

### Requirement: Model and params are presented as fields, not as a blob

The Properties tab SHALL present `type` and `model` as labelled controls, and `params` as a key/value
editor — one row per entry, each key labelled and its value beside it. In that presentation `params`
SHALL NOT be rendered as a JSON blob: the map holds a handful of model knobs, and those are read and
changed one at a time.

Because the map is open — the service validates no key against a list — an empty editor states nothing
about what may go in it. The section SHALL therefore carry a hint naming the knobs that are ordinarily
set, so an operator facing an empty editor is not left to guess the vocabulary.

`preset` SHALL NOT be presented. The service defines one accepted value and applies it when the member
is absent, so a control offering a single choice states a decision the operator does not have.

This governs the tab's **form** presentation. It does not forbid the JSON editor, which presents the
whole definition — `params` among it — as one JSON document on purpose, as the escape hatch for the
values the key/value editor cannot type. The form remains what the tab opens on.

#### Scenario: Params are readable and changeable one entry at a time

- **WHEN** an `llm` version carrying two params is opened
- **THEN** each key is presented with its own value
- **AND** the params are not presented as a single JSON document

#### Scenario: An empty params editor names what may be set

- **WHEN** an `llm` version carrying no params is opened
- **THEN** the section names the knobs that are ordinarily set

#### Scenario: No preset is presented whatever the version carries

- **WHEN** a version carrying a preset is opened
- **THEN** no preset control is present

### Requirement: The listing's create modal presents what registration requires and nothing else

The listing's header control SHALL open a modal that registers version 1 of a new evaluator through the
existing `createEvaluator` server action (`src/app/[lang]/evaluators/actions.ts`, `POST /v1/evaluators`).
No new route and no new server action SHALL be introduced.

The modal SHALL present exactly the members registration requires, and no member registration treats as
optional:

- **Name** — required; validated by *An evaluator's name is validated for format and for uniqueness
  against the listing, inline*.
- **Type** — required, one of `llm` or `sql`, presented **before** the members that depend on it as a
  radio group (the shape the pipelines create popup uses for a pipeline's kind).
- **Outputs** — at least one, each carrying a non-blank name; for a `sql` evaluator each SHALL also
  carry a non-blank expression, and for an `llm` evaluator non-blank prose. The rows SHALL be authored
  by the same outputs editor the detail page uses. The refinement SHALL NOT be presented here: it is a
  member registration treats as optional, and the modal collects what registration requires. While no
  output is declared the section SHALL present **only the control that adds one** — no empty-state text
  and no validation message. The detail page keeps both, because there an existing version's outputs have been
  taken away; here nothing has been lost yet.
- **Model** — presented and required **only** when the selected type is `llm`.

For a `sql` evaluator the modal SHALL present **no control at all** for `model`, `params` or
`request_template` — the service answers 422 for any of them on that type, so a disabled or empty
control would state that they could be set. `preset` SHALL be presented for neither type.

Validity SHALL be decided by the same shape check the detail page uses, so one POST has one notion of a
valid shape across both surfaces. Submission SHALL be disabled while the shape is invalid, and no
request SHALL be sent from a disabled submit.

**When a validation message appears.** An untouched form SHALL report no error. It SHALL withhold
submission and nothing more; the disabled submit is the whole feedback for a member the operator has not
reached yet. A validation message SHALL appear only once the operator has entered something that is
wrong. Two consequences, both stated here so neither reads as an omission: a blank name carries no
inline error (*An evaluator's name is validated for format and for uniqueness against the listing,
inline*), and a missing output carries **no message at all**. The second is stronger than touch-gating
because a missing output cannot be reached by a submit attempt — the submit is disabled until one
exists — so the only path to such a message would be adding an output and then removing it. A message
the operator sees before doing anything states a rule rather than reporting a mistake, which is what the
two duplicate-name bugs (#3551, #3580) were filed about from the other direction.

The modal SHALL offer **no** editor for a member registration treats as optional — no params key/value
editor and no request template — and **no** JSON-editing mode. Each is authored on the detail page,
whose presentation the shipped spec constrains in detail, by registering a further version. The
consequence is deliberate and SHALL NOT be worked around: an `llm` evaluator created here is a valid
registered version that carries no request template until a second registration adds one.

#### Scenario: The header control opens the create-evaluator modal

- **WHEN** a full admin activates the create control on the evaluators listing
- **THEN** a modal opens presenting a name field, a type choice, and an outputs editor

#### Scenario: An llm evaluator requires a model

- **WHEN** `llm` is the selected type and the model is blank
- **THEN** submission is disabled and no registration request is sent
- **AND** once it is set alongside one named output carrying prose, submission is offered

#### Scenario: A sql evaluator offers none of the members its type forbids

- **WHEN** `sql` is the selected type
- **THEN** no model, params or request-template control is present in the modal
- **AND** the name, type, and outputs controls are present

#### Scenario: No preset control is present for either type

- **WHEN** the modal renders for either type
- **THEN** no preset control is present

#### Scenario: At least one output is required for either type

- **WHEN** the selected type is `llm` or `sql` and no output is declared
- **THEN** submission is disabled
- **AND** no validation message and no empty-state text is shown for the missing output
- **AND** the outputs section presents the control that adds one

#### Scenario: A sql output requires its expression

- **WHEN** `sql` is the selected type and an output carries a name but no expression
- **THEN** submission is disabled

#### Scenario: An llm evaluator is registered with no request template

- **WHEN** a full admin submits a valid `llm` evaluator through the modal
- **THEN** the registration request carries no `request_template` member
- **AND** the registration is not blocked by its absence

#### Scenario: The modal offers no optional-member editor and no JSON mode

- **WHEN** the modal renders for either type
- **THEN** no params editor, request-template field, or JSON toggle is present

### Requirement: The request template is authored as a JSON document

`request_template` SHALL be presented through the console's JSON editor rather than as plain text, so
the nesting an operator has to edit is navigable.

The member is a **string** on the wire and the service accepts it whether or not it parses. A template
that is not valid JSON SHALL therefore be presented as text rather than rejected or emptied, and SHALL
remain editable and submittable in that form. Refusing to show a value the service accepts would leave
a live version uneditable through the console.

Editing through the JSON editor re-serializes the document, so the bytes submitted MAY differ in
whitespace and key order from the bytes read. This is accepted deliberately in exchange for an editable
document; it does not extend to any other member.

#### Scenario: A template that parses is edited as a document

- **WHEN** an `llm` version whose template is valid JSON is opened
- **THEN** the template is presented through the JSON editor

#### Scenario: A template that does not parse stays editable

- **WHEN** a version's template is not valid JSON
- **THEN** it is presented as text, no error is reported, and it can still be edited and submitted

### Requirement: The template's group-grain placeholders are documented beside it

An evaluator's template renders differently depending on the trigger of whichever pipeline runs it, and
that trigger is not a fact this screen holds. The tab SHALL therefore present the group-grain
placeholders as **reference** beside the template, unconditionally, rather than as validation.

The reference SHALL name the placeholder that a group-triggered pipeline requires and the further
placeholders it supplies, distinguishing the required one from the optional ones. It SHALL NOT assert
that the current evaluator needs them, and SHALL NOT block submission.

#### Scenario: The placeholders are listed beside the template

- **WHEN** an `llm` version's template is presented
- **THEN** the group-grain placeholders are listed beside it, with the required one distinguished

#### Scenario: The reference never blocks a save

- **WHEN** a template references none of those placeholders
- **THEN** no error is reported and submission is offered

### Requirement: The JSON document is the version as the service serves it

The `Properties` tab's JSON editor SHALL present the version **as read**, with nothing removed: the
members the service assigns (`version`, `created_at`) and, for a version stored before this change, the
`output_vars` and `response_schema` it actually holds rather than the current-shape `outputs` the form
derives from them. The document is what the console can be asked about; a document that has been tidied
reports a version that is not the one stored.

What may be **sent** is decided at submission, not at presentation: assembling the request drops the
members registration does not accept, so nothing has to be hidden to keep the request valid. The
service refuses an unrecognized member in a request body outright, which is why the two cannot be the
same object.

Editing is barred while anything is unsaved, so the document the editor opens on is also the draft. A
document taken out of the editor SHALL be normalized the same way a read is, so a superseded version
edited as JSON assembles a request in the current shape rather than one carrying no outputs at all.

#### Scenario: The document carries the members the service assigns

- **WHEN** a version is opened as JSON
- **THEN** the document carries its `version` and `created_at`

#### Scenario: A version stored before this change is shown as it is stored

- **WHEN** a version carrying `output_vars` and `response_schema` is opened as JSON
- **THEN** the document carries those members rather than a derived `outputs`

#### Scenario: Editing a superseded version as JSON registers it in the current shape

- **WHEN** such a document is edited and the version is registered
- **THEN** the request carries the outputs in the current shape
- **AND** it carries no `output_vars`, `response_schema` or `version`

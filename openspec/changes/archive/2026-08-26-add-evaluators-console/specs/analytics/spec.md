## ADDED Requirements

### Requirement: Evaluators page route and access guard

The system SHALL expose an Analytics page at `/evaluators`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsEvaluators`, with the route directory `src/app/[lang]/evaluators/`. The
page SHALL be a server component declaring `export const dynamic = 'force-dynamic'` that calls
`isAnalyticsForbidden()` before any data access and renders `Page403` when it returns `true`, matching the
guard the Tables, Enrichment rules, Queries, and Conversations pages already use. User-facing strings SHALL
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
NOT resolve to a not-found result — the same reasoning the rules listing already applies: an operator must
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
created_at}`, so a type column could be filled only by a per-row version read — which the rules listing
requirement already forbids for its own evaluator cell — or by a join from the rules listing, which leaves
every unreferenced evaluator blank, where an em dash reads as "this evaluator has no type" rather than "no
rule names it". Type is presented on the detail page instead.

Activating a row SHALL navigate to that evaluator's detail route, `/evaluators/{name}`, honouring the
modifier keys that open a new tab. The **name** cell SHALL be plain text rather than a link, for the same
reason the rules listing renders its name as text: the column is read and compared across rows, and a link
per row makes it harder to scan.

The listing SHALL offer no create, edit, or delete action on any row.

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

- **WHEN** the listing renders
- **THEN** no row exposes a create, edit, or delete action

### Requirement: The used-by count is derived from one rules listing and never guesses zero

The **used by** figure SHALL be the number of registered rules whose declared evaluator name equals that
row's name, counted across every version. It SHALL be derived from a single rules-listing fetch the page
makes on the server and joined in memory; the grid SHALL NOT issue a per-row request of any kind.

An evaluator that no rule references SHALL report **0**, presented as a value in its own right rather than
as an em dash or a blank. This figure is the only signal the console can give that a registry entry is dead
weight, and it is the reason the column exists: no endpoint deletes an evaluator, so an operator can never
learn this by the entry disappearing.

When the rules listing fails, the column SHALL state that the count is unavailable and SHALL NOT render
**0**. A fabricated zero would tell an operator an evaluator is unused when the console simply could not
find out, which is the one wrong answer this column must never give.

#### Scenario: A referenced evaluator reports its rule count

- **WHEN** three registered rules declare the same evaluator name and the listing renders
- **THEN** that evaluator's used-by cell reads 3
- **AND** no per-row request is issued for any evaluator

#### Scenario: Rules pinned to different versions of one evaluator all count

- **WHEN** one rule pins version 2 of an evaluator and another tracks its latest version
- **THEN** that evaluator's used-by cell counts both rules

#### Scenario: An unreferenced evaluator reports zero

- **WHEN** no registered rule names an evaluator
- **THEN** that evaluator's used-by cell reads 0 rather than blank or an em dash

#### Scenario: A failed rules listing is not reported as unused

- **WHEN** the rules listing fetch fails while the evaluators listing succeeds
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
key/value editor — one row per entry, each key labelled and its value beside it. `params` SHALL NOT be
rendered as a JSON blob: the map holds a handful of model knobs such as `max_tokens` and `temperature`, and
those are read and changed one at a time.

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

### Requirement: The Rules tab lists the referencing rules as a grid

The **Rules** tab SHALL present the registered rules whose declared evaluator name is this evaluator's,
across every version, derived from the rules listing the page reads on the server. It SHALL be a grid whose
columns are **name**, **target enrichment**, **trigger**, the **version this rule resolves to**, **enabled**,
and **updated at**. The resolved-version cell SHALL mark the pin as "latest" when the rule declares no
`evaluator_version`. Activating a row SHALL navigate to `/enrichment-rules/{id}`.

When no rule references the evaluator, the tab SHALL say so explicitly. That is the state an operator is
looking for: nothing else in the console reports it, and no endpoint lets them act on it by deleting the
entry.

When the rules listing fails, the tab SHALL state that the referencing rules could not be loaded, and SHALL
NOT state that none reference it.

#### Scenario: Referencing rules are listed with their own facts

- **WHEN** two registered rules declare this evaluator
- **THEN** both are presented with their name, target enrichment, trigger, resolved version, enabled state,
  and last update

#### Scenario: A rule's pin is stated

- **WHEN** one referencing rule pins version 2 and another declares no version
- **THEN** the first shows version 2 and the second is marked as tracking the latest

#### Scenario: Navigating to a referencing rule

- **WHEN** the user activates a row
- **THEN** the browser navigates to `/enrichment-rules/{id}` for that rule

#### Scenario: An unreferenced evaluator says so

- **WHEN** no registered rule declares this evaluator
- **THEN** the tab states that no rule references it

#### Scenario: A failed rules listing is not reported as unreferenced

- **WHEN** the rules listing fetch fails
- **THEN** the tab states that the referencing rules could not be loaded
- **AND** it does not state that no rule references the evaluator

### Requirement: The evaluator detail page presents Properties and Rules as tabs

The detail page SHALL split into two tabs following the console's established entity-view shape — a
`Properties` tab holding the version's definition, and a `Rules` tab holding the rules that reference the
evaluator. `Properties` SHALL be the tab the page opens on.

The identity row — the evaluator name, the version control, and any action the caller may take — SHALL sit
**above** the tabs, and each tab SHALL own the content below them. The read-only facts that describe the
version, rather than define it, SHALL sit inside `Properties`, separated from the fields by a divider, so
the tab reads as an entity view rather than as a form with a header bolted on.

The active tab SHALL be view state, not part of the URL: the addressed version is the page's shareable
identity, and a tab is a way of looking at it.

#### Scenario: Both tabs are offered and Properties opens

- **WHEN** an evaluator version is opened
- **THEN** a `Properties` tab and a `Rules` tab are offered
- **AND** the definition fields are presented without a further interaction

#### Scenario: Switching to Rules replaces the content, not the identity row

- **WHEN** the user activates the `Rules` tab
- **THEN** the referencing rules are presented
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

### Requirement: Registering a version requires full-admin rights

`POST /v1/evaluators` is the one evaluator endpoint the service marks `@FullAdminOnly`; every read is open.
The console SHALL therefore gate the write on the caller's application role (`isFullAdmin` from
`AppContext`) and SHALL NOT gate anything else on this surface.

The gate SHALL be `isFullAdmin`, **not** `isReadOnlyAdmin`. The two are not complements — a caller carrying
neither role satisfies neither predicate — so gating on `isReadOnlyAdmin` would leave a role-less caller an
enabled submit. A `READ_ONLY_ADMIN` and a caller with no role SHALL be treated identically, because the
service distinguishes only `FULL_ADMIN`.

A caller without the right SHALL see the same tabs and the same values, with every control rendered as
disabled rather than hidden, and no submit or discard offered. Reading is what the service permits them;
withholding it would be the console's own invention.

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

The evaluator type badge — currently written inline in the rules listing's evaluator cell — SHALL be a
single component that both the rules listing and the evaluators console render, so the two never disagree
about how `llm` and `sql` look.

The badge SHALL carry the type as text. Colour SHALL NOT be the only carrier of the distinction.

#### Scenario: Both consoles render the same badge

- **WHEN** the rules listing shows a rule's resolved evaluator and the evaluator detail page shows the same
  evaluator
- **THEN** both present the type through the same badge

#### Scenario: The type is legible without colour

- **WHEN** a type badge renders
- **THEN** the type is stated as text

### Requirement: Evaluator reads are served by their own server-action module

The three evaluator readers — the listing, the latest version, and one pinned version — SHALL live in
`src/app/[lang]/evaluators/actions.ts` rather than in the enrichment-rules action module that declares them
today, so the module a reader lives in matches the surface that owns it. The enrichment-rules console SHALL
keep calling all three, importing them from the new module; their behaviour SHALL NOT change.

#### Scenario: The rules console still resolves an evaluator

- **WHEN** the create-rule modal or the rule detail page resolves an evaluator after the move
- **THEN** the same evaluator definition is returned as before

#### Scenario: The rules action module no longer declares them

- **WHEN** the enrichment-rules action module is read
- **THEN** it declares no evaluator reader

## MODIFIED Requirements

### Requirement: Analytics menu group with Query Builder and Tables sub-items

The left-navigation menu configuration (`MENU_CONFIGURATION` in `menu-configuration.tsx`) SHALL define an "Analytics" menu group whose sub-items are, in order, "Tables" (linking to the Tables route), "Enrichment rules" (linking to the Enrichment rules route), "Evaluators" (linking to the Evaluators route), "Queries" (linking to the Queries route), and "Conversations" (linking to the Conversations route). The group MUST use its own icon and follow the existing `MenuGroupConfiguration` shape. Routes SHALL be present in the `ApplicationRoute` enum (`types/routes.ts`) — `/queries`, `/tables`, `/enrichment-rules`, `/evaluators`, and `/conversations-trace` — and labels SHALL exist in `MenuI18nKey` (`constants/i18n.ts`) with English strings in `locales/en.ts` ("Analytics", "Queries", "Tables", "Enrichment rules", "Evaluators", "Conversations"). The Conversations label MUST be a distinct `MenuI18nKey` member from the one used by the existing DIAL Core `/conversations` item, even though both render the same English string.

"Evaluators" SHALL sit directly after "Enrichment rules" rather than before it. An evaluator cannot be registered from this console, so a position ahead of Enrichment rules would read as the first step of a workflow that does not start here; the evaluators page is a reference surface an operator reaches from a rule, and placing it next to rules keeps the enrichment pair adjacent.

The Enrichment rules route SHALL be spelled `/enrichment-rules`, not `/rules`: `src/components/Rules/` and the `RuleFolderProvider` in the app's provider stack already denote entity **access rules**, an unrelated capability, and a `/rules` route would shadow that meaning in the menu, in breadcrumbs, and in the codebase.

The standalone `/query-builder` route SHALL NOT be present in the menu or in the `ApplicationRoute` enum. Requests to `/query-builder` SHALL redirect to `/queries` so existing links resolve.

#### Scenario: Group and sub-items render when flag enabled

- **WHEN** `featureFlags.analyticsEnabled` is `true` and the sidebar menu renders
- **THEN** an "Analytics" group is present
- **AND** expanding it shows a "Tables" sub-item linking to `/tables`
- **AND** it shows an "Enrichment rules" sub-item linking to `/enrichment-rules`
- **AND** it shows an "Evaluators" sub-item linking to `/evaluators`, ordered after "Enrichment rules"
- **AND** it shows a "Queries" sub-item linking to `/queries`
- **AND** it shows a "Conversations" sub-item linking to `/conversations-trace`
- **AND** no "Query Builder" sub-item is present

#### Scenario: The retired route redirects

- **WHEN** the user navigates to `/query-builder`
- **THEN** the browser is redirected to `/queries`

### Requirement: Read-only rule facts are presented separately from editable ones

A rule carries members the service derives and the API refuses to accept: `id`, `grain_key`,
`version_column`, `generation`, `created_at`, `updated_at`, and the resolved `evaluator` definition. The
detail page SHALL present these as read-only, visually separated from the editable form, so it is
unambiguous which values an operator can change. `version_column` SHALL render as an em dash when the
read source declares no scan metadata.

The resolved evaluator SHALL link to that evaluator's detail page at the version the rule resolved to. The
rule states which evaluator runs but nothing about what it does, and this fact is where an operator asking
that question already is.

These members SHALL NOT be sent when the rule is saved.

#### Scenario: Derived facts are shown but not editable

- **WHEN** a rule is opened
- **THEN** its `grain_key`, `generation`, `created_at`, `updated_at`, and resolved evaluator are presented
  as read-only values

#### Scenario: An absent version column reads as an em dash

- **WHEN** the rule's read source declares no scan metadata
- **THEN** `version_column` renders as an em dash rather than as blank

#### Scenario: The resolved evaluator opens its own page

- **WHEN** the user activates the resolved evaluator on a rule pinned to version 2
- **THEN** the browser navigates to that evaluator's detail page addressing version 2

### Requirement: Analytics data-access server API layer is configured

The server-side API layer SHALL provide a single typed client, `AnalyticsDataApi`, for the Analytics data-access service, hosted at `process.env.DIAL_ANALYTICS_API_URL`. The client instance SHALL be created and exported once from `app/api/api.ts` as `analyticsDataApi` (following the existing per-service instantiation pattern); the class SHALL extend `BaseApi` and live at `src/server/analytics/analytics-data-api.ts`. Request/response DTOs SHALL be placed in dedicated model files under `src/models/analytics/`. All requests SHALL send the standard auth/API headers via the existing helpers, and `{name}` path segments MUST be URL-encoded.

Queries endpoints (base path `/v1/queries`):
- `GET /v1/queries/entities` — list queryable entities
- `GET /v1/queries/entities/schema/{name}` — fetch the field schema for a named entity
- `POST /v1/queries/execute` — execute a structured query; exposed as `executeAction`, returning a `ServerActionResponse` so callers can surface an error header/message on failure
- `POST /v1/queries/execute-sql` — execute an ad-hoc SQL SELECT (body `{ sql }`); exposed as `executeSqlAction`, returning a `ServerActionResponse` with the same result envelope as `execute`
- `POST /v1/queries/translate` — translate a structured query to the external-dialect SQL subset (validation only, no execution); exposed as `translateAction`, returning a `ServerActionResponse<{ sql }>`
- `POST /v1/queries/translate-sql` — translate a SQL SELECT to the structured DSL (body `{ sql }`, validation only, no execution); exposed as `translateSqlAction`, returning a `ServerActionResponse<{ query }>`

Saved queries endpoints (base path `/v1/saved-queries`):
- `GET /v1/saved-queries?scope={personal|common}` — list the saved queries visible at that scope, each returned in full including its body, most recently updated first; the response is wrapped as `{ saved_queries: [...] }` and the client SHALL unwrap it to a bare array. There is no paging and no server-side sorting or filtering
- `POST /v1/saved-queries` — create; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`
- `GET /v1/saved-queries/{id}` — read one in full, including its body
- `PUT /v1/saved-queries/{id}` — full replace of the caller-supplied members; exposed as an `*Action` returning a `ServerActionResponse<SavedQuery>`. The service accepts no precondition header, so no `If-Match` is sent
- `DELETE /v1/saved-queries/{id}` — delete; exposed as an `*Action` returning a `ServerActionResponse`

There SHALL be no client-side execute call for a saved query: the stored body is posted to the existing execute endpoints, so a run stays a read and no run state is written to the saved query.

Tables endpoints (base path `/v1/tables`):
- `GET /v1/tables` — list tables; the response is wrapped as `{ tables: [...] }` and the client SHALL unwrap it to a bare array
- `POST /v1/tables` — create a table or enrichment; **identity-only** (`{name, type, description?}`, plus `source_table` for an enrichment). It SHALL NOT send `columns` or any physical key; the created table is returned in `status=PENDING`
- `GET /v1/tables/{name}` — read one table by name
- `PUT /v1/tables/{name}` — update table catalog metadata (`description`, `tag_order`); exposed as `updateTable`, returning a `ServerActionResponse`
- `DELETE /v1/tables/{name}` — delete a table by name
- `POST /v1/tables/{name}/schema` — define the complete physical schema of a not-yet-materialized table (columns + physical keys) **and** materialize it in the same call (issues `CREATE TABLE`, flips to `ACTIVE`); exposed as `defineTableSchema`, returning a `ServerActionResponse`
- `PATCH /v1/tables/{name}/schema` — evolve a materialized (`ACTIVE`) table's columns; exposed as `updateTableSchema`
- `POST /v1/tables/{name}/rows` — insert rows into a table

Enrichment rules endpoints (base path `/v1/rules`):
- `GET /v1/rules` — list rules. Deployed builds of the service answer with either a bare array or a `{ items: [...] }` wrapper, so the client SHALL accept both and unwrap to a bare array; only a response that is neither SHALL be read as a failure. **Where the wrapper is used its key differs from the tables listing's `{ tables }`.** The listing accepts two optional filters, `enabled` and `updated_since`, which combine rather than replace one another. The client SHALL support both on the API surface even where no screen currently drives them. `enabled` SHALL be sent only as the literal `true` or `false`; when the caller expresses no preference the parameter SHALL be **omitted from the query string entirely**, because the service rejects an empty value — along with `1`, `yes`, `on`, `TRUE`, and a repeated parameter — with HTTP 400 rather than reading it as "unfiltered". The response order is total (oldest `updated_at` first, `id` breaking ties)
- `POST /v1/rules` — register a rule. A rule is created **whole in a single request**; unlike a table there is no identity-then-schema split and no draft state. Exposed as an `*Action` returning a `ServerActionResponse`
- `GET /v1/rules/{id}` — read one rule by id
- `PUT /v1/rules/{id}` — **full replace**, not a merge-patch: an omitted member is erased. Exposed as an `*Action` returning a `ServerActionResponse`
- `DELETE /v1/rules/{id}` — delete a rule by id; exposed as an `*Action` returning a `ServerActionResponse`

Every rule the service returns is **resolved**: it carries its pinned evaluator version inlined as `evaluator`, its read `source` (declared on the rule, or defaulted to the target enrichment's `source_table` — the response does not distinguish the two), the `grain_key` derived from the target enrichment, and the read source's `version_column`, which is absent when that source declares no scan metadata. A disabled rule is resolved exactly like an enabled one. `generation` is bumped on every accepted mutation and is the change signal; the service exposes no `ETag`, so no precondition header is sent.

Evaluator endpoints (base path `/v1/evaluators`). Reads are open to any authenticated caller; the single write is `FULL_ADMIN`-only:
- `GET /v1/evaluators` — list evaluators as `{name, latest_version, created_at}`; as with the rules listing the response may be a bare array or a `{ items: [...] }` wrapper and the client SHALL accept both. Version definitions are **not** included
- `GET /v1/evaluators/{name}` — read that evaluator's latest version in full, including `type` (`llm` or `sql`), `input_vars`, and `output_vars`
- `GET /v1/evaluators/{name}/versions/{version}` — read one pinned version in full
- `POST /v1/evaluators` — register an evaluator or **append a version to an existing one**; the only evaluator mutation the service offers, and the only one it marks `@FullAdminOnly`. The body carries no version: an unknown `name` creates version 1, and a known `name` creates `latest_version + 1`, so there is no way to address which version is produced. Exposed as an `*Action` returning a `ServerActionResponse`
- `PUT /v1/evaluators/{name}/versions/{version}` and `DELETE /v1/evaluators/{name}/versions/{version}` exist only to reject: both answer HTTP 409 with error code `evaluator_immutable`. There is **no** endpoint that deletes an evaluator by name. The client SHALL NOT surface either, because a registered version can never be changed and a registered evaluator can never be removed

The accepted body shape depends on `type` and is enforced imperatively by the service rather than by schema validation: `llm` requires `preset` and `model`; `sql` forbids `preset`, `model`, `params`, `request_template`, `input_vars`, and `response_schema`, and requires every output variable to carry a `sql` expression. A member belonging to the other branch is rejected, not ignored.

#### Scenario: Client targets the Analytics data-access host

- **WHEN** `analyticsDataApi` is instantiated in `app/api/api.ts`
- **THEN** it is constructed with `host: process.env.DIAL_ANALYTICS_API_URL`

#### Scenario: Client covers the queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/queries/entities`, `GET /v1/queries/entities/schema/{name}`, `POST /v1/queries/execute` via `executeAction`, `POST /v1/queries/execute-sql` via `executeSqlAction`, `POST /v1/queries/translate` via `translateAction`, and `POST /v1/queries/translate-sql` via `translateSqlAction`

#### Scenario: Client covers the saved-queries endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/saved-queries` for a given scope (unwrapping `{ saved_queries }`), `POST /v1/saved-queries`, `GET /v1/saved-queries/{id}`, `PUT /v1/saved-queries/{id}`, and `DELETE /v1/saved-queries/{id}`

#### Scenario: Client covers the tables endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/tables` (unwrapping `{ tables }`), `POST /v1/tables` (identity-only), `GET /v1/tables/{name}`, `PUT /v1/tables/{name}` via `updateTable`, `DELETE /v1/tables/{name}`, `POST /v1/tables/{name}/schema` via `defineTableSchema`, `PATCH /v1/tables/{name}/schema` via `updateTableSchema`, and `POST /v1/tables/{name}/rows`

#### Scenario: Client covers the rules and evaluators endpoints

- **WHEN** `analyticsDataApi` is used
- **THEN** it can issue `GET /v1/rules` (unwrapping `{ items }`), `POST /v1/rules`, `GET /v1/rules/{id}`, `PUT /v1/rules/{id}`, and `DELETE /v1/rules/{id}`
- **AND** it can issue `GET /v1/evaluators` (unwrapping `{ items }`), `GET /v1/evaluators/{name}`, and `GET /v1/evaluators/{name}/versions/{version}`
- **AND** it can issue `POST /v1/evaluators` to register an evaluator or append a version

#### Scenario: The client exposes no way to change or delete a registered version

- **WHEN** `analyticsDataApi` is used
- **THEN** it offers no call against `PUT /v1/evaluators/{name}/versions/{version}` or `DELETE /v1/evaluators/{name}/versions/{version}`
- **AND** the only evaluator write available is the registration POST

#### Scenario: The rules listing omits an unset enabled filter

- **WHEN** the rules listing is requested with no preference on `enabled`
- **THEN** the query string carries no `enabled` parameter at all
- **AND** it is not sent as an empty value, which the service rejects with HTTP 400

#### Scenario: The rules listing sends both filters together

- **WHEN** the rules listing is requested for enabled rules updated since a given instant
- **THEN** the query string carries `enabled=true` and `updated_since` with that instant
- **AND** the two narrow the result together rather than one replacing the other

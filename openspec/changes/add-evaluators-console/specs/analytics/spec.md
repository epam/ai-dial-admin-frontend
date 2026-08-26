## ADDED Requirements

### Requirement: Evaluators page route and access guard

The system SHALL expose an Analytics page at `/evaluators`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsEvaluators`, with the route directory `src/app/[lang]/evaluators/`. The
page SHALL be a server component declaring `export const dynamic = 'force-dynamic'` that calls
`isAnalyticsForbidden()` before any data access and renders `Page403` when it returns `true`, matching the
guard the Tables, Enrichment rules, Queries, and Conversations pages already use. User-facing strings SHALL
read "Evaluators".

The access check SHALL be that guard **alone**. `GET /v1/evaluators`, `GET /v1/evaluators/{name}`, and
`GET /v1/evaluators/{name}/versions/{version}` carry no `@FullAdminOnly` on the service, and neither this
page nor the detail page mutates anything, so no `isFullAdmin` gate SHALL be applied to either surface or to
any control on them. This differs deliberately from the rules console, whose create action is full-admin
because registering a rule is.

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

#### Scenario: A caller who is not a full admin sees the whole surface

- **WHEN** a caller who is not a full admin opens the listing or an evaluator's detail page
- **THEN** every part of both pages is presented, with nothing withheld and nothing disabled

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

### Requirement: Evaluator facts and params are presented as values, not as a blob

The detail page SHALL present `type`, `preset`, and `model` as labelled read-only values, and `params` as a
key/value list — one row per entry, each key labelled and its value beside it. `params` SHALL NOT be
rendered as a JSON blob: the map holds a handful of model knobs such as `max_tokens` and `temperature`, and
those are read one at a time.

`preset` has exactly one value the service defines, `chat_completion`, which the model layer SHALL name as
an enum member rather than a bare string. A value the enum does not name SHALL still be rendered verbatim.

#### Scenario: Params are readable one entry at a time

- **WHEN** an `llm` version carrying `max_tokens` and `temperature` is opened
- **THEN** each key is presented with its own value
- **AND** the params are not presented as a single JSON document

#### Scenario: An unknown preset renders as reported

- **WHEN** a version reports a preset the console does not know
- **THEN** that value is presented as the service reported it

### Requirement: The request template and the response schema are presented read-only and bounded

`request_template` is a single-line JSON string that can run to thousands of characters, and
`response_schema` is a JSON document. Both SHALL be presented in a read-only editor with word wrap, a
bounded height, and its own scroll, so neither can push the rest of the page out of reach. Both SHALL be
copyable in full.

Neither SHALL be editable, and neither SHALL be validated or reformatted in a way that changes what the
service stores. A `request_template` that is not parseable JSON SHALL be rendered verbatim rather than
reported as an error — the service accepts it, so the console is not the authority on its shape.

The request template SHALL be readable without an extra interaction: it is the member an operator opens
this page to read.

#### Scenario: The template is bounded and scrolls on its own

- **WHEN** a version whose request template is several thousand characters long is opened
- **THEN** the template is presented within a bounded height that scrolls
- **AND** the sections below it remain reachable

#### Scenario: The template is readable on arrival

- **WHEN** an `llm` version is opened
- **THEN** its request template content is presented without a further interaction

#### Scenario: Neither is editable

- **WHEN** a version is opened
- **THEN** neither the request template nor the response schema accepts input

#### Scenario: An unparseable template is shown as stored

- **WHEN** a version's request template is not valid JSON
- **THEN** it is rendered verbatim and no error is reported

### Requirement: Declared variables are presented with the expression that produces each

The detail page SHALL present `input_vars` as a two-column reading of **name** and **type**, and
`output_vars` as a three-column reading of **name**, **type**, and the **expression** that produces the
value — the variable's `jsonata` for an `llm` evaluator and its `sql` for a `sql` evaluator.

An expression is code and can be long: a `sql` output variable is routinely a full `json_extract_string(...)`
call. Expressions SHALL be rendered monospaced, and where one is truncated to fit, its full text SHALL
remain reachable through a mechanism a keyboard user can reach — a `title` attribute alone SHALL NOT be
that mechanism.

An evaluator declaring no input variables SHALL state that rather than render an empty column frame with
no explanation.

#### Scenario: Output variables name their producing expression

- **WHEN** a `sql` version whose output variables each carry a `sql` expression is opened
- **THEN** each variable is presented with its name, type, and that expression
- **AND** the expressions are rendered monospaced

#### Scenario: A truncated expression stays reachable

- **WHEN** an output variable's expression is too long for its column
- **THEN** the full expression is reachable without a pointer hover

#### Scenario: No declared input variables is stated

- **WHEN** a version declares no input variables
- **THEN** the page states that none are declared

### Requirement: The rules that reference an evaluator are listed on its detail page

The detail page SHALL list the registered rules whose declared evaluator name is this evaluator's, across
every version, derived from the rules listing the page reads on the server. Each entry SHALL name the rule
and link to `/enrichment-rules/{id}`, and SHALL state which version of this evaluator that rule resolves
to — the version it pins, or that it tracks the latest.

When no rule references the evaluator, the page SHALL say so explicitly. That is the state an operator is
looking for: nothing else in the console reports it, and no endpoint lets them act on it by deleting the
entry.

When the rules listing fails, the page SHALL state that the referencing rules could not be loaded, and
SHALL NOT state that none reference it.

#### Scenario: Referencing rules link to themselves

- **WHEN** two registered rules declare this evaluator
- **THEN** both are listed, each linking to its own rule detail page

#### Scenario: A rule's pin is stated

- **WHEN** one referencing rule pins version 2 and another declares no version
- **THEN** the first is shown as pinned to version 2 and the second as tracking the latest

#### Scenario: An unreferenced evaluator says so

- **WHEN** no registered rule declares this evaluator
- **THEN** the page states that no rule references it

#### Scenario: A failed rules listing is not reported as unreferenced

- **WHEN** the rules listing fetch fails
- **THEN** the page states that the referencing rules could not be loaded
- **AND** it does not state that no rule references the evaluator

### Requirement: The console never mutates the evaluator registry and says why

`POST /v1/evaluators` is the service's only evaluator mutation; `PUT /v1/evaluators/{name}/versions/{version}`
and `DELETE /v1/evaluators/{name}/versions/{version}` exist only to answer HTTP 409 with error code
`evaluator_immutable`, and no endpoint deletes an evaluator by name. A registered version can never be
changed, and a registered evaluator can never be removed.

Neither the listing nor the detail page SHALL offer an edit, delete, or register affordance. The detail page
SHALL state that versions are immutable and that a new version is registered through the API, so the
absence of those controls reads as the contract it is rather than as a screen someone left unfinished.

#### Scenario: No mutation is offered on either page

- **WHEN** the listing or a detail page renders for any caller, full admin included
- **THEN** no control edits, deletes, or registers an evaluator or a version

#### Scenario: The detail page states the immutability

- **WHEN** a version is opened
- **THEN** the page states that registered versions cannot be changed and that a new version is registered
  through the API

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

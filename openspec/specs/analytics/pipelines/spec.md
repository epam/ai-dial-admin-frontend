# Analytics Pipelines

## Purpose

The pipelines console: the listing, registration of source and enrichment pipelines, the detail page and its per-kind transform section, bindings and trigger editors, and editing a pipeline as JSON.
## Requirements
### Requirement: Pipelines page route and access guard

The system SHALL expose an Analytics page at `/pipelines`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsPipelines`, with the route directory `src/app/[lang]/pipelines/`. The page
SHALL be a server component declaring `export const dynamic = 'force-dynamic'` that calls
`isAnalyticsForbidden()` before any data access and renders `Page403` when it returns `true`, matching the
guard the Tables, Queries, and Sessions pages already use. User-facing strings SHALL read "Pipelines".

The listing view SHALL be seeded from an **unfiltered** server-side fetch, so the page opens showing every
registered pipeline — both kinds, enabled and disabled alike. Narrowing is the user's explicit act, because
the question the page exists to answer ("is this table's pipeline missing, or registered but switched off?")
is unanswerable from a view that hides disabled pipelines by default.

A registry holding no pipelines is an ordinary state and SHALL render as the console with an empty grid. A
**failed** listing fetch SHALL also render the console and SHALL NOT resolve to a not-found result. A
not-found page conflates three conditions an operator needs to tell apart — nothing registered, the service
unreachable, and the route absent — which is the confusion this page exists to remove. That failure SHALL be
reported by an error notification carrying the service's own header, message and request id, under *An
Analytics read failure is reported by notification, in the service's own words*, and SHALL NOT be stated as
text above the grid. Exactly one report SHALL be raised per failure: the console already notified on a failed
client-side re-read, and a page that both notified and wrote the sentence reported the same failure twice.

`/enrichment-rules` SHALL NOT be redirected. The route is removed, and a request for it SHALL resolve to the
not-found page.

#### Scenario: Page renders for a permitted caller

- **WHEN** `isAnalyticsForbidden()` returns `false` and `/pipelines` is requested
- **THEN** the page fetches the pipelines list on the server and renders the listing seeded with it
- **AND** disabled pipelines of both kinds are present in that initial listing

#### Scenario: An empty registry renders as an empty grid

- **WHEN** the pipelines listing resolves with no pipelines
- **THEN** the console renders with an empty grid and no failure message

#### Scenario: A failed listing states the failure instead of a not-found page

- **WHEN** the server-side pipelines listing fetch fails
- **THEN** the console still renders
- **AND** an error notification reports the failure, carrying the service's message and request id
- **AND** no failure text is rendered above the grid
- **AND** the page does not resolve to a not-found result

#### Scenario: One failure raises one report

- **WHEN** the server-side pipelines listing fetch fails and the console renders
- **THEN** exactly one error notification is raised for it

#### Scenario: Forbidden caller sees Page403 and no pipelines are fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/pipelines` is requested
- **THEN** `Page403` is rendered
- **AND** no pipelines request is issued

#### Scenario: The former route is gone rather than redirected

- **WHEN** `/enrichment-rules` is requested
- **THEN** the page resolves to a not-found result
- **AND** no redirect to `/pipelines` is issued

### Requirement: A read the service refuses resolves to the forbidden page

`isAnalyticsForbidden()` answers whether the caller may reach the Analytics section at all; it does not
answer whether they may read a pipeline. The service currently admits only a full admin to the pipeline
registry, so a caller who passes the section guard can still be refused by the read itself.

The console distinguishes a refusal from a failure — a refused read carries HTTP 403 on its read envelope
where a failed one carries the service's own status — and the pipelines pages SHALL preserve that
distinction rather than collapsing both into a load failure. A refused listing or a refused pipeline read
SHALL render `Page403`, and SHALL raise no error notification: the forbidden page is the whole report, and a
notification beside it would report a refusal as a failure. Reporting a refusal as "the pipelines could not
be loaded" states the wrong cause and sends the operator to check a service that is working.

This is stated as a fallback rather than as the intended end state: the service is expected to restore
read access to a read-only caller, at which point such a caller reads the pipeline through the same
read-only presentation the pages already apply, and this requirement stops being reachable.

#### Scenario: A refused listing renders the forbidden page

- **WHEN** the pipelines listing is refused by the service
- **THEN** `Page403` is rendered
- **AND** no load-failure message is presented
- **AND** no error notification is raised

#### Scenario: A refused pipeline read renders the forbidden page

- **WHEN** reading one pipeline is refused by the service
- **THEN** `Page403` is rendered

#### Scenario: A failed read is still reported as a failure

- **WHEN** the pipelines listing fails for a reason other than refusal
- **THEN** the console renders and an error notification reports the failure
- **AND** `Page403` is not rendered

### Requirement: Pipelines listing grid presents both kinds

The Pipelines page SHALL render the fetched pipelines as one grid holding both kinds, seeded in the order
the service returned them — that order is total, so no client-side sort is applied by default. Narrowing and
reordering are the grid's own affordances: every data column SHALL remain sortable and filterable through the
grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar. Because the listing
is unpaged, those controls act on the whole registry.

Columns SHALL be: **name**, **kind**, **target**, **inputs**, **trigger**, **transform**, **enabled**,
**generation**, and **updated at**.

The grain key and the version column are **not** among them. The service resolves those only for a listing
narrowed to the enrichment kind that also asks for the compiled projection, and it refuses that projection
in a cross-kind listing outright rather than leaving it unresolved — so a listing holding both kinds cannot
carry them at all. A column that could only ever be empty here is not offered; both are read on the pipeline
itself.

- The **name** cell SHALL navigate to that pipeline's detail route, `/pipelines/{name}`, while rendering as
  plain text rather than as a link: the name is a value an operator reads and compares across rows, and
  styling every one as a link makes the column harder to scan.
- The **kind** cell SHALL present the kind as a badge. Kind SHALL NOT be carried by colour alone.
- The **trigger** cell SHALL show the trigger kind as a badge and nothing else. A raw six-field cron says
  nothing at a glance, and the schedule and the grouping key are both stated on the pipeline's own page.
- The **transform** cell SHALL show the transform's type as a badge — the fact the declaration itself
  carries, now that the transform is on it. It SHALL NOT name an evaluator or a version, and the grid SHALL
  NOT issue a per-row request of any kind to fill it.
- The **inputs** cell SHALL render the read source the pipeline declared. An enrichment pipeline that
  declared none — inheriting the source from its target's parent — SHALL render an em dash here, and its
  resolved source SHALL be read on its own detail page, which asks for the compiled projection.
- A column belonging to one kind SHALL render an em dash on a row of the other kind, which is an ordinary
  state rather than a failure: the service omits such a member rather than sending it empty.
- The **enabled** cell SHALL render as a badge distinguishing an enabled from a disabled pipeline; colour
  alone SHALL NOT be the only carrier of that distinction.

Each row SHALL offer an action menu with a **delete** entry, whose confirmation dialog SHALL use the danger
(red confirm) variant and SHALL identify the pipeline by name. After a successful delete the listing SHALL
refresh client-side, preserving the filters currently applied.

#### Scenario: Both kinds appear in one listing

- **WHEN** the registry holds pipelines of both kinds and the listing renders
- **THEN** every pipeline is presented in the same grid
- **AND** each row carries a badge naming its kind

#### Scenario: Listing names the transform's type from the declaration

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell carries that transform's type as a badge and names no evaluator
- **AND** no additional request is issued for that row

#### Scenario: The type badge needs no resolved listing

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell carries the type badge without a compiled projection, because the type is on
  the declaration rather than resolved

#### Scenario: No version pin is marked, there being none to mark

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its transform cell marks no version pin at all, there being no evaluator version to pin

#### Scenario: A resolved input is presented

- **WHEN** the listing renders an enrichment pipeline that declared no input of its own
- **THEN** its inputs cell shows an em dash rather than a resolved source
- **AND** the source resolved from its target is presented on that pipeline's detail page

#### Scenario: An aggregate row leaves the enrichment column empty

- **WHEN** the listing renders an aggregate pipeline
- **THEN** its transform cell shows an em dash
- **AND** the row is presented as an ordinary pipeline, not as a failure

#### Scenario: The resolved-only columns are not offered

- **WHEN** the listing renders
- **THEN** it carries no grain key column and no version column

#### Scenario: Trigger cell carries the kind alone

- **WHEN** the listing renders a `schedule` pipeline and a `group` pipeline
- **THEN** each row shows its trigger kind as a badge
- **AND** neither shows the cron expression or the grouping key

#### Scenario: Navigating to a pipeline

- **WHEN** the user activates a pipeline's name cell
- **THEN** the browser navigates to `/pipelines/{name}` for that pipeline

#### Scenario: The name is presented as text rather than as a link

- **WHEN** the listing renders a pipeline
- **THEN** its name is presented as text rather than as a link

#### Scenario: Data columns stay sortable and filterable

- **WHEN** the listing renders
- **THEN** no data column disables sorting or filtering
- **AND** no separate filter toolbar is rendered above the grid

#### Scenario: Delete a pipeline

- **WHEN** the user activates a row's delete action and confirms in the red confirmation dialog
- **THEN** the pipeline is deleted, a success notification is shown, and the listing is re-read
- **AND** a failure surfaces an error notification without removing the row

### Requirement: The selected kind determines which members are sent

The registry accepts one flat declaration for both kinds and rejects a member belonging to the other kind
with HTTP 422 rather than ignoring it. That rejection is what makes one flat shape safe, and the console
SHALL respect it: the request body SHALL carry only the members of the selected kind, whatever was entered
before the kind was changed. Hiding a control is not sufficient.

- `kind = enrich` — the body SHALL carry neither `group_by` nor `measures`.
- `kind = aggregate` — the body SHALL carry neither `advanced` nor any member of the `transform` block.

Members the service no longer accepts at all SHALL be sent for neither kind: `evaluator_name`,
`evaluator_version`, the top-level `vars`, the output mapping, the pipeline priority, the aggregate
freshness mode, and the execution knobs under their former flat names. The first three are refused at the
binding with HTTP 400 on either kind rather than as a cross-kind 422, because they belong to no kind at
all; either way the whole request fails rather than the member being ignored.

#### Scenario: Switching kind strips the abandoned members

- **WHEN** the user authors a transform, switches the kind to aggregate, and submits
- **THEN** the request body carries no member of the `transform` block

#### Scenario: An enrichment pipeline sends no aggregate members

- **WHEN** an enrichment pipeline is submitted
- **THEN** the request body carries neither `group_by` nor `measures`

#### Scenario: A withdrawn member is never sent

- **WHEN** a pipeline of either kind is submitted
- **THEN** the request body carries no `evaluator_name`, no `evaluator_version`, no top-level `vars`, no
  output mapping, no priority, no freshness and no flat execution knob

#### Scenario: A cross-kind rejection is surfaced

- **WHEN** the service rejects a submission for a member belonging to the other kind
- **THEN** the service's message is shown
- **AND** the modal stays open with its values intact

### Requirement: The selected trigger kind determines which trigger members are sent

The service's trigger invariants run **both ways**: a member that belongs to the selected trigger kind is
required **once the write arms the pipeline**, and a member that does not belong to it is **rejected with
HTTP 422 rather than ignored** on every write. The console SHALL therefore strip the members of every
unselected branch from the request body — hiding a control is not sufficient, because a value entered
before the trigger kind was changed would otherwise still be submitted. The trigger members nest under a
single `trigger` object.

- `on_ingest` — the trigger SHALL carry none of `cron`, `group_by`, `ready_when`, or `member_select`.
- `schedule` — `group_by`, `ready_when`, and `member_select` SHALL be absent. `cron` is required by the
  service when the pipeline is armed; the console SHALL send it when it has one and SHALL NOT withhold the
  save when it does not.
- `group` — `cron` SHALL be absent. `group_by` and `ready_when` are required by the service when the
  pipeline is armed, on the same terms. `member_select` is never required.

A pipeline whose trigger kind has not been chosen SHALL send **no `trigger` member at all**. An object
carrying no kind is not an absent trigger: the service reads it as a declared trigger and refuses it, and
the trigger is now an ordinary unfilled member of a registration that never collected one.

#### Scenario: Switching trigger kind strips the abandoned branch

- **WHEN** the user fills a cron expression, then switches the trigger kind to `group`, then submits
- **THEN** the trigger carries `group_by` and `ready_when` and carries no `cron`

#### Scenario: An on-ingest pipeline sends no trigger qualifiers

- **WHEN** the user submits an `on_ingest` pipeline
- **THEN** the trigger carries none of `cron`, `group_by`, `ready_when`, or `member_select`

#### Scenario: A pipeline with no trigger kind sends no trigger

- **WHEN** a pipeline whose trigger kind is unset is saved
- **THEN** the request carries no `trigger` member

#### Scenario: A schedule requires its cron

- **WHEN** the trigger kind is `schedule` and no cron expression has been provided
- **THEN** the save is offered and the request carries a trigger of kind `schedule` with no `cron`
- **AND** the service refuses the pipeline when it is enabled, naming the absent cron

#### Scenario: A group trigger requires its readiness declaration

- **WHEN** the trigger kind is `group` and no readiness condition has been provided
- **THEN** the save is offered and the request carries a trigger of kind `group` with no `ready_when`
- **AND** the service refuses the pipeline when it is enabled

### Requirement: Targets already bound to a pipeline are not offered

A table admits **at most one** pipeline writing it, across both kinds — a registry-wide uniqueness
constraint, because two declarations writing the same table would clobber one another. A second pipeline on
the same target is rejected with HTTP 409.

The target control SHALL therefore offer only tables that no existing pipeline already targets, derived by
excluding the pipelines listing's targets from the candidate tables. That exclusion SHALL be computed from
the **whole** listing rather than from one kind, because the constraint is registry-wide: an enrichment
already built by an aggregate pipeline is not available to a new enrichment pipeline either. Learning about
the constraint from a 409 after filling in an entire form is a preventable failure.

When an existing pipeline is being edited, its **own** target SHALL remain on offer. That target is bound by
the pipeline doing the editing, so excluding it would strand the control on a value it does not list.

The 409 SHALL still be handled: the exclusion is computed from data that can be stale by the time the form is
submitted, so a rejection SHALL surface the service's message and leave the form open with its values intact.

#### Scenario: A bound table is not offered as a target

- **WHEN** a table is already the target of a registered pipeline
- **THEN** it does not appear among the target options

#### Scenario: The exclusion spans both kinds

- **WHEN** a table is the target of an aggregate pipeline and an enrichment pipeline is being created
- **THEN** that table does not appear among the target options

#### Scenario: An edited pipeline still offers its own target

- **WHEN** an existing pipeline is opened for editing
- **THEN** its current target is among the offered options

#### Scenario: Every candidate is already bound

- **WHEN** every candidate table already has a pipeline
- **THEN** the target control offers no options and states why

#### Scenario: A racing 409 is surfaced without losing the form

- **WHEN** submission is rejected with HTTP 409 because another pipeline claimed the target first
- **THEN** the service's message is shown
- **AND** the modal stays open with the entered values intact

### Requirement: Pipeline action failures report the service's own message

The Analytics data-access service reports a failure as `{status, error, message, path, method}`, where
`error` is a stable machine code and `message` names the specific violation and often the fix. Pipeline
actions — create, delete, save, enable/disable, and any listing re-fetch — SHALL surface that `message` to
the user as the service worded it, through the app's error notification, rather than substituting generic
text. Replacing it discards the most useful part of the response, and the codes involved
(`pipeline_validation_failed` at 422, `pipeline_conflict` at 409, `pipeline_access_denied` at 403,
`sensitive_column_not_entitled` at 403, `write_column_not_allowed` at 422, `bad_request` at 400,
`unknown_pipeline` at 404) are not individually actionable in the UI in a way that generic text could
preserve.

A create or save rejection SHALL leave the form open with its values intact, so the operator can act on the
message without re-entering it.

#### Scenario: A validation rejection shows the service's message

- **WHEN** creation is rejected with a `pipeline_validation_failed` response
- **THEN** the message from the response is shown to the user as worded by the service
- **AND** the modal stays open with its values intact

#### Scenario: An unrecognised field is reported by name

- **WHEN** a request is rejected with `bad_request` naming a field the service does not recognise
- **THEN** the service's message, including the field name, is shown

#### Scenario: A forbidden sensitive column is reported as sent

- **WHEN** an action is rejected with `sensitive_column_not_entitled`
- **THEN** the service's message is shown rather than a generic authorization error

### Requirement: Pipeline detail route addresses a pipeline by name

The system SHALL expose a pipeline detail page at `/pipelines/{name}`, with the route directory
`src/app/[lang]/pipelines/[name]/`. The page SHALL be a server component declaring
`export const dynamic = 'force-dynamic'` that calls `isAnalyticsForbidden()` before any data access and
renders `Page403` when it returns `true`.

The page SHALL read the pipeline by name on the server. Unlike the listing — where an empty or failed result
is an ordinary state worth rendering — a detail page addressed by an identity has nothing to show when that
identity does not resolve, so a `null` result SHALL produce a not-found result.

The route SHALL be registered in the breadcrumb configuration so the trail reads from the Pipelines listing
to the pipeline.

#### Scenario: A permitted caller opens a pipeline

- **WHEN** `isAnalyticsForbidden()` returns `false` and `/pipelines/{name}` is requested for a registered
  pipeline
- **THEN** the pipeline is read on the server and the detail view renders seeded with it

#### Scenario: An unknown name is not found

- **WHEN** the pipeline read resolves to no pipeline
- **THEN** the page resolves to a not-found result

#### Scenario: Forbidden caller sees Page403 and no pipeline is fetched

- **WHEN** `isAnalyticsForbidden()` returns `true` and `/pipelines/{name}` is requested
- **THEN** `Page403` is rendered
- **AND** no pipeline request is issued

### Requirement: The detail page is one frame with a transform section chosen by kind

Both kinds share an identity, a target, a read scope, a trigger, an enabled state and a runtime state; they
differ only in what they compute. The detail page SHALL therefore present **one** frame — the identity row,
the read-only facts, the read scope, the trigger, the runtime state, the JSON editor toggle and the save
bar — and SHALL choose the transform section by the pipeline's kind.

There is one frame per page and not one per kind. Everything the frame presents **below the identity row**
is the content of the **Properties** tab (see *Pipeline detail view is organized into Properties and Audit
tabs*), which is the tab the page opens on; the identity row itself stays above the tab strip and is
presented whichever tab is selected.

The kind SHALL be read from the pipeline and SHALL NOT be selectable on the detail page: it is fixed at
registration and the service refuses to change it.

The choice of section SHALL be the page's only branch on kind. A control that belongs to one kind SHALL live
inside that kind's section rather than being conditionally rendered among the shared ones, so the shared
frame stays kind-independent.

The enrichment section SHALL present the transform as **one block** — type, model, params, request
template, inputs, outputs, in that order, which is the order of the wire's own members — and the execution
knobs beside it. The inputs SHALL NOT be a section of their own outside that block: they are
`transform.inputs`, and the placeholder correspondence that matches them against the template belongs with
both. The aggregate section SHALL present the group keys, the measures and the
freshness mode.

The **trigger** SHALL be stated above the collapsible sections rather than filed inside one. It belongs to
neither transform — an enrichment pipeline's trigger and an aggregate one's schedule are the same member —
and burying it under a heading would make when a pipeline runs the one fact the page hides.

The detail page SHALL present **every** editable member of a pipeline, so that a pipeline registered through
the API can be inspected and corrected in the console. Controls that the create modal already provides SHALL
be the same controls here, differing only in width and layout.

#### Scenario: An enrichment pipeline presents the enrichment section

- **WHEN** an enrichment pipeline is opened
- **THEN** its transform, inputs, outputs and execution knobs are presented
- **AND** the inputs are presented inside the transform block, between the request template and the outputs
- **AND** no group keys, measures or freshness control is presented

#### Scenario: An aggregate pipeline presents the aggregate section

- **WHEN** an aggregate pipeline is opened
- **THEN** its group keys, measures and freshness mode are presented
- **AND** no transform, inputs or execution knobs are presented

#### Scenario: The shared frame is the same for both kinds

- **WHEN** a pipeline of either kind is opened
- **THEN** the identity row, read-only facts, read scope, trigger, runtime state and save bar are presented

#### Scenario: Kind is not selectable

- **WHEN** a pipeline is opened
- **THEN** no control offers to change its kind

#### Scenario: A member set only through the API is visible

- **WHEN** a pipeline carrying a member the create modal does not collect is opened
- **THEN** that member is presented with its current value

#### Scenario: The trigger branch follows the selected kind

- **WHEN** the trigger kind is changed
- **THEN** only the members that kind admits are presented
- **AND** the members belonging to the previous kind are no longer presented

### Requirement: A pipeline's name is its identity and is not editable

The service made `name` the registry key and refused to change it: a patch restating the name is accepted,
a patch changing it is rejected with HTTP 422. The console SHALL present the name as a read-only identity on
the detail page rather than as an editable field, so an operator is not offered an edit the service will
refuse. Renaming is registering under the new name and retiring the old one, which the console does not
automate.

The name SHALL still be sent on a save, because it is the shape a full-replace caller sends and the service
accepts it restated.

#### Scenario: The name is presented but not editable

- **WHEN** a pipeline is opened
- **THEN** its name is presented
- **AND** no control offers to change it

#### Scenario: The name is restated on save

- **WHEN** a pipeline is saved
- **THEN** the request carries the pipeline's own name

### Requirement: Read-only pipeline facts are presented separately from editable ones

A pipeline carries members the service derives and the API refuses to accept: `generation`, `created_at`,
`updated_at`, the runtime `state`, and — for an enrichment pipeline — `grain_key`, `version_column`, the
derived `outputs` mapping and the composed `response_schema`. The detail page SHALL present the one-line
ones as read-only facts, visually separated from the editable form, so it is unambiguous which values an
operator can change. `version_column` SHALL render as an em dash when the read source declares no scan
metadata.

The composed **`response_schema` SHALL NOT be among them**. It is a document rather than a value — a dozen
field names on a live pipeline, against neighbours that are one word each — and what it lists, the outputs
editor states below in the form the operator authors them. It stays readable in the JSON editor, which is
also where the one case it spoke to is read: a declaration storing its own schema, which the service serves
verbatim rather than composing.

The name SHALL be presented among the identity rather than among these facts, because it addresses the page.
Because quoting it elsewhere is a common need, it SHALL carry a copy control.

The resolved **read source** and the **target** SHALL be presented among these facts as well, the source
first as the read scope presents them, each linking to that table's own page. Both sit inside collapsible sections of the form, so without this the page could not
answer "which tables is this bound to" without a trip back to the listing; and an operator who asks that
question is usually on their way to the table itself.

No evaluator fact SHALL be presented and no link to an evaluator page SHALL be offered: the transform is
authored on this page, and the composed `response_schema` is where "what the model is held to" is read.

These members SHALL NOT be sent when the pipeline is saved.

#### Scenario: The facts name the source before the target

- **WHEN** a pipeline's read-only facts are presented
- **THEN** the source is named before the target, as the read scope below it presents them

#### Scenario: Derived facts are shown but not editable

- **WHEN** a pipeline is opened
- **THEN** its `generation`, `created_at` and `updated_at` are presented as read-only values

#### Scenario: An enrichment pipeline adds its resolved facts

- **WHEN** an enrichment pipeline is opened
- **THEN** its `grain_key` and `version_column` are presented as read-only values

#### Scenario: The composed schema is not among the facts

- **WHEN** an enrichment pipeline whose compiled read carries a `response_schema` is opened
- **THEN** the read-only facts carry no response schema
- **AND** the document remains readable in the JSON editor

#### Scenario: An absent version column reads as an em dash

- **WHEN** an enrichment pipeline's read source declares no scan metadata
- **THEN** `version_column` renders as an em dash rather than as blank

#### Scenario: The pipeline name is copied from the identity row

- **WHEN** a pipeline is opened
- **THEN** a control is offered that copies its name

#### Scenario: The bound tables are reachable from the facts

- **WHEN** a pipeline is opened
- **THEN** its target and its resolved read source are presented among the facts
- **AND** each links to that table's page

#### Scenario: No evaluator fact is offered and none opens a page

- **WHEN** an enrichment pipeline is opened
- **THEN** no evaluator name, version or link is presented among the facts, there being no evaluator page
  to open

### Requirement: A pipeline's runtime state is presented read-only

Every pipeline carries a server-owned `state` reporting how its execution is going: when it last ran, when
it will next run, how far behind its input it is, the last failure, whether the last run left input behind,
what held its window short of its input, and whether an enrichment it reads has been re-derived beneath it.
The console SHALL present this state on the detail page, read-only.

This is the console's only answer to the question an operator arrives with when an analytics page looks
stale — the pipeline that builds that table is the thing that is behind, disabled, failing or held — and
until now none of it was reachable from the console at all.

State SHALL be presented as reported and SHALL NOT be interpreted into a health verdict. A lag figure is
measured against the moment it is read, so two reads of an unchanged position differ by the time between
them and both are correct; a clamp is progress rather than an error. Presenting either as a fault would be
the console inventing a judgement the service does not make.

A member the service omits SHALL be presented as absent rather than as a zero. A pipeline that has never run
reports no last run, which is not the same as having run at the epoch.

State SHALL NOT be sent when the pipeline is saved.

#### Scenario: Execution state is presented

- **WHEN** a pipeline that has run is opened
- **THEN** its last run, next run and lag are presented as read-only values

#### Scenario: A pipeline that has never run says so

- **WHEN** a pipeline with no recorded run is opened
- **THEN** its last run is presented as absent rather than as a zero or an epoch date

#### Scenario: The last failure is presented

- **WHEN** a pipeline whose last run failed is opened
- **THEN** the failure reported by the service is presented as worded by the service

#### Scenario: A clamp is presented as progress

- **WHEN** a pipeline whose window was held short by an enrichment it reads is opened
- **THEN** the clamp and the enrichment holding it are presented
- **AND** the pipeline is not presented as failing on that account

#### Scenario: A required rebuild is presented as an instruction

- **WHEN** a pipeline whose read enrichment has been re-derived since its output was built is opened
- **THEN** the console states that a rebuild is required and names the enrichment

#### Scenario: State is not sent on save

- **WHEN** a pipeline is saved
- **THEN** the request carries no `state` member

### Requirement: Saving replaces the pipeline whole without discarding unpresented members

`PATCH /v1/pipelines/{name}` applies every member the request carries, so an omitted member is left alone
but a presented one is replaced. The detail page SHALL save by sending a complete pipeline, and a member the
form does not present SHALL be carried through rather than dropped. An operator who edits one member MUST
NOT thereby change a member the console never showed them.

Three exceptions SHALL be constructed rather than carried over:

- the **trigger branch**, because the service rejects a member that does not belong to the selected trigger
  kind with HTTP 422 rather than ignoring it. Changing the trigger kind SHALL drop the previous kind's
  members from the request.
- the **read source** of an enrichment pipeline, which the service resolves and echoes back. Sending it back
  unchanged **declares** it, which is validated more strictly than following. See the read-source
  requirement.
- the **legacy transform output members** — `transform.output_vars` and a stored
  `transform.response_schema` — which a folded pre-fold declaration carries. They are part of the authored
  surface on `view=source` and are accepted on `PATCH`, so a read-modify-write SHALL carry them through
  unchanged rather than dropping them; the console SHALL NOT author either, and SHALL NOT send a stored
  `response_schema` alongside a newly authored `outputs`, which the service refuses with 422.

Members the service refuses on write SHALL NOT be sent at all. The service rejects an unrecognised
member with HTTP 400 naming it rather than dropping it silently, so echoing a read-only member back is a
failed save rather than a harmless one.

A successful save SHALL report success and re-read the pipeline, so the read-only facts — `generation` in
particular — reflect the accepted mutation. A failed save SHALL surface the service's own message and leave
the edited values intact.

#### Scenario: An unpresented member survives an unrelated edit

- **WHEN** a pipeline carrying a member the form does not present is opened, another member is changed, and
  it is saved
- **THEN** the request carries that member unchanged

#### Scenario: A folded legacy declaration round-trips

- **WHEN** a pipeline whose transform carries `output_vars` is opened, an unrelated member is changed, and
  it is saved
- **THEN** the request carries `transform.output_vars` unchanged rather than dropping it

#### Scenario: Switching trigger kind drops the previous branch

- **WHEN** a scheduled enrichment pipeline's trigger kind is changed to on-ingest and it is saved
- **THEN** the request carries no cron

#### Scenario: Read-only members are not sent

- **WHEN** a pipeline is saved
- **THEN** the request carries none of `generation`, `created_at`, `updated_at`, `state`, `grain_key`,
  `version_column`, the derived `outputs` mapping, or the composed `response_schema`

#### Scenario: A successful save refreshes the derived facts

- **WHEN** a save succeeds
- **THEN** success is reported
- **AND** the pipeline is re-read so the presented `generation` and `updated_at` reflect the mutation

#### Scenario: A failed save keeps the edits

- **WHEN** a save is rejected
- **THEN** the service's message is surfaced
- **AND** the edited values remain in the form

### Requirement: An enrichment pipeline's read source either follows its target or is pinned

An enrichment pipeline may declare its input, or declare none and read from whatever its target
enrichment's `source_table` points at. **The service resolves the two into the same response**, so a
pipeline that follows is indistinguishable from one pinned to the same table — and echoing the resolved
value back on a save declares it, which the service validates more strictly than following.

Because the only way to express "follows" is to omit the input from the request, saving forces a decision
whether or not the control is presented. The console SHALL therefore infer the state: an input equal to the
target enrichment's `source_table` SHALL be treated as following and omitted from the request; any other
value SHALL be treated as pinned and sent.

The inference SHALL be presented rather than applied invisibly, and SHALL be presented as **one control**: a
single selection whose first entry is following the target enrichment — naming the table that resolves to —
and whose remaining entries are the source tables a pipeline may pin. A radio pair plus a conditional select
asked the operator to answer twice; the entries are alternatives, so one list states them.

Following SHALL be a **sentinel entry** rather than the followed table's own name, because the list
otherwise holds only table names and "omit the input" is not one.

It SHALL NOT be read as a way to tell following from pinning the same table: the compiled projection the
detail page reads resolves `inputs` either way, so that distinction is not representable on the way in and
the console SHALL NOT pretend otherwise. The select's value SHALL be inferred exactly as the request
builder infers it — an input equal to the target's `source_table` reads as following and is omitted on
save — so the control and the request agree by construction. Choosing that same table from the list
therefore leaves the pipeline following, and pinning it is unreachable; a pipeline that must pin its
target's own source is declared through the JSON editor.

The read scope SHALL present the **source before the target**, for either kind. The source is the one an
operator reads first when asking what a pipeline consumes, and the target is already resolved wherever the
control appears.

An aggregate pipeline declares its input outright and SHALL present it as a plain selection with no
follow-or-pin choice — ordered the same way, above the target.

#### Scenario: A following pipeline keeps following after an unrelated edit

- **WHEN** an enrichment pipeline whose input equals its target's `source_table` is opened, edited elsewhere,
  and saved
- **THEN** the request omits the input

#### Scenario: A pinned pipeline stays pinned

- **WHEN** an enrichment pipeline whose input differs from its target's `source_table` is saved
- **THEN** the request carries that input

#### Scenario: The inference is visible and correctable

- **WHEN** an enrichment pipeline is opened
- **THEN** one read-source selection shows whether it is following or pinned
- **AND** the followed table is named on the following entry
- **AND** choosing a table from the same list pins it

#### Scenario: Following sends no input, whichever table it resolves to

- **WHEN** the following entry is selected and the pipeline is saved
- **THEN** the request omits the input, rather than sending the followed table's name

#### Scenario: A resolved input equal to the target's source reads as following

- **WHEN** a pipeline that declared no input is opened, and the compiled read resolves that input to the
  target's own `source_table`
- **THEN** the selection shows the following entry rather than that table

#### Scenario: A pinned table the listing does not carry stays selected

- **WHEN** a pipeline pins a table the tables listing does not return
- **THEN** that table remains the selection rather than reading as the following entry

#### Scenario: The source is presented before the target

- **WHEN** an enrichment pipeline's read scope is presented
- **THEN** the source selection appears above the target selection

#### Scenario: An aggregate pipeline declares its input plainly

- **WHEN** an aggregate pipeline is opened
- **THEN** its input is presented as a selection with no follow-or-pin choice
- **AND** that selection appears above the target selection

### Requirement: Unsaved pipeline edits are tracked and discardable

The detail page SHALL track whether the pipeline differs from the one it was loaded with, and SHALL offer
save and discard only while it does. Discarding SHALL restore the loaded pipeline and SHALL require
confirmation, because a discard is unrecoverable.

Comparison SHALL treat an absent member and a member explicitly set to `undefined` as equal, so clearing an
optional field and never having set it do not read as a difference.

#### Scenario: An unedited pipeline offers nothing to save

- **WHEN** a pipeline is opened and not edited
- **THEN** no save or discard action is offered

#### Scenario: Editing offers save and discard

- **WHEN** any editable member is changed
- **THEN** save and discard are offered

#### Scenario: Discard restores the loaded pipeline after confirmation

- **WHEN** discard is chosen and confirmed
- **THEN** every edited member returns to the value the pipeline was loaded with

#### Scenario: Editing back to the original value clears the edited state

- **WHEN** a member is changed and then changed back to its loaded value
- **THEN** save and discard are no longer offered

### Requirement: Saving a pipeline requires full-admin rights

Editing a pipeline is a mutation and SHALL be gated on the same right the console already requires to create
and delete one. A caller without full-admin rights SHALL be able to open and read a pipeline but SHALL NOT be
offered save. The gate SHALL be the same predicate the listing uses, so a caller sees a consistent set of
rights on both screens.

This read-only presentation SHALL be kept even while the service refuses such a caller's read outright. It is
the presentation a read-only caller returns to once read access is restored, and removing it would have to be
built again.

#### Scenario: A caller without full-admin rights cannot save

- **WHEN** a caller lacking full-admin rights opens a pipeline and changes a member
- **THEN** save is not offered

#### Scenario: The detail page and the listing agree

- **WHEN** a caller is not offered pipeline deletion on the listing
- **THEN** that same caller is not offered save on the detail page

### Requirement: The pipeline detail header states the pipeline's status before its name

The pipeline detail header SHALL be composed the way the console's other entity headers are: the
enabled-state badge on its own line **above** the pipeline name, both aligned to the leading edge, and the
header's actions on the name's row at the trailing edge. Status is the first question a pipeline answers — an
operator arriving from the listing is asking whether it is running at all — and a badge trailing the opposite
edge of the header is read last, after the name and after the actions.

The enable/disable control SHALL carry the appearance its consequence warrants. While the pipeline is enabled
the control reads "Disable pipeline" and SHALL be rendered as an outlined danger button, the same treatment
the console gives Delete; while it is disabled it reads "Enable pipeline" and SHALL be rendered as a primary
button. The control SHALL carry no icon: the trash glyph that accompanies Delete would misstate a reversible
switch as a removal, and no other glyph distinguishes the two directions better than the label already does.

The control SHALL be offered only to a full admin, SHALL confirm before it applies, and SHALL be withheld
while the pipeline has unsaved edits — stating why, since toggling re-reads the pipeline and would discard
them.

#### Scenario: An enabled pipeline leads with its status

- **WHEN** an enabled pipeline is opened
- **THEN** its enabled badge is presented above the pipeline name at the header's leading edge
- **AND** the control offering to disable it is presented as a danger action

#### Scenario: A disabled pipeline offers enabling as the primary action

- **WHEN** a disabled pipeline is opened
- **THEN** its disabled badge is presented above the pipeline name at the header's leading edge
- **AND** the control offering to enable it is presented as the primary action

#### Scenario: Pending edits withhold the toggle

- **WHEN** the pipeline has unsaved edits
- **THEN** the enable/disable control is not actionable
- **AND** the reason is stated rather than left to be guessed

### Requirement: Six-field cron control for a scheduled trigger

The service checks only whether the trigger's cron is present or absent for the selected trigger kind — it
never parses the expression, at registration or at patch. A syntactically invalid expression is accepted and
fails later where the operator will not be looking. The console is the only guard, so the control SHALL
validate the expression it submits.

The accepted format is **six-field cron** — seconds, minutes, hours, day-of-month, month, day-of-week —
matching every expression the service configures. A five-field expression SHALL be rejected by the control:
it parses as a *different* schedule under a six-field reader, so accepting one silently shifts the schedule
rather than failing.

The control SHALL offer named presets alongside a custom expression. A custom expression SHALL be validated
for its field count before submission, and an invalid expression SHALL block submission with a message naming
the six-field requirement.

This control SHALL be used for an aggregate pipeline's schedule as well, whose trigger kind is always
`schedule`.

#### Scenario: A preset yields a six-field expression

- **WHEN** the user selects a named schedule preset
- **THEN** the value submitted as the trigger's cron has six fields

#### Scenario: A five-field custom expression is rejected

- **WHEN** the user enters a five-field expression
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: A valid custom expression is accepted

- **WHEN** the user enters a well-formed six-field expression
- **THEN** the control accepts it and submission proceeds

#### Scenario: An aggregate pipeline uses the same control

- **WHEN** an aggregate pipeline's schedule is edited
- **THEN** the six-field cron control is presented

### Requirement: Readiness declaration for a group trigger

A `group` trigger requires `ready_when`, and the service rejects the object with HTTP 422 unless at least one
of `signal`, `idle`, or `max_staleness` is present. The reason is behavioural rather than formal: a readiness
declaration satisfying none of them would leave a group perpetually dirty and never ready, so the pipeline
would register successfully and then do nothing.

The console SHALL present the three as **three independently enabled conditions**, each stating in words what
it means rather than naming its wire member, and SHALL require at least one to be enabled before submission.
Disabling a condition SHALL keep what was entered on screen while omitting that member from the request, so
toggling a condition off and on again does not retype it.

- **quiet for** — `idle`, a duration
- **finished by a row** — `signal`, a boolean predicate over the read source's columns, in the same bounded
  grammar as the pipeline's own filter
- **result older than** — `max_staleness`, a duration

It SHALL also accept an optional `cost_ceiling`, constrained to a positive integer and presented apart from
the three conditions: it bounds what a ready group may spend rather than deciding whether the group is ready.

Each duration SHALL be offered as a small set of presets appropriate to that condition, plus a custom entry
whose placeholder states the accepted spelling. The service accepts both the short form and the ISO-8601
form. A seeded value matching neither SHALL be presented verbatim in the custom entry rather than discarded.

A rejection naming a sensitive column in the predicate SHALL be surfaced as an entitlement failure rather
than as a grammar error, because the two carry different remedies.

#### Scenario: A group trigger needs at least one readiness condition

- **WHEN** the trigger kind is `group` and no condition is enabled
- **THEN** submission is blocked with a message that at least one is required

#### Scenario: A disabled condition keeps its value but is not sent

- **WHEN** a duration is entered and its condition is then disabled
- **THEN** the value remains on screen
- **AND** the request carries no such member

#### Scenario: A duration is chosen from presets

- **WHEN** a condition's preset is chosen
- **THEN** the request carries that duration in the service's short form

#### Scenario: A duration is submitted in short form

- **WHEN** a preset of ten minutes is chosen for the quiet-for condition
- **THEN** the request carries `trigger.ready_when.idle` as `"10m"`

#### Scenario: A custom duration states its format

- **WHEN** the custom entry is chosen for a duration
- **THEN** its placeholder states the accepted spelling

#### Scenario: Cost ceiling must be a positive integer

- **WHEN** the user enters zero or a negative cost ceiling
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: An unrecognised duration is preserved verbatim

- **WHEN** a duration is seeded with a value matching neither the short nor the ISO-8601 form
- **THEN** it is presented verbatim in the custom entry
- **AND** the value is not discarded

#### Scenario: An entitlement failure is distinguished from a grammar failure

- **WHEN** the service refuses the readiness predicate because it names a sensitive column
- **THEN** the failure is reported as one of access rather than of expression

### Requirement: A group trigger's grouping key is derived from the target enrichment's grain key

The trigger's `group_by` is a string in the API, but the service accepts exactly one value for an enrichment
pipeline: the target enrichment's own grain key. Anything else is rejected with HTTP 422. The constraint is
physical — an enrichment is keyed on its grain and collapses by it, so grouping by any other column would
pile many groups onto a single row.

The console SHALL therefore **derive** the trigger's `group_by` from the resolved target table's
`grain.grain_key` and present it as a **labelled read-only value** — not as a text input, which reads as a
field someone forgot to enable, and not as a disabled one, which would leave the accessibility tree and stop
the value being readable at all. It SHALL be captioned as the target table's grain key, and re-derived
whenever the target changes.

This grouping key is the trigger's and is distinct from an aggregate pipeline's group keys, which name what
its rows are grouped by. The two SHALL NOT share a control.

#### Scenario: The grouping key is filled from the target's grain key

- **WHEN** the trigger kind is `group` and a target is selected
- **THEN** that table's grain key is presented as a labelled value, with no editable control for it
- **AND** the value is readable rather than removed from the accessibility tree

#### Scenario: Changing the target re-derives the grouping key

- **WHEN** the user changes the target to one with a different grain key
- **THEN** the presented grouping key is the new table's grain key

### Requirement: Member selection for a group trigger

A group trigger may declare how members of a group are chosen: a `prefer_sql` preference, an `order_by`
sequence of column and direction, and a `limit`. `limit` is required whenever member selection is declared at
all, and SHALL be a positive integer no greater than the service's configured group fetch maximum.

The console SHALL present the choice as two states — take every member, or select a few — rather than as an
optional block whose emptiness the operator has to interpret. Taking every member SHALL omit member selection
from the request entirely, leaving the assembly's own default policy in place. Switching to it SHALL keep
what was entered for the selection on screen, so switching back does not retype it.

`prefer_sql` is a **preference, not a filter**: when no member satisfies it, every member becomes a
candidate. The control SHALL say so, because an operator reading it as a filter would expect an empty result
instead.

The ranking SHALL state that the read source's own order is appended last as a tiebreak, so re-assembling an
unchanged group selects the same members. Where the columns carrying that order are known from the resolved
source they MAY be named; where the source has not resolved they SHALL be omitted rather than guessed.

The columns the ranking offers SHALL be the read source's **entity** fields, the same set the inputs editor
binds, so a column of an enrichment on that source can be ranked by.

The maximum SHALL be stated as the service's configured ceiling rather than as a fixed number: it is a
deployment setting, and a deployment configured lower refuses a larger value.

Member selection SHALL be presentable only for a group trigger.

#### Scenario: Taking every member sends no selection

- **WHEN** take-every-member is selected
- **THEN** the saved pipeline omits member selection entirely

#### Scenario: Member selection is omitted when empty

- **WHEN** no member-selection member has been declared
- **THEN** the saved pipeline omits member selection entirely

#### Scenario: Switching back keeps what was entered

- **WHEN** a limit and a ranking are entered, take-every-member is selected, and the selection is chosen again
- **THEN** the limit and ranking are still presented

#### Scenario: Declaring member selection requires a limit

- **WHEN** an order or preference is declared without a limit
- **THEN** the pipeline cannot be saved and the missing limit is reported

#### Scenario: The preference is described as a preference

- **WHEN** the `prefer_sql` control is presented
- **THEN** it states that all members become candidates when none satisfies it

#### Scenario: The tiebreak is stated, and named only when known

- **WHEN** the ranking is presented and the read source has not resolved
- **THEN** the tiebreak is stated without naming its columns

#### Scenario: Member selection is only offered for a group trigger

- **WHEN** the trigger kind is not group
- **THEN** member selection is not presented

### Requirement: A pipeline's SQL predicate fields are presented as bounded expressions

A pipeline admits four SQL predicates: the membership `filter`, the readiness `signal` of a group trigger,
the `prefer_sql` of its member selection, and the `where` of an individual aggregate measure. Each is a
boolean expression in the same bounded grammar over the read source's **entity** — the source with its
enrichments flattened in, which is what the service resolves a predicate against — and none admits a join, a
subquery, or a CTE.

Each SHALL be presented as a multi-line expression input, in a monospaced face, captioned with the source its
columns come from. The console SHALL NOT attempt to validate the expression — the grammar is the service's
and a client-side approximation would reject valid predicates — so an invalid expression SHALL be reported by
surfacing the service's rejection on save.

#### Scenario: A predicate names its source

- **WHEN** a SQL predicate field is presented
- **THEN** it states which table its columns come from

#### Scenario: A measure's predicate uses the same control

- **WHEN** a measure's `where` is edited
- **THEN** it is presented as a bounded SQL expression naming the input table

#### Scenario: An invalid predicate is reported by the service

- **WHEN** a pipeline carrying an unparseable predicate is saved
- **THEN** the service's rejection message is surfaced
- **AND** the edited values remain in the form

### Requirement: A group key is a column or a truncated timestamp, optionally aliased

Each of an aggregate pipeline's group keys names either a column of the input or a **truncation** of a
date-or-timestamp column to an `hour`, `day`, `week` or `month`. Either form may carry an alias naming the
resulting column in the target.

The console SHALL collect group keys as an ordered repeater whose every row offers that choice. A truncation
SHALL offer only the units the chosen column's type admits, so a truncation the service would refuse cannot
be built. Order SHALL be preserved as entered, because the service reads the keys in order.

An alias SHALL be optional and, when absent, the console SHALL show the column name that will be used
instead of leaving the row looking incomplete.

#### Scenario: A plain column is a group key

- **WHEN** the user adds a group key and selects a column
- **THEN** the saved pipeline carries that column as a group key

#### Scenario: A truncation offers only the units its column admits

- **WHEN** the user selects a truncation on a column that is not a date or timestamp
- **THEN** no truncation unit is offered and the choice is reported as unavailable

#### Scenario: An alias renames the resulting column

- **WHEN** the user gives a group key an alias
- **THEN** the saved pipeline carries that alias

#### Scenario: An unaliased key shows what it will be called

- **WHEN** a group key carries no alias
- **THEN** the row states the column name the target will use

#### Scenario: Order is preserved

- **WHEN** the user reorders the group keys
- **THEN** the saved pipeline carries them in the presented order

### Requirement: Measures are authored from the served function catalog

A measure names an aggregate to compute over each group: a **name** for the resulting column, a **function**,
the **column** it reads, and two optional qualifiers — a `where` choosing which rows it sees, and `distinct`
aggregating the group's distinct values rather than its rows.

A measure is a mapping from a source column to a target column, and the console SHALL present it as one: its
**name** SHALL be chosen from the target table's columns rather than typed free-hand, since the name is the
target column the measure writes and a typo is otherwise caught only by the service.

The column the measure reads SHALL default to the measure's own name when left unset — except for a
column-less count — and the control SHALL state that default rather than leaving the field looking
incomplete. The two names coincide for a minority of measures, so the control SHALL NOT be withheld.

The console SHALL hold no function knowledge of its own. The function list SHALL be derived from the catalog
the service already serves at `GET /v1/queries/functions`, narrowed to the functions a measure can express:

- the catalog's **aggregate** group, since a measure is an aggregate; and
- functions requiring **no more than one** argument, because a measure carries one column and nothing else.
  An aggregate declaring two required arguments cannot be expressed as a measure and the service refuses it,
  so offering it would build a declaration that fails on every run for a reason recorded only in its state.

A catalog description runs from one line to a full paragraph, so it SHALL be revealed on hovering the option
rather than rendered beneath it: rendered inline it makes the list unscannable.

`distinct` SHALL be offered only for a function the catalog marks as supporting it, and SHALL require a
column, since a column-less count is a row count with no values to deduplicate.

The column control SHALL be withheld only for a function that declares **no argument at all** — never for
one whose argument is merely optional. `count` declares one optional argument: called bare it is a row
count, and called with a column it counts that column's values, which is the only thing `distinct` has to
deduplicate. Reading "optional" as "takes no column" withholds the control that every rollup's
`count(distinct …)` measure needs, and leaves such a measure blocked with nothing on screen to fix it.

A rollup declares measures in numbers that make a per-measure block unreadable, so the list SHALL be
presented compactly: field labels stated once for the list rather than on every row, the `where` predicate as
a single line that grows when focused, and the note about which source the columns come from stated once
below the list.

A function no longer present in the catalog SHALL be reported on the row rather than silently cleared.

#### Scenario: A measure's name is chosen from the target's columns

- **WHEN** a measure is added
- **THEN** its name is chosen from the target table's columns

#### Scenario: A measure needs a name

- **WHEN** a measure is added without a name
- **THEN** submission is blocked and the missing name is reported

#### Scenario: An unset column states the default

- **WHEN** a function taking a column is chosen and no column is selected
- **THEN** the control states that the measure's own name is used

#### Scenario: Only expressible aggregates are offered

- **WHEN** the function control is opened
- **THEN** it offers the catalog's aggregate functions
- **AND** it does not offer a function requiring more than one argument

#### Scenario: A function's description is revealed on hover

- **WHEN** the function control is opened
- **THEN** each option presents its signature
- **AND** its description is revealed on hovering that option rather than rendered beneath it

#### Scenario: Distinct is offered only where the catalog allows it

- **WHEN** a function the catalog does not mark as supporting distinct is chosen
- **THEN** no distinct qualifier is offered

#### Scenario: A row count takes no column

- **WHEN** a function whose argument is optional is chosen and no column is given
- **THEN** the measure is accepted and the saved pipeline carries no column for it

#### Scenario: An optional argument still offers a column

- **WHEN** a function whose argument is optional is chosen
- **THEN** a column control is offered
- **AND** choosing a column and `distinct` together is accepted

#### Scenario: Distinct requires a column

- **WHEN** distinct is chosen and no column is given
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: The list stays compact as it grows

- **WHEN** a pipeline declaring many measures is opened
- **THEN** each measure occupies one row
- **AND** the field labels and the source note are stated once for the list

#### Scenario: An unknown function is reported rather than cleared

- **WHEN** a measure names a function the served catalog no longer carries
- **THEN** that row is reported as unresolvable
- **AND** the stranded value remains visible

### Requirement: The pipeline detail page can be edited as JSON instead of as fields

The pipeline detail page SHALL offer a JSON editor as an alternative to its fields: a toggle in the identity
row, and the pipeline as one JSON document in place of everything below that row. The editor SHALL be offered
for **both kinds**, since the document is the declaration and the declaration is what differs.

The editor and the fields SHALL edit **one** draft. Enabling the editor SHALL seed it from the pipeline on
screen, and what the document holds at submission SHALL be what is submitted.

Submitting SHALL go through the same path either way — the same control and the same request — so the same
document produces the same request no matter which way it was submitted. The editor SHALL NOT introduce a
second write path.

The toggle SHALL be offered to every caller, and the document SHALL be read-only for a caller who may not
save, matching the gating the fields already apply. Reading a pipeline as JSON is useful without the rights
to change it, and it is the only way to read the members no control presents.

#### Scenario: Enabling the editor replaces the fields with JSON

- **WHEN** the caller enables the JSON editor
- **THEN** the pipeline is presented as one block of JSON
- **AND** the fields are no longer presented
- **AND** the pipeline name remains

#### Scenario: The document is seeded from the pipeline on screen

- **WHEN** the caller enables the JSON editor
- **THEN** the document holds that pipeline's values

#### Scenario: The editor is offered for an aggregate pipeline

- **WHEN** an aggregate pipeline is opened and the caller enables the JSON editor
- **THEN** its group keys, measures and freshness are presented in the document

#### Scenario: A caller who may not save may still read the JSON

- **WHEN** a caller without saving rights enables the JSON editor
- **THEN** the document is presented
- **AND** it cannot be edited

#### Scenario: A member no control presents is readable and changeable

- **WHEN** a pipeline carrying a member the fields do not present is opened as JSON, that member is changed,
  and the pipeline is saved
- **THEN** the request carries the changed value

### Requirement: The pipeline document is the request, not the form's working state

The document SHALL present the pipeline as it will be sent, not the form's intermediate state. Because the
save sends a complete declaration, the request body and the pipeline are the same thing, and showing anything
else would mean the caller edits one document and the console sends another.

Three consequences SHALL be accepted rather than hidden. An enrichment pipeline that follows its target
SHALL appear without its input, since omitting it is how following is expressed. Members left empty SHALL be
absent rather than present and blank. Members the service derives and refuses on write — the runtime state
among them — SHALL be absent from the document, because the service now rejects an unrecognised member rather
than dropping it.

Entering the editor SHALL seed the document from the pipeline as the fields currently hold it, and the
document SHALL then be the caller's to edit: the console SHALL NOT rewrite it while they type. Re-deriving it
on every accepted keystroke would replace the buffer with a re-normalized request under the cursor, which
among other things makes a trailing space impossible to type. The document SHALL be re-seeded only when the
pipeline underneath it is replaced — a discard, or a save that re-reads it.

#### Scenario: A pipeline that follows its target shows no input

- **WHEN** an enrichment pipeline that follows its target is opened as JSON
- **THEN** the document carries no input

#### Scenario: Derived members are absent from the document

- **WHEN** a pipeline is opened as JSON
- **THEN** the document carries no `state`, `generation`, `created_at` or `updated_at`

#### Scenario: The document is not rewritten while the caller types

- **WHEN** the caller edits the document so that it still parses
- **THEN** the text stays exactly as they typed it, trailing spaces and all
- **AND** their cursor position and undo history are preserved

#### Scenario: Discarding re-seeds the document from the stored pipeline

- **WHEN** the caller discards while the editor is open
- **THEN** the document holds the pipeline as stored

### Requirement: The pipeline JSON editor takes the whole view, and an unsaved change closes the way out

While the JSON editor is open, the page SHALL present the document and nothing else below the identity row:
the read-only facts, the fields, the runtime state, the status badge, and the enable/disable action SHALL all
be withdrawn. A caller who wants any of them SHALL leave the editor to reach it.

Once the draft differs from the pipeline on screen, the toggle SHALL NOT be offered either: the identity row
offers Discard and Save in its place. Leaving the editor is therefore discarding or saving, not toggling
back, which is what keeps a pending change from being parked behind a presentation the caller switched away
from.

Because the enable/disable action is absent in this mode, it needs no new guard. Its existing refusal while
edits are pending SHALL be unchanged.

Discarding SHALL restore the pipeline as stored and SHALL bring the toggle back.

#### Scenario: The rest of the page is withdrawn while the editor is open

- **WHEN** the caller enables the JSON editor
- **THEN** the read-only facts and the runtime state are no longer presented
- **AND** the enable/disable action is no longer offered

#### Scenario: Editing the document withdraws the toggle

- **WHEN** the caller edits the document so that it differs from the pipeline on screen
- **THEN** the toggle is no longer offered
- **AND** Discard and Save are offered instead

#### Scenario: Discarding restores the stored pipeline and the toggle

- **WHEN** the caller discards while the JSON editor is open
- **THEN** the document holds the pipeline as stored
- **AND** the toggle is offered again

### Requirement: Removing a member from the document erases it from the pipeline

A save sends a complete declaration, so a member the request omits is set to nothing rather than left alone.
The editor therefore makes erasure a single keystroke, and this SHALL be treated as the meaning of the
document rather than as a mistake to intercept.

The console SHALL NOT prompt before a save that drops a member, and SHALL NOT present a comparison against
the stored pipeline. The operator is editing the request body and the page presents it as exactly that; a
guard here would be a check the fields themselves do not perform, and would put this editor out of step with
every other one in the console.

The sharpest case SHALL be understood as specified behaviour: deleting an output from `transform.outputs`
stops that target column being written, with no error, because the service accepts that request — the
column keeps whatever the last run wrote. Required members are the exception — the service rejects a request
omitting one, and that refusal surfaces as any other does.

#### Scenario: A member deleted from the document is erased from the pipeline

- **WHEN** the caller deletes an optional member from the document and saves
- **THEN** the saved pipeline no longer carries that member
- **AND** no confirmation was presented before the save

#### Scenario: Deleting an output stops that column being written

- **WHEN** the caller deletes one entry from `transform.outputs` and saves
- **THEN** the save succeeds and the pipeline no longer declares that output
- **AND** a document still carrying `evaluator_version` is refused by the service, which recognises the
  member on no kind

#### Scenario: Omitting a required member is refused by the service

- **WHEN** the caller deletes a member the service requires and saves
- **THEN** the service's own message is reported
- **AND** the pipeline is unchanged

### Requirement: A pipeline document that does not parse blocks the save and reports where

While the JSON editor is open, the form's own checks — including the check that no other pipeline already
targets this table — SHALL NOT block the save. The one exception is the trigger's grouping key: it is rebuilt
from the resolved target rather than carried from the document, so saving a group-triggered pipeline before
that resolves would send no grouping key. That check SHALL keep applying in both presentations. The document
is the input, and a document those controls could not have produced is not thereby wrong; the service's
refusal is what surfaces instead.

Three service refusals SHALL therefore be expected here rather than pre-empted: a member belonging to the
other kind, refused with HTTP 422; a member the service does not recognise at all, refused with HTTP 400
naming the field; and a changed `name` or `kind`, refused with HTTP 422 because both are immutable. Each
SHALL surface as the service worded it.

JSON that does not parse SHALL block the save, and each parse error SHALL be reported with the line it
occurred on. The Save control SHALL remain enabled and refuse on use rather than being disabled — a caller
who has broken the document is better served by being told where than by a control that has gone quiet.

Text that does not parse reaches no draft, so the controls SHALL be offered on the strength of the parse
failure itself and not only on a difference from the stored pipeline. Otherwise a caller whose **first** edit
breaks the document is offered neither a Save to be told what is wrong nor a Discard to back out of it. The
controls SHALL withdraw again once the document parses.

#### Scenario: Unparseable JSON is reported per line and nothing is saved

- **WHEN** the caller saves a document that does not parse
- **THEN** each parse error is reported with its line number
- **AND** the pipeline is unchanged

#### Scenario: Breaking the document before changing anything still offers a way out

- **WHEN** the caller's first edit to the document leaves it unparseable
- **THEN** Discard and Save are offered
- **AND** the Save control is offered as enabled

#### Scenario: A group-triggered pipeline cannot be saved before its grain key resolves

- **WHEN** a group-triggered pipeline's target has not resolved, so the grain key is not yet known
- **THEN** saving is refused by the console rather than sending a request without the grouping key

#### Scenario: A member of the other kind is refused by the service

- **WHEN** the caller adds a measure to an enrichment pipeline's document and saves
- **THEN** the save is not blocked by the console
- **AND** the service's own message is reported

#### Scenario: A misspelled member is refused by name

- **WHEN** the caller misspells a member name and saves
- **THEN** the service's message naming the unrecognised field is reported
- **AND** the pipeline is unchanged

#### Scenario: A changed name is refused

- **WHEN** the caller changes `name` in the document and saves
- **THEN** the service's refusal is reported
- **AND** the pipeline is unchanged

#### Scenario: A target another pipeline already uses is refused by the service

- **WHEN** the caller sets `target` to one another pipeline already binds and saves
- **THEN** the save is not blocked by the console
- **AND** the service's own message is reported

#### Scenario: A value of the wrong type does not break the page

- **WHEN** the caller sets a member to a value of a type the service does not accept, such as a name holding
  a number
- **THEN** the page continues to present the document and the controls
- **AND** saving reports the service's refusal rather than failing in the console

### Requirement: Pipeline detail view is organized into Properties and Audit tabs

The pipeline detail view (`/pipelines/{name}`) SHALL present its content under a horizontal tab strip with
exactly two tabs, **Properties** and **Audit**, in that order. `Properties` SHALL be the selected tab when
the view is first opened.

The identity row — the enabled-state badge, the pipeline name, its copy control, the `Discard` / `Save`
change bar, the enable/disable control and the JSON editor toggle — SHALL render **above** the tab strip
and SHALL be unchanged by this reorganization: the same controls, in the same order, under the same
permission and pending-edit conditions the "The pipeline detail header states the pipeline's status before
its name" requirement already states, presented whichever tab is selected. Everything the frame presents
below that row — the read-only facts, the read scope, the trigger, the kind's transform section and the
runtime state — SHALL render inside the **Properties** tab where a tab strip is rendered, and directly
beneath the identity row where it is not.

Selecting the `Audit` tab SHALL NOT discard a pending edit. The draft the fields and the document share
SHALL survive a tab switch, and the change bar SHALL stay offered from either tab, so a caller who reads
the history mid-edit does not lose the edit by reading it.

The JSON editor and the tab strip SHALL NOT be presented together. Enabling the editor withdraws the tab
strip along with everything else below the identity row, as "The pipeline JSON editor takes the whole view,
and an unsaved change closes the way out" already requires, and leaving the editor SHALL restore the strip
with `Properties` selected. The toggle itself is unchanged and stays offered to every caller.

The tab strip SHALL be rendered only when `featureFlags.analyticsEnabled` is true. With analytics disabled
the detail view SHALL render the Properties content directly, with no tab strip and no Audit tab, and SHALL
issue no request to the analytics activity feed. The route itself is not guarded on that flag —
`/pipelines/{name}` guards only on `isAnalyticsForbidden()`, which is an authorization check against the
analytics service and not the client feature flag, so a bookmarked or pasted link still opens this view on
an analytics-disabled installation and the tab condition is what keeps it from issuing an activity request.

There SHALL be **no** pipeline-status condition on the tab, unlike the table detail view's, which
additionally requires an `ACTIVE` table. A pipeline has no registration lifecycle to mirror one: the service
creates it whole in a single `POST /v1/pipelines`, so every registered pipeline already carries at least a
`Create` activity. `enabled` is a pipeline's runtime toggle and not a registration state — a disabled
pipeline is fully registered, and disabling or enabling it is itself an audited `Update` — so the Audit tab
SHALL be offered on a disabled pipeline exactly as on an enabled one.

The Audit tab SHALL require no permission beyond the one that already allows reading the pipeline. It SHALL
NOT be gated on full-admin rights, which the save and the enable/disable control are.

#### Scenario: Properties is the selected tab when the pipeline detail view opens

- **WHEN** the user opens the detail view of a registered pipeline
- **THEN** a tab strip showing `Properties` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only facts, the trigger, the kind's transform section and the runtime state are shown
  beneath it

#### Scenario: The identity row and its actions stay above the tab strip

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the enabled-state badge, the pipeline name, its copy control and the enable/disable control
  remain rendered above the tab strip, unchanged

#### Scenario: The Audit tab is offered on a disabled pipeline

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** the user opens its detail view
- **THEN** the tab strip is rendered and the `Audit` tab is present and selectable

#### Scenario: The Audit tab needs no permission beyond reading the pipeline

- **GIVEN** a caller who is not a full admin, and who is therefore offered no save and no
  enable/disable control
- **WHEN** the user opens the pipeline detail view
- **THEN** the `Audit` tab is present and selectable

#### Scenario: A pending field edit survives a switch to the Audit tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** the user selects `Audit` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: The JSON editor and the tab strip are not presented together

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the caller enables the JSON editor
- **THEN** the pipeline is presented as one JSON document
- **AND** no tab strip is rendered
- **AND** turning the editor off again renders the tab strip with `Properties` selected

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **WHEN** the user reaches `/pipelines/{name}` by a direct link
- **THEN** no tab strip and no `Audit` tab are rendered
- **AND** the read-only facts, the trigger, the transform section and the runtime state are shown directly
- **AND** no request is issued to the analytics activity feed

### Requirement: Pipeline Audit tab lists the pipeline's own activities

The global Activity Audit page's own `Analytics` view — the third option in its `View` selector, its
fetcher, its rollback absence, and how one of its rows resolves and renders on the audit detail page — is
specified by the `activity-audit-analytics-view` capability. This requirement covers only the tab on the
pipeline detail view.

The **Audit** tab SHALL render the shared entity audit surface with the Activities list as its only sub-tab
— no Dashboard, Traces, or Conversations sub-tab, which report DIAL request telemetry keyed by a deployment
name and have no meaning for a pipeline — and with no view-type selector.

The list SHALL be sourced from the analytics backend (`POST /v1/activities` at `DIAL_ANALYTICS_API_URL`) and
SHALL be narrowed to the pipeline being viewed by an **exact** pair: a `resourceType` filter with the `eq`
operator and the value `Pipeline`, and a `resourceId` filter with the `eq` operator and the pipeline's name.
A `Pipeline` resource identifier is the pipeline's name and is never compound — the analytics backend
records no child resource type under a pipeline, unlike a table and its columns — so the tab SHALL NOT
widen the query to a substring match and SHALL NOT narrow the answer client-side. Every activity the feed
answers with belongs to this pipeline and SHALL be displayed.

Because the list carries exactly one resource type and one resource identifier, the tab SHALL present the
single-entity column set the `Config` and `Deployments` entity Audit tabs already present: `Resource type`
and `Resource identifier` SHALL NOT be rendered — two columns whose value is the same on every row of this
list — and neither SHALL a row-expander column nor the `Version` column. `Activity type`, `Time`,
`Initiated`, `Activity ID` and `Parent ID` SHALL be rendered, with `Time` keeping its default descending
sort, and rows SHALL be listed flat, newest first.

The activities the tab lists are the ones the analytics backend records against the pipeline: its own
`Create`, `Update` and `Delete`; the `Update` produced when a bulk generation bump repoints its read source,
which carries the source table's `Table` `Update` activity as its `parentActivityId`; and the `Delete`
recorded when the pipeline's target table is deleted, which carries no parent at all. A parent identifier
SHALL be shown in the `Parent ID` cell as the backend supplied it and SHALL NOT be resolved or expanded
here.

The suppression the `Analytics` view applies to a deleted table's children
(`activity-audit-analytics-view`, *A child activity of a deleted table is not listed*) SHALL NOT remove any
row from this tab, and SHALL NOT be widened to make it do so. A pipeline activity's only parent is a `Table`
`Update`, never a `Table` `Delete`; the `Delete` recorded by its target table's deletion carries no parent,
so it is never a candidate; and the rule leaves a row listed when its parent cannot be resolved.

The tab SHALL offer the same time-period filter the shared entity audit surface already renders for other
entities, initialized to the default period, and changing it SHALL re-request the list for the new range.
The row action menu SHALL offer `Open in a new tab` and SHALL NOT offer `Rollback` — the analytics backend
exposes no endpoint that writes an audit record, revision, or snapshot. A failed request SHALL leave the
grid in its existing error/empty state and SHALL NOT raise a toast notification; this surface is read-only
and performs no action a success or error notification would describe.

#### Scenario: Request is narrowed to the pipeline by an exact resource pair

- **WHEN** the Audit tab is opened on the pipeline named `daily_rollup` and the grid requests its first
  row block
- **THEN** the analytics activity feed is requested with a `resourceType` filter
  `{ operator: "eq", value: "Pipeline" }` and a `resourceId` filter
  `{ operator: "eq", value: "daily_rollup" }`
- **AND** no `co` (substring) filter and no `in` filter over resource types is sent
- **AND** the request is not sent to the admin backend or the deployment-manager backend

#### Scenario: Every activity the feed answers with is listed

- **GIVEN** the Audit tab is open on the pipeline named `daily_rollup`
- **AND** the feed answers with several `Pipeline` activities
- **WHEN** the grid renders the block
- **THEN** every one of them is displayed
- **AND** no row is dropped by a client-side resource-identifier check

#### Scenario: A newly registered pipeline lists its Create activity

- **GIVEN** a pipeline registered through `POST /v1/pipelines` and not edited since
- **WHEN** the user opens its Audit tab
- **THEN** a row whose activity type is `Create` is displayed for it

#### Scenario: The tab presents no resource-type or resource-identifier column

- **WHEN** the user selects the `Audit` tab on a pipeline
- **THEN** the grid renders neither a `Resource type` nor a `Resource identifier` column
- **AND** it renders neither a row-expander column nor a `Version` column
- **AND** it renders the `Activity type`, `Time`, `Initiated`, `Activity ID` and `Parent ID` columns

#### Scenario: A bulk-bumped update states the parent activity the backend supplied

- **GIVEN** the Audit tab is open on a pipeline whose read source was repointed by a bulk generation bump
- **AND** the feed answers that `Update` activity with the source table's activity identifier as its
  `parentActivityId`
- **WHEN** the grid renders the block
- **THEN** that row is displayed at the top level
- **AND** its `Parent ID` cell shows the identifier the backend supplied

#### Scenario: A pipeline delete recorded by its target table's deletion is listed

- **GIVEN** the feed answers with a `Pipeline` `Delete` activity carrying no `parentActivityId`
- **WHEN** the grid renders the block
- **THEN** that row is displayed
- **AND** the deleted-table child suppression drops no row of this tab

#### Scenario: Pipeline Audit tab renders only the Activities sub-tab

- **WHEN** the user selects the `Audit` tab on a pipeline
- **THEN** the sub-tab rail lists `Activities` and nothing else
- **AND** no `Config / Deployments / Analytics` view-type dropdown is rendered

#### Scenario: No rollback action is offered on a pipeline activity

- **WHEN** the user opens the row action menu on any row in the pipeline Audit tab
- **THEN** the menu offers `Open in a new tab`
- **AND** the menu does not offer `Rollback`

#### Scenario: Pipeline activity row click opens the global audit detail page

- **GIVEN** the pipeline Audit tab lists an activity whose `activityId` is `abc-123`
- **WHEN** the user clicks that row outside the action menu
- **THEN** the browser opens `/activity-audit/abc-123` in a new tab, as the shared audit list already does
  for every other view
- **AND** no `/pipelines/{name}/{activityId}` URL is requested

#### Scenario: Pipeline with no recorded history

- **GIVEN** a pipeline for which the analytics activity feed returns zero rows
- **WHEN** the user opens the Audit tab
- **THEN** the grid shows its existing empty state, with no error and no notification
- **AND** the tab remains usable and the user can navigate away normally

#### Scenario: Changing the time period re-requests the pipeline's list

- **GIVEN** the pipeline Audit tab is open
- **WHEN** the user changes the time-period filter
- **THEN** the next request to the analytics activity feed carries the updated `epochTimestampMs` `ge` and
  `le` filters

### Requirement: A pipeline read asks only for a projection the service will serve

A pipeline read answers with one of two projections, selected by a `view` query parameter: the authored
declaration, which is what the service returns when the parameter is absent, or the compiled form, which
additionally carries the composed `response_schema`, the grain key, the version column, the derived output
mapping and the resolved read source. Both projections carry the authored `transform`; the compiled one
inlines no evaluator object, which the service no longer serves.

The compiled projection resolves for the **enrichment kind alone**, and the service refuses it
elsewhere rather than answering the declaration under the compiled name:

- a listing carrying the compiled view that is **not** narrowed to the enrichment kind is refused as a
  bad request;
- a single read carrying the compiled view for a pipeline of any other kind is refused as a validation
  failure.

The console SHALL therefore name the compiled view only where it is served:

- The **listing** SHALL name no projection, taking the service's default declaration for every kind in
  one request. Every member the grid presents — the declared inputs and the transform's type — is carried
  by that projection.
- A **single pipeline read** SHALL take the declaration first and SHALL ask for the compiled projection
  only once that answer names the enrichment kind. The kind is not known before the first answer, so
  the projection is chosen from it rather than assumed.
- A failed compiled read SHALL be reported as the failure it is, and SHALL NOT be answered with the
  declaration in its place. The detail page presents an absent grain key or version column as "not
  set", which for an enrichment pipeline states something false rather than something missing.
- **The one exception is a declaration the service cannot compile at all**, which it refuses as a
  validation failure naming the members it lacks. That is an ordinary state — a pipeline is registered
  before it is declared — and the authored projection is the whole of what such a pipeline has, so the
  read SHALL serve it. Reporting the refusal would make the page the author has to finish the
  declaration on unreachable, which is the page the console sends them to.

The compiled projection remains a superset of the authored one and is still what seeds an edit of an
enrichment pipeline. The one fact it does not preserve is whether a read source was declared or
inherited from the target's parent: both appear as a resolved input. That distinction SHALL continue to
be recovered from the target table rather than from the projection.

#### Scenario: An incomplete declaration is served as authored

- **WHEN** an enrichment pipeline whose declaration the service cannot compile is opened
- **THEN** the authored projection is presented rather than a failed read
- **AND** the members the compiled projection would have resolved read as not set

#### Scenario: The listing names no projection

- **WHEN** the pipelines listing is fetched
- **THEN** the request carries no view parameter
- **AND** pipelines of every kind are returned in that one request

#### Scenario: An enrichment pipeline is read twice

- **WHEN** a pipeline is opened and the declaration names the enrichment kind
- **THEN** the compiled projection is requested for it
- **AND** the grain key, version column and composed `response_schema` are presented from that projection

#### Scenario: A pipeline of another kind is read once

- **WHEN** a pipeline is opened and the declaration names a kind other than enrichment
- **THEN** no compiled projection is requested
- **AND** the pipeline is presented from the declaration

#### Scenario: A refused compiled read is reported, not hidden

- **WHEN** the declaration names the enrichment kind and the compiled read then fails
- **THEN** the failure is surfaced
- **AND** the declaration is not presented in its place

### Requirement: An enrichment pipeline's execution knobs are grouped under Advanced

An enrichment pipeline carries five execution knobs the runner applies: how often it scans, how many
rows one scan may claim, how many rows it evaluates per call, a per-minute model-call ceiling, and the
fraction of eligible rows to evaluate. They are hints to the runner rather than part of the transform,
so the console SHALL present them together in one collapsible **Advanced** block placed last in the
section, after the members that describe what the pipeline does.

An empty knob SHALL be omitted from the saved pipeline rather than sent as a zero: an omitted knob means
the runner's own configured default, which a zero does not.

The sample fraction SHALL be validated by the console as strictly greater than zero and at most one.
Zero is refused by the service, which names disabling the pipeline as the way to express evaluating
nothing, and a value above one is refused rather than read as a percentage. This is the one knob the
console validates; the others it SHALL present without imposing constraints the service does not.

These members belong to the enrichment kind and SHALL NOT be presented for an aggregate pipeline.

#### Scenario: The knobs are grouped and placed last

- **WHEN** an enrichment pipeline is opened
- **THEN** the five knobs are presented together in a collapsible block at the end of the section

#### Scenario: A cleared knob is omitted, not zeroed

- **WHEN** a numeric knob is cleared
- **THEN** the saved pipeline omits that member

#### Scenario: A sample fraction of zero is refused

- **WHEN** zero is entered as the sample fraction
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: A sample fraction above one is refused

- **WHEN** a value above one is entered as the sample fraction
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: An aggregate pipeline presents no execution knobs

- **WHEN** an aggregate pipeline is opened
- **THEN** none of these knobs is presented

### Requirement: The aggregate section presents group keys and measures

An aggregate pipeline's transform is a pair: what its rows are grouped by, and what is computed for each
group. The console SHALL present both, and SHALL present no freshness control — the service accepts no
such member.

At least one measure SHALL be required before an aggregate pipeline can be submitted: a rollup that
computes nothing has no meaning to fall back on.

Group keys SHALL NOT be required. When none is declared the service derives them from the target's
ordering key, provided each key is a column of the input under the same name, and echoes the derived
keys back expanded. The section SHALL state that an empty list means derivation from the target rather
than presenting the emptiness as an omission.

#### Scenario: The two parts are presented together

- **WHEN** an aggregate pipeline is opened
- **THEN** its group keys and measures are presented

#### Scenario: No freshness control is presented

- **WHEN** an aggregate pipeline is opened
- **THEN** no freshness mode is offered

#### Scenario: Group keys may be left empty

- **WHEN** an aggregate pipeline is submitted with no group key and at least one measure
- **THEN** submission is offered
- **AND** the section states that the keys are derived from the target

#### Scenario: A measure is still required

- **WHEN** an aggregate pipeline is submitted with no measure
- **THEN** submission is blocked and the missing part is named

### Requirement: The create modal registers a pipeline and leaves the declaration to its page

Registration takes **name, kind and target** and nothing else. The service accepts those three alone,
stores the pipeline disabled, and runs no kind gate on the write, so the modal SHALL collect exactly them.

`target` SHALL stay required for both kinds. It is the input to every later authoring step — an aggregate's
group keys derive from its `ordering_key`, an enrichment's outputs are keyed by its column names — so a
pipeline without one can populate no form; it is also what the service keys the row's cleanup on.

**Name** and **kind** SHALL be presented first, kind **preselected** to the first kind: an unchosen pair of
radios reads as a form waiting for something it never names. Kind SHALL remain a choice here because it is
immutable afterwards and because it selects which tables the target list offers — `enrichment` for an
enrichment pipeline, `source` for an aggregate.

- **name** — validated against the service's identity grammar, lower-case alphanumerics with hyphens and
  underscores, starting with a letter and no longer than 64 characters. Uniqueness is the service's.
- **kind** — `enrich` or `aggregate`.
- **target** — selected from tables of the kind's type, excluding those another pipeline already writes.

No other member SHALL be collected: not the transform and its type, model, template or outputs; not the
trigger kind or its branch; not inputs, measures, read scope or execution knobs. Each is edited on the
pipeline's own page, which presents all of them against a resolved target. A registration form that
collects what the author may not know yet is the one-shot form this change removes.

The modal SHALL send no `enabled` member. The service defaults it to `false` for either kind, and an
aggregate is stored disabled whatever the caller asks, so both kinds still register not running.

The modal SHALL be mounted only while open, so closing discards its state without a manual reset.

On success the modal SHALL close, show a success notification, and refresh the listing. The console SHALL
NOT navigate to the new pipeline's page on its own.

#### Scenario: Registration collects three fields

- **WHEN** the create modal is opened
- **THEN** it presents the name, the kind and the target, in that order, and no other field
- **AND** the first kind is selected

#### Scenario: The declaration is left to the detail page

- **WHEN** the create modal is opened with either kind selected
- **THEN** it offers no transform, trigger, inputs, measures, read scope or execution knobs

#### Scenario: The target list follows the selected kind

- **WHEN** the kind is switched between enrichment and aggregate
- **THEN** the target list offers enrichment tables for the first and source tables for the second

#### Scenario: Registration needs all three

- **WHEN** any of name, kind or target is unset
- **THEN** submission is blocked

#### Scenario: A name outside the identity grammar is refused

- **WHEN** the user enters a name carrying an upper-case letter or a leading digit
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: Both kinds are registered not running

- **WHEN** a pipeline of either kind is registered
- **THEN** no enabled choice was collected and the request carries no `enabled` member
- **AND** the created pipeline is disabled

#### Scenario: Modal state is discarded on close

- **WHEN** the user opens the modal, edits fields, and closes it
- **THEN** re-opening the modal shows a fresh, empty form

#### Scenario: Successful creation refreshes the listing

- **WHEN** creation succeeds
- **THEN** the modal closes, a success notification is shown, and the new pipeline appears in the listing

### Requirement: The JSON document is the pipeline as the service serves it

The detail page's JSON editor SHALL present the pipeline **as read**, with nothing removed: the members
the service assigns (`generation`, `created_at`, `updated_at`, `state`) and the ones the compiled
projection resolves (`outputs`, `grain_key`, `version_column`, `response_schema`) included. The document is
the only place those are readable; a document that has been tidied down to what a save would send reports a
pipeline that is not the one stored.

What may be **sent** is decided at submission: assembling the request drops the resolved and assigned
members, so nothing has to be hidden at presentation to keep the request valid. The service refuses an
unrecognized member in a request body outright, which is why the document and the request cannot be the
same object. The authored `transform` is **not** among the dropped members — it is a declaration member and
is sent as edited.

Entering the editor is barred while anything is unsaved, so the document it opens on is also the draft.

#### Scenario: The document carries the members the service assigns

- **WHEN** a pipeline is opened as JSON
- **THEN** the document carries its `generation` and its runtime state

#### Scenario: The document carries what the compiled projection resolved

- **WHEN** an enrichment pipeline whose outputs the service resolved is opened as JSON
- **THEN** the document carries those outputs and the composed `response_schema`

#### Scenario: The assigned members are not sent back

- **WHEN** such a document is edited and the pipeline is saved
- **THEN** the request carries neither the assigned nor the resolved members
- **AND** it carries the authored `transform` as edited

### Requirement: An enrichment pipeline carries its transform, and no evaluator reference

An enrichment pipeline declares what used to be an evaluator as a nested **`transform`** block on its own
declaration: `type` (`llm` or `sql`), `model`, `preset`, `params`, `request_template`, `inputs` and
`outputs`. The console SHALL author it there and SHALL NOT offer an evaluator selection, a version pin, or
any control that reads or writes `evaluator_name` or `evaluator_version` — both belong to no kind on the
service and are refused at the binding with HTTP 400 on either kind.

The block SHALL be sent **nested**. Its members are enrich-only and are cross-kind-rejected member by
member (`transform.request_template` and the rest), so an aggregate declaration SHALL carry no member of it.

The member set the console presents SHALL follow the transform's `type`, which the declaration itself
carries — so it is known without resolving anything:

- **`sql`** — `preset`, `model`, `params`, `request_template` and `inputs` SHALL NOT be presented at all:
  no section, no label, no placeholder. The service rejects a `sql` transform carrying any of them, and
  presenting one as "not set" would state that it could be set.
- **`llm`** — a member the type permits but the declaration does not carry SHALL be presented as explicitly
  unset rather than omitted, so an operator can tell absent from forbidden.

`preset` SHALL NOT be presented for either type. The service defines one accepted value and applies it when
the member is absent, so a control offering a single choice states a decision the operator does not have.

A transform whose `type` is neither `llm` nor `sql` SHALL render the members the declaration actually
carries rather than an empty section.

#### Scenario: The enrichment section authors the transform in place

- **WHEN** an enrichment pipeline is opened
- **THEN** its transform type, model, params, request template, inputs and outputs are presented on the
  pipeline's own page
- **AND** no evaluator selection and no version control is presented

#### Scenario: A sql transform hides the members its type forbids

- **WHEN** an enrichment pipeline whose transform is of type `sql` is opened
- **THEN** no preset, model, params, request-template or inputs control is present
- **AND** its type and outputs are presented

#### Scenario: An llm transform distinguishes unset from forbidden

- **WHEN** an enrichment pipeline whose transform carries no `params` is opened
- **THEN** the params section is present and states that none are set
- **AND** the request-template section is present

#### Scenario: The retired members are never sent

- **WHEN** a pipeline of either kind is submitted
- **THEN** the request body carries neither `evaluator_name` nor `evaluator_version`
- **AND** it carries no top-level `vars`

#### Scenario: An aggregate declaration carries no transform member

- **WHEN** an aggregate pipeline is submitted
- **THEN** the request body carries no `transform` block and no member of one

### Requirement: What the transform produces is authored as one ordered list of outputs

The enrichment section SHALL present the transform's outputs as one ordered list, one entry per output, and
SHALL NOT present a per-output logical type. The target column owns the type, the enum domain and the
column name; the transform declares only what the column cannot carry.

Each entry SHALL carry a **name**, which is the target column that receives the value, and the members its
transform type admits:

- **`sql`** — one expression. Nothing else: the service rejects an object value on this type.
- **`llm`** — **prose**, being what the model is told about the field; plus a **refinement**, which is a
  closed **value list** or a **jsonata** transform. The prose control SHALL accommodate a paragraph rather
  than a single line, because a live declaration runs to roughly a hundred words.

The two refinements SHALL be offered as a **selection followed by the field the selection names**, rather
than as two fields of which one must be left alone: the service refuses an output declaring both, so a
shape that admits both invites the refusal. The unselected member SHALL be kept on the row and left out of
the request, so changing the selection does not erase what was typed.

The selection SHALL offer the transform and the value list and nothing else. An output declaring neither is
legal on the service and is in fact the common form, but it is reached by leaving the transform empty
rather than by a third choice.

A transform expression that repeats the output's own target column is the **identity** expression, which the
service refuses because an absent transform already means a direct lookup by that name. The console SHALL
handle it in two places, differently:

- **On read, it SHALL be dropped.** A declaration folded from an evaluator that predates `outputs` carries
  one per output — `title → title`, `summary → summary` — so presenting them would mark every output of an
  untouched declaration invalid, and the first save would be refused for a value nobody authored. Dropping
  it changes nothing: its absence means the same lookup.
- **Typed into the field, it SHALL be marked invalid** on the row, without blocking the save — the service
  is the authority, but the field sits directly under the column selection, so the mistake is worth naming
  where it is made.

An output that reaches the form carrying **both** refinements — which only the JSON editor can author,
since the section offers one at a time — SHALL be sent **as written** rather than resolved to one of them.
The service refuses the pair and names it; choosing for the author would save something other than what
they typed.

The order of the entries SHALL be preserved and SHALL be reorderable by dragging, because for an `llm`
transform the order is the order in which the model fills the fields in: a field placed before the facts it
is instructed to derive itself from is answered by invention. The section SHALL state this rather than
leaving the ordering to look cosmetic.

Two entries SHALL NOT share a name, and the form SHALL report the collision. The request carries the
outputs as an object keyed by name, so a duplicate is silently collapsed by the parser before the service
ever validates it.

An entry SHALL be addable and removable, and at least one SHALL be required.

An output declaring neither prose nor a refinement is sent as an empty body and is stored by the service as
`null`, so it is the shape a declaration authored through this form comes back in. Reading one SHALL yield
an output carrying its name alone.

#### Scenario: A folded legacy declaration's identity transforms are not presented

- **WHEN** a declaration whose folded `output_vars` bind each output to a transform equal to its own name is
  opened
- **THEN** no output's transform field carries that expression, and none is marked invalid
- **AND** saving it unedited is not refused for an identity transform

#### Scenario: An output stored with no refinement is read back

- **WHEN** a declaration whose `outputs` bind a name to `null` — what the service stores for an output
  declared with no prose and no refinement — is opened
- **THEN** the page presents that output with its target column selected and its prose, value list and
  transform empty
- **AND** the page renders rather than failing on the declaration

#### Scenario: A sql output carries only its expression

- **WHEN** an enrichment pipeline whose transform is of type `sql` is opened
- **THEN** each output is presented with its name and its expression
- **AND** no type, prose, value-list or jsonata control is present

#### Scenario: An llm output carries prose and one refinement at a time

- **WHEN** an enrichment pipeline whose transform is of type `llm` is opened
- **THEN** each output is presented with its name and its prose
- **AND** a refinement selection is offered, together with the field the selection names and no other

#### Scenario: Changing the refinement leaves out what the other holds

- **WHEN** an output declaring a value list has its refinement changed to the transform and the pipeline is
  saved
- **THEN** the request carries neither the value list nor an empty transform for that output
- **AND** the value list is still presented on the row

#### Scenario: Outputs are reordered by dragging

- **WHEN** an entry of an `llm` transform is dragged above another and the pipeline is saved
- **THEN** the request carries the outputs in the new order

#### Scenario: A duplicate output name is reported

- **WHEN** two entries are given the same name
- **THEN** the collision is reported and the save is withheld

#### Scenario: At least one output is required

- **WHEN** a transform declares no output
- **THEN** the save is withheld

### Requirement: An output is bound to a target column the console already knows

An output's name **is** a column of the target table, and the pipeline knows its target — so the console
SHALL offer that table's columns rather than asking the operator to spell one. This is the fact the
evaluator surface structurally could not have: it declared outputs keyed by column names belonging to a
table it never named.

- The **name** SHALL be a selection over the resolved target's columns. Columns tagged `system` SHALL be
  excluded: they are the provenance set the service stamps itself, and an output writing one is refused.
  A name already taken by another entry SHALL be excluded too, which is the same collision the list
  already reports.
- A declared name that the resolved target does not carry SHALL be **kept as an invalid option** and marked
  invalid rather than dropped, the way a stranded variable column already is. A pipeline whose target lost
  a column must still be readable and correctable in the console.
- Rebinding an output to a column that declares its own domain SHALL drop the row's value list rather
  than leaving it on the request, which the service would refuse. The row keeps its other members.
- The **value-list refinement** SHALL be offered for an `llm` output **only where the bound column
  declares no `enum_values`**. The two are alternatives, not a pair: a column that declares a domain owns
  it, and the service rejects an output declaring `values` for such a column. Where the column does
  declare one, the section SHALL present that domain as the column's own read-only fact instead, so the
  operator sees the closed set without being offered a control the service would refuse.
- An output's **type** SHALL be presented as the column's own read-only fact beside the name, not asked
  for. The column owns it, and the service composes the schema from it.

The enum domain's **order** SHALL NOT be presented as editable. The column assigns the numeric ids from its
declared order and that order is immutable on the service, so a reordering control here would offer a
change the service refuses.

The whole transform section SHALL stay disabled until a target is resolved, matching the inputs editor's
existing readiness gate: its controls have nothing to offer before then, and an enabled select with no
options reads as a target that declares no columns.

#### Scenario: Output names are chosen from the target's columns

- **WHEN** an enrichment pipeline whose target has resolved is opened
- **THEN** each output's name is presented as a selection over that target's columns
- **AND** the columns tagged `system` are not among the options

#### Scenario: A stranded output name stays visible and is marked

- **WHEN** an output names a column the resolved target does not carry
- **THEN** that name is still presented as the selected option and is marked invalid

#### Scenario: A column that declares its own domain is offered no value list

- **WHEN** an `llm` output is bound to a target column declaring `enum_values`
- **THEN** the value-list refinement is not offered for that output
- **AND** the column's domain is presented beside it as a read-only fact

#### Scenario: A plain string column keeps the value list

- **WHEN** an `llm` output is bound to a target column that declares no `enum_values`
- **THEN** the value-list refinement is offered and its values are authored freely

#### Scenario: Rebinding onto an enum column drops the value list it cannot keep

- **WHEN** an output declaring a value list is rebound to a column that declares `enum_values`
- **THEN** the saved request carries no `values` for that output

#### Scenario: A transform repeating its own column is marked

- **WHEN** an output's transform expression is the name of the column it is bound to
- **THEN** the field is marked invalid and states that an absent transform already means that lookup
- **AND** the save is still offered

#### Scenario: An output declaring both refinements is sent as written

- **WHEN** a document authored in the JSON editor declares both `values` and `jsonata` for one output
- **THEN** the saved request carries both, and the service's own refusal is what reports the conflict

#### Scenario: The output's type is shown, not asked

- **WHEN** an output is bound to a target column
- **THEN** that column's type is presented beside the name as a read-only fact
- **AND** no control offers to change it

#### Scenario: The transform section waits for the target

- **WHEN** an enrichment pipeline is being authored and no target has resolved
- **THEN** the transform section's controls are disabled rather than presented with no options

### Requirement: An output's prose is optional and defaults to the target column's description

The service composes an `llm` output's description from the output's `prose`, falling back to the target
column's own `description`, and it never stores the default. A prose control that demanded a value would
therefore make the operator restate a fact the column already carries, and storing that restatement would
freeze it against a later edit of the column.

The prose control SHALL NOT be required. Where the bound column carries a `description`, the control SHALL
present it as the value that will be used when nothing is typed — as a placeholder, visibly distinct from
an authored value — and the request SHALL carry no prose for that output. Where neither is present the
composed property simply carries no description, which the service accepts.

A `sql` output's expression SHALL remain required: it is an expression rather than prose and defaults from
nothing.

#### Scenario: An untouched prose is not sent

- **WHEN** an `llm` output is bound to a column carrying a description and its prose is left alone
- **THEN** the column's description is presented as the value that will be used
- **AND** the saved request carries no prose for that output

#### Scenario: Authored prose wins

- **WHEN** an `llm` output declares its own prose and its column also carries a description
- **THEN** the request carries the authored prose

#### Scenario: A missing description on both sides is not an error

- **WHEN** an `llm` output declares no prose and its column carries no description
- **THEN** the save is offered and no error is reported for that output

#### Scenario: A sql expression is still required

- **WHEN** a `sql` output carries no expression
- **THEN** the save is withheld

### Requirement: The transform's model and params are presented as fields, not as a blob

The enrichment section SHALL present the transform's `type` and `model` as labelled controls, and `params`
as a key/value editor — one row per entry, each key labelled and its value beside it. In that presentation
`params` SHALL NOT be rendered as a JSON blob: the map holds a handful of model knobs, and those are read
and changed one at a time.

Because the map is open — the service validates no key against a list — an empty editor states nothing
about what may go in it. The section SHALL therefore carry a hint naming the knobs that are ordinarily set.

This governs the **form** presentation and does not forbid the pipeline's JSON editor, which presents the
whole declaration as one document on purpose.

#### Scenario: Params are readable and changeable one entry at a time

- **WHEN** an enrichment pipeline whose transform carries two params is opened
- **THEN** each key is presented with its own value
- **AND** the params are not presented as a single JSON document

#### Scenario: An empty params editor names what may be set

- **WHEN** an enrichment pipeline whose transform carries no params is opened
- **THEN** the section names the knobs that are ordinarily set

### Requirement: The transform's request template is authored as a JSON document

`transform.request_template` SHALL be presented through the console's JSON editor rather than as plain
text, so the nesting an operator has to edit is navigable.

The member is a **string** on the wire and the service accepts it whether or not it parses. A template that
is not valid JSON SHALL therefore be presented as text rather than rejected or emptied, and SHALL remain
editable and submittable in that form.

Editing through the JSON editor re-serializes the document, so the bytes submitted MAY differ in whitespace
and key order from the bytes read. This is accepted deliberately in exchange for an editable document; it
does not extend to any other member.

The group-grain placeholders SHALL be documented beside the template as reference, distinguishing the one a
group-triggered pipeline requires from the ones it merely supplies.

#### Scenario: A template that parses is edited as a document

- **WHEN** an enrichment pipeline whose template is valid JSON is opened
- **THEN** the template is presented through the JSON editor

#### Scenario: A template that does not parse stays editable

- **WHEN** a pipeline's template is not valid JSON
- **THEN** it is presented as text, no error is reported, and it can still be edited and saved

#### Scenario: The placeholders are listed beside the template

- **WHEN** an enrichment pipeline's template is presented
- **THEN** the group-grain placeholders are listed beside it, with the required one distinguished

### Requirement: An incomplete declaration can be saved and is refused at enable

The service gates a declaration when a write **arms** the pipeline, not when the row is written: a
disabled pipeline may be stored carrying any subset of its declaration. A pipeline with no trigger, no
transform, no measures — or an `llm` transform with neither model nor request template — is therefore a
storable declaration rather than a rejected one.

The console SHALL NOT withhold a save, or the enable toggle, because a member is **absent**. Both are
offered whatever the declaration holds, and the service's refusal is what surfaces. The console cannot
reproduce the gate — it does not know that a target is inactive, that group keys must equal the target's
`ordering_key` in order, that a measure's result type must fit its column, or that a read source must
declare scan metadata — so a control it greyed out on its own reading would be wrong in both directions.

A value that is **present and contradictory** is a different case and SHALL keep blocking the save, in the
places it already does: a cron the console alone can judge, because the service never parses the
expression; `distinct` without a column; a member selection without a limit; a duplicate output name; a
`sample_fraction` outside `(0, 1]`. The distinction is whether the service would ever tell the author what
is wrong.

Where a save or an enable is refused, the refusal SHALL be reported as any other action failure is — the
service's own message, which names the absent members — and the pipeline SHALL remain as saved rather than
being rolled back in the form.

A declaration the service already considers complete SHALL NOT be taken apart by a save: the service
refuses a patch that would leave a complete declaration incomplete, and the console sends the declaration
whole, so this is a property of the request rather than a check the console adds.

#### Scenario: A pipeline registered with three fields is saved a member at a time

- **WHEN** a pipeline registered with name, kind and target alone is opened and a trigger kind is chosen
  and saved, with no transform declared
- **THEN** the save is offered and the declaration is stored

#### Scenario: A half-authored transform is saved

- **WHEN** an enrichment pipeline whose template references a placeholder no input binds is saved
- **THEN** the save is offered and the declaration is stored

#### Scenario: An llm transform with no template is saved

- **WHEN** an enrichment pipeline whose transform is `llm` with no model and no request template is saved
- **THEN** the save is offered and the declaration is stored

#### Scenario: Enabling it is refused in the service's words

- **WHEN** such a pipeline is then enabled and the service refuses it
- **THEN** the service's own message is reported
- **AND** the pipeline is still presented as saved and disabled

#### Scenario: The enable control is offered whatever the declaration holds

- **WHEN** a pipeline missing several declaration members is opened
- **THEN** the enable control is presented as usable rather than disabled

#### Scenario: A contradictory value still blocks the save

- **WHEN** a sample fraction of zero is entered
- **THEN** it is reported as invalid and the pipeline cannot be saved

### Requirement: Deleting an enrichment pipeline deletes its transform with it

The transform lives on the pipeline, so deleting the pipeline deletes the prompt, the params and the output
declaration with it. Nothing else holds a copy. The delete confirmation SHALL say so for an enrichment
pipeline, in addition to identifying the pipeline by name, because the same action on the previous shape
left the evaluator behind and an operator who learned that behaviour would otherwise expect it here.

The confirmation SHALL keep the danger variant it already uses, and the target table's rows SHALL be stated
as unaffected — the service leaves them in place.

#### Scenario: Deleting an enrichment pipeline warns that the transform goes with it

- **WHEN** the user activates delete on an enrichment pipeline
- **THEN** the confirmation states that its transform is deleted with it and that the target's rows are left
  in place

#### Scenario: Deleting an aggregate pipeline says nothing about a transform

- **WHEN** the user activates delete on an aggregate pipeline
- **THEN** the confirmation identifies the pipeline by name and carries no transform warning

### Requirement: The pipeline form resolves the target table and the read source on demand

`GET /v1/tables` returns neither `grain` nor `columns`, and every control the enrichment section offers is
scoped to a table: the inputs editor to the **read source**, the outputs editor to the **target**. Pipeline
editing — in the create modal and on the detail page alike — SHALL therefore read the full target via
`GET /v1/tables/{name}` whenever the target changes, and the read source — the declared input, or the target
enrichment's `source_table` — once the target has resolved.

**What the read source offers is its entity, not its table.** A table read answers with that table's own
columns; the service addresses the **entity** — the source with every enrichment flattened in — and accepts
a column of it, qualified as `<enrichment>.<column>`. Both live enrichments bind such a column, so a form
scoped to the table both hides them and marks a declared one invalid. The console SHALL therefore also read
`GET /v1/queries/entities/schema/{name}` for the resolved read source, and every control scoped to that
source — the inputs editor, the SQL predicates, the member-selection ranking — SHALL offer and accept its
fields.

A field the entity schema marks `sensitive` SHALL be offered like any other: the service filters that schema
by the caller's own role, so what it returns is already what this operator may read. A failed entity read
SHALL be reported like a failed table read, and SHALL NOT silently narrow the list back to the table's own
columns — a shorter list that looks complete is how a valid binding comes to read as invalid.

Resolved values SHALL be cached by their key for as long as the surface is open, so re-selecting a
previously chosen table issues no second request.

No evaluator SHALL be resolved. The transform is on the declaration and the compiled projection carries the
composed `response_schema`, so nothing the form presents requires a second entity read.

Controls that depend on a resolution SHALL report a pending state while it is in flight rather than
rendering as empty, and a failed resolution SHALL be reported in the form rather than leaving a control
silently unpopulated.

#### Scenario: Selecting a target resolves its columns

- **WHEN** the user selects a target
- **THEN** it is read in full and its columns become available to the outputs editor

#### Scenario: Input bindings offer the read source's columns

- **WHEN** the read source resolves
- **THEN** the inputs editor offers that source's entity fields, not the target's

#### Scenario: The enrichment columns of the source are offered and accepted

- **WHEN** the read source's entity carries a column of an enrichment on it, such as
  `<enrichment>.<column>`
- **THEN** that field is among the options the inputs editor offers
- **AND** a declaration already binding it is not marked invalid

#### Scenario: A failed entity read is reported rather than narrowed away

- **WHEN** the entity schema read fails while the table read succeeds
- **THEN** the failure is reported
- **AND** the controls scoped to the source do not fall back to the table's own columns as though complete

#### Scenario: Changing the target re-resolves the followed source

- **WHEN** the pipeline follows its target and the target is changed
- **THEN** the read source is re-resolved from the new target's `source_table`

#### Scenario: Resolutions are cached

- **WHEN** the user selects a target, switches to another, and switches back
- **THEN** no second request is issued for the first table

#### Scenario: No evaluator request is issued

- **WHEN** an enrichment pipeline is opened or edited
- **THEN** no request is issued against `/v1/evaluators`

#### Scenario: A failed resolution is reported

- **WHEN** reading the selected target table fails
- **THEN** the form reports the failure
- **AND** the controls that depend on that table do not present themselves as having no options

### Requirement: An enrichment pipeline declares its transform's inputs and nothing else

An enrichment pipeline declares what its transform receives as **`transform.inputs`**: a set of names, each
bound either to a field of the read source's entity or to a jsonata expression over it. The console SHALL
present them **inside the transform block**, between the request template and the outputs, which is where
the member sits on the wire and next to the template its names are matched against. The section SHALL be
headed **Inputs**, as its neighbour is headed Outputs: the block it sits in already names the transform, so
repeating that in the heading reads as a member of something else. They SHALL be rows of a
name, a **binding selection**, and the field that selection names — a column selector or an expression
field. The two SHALL NOT be offered side by side: the service refuses an
input declaring both, and the unselected member SHALL be kept on the row and left out of the request rather
than erased.

Where the model's answer lands is derived by the service from the transform's outputs matched to the
target's columns and served as the entry's top-level `outputs`. That derived mapping is not a member of the
request and SHALL NOT be presented in the form — neither as an editor nor as disabled rows. It remains
readable in the JSON editor, which presents the pipeline whole. The **authored** `transform.outputs` is a
different member and is edited as its own section.

Inputs belong to the enrichment kind and SHALL NOT be presented for an aggregate pipeline. For a transform
of type `sql` the section SHALL NOT be presented at all and any inputs the declaration holds SHALL be
dropped: a `sql` transform renders no request, and the service refuses one declaring inputs. The type is on
the declaration, so the drop happens as soon as the type is known rather than after a resolution.

A row carrying no name or no value SHALL be omitted from the request rather than sent blank.

#### Scenario: Inputs are authored as name, binding and value

- **WHEN** an enrichment pipeline is opened
- **THEN** its transform inputs are presented as rows of a name, a binding selection and one value field
- **AND** the field presented is the one the selection names, and no other

#### Scenario: The derived outputs mapping is not presented in the form

- **WHEN** an enrichment pipeline read through the compiled projection is opened
- **THEN** the form presents the authored outputs and the declared inputs
- **AND** the derived outputs mapping is readable in the JSON editor instead

#### Scenario: A sql transform is offered no inputs at all

- **WHEN** an enrichment pipeline whose transform is of type `sql` is opened
- **THEN** the inputs section is not presented
- **AND** any inputs the declaration held are dropped from it

#### Scenario: An incomplete row is not sent

- **WHEN** an input row carries a name and no value
- **THEN** the saved pipeline omits that input

### Requirement: The transform's template placeholders are shown beside the inputs

At row grain the service requires the input names and the template's `{{placeholder}}` names to match **in
both directions**: a placeholder with no input is refused, and an input appearing in no placeholder is
refused as unused. Both halves are now on one page, but the template is a JSON document an operator is not
reading for names while binding columns.

For a pipeline whose trigger fires at row grain the console SHALL present the placeholders found in the
transform's template beside the inputs editor, each marked as covered by an input or not, and SHALL mark a
declared input matching no placeholder.

At group grain the rule inverts — the placeholders are the service's own group built-ins and the inputs
become fields of each member object rather than placeholders — so the console SHALL NOT present this
correspondence for a group trigger.

One group-grain rule the console SHALL state: a group-triggered pipeline whose template references no
`{{members}}` is refused, since the rendered prompt would carry none of the group. That SHALL be reported
as an **error against the request template**, naming what to do about it, rather than as a hint — the
template is on this page now, and the selection it used to be reported against no longer exists.

The correspondence hint is guidance, not a gate: it SHALL NOT block a save, because the service checks it
at enable.

#### Scenario: Placeholders are listed for a row-grain pipeline

- **WHEN** an enrichment pipeline whose trigger fires at row grain is opened
- **THEN** the template's placeholders are listed beside the inputs, each marked as covered or not

#### Scenario: An unused input is marked

- **WHEN** an input is declared whose name appears in no placeholder
- **THEN** that row is marked as unused

#### Scenario: No correspondence is shown for a group trigger

- **WHEN** the trigger kind is `group`
- **THEN** no placeholder correspondence is presented

#### Scenario: A group trigger reports a template that omits the group

- **WHEN** the trigger kind is `group` and the transform's template references no `{{members}}`
- **THEN** an error is reported against the request template

#### Scenario: The hint never blocks a save

- **WHEN** a placeholder is uncovered
- **THEN** the save is still offered

### Requirement: Pipeline registration requires full-admin rights

Registering and enabling a pipeline is `FULL_ADMIN`-only on the service, and a pipeline DTO carries no
per-entity `permissions` object of the kind table DTOs report. The console SHALL therefore gate the create
action on the caller's application role (`isFullAdmin` from `AppContext`) alone, and SHALL NOT attempt a
per-pipeline permission derivation. A caller who is not a full admin SHALL see the listing without a create
action.

The create action SHALL depend on nothing else. With the transform on the declaration there is no second
registry to be empty, no listing whose failure could block the enrichment kind, and no shortage for the
modal to explain: an enrichment pipeline is registered from what the operator types.

#### Scenario: Non-admin sees no create action

- **WHEN** a caller who is not a full admin opens the listing
- **THEN** no create-pipeline action is offered

#### Scenario: A full admin can register either kind unconditionally

- **WHEN** a full admin opens the listing
- **THEN** the create action is enabled and the modal blocks neither kind on the state of another registry

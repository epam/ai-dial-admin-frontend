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
**runtime**, **generation**, and **updated at**.

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
  declared none — inheriting the source from its target's parent — SHALL state that it **follows its
  target** rather than rendering an em dash: an em dash here reads as "no source", where the truth is a
  source this listing cannot resolve. The resolved table SHALL be read on the pipeline's own detail
  page, which asks for the compiled projection.
- A column belonging to one kind SHALL render an em dash on a row of the other kind, which is an ordinary
  state rather than a failure: the service omits such a member rather than sending it empty.
- The **enabled** cell SHALL render as a badge distinguishing an enabled from a disabled pipeline; colour
  alone SHALL NOT be the only carrier of that distinction.
- The **runtime** cell SHALL state whether the pipeline's enqueue is running or paused, as a badge, with
  colour not the only carrier. It SHALL render an em dash for a disabled pipeline, whose enqueue the runner
  is not driving at all — configuration and runtime are separate axes, and a disabled pipeline has no
  runtime answer rather than a negative one.

The **runtime** column SHALL be filled from a **single** read of the runtime service for the whole page.
The service answers with the paused pipelines as one list, so a pipeline's runtime is decided by whether
its name is in that list; a request per row would be a request per pipeline for an answer already given
whole.

The **runtime** column SHALL be omitted entirely — rather than rendered with empty or error cells — when
the runtime service is not configured, did not answer, or the caller is not a full admin. A column of
identical failures states nothing about any row and implies a per-row fact the page does not have.

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
- **THEN** its inputs cell states that the pipeline follows its target, rather than showing an em dash
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

#### Scenario: A paused pipeline is stated as paused in the listing

- **GIVEN** the runtime service reports one pipeline as paused, and has taken on the rest
- **WHEN** a full admin opens the listing
- **THEN** that pipeline's runtime cell states that it is paused
- **AND** every other enabled pipeline's runtime cell states that it is running

#### Scenario: A pipeline the runner has not taken on is marked in the listing

- **GIVEN** an enabled `enrich` pipeline the runtime service does not report among the ones it has taken
  on
- **WHEN** a full admin opens the listing
- **THEN** that pipeline's runtime cell states that it is not running

#### Scenario: One runtime read serves the whole page

- **WHEN** a full admin opens a listing of many pipelines
- **THEN** each of the runtime service's two listings is read once
- **AND** no request is issued per row

#### Scenario: A disabled pipeline has no runtime answer

- **WHEN** the listing renders a pipeline whose `enabled` is false
- **THEN** its runtime cell shows an em dash rather than `running` or `paused`

#### Scenario: The runtime column is omitted when the runtime service cannot be read

- **GIVEN** the runtime service is not configured or does not answer
- **WHEN** the listing renders
- **THEN** no runtime column is presented
- **AND** every other column renders as it otherwise would

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
the read-only facts, the scope, the trigger, the runtime state, the JSON editor toggle and the save bar —
and SHALL choose the transform section by the pipeline's kind.

The section carrying the source, the target and the filter SHALL be titled **Scope**. "Read scope" named
only half of it: the target is written, not read.

**Scope SHALL come before the trigger**, which is the order the author fills them in. A group trigger's
member selection ranks rows by the source's columns and its readiness declaration is scoped to the same
source, so a trigger presented above the scope asks about a table the page has not established yet.

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

#### Scenario: The scope is presented before the trigger

- **WHEN** an enrichment pipeline is opened
- **THEN** the Scope section appears above the trigger

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
- **THEN** the identity row, read-only facts, scope, trigger, runtime state and save bar are presented

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

The **grain key** SHALL be the resolved target's where the page has resolved one, falling back to the
pipeline's stored `grain_key` and then to an em dash. It is the one fact read from the draft's resolution
rather than from the pipeline, so that a target the caller has changed but not yet saved is reflected here
as it is in the trigger's grouping key, which starts from the same value. Where the value comes from SHALL
be stated on an **info affordance on its label** — reachable by keyboard and carrying the sentence as its
own accessible name — rather than as a caption under the value.

The composed **`response_schema` SHALL NOT be among them**. It is a document rather than a value — a dozen
field names on a live pipeline, against neighbours that are one word each — and what it lists, the outputs
editor states below in the form the operator authors them. It stays readable in the JSON editor, which is
also where the one case it spoke to is read: a declaration storing its own schema, which the service serves
verbatim rather than composing.

The name SHALL be presented among the identity rather than among these facts, because it addresses the page.
Because quoting it elsewhere is a common need, it SHALL carry a copy control.

The resolved **read source** and the **target** SHALL NOT be presented among these facts. The scope states
both at the top of the form, no longer folded into a collapsible section, so a read-only copy of the pair
said the same thing twice within a few centimetres — and the question the copy was added to answer, "which
tables is this bound to", is answered by the controls themselves.

Reaching a bound table SHALL instead be offered **beside the control that names it**: a control bound to a
table SHALL carry an `Open` action that opens that table's page in a **new tab**, so the pipeline the
operator was reading stays where it was. A control whose table is unresolved — a followed source whose
target declares no parent — SHALL offer no such action, there being nothing to open.

Because every such action carries the same label, each control and its action SHALL be grouped under the
**name of the table** they are bound to. That name is what distinguishes one `Open` from another for a
screen reader; the control's own label already names the field.

No evaluator fact SHALL be presented and no link to an evaluator page SHALL be offered: the transform is
authored on this page, and the composed `response_schema` is where "what the model is held to" is read.

These members SHALL NOT be sent when the pipeline is saved.

#### Scenario: The facts name the source before the target

- **WHEN** a pipeline is opened
- **THEN** neither the target nor the resolved read source is named among the read-only facts
- **AND** the scope's own controls present the source before the target

#### Scenario: The bound tables are reachable from the facts

- **WHEN** the operator activates the `Open` action beside the target control
- **THEN** that table's page is opened in a new tab
- **AND** the same holds for the resolved read source's control
- **AND** the facts carry no second, read-only copy of the pair

#### Scenario: An unresolved source offers no Open

- **GIVEN** an enrichment pipeline whose followed source cannot be resolved
- **WHEN** the pipeline is opened
- **THEN** the source control offers no `Open` action

#### Scenario: Derived facts are shown but not editable

- **WHEN** a pipeline is opened
- **THEN** its `generation`, `created_at` and `updated_at` are presented as read-only values

#### Scenario: An enrichment pipeline adds its resolved facts

- **WHEN** an enrichment pipeline is opened
- **THEN** its grain key and `version_column` are presented as read-only values
- **AND** the grain key is the resolved target's, with its provenance on an info affordance beside the label
  rather than in a caption

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

#### Scenario: No evaluator fact is offered and none opens a page

- **WHEN** an enrichment pipeline is opened
- **THEN** no evaluator name, version or link is presented among the facts, there being no evaluator page
  to open

### Requirement: A pipeline's runtime state is presented read-only

Every pipeline carries a server-owned `state` reporting how its execution is going: the scan position it
has reached, when it last ran, when it will next run, how far behind its input it is, the last failure,
whether the last run left input behind, what held its window short of its input, how far its output has
been materialized, when it was last probed and found drained, and whether an enrichment it reads has been
re-derived beneath it. The console SHALL present this state on the detail page, read-only, and SHALL
present it in two places according to what the reader does with it.

The **three states an operator acts on** — the last failure, a window held short by an enrichment the
pipeline reads, and an output a re-derived input has left behind — SHALL be presented as **alerts**, above
the tab strip, each stating what happened and naming the enrichment involved. As a line of small print
below the facts they read as a footnote to them, which is what made them easy to miss.

Each alert SHALL be drawn to what it is: the failure as an error, the rebuild as a warning, the clamp as
information. None SHALL interrupt a screen reader, the page rendering all three as it loads rather than
raising them while it is read.

Everything the state reports SHALL be presented in the **Runtime** tab, grouped by the question each
group answers:

- **Schedule** — when it last ran and when it next runs.
- **State** — how far behind its input it is, whether it is working through a backlog, the cursor
  position (version and identity), the materialized-through position (version and identity), and when it
  was last drained. Named for what it is: a pipeline is a standing process rather than a job with an
  end, so none of these counts towards a finish and "progress" would promise one.

Each group SHALL be presented as a **card**, stacked, each taking the full width. Rules between groups
left the tab one undifferentiated column under its control bar, and the failures card below them is a
card: two presentation idioms on one tab read as two unrelated screens. Side by side the cards were
forced to a shared height, so the schedule — two values against the state's seven — stood above a
card's worth of empty space, while the failures card beneath them was full width either way.

A card SHALL carry no rim. It is a raised layer against the panel behind it, and that fill is already
its boundary; a border on top of it draws the same box twice.


- **Failures and notices** — when the last run failed. This is the registry's own verdict on a whole
  run, which is a different kind of fact from the per-row dead letters the failures card lists: the
  kinds that dead-letter are model-calling enrichments, and the kinds that report a run-level failure
  are the ones the registry drives itself, so the two are never the same pipeline's answer to the same
  question.

The service reports no timestamp of its own for that failure — `last_error` is the last run's failure —
so the run's time is what places it, and the console SHALL NOT invent one. Whether to present the group
SHALL be judged on the raw member rather than on the formatted time: the formatting lands after the
first render, so a gate read from it withholds the group on first paint and then pops it in, and drops
it entirely for a pipeline that failed before it ever recorded a run.

The console SHALL NOT restate the message of the failure, the clamp or the required rebuild anywhere in
the tab: all three are already raised as alerts above the tab strip, in the same words, and a reader who
has just read the alert would meet it twice on one screen. What the tab adds is the timing the alert has
no room for.

`drained_at` SHALL be presented under state rather than under schedule, and SHALL NOT be presented as a
sign that the pipeline is alive. It records when a probe last found nothing matching the filter left to
do, and it advances **only** on an empty probe — so a pipeline with steady input, working perfectly, holds
a `drained_at` frozen at its last quiet moment for months, while one with sparse input re-stamps it every
tick. Read as a heartbeat it inverts the truth: the healthy busy pipeline looks stalled and the idle one
looks lively. It is a horizon for the rollups that read this pipeline, which is why it is stated at all,
and the value that says the pipeline is advancing is the materialized-through position beside it.

The tab SHALL offer to read the values again without leaving the page. That control SHALL carry a label
rather than being icon-only, so it reads as a peer of the pause control beside it in the tab's own
control bar. The tab SHALL NOT state how old its answer is: an age beside every value competed with the
values themselves, and re-reading is one click away.

Reading again SHALL read **both** upstreams — the pipeline, which carries the state, and the runtime
service, which carries the pause and the failures — because the tab presents facts from both and a
control that refreshed one of them would leave the other stale behind a chip that says otherwise. A lag
figure is measured against the present, so a value that is minutes old is a different statement from the
same value read now, and a reader who cannot tell them apart cannot tell a stalled pipeline from a stale
page.

The **read-only facts row** above the tab strip SHALL carry no runtime value at all. It keeps what the
declaration derives — grain key, version column, generation, created, updated. Four values fitted that
row; the cursor pair and the materialized-through pair do not, and they are what distinguishes a stalled
pipeline from a slow one. `drained_at` in particular SHALL NOT stay there: beside `updated_at` it reads as
the pipeline's last sign of life, which is the one thing it does not report.

A group whose every member the service omitted SHALL render nothing at all — not a heading over an empty
card. An on-ingest pipeline has no schedule: a bare heading above white space reads as a fault rather
than as an absence that is ordinary for that kind.

The tab SHALL present exactly one of these content states:

- **Loaded** — the state reports at least one run, and its values are presented.
- **Never run** — a state from which no group has anything to draw, **a reported failure included**: a
  pipeline that failed has run, and telling its reader otherwise sends them looking for a pipeline that
  never started. The tab SHALL state that the pipeline has not run yet, in the console's own empty-state
  treatment, rather than presenting a row of placeholders. This SHALL NOT be judged on `last_run_at`: ADAS records that member only for the kinds it
  drives on a schedule, so an on-ingest pipeline the runner drives has none of it while working
  perfectly, and judging by it alone told a running pipeline it had never run.
- **Unavailable** — the pipeline was read but carries no state at all. The tab SHALL state that the runtime
  state could not be read and SHALL state that the pipeline's configuration is unaffected, so the reader
  does not act on the absence as if the pipeline were broken.

The failures card is governed by its own requirements and SHALL be presented independently of these three:
it reads a different service, and a pipeline that has never run can still hold dead letters from before
its state was reset.

`unclamped_reads` SHALL NOT be presented. It reports, per enrichment the pipeline reads, why the window was
**not** held — six closed-dictionary reasons, one of them simply "this pipeline does not read it" — and
every one of them is the ordinary case. The member stays readable in the JSON editor.

State SHALL be presented as reported and SHALL NOT be interpreted into a health verdict. A lag figure is
measured against the moment it is read, so two reads of an unchanged position differ by the time between
them and both are correct; a clamp is progress rather than an error. Presenting either as a fault would be
the console inventing a judgement the service does not make.

A value SHALL be presented in full rather than truncated, with the whole of it reachable where the
column it sits in is narrower than the value. A cursor identity cut short with no way to read the rest
is one nobody can use.

A member the service omits SHALL be **left out** rather than presented as a zero or as an em dash. These
values appear as the pipeline runs, so a row of placeholders would state absence where there is simply
nothing yet — unlike the declaration's own facts, whose blank means the declaration names none.

State SHALL NOT be sent when the pipeline is saved.

#### Scenario: Execution state is presented

- **WHEN** a full admin opens the `Runtime` tab of a pipeline that has run
- **THEN** its last run and next run are presented in the schedule card
- **AND** its lag, backlog, cursor position, materialized-through position and drained-at are presented
  in the state card
- **AND** the two cards are stacked, each the full width

#### Scenario: The measured values are no longer among the read-only facts

- **WHEN** a pipeline that has run is opened on `Properties`
- **THEN** its last run, next run, lag, backlog and drained-at are not presented among the read-only facts
- **AND** its grain key, version column, generation, created and updated still are

#### Scenario: Drained-at is not presented as a sign of life

- **GIVEN** a pipeline with steady input whose `drained_at` is months old while its materialized-through
  position advances
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** `drained_at` is presented in the state card rather than the schedule card
- **AND** it is not presented as the pipeline's last activity or as evidence that it has stalled

#### Scenario: The tab offers to read the values again

- **WHEN** a full admin opens the `Runtime` tab
- **THEN** a labelled control is offered that reads them again
- **AND** no age of the previous read is stated

#### Scenario: Reading again refreshes both upstreams

- **GIVEN** a full admin on the `Runtime` tab
- **WHEN** the user activates the re-read control
- **THEN** the pipeline is read again
- **AND** the runtime service is read again
- **AND** an answer from an earlier read that lands later SHALL NOT replace it

#### Scenario: A pipeline that has never run says so

- **WHEN** a pipeline with no recorded run is opened on `Runtime`
- **THEN** the tab states that the pipeline has not run yet, in the console's own empty-state treatment
- **AND** no measured value is presented as a zero, an epoch date or an em dash

#### Scenario: A pipeline carrying no state at all says the read failed

- **GIVEN** a pipeline whose response carries no `state`
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab states that the runtime state could not be read
- **AND** it states that the pipeline's configuration is unaffected

#### Scenario: The last failure is presented

- **WHEN** a pipeline whose last run failed is opened
- **THEN** the failure reported by the service is presented as an alert, worded by the service
- **AND** the `Runtime` tab's failures group states when it happened without repeating the alert's message

#### Scenario: A running on-ingest pipeline is not called never-run

- **GIVEN** a pipeline the service reports with a materialized-through position and no `last_run_at`
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** its state card is presented

#### Scenario: A group with nothing to report is not drawn

- **GIVEN** an on-ingest pipeline for which the service records no run schedule
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no schedule card is rendered
- **AND** no empty heading is presented in its place

#### Scenario: A clamp is presented as progress

- **WHEN** a pipeline whose window was held short by an enrichment it reads is opened
- **THEN** the clamp and the enrichment holding it are presented as an informational alert
- **AND** the `Runtime` tab does not repeat it
- **AND** the pipeline is not presented as failing on that account

#### Scenario: A required rebuild is presented as an instruction

- **WHEN** a pipeline whose read enrichment has been re-derived since its output was built is opened
- **THEN** the console states as a warning alert that a rebuild is required and names the enrichment

#### Scenario: A pipeline in none of those states raises no alert

- **WHEN** a pipeline reporting neither a failure, a clamp nor a required rebuild is opened
- **THEN** no alert is presented
- **AND** its `Runtime` tab draws no failures group at all

#### Scenario: A pipeline whose only recorded fact is a failure is not called never-run

- **GIVEN** a pipeline whose state carries a failure and no run timestamp
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the tab does not state that the pipeline has not run yet
- **AND** the failure is presented in the failures group

#### Scenario: Unclamped reads are not presented

- **WHEN** a pipeline whose state reports `unclamped_reads` is opened
- **THEN** none of them is presented among the facts, as an alert, or in any Runtime card
- **AND** the member remains readable in the JSON editor

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
the control reads "Disable pipeline" and SHALL be rendered as a **neutral** button; while it is disabled it
reads "Enable pipeline" and SHALL be rendered as a primary button. The danger treatment SHALL be reserved
for **Delete**, which is the only irreversible action of the two: with both drawn in danger, side by side in
the same header, the appearance said stopping a pipeline and destroying it weighed the same.

**Delete SHALL be placed before the enable/disable control**, so the control the operator reaches for
routinely is the last one in the row rather than the one they reach for once. The control SHALL carry no icon: the trash glyph that accompanies Delete would misstate a reversible
switch as a removal, and no other glyph distinguishes the two directions better than the label already does.

The control SHALL be offered only to a full admin, SHALL confirm before it applies, and SHALL be withheld
while the pipeline has unsaved edits — stating why, since toggling re-reads the pipeline and would discard
them.

#### Scenario: An enabled pipeline leads with its status

- **WHEN** an enabled pipeline is opened
- **THEN** its enabled badge is presented above the pipeline name at the header's leading edge
- **AND** the control offering to disable it is presented as a neutral action, the danger treatment being
  Delete's

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

### Requirement: A group trigger's grouping key defaults to the target's grain key and stays editable

The trigger's `group_by` must resolve to the target enrichment's grain key, because an enrichment is keyed
on its grain and collapses by it — grouping by any other column would pile many groups onto a single row.
The spelling, though, depends on the read source: the service takes the **bare** key only where that source
declares it as a column of its own, and where the source reaches the key through an enrichment it demands
`<enrichment>.<grain key>` instead, refusing the bare form with HTTP 422 and naming what to write.

The console SHALL present the grouping key in the **trigger block** as an editable field, prefilled with
the resolved target's `grain_key` and accepting **any text**. It SHALL NOT restrict the value to a list it
computed, and SHALL NOT rewrite what the author or the JSON editor put there: a console that predicts which
spellings the service accepts is a console that locks the author out whenever the prediction is short, and
the same value can be right for one source and wrong for the next.

The value SHALL be sent as written, falling back to the resolved grain key when the author has written
none. A spelling the service will not take SHALL be reported by the service, in its own words, rather than
guessed at beforehand.

The facts row SHALL keep presenting the target's `grain_key` itself. It is the key the pipeline is keyed by,
and the trigger's spelling of it is a different statement — `client_session_id` against
`usage_client_identity.client_session_id` — so neither stands in for the other.

This grouping key is the trigger's and is distinct from an aggregate pipeline's group keys, which name what
its rows are grouped by. The two SHALL NOT share a control.

#### Scenario: The field starts at the target's grain key

- **WHEN** the trigger kind is `group` and the target has resolved
- **THEN** the grouping key field holds that target's grain key
- **AND** the saved pipeline carries it when the author writes nothing else

#### Scenario: Any spelling can be written

- **WHEN** the author replaces the value with a qualified spelling such as `<enrichment>.<grain key>`
- **THEN** the field takes it as written
- **AND** the saved pipeline carries exactly that

#### Scenario: A declared value is presented rather than replaced

- **GIVEN** a pipeline whose `group_by` the JSON editor set to something the form would not have offered
- **WHEN** the form is presented again
- **THEN** that value is what the field holds, and no change is raised against it

#### Scenario: A target with no grain key leaves the field editable

- **WHEN** the target declares no grain key, or has not resolved
- **THEN** the field is empty and editable rather than disabled

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

A **column of the input** is a field of the input's entity, not of its table alone: the service validates
the key against the entity, so a column an enrichment supplies — `<enrichment>.<column>` — is one it
accepts, and the console SHALL offer those alongside the input's own. What it refuses is narrower than what
the table declares and wider than it too: an enrichment whose values have no settled position, a
group-triggered one above all, is rejected with its own message, which the console surfaces rather than
predicting.

The console SHALL collect group keys as an ordered repeater whose every row offers that choice. A truncation
SHALL offer only the units the chosen column's type admits, so a truncation the service would refuse cannot
be built. Order SHALL be preserved as entered, because the service reads the keys in order.

A key or a measure column the entity does not offer — written through the JSON editor, which exists to say
what the form cannot — SHALL stay selected rather than reading as unset. The console SHALL NOT rewrite it:
whether it stands is the service's answer to give.

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
targets this table — SHALL NOT block the save. The one exception is the trigger's grouping key, and only in
its empty case: a group-triggered pipeline whose document names none and whose target has not resolved would
send no grouping key at all, which the service refuses outright. A grouping key the document does carry SHALL
be sent as written, whatever the target's state. That check SHALL keep applying in both presentations. The document
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

#### Scenario: A group-triggered pipeline with no grouping key at all cannot be saved

- **WHEN** a group-triggered pipeline names no grouping key and its target has not resolved, so none can be
  defaulted either
- **THEN** saving is refused by the console rather than sending a request without the grouping key

#### Scenario: A grouping key the document carries is saved whatever the target's state

- **WHEN** a group-triggered pipeline's document names a grouping key while its target has not resolved
- **THEN** saving is offered, and the request carries that key as written

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

### Requirement: Pipeline detail view is organized into Properties, Runtime and Audit tabs

The pipeline detail view (`/pipelines/{name}`) SHALL present its content under a horizontal tab strip whose
tabs are **Properties**, **Runtime** and **Audit**, in that order. `Properties` SHALL be the selected tab
when the view is first opened.

The **Runtime** tab SHALL be present only for a caller who is a full admin. The runtime it reports is
controlled through a service that authorizes every one of its endpoints, reads included, on full-admin
rights and offers no consumer-facing read — so for anyone else there is nothing to present read-only and
the tab is withheld in full rather than shown empty.

The **Runtime tab SHALL carry an error mark** once the dead-lettered failures have been read and there
is at least one, with their number stated in text beside the strip for a reader who cannot see it. A
reader who opens the view on `Properties` would otherwise have to open the tab to discover there is
anything to act on. No other tab carries one: the state the Runtime tab reports is a position rather
than a fault, and the Audit tab's activity list is unbounded and grows with every edit.

The identity row — the enabled-state badge, the runtime status chip, the pipeline name, its copy control,
the `Discard` / `Save` change bar, the enable/disable control, the delete control and the JSON editor
toggle — SHALL render **above** the tab strip, presented whichever tab is
selected, under the permission and pending-edit conditions the "The pipeline detail header states the
pipeline's status before its name" and "Runtime status is stated beside configuration status"
requirements state.

The **runtime alerts** — the last failure, the clamp and the required rebuild, as "A pipeline's runtime
state is presented read-only" states them — SHALL render between the identity row and the tab strip, and
SHALL therefore be presented whichever tab is selected. They are true of the pipeline rather than of the
tab in view: filed under one tab they vanished the moment the reader opened another, which is exactly
where a reader goes to find out what a failing pipeline has been doing. The Runtime tab restates the same
three conditions as dated facts beside the values they qualify; the alert is the signal, the fact is the
record, and the tab is not a substitute for the alert.

The **pause banner** — the pipeline's own pause, as "A paused pipeline states its pause above the tab
strip" states it — SHALL render in the same place, between the identity row and the tab strip, above the
runtime alerts. A pipeline that is not consuming its input is the first thing a reader needs to know,
including a reader of the alerts: a failure reported by a run that no longer happens is read differently
from one reported by a pipeline still trying.

Everything else the frame presents below the identity row — the read-only facts, the scope, the trigger and
the kind's transform section — SHALL render inside the **Properties** tab where a tab strip is rendered,
and directly beneath the identity row where it is not.

Selecting another tab SHALL NOT discard a pending edit. The draft the fields and the document share SHALL
survive a tab switch, and the change bar SHALL stay offered from any tab, so a caller who reads the history
or the runtime mid-edit does not lose the edit by reading it.

The JSON editor and the tab strip SHALL NOT be presented together. Enabling the editor withdraws the tab
strip along with everything else below the identity row — the runtime alerts and the pause banner
included, since the document on screen is a draft the alerts may already contradict and which says nothing
about the runner — as "The pipeline JSON editor takes the whole view, and an unsaved change closes the way
out" already requires, and leaving the editor SHALL restore the strip with `Properties` selected. The
toggle itself is unchanged and stays offered to every caller.

The tab strip SHALL be rendered only when `featureFlags.analyticsEnabled` is true. With analytics disabled
the detail view SHALL render the Properties content directly, with no tab strip, no Runtime tab and no
Audit tab, and SHALL issue no request to the analytics activity feed and none to the runtime service. The
route itself is not guarded on that flag — `/pipelines/{name}` guards only on `isAnalyticsForbidden()`,
which is an authorization check against the analytics service and not the client feature flag, so a
bookmarked or pasted link still opens this view on an analytics-disabled installation and the tab condition
is what keeps it from issuing either request.

There SHALL be **no** pipeline-status condition on the Audit tab, unlike the table detail view's, which
additionally requires an `ACTIVE` table. A pipeline has no registration lifecycle to mirror one: the service
creates it whole in a single `POST /v1/pipelines`, so every registered pipeline already carries at least a
`Create` activity. `enabled` is a pipeline's runtime toggle and not a registration state — a disabled
pipeline is fully registered, and disabling or enabling it is itself an audited `Update` — so the Audit tab
SHALL be offered on a disabled pipeline exactly as on an enabled one.

The Audit tab SHALL require no permission beyond the one that already allows reading the pipeline. It SHALL
NOT be gated on full-admin rights, which the save, the enable/disable control and the Runtime tab are.

#### Scenario: Properties is the selected tab when the pipeline detail view opens

- **WHEN** a full admin opens the detail view of a registered pipeline
- **THEN** a tab strip showing `Properties`, `Runtime` and `Audit` is rendered
- **AND** `Properties` is the selected tab
- **AND** the read-only facts, the trigger and the kind's transform section are shown beneath it

#### Scenario: The Runtime tab is withheld from a caller who is not a full admin

- **GIVEN** a caller who is not a full admin
- **WHEN** the user opens the pipeline detail view
- **THEN** the tab strip carries `Properties` and `Audit` only
- **AND** no runtime state is presented anywhere on the page

#### Scenario: The Runtime tab marks that something has failed

- **GIVEN** a model-calling enrichment the runtime service reports dead-lettered failures for
- **WHEN** a full admin opens the detail view on `Properties`
- **THEN** the `Runtime` tab carries an error mark and the count is stated beside the strip
- **AND** neither the `Properties` nor the `Audit` tab carries one

#### Scenario: The identity row and its actions stay above the tab strip

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the enabled-state badge, the pipeline name, its copy control and the enable/disable control
  remain rendered above the tab strip, unchanged

#### Scenario: A runtime alert is presented on either tab

- **GIVEN** the detail view of a pipeline whose read enrichment has been re-derived beneath it
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the alert stays presented, above the tab strip

#### Scenario: A pause banner is presented on every tab

- **GIVEN** the detail view of a paused pipeline
- **WHEN** the user switches from `Properties` to `Audit`
- **THEN** the pause banner stays presented, above the tab strip
- **AND** it is presented above the runtime alerts

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

#### Scenario: A pending field edit survives a switch to the Runtime tab

- **GIVEN** the detail view of a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** a full admin selects `Runtime` and then `Properties` again
- **THEN** the edited value is still presented
- **AND** the `Discard` / `Save` bar is still offered

#### Scenario: The JSON editor and the tab strip are not presented together

- **GIVEN** the detail view of a registered pipeline
- **WHEN** the caller enables the JSON editor
- **THEN** the pipeline is presented as one JSON document
- **AND** no tab strip is rendered
- **AND** no runtime alert and no pause banner are presented
- **AND** turning the editor off again renders the tab strip with `Properties` selected

#### Scenario: Audit tab absent when analytics is disabled

- **GIVEN** `featureFlags.analyticsEnabled` is false
- **WHEN** the user reaches `/pipelines/{name}` by a direct link
- **THEN** no tab strip, no `Runtime` tab and no `Audit` tab are rendered
- **AND** the read-only facts, the trigger and the transform section are shown directly
- **AND** no request is issued to the analytics activity feed or to the runtime service

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

On success the modal SHALL close, show a success notification, and **navigate to the new pipeline's own
page**. That page is where the declaration is authored, and a registration that collects three fields has
produced nothing else to look at; leaving the operator on the listing makes them find the row they just
created before they can continue. The listing is refreshed on the way, so returning to it shows the new
pipeline.

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

- **WHEN** creation succeeds and the operator returns to the listing
- **THEN** the new pipeline appears in it

#### Scenario: Successful creation opens the new pipeline

- **WHEN** creation succeeds
- **THEN** the modal closes, a success notification is shown, and the new pipeline's own page is opened

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

While no output is declared the section SHALL present its **add control and nothing else**, as the inputs
section does: no column headings, no ordering hint and no empty-state sentence.

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

#### Scenario: An empty outputs section offers only its add control

- **WHEN** an enrichment pipeline declaring no outputs is opened
- **THEN** the section presents the add control, with no column headings and no empty-state sentence

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

Deleting SHALL be offered from **both** surfaces that present a pipeline: the listing's row action menu and
the **detail page's header**, each behind the same confirmation and the same full-admin guard. A pipeline
opened by mistake is disposed of where it was opened rather than from a screen the operator has to go back
to. A delete from the detail page SHALL return to the listing, the page it acted on having ceased to
exist.

#### Scenario: Deleting an enrichment pipeline warns that the transform goes with it

- **WHEN** the user activates delete on an enrichment pipeline
- **THEN** the confirmation states that its transform is deleted with it and that the target's rows are left
  in place

#### Scenario: The detail page offers delete

- **WHEN** a full admin opens a pipeline's detail page
- **THEN** a delete control is offered in its header
- **AND** confirming it deletes the pipeline and returns to the listing

#### Scenario: Delete is not offered without full-admin rights

- **WHEN** a user who is not a full admin opens a pipeline's detail page
- **THEN** no delete control is offered

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
source — the inputs editor, the SQL predicates, the member-selection ranking, and an aggregate's group keys
and measures — SHALL offer and accept its fields. The service validates each of them against that same
entity, so a control scoped to the table alone offers a shorter list than the one it will be judged by. The
group trigger's grouping key is the exception, and deliberately: it takes free text, because which spelling
the service accepts depends on the source in a way a list cannot be trusted to predict.

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

While no input is declared the section SHALL present its **add control and nothing else** — no column
headings and no empty-state sentence. Headings label rows; with no row to label they are three words over
an empty grid, and the control already says what to do. A read source the console could not read is the
exception and SHALL still be reported, being a failure rather than an empty list.

#### Scenario: An empty inputs section offers only its add control

- **WHEN** an enrichment pipeline declaring no inputs is opened
- **THEN** the section presents the add control, with no column headings and no empty-state sentence

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

### Requirement: Runtime control is reached through a second analytics service

Pausing a pipeline, resuming it, reading which pipelines are paused, reading which ones the runner
has taken on, and reading and re-running its dead-lettered failures are served by the **analytics
enrichment runner**, a service distinct from the one that holds the pipeline registry. Its failures
listing is **paged by cursor and counted by the service**: every page carries the number of items the
filter matches and the number of them it would re-run, read in the page's own snapshot, so a caller
never has to count rows to state a total. The console SHALL
reach it at its own configured host and SHALL treat it as a separate upstream throughout: a registry read
that succeeds while the runner is unreachable SHALL still present the pipeline.

The runner authorizes **every** endpoint, reads included, on full-admin rights, and offers no
consumer-facing read. The console SHALL therefore issue no request to it for a caller who is not a full
admin, and SHALL present no runtime affordance to such a caller rather than presenting one that would be
refused.

An installation that has not configured the runner's host SHALL behave exactly as one whose runner did not
answer: no runtime affordance is presented, and no error is raised for the absence. Runtime control is an
addition to the console, not a precondition for reading a pipeline. The failures card is a runtime
affordance like the rest: with no host configured it SHALL NOT be presented and no request SHALL be
issued for it.

The runner reports failures in the same envelope the registry does — a status, a stable machine code, a
human-readable message, the path and the method — so a refusal SHALL be surfaced the way a registry refusal
already is, by the service's own message with its request id. Two of its codes name conditions the operator
can act on and SHALL be distinguished from a generic failure:

- the runner has not yet loaded the pipeline list since it started, which resolves by itself shortly;
- the runtime-state database is unavailable, which does not.

#### Scenario: Pausing survives a runner that does not serve the cache listing

- **GIVEN** the runtime service answers the paused listing but refuses the cache listing
- **WHEN** a full admin opens an enabled `enrich` pipeline
- **THEN** its runtime is stated as running
- **AND** the pause control is offered
- **AND** no warning states that nothing is running it

#### Scenario: A pipeline reads even when the runner is unreachable

- **GIVEN** the runtime service does not answer
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** the pipeline, its facts and its form are presented
- **AND** no runtime status is stated

#### Scenario: No runtime request is issued for a caller who is not a full admin

- **GIVEN** a caller who is not a full admin
- **WHEN** the user opens the pipelines listing and a pipeline's detail view
- **THEN** no request is issued to the runtime service

#### Scenario: An unconfigured runner is not an error

- **GIVEN** no runtime service host is configured
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** no runtime affordance is presented
- **AND** no failures card is presented and no failures request is issued
- **AND** no error notification is raised

#### Scenario: A cold runner is distinguished from a broken one

- **GIVEN** the runner answers that it has not loaded the pipeline list yet
- **WHEN** a full admin attempts to pause a pipeline
- **THEN** the failure states that the service is still starting and that the action can be retried shortly
- **AND** the pipeline is not presented as paused

### Requirement: A pipeline's enqueue can be paused and resumed

A full admin SHALL be offered a control that pauses the pipeline's enqueue, and — while it is paused — one
that resumes it. Pausing suspends the work the runner drives for that pipeline; it does not change the
pipeline's declaration, and the pipeline SHALL remain `enabled` throughout.

The control SHALL be presented in the Runtime tab's control bar, beside the statement of when the state
was read, and — while the pipeline is paused — in the pause banner, which is where a reader who arrived on
any tab meets the pause itself.

Unlike the delete and enable/disable controls in the identity row, the pause control SHALL NOT be withheld
while the `Discard` / `Save` change bar is up. Those two are withheld while edits are pending because they
re-read the pipeline; a pause does not, and an incident is exactly when the form is most likely to be
half-edited.

Pausing SHALL be confirmed before it applies. The confirmation SHALL state what stops and what does not:
input is no longer consumed, input keeps arriving and the backlog grows until the pipeline is resumed, the
pipeline stays enabled and its definition is unchanged. It SHALL state that the pause is a runtime action
and is not recorded as a change to the pipeline document. It SHALL state that the pause does not survive a
restart of the runtime service, which is a consequence an operator cannot discover from the console and
would otherwise meet as a pipeline that resumed itself overnight. The confirmation SHALL be the
informational variant, not the danger one: a pause is reversible, and the danger treatment is reserved for
delete.

Resuming SHALL NOT be confirmed. It restores the ordinary state and is itself the undo of the action that
was confirmed.

Neither control SHALL be withheld while the pipeline has unsaved edits, unlike the enable/disable control:
pausing sends no part of the document, so there is nothing for an unsaved edit to be discarded by. While a
request is in flight the control SHALL state that and SHALL NOT be actionable, so a second request cannot
be issued for the same decision.

Each outcome SHALL be reported: a success as a notification stating the pipeline was paused or resumed, a
failure as an error notification carrying the service's own message and its request id.

#### Scenario: Pausing a running pipeline

- **GIVEN** a full admin on the `Runtime` tab of a running pipeline
- **WHEN** the user activates the pause control and confirms
- **THEN** the pipeline is paused
- **AND** a notification states that it was paused
- **AND** the page states the pipeline as paused without a reload

#### Scenario: The confirmation states what a pause does and does not do

- **WHEN** a full admin activates the pause control
- **THEN** the confirmation states that input stops being consumed and that the backlog grows until resumed
- **AND** it states that the pipeline stays enabled and its definition is unchanged
- **AND** it states that the pause does not survive a restart of the runtime service

#### Scenario: Resuming takes no confirmation

- **GIVEN** a full admin on a paused pipeline
- **WHEN** the user activates the resume control
- **THEN** the pipeline is resumed without a confirmation step
- **AND** a notification states that it was resumed

#### Scenario: A pause is offered while the form has unsaved edits

- **GIVEN** a pipeline with one field edited and the `Discard` / `Save` bar offered
- **WHEN** a full admin opens the `Runtime` tab
- **THEN** the delete and enable/disable controls have stepped aside for the change bar
- **AND** the pause control is still presented and actionable

#### Scenario: A request in flight cannot be issued twice

- **WHEN** a full admin confirms a pause and the request has not yet answered
- **THEN** the control states that the request is in progress and is not actionable

#### Scenario: A refused pause reports the service's own message

- **GIVEN** the runtime service refuses the pause
- **WHEN** a full admin confirms it
- **THEN** an error notification carries the service's message and its request id
- **AND** the pipeline is not presented as paused

#### Scenario: Pausing is not offered to a caller who is not a full admin

- **GIVEN** a caller who is not a full admin
- **WHEN** the user opens the pipeline detail view
- **THEN** no pause or resume control is presented

### Requirement: A paused pipeline states its pause above the tab strip

While a pipeline is paused, a banner SHALL render between the identity row and the tab strip, stating that
the pipeline is paused, how long it has been paused, that input is still arriving and that the backlog it
builds is worked through on resume. The banner SHALL carry a resume control.

The banner SHALL distinguish the two origins the runtime service reports, because they call for opposite
responses:

- an **operator** pause is a decision, and it never expires — it is lifted only by someone resuming it;
- a **breaker** pause was taken by the service's own dead-letter circuit breaker, and it lifts itself. The
  banner SHALL state when it lifts.

A **breaker** pause SHALL additionally state the reason the service recorded when it took the pause. That
reason names the evidence the breaker tripped on — how many of the last N units of work were
dead-lettered — which is the first thing a reader needs and the one fact the banner cannot derive. It
SHALL be presented as the service worded it and SHALL NOT be re-phrased: the threshold and the window are
the service's configuration, and a console that restated them would be quoting a copy.

An **operator** pause SHALL NOT state a reason. The service records a fixed string for it that says only
that an operator paused the pipeline, which the banner already states by naming the origin, so presenting
it would be the same sentence twice.

The banner SHALL NOT name who paused the pipeline. The runtime service records the origin and the reason it
wrote at the time, and no user identity, so a name in this banner could only be invented.

A pipeline the runtime service does not report as paused SHALL raise no banner, and a pipeline whose
runtime could not be read SHALL raise none either: a banner is a statement that the pipeline is stopped,
and an unread runtime does not support it.

#### Scenario: An operator pause is stated as one that will not lift itself

- **GIVEN** a pipeline the runtime service reports as paused by an operator
- **WHEN** a full admin opens its detail view
- **THEN** a banner states that the pipeline is paused and how long it has been
- **AND** it states that input keeps arriving and is worked through on resume
- **AND** it offers a resume control
- **AND** it states no reason

#### Scenario: A breaker pause states when it lifts

- **GIVEN** a pipeline the runtime service reports as paused by its circuit breaker, with the time it
  resumes
- **WHEN** a full admin opens its detail view
- **THEN** the banner states that the pause was taken by the service rather than by an operator
- **AND** it states when the pause lifts by itself

#### Scenario: A breaker pause states the evidence it tripped on

- **GIVEN** a pipeline the runtime service reports as paused by its circuit breaker, with a recorded
  reason
- **WHEN** a full admin opens its detail view
- **THEN** the banner presents that reason as the service worded it

#### Scenario: The banner names no author

- **GIVEN** a paused pipeline
- **WHEN** a full admin opens its detail view
- **THEN** the banner attributes the pause to no named user

#### Scenario: No banner without a read runtime

- **GIVEN** the runtime service did not answer
- **WHEN** a full admin opens a pipeline's detail view
- **THEN** no pause banner is presented

### Requirement: Runtime status is stated beside configuration status

The pipeline detail header states two facts that are commonly confused and are not the same axis: whether
the pipeline is **enabled**, which is its declaration, and what the runner is doing with it, which is its
runtime. The header SHALL state both, the runtime status as a chip beside the enabled badge.

Runtime status SHALL be stated **only for an `enrich` pipeline**, which is the kind the runner drives.
An `aggregate` pipeline is run by the registry service itself, on its own scheduler — it is absent from
the runner's listings by construction, and reading that absence as a fault flagged every healthy rollup
as one nothing was running. For an aggregate pipeline the console SHALL state no runtime status, raise
no warning about one, and offer no pause: the runner would accept a pause for it and answer success,
but only the runner's own executors consult that registry, so nothing would stop.

For an `enrich` pipeline the runtime status SHALL be derived from **two** reads of the runtime service,
taken together:

- the pipelines it has **taken on** — it admits one only when the pipeline is enabled and it can execute
  that declaration, and it schedules the recurring work from exactly that set;
- the pipelines it has **paused**.

From those, three states are stateable, and no other:

| State | Condition |
| --- | --- |
| `running` | taken on, and not paused |
| `paused` | paused |
| `not running` | enabled, an `enrich` pipeline, and **not** taken on |

`running` SHALL mean that the runner has the pipeline and schedules its fires — **not** that rows are
moving through it at this moment. Neither service reports that, and the console SHALL NOT imply it.

The third state is the one the registry cannot show: an enabled pipeline the runner has not taken on is
presented by the registry exactly like a healthy one, while nothing is driving it — the runner either
refused the declaration as one it cannot execute, or has not synced since it started. The console SHALL
state it as a **warning above the tab strip**, not as a chip alone, and SHALL say both possible causes,
since it cannot tell them apart from outside. It SHALL NOT offer to pause such a pipeline: there is no
work to withhold.

The two reads SHALL fail **independently**. The pauses are load-bearing: without them the console
states no runtime at all. The cache listing only adds `not running`, so where it is missing — an older
runner build, a route that answers 404 — the console SHALL keep stating `running` and SHALL keep
offering the pause, rather than withholding every runtime affordance because one of two reads failed.
It SHALL NOT state `not running` on an unread cache: that would withhold the pause on a guess.

The runtime chip SHALL be withheld — not rendered as unknown — when the pipeline is disabled, when the
pauses could not be read, or when the caller is not a full admin. A disabled pipeline has no runtime answer: the runner
is not driving it at all, and stating it as "not running" would read as a fault where there is a
configuration.

A paused pipeline SHALL still be stated as **enabled**. Pausing leaves the declaration untouched, and a
console that showed a paused pipeline as disabled would send an operator to re-enable something that was
never disabled.

#### Scenario: A running pipeline states both facts

- **GIVEN** an enabled pipeline the runtime service does not report as paused
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled and that it is running

#### Scenario: A paused pipeline is still enabled

- **GIVEN** an enabled pipeline the runtime service reports as paused
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is enabled
- **AND** it states that it is paused

#### Scenario: An aggregate pipeline states no runtime status

- **GIVEN** an enabled `aggregate` pipeline, which the registry service runs on its own scheduler
- **WHEN** a full admin opens its detail view
- **THEN** no runtime chip is presented
- **AND** no warning states that nothing is running it
- **AND** no pause control is offered

#### Scenario: An enabled enrichment pipeline the runner has not taken on is flagged

- **GIVEN** an enabled `enrich` pipeline the runtime service does not report among the ones it has taken on
- **WHEN** a full admin opens its detail view
- **THEN** a warning states that nothing is running the pipeline
- **AND** it states that the service either cannot execute the declaration or has not picked it up yet
- **AND** no pause control is offered

#### Scenario: A disabled pipeline states no runtime status

- **GIVEN** a pipeline whose `enabled` is false
- **WHEN** a full admin opens its detail view
- **THEN** the header states that it is disabled
- **AND** no runtime chip is presented

#### Scenario: An unread runtime states no runtime status

- **GIVEN** the runtime service did not answer
- **WHEN** a full admin opens an enabled pipeline's detail view
- **THEN** the header states that it is enabled
- **AND** no runtime chip is presented

### Requirement: The Runtime tab presents the pipeline's dead-lettered failures

A **model-calling** enrichment dead-letters the work it could not finish, and the runtime service serves
those items per pipeline. The console SHALL present them on the **Runtime** tab, in a single
**Failures** card below the schedule and state cards, and SHALL NOT file them under a tab of their own:
the pause a dead-letter burst triggers is already stated on this page, and the failures are the reason
for it.

The card SHALL be presented for a model-calling enrichment and for **no other kind**. A SQL enrichment
and an aggregate are all-or-nothing — the statement either applies to the whole batch or fails it — so
their failure is the run's, reported as `last_error` and presented as this requirement's sibling states.
A per-row queue of them would list either nothing or everything, and in neither case would a single row
be the thing to act on.

The card SHALL open collapsed, as a summary of the pipeline's failures:

- the **total**, and the time of the newest failure stated as an age;
- the **retryable** and the **not-retryable** counts, each saying in a phrase what the split means, with
  the bulk retry offered on the retryable one and nothing offered on the other.

Those figures SHALL be the **service's own counters**, which it reports with every page of the listing
and counts over the whole filter in the page's own snapshot. The console SHALL NOT derive them from the
rows it holds: the listing is paged, so the rows are a window, and a total taken from them would
describe the window.

The summary SHALL describe **the pipeline**, not the grid. A path or a run chosen inside the card
narrows the rows listed beneath it and SHALL NOT change the total, the age of the newest failure or the
retryable split above them: those answer what is wrong with this pipeline, and a headline that fell from
sixty to ten because the reader looked at one path would be reporting the filter. The console SHALL
therefore read the summary unnarrowed, and SHALL re-read it whenever a re-run changes what the pipeline
holds.

The card SHALL NOT present a breakdown of the failures by stage, and the grid SHALL NOT offer a stage
filter. The stage of each failure is stated on its own row, which is where it is acted on; a
proportional bar above the card and a row of chips inside it are a second and a third place to read the
same facts, and neither tells an operator anything the rows do not.

Whether an item can be re-run SHALL be taken from the service's own flag and **SHALL NOT be predicted**.
The service refuses a second class of item at requeue time — one whose archived payload predates the
evaluator fold — but it decides that on the payload, which it does not serve, and no served member
stands in for it: the declaration revision an item carries was renamed into that column by a migration
that deliberately left the rows alone, so a pre-fold item shows an ordinary-looking revision there. The
console SHALL offer the re-run and report the refusal the service answers with.

A dead letter's **path** SHALL be derived from the run it names: an item naming a backfill run came from
that replay, an item naming none came from the live path.

A dead letter's **scope** — whether re-running it re-runs a chunk, a single row, or only the write-back —
SHALL be derived from the stage and the grain key, and SHALL be presented **only for a pipeline whose
trigger is not a group**. On a group pipeline the grain key carries the group key, which makes the same
derivation state the opposite of the truth; the service exposes nothing else that distinguishes them, so
the console SHALL omit the value rather than compute one it cannot stand behind.

The **Runtime tab SHALL carry an error mark** once the failures have been read and there is at least
one, so a reader on `Properties` sees that there is something to act on without opening the tab. A mark
rather than a number: the strip answers whether something is wrong, which is a severity, and the tab
strip's own count badge is drawn in the accent — a quantity worth noticing rather than a fault — with
no way to re-colour it.

Because the mark is decorative to assistive technology, the count SHALL be stated in text beside the
strip as a status. A fault signalled by colour alone is signalled to nobody.

The card SHALL be presented only where the failures can be read at all: a caller who is not a full admin
is issued no runtime request, an installation with no runtime host has none to issue, and a deployment
with analytics disabled renders neither the tab strip nor the tab the answer would reach.

#### Scenario: Failures are summarized on the Runtime tab

- **GIVEN** a model-calling enrichment with dead-lettered items
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** a failures card states the total and the age of the newest failure
- **AND** it states how many items are retryable and how many are not
- **AND** both figures are the ones the service counted, not a count of the rows on screen

#### Scenario: A SQL enrichment has no failures card

- **GIVEN** an enrichment pipeline whose transform is SQL
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no failures card is presented
- **AND** no request is issued for its dead letters

#### Scenario: An aggregate has no failures card

- **GIVEN** an aggregate pipeline
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no failures card is presented
- **AND** its run-level failure is presented as this tab's own failures group

#### Scenario: No stage breakdown and no stage filter are presented

- **GIVEN** a pipeline whose failures span several stages
- **WHEN** a full admin opens the failures card and expands it
- **THEN** no breakdown of the failures by stage is presented
- **AND** no control filters the rows by stage
- **AND** each row still states its own stage

#### Scenario: An item the service may still refuse is offered and the refusal reported

- **GIVEN** a dead letter the service marks requeueable whose archived payload it would refuse
- **WHEN** the failures card is presented
- **THEN** the item is counted as retryable and offered a re-run
- **AND** activating it reports the refusal the service answered with

#### Scenario: Scope is withheld on a group pipeline

- **GIVEN** a pipeline whose trigger is a group
- **WHEN** a dead letter's detail is opened
- **THEN** no scope is stated for it

#### Scenario: The tab marks that something has failed

- **GIVEN** a model-calling enrichment with dead-lettered items
- **WHEN** a full admin opens the detail view on `Properties`
- **THEN** the `Runtime` tab carries an error mark
- **AND** the number of failures is stated in text beside the tab strip

#### Scenario: No failures read where its answer could not be presented

- **GIVEN** a deployment with analytics disabled
- **WHEN** a full admin opens a model-calling enrichment's detail view
- **THEN** no request is issued for its dead letters

### Requirement: Dead-lettered failures are listed in a grid inside the failures card

Activating the card's expand control SHALL open a grid of the failures **inside the same card**, under
the summary, and SHALL change the control to withdraw it again. The expansion SHALL be stated
programmatically, not by the label alone. No overlay SHALL be opened for it: the card is already on the
page the reader asked for, and a sheet over it would hide the pause and the state it has to be read
against.

The grid SHALL carry a filter row of two controls:

- a **path** control choosing live, backfill, or both. It SHALL narrow the request rather than the
  loaded rows, because the service applies it before it pages: filtering locally would narrow one page
  and call the result the path's failures. **Every path** SHALL be the initial choice. The control
  SHALL be named for assistive technology without repeating that name on screen beside its three
  self-describing values.
- a **search** over the failure message and the grain key, applied to the rows loaded so far. Its
  placeholder SHALL name those two fields rather than restating where the reader is: a term that
  matches nothing is usually one typed for a field the search does not read. The field SHALL be open
  rather than behind a toggle, so the term and the control that holds it cannot outlive each other.

When a **run filter** is in force the path control SHALL be replaced by a dismissible indicator naming
that run, and the request SHALL carry the run rather than a path: the service refuses a request that
names both the live path and a run, and a run's items are backfill items by definition.

The grid SHALL present, for each failure: when it failed, as an age with the exact time reachable; the
stage, marked by a colour and named; the failure message on one line; and, for a retryable item, a
re-run control. A not-retryable row SHALL offer no control in its place rather than a disabled one.

Rows SHALL be ordered newest first, as the service returns them.

The listing SHALL be **paged**. The grid SHALL ask for one page at a time and append the next when the
reader scrolls to the end of what is loaded, carrying the cursor the previous page answered with. A
page that does not arrive SHALL stop the walk rather than being asked for again on every further
scroll. Changing the path or the run SHALL start a new walk from the newest item, because a cursor
means "older than this item" in whatever set is being read and continuing one across filters would
place the reader in a set they never saw.

Activating a row anywhere but on its **two control cells** SHALL open or close that row's detail. The
chevron and the re-run control are excluded, each because the cell carries its own action: the service
that draws the grid listens for a click on the row itself, below the point where the console's own
handlers run, so a chevron left in both toggles twice and cancels itself out.

#### Scenario: The failures grid opens inside the card

- **WHEN** a full admin activates the card's expand control
- **THEN** a grid of the failures is presented inside the same card
- **AND** the control states that the card is expanded
- **AND** no overlay or side sheet is opened

#### Scenario: The path filter narrows the request

- **GIVEN** the failures grid, showing every path
- **WHEN** the user chooses the backfill path
- **THEN** the failures are read again for that path
- **AND** the rows presented are the ones the service returned for it

#### Scenario: The card summarizes every path, not just the live one

- **GIVEN** a pipeline whose failures are split between the live path and a backfill run
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** the card's total counts both
- **AND** the path control states that every path is selected

#### Scenario: The chevron opens the detail exactly once

- **GIVEN** the failures grid
- **WHEN** the user activates a row's chevron
- **THEN** that row's detail is presented
- **AND** activating the chevron again withdraws it

#### Scenario: A scroll to the end of the listing asks for the next page

- **GIVEN** the failures grid showing a page the service reports more after
- **WHEN** the reader scrolls to the end of what is loaded
- **THEN** the next page is read and appended beneath it
- **AND** a scroll that does not reach the end asks for nothing

#### Scenario: Changing the filter starts a new walk

- **GIVEN** the failures grid with several pages loaded
- **WHEN** the reader chooses a different path
- **THEN** the listing restarts from that path's newest item
- **AND** no cursor from the previous walk is sent

#### Scenario: Narrowing the grid does not move the summary

- **GIVEN** the failures card of a pipeline holding failures on both paths
- **WHEN** the user narrows the grid to one path
- **THEN** the rows listed are that path's
- **AND** the total, the age of the newest failure and the retryable split are unchanged

#### Scenario: The search narrows the loaded rows

- **GIVEN** the failures grid
- **WHEN** the user opens the search and enters a term
- **THEN** only the rows whose message or grain key contains it are presented

#### Scenario: A run filter replaces the path control

- **GIVEN** the failures grid filtered to one backfill run
- **THEN** the path control is replaced by a dismissible indicator naming the run
- **AND** the request carries the run and no path
- **AND** dismissing the indicator restores the path control

#### Scenario: A not-retryable row offers no re-run

- **GIVEN** a failure the console presents as not retryable
- **WHEN** its row is presented
- **THEN** no re-run control is offered on it

### Requirement: A dead letter's detail is opened in place

Activating a failure's row SHALL open its detail as a full-width region directly beneath it, inside the
grid, and activating it again SHALL close it. The detail SHALL state, as labelled values: the item's
identifier, with a control that copies it; its scope and what re-running it would re-run, where a scope
is stated at all; its path; the run that produced it, where it has one, as plain text rather than a link,
because the console has no page for a run; its grain key, or what the absence of one means; and the
declaration revision it was recorded against.

The detail SHALL state the **failure message in full**, wrapped rather than truncated, with a control
that copies it. A message that reports several validation failures at once SHALL be presented as one
line per failure rather than as a single run-on line. A failure the service recorded **no** message for
SHALL say so: the column is nullable and some exceptions carry none, and a blank where a message
belongs reads as a rendering fault.

For a failure from a backfill run the detail SHALL additionally offer to narrow the grid to that run,
and to re-run every retryable failure of that run. The first SHALL be withheld when that run's filter is
already in force. The second SHALL be offered on the **run's** own population rather than on this row's
— a poison row opened first must not hide an action that would re-run four hundred others — and its
count SHALL be the service's answer for that run, the same number the confirmation then states.

#### Scenario: A failure's detail opens beneath its row

- **WHEN** the user activates a failure's row
- **THEN** its detail is presented directly beneath that row
- **AND** the row states that it is expanded
- **AND** activating the row again closes the detail

#### Scenario: The detail states the item's identity and message in full

- **GIVEN** an open failure detail
- **THEN** the item's identifier is stated with a control that copies it
- **AND** the failure message is presented in full, wrapped, with a control that copies it

#### Scenario: A multi-part validation message is presented one failure per line

- **GIVEN** a failure whose message reports several validation failures at once
- **WHEN** its detail is opened
- **THEN** each failure is presented on its own line

#### Scenario: A backfill failure's run is named but not linked

- **GIVEN** an open detail of a failure produced by a backfill run
- **THEN** the run is stated as plain text
- **AND** it is not presented as a link

#### Scenario: A failure with no message says so

- **GIVEN** a dead letter the service recorded no message for
- **WHEN** its detail is opened
- **THEN** the detail states that no message was recorded
- **AND** nothing on the card fails to render

#### Scenario: The run re-run is offered from a row that cannot be re-run on its own

- **GIVEN** an open detail of a failure the service stored no payload for, in a run that has others
- **THEN** the control that re-runs the run is offered
- **AND** it states the count the service answered for that run

#### Scenario: A backfill failure offers to narrow the grid to its run

- **GIVEN** an open detail of a failure produced by a backfill run, with no run filter in force
- **WHEN** the user activates the control that filters by that run
- **THEN** the grid is narrowed to that run
- **AND** the control is no longer offered while that filter is in force

### Requirement: A dead-lettered failure can be re-run

The console SHALL offer three re-runs, each sending exactly what the reader asked for:

- **one failure**, from its row. This is a single reversible act on one item, so it SHALL be sent
  without confirmation.
- **every retryable failure of the pipeline**, from the card's retryable tile.
- **every retryable failure of one backfill run**, from a failure's detail.

Both bulk re-runs SHALL be confirmed in a **dialog**, the way the console already confirms a pause and a
delete. A bulk re-run reaches items the reader cannot see, which is more than a tile has room to say and
more than a reader should have to infer from a count; the dialog is where that is stated in sentences.

A bulk re-run SHALL be sent for the **pipeline**, and for the run where a run is named — never for the
filters the grid happens to be showing. The service selects the items itself and re-runs every matching
one, so a dialog that implied the on-screen rows would mis-state what was about to happen. Each dialog
SHALL therefore state:

- how many items it will send;
- that the selection is the whole pipeline — or the whole run — and **not** what the grid is filtered to,
  naming the filters in force when there are any, so the mismatch is stated rather than discovered;
- for a run, that the items return to the ordinary queue rather than as a continuation of the replay,
  and that they compete with the pipeline's live work while they drain;
- **when the pipeline is paused**, that the re-run items wait in the queue until it is resumed. A re-run
  into a paused pipeline is accepted and does nothing visible, and an operator who has just paused a
  pipeline because of these failures is exactly the one about to ask for it.

No other overlay SHALL be open when one of these dialogs is: the failures card and its grid are page
content rather than a layer, so the dialog is the only layer in play.

After any re-run the console SHALL read the failures again — **whether or not it succeeded**. A refusal
of one item can mean the item is already gone, re-run by the retention sweep or by whoever else has the
page open, and a listing left untouched then invites the same click again.

The console SHALL report the outcome as a status message rather than silently: how many items were sent
back, the paused caveat where it applies, and — when fewer were sent than were asked for — that the
remainder could not be re-run. The service skips what it refuses rather than failing the batch, so a
count lower than the request is an ordinary outcome and not an error.

#### Scenario: One failure is re-run without confirmation

- **GIVEN** a retryable failure's row
- **WHEN** the user activates its re-run control
- **THEN** that item alone is sent back to the queue
- **AND** no confirmation is presented first
- **AND** the failures are read again

#### Scenario: A bulk re-run is confirmed in a dialog

- **GIVEN** the failures card with retryable items
- **WHEN** the user activates the bulk re-run
- **THEN** a dialog is presented, stating how many items it will send
- **AND** cancelling it sends nothing

#### Scenario: A bulk re-run sends the pipeline, not the filtered rows

- **GIVEN** the failures grid narrowed by a search term
- **WHEN** the user activates the bulk re-run
- **THEN** the dialog states that the whole pipeline is re-run and names the filter that is in force
- **AND** confirming it sends a request naming the pipeline and no filter

#### Scenario: A run's failures are re-run from a failure's detail

- **GIVEN** an open detail of a failure produced by a backfill run
- **WHEN** the user activates the control that re-runs that run's failures and confirms it
- **THEN** the request names the pipeline and that run
- **AND** the dialog stated that the items return to the ordinary queue rather than as a
  continuation of the replay, competing with the pipeline's live work

#### Scenario: A re-run into a paused pipeline says the items will wait

- **GIVEN** a paused pipeline with retryable failures
- **WHEN** the user activates a bulk re-run
- **THEN** the dialog states that the items wait in the queue until the pipeline is resumed

#### Scenario: A partial re-run states what was left

- **GIVEN** a bulk re-run of ten items of which the service re-runs seven
- **WHEN** it answers
- **THEN** a status message states that seven were sent back and that the rest could not be re-run
- **AND** it is not presented as a failed action

### Requirement: The failures card states why it has nothing to show

The card SHALL distinguish the reasons it is empty, because they call for different acts:

- **no failures at all** — the card SHALL NOT be rendered. A heading over an empty card states that
  something is missing, where the truth is that nothing has failed; this is the same rule the schedule
  group follows on a pipeline that has no schedule. The card SHALL likewise be absent before the first
  read has answered, so it does not appear as an empty frame and then fill.
- **none on the chosen path, but some on another** — the card SHALL say so and SHALL offer to widen the
  path.
- **none matching the search** — the card SHALL say so and SHALL offer to clear it.
- **none left in the filtered run** — the card SHALL say so and SHALL offer to clear the run filter.
- **the read failed** — the card SHALL state that the failures could not be read and SHALL offer to read
  them again. It SHALL NOT present a failed read as "no failures": on a failure listing the two are
  opposite conclusions and the quiet one is the dangerous one.
- **no runtime service is configured** — the card SHALL be absent, and nothing SHALL be called a
  failure. An installation without a runner is a deployment choice; the console already treats it as
  indistinguishable from one whose runner did not answer for every other runtime affordance, and an
  error with a retry that can never succeed is the one reading that choice does not support.

Each of these SHALL be announced to assistive technology rather than only drawn, so a reader who changed
a filter learns the result without hunting for it.

#### Scenario: A pipeline with no failures draws no card

- **GIVEN** an enrichment pipeline the service reports no dead letters for
- **WHEN** a full admin opens its `Runtime` tab
- **THEN** no failures card is rendered
- **AND** no heading for one is rendered in its place

#### Scenario: The card does not appear before the read answers

- **GIVEN** a model-calling enrichment whose failures have been asked for and not yet answered
- **WHEN** the `Runtime` tab is rendered
- **THEN** no failures card is rendered
- **AND** it appears only once the service has reported a count

#### Scenario: An empty live path offers to widen it

- **GIVEN** a pipeline whose failures are all from backfill runs
- **WHEN** the user narrows the failures grid to the live path
- **THEN** it states that there are no live failures
- **AND** it offers to show every path

#### Scenario: A search that matches nothing offers to clear itself

- **GIVEN** the failures grid with a search term entered
- **WHEN** no loaded row matches it
- **THEN** the grid states that no failure matches the filters
- **AND** it offers to clear them

#### Scenario: An unconfigured runtime service raises no card and no error

- **GIVEN** no runtime service host is configured
- **WHEN** a full admin opens a model-calling enrichment's `Runtime` tab
- **THEN** no failures card is presented
- **AND** nothing states that the failures could not be read

#### Scenario: A run emptied by a re-run says so

- **GIVEN** the failures grid filtered to one run, whose every failure has been re-run
- **WHEN** the failures are read again
- **THEN** the grid states that no failure is left in that run
- **AND** it offers to clear the run filter

#### Scenario: A failed read is not presented as no failures

- **GIVEN** the runtime service refuses the failures read
- **WHEN** the failures card is presented
- **THEN** it states that the failures could not be read
- **AND** it offers to read them again
- **AND** it does not state that there are no failures

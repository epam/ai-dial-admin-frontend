## ADDED Requirements

### Requirement: Pipelines page route and access guard

The system SHALL expose an Analytics page at `/pipelines`, present in the `ApplicationRoute` enum
(`types/routes.ts`) as `AnalyticsPipelines`, with the route directory `src/app/[lang]/pipelines/`. The page
SHALL be a server component declaring `export const dynamic = 'force-dynamic'` that calls
`isAnalyticsForbidden()` before any data access and renders `Page403` when it returns `true`, matching the
guard the Tables, Queries, and Conversations pages already use. User-facing strings SHALL read "Pipelines".

The listing view SHALL be seeded from an **unfiltered** server-side fetch, so the page opens showing every
registered pipeline — both kinds, enabled and disabled alike. Narrowing is the user's explicit act, because
the question the page exists to answer ("is this table's pipeline missing, or registered but switched off?")
is unanswerable from a view that hides disabled pipelines by default.

A registry holding no pipelines is an ordinary state and SHALL render as the console with an empty grid. A
**failed** listing fetch SHALL also render the console, with the load failure stated on the page, and SHALL
NOT resolve to a not-found result. A not-found page conflates three conditions an operator needs to tell
apart — nothing registered, the service unreachable, and the route absent — which is the confusion this page
exists to remove. The stated failure SHALL clear once a subsequent fetch succeeds.

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
- **THEN** the console still renders, reporting that the pipelines could not be loaded
- **AND** the page does not resolve to a not-found result

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

The console distinguishes a refusal from a failure — a refused read resolves to no value where a failed one
resolves to a null — and the pipelines pages SHALL preserve that distinction rather than collapsing both
into a load failure. A refused listing or a refused pipeline read SHALL render `Page403`. Reporting a refusal
as "the pipelines could not be loaded" states the wrong cause and sends the operator to check a service that
is working.

This is stated as a fallback rather than as the intended end state: the service is expected to restore
read access to a read-only caller, at which point such a caller reads the pipeline through the same
read-only presentation the pages already apply, and this requirement stops being reachable.

#### Scenario: A refused listing renders the forbidden page

- **WHEN** the pipelines listing is refused by the service
- **THEN** `Page403` is rendered
- **AND** no load-failure message is presented

#### Scenario: A refused pipeline read renders the forbidden page

- **WHEN** reading one pipeline is refused by the service
- **THEN** `Page403` is rendered

#### Scenario: A failed read is still reported as a failure

- **WHEN** the pipelines listing fails for a reason other than refusal
- **THEN** the console renders with the load failure stated
- **AND** `Page403` is not rendered

### Requirement: Pipelines listing grid presents both kinds

The Pipelines page SHALL render the fetched pipelines as one grid holding both kinds, seeded in the order
the service returned them — that order is total, so no client-side sort is applied by default. Narrowing and
reordering are the grid's own affordances: every data column SHALL remain sortable and filterable through the
grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar. Because the listing
is unpaged, those controls act on the whole registry.

Columns SHALL be: **name**, **kind**, **target**, **inputs**, **trigger**, **evaluator**, **enabled**,
**generation**, and **updated at**.

The grain key and the version column are **not** among them. The service resolves those two — and the
inlined evaluator definition — only for a listing narrowed to one kind; a cross-kind listing is deliberately
left unresolved, because resolving an aggregate pipeline would cost lookups for fields it has none of. A
column that could only ever be empty here is not offered, and both are read on the pipeline itself.

- The **name** cell SHALL navigate to that pipeline's detail route, `/pipelines/{name}`, while rendering as
  plain text rather than as a link: the name is a value an operator reads and compares across rows, and
  styling every one as a link makes the column harder to scan.
- The **kind** cell SHALL present the kind as a badge. Kind SHALL NOT be carried by colour alone.
- The **trigger** cell SHALL show the trigger kind as a badge and nothing else. A raw six-field cron says
  nothing at a glance, and the schedule and the grouping key are both stated on the pipeline's own page.
- The **evaluator** cell SHALL show `{evaluator_name}@{version}` and SHALL mark the pin as "latest" when the
  pipeline declares no `evaluator_version`. Both members are carried by a cross-kind listing. The **type
  badge** SHALL be shown only where the inlined evaluator definition is present, which is to say only where
  the listing was narrowed to one kind. The grid SHALL NOT issue a per-row evaluator request to recover it.
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

#### Scenario: Listing names the evaluator a pipeline declares

- **WHEN** the listing renders an enrichment pipeline pinned to version 4 of an evaluator
- **THEN** its evaluator cell shows the evaluator name with version 4
- **AND** no additional evaluator request is issued for that row

#### Scenario: The type badge waits for a resolved listing

- **WHEN** a cross-kind listing renders an enrichment pipeline
- **THEN** its evaluator cell carries no type badge
- **AND** the same pipeline listed under a single kind carries one

#### Scenario: An unpinned evaluator is marked latest

- **WHEN** the listing renders an enrichment pipeline that declares no `evaluator_version`
- **THEN** its evaluator cell marks the pin as "latest"

#### Scenario: An aggregate row leaves the enrichment column empty

- **WHEN** the listing renders an aggregate pipeline
- **THEN** its evaluator cell shows an em dash
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

### Requirement: Pipeline registration requires full-admin rights, and an enrichment one a registered evaluator

Registering and enabling a pipeline is `FULL_ADMIN`-only on the service, and a pipeline DTO carries no
per-entity `permissions` object of the kind table DTOs report. The console SHALL therefore gate the create
action on the caller's application role (`isFullAdmin` from `AppContext`) alone, and SHALL NOT attempt a
per-pipeline permission derivation. A caller who is not a full admin SHALL see the listing without a create
action.

Because evaluators are registered outside this UI, an enrichment pipeline cannot be created when none exist.
The create action SHALL nonetheless stay available to a full admin regardless of how many evaluators are
registered: the modal is where the shortage is visible and where submission is blocked, so gating the action
that opens it would hide the explanation behind a control the operator cannot reach. With no evaluator
registered the modal SHALL state that one must be registered through the API first, and SHALL block
submission **of an enrichment pipeline only** — an aggregate pipeline declares no evaluator and SHALL remain
creatable. A failed evaluator listing SHALL be reported as a load failure rather than as "none are
registered", which would send the operator to register one they may already have.

#### Scenario: Non-admin sees no create action

- **WHEN** a caller who is not a full admin opens the listing
- **THEN** no create-pipeline action is offered

#### Scenario: The create action does not depend on the evaluator list

- **WHEN** a full admin opens the listing and the evaluator list is empty
- **THEN** the create action is still enabled and opens the create-pipeline modal
- **AND** the listing itself carries no note about the missing evaluator

#### Scenario: The modal explains a missing evaluator and blocks the enrichment kind

- **WHEN** the create modal is open with the enrichment kind selected and no evaluator is registered
- **THEN** it states that an evaluator must be registered through the API first
- **AND** submission is blocked

#### Scenario: An aggregate pipeline needs no evaluator

- **WHEN** the create modal is open with the aggregate kind selected and no evaluator is registered
- **THEN** submission is not blocked on that account

#### Scenario: A failed evaluator listing is not reported as an empty one

- **WHEN** the evaluator listing fails
- **THEN** the modal reports the load failure
- **AND** it does not state that no evaluator is registered

### Requirement: The create modal collects a complete pipeline of one kind in one request

The service has no draft state for a pipeline: it is created whole by a single `POST /v1/pipelines`. The
create modal SHALL therefore assemble a submittable pipeline in one pass.

It SHALL collect **only what a registration requires**. Everything a declaration may carry but need not is
edited on the pipeline's own page, where the target has resolved and there is room for it — the evaluator
version, the freshness mode, the read scope and the runtime knobs among them. A registration form that also
offers the optional members reads as a wall of controls whose necessity the operator has to work out.

**Name** and **kind** SHALL be presented first and always, because both kinds carry them and neither depends
on the other. Kind SHALL be **preselected** to the first kind: an unchosen pair of radios reads as a form
waiting for something it never names, and either kind can be switched before anything else is filled in.
Every field after the kind belongs to one kind or the other.

The modal SHALL be mounted only while open, so closing discards its state without a manual reset, following
the create-table popup.

For an **enrichment** pipeline the modal SHALL collect, in this order: **name**, **kind**, **evaluator**,
**trigger kind**, the conditional block for the selected trigger kind, **target**, and — once the editor can
be used — **output bindings**. Four of these are required by the service and all four SHALL be required to
submit:

- **name** — validated against the service's identity grammar, lower-case alphanumerics with hyphens and
  underscores, starting with a letter and no longer than 64 characters. Uniqueness is enforced by the
  service, not pre-checked here.
- **evaluator** — selected from the registered evaluators.
- **target** — selected from tables of type `enrichment`.
- **trigger kind** — one of `on_ingest`, `schedule`, `group`.

For an **aggregate** pipeline the modal SHALL collect: **name**, **kind**, **target**, **inputs**, the
**schedule**, **group keys** and **measures**. An aggregate pipeline's trigger is always a schedule, so the
trigger-kind control SHALL NOT be offered for it. Its **input** SHALL be collected here rather than deferred:
an aggregate target is a source table, which carries no parent to fall back on, and every control the
transform offers is scoped to that input's columns.

**Both kinds SHALL be registered not running.** The service stores an aggregate pipeline disabled whatever
the caller asks, and an enrichment pipeline is enabled from its own page, where its declaration can be read
back first. The modal SHALL therefore collect no **enabled** choice and SHALL send `false`, which the service
requires present for an enrichment registration rather than merely defaulted.

The **output bindings** editor SHALL be offered only once it can be used — that is, once both the evaluator
and the target have resolved. Before that it would be an optional-looking control with nothing to bind
against; the refusals it carries appear with it.

On success the modal SHALL close, show a success notification, and refresh the listing.

#### Scenario: Name and kind open the form

- **WHEN** the create modal is opened
- **THEN** the name and the kind are presented before the fields that belong to a kind
- **AND** the first kind is selected

#### Scenario: An enrichment pipeline needs its four required values

- **WHEN** the enrichment kind is selected with any of name, evaluator, target, or trigger kind unset
- **THEN** submission is blocked

#### Scenario: Both kinds are registered not running

- **WHEN** a pipeline of either kind is registered
- **THEN** no enabled choice was collected
- **AND** the request carries `enabled` as `false`

#### Scenario: The optional members are left to the detail page

- **WHEN** the create modal is opened
- **THEN** it offers no evaluator version and no freshness mode

#### Scenario: The bindings editor waits until it can be used

- **WHEN** an evaluator is selected and no target has resolved
- **THEN** no output-bindings editor is presented

#### Scenario: An aggregate pipeline offers no trigger kind

- **WHEN** the aggregate kind is selected
- **THEN** no trigger-kind control is presented
- **AND** a schedule is collected

#### Scenario: A name outside the identity grammar is refused

- **WHEN** the user enters a name carrying an upper-case letter or a leading digit
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: Modal state is discarded on close

- **WHEN** the user opens the modal, edits fields, and closes it
- **THEN** re-opening the modal shows a fresh, empty form

#### Scenario: Successful creation refreshes the listing

- **WHEN** creation succeeds
- **THEN** the modal closes, a success notification is shown, and the new pipeline appears in the listing

### Requirement: The selected kind determines which members are sent

The registry accepts one flat declaration for both kinds and rejects a member belonging to the other kind
with HTTP 422 rather than ignoring it. That rejection is what makes one flat shape safe, and the console
SHALL respect it: the request body SHALL carry only the members of the selected kind, whatever was entered
before the kind was changed. Hiding a control is not sufficient.

- `kind = enrich` — the body SHALL carry none of `group_by`, `measures`, or `freshness`.
- `kind = aggregate` — the body SHALL carry none of `evaluator_name`, `evaluator_version`, `input_bindings`,
  `output_bindings`, `sampling`, `cadence`, `batch_scan_limit`, `batch_chunk`, `rate_rpm`, or `priority`.

#### Scenario: Switching kind strips the abandoned members

- **WHEN** the user selects an evaluator, switches the kind to aggregate, and submits
- **THEN** the request body carries no `evaluator_name`

#### Scenario: An enrichment pipeline sends no aggregate members

- **WHEN** an enrichment pipeline is submitted
- **THEN** the request body carries none of `group_by`, `measures`, or `freshness`

#### Scenario: A cross-kind rejection is surfaced

- **WHEN** the service rejects a submission for a member belonging to the other kind
- **THEN** the service's message is shown
- **AND** the modal stays open with its values intact

### Requirement: The selected trigger kind determines which trigger members are sent

The service's trigger invariants run **both ways**: a member that belongs to the selected trigger kind is
required, and a member that does not belong to it is **rejected with HTTP 422 rather than ignored**. The
console SHALL therefore strip the members of every unselected branch from the request body — hiding a control
is not sufficient, because a value entered before the trigger kind was changed would otherwise still be
submitted. The trigger members nest under a single `trigger` object.

- `on_ingest` — the trigger SHALL carry none of `cron`, `group_by`, `ready_when`, or `member_select`.
- `schedule` — `cron` SHALL be required; `group_by`, `ready_when`, and `member_select` SHALL be absent.
- `group` — `group_by` and `ready_when` SHALL both be required; `cron` SHALL be absent. `member_select` is
  never required and is not collected by the create modal.

#### Scenario: Switching trigger kind strips the abandoned branch

- **WHEN** the user fills a cron expression, then switches the trigger kind to `group`, then submits
- **THEN** the trigger carries `group_by` and `ready_when` and carries no `cron`

#### Scenario: An on-ingest pipeline sends no trigger qualifiers

- **WHEN** the user submits an `on_ingest` pipeline
- **THEN** the trigger carries none of `cron`, `group_by`, `ready_when`, or `member_select`

#### Scenario: A schedule requires its cron

- **WHEN** the trigger kind is `schedule` and no cron expression has been provided
- **THEN** submission is blocked

#### Scenario: A group trigger requires its readiness declaration

- **WHEN** the trigger kind is `group` and no readiness condition has been provided
- **THEN** submission is blocked

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

### Requirement: The pipeline form resolves the evaluator and the target table on demand

Neither list response carries what the form needs: `GET /v1/evaluators` returns no version definitions, and
`GET /v1/tables` returns neither `grain` nor `columns`. Pipeline editing — in the create modal and on the
detail page alike — SHALL therefore read the full evaluator whenever the selected evaluator or its version
changes — the pinned version via `GET /v1/evaluators/{name}/versions/{version}`, "latest" via
`GET /v1/evaluators/{name}` — and the full target table via `GET /v1/tables/{name}` whenever the target
changes. Resolved values SHALL be cached by their key for as long as the surface is open, so re-selecting a
previously chosen evaluator, version, or table issues no second request.

Controls that depend on a resolution SHALL report a pending state while it is in flight rather than rendering
as empty, and a failed resolution SHALL be reported in the form rather than leaving a control silently
unpopulated.

#### Scenario: Selecting an evaluator resolves its variables

- **WHEN** the user selects an evaluator
- **THEN** its full definition is read and its `output_vars` become available to the output-bindings editor

#### Scenario: Pinning a version re-resolves

- **WHEN** the user changes the evaluator version from "latest" to a concrete version
- **THEN** that version is read and the available output variables are those of the pinned version

#### Scenario: Resolutions are cached

- **WHEN** the user selects a target, switches to another, and switches back
- **THEN** no second request is issued for the first table

#### Scenario: A failed resolution is reported

- **WHEN** reading the selected target table fails
- **THEN** the form reports the failure
- **AND** the controls that depend on that table do not present themselves as having no options

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

The kind SHALL be read from the pipeline and SHALL NOT be selectable on the detail page: it is fixed at
registration and the service refuses to change it.

The choice of section SHALL be the page's only branch on kind. A control that belongs to one kind SHALL live
inside that kind's section rather than being conditionally rendered among the shared ones, so the shared
frame stays kind-independent.

The enrichment section SHALL present the evaluator and its version, the variable bindings, and the execution
knobs. The aggregate section SHALL present the group keys, the measures and the freshness mode.

The **trigger** SHALL be stated above the collapsible sections rather than filed inside one. It belongs to
neither transform — an enrichment pipeline's trigger and an aggregate one's schedule are the same member —
and burying it under a heading would make when a pipeline runs the one fact the page hides.

The detail page SHALL present **every** editable member of a pipeline, so that a pipeline registered through
the API can be inspected and corrected in the console. Controls that the create modal already provides SHALL
be the same controls here, differing only in width and layout.

#### Scenario: An enrichment pipeline presents the enrichment section

- **WHEN** an enrichment pipeline is opened
- **THEN** its evaluator, variable bindings and execution knobs are presented
- **AND** no group keys, measures or freshness control is presented

#### Scenario: An aggregate pipeline presents the aggregate section

- **WHEN** an aggregate pipeline is opened
- **THEN** its group keys, measures and freshness mode are presented
- **AND** no evaluator, variable bindings or execution knobs are presented

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
`updated_at`, the runtime `state`, and — for an enrichment pipeline — `grain_key`, `version_column`, and the
resolved `evaluator` definition. The detail page SHALL present these as read-only, visually separated from
the editable form, so it is unambiguous which values an operator can change. `version_column` SHALL render as
an em dash when the read source declares no scan metadata.

The name SHALL be presented among the identity rather than among these facts, because it addresses the page.
Because quoting it elsewhere is a common need, it SHALL carry a copy control.

The **target** and the resolved **read source** SHALL be presented among these facts as well, each linking to
that table's own page. Both sit inside collapsible sections of the form, so without this the page could not
answer "which tables is this bound to" without a trip back to the listing; and an operator who asks that
question is usually on their way to the table itself.

A resolved evaluator SHALL link to that evaluator's detail page at the version the pipeline resolved to. The
pipeline states which evaluator runs but nothing about what it does, and this fact is where an operator
asking that question already is.

These members SHALL NOT be sent when the pipeline is saved.

#### Scenario: Derived facts are shown but not editable

- **WHEN** a pipeline is opened
- **THEN** its `generation`, `created_at` and `updated_at` are presented as read-only values

#### Scenario: An enrichment pipeline adds its resolved facts

- **WHEN** an enrichment pipeline is opened
- **THEN** its `grain_key` and resolved evaluator are presented as read-only values

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

#### Scenario: The resolved evaluator opens its own page

- **WHEN** the user activates the resolved evaluator on a pipeline pinned to version 2
- **THEN** the browser navigates to that evaluator's detail page addressing version 2

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

Two exceptions SHALL be constructed rather than carried over:

- the **trigger branch**, because the service rejects a member that does not belong to the selected trigger
  kind with HTTP 422 rather than ignoring it. Changing the trigger kind SHALL drop the previous kind's
  members from the request.
- the **read source** of an enrichment pipeline, which the service resolves and echoes back. Sending it back
  unchanged **declares** it, which is validated more strictly than following. See the read-source
  requirement.

Members the service refuses on write SHALL NOT be sent at all. The service now rejects an unrecognised
member with HTTP 400 naming it rather than dropping it silently, so echoing a read-only member back is a
failed save rather than a harmless one.

A successful save SHALL report success and re-read the pipeline, so the read-only facts — `generation` in
particular — reflect the accepted mutation. A failed save SHALL surface the service's own message and leave
the edited values intact.

#### Scenario: An unpresented member survives an unrelated edit

- **WHEN** a pipeline carrying a member the form does not present is opened, another member is changed, and
  it is saved
- **THEN** the request carries that member unchanged

#### Scenario: Switching trigger kind drops the previous branch

- **WHEN** a scheduled enrichment pipeline's trigger kind is changed to on-ingest and it is saved
- **THEN** the request carries no cron

#### Scenario: Read-only members are not sent

- **WHEN** a pipeline is saved
- **THEN** the request carries none of `generation`, `created_at`, `updated_at`, `state`, `grain_key`,
  `version_column`, or the resolved `evaluator`

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

The inference SHALL be presented rather than applied invisibly — the control SHALL offer an explicit choice
between following the target enrichment and pinning a named table, seeded from the inference, so an operator
can see and correct it. When following is selected, the table currently being followed SHALL be named.

An aggregate pipeline declares its input outright and SHALL present it as a plain selection with no
follow-or-pin choice.

#### Scenario: A following pipeline keeps following after an unrelated edit

- **WHEN** an enrichment pipeline whose input equals its target's `source_table` is opened, edited elsewhere,
  and saved
- **THEN** the request omits the input

#### Scenario: A pinned pipeline stays pinned

- **WHEN** an enrichment pipeline whose input differs from its target's `source_table` is saved
- **THEN** the request carries that input

#### Scenario: The inference is visible and correctable

- **WHEN** an enrichment pipeline is opened
- **THEN** the read-source control shows whether it is following or pinned
- **AND** the followed table is named when following is shown
- **AND** the operator can switch between the two

#### Scenario: An aggregate pipeline declares its input plainly

- **WHEN** an aggregate pipeline is opened
- **THEN** its input is presented as a selection with no follow-or-pin choice

### Requirement: Pipeline editing resolves the read source in addition to the evaluator and target

Input bindings read from an enrichment pipeline's **read source**, not from its target, and every SQL
predicate a pipeline admits is scoped to that source's columns. The read source is itself derived — it is
the declared input, or the target enrichment's `source_table` — so it cannot be resolved until the target is.

Pipeline editing SHALL therefore resolve three entities in a chain: the evaluator (for `input_vars`,
`output_vars`, and `type`), the target (for its columns, its `grain_key`, and its `source_table`), and the
read source (for its columns and its `version_column`). Controls scoped to the read source SHALL report a
pending state while it resolves and SHALL report a failed resolution rather than presenting themselves as
having no options.

An aggregate pipeline resolves its input directly and needs no evaluator resolution.

#### Scenario: Input bindings offer the read source's columns

- **WHEN** the read source resolves
- **THEN** the input-bindings editor offers that source's columns, not the target's

#### Scenario: Changing the target re-resolves the followed source

- **WHEN** the pipeline follows its target and the target is changed
- **THEN** the read source is re-resolved from the new target's `source_table`

#### Scenario: A failed source resolution is reported

- **WHEN** reading the resolved source table fails
- **THEN** the failure is reported
- **AND** the controls scoped to that source do not present themselves as having no options

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

### Requirement: Pipeline output bindings editor

`output_bindings` maps the evaluator's output variables onto the target table's columns; without it an
enrichment pipeline computes a result and discards it. The console SHALL collect it as a repeater whose every
row is a pair of selects: a **column**, from the resolved target table's `columns`, and a **variable**, from
the resolved evaluator version's `output_vars`.

- The editor SHALL enforce the one-to-one mapping by suppressing an already-chosen column or variable from
  its sibling rows' options. This guard is load-bearing rather than cosmetic: the service does not reject a
  duplicate, it silently drops a binding, so an unguarded duplicate produces a pipeline that quietly writes
  less than the operator specified.
- Each option SHALL display its type alongside its name. When a row pairs a column and a variable whose types
  disagree, the editor SHALL flag the row. The flag is advisory — the service remains the authority — and
  SHALL NOT by itself block submission.
- When the evaluator, the version, or the target table changes so that a chosen column or variable no longer
  exists, the editor SHALL **mark the affected rows as invalid and retain their values**, and MUST NOT clear
  them silently. A silent clear destroys work the operator has already done and gives no account of why.
- Before both an evaluator and a target table are chosen the editor SHALL render an empty state directing the
  operator to choose them, rather than an empty repeater.

At least one binding SHALL be required to submit when the resolved evaluator's `type` is `sql`, which the
service rejects outright without one. For an `llm` evaluator the service accepts a pipeline with no bindings,
and submission SHALL be allowed — but the console SHALL warn that such a pipeline computes results and stores
none, since that is a silent misconfiguration rather than a deliberate mode.

#### Scenario: Empty state before its inputs are chosen

- **WHEN** the form is open with no evaluator or no target selected
- **THEN** the output-bindings editor shows a prompt to select an evaluator and a target table

#### Scenario: A chosen column is withheld from sibling rows

- **WHEN** a row binds a target column
- **THEN** that column is not offered in any other row's column select

#### Scenario: A chosen variable is withheld from sibling rows

- **WHEN** a row binds an output variable
- **THEN** that variable is not offered in any other row's variable select

#### Scenario: A type mismatch is flagged but not blocking

- **WHEN** a row pairs a column and a variable of disagreeing types
- **THEN** the row is flagged with the mismatch
- **AND** submission is not blocked by that flag alone

#### Scenario: Changing the evaluator invalidates rather than clears

- **WHEN** filled rows exist and the user changes the evaluator to one lacking those output variables
- **THEN** the affected rows keep their values and are marked invalid
- **AND** no row is silently emptied

#### Scenario: A sql evaluator requires at least one binding

- **WHEN** the resolved evaluator's type is `sql` and no output binding has been added
- **THEN** submission is blocked

#### Scenario: An llm evaluator with no bindings warns

- **WHEN** the resolved evaluator's type is `llm` and no output binding has been added
- **THEN** the console warns that the pipeline will compute results and store none
- **AND** submission remains possible

### Requirement: Pipeline input bindings editor

An input binding maps one of the evaluator's `input_vars` to a value drawn from the read source, either as a
column or as a JSONata expression over the row. The two are alternatives: a binding SHALL carry a column or
an expression, never both.

The editor SHALL offer the evaluator's `input_vars` and the read source's columns, SHALL NOT offer a variable
already bound by another row, and SHALL report a row whose variable or column no longer exists on the
resolved evaluator or source — a pipeline can outlive the definitions it was written against. A row that is
incomplete SHALL be omitted from the saved pipeline rather than sent as a partial binding.

#### Scenario: A variable bound elsewhere is not offered again

- **WHEN** an input variable is already bound by one row
- **THEN** it is not offered in the other rows

#### Scenario: Column and expression are alternatives

- **WHEN** a row's binding is switched from a column to an expression
- **THEN** the column is cleared

#### Scenario: A stranded binding is reported

- **WHEN** a row binds a variable that the resolved evaluator no longer declares
- **THEN** that row is reported as unresolvable
- **AND** the stranded value remains visible rather than rendering as empty

#### Scenario: An incomplete row is not sent

- **WHEN** a row names a variable but neither a column nor an expression
- **THEN** the saved pipeline omits that binding

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

The console SHALL collect `idle` and `max_staleness`, and SHALL require at least one of the two before
submission. It SHALL also accept an optional `cost_ceiling`, constrained to a positive integer. `signal` — the
SQL-predicate form of readiness — is not collected by the create modal; the duration form alone yields a
valid pipeline.

Each duration SHALL be entered as a **number paired with a unit** and submitted in the service's short form
(for example `10` and minutes submitted as `"10m"`), rather than as free text, which offers nothing but a way
to mistype a format. When a duration control is seeded with an existing value it SHALL round-trip both
accepted spellings — the short form and the ISO-8601 form — and SHALL fall back to a raw text input holding
the value verbatim when it matches neither, rather than discarding a value written directly through the API.

#### Scenario: A group trigger needs at least one readiness condition

- **WHEN** the trigger kind is `group` and neither idle nor max staleness has a value
- **THEN** submission is blocked with a message that at least one is required

#### Scenario: A duration is submitted in short form

- **WHEN** the user enters 10 and selects minutes for idle
- **THEN** the request carries `trigger.ready_when.idle` as `"10m"`

#### Scenario: Cost ceiling must be a positive integer

- **WHEN** the user enters zero or a negative cost ceiling
- **THEN** the control reports it as invalid and submission is blocked

#### Scenario: An unrecognised duration is preserved verbatim

- **WHEN** a duration control is seeded with a value matching neither the short nor the ISO-8601 form
- **THEN** it presents that value in a raw text input
- **AND** the value is not discarded

### Requirement: A group trigger's grouping key is derived from the target enrichment's grain key

The trigger's `group_by` is a string in the API, but the service accepts exactly one value for an enrichment
pipeline: the target enrichment's own grain key. Anything else is rejected with HTTP 422. The constraint is
physical — an enrichment is keyed on its grain and collapses by it, so grouping by any other column would
pile many groups onto a single row.

The console SHALL therefore **derive** the trigger's `group_by` from the resolved target table's
`grain.grain_key` and present it read-only, captioned as the target table's grain key. It SHALL NOT be
offered as a free-text input, which could only produce a value the service rejects. The derived value SHALL
be re-read whenever the target changes.

This grouping key is the trigger's and is distinct from an aggregate pipeline's group keys, which name what
its rows are grouped by. The two SHALL NOT share a control.

#### Scenario: The grouping key is filled from the target's grain key

- **WHEN** the trigger kind is `group` and a target is selected
- **THEN** the grouping-key field shows that table's grain key and is not editable

#### Scenario: Changing the target re-derives the grouping key

- **WHEN** the user changes the target to one with a different grain key
- **THEN** the grouping-key field shows the new table's grain key

### Requirement: Member selection for a group trigger

A group trigger may declare how members of a group are chosen: a `prefer_sql` preference, an `order_by`
sequence of column and direction, and a `limit`. `limit` is required whenever member selection is declared at
all, and SHALL be a positive integer no greater than the service's configured group fetch maximum.

`prefer_sql` is a **preference, not a filter**: when no member satisfies it, every member becomes a
candidate. The control SHALL say so, because an operator reading it as a filter would expect an empty result
instead.

Member selection SHALL be presentable only for a group trigger, and SHALL be omitted entirely from the saved
pipeline when nothing has been declared.

#### Scenario: Declaring member selection requires a limit

- **WHEN** an order or preference is declared without a limit
- **THEN** the pipeline cannot be saved and the missing limit is reported

#### Scenario: Member selection is omitted when empty

- **WHEN** no member-selection member has been declared
- **THEN** the saved pipeline omits member selection entirely

#### Scenario: The preference is described as a preference

- **WHEN** the `prefer_sql` control is presented
- **THEN** it states that all members become candidates when none satisfies it

#### Scenario: Member selection is only offered for a group trigger

- **WHEN** the trigger kind is not group
- **THEN** member selection is not presented

### Requirement: An enrichment pipeline's execution knobs are presented without invented validation

An enrichment pipeline carries `sampling`, `cadence`, `batch_scan_limit`, `batch_chunk`, `rate_rpm`, and
`priority`. The service validates none of these beyond type, and the runner interprets `cadence`. The console
SHALL present them and SHALL NOT impose constraints the service does not, beyond `sampling` being a fraction
between 0 and 1 — a bound that follows from its meaning rather than from a guessed policy.

An empty knob SHALL be omitted from the saved pipeline rather than sent as a zero, because zero is a
meaningful value for several of them.

These members belong to the enrichment kind and SHALL NOT be presented for an aggregate pipeline.

#### Scenario: A cleared knob is omitted, not zeroed

- **WHEN** a numeric knob is cleared
- **THEN** the saved pipeline omits that member

#### Scenario: Sampling is bounded to a fraction

- **WHEN** a sampling value outside 0 to 1 is entered
- **THEN** it is reported as invalid and the pipeline cannot be saved

#### Scenario: An aggregate pipeline presents no execution knobs

- **WHEN** an aggregate pipeline is opened
- **THEN** none of these knobs is presented

### Requirement: A pipeline's SQL predicate fields are presented as bounded expressions

A pipeline admits four SQL predicates: the membership `filter`, the readiness `signal` of a group trigger,
the `prefer_sql` of its member selection, and the `where` of an individual aggregate measure. Each is a
boolean expression over the read source's columns in the same bounded grammar, and none admits a join, a
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

### Requirement: The aggregate section presents group keys, measures and a freshness mode

An aggregate pipeline's transform is the triple: what its rows are grouped by, what is computed for each
group, and how freshly the target is expected to track its input. The console SHALL present all three.

The **freshness mode** SHALL be a choice between `periodic` and `incremental`, presented with what each
means rather than as bare identifiers. It is optional; when nothing is chosen the member SHALL be omitted
rather than sent as a default the operator did not pick.

At least one group key and at least one measure SHALL be required before an aggregate pipeline can be
submitted: the service refuses a declaration without them, and a rollup that groups by nothing or computes
nothing has no meaning to fall back on.

#### Scenario: The three parts are presented together

- **WHEN** an aggregate pipeline is opened
- **THEN** its group keys, measures and freshness mode are presented

#### Scenario: A freshness mode explains itself

- **WHEN** the freshness control is presented
- **THEN** each mode is presented with what it means rather than as a bare identifier

#### Scenario: An unset freshness mode is omitted

- **WHEN** no freshness mode has been chosen
- **THEN** the saved pipeline omits the member

#### Scenario: Group keys and measures are both required

- **WHEN** an aggregate pipeline is submitted with no group key or no measure
- **THEN** submission is blocked and the missing part is named

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

The console SHALL hold no function knowledge of its own. The function list SHALL be derived from the catalog
the service already serves at `GET /v1/queries/functions`, narrowed to the functions a measure can express:

- the catalog's **aggregate** group, since a measure is an aggregate; and
- functions requiring **no more than one** argument, because a measure carries one column and nothing else.
  An aggregate declaring two required arguments cannot be expressed as a measure and the service refuses it,
  so offering it would build a declaration that fails on every run for a reason recorded only in its state.

`distinct` SHALL be offered only for a function the catalog marks as supporting it, and SHALL require a
column, since a column-less count is a row count with no values to deduplicate.

The column control SHALL be withheld only for a function that declares **no argument at all** — never for
one whose argument is merely optional. `count` declares one optional argument: called bare it is a row
count, and called with a column it counts that column's values, which is the only thing `distinct` has to
deduplicate. Reading "optional" as "takes no column" withholds the control that every rollup's
`count(distinct …)` measure needs, and leaves such a measure blocked with nothing on screen to fix it.

A measure's **name** is the target column it writes and SHALL be required. A function no longer present in
the catalog SHALL be reported on the row rather than silently cleared, following the bindings editors.

#### Scenario: Only expressible aggregates are offered

- **WHEN** the function control is opened
- **THEN** it offers the catalog's aggregate functions
- **AND** it does not offer a function requiring more than one argument

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

#### Scenario: A measure needs a name

- **WHEN** a measure is added without a name
- **THEN** submission is blocked and the missing name is reported

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

The sharpest case SHALL be understood as specified behaviour: deleting `evaluator_version` unpins an
enrichment pipeline from its pinned evaluator version and it resumes following the latest, with no error,
because the service accepts that request. Required members are the exception — the service rejects a request
omitting one, and that refusal surfaces as any other does.

#### Scenario: A member deleted from the document is erased from the pipeline

- **WHEN** the caller deletes an optional member from the document and saves
- **THEN** the saved pipeline no longer carries that member
- **AND** no confirmation was presented before the save

#### Scenario: Deleting the pinned evaluator version unpins the pipeline

- **WHEN** the caller deletes `evaluator_version` from the document and saves
- **THEN** the save succeeds
- **AND** the pipeline no longer pins an evaluator version

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

## REMOVED Requirements

### Requirement: Enrichment rules page route and access guard

**Reason**: The `/enrichment-rules` route is removed rather than redirected, and the listing it guarded now
shows both pipeline kinds.
**Migration**: See "Pipelines page route and access guard".

### Requirement: Enrichment rules listing grid

**Reason**: One grid now holds both kinds, addressed by name, with a kind column and per-kind columns that
read as an em dash on the other kind's rows.
**Migration**: See "Pipelines listing grid presents both kinds".

### Requirement: Rule creation requires full-admin rights and a registered evaluator

**Reason**: The evaluator precondition now applies to the enrichment kind alone; an aggregate pipeline
declares no evaluator and stays creatable without one.
**Migration**: See "Pipeline registration requires full-admin rights, and an enrichment one a registered
evaluator".

### Requirement: Create-rule modal collects a complete rule in one request

**Reason**: The modal now collects a kind first and a different required set per kind, and the service
ignores `enabled` for an aggregate registration.
**Migration**: See "The create modal collects a complete pipeline of one kind in one request".

### Requirement: The selected trigger kind determines which members are sent

**Reason**: The trigger members moved under a single `trigger` object, and cross-kind stripping is now a
second, separate concern beside the trigger branch.
**Migration**: See "The selected trigger kind determines which trigger members are sent" and "The selected
kind determines which members are sent".

### Requirement: The modal resolves the evaluator and the target table on demand

**Reason**: Restated for both surfaces and both kinds; an aggregate pipeline resolves its input without an
evaluator.
**Migration**: See "The pipeline form resolves the evaluator and the target table on demand".

### Requirement: Target enrichments already bound to a rule are not offered

**Reason**: One-writer-per-target is now registry-wide rather than enrichment-only, so the exclusion is
computed across both kinds.
**Migration**: See "Targets already bound to a pipeline are not offered".

### Requirement: Output bindings editor

**Reason**: Reworded for the pipeline vocabulary; the editor belongs to the enrichment section rather than to
the page.
**Migration**: See "Pipeline output bindings editor".

### Requirement: Six-field cron control for a scheduled rule

**Reason**: The control now also serves an aggregate pipeline's schedule, and the cron member moved under the
trigger object.
**Migration**: See "Six-field cron control for a scheduled trigger".

### Requirement: Readiness declaration for a group rule

**Reason**: Reworded for the trigger object, whose readiness member is now `trigger.ready_when`.
**Migration**: See "Readiness declaration for a group trigger".

### Requirement: Group-by is derived from the target enrichment's grain key

**Reason**: The trigger's grouping key must now be distinguished from an aggregate pipeline's group keys,
which are a different concept sharing a name.
**Migration**: See "A group trigger's grouping key is derived from the target enrichment's grain key".

### Requirement: Rule action failures report the service's own message

**Reason**: The error codes converged onto the pipeline vocabulary, and an unrecognised field is now a
reportable refusal rather than a silent drop.
**Migration**: See "Pipeline action failures report the service's own message".

### Requirement: Enrichment rule detail route and access guard

**Reason**: The detail page is addressed by name rather than by a UUID id.
**Migration**: See "Pipeline detail route addresses a pipeline by name".

### Requirement: The rule detail page presents every editable member

**Reason**: The page is now one kind-independent frame with a transform section chosen by kind, so what it
presents depends on the kind.
**Migration**: See "The detail page is one frame with a transform section chosen by kind".

### Requirement: Read-only rule facts are presented separately from editable ones

**Reason**: `id` no longer exists, the name became the identity, and the runtime state joined the derived
members the API refuses on write.
**Migration**: See "Read-only pipeline facts are presented separately from editable ones" and "A pipeline's
runtime state is presented read-only".

### Requirement: Saving replaces the rule whole without discarding unpresented members

**Reason**: The save is now a patch carrying a complete declaration, the read source became an echo hazard,
and an unrecognised member is refused rather than dropped.
**Migration**: See "Saving replaces the pipeline whole without discarding unpresented members".

### Requirement: A rule's read source either follows its target enrichment or is pinned

**Reason**: The input is now a list, echoing it back declares it, and an aggregate pipeline declares its
input outright with no follow-or-pin choice.
**Migration**: See "An enrichment pipeline's read source either follows its target or is pinned".

### Requirement: Rule editing resolves the read source in addition to the evaluator and target

**Reason**: Reworded for the pipeline vocabulary; the chain applies to the enrichment kind alone.
**Migration**: See "Pipeline editing resolves the read source in addition to the evaluator and target".

### Requirement: Unsaved rule edits are tracked and discardable

**Reason**: Reworded for the pipeline vocabulary; behaviour is unchanged.
**Migration**: See "Unsaved pipeline edits are tracked and discardable".

### Requirement: Saving a rule requires full-admin rights

**Reason**: Reworded for the pipeline vocabulary, and the read-only presentation is now explicitly retained
against the service restoring read access.
**Migration**: See "Saving a pipeline requires full-admin rights".

### Requirement: Input bindings editor

**Reason**: Reworded for the pipeline vocabulary; the editor belongs to the enrichment section rather than to
the page.
**Migration**: See "Pipeline input bindings editor".

### Requirement: SQL predicate fields are presented as bounded expressions

**Reason**: A pipeline now admits a fourth predicate — an aggregate measure's `where` — in the same grammar.
**Migration**: See "A pipeline's SQL predicate fields are presented as bounded expressions".

### Requirement: Member selection for a group rule

**Reason**: Reworded for the trigger object, whose member selection is now `trigger.member_select`.
**Migration**: See "Member selection for a group trigger".

### Requirement: Execution knobs are presented without invented validation

**Reason**: These knobs belong to the enrichment kind and must be absent for an aggregate pipeline.
**Migration**: See "An enrichment pipeline's execution knobs are presented without invented validation".

### Requirement: The rule detail header states the rule's status before its name

**Reason**: Reworded for the pipeline vocabulary; the composition is unchanged.
**Migration**: See "The pipeline detail header states the pipeline's status before its name".

### Requirement: The rule detail page can be edited as JSON instead of as fields

**Reason**: The editor now serves both kinds, since the document is the declaration and the declaration is
what differs between them.
**Migration**: See "The pipeline detail page can be edited as JSON instead of as fields".

### Requirement: The document is the request, not the form's working state

**Reason**: The document must now also exclude the runtime state and the other derived members, because the
service refuses an unrecognised member rather than dropping it.
**Migration**: See "The pipeline document is the request, not the form's working state".

### Requirement: The editor takes the whole view, and an unsaved change closes the way out

**Reason**: The runtime state joined the content withdrawn while the editor is open.
**Migration**: See "The pipeline JSON editor takes the whole view, and an unsaved change closes the way out".

### Requirement: Removing a member from the document erases it from the rule

**Reason**: Reworded for the pipeline vocabulary; the erasure semantics are unchanged.
**Migration**: See "Removing a member from the document erases it from the pipeline".

### Requirement: JSON that does not parse blocks the save and reports where

**Reason**: Three new service refusals belong here — a cross-kind member, an unrecognised member named in the
response, and a changed immutable identity.
**Migration**: See "A pipeline document that does not parse blocks the save and reports where".

### Requirement: The used-by count is derived from one rules listing and never guesses zero

**Reason**: The count is now derived from the pipelines listing narrowed to the enrichment kind, since only
that kind declares an evaluator.
**Migration**: See "The used-by count is derived from one pipelines listing and never guesses zero".

### Requirement: The Rules tab lists the referencing rules as a grid

**Reason**: The tab is renamed with the vocabulary and its rows now navigate to `/pipelines/{name}`.
**Migration**: See "The Pipelines tab lists the referencing pipelines as a grid".

### Requirement: The evaluator detail page presents Properties and Rules as tabs

**Reason**: The second tab is renamed with the vocabulary.
**Migration**: See "The evaluator detail page presents Properties and Pipelines as tabs".

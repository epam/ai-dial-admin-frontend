## ADDED Requirements

### Requirement: A pipeline read asks only for a projection the service will serve

A pipeline read answers with one of two projections, selected by a `view` query parameter: the authored
declaration, which is what the service returns when the parameter is absent, or the compiled form,
which additionally carries the inlined evaluator, the grain key, the version column, the derived output
mapping and the resolved read source.

The compiled projection resolves for the **enrichment kind alone**, and the service refuses it
elsewhere rather than answering the declaration under the compiled name:

- a listing carrying the compiled view that is **not** narrowed to the enrichment kind is refused as a
  bad request;
- a single read carrying the compiled view for a pipeline of any other kind is refused as a validation
  failure.

The console SHALL therefore name the compiled view only where it is served:

- The **listing** SHALL name no projection, taking the service's default declaration for every kind in
  one request. Every member the grid presents — the declared inputs, and the declared evaluator name
  and pinned version — is carried by that projection.
- A **single pipeline read** SHALL take the declaration first and SHALL ask for the compiled projection
  only once that answer names the enrichment kind. The kind is not known before the first answer, so
  the projection is chosen from it rather than assumed.
- A failed compiled read SHALL be reported as the failure it is, and SHALL NOT be answered with the
  declaration in its place. The detail page presents an absent grain key or version column as "not
  set", which for an enrichment pipeline states something false rather than something missing.

The compiled projection remains a superset of the authored one and is still what seeds an edit of an
enrichment pipeline. The one fact it does not preserve is whether a read source was declared or
inherited from the target's parent: both appear as a resolved input. That distinction SHALL continue to
be recovered from the target table rather than from the projection.

#### Scenario: The listing names no projection

- **WHEN** the pipelines listing is fetched
- **THEN** the request carries no view parameter
- **AND** pipelines of every kind are returned in that one request

#### Scenario: An enrichment pipeline is read twice

- **WHEN** a pipeline is opened and the declaration names the enrichment kind
- **THEN** the compiled projection is requested for it
- **AND** the grain key and version column are presented from that projection

#### Scenario: A pipeline of another kind is read once

- **WHEN** a pipeline is opened and the declaration names a kind other than enrichment
- **THEN** no compiled projection is requested
- **AND** the pipeline is presented from the declaration

#### Scenario: A refused compiled read is reported, not hidden

- **WHEN** the declaration names the enrichment kind and the compiled read then fails
- **THEN** the failure is surfaced
- **AND** the declaration is not presented in its place

## MODIFIED Requirements

### Requirement: Pipelines listing grid presents both kinds

The Pipelines page SHALL render the fetched pipelines as one grid holding both kinds, seeded in the order
the service returned them — that order is total, so no client-side sort is applied by default. Narrowing and
reordering are the grid's own affordances: every data column SHALL remain sortable and filterable through the
grid's standard column controls, and the page SHALL NOT carry a separate filter toolbar. Because the listing
is unpaged, those controls act on the whole registry.

Columns SHALL be: **name**, **kind**, **target**, **inputs**, **trigger**, **evaluator**, **enabled**,
**generation**, and **updated at**.

The grain key and the version column are **not** among them, and neither is the evaluator's type. The
service resolves those three only for a listing narrowed to the enrichment kind that also asks for the
compiled projection, and it refuses that projection in a cross-kind listing outright rather than
leaving it unresolved — so a listing holding both kinds cannot carry them at all. A column that could
only ever be empty here is not offered; all three are read on the pipeline itself.

- The **name** cell SHALL navigate to that pipeline's detail route, `/pipelines/{name}`, while rendering as
  plain text rather than as a link: the name is a value an operator reads and compares across rows, and
  styling every one as a link makes the column harder to scan.
- The **kind** cell SHALL present the kind as a badge. Kind SHALL NOT be carried by colour alone.
- The **trigger** cell SHALL show the trigger kind as a badge and nothing else. A raw six-field cron says
  nothing at a glance, and the schedule and the grouping key are both stated on the pipeline's own page.
- The **evaluator** cell SHALL show `{evaluator_name}@{version}` and SHALL mark the pin as "latest" when the
  pipeline declares no `evaluator_version`. Both members are carried by the declaration, so neither
  depends on a projection. The evaluator's **type** SHALL NOT be shown, and the grid SHALL NOT issue a
  per-row evaluator request to recover it.
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

#### Scenario: Listing names the evaluator a pipeline declares

- **WHEN** the listing renders an enrichment pipeline pinned to a version of an evaluator
- **THEN** its evaluator cell shows the evaluator name with that version
- **AND** no additional evaluator request is issued for that row

#### Scenario: The type badge waits for a resolved listing

- **WHEN** the listing renders an enrichment pipeline
- **THEN** its evaluator cell carries no type badge
- **AND** the type is presented on that pipeline's detail page, which is where the compiled projection
  is asked for

#### Scenario: A resolved input is presented

- **WHEN** the listing renders an enrichment pipeline that declared no input of its own
- **THEN** its inputs cell shows an em dash rather than a resolved source
- **AND** the source resolved from its target is presented on that pipeline's detail page

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

## REMOVED Requirements

### Requirement: Pipeline reads ask for the compiled projection explicitly

**Reason**: False against the service. It required every read — the listing included — to ask for the
compiled projection; the service now refuses that projection in a cross-kind listing (bad request) and
for a single read of any kind but enrichment (validation failure). Following it leaves the Pipelines
page empty and an aggregate pipeline's detail page reading as missing.

**Migration**: Replaced by "A pipeline read asks only for a projection the service will serve", which
keeps the same two projections and the same recovery of the declared-versus-inherited read source, and
ties the request to the kind: no projection named in the listing, and the compiled one requested for a
single pipeline only once its declaration names the enrichment kind.

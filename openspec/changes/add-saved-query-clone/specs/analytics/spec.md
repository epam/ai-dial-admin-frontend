## ADDED Requirements

### Requirement: Duplicate a query

A saved query SHALL be duplicable from the Queries grid's row actions menu. Activating Duplicate SHALL
open a modal that reuses the same field set as the create and edit modals — a **required** name and an
optional description and tag — so the three cannot diverge. A blank name SHALL block submission. The
service places no uniqueness constraint on a saved query's name, so a name already in use SHALL NOT
block submission and SHALL NOT be pre-checked against the existing list.

The modal SHALL be seeded from the source query: its description and tag SHALL be carried over, and the
name SHALL be pre-filled with the source's name plus a copy suffix, so submitting without editing
produces a distinguishable copy rather than an identical one.

Submission SHALL create a **new** saved query. The copy SHALL carry the source's body, time intent,
result view, and chart configuration across unchanged; only name, description, tag, and scope SHALL come
from the modal. The source query SHALL NOT be modified.

On success the modal SHALL close, a success notification SHALL be shown, and the browser SHALL navigate
to the new query's page, matching the behaviour of create. On failure an error notification SHALL be
shown following the machine-error-code rules, and the modal SHALL stay open with the entered values
intact. Because the service revalidates a body on create, a stored query whose body it no longer accepts
SHALL fail at this point and SHALL be reported as a body refusal carrying the service's own message.

#### Scenario: Duplicate is offered on a row

- **WHEN** the user opens a row's actions menu in the Queries grid
- **THEN** Duplicate is offered

#### Scenario: The modal is seeded from the source

- **WHEN** the user activates Duplicate on a saved query
- **THEN** the modal opens with the source's description and tag
- **AND** the name field holds the source's name with a copy suffix

#### Scenario: Name is required

- **WHEN** the duplicate modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: A name already in use is accepted

- **WHEN** the user submits the duplicate modal with a name another visible query already uses
- **THEN** the submission proceeds without a uniqueness error

#### Scenario: The copy carries the source's body

- **WHEN** the user submits the duplicate modal
- **THEN** the create request carries the source's body, time intent, result view, and chart unchanged
- **AND** the metadata entered in the modal
- **AND** the source query is left unchanged

#### Scenario: Success navigates to the copy

- **WHEN** a duplicate succeeds
- **THEN** a success notification is shown
- **AND** the browser navigates to the new query's page, not the source's

#### Scenario: Failure keeps the modal open

- **WHEN** a duplicate fails
- **THEN** an error notification is shown
- **AND** the modal remains open with the entered values

#### Scenario: A body the service no longer accepts fails at duplicate time

- **WHEN** the user duplicates a stored query whose body the service now refuses
- **THEN** an error notification carries the service's message together with repair guidance
- **AND** no copy is created

## MODIFIED Requirements

### Requirement: Queries list page

The Analytics group SHALL provide a `/queries` page listing the saved queries visible to the caller. The page SHALL be an `async` server component gated by the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is denied. Because the service returns every visible row unpaged and offers no server-side sorting or filtering, the page SHALL fetch the full list on the server and the grid SHALL sort and filter client-side.

The service lists one scope per call, so the page SHALL fetch both the caller's personal scope and the common scope and present them as one list. The grid SHALL show, at minimum, the query's name, description, source, tag, scope, the editor its body opens in, the author's display email, and its created and updated timestamps. The editor column SHALL be derived from the body — a SQL body is SQL, a structured body the visual builder can represent is Builder, and any other structured body is JSON — and SHALL NOT be read from a stored field. The author column SHALL tolerate an absent value, which the service reports whenever there is no email to record.

Activating a row SHALL navigate to that query's page. Each row SHALL offer an actions menu with Open in new tab, Duplicate, Edit, and Delete. The page SHALL offer a Create action. When the caller has no visible saved queries the grid SHALL show an empty state.

#### Scenario: Both scopes appear in one list

- **WHEN** the caller has personal saved queries and common saved queries exist
- **THEN** the grid lists both
- **AND** each row shows its scope

#### Scenario: The editor column is derived from the body

- **WHEN** a listed saved query carries a structured body whose filter nesting the visual builder cannot represent
- **THEN** its editor column reads JSON

#### Scenario: A row opens its query

- **WHEN** the user activates a grid row
- **THEN** the browser navigates to that saved query's page

#### Scenario: Row actions are offered

- **WHEN** the user opens a row's actions menu
- **THEN** Open in new tab, Duplicate, Edit, and Delete are offered

#### Scenario: Empty state when nothing is visible

- **WHEN** the caller has no visible saved queries
- **THEN** the grid shows an empty state rather than an empty table

### Requirement: Scope-based permission gating for saved queries

Writing a common-scope saved query SHALL require a full administrator, matching the service's rule. On a common query the caller may not write, Save, Edit, and Delete SHALL be unavailable rather than offered and allowed to fail. A caller's own personal queries SHALL always be writable by them.

Duplicate SHALL be the deliberate exception: it SHALL be offered on every visible saved query regardless
of scope, because duplicating writes a new query rather than the one being read. To keep that copy
writable by its creator, the scope offered for it SHALL depend on the caller. A caller who is not a full
administrator SHALL NOT be offered a scope field, and the copy SHALL be personal — including when the
source is a common query. A full administrator SHALL be offered the scope field, seeded with the source
query's own scope, so duplicating a common query yields a common copy unless they choose otherwise.

#### Scenario: A non-administrator cannot write a common query

- **WHEN** a caller who is not a full administrator opens a common-scope saved query
- **THEN** Save and Edit are unavailable
- **AND** Delete is not offered for that row in the grid

#### Scenario: An administrator can write a common query

- **WHEN** a full administrator opens a common-scope saved query
- **THEN** Save, Edit, and Delete are available

#### Scenario: A non-administrator may duplicate a common query

- **WHEN** a caller who is not a full administrator opens the actions menu on a common-scope row
- **THEN** Duplicate is offered even though Edit and Delete are not

#### Scenario: A non-administrator's copy is personal

- **WHEN** a caller who is not a full administrator duplicates a common-scope query
- **THEN** no scope field is offered
- **AND** the created copy is personal

#### Scenario: An administrator's copy keeps the source's scope

- **WHEN** a full administrator opens the duplicate modal on a common-scope query
- **THEN** a scope field is offered seeded with the common scope

## ADDED Requirements

### Requirement: Save a draft as a new query

The draft builder SHALL offer **Save as query**, which is the only way a saved query is created from
scratch. It SHALL be unavailable while the draft is in a state that would make Save unavailable on a
saved query — a query that cannot run — and while a save is in flight.

Activating it SHALL open the same modal Save as uses on a saved query: a **required** name and an
optional description and tag. A blank name SHALL block submission; a name already in use SHALL NOT. The
name, description and tag SHALL start empty, because a draft has no source query to seed them from. The
modal SHALL NOT ask for a source. The scope SHALL default to personal, and the scope field SHALL be
offered only to a full administrator, as in the edit modal.

Submission SHALL create a saved query whose body, time intent, result view, and chart configuration are
the draft's current values, serialized by the same rules as a save.

On success the modal SHALL close, a success notification SHALL be shown, and the browser SHALL navigate
to the new query's page, which SHALL open without unsaved changes. On failure an error notification
SHALL be shown following the machine-error-code rules, and the modal SHALL stay open with the entered
values intact. Cancelling the modal SHALL leave the draft as it was.

#### Scenario: Name is required

- **WHEN** the Save as query modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: The modal starts empty and asks for no source

- **WHEN** the user activates Save as query on a draft
- **THEN** the modal opens with empty name, description and tag
- **AND** no source field is presented

#### Scenario: The new query carries the draft

- **WHEN** the user submits the modal
- **THEN** the create request carries the draft's body, time intent, result view, and chart configuration
- **AND** the metadata entered in the modal
- **AND** the personal scope unless an administrator chose otherwise

#### Scenario: Success opens the new query

- **WHEN** saving a draft succeeds
- **THEN** a success notification is shown
- **AND** the browser navigates to the new query's page
- **AND** that page reports no unsaved changes

#### Scenario: Failure keeps the modal open

- **WHEN** saving a draft fails
- **THEN** an error notification is shown following the machine-error-code rules
- **AND** the modal remains open with the entered values

#### Scenario: An unrunnable draft cannot be saved

- **WHEN** the draft is in a state that makes Save unavailable on a saved query
- **THEN** Save as query is unavailable

#### Scenario: Cancel keeps the draft

- **WHEN** the user cancels the modal
- **THEN** the draft still holds its changes

### Requirement: Edit query metadata on the query page

A saved query's name, description, tag, and scope SHALL be editable through a single modal, reachable
from an Edit control on the query's own page. The modal SHALL reuse the same field set as the Save as
modal, so the two cannot diverge.

Editing metadata SHALL replace the stored query with its body unchanged. A blank name SHALL block submission. The scope field SHALL be offered only when the caller is a full administrator, because the service permits common writes only to that role.

On success a success notification SHALL be shown and the affected view SHALL reflect the new values. On failure an error notification SHALL be shown.

#### Scenario: Metadata edits leave the body alone

- **WHEN** the user changes only the name in the edit modal and submits
- **THEN** the replace request carries the same body the query already had
- **AND** the new name

#### Scenario: Scope is administrator-only

- **WHEN** a caller who is not a full administrator opens the edit modal
- **THEN** no scope field is offered

#### Scenario: Edit is reachable from the query page

- **WHEN** the user activates the Edit control on a query's page
- **THEN** the modal opens, seeded with that query's current metadata

### Requirement: Save a saved query as a new query

A query page SHALL offer **Save as** in the builder toolbar's actions area whether or not it holds
unsaved changes: with unsaved changes it stores them as a new query, without them it copies the query.
Save as SHALL be offered whether or not the caller may write the source query, because it writes only a
new query the caller owns; on a common query the caller may not write it SHALL be offered while Save is
not. Save as SHALL be unavailable under the same conditions that make Save unavailable for an unrunnable
query, and while a save is in flight.

Activating Save as SHALL open a modal that shares its field set with the edit modal — a **required**
name and an optional description and tag. A blank name SHALL block submission; a name already in use
SHALL NOT, and SHALL NOT be pre-checked against the existing queries, because the service places no
uniqueness constraint on a saved query's name. The modal SHALL be seeded from the source query: its
description and tag SHALL be carried over and its name SHALL be pre-filled with the source's name plus
a copy suffix. The scope SHALL be the source's scope for a full administrator and the personal scope
for anyone else.

Submission SHALL create a **new** saved query whose body, time intent, result view, and chart
configuration are the page's current values — the payload Save would have written, which for a page
without unsaved changes is the stored query's own — and whose name, description, tag, and scope come
from the modal. The source query SHALL NOT be modified.

On success the modal SHALL close and the browser SHALL stay on the source query's page. The page SHALL
keep whatever edits it held and SHALL indicate unsaved changes against the source exactly as it did
before, so the user can go on editing, save again as another query, save over the source, or discard. A
success notification SHALL be shown that carries a link to the new query's page; activating the link
SHALL navigate there. The notification SHALL dismiss itself after the standard success duration, like
any other success notification. On failure an error notification SHALL be shown following the
machine-error-code rules, and the modal SHALL stay open with the entered values intact. Because the
service revalidates a body on create, a stored query whose body it no longer accepts SHALL fail at this
point and SHALL be reported as a body refusal carrying the service's own message. Cancelling the modal
SHALL leave the page and its unsaved edits as they were.

#### Scenario: Save as appears with unsaved changes

- **WHEN** the user edits a stored query on its page
- **THEN** Save as is offered alongside Discard and Save

#### Scenario: Save as is offered without unsaved changes

- **WHEN** the query page holds no unsaved changes
- **THEN** Save as is offered
- **AND** Save and Discard are not

#### Scenario: Save as is offered on a common query the caller cannot write

- **WHEN** a caller who is not a full administrator opens a common-scope query on its page
- **THEN** Save as is offered
- **AND** Save is not

#### Scenario: Save as is unavailable for an unrunnable query

- **WHEN** the page's edits leave the query in a state that makes Save unavailable
- **THEN** Save as is unavailable too

#### Scenario: The modal is seeded from the source

- **WHEN** the user activates Save as
- **THEN** a modal opens with the source's description and tag
- **AND** the name field holds the source's name with a copy suffix

#### Scenario: A non-administrator's copy lands in the personal scope

- **WHEN** a caller who is not a full administrator submits Save as on a common-scope query
- **THEN** the create request carries the personal scope

#### Scenario: Name is required

- **WHEN** the Save as modal is open and the name field is blank
- **THEN** the submit action is disabled

#### Scenario: A name already in use is accepted

- **WHEN** the user submits the Save as modal with a name another visible query already uses
- **THEN** the submission proceeds without a uniqueness error

#### Scenario: The new query carries the unsaved edits

- **WHEN** the user submits the Save as modal on a page with unsaved changes
- **THEN** the create request carries the page's current body, time intent, result view, and chart configuration
- **AND** the metadata entered in the modal
- **AND** the source query is left unchanged

#### Scenario: A clean query is copied as stored

- **WHEN** the user submits the Save as modal on a page without unsaved changes
- **THEN** the create request carries the source's body, time intent, result view, and chart unchanged
- **AND** the metadata entered in the modal

#### Scenario: Success stays on the source page

- **WHEN** a Save as succeeds
- **THEN** the modal closes and the browser stays on the source query's page
- **AND** the page holds the same edits, and the same unsaved-changes indication, as before

#### Scenario: The success notification links to the new query

- **WHEN** a Save as succeeds
- **THEN** a success notification is shown with a link to the new query

#### Scenario: The link opens the new query

- **WHEN** the user activates the link in the success notification
- **THEN** the browser navigates to the new query's page

#### Scenario: Failure keeps the modal open

- **WHEN** a Save as fails
- **THEN** an error notification is shown following the machine-error-code rules
- **AND** the modal remains open with the entered values

#### Scenario: A body the service no longer accepts fails at Save as time

- **WHEN** the user saves as a new query a stored query whose body the service now refuses
- **THEN** an error notification carries the service's message together with repair guidance
- **AND** no copy is created

#### Scenario: Cancel keeps the edits

- **WHEN** the user cancels the Save as modal
- **THEN** the page still holds its unsaved edits

## MODIFIED Requirements

### Requirement: A saved query's primary source

A saved query's `source` is a set of entities, so every surface that needs exactly one entity — the
server-side schema prefetch, the SQL editor's autocomplete, and the assistant's schema message — SHALL
use the query's **primary source**, derived in one place from the stored query alone: the structured
body's `entity` when the query carries a structured body, otherwise the first element of `source`.
Because the service sorts `source` alphabetically, the primary source of a composite SQL query is its
alphabetically first entity: an arbitrary but stable pick, chosen so field autocomplete keeps working
rather than being switched off for composite queries.

The frontend SHALL NOT infer a primary source from the SQL text, and SHALL NOT merge the schemas of
several sources into one field list. A query with neither a structured body nor a non-empty `source`
SHALL resolve to no primary source, and the page SHALL then load no schema rather than requesting
one for an empty entity name.

#### Scenario: A structured body's own entity is the primary source

- **WHEN** a saved query carries a structured body targeting `dial_usage_log` and a one-element `source`
- **THEN** its primary source is `dial_usage_log`

#### Scenario: A single-source SQL body resolves to that source

- **WHEN** a saved query carries a SQL body and a one-element `source`
- **THEN** its primary source is that element

#### Scenario: A composite SQL body resolves to its first source

- **WHEN** a saved query carries a SQL body joining two entities, so `source` holds both sorted alphabetically
- **THEN** its primary source is the first of the two
- **AND** the fields offered to the SQL autocomplete are that entity's fields only

#### Scenario: No source at all loads no schema

- **WHEN** a saved query carries neither a structured body nor a non-empty `source`
- **THEN** no entity schema is requested
- **AND** the builder renders without fields rather than reporting a failed schema load

### Requirement: Delete a query

A saved query SHALL be deletable from its own page, behind the application's standard delete
confirmation. Delete SHALL be offered whether or not the page holds unsaved changes, and only when the
caller may write the query's scope.

On success a success notification SHALL be shown and the browser SHALL navigate to the draft builder,
because the page's query no longer exists. On failure an error notification SHALL be shown and the page
SHALL stay as it was, unsaved changes included.

#### Scenario: Delete asks for confirmation

- **WHEN** the user activates Delete on a query's page
- **THEN** a confirmation naming the query is shown before anything is deleted

#### Scenario: A confirmed delete removes the row

- **WHEN** the user confirms the deletion and it succeeds
- **THEN** a success notification is shown
- **AND** the query's row is no longer listed among the saved queries
- **AND** the browser navigates to the draft builder

#### Scenario: A failed delete keeps the page

- **WHEN** the deletion fails
- **THEN** an error notification is shown
- **AND** the query's page is still shown with its unsaved changes

#### Scenario: Cancelling keeps the query

- **WHEN** the user cancels the confirmation
- **THEN** nothing is deleted and the page is unchanged

### Requirement: A query page loads its stored query into the builder

The Analytics group SHALL provide a `/queries/{id}` page rendering the Query Builder seeded from the stored saved query. The page SHALL be an `async` server component gated by the same Analytics access check as the other Analytics pages, and SHALL resolve to a not-found result when the query cannot be read — the service reports a query the caller may not see as absent rather than forbidden, so the two cases SHALL be indistinguishable to the user.

The page SHALL fetch the schema of **the stored query's primary source**, not the first queryable entity's. The view the builder opens in SHALL be derived from the body: a SQL body opens the SQL view with the stored text laid out one clause per line, a structured body the visual builder can represent opens the Builder view hydrated from it, and any other structured body opens the JSON view showing it. The heading SHALL show the query's name.

The page SHALL offer no control that switches the query's source. Picking another table SHALL open a
draft on that table and SHALL leave the stored query untouched.

A query reading from several entities SHALL open the same way — its stored SQL shown in the SQL view — with the schema of its primary source loaded. Switching such a query to the Builder or JSON view SHALL follow the existing translation behaviour for SQL the DSL cannot express: the service refuses the translation and the discard guard applies.

The laid-out text SHALL be the query's unedited baseline, so opening a query stored on one line SHALL NOT mark it as having unsaved changes. Saving from the SQL view SHALL send the SQL view's text as shown, so the first save after opening stores the laid-out form. Editing a query's metadata or saving it as a new query without edits SHALL send the stored SQL unchanged, because neither re-authors the body.

The stored time intent SHALL be applied to the toolbar time filter: a relative intent selects that period, an absolute intent selects that custom range, and an absent intent leaves the toolbar at its default. A relative period the frontend does not recognise SHALL leave the toolbar unchanged and SHALL NOT prevent the query from loading.

#### Scenario: A structured body opens in the Builder view

- **WHEN** the user opens a query whose structured body the visual builder can represent
- **THEN** the Builder view is shown reflecting that query
- **AND** the heading shows the query's name

#### Scenario: An unrepresentable structured body opens in the JSON view

- **WHEN** the user opens a query whose structured body the visual builder cannot represent
- **THEN** the JSON view is shown containing that body

#### Scenario: A SQL body opens in the SQL view

- **WHEN** the user opens a query carrying a SQL body
- **THEN** the SQL view is shown containing the stored statement, one clause per line
- **AND** entering the SQL view does not overwrite it with a re-seeded translation

#### Scenario: Saving an opened SQL query stores the laid-out text

- **WHEN** the user opens a query whose SQL is stored on one line
- **THEN** the page reports no unsaved changes
- **WHEN** the user saves it from the SQL view
- **THEN** the payload's `sql` is the text the SQL view shows

#### Scenario: The schema loaded is the query's own source

- **WHEN** the user opens a query whose source is not the first queryable entity
- **THEN** the fields available to the builder are that source's fields

#### Scenario: A composite query opens with its primary source's schema

- **WHEN** the user opens a query whose SQL joins two entities
- **THEN** the SQL view shows the stored statement
- **AND** the schema requested is that of the query's primary source, so that entity's fields are available
- **AND** the page does not report a failed schema load

#### Scenario: Picking a table does not change the stored query

- **WHEN** a saved query is open and the user picks another table
- **THEN** a draft on that table opens
- **AND** the saved query's stored source is unchanged

#### Scenario: An unreadable query is not found

- **WHEN** the user opens an id that does not exist, or one belonging to another caller's personal scope
- **THEN** the page resolves to a not-found result, identically in both cases

#### Scenario: An unrecognised relative period still loads

- **WHEN** a stored query carries a relative period the frontend does not recognise
- **THEN** the query loads and the toolbar time filter is left as it was

### Requirement: Scope-based permission gating for saved queries

Writing a common-scope saved query SHALL require a full administrator, matching the service's rule. On a common query the caller may not write, Save, Edit, and Delete SHALL be unavailable rather than offered and allowed to fail. A caller's own personal queries SHALL always be writable by them.

#### Scenario: A non-administrator cannot write a common query

- **WHEN** a caller who is not a full administrator opens a common-scope saved query
- **THEN** Save, Edit, and Delete are unavailable

#### Scenario: An administrator can write a common query

- **WHEN** a full administrator opens a common-scope saved query
- **THEN** Save, Edit, and Delete are available

### Requirement: Saved query failures are reported by machine error code

A failed saved-query request SHALL be reported by branching on the machine error code the service puts on its failure envelope, not on the HTTP status alone. Each recognised code SHALL map to its own guidance. A refusal caused by the body — a validation failure, a rejected literal, or a bad request — SHALL surface the service's own message alongside that guidance, because it names the offending part of the query; a refusal about identity or visibility SHALL NOT.

A query reported as absent SHALL be treated as gone: the user SHALL be told and returned to the draft
builder, and the saved queries shown beside it SHALL be re-read.

No message SHALL disclose whether a query exists but is invisible, or whether a column exists but is restricted.

#### Scenario: A body refusal shows the service's message

- **WHEN** a save is refused because the body is invalid
- **THEN** the notification carries the service's message together with guidance on how to repair the query

#### Scenario: A visibility refusal does not

- **WHEN** a save is refused because the query is absent or not visible
- **THEN** the notification explains the query is no longer available without stating whether it exists

#### Scenario: A vanished query returns the user to the list

- **WHEN** the query the page is showing is reported as absent by a save
- **THEN** the user is notified and returned to the draft builder, beside the re-read list of saved queries
- **AND** the vanished query is no longer in that list

## REMOVED Requirements

### Requirement: Queries list page

**Reason**: The saved queries are listed in the Source panel beside the builder, so a grid page between
the menu and the builder no longer earns its place. `/queries` now opens the draft builder.

**Migration**: Find and open a saved query from the Queries tab of the Source panel
(`analytics/source-panel`). The grid's Source, editor, author and timestamp columns have no replacement;
a query's source is visible once it is open.

### Requirement: Create a query

**Reason**: A query no longer has to exist before the builder opens. The standalone create modal, which
stored a placeholder body on a default source, is replaced by saving a draft.

**Migration**: Open the draft builder, pick a table, and use Save as query — see "Save a draft as a new
query".

### Requirement: Duplicate a query

**Reason**: Duplicate lived in the Queries grid's row menu, which is removed with the grid.

**Migration**: Open the query and use Save as, which is now offered without unsaved changes and then
copies the query as stored — see "Save a saved query as a new query".

### Requirement: Edit query metadata

**Reason**: The requirement made Edit reachable from the Queries grid's row menu as well as from the
query page; the grid is removed, so the query page is the only surface.

**Migration**: Use the Edit control on the query's page — see "Edit query metadata on the query page".

### Requirement: Save as a new query from a query page

**Reason**: The requirement withheld Save as from a page without unsaved changes. With the grid's
Duplicate gone, Save as must also copy a clean query, which contradicts that rule.

**Migration**: Save as is offered on every saved query's page — see "Save a saved query as a new query".

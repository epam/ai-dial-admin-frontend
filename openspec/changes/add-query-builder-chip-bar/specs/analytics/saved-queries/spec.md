## ADDED Requirements

### Requirement: A saved query's page loads its stored query

The Analytics group SHALL provide a `/queries/{id}` page rendering the Query Builder seeded from the stored saved query. The page SHALL be an `async` server component gated by the same Analytics access check as the other Analytics pages, and SHALL resolve to a not-found result when the query cannot be read — the service reports a query the caller may not see as absent rather than forbidden, so the two cases SHALL be indistinguishable to the user.

The page SHALL fetch the schema of **the stored query's primary source**, not the first queryable entity's. The view the builder opens in SHALL be derived from the body: a SQL body opens the SQL view with the stored text laid out one clause per line, a structured body the chips can show opens the Builder view hydrated from it, and any other structured body opens the SQL view showing the SQL the service translates that body to. The translation SHALL be requested on the server together with the page, and its text SHALL be the query's unedited baseline, so opening such a query SHALL NOT mark it as having unsaved changes; saving it from the SQL view SHALL store it as SQL. When the service cannot translate the body — it refuses, or the request fails in transit — the SQL view SHALL open empty with Run disabled and an error notification SHALL report it, carrying the service's message when there is one. The stored body SHALL be held aside for as long as the user authors nothing in its place: while the SQL editor is empty and the chips are as the page opened them, the page SHALL NOT report unsaved changes for the body, in either view, and a save of some other change SHALL store the body unchanged. Once the user types SQL or changes a chip, what they authored SHALL be the body that is saved. The heading SHALL show the query's name.

The page SHALL offer no control that switches the query's source. Picking another table SHALL open a
draft on that table and SHALL leave the stored query untouched.

A query reading from several entities SHALL open the same way — its stored SQL shown in the SQL view — with the schema of its primary source loaded. Switching such a query to the Builder view SHALL follow the existing translation behaviour for SQL the DSL cannot express: the service refuses the translation and the discard guard applies.

The laid-out text SHALL be the query's unedited baseline, so opening a query stored on one line SHALL NOT mark it as having unsaved changes. Saving from the SQL view SHALL send the SQL view's text as shown, so the first save after opening stores the laid-out form. Editing a query's metadata or saving it as a new query without edits SHALL send the stored SQL unchanged, because neither re-authors the body.

A structured body that opens as SQL has no Period chip to carry its stored time intent, and the stored body never holds the period. Before such a body is translated, the stored time intent SHALL therefore be written into it as the same bound on the source's timestamp field that the Period chip serializes — relative for a recognised period, two instants for an absolute range — so the SQL shown is bounded as the query was saved. A body with no stored intent, an unrecognised period, or a source without a timestamp field SHALL be translated as stored.

The stored time intent SHALL be applied to the toolbar time filter: a relative intent selects that period, an absolute intent selects that custom range, and an absent intent leaves the toolbar at its default. A relative period the frontend does not recognise SHALL leave the toolbar unchanged and SHALL NOT prevent the query from loading.

#### Scenario: A structured body opens in the Builder view

- **WHEN** the user opens a query whose structured body the chips can show
- **THEN** the Builder view is shown reflecting that query
- **AND** the heading shows the query's name

#### Scenario: A structured body the chips cannot show opens as SQL

- **WHEN** the user opens a query whose structured body the chips cannot show
- **THEN** the SQL view is shown containing the SQL the service translated that body to
- **AND** the page reports no unsaved changes

#### Scenario: The translated SQL carries the stored period

- **WHEN** the user opens a query whose structured body the chips cannot show and which stores a time intent
- **THEN** the SQL shown bounds the source's timestamp field by that period, so running it returns the rows the stored query was saved to return

#### Scenario: A body the service cannot translate opens an empty SQL view

- **WHEN** the user opens a query whose structured body the chips cannot show and the service refuses to translate it
- **THEN** the SQL view is shown empty with Run disabled
- **AND** an error notification carries the service's message

#### Scenario: A held body survives a visit to the Builder

- **WHEN** the service could not translate the body and the user switches to the Builder view without changing a chip
- **THEN** the page reports no unsaved changes
- **AND** saving some other change stores the body as it was

#### Scenario: Authoring replaces a held body

- **WHEN** the service could not translate the body and the user changes a chip and saves
- **THEN** the query the chips state is stored

#### Scenario: A translation that fails in transit is reported

- **WHEN** the request to translate the body fails in transit
- **THEN** the SQL view is shown empty and an error notification reports the failure

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

## MODIFIED Requirements

### Requirement: Saved query storage contract

A saved query SHALL be an addressable object holding authored **intent** only: a name, an optional description and tag, a sharing scope, exactly one of a structured query body or a SQL body, the author's time intent, how the result was last rendered, and a chart configuration. The frontend SHALL treat the analytics data-access service's `/v1/saved-queries` contract as authoritative and SHALL NOT extend it.

The write payload SHALL consist of exactly these nine members: `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, `chart`. The frontend SHALL NOT send `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params` on a create or a replace — the service rejects each with `422`, so a payload type distinct from the response type SHALL be used rather than a subset of it.

The response's optional members SHALL be modelled as optional rather than nullable: the service omits absent members rather than emitting `null`.

`source` SHALL be modelled as a **list of entity names**, not a single name: a SQL body may be a composite statement — a join, a CTE, a derived table, or a subquery — that reads from several entities, and the service returns every entity the body reads. The service returns the list non-empty and sorted alphabetically, and returns exactly one element for a structured body. The frontend SHALL treat it as server-derived and read-only, SHALL NOT assume a particular element is the query's outer or governing entity, and SHALL tolerate a response whose `source` is absent or empty rather than failing to render the query. Because a deployment may still run a service build that returns `source` as a single name, the frontend SHALL accept that form too and read it as a one-element list. `generation` SHALL be treated as a change counter for display only; because the service accepts no precondition header, concurrent writes are last-write-wins and the frontend SHALL NOT present a conflict-resolution affordance.

#### Scenario: The write payload carries only the nine accepted members

- **WHEN** a query is created or saved
- **THEN** the request body contains only `name`, `description`, `tag`, `scope`, `query`, `sql`, `time`, `result_view`, and `chart`
- **AND** no server-assigned member is present

#### Scenario: Exactly one body is sent

- **WHEN** the query being saved was authored in the SQL view with non-blank SQL text
- **THEN** the payload carries `sql` and omits `query`

#### Scenario: A structured body is sent when the SQL buffer is not in play

- **WHEN** the query being saved was authored in the Builder view
- **THEN** the payload carries `query` and omits `sql`

#### Scenario: A multi-entity source is read as a list

- **WHEN** the service returns a saved query whose `source` names two entities
- **THEN** both are retained as the query's sources
- **AND** neither is treated as the only source

#### Scenario: An older service's single-name source still works

- **WHEN** the service returns a saved query whose `source` is a single name rather than a list
- **THEN** it is read as a one-element list
- **AND** the query's primary source is that name, not its first character

### Requirement: Saving persists authored intent, not a resolved range

Saving SHALL persist the query as authored intent. The persisted structured body SHALL be serialized **without** the toolbar's time bound, and the authored range SHALL travel separately as time intent: a preset period SHALL be stored as its relative token and SHALL NOT be resolved to instants, and a custom range SHALL be stored as an absolute pair. An absolute pair whose start is after its end SHALL be ordered before it is sent.

This is the load-bearing distinction: serializing the range into the body — as the Run path correctly does — would freeze the query to the day it was authored, and the service cannot detect that because a frozen range is a valid query.

Saving SHALL replace the stored query and SHALL then re-read it so the page reflects what was persisted. On success a success notification SHALL be shown; on failure an error notification SHALL be shown and the unsaved edits SHALL be preserved.

#### Scenario: A relative period is stored as a token

- **WHEN** the user saves a query with a preset time period selected
- **THEN** the payload's time intent names that period as a relative token
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A custom range is stored as instants

- **WHEN** the user saves a query with a custom range selected
- **THEN** the payload's time intent carries that range as an absolute pair
- **AND** the payload's structured body contains no timestamp range predicate

#### Scenario: A relative period survives a round trip

- **WHEN** a query saved with a preset period is reopened later
- **THEN** the toolbar shows that same preset period, not a fixed range

#### Scenario: A failed save keeps the edits

- **WHEN** a save fails
- **THEN** an error notification is shown
- **AND** the user's unsaved edits remain in the builder

### Requirement: Save a saved query as a new query

A query page SHALL offer saving a saved query as a new one — referred to below as Save as — under two
names, by whether the page holds unsaved changes. Without unsaved changes the heading row SHALL offer
**Duplicate**, which copies the query as stored. With unsaved changes the Save control SHALL be a menu
of two entries, **Save**, which writes the changes to the query, and **Save as a new query**, which
stores them as a new query; Duplicate SHALL NOT be offered then. Save as SHALL be offered whether or
not the caller may write the source query, because it writes only a new query the caller owns: on a
common query the caller may not write, the page with unsaved changes SHALL offer Save as a new query as
an action of its own, with no Save. Save as SHALL be unavailable under the same conditions that make
Save unavailable for an unrunnable query, and while a save is in flight.

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
- **THEN** the Save menu offers Save and Save as a new query, beside Discard
- **AND** Duplicate is not offered

#### Scenario: Save as is offered without unsaved changes

- **WHEN** the query page holds no unsaved changes
- **THEN** Duplicate is offered
- **AND** Save and Discard are not

#### Scenario: Save as is offered on a common query the caller cannot write

- **WHEN** a caller who is not a full administrator opens a common-scope query on its page
- **THEN** Duplicate is offered, and once the page holds unsaved changes Save as a new query is offered
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

## REMOVED Requirements

### Requirement: A query page loads its stored query into the builder

**Reason**: There is no JSON view for a structured body the builder cannot show to open in, and
"representable" now means what the chips can show.

**Migration**: See "A saved query's page loads its stored query": such a body opens in the SQL view,
translated by the service.

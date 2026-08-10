## ADDED Requirements

### Requirement: Saved queries server API layer and actions

The server API layer SHALL expose the Analytics data-access service's saved-query endpoints under
`/v1/saved-queries` through a `SavedQueriesApi` class extending `BaseApi` on the analytics host, and the
Query Builder SHALL reach them only through server actions in `app/[lang]/query-builder/actions.ts` that
inject the user token via `getUserToken()`, matching every other Analytics call.

Five operations SHALL be exposed: list (`GET /v1/saved-queries?scope=personal|common`, success body
`{ saved_queries: [...] }`), create (`POST`, `201` with the full object), read one (`GET /{id}`), replace
(`PUT /{id}`, a full replace returning the full object), and delete (`DELETE /{id}`, `204`). Each write
SHALL return a `ServerActionResponse` envelope so the calling component can branch on `status` and the
machine code.

The list response SHALL be treated as complete: each entry carries every field the single read returns,
bodies included. The client SHALL NOT issue a request when a row is selected, SHALL NOT maintain a
per-id cache, and SHALL NOT show a loading state in the preview.

The client SHALL NOT re-sort, page, or filter the list beyond the tag-grouping and search UI. The server
returns rows most recently updated first and that order SHALL be preserved.

#### Scenario: Saved queries are listed through a server action

- **WHEN** the Query Builder lists saved queries at a scope
- **THEN** a server action calls `GET /v1/saved-queries` with that `scope` and the user token
- **AND** the entries are rendered in the order returned, without client-side re-sorting

#### Scenario: Selecting a row issues no request

- **WHEN** the user clicks a row in the saved-queries library
- **THEN** the preview renders from the entry already held from the list response
- **AND** no request for that saved query's id is issued

#### Scenario: Deleting a saved query

- **WHEN** the user confirms deletion of a saved query they may write
- **THEN** a server action calls `DELETE /v1/saved-queries/{id}` and the list is refreshed on success

### Requirement: Saved query request payload carries only the nine accepted fields

A create or replace request body SHALL carry only `name`, `description`, `tag`, `scope`, `query`, `sql`,
`time`, `result_view`, and `chart`. The client SHALL NOT send `id`, `owner_id`, `owner_email`, `source`,
`generation`, `created_at`, `updated_at`, or `params` under any circumstance — each is rejected by the
service with `422`, not ignored — so an overwrite SHALL rebuild the body from current builder state and
the save form rather than re-posting a previously received object.

`name` SHALL be required and non-blank after trimming. Exactly one of `query` or `sql` SHALL be sent.
Optional members that have no value SHALL be omitted from the payload rather than sent as `null`, and the
request type SHALL declare them optional.

`source` SHALL NOT be sent; it is derived server-side from the body.

The state ⇄ payload mapping SHALL be implemented as pure functions that receive every input by value —
builder state, SQL text, form fields, the resolved time values, the result view, and the chart config —
without reading the clock or calling hooks.

#### Scenario: A server-assigned field is never sent

- **WHEN** the user overwrites a previously loaded saved query
- **THEN** the PUT body contains only the nine accepted fields
- **AND** it carries no `id`, `owner_id`, `owner_email`, `source`, `generation`, `created_at`, `updated_at`, or `params`

#### Scenario: An absent optional field is omitted

- **WHEN** a saved query is created with no description and no tag
- **THEN** those members are absent from the request body rather than present with a `null` value

#### Scenario: Exactly one body is sent

- **WHEN** a saved query is created from the SQL view
- **THEN** the request carries `sql` and no `query`
- **AND** when created from the Builder or JSON view it carries `query` and no `sql`

### Requirement: The saved query body excludes the toolbar time bound and all catalog data

The structured `query` persisted for a saved query SHALL be built **without** the toolbar time bound —
`buildQuery(state, null)` — so it contains no `ge`/`le` pair contributed by the time filter on the
source's timestamp column. The time bound is re-materialized at run time exactly as a fresh Run does.

The payload SHALL NOT carry the entity's fields, the served function catalog, or the editor mode the
client was in. All three are re-derived on load: field lists are a per-caller filtered view of the schema,
so persisting one would freeze a single caller's view, mask schema drift, and carry restricted column
names to other readers.

#### Scenario: The time bound is stripped from the saved body

- **GIVEN** a builder state on an entity with a timestamp field and a toolbar range selected
- **WHEN** the query is saved
- **THEN** the `query` in the request body contains no `ge`/`le` predicate pair on that timestamp field
- **AND** the query executed by Run still contains them

#### Scenario: Catalog data is not persisted

- **WHEN** any saved query is created
- **THEN** the request body carries no field list, no function catalog, and no editor or view mode

### Requirement: Time intent is captured and restored as intent

The save dialog SHALL offer a checkbox to save the current time period with the query, and the resulting
`time` member SHALL express the user's intent rather than resolved instants:

- when the checkbox is off, `time` SHALL be omitted — the query uses whatever the toolbar has on open;
- when the toolbar is on a preset (`isCustom` is false), `time` SHALL be
  `{ mode: 'relative', period: <preset id> }`;
- when the toolbar holds a custom range, `time` SHALL be `{ mode: 'absolute', from, to }` with `from` not
  after `to`.

Every preset id in `timePeriodOptionsConfig` SHALL satisfy the service's `^[a-z0-9_]{1,32}$` token rule.

On load: a relative `time` SHALL be applied through the toolbar's period change, an absolute `time`
through its custom-range change, and an absent `time` SHALL leave the toolbar untouched. A relative period
SHALL NEVER be resolved into absolute instants at save or at load — doing so would silently freeze the
query to the day it was authored.

A relative `period` that is not a known preset SHALL leave the toolbar unchanged and SHALL NOT fail the
load.

#### Scenario: A preset is stored as a relative intent

- **GIVEN** the toolbar is on the `2d` preset
- **WHEN** the query is saved with the time-period checkbox on
- **THEN** the request body carries `time` of `{ mode: 'relative', period: '2d' }`
- **AND** it carries no absolute `from` or `to`

#### Scenario: A relative period reopens as relative and moves with the calendar

- **GIVEN** a saved query stored with a relative period
- **WHEN** it is opened on a later day
- **THEN** the toolbar shows that preset rather than a custom range
- **AND** the resolved range covers the period ending now, not the period ending when it was saved

#### Scenario: A custom range is stored as an absolute intent

- **GIVEN** the toolbar holds a custom range
- **WHEN** the query is saved with the time-period checkbox on
- **THEN** the request body carries `time` of `{ mode: 'absolute', from, to }` for that range

#### Scenario: An unsaved time period leaves the toolbar alone

- **GIVEN** a saved query stored with no `time`
- **WHEN** it is opened
- **THEN** the toolbar keeps the period it already had

#### Scenario: Every preset id satisfies the token rule

- **WHEN** the configured time period options are checked
- **THEN** every option's id matches `^[a-z0-9_]{1,32}$`

### Requirement: Chart configuration round-trips through a saved query

`chart` SHALL be sent only when `result_view` is `chart`. Its `type` SHALL be the selected chart type, and
`x_field` / `y_field` SHALL be sent as explicit `null` whenever the user has not deliberately picked that
axis — `null` means "derive on open", which is what stops a saved axis from dangling when a query's
result columns change. Axis values name **result** columns (including aliases a query produces, such as a
date-bin alias), not catalog columns, and SHALL be stored verbatim.

On load, a stored chart SHALL set the result view to Chart and apply its config, and that config SHALL
survive the first run after the load rather than being reset by it. Every subsequent run SHALL reset the
config to the default, as it does today. A saved chart is a preference applied to the next result, not a
picture rendered on open.

When a saved chart's axes do not resolve against the columns the query now returns, the result area SHALL
show its chart-unavailable state rather than an empty chart pane.

#### Scenario: An underived axis is stored as null

- **GIVEN** the Chart view is open and the user has not chosen the Y axis
- **WHEN** the query is saved
- **THEN** the request body's `chart.y_field` is `null`
- **AND** on reopening, the Y axis is derived from the query's own result columns

#### Scenario: Chart is omitted for a table view

- **WHEN** a query is saved while the Table view is open
- **THEN** the request body carries `result_view` of `table` and no `chart`

#### Scenario: A loaded chart survives its first run

- **GIVEN** a saved query stored with a chart configuration has just been loaded
- **WHEN** the user runs it
- **THEN** the result renders with the saved chart type and axes
- **AND** a subsequent run resets the chart configuration to the default

#### Scenario: A saved chart whose columns are gone

- **GIVEN** a loaded saved query whose stored axis names a column the query no longer returns
- **WHEN** the result is shown
- **THEN** the chart-unavailable state is shown rather than an empty chart

### Requirement: Saved queries library dialog

The Query Builder SHALL open the saved-queries library as a modal dialog — not a side panel — with the
list on the left and a preview on the right. It SHALL offer two tabs, **My queries** (`personal`) and
**Common**, then a search field, then the list grouped by `tag`. Grouping SHALL reorder rows into groups
but SHALL NOT reorder rows within a group.

Clicking a row SHALL preview it. Opening SHALL be a separate act — the footer's open action or a
double-click on the row.

The list and the preview SHALL scroll independently. Neither the tabs nor the dialog's own header and
footer SHALL scroll away with their content.

Each row SHALL show the saved query's name, its `source`, and the period its `time` expresses. It SHALL
NOT show an editor chip: which editor a query opens in is evident from the body shown in the preview,
and a per-row badge for it crowds the list without changing what the row does.

Each row SHALL offer a delete action, so a saved query can be removed without first opening it. The
action SHALL be revealed on hover or keyboard focus rather than shown permanently, and SHALL be offered
only where the caller may write that scope — always under `personal`, whose rows are server-filtered to
the caller, and under `common` only with `FULL_ADMIN`. Deleting SHALL be confirmed in the dialog's own
footer rather than by stacking a confirmation popup over it, and on success the list SHALL be refreshed.
Deleting the saved query that is currently loaded SHALL also clear its identity chip and dirty state.

Each tab SHALL have its own empty state.

`personal` rows are fetched when the builder mounts; `common` rows are fetched when its tab is first
opened. Both SHALL be refreshed after any successful write.

#### Scenario: The library opens as a modal with list and preview

- **WHEN** the user activates the Saved queries action
- **THEN** a modal dialog opens showing the list on the left and a preview area on the right
- **AND** the My queries tab is selected

#### Scenario: Rows are grouped by tag without being re-sorted

- **WHEN** the list contains saved queries carrying tags
- **THEN** rows are grouped under their tag
- **AND** within each group the server's order is preserved

#### Scenario: A row identifies its query without an editor badge

- **WHEN** the list contains a saved query carrying `sql`
- **THEN** its row shows the query's name and source
- **AND** no `SQL`, `JSON`, or `Builder` chip is rendered on the row

#### Scenario: Previewing is not opening

- **WHEN** the user clicks a row
- **THEN** the preview updates and the builder is unchanged
- **AND** the query is loaded only when the footer's open action is used or the row is double-clicked

#### Scenario: A row is deleted from the library without opening it

- **WHEN** the user activates a row's delete action
- **THEN** the dialog's footer asks for confirmation naming the query, and nothing is deleted yet
- **AND** confirming deletes it and refreshes the list, without loading it into the builder

#### Scenario: Delete is not offered for a common row the caller cannot write

- **GIVEN** a caller without `FULL_ADMIN`
- **WHEN** the Common tab is shown
- **THEN** its rows offer no delete action
- **AND** rows under My queries still do

#### Scenario: Empty state per tab

- **WHEN** a tab's scope has no saved queries
- **THEN** that tab shows its own empty state explaining how one is created

### Requirement: Saved query preview pane

The preview SHALL render, from the list entry already held: the name, the description when present, the
`source`, the `tag` when present, the period expressed by `time`, a "Shows as" value derived from
`result_view` together with `chart.type` when charted, and the stored body.

"Saved by" SHALL be rendered from `owner_email`, which is display only and SHALL NEVER be compared for any
ownership or permission decision. When `owner_email` is absent, the preview SHALL fall back: under
`personal` no attribution is shown at all (the author is always the caller); under `common` a neutral
placeholder is shown.

#### Scenario: Preview shows the query's shape

- **WHEN** a row is selected
- **THEN** the preview shows its name, source, tag, period, how it shows, and its body

#### Scenario: Attribution falls back when no author email was recorded

- **GIVEN** a `common` saved query whose `owner_email` is absent
- **WHEN** it is previewed
- **THEN** a neutral placeholder is shown in place of an author
- **AND** under `personal` scope no attribution row is rendered at all

### Requirement: Opening over unsaved changes is confirmed in the library footer

When the builder holds unsaved changes to a loaded saved query, the library's own footer SHALL become the
confirmation, offering **Keep editing** and **Discard and open**. A second modal SHALL NOT be stacked on
the library, and the existing discard-query popup — which guards switching from a written mode to the
Builder — SHALL NOT be reused for this and SHALL keep its current behavior.

#### Scenario: The footer becomes the confirmation

- **GIVEN** a loaded saved query has unsaved changes
- **WHEN** the user activates the open action for another saved query
- **THEN** the library footer offers Keep editing and Discard and open
- **AND** no second dialog is opened over the library

#### Scenario: Discarding opens the selected query

- **WHEN** the user chooses Discard and open
- **THEN** the selected saved query replaces the builder state, the rail, and the identity chip

### Requirement: Save dialog

The save dialog SHALL offer a required name, an optional description, an optional free-text tag, a
**Save to** destination, and a checkbox to save the current time period. When — and only when — the Chart
result view is open, it SHALL additionally offer an "open as a chart, with this setup" block reflecting
the current chart configuration.

The tag SHALL accept any text — the service stores it as free text with at most one per query, and no
vocabulary is enforced. Tags already in use at the selected scope SHALL be offered as one-click fills so
grouping does not fragment into near-duplicates, but SHALL NOT constrain what can be entered.

The dialog SHALL NOT show a summary of the builder state being captured: what is saved is whatever is on
screen behind the dialog, and restating it adds a second thing to keep in step with the builder.

**Save to** SHALL offer My queries always and Common only when `isFullAdmin` is true, since writing
`common` requires `FULL_ADMIN` and changing scope on a replace requires write permission for both the
stored and the requested scope.

Both destinations SHALL always carry a description — dropping one leaves the pair visibly lopsided. The
personal option SHALL claim privacy only when authentication is enabled; with authentication off nothing
is enforced and every scope is readable by everyone, so it SHALL describe where the query lands instead of
asserting a privacy that would not hold.

The save action SHALL be disabled while the name is blank or the query is not runnable, since a body the
service cannot translate cannot be stored.

#### Scenario: Common is offered only to a full admin

- **WHEN** a caller without `FULL_ADMIN` opens the save dialog
- **THEN** the Save to control does not offer Common

#### Scenario: Privacy copy gives way to a neutral description when authentication is off

- **GIVEN** authentication is disabled
- **WHEN** the save dialog is open
- **THEN** no copy claiming that only the current user can see a personal query is shown
- **AND** the personal destination still carries a description, so both options read alike

#### Scenario: Save is disabled for an unrunnable query

- **WHEN** the builder's Run action is disabled
- **THEN** the save dialog's save action is disabled

#### Scenario: The chart block appears only in the Chart view

- **WHEN** the save dialog is opened while the Table view is shown
- **THEN** no chart block is offered
- **AND** opening it from the Chart view offers the chart block reflecting the current setup

### Requirement: Loading a saved query into the builder

Opening a saved query SHALL replace the builder state, the rail, and the toolbar's source with the stored
query, and SHALL clear any previously shown result.

The view it opens in SHALL be derived from the body, never stored: `sql` set opens the SQL view seeded
with the stored text and treated as user-edited so it is not re-seeded; otherwise a builder-representable
`query` opens the Builder view and any other structured body opens the JSON view.

The schema for the stored query's entity SHALL be fetched on load and the builder state hydrated against
it, so the field list is the reader's own view of the catalog rather than the author's.

#### Scenario: A SQL saved query opens in the SQL view

- **WHEN** a saved query carrying `sql` is opened
- **THEN** the SQL view is shown seeded with the stored SQL
- **AND** it is treated as user-edited so entering the view does not re-seed it from a translation

#### Scenario: A non-representable query opens in the JSON view

- **WHEN** a saved query whose structured body is not builder-representable is opened
- **THEN** the JSON view is shown holding that body

#### Scenario: The schema is resolved for the loaded entity

- **WHEN** a saved query naming a different entity than the currently selected one is opened
- **THEN** that entity's schema is fetched and the builder is hydrated against it

### Requirement: Fields a loaded query cannot resolve are marked in place

The Query Builder SHALL load a saved query even when it references field names the caller cannot resolve.
When a loaded saved query references a field name that is not in the caller's resolved schema for its
source — in the projection, the filter, the having tree, the sort keys, or a group-by or aggregate
argument — the load SHALL still succeed and each unresolvable name SHALL be marked in place where it
appears. Run SHALL be disabled until every marked name is removed.

There SHALL be exactly one message for this state, phrased as "`<field>` isn't a field in `<source>`",
with one icon and one repair, identical whether the column was deleted from the catalog or is simply not
visible to this caller. The wording SHALL NOT distinguish the two causes. The words "restricted", "no
access", and any equivalent SHALL NOT be shown for a column anywhere in this feature.

Failing the whole load SHALL NOT be used: a saved query that cannot be opened is a saved query that
cannot be repaired.

#### Scenario: An unresolvable field marks the query and blocks Run

- **GIVEN** a saved query referencing a field absent from the caller's resolved schema
- **WHEN** it is opened
- **THEN** the query loads and that field is marked where it appears
- **AND** the message names the field and its source, and Run is disabled

#### Scenario: Removing the field re-enables Run

- **WHEN** the user removes every marked field
- **THEN** the marks clear and Run is enabled

#### Scenario: The wording does not disclose why a field is unresolvable

- **WHEN** a field is unresolvable because the caller may not see it
- **THEN** the message is identical to the one shown for a field that no longer exists

### Requirement: Loaded query identity and unsaved changes

A loaded saved query SHALL be identified beside the Query Builder heading by a chip showing its name and
its tag, marked when the query has diverged. There SHALL be no separate unsaved-changes banner: the chip
carries the signal and the toolbar carries the actions.

The chip SHALL offer a close action that detaches the builder from that saved query — clearing the chip,
the query actions and the overwrite target — while leaving the builder's current content untouched, so the
query becomes an unnamed scratch query rather than being discarded.

Divergence SHALL be determined by comparing the request payload the builder would send now against the
payload captured at the last successful load or save, so a changed sort, paging, chart, or captured time
period counts as a change exactly as a changed filter does.

Divergence SHALL be tracked only after a load. An unnamed scratch query has nothing to have diverged
from.

Revert SHALL restore the builder to the loaded saved query.

#### Scenario: The identity chip names the loaded query

- **WHEN** a saved query is loaded
- **THEN** a chip beside the heading shows its name and tag

#### Scenario: Closing the loaded query keeps its content

- **GIVEN** a loaded saved query, changed or not
- **WHEN** the user activates the chip's close action
- **THEN** the chip and the Revert, Edit and Delete actions disappear
- **AND** the builder still holds the same query, now as an unnamed scratch query

#### Scenario: Changing the sort marks the query as changed

- **GIVEN** a loaded saved query
- **WHEN** the user changes only its sort order
- **THEN** the chip is marked as diverged and Revert becomes enabled

#### Scenario: A scratch query is never marked as diverged

- **GIVEN** no saved query has been loaded
- **WHEN** the user builds and edits a query
- **THEN** no identity chip and no Revert, Edit or Delete actions are shown

#### Scenario: Revert restores the loaded query

- **WHEN** the user activates Revert
- **THEN** the builder returns to the loaded saved query and the bar disappears

### Requirement: Save, overwrite, revert, edit, and delete

The toolbar SHALL offer **Save**, plus **Revert**, **Edit** and **Delete** while a query is loaded.
`Ctrl`/`⌘`+`S` SHALL perform the same action as Save.

Save SHALL create a new saved query when none is loaded and SHALL replace the loaded one in place
otherwise. Revert SHALL restore the builder to the loaded saved query. Edit SHALL change the name,
description and tag without otherwise changing the stored body. Delete SHALL ask for confirmation before
removing the saved query.

Save SHALL be disabled when it would rewrite an unchanged saved query — that is, when a query is loaded,
the caller may overwrite it, and its payload has not diverged. A replace bumps `generation` and refreshes
`updated_at`, and the list is ordered by most recently updated, so an identical write would silently
reorder the library for no gain. The keyboard shortcut SHALL honour the same rule. Save SHALL remain
enabled with nothing loaded, and for a `common` query the caller cannot overwrite, where Save means
copying it into their own library rather than replacing it.

When a `common` saved query is loaded by a caller without `FULL_ADMIN`, Save SHALL instead create a copy
at `personal` scope, leaving the original untouched.

Revert, Edit and Delete SHALL be rendered only when a saved query is loaded.

#### Scenario: Save overwrites the loaded query

- **GIVEN** a loaded saved query with unsaved changes
- **WHEN** the user activates Save
- **THEN** the query is replaced in place and Revert becomes disabled again

#### Scenario: Save is disabled for an unchanged loaded query

- **GIVEN** a saved query has just been opened and nothing has been edited
- **THEN** the Save action is disabled
- **AND** it becomes enabled as soon as the query diverges, and disabled again on Revert

#### Scenario: Save stays available with nothing loaded

- **WHEN** no saved query is loaded
- **THEN** the Save action is enabled, since it creates rather than overwrites

#### Scenario: The keyboard shortcut saves

- **WHEN** the user presses `Ctrl`/`⌘`+`S` on the Query Builder page
- **THEN** the same action as Save is performed and the browser's own save dialog does not open

#### Scenario: A non-admin editing a common query can only copy it

- **GIVEN** a `common` saved query is loaded by a caller without `FULL_ADMIN`
- **THEN** saving creates a `personal` copy, leaving the original unchanged

#### Scenario: Delete confirms first

- **WHEN** the user chooses Delete
- **THEN** a confirmation is shown before the saved query is removed

### Requirement: Saved query failures are reported per machine code

Every saved-query write failure SHALL be reported using the service's machine code from the error
envelope, each with its own message and its own next step:

- `400 bad_request` — the body will not translate. The dialog SHALL stay open with its fields filled and
  SHALL surface the service's own message, because the fix is in the query rather than in the form.
- `422 sensitive_literal_not_allowed` — a literal is bound to a `sensitive` column. Blocking, with no
  workaround offered: the message SHALL name the column and SHALL give the only real next step, which is
  to run the query from the builder without saving. No parameter, placeholder, or save-anyway option
  SHALL be offered.
- `422 validation_error` — a blank name, both or neither body, a server-assigned or `params` field, a
  malformed `time` or `scope`, or an oversized body. Reported against the offending field where
  attributable and against the dialog otherwise.
- `403 forbidden` — writing `common` without `FULL_ADMIN`. Prevented by the scope gating, still handled,
  and offering Save as new into personal.
- `404 not_found` — an unknown id, or another caller's personal row. Treated as gone: the list SHALL be
  refreshed and the write SHALL NOT be retried.
- `500 principal_unavailable` — a personal save when the caller's principal cannot be resolved. The
  message SHALL state that it is a configuration problem and to contact an administrator, and SHALL NOT
  offer a retry.

An unrecognised code SHALL fall back to a generic failure message rather than displaying the raw code.

#### Scenario: An untranslatable body keeps the dialog filled

- **WHEN** a save is rejected with `400 bad_request`
- **THEN** the dialog stays open with its entered values
- **AND** the service's own message is shown

#### Scenario: A sensitive literal blocks the save with no workaround

- **WHEN** a save is rejected with `422 sensitive_literal_not_allowed`
- **THEN** the message names the column and directs the user to run the query without saving
- **AND** no parameter or save-anyway option is offered

#### Scenario: A missing principal is reported as a configuration problem

- **WHEN** a personal save is rejected with `500 principal_unavailable`
- **THEN** the message states it is a configuration problem and to contact an administrator
- **AND** no retry is offered

#### Scenario: A vanished saved query refreshes the list

- **WHEN** a replace or delete is rejected with `404 not_found`
- **THEN** the saved-query list is refreshed and the request is not retried

### Requirement: Saved queries carry no parameters

The Query Builder SHALL NOT offer parameters, placeholders, or substitution for saved queries in any form
— not in the payload, not in the UI, and not as a fallback for a save blocked by a sensitive literal. A
saved query SHALL be run by posting its stored `query` to the structured execute endpoint or its stored
`sql` to the SQL execute endpoint **unchanged**, with no substitution step.

#### Scenario: A saved query runs its stored body unchanged

- **WHEN** a loaded saved query is run
- **THEN** the stored body is posted to the existing execute endpoint without substitution

#### Scenario: No parameter affordance exists

- **WHEN** any saved-query surface is shown
- **THEN** no control for declaring, editing, or filling a parameter is present

## MODIFIED Requirements

### Requirement: Query Builder toolbar

The Query Builder page SHALL render an in-page toolbar containing, left to right: the source (entity) selector as a plain dropdown (`DialSelectField`, no schema-preview affordance), the shared time filter (`TimeFilter` with the global preset options and a custom-range picker), and — aligned to the right — the saved-query actions, the Copy action, and the Run primary action.

The saved-query actions SHALL be plain buttons rather than an overflow menu: **Saved queries**, which opens the library dialog, and **Save**, always present; plus **Revert**, **Edit**, and **Delete**, rendered only while a saved query is loaded, since each acts on one. Revert SHALL be disabled unless the loaded query has diverged. Edit SHALL open the save dialog on the query's name, description and tag without changing its stored body. The library action SHALL NOT carry a count badge: the number is not actionable on its own, and the tab headers inside the dialog already give the per-scope counts where they are useful. These act on the query rather than on the results grid, and SHALL therefore sit with Copy and Run rather than in the results area.

The page heading SHALL additionally carry the loaded saved query's identity chip, which marks divergence; there SHALL be no separate unsaved-changes banner.

#### Scenario: Toolbar composition

- **WHEN** the user opens the page with entities loaded
- **THEN** the toolbar shows the source dropdown, the time filter, and the Run action

#### Scenario: Saved-query actions sit with Copy and Run

- **WHEN** the user opens the page with entities loaded
- **THEN** the Saved queries and Save actions are shown alongside Copy and Run
- **AND** the Saved queries action shows no count badge
- **AND** no overflow menu is rendered

#### Scenario: Query actions require a loaded query

- **WHEN** no saved query is loaded
- **THEN** the Revert, Edit and Delete actions are not rendered

#### Scenario: Revert is available only once the query diverges

- **GIVEN** a saved query has just been opened and nothing has been edited
- **THEN** Revert is disabled
- **AND** it becomes enabled once the query diverges, and disabled again after reverting

### Requirement: Time range is part of the structured query

The toolbar time filter SHALL be a query control: its resolved range SHALL serialize into the structured query's filter as `ge`/`le` predicates on the source's automatically detected timestamp field (the first temporal-typed field of the loaded schema). The serialized query — as shown in the JSON view, copied by the Copy action, and executed by Run — SHALL include these predicates; nothing is added invisibly at execution time. The time predicates SHALL NOT be shown in the visual Filters tree — the toolbar control is their editor. When parsing JSON back into builder state, a matching `ge` + `le` predicate pair on the timestamp field SHALL be lifted into the toolbar control (displayed as a custom range); time conditions in any other shape or on other fields SHALL remain ordinary filter conditions. When the schema has no temporal field, no time predicates SHALL be serialized and the query runs without a time bound. SQL text SHALL never be modified by the time filter.

The body persisted for a **saved query** is the one exception: it SHALL be built without the toolbar time bound, and the user's time intent SHALL travel separately in the saved query's `time` member. A relative period SHALL NEVER be resolved into absolute instants for storage.

#### Scenario: Time range serializes into the query

- **WHEN** the user has a time range selected and the schema has a temporal field
- **THEN** the serialized query's filter includes `ge` and `le` predicates on that field for the resolved range
- **AND** the JSON view displays these predicates
- **AND** the visual Filters tree does not display them

#### Scenario: JSON time predicates round-trip into the toolbar control

- **WHEN** the user edits the JSON's `ge`/`le` predicate pair on the timestamp field to a different range and the JSON is otherwise representable
- **THEN** the toolbar time filter reflects the edited range as a custom range
- **AND** the predicates do not appear in the visual Filters tree

#### Scenario: No temporal field

- **WHEN** the loaded schema has no temporal-typed field
- **THEN** the serialized query contains no time predicates and the run is not time-bounded

#### Scenario: SQL runs are not modified

- **WHEN** the user runs a query from the SQL view
- **THEN** the executed SQL is exactly the editor text

#### Scenario: A saved body carries no toolbar time bound

- **WHEN** the same query is saved and run
- **THEN** the run's query carries the `ge`/`le` predicates and the saved body does not
- **AND** the saved query's time intent is carried by its `time` member instead

### Requirement: Result table and chart views

The results area SHALL offer a Table ⇄ Chart switcher. The Table view SHALL render the result grid. Each result column SHALL render its row's actual value looked up by its exact column name, including a column name that itself contains a literal `.` (for example an enrichment projection's `table.column`) — such a name SHALL NOT be treated as a nested-path lookup. The Chart view SHALL render the result with ECharts and offer a chart-type control with four types — bar, line, pie, and scatter — plus two column selectors whose allowed columns and labels follow the selected type. The Chart view SHALL be available only when the shown result came from an aggregate-mode structured run with at least one group-by or bucket column; otherwise the Chart view SHALL show a hint that charts require an aggregate result with a group-by. Chart colors SHALL come from the shared chart color tokens.

The selected result view and the chart configuration SHALL be owned by the Query Builder and passed to the results area as controlled values, so both can be captured into a saved query and restored from one. The results area SHALL hold no independent copy. A new result SHALL reset the chart configuration to its default, except for the first result after a saved query carrying a chart was loaded, which SHALL keep the loaded configuration.

For **bar** and **line**, the selectors SHALL be labeled X axis and Y axis: X over the executed query's group-by/bucket columns, Y over its aggregate columns (including the count column when present); defaults SHALL be the first dimension and the first aggregate. When every X value is numeric or date-like, the chart SHALL order the points along the X axis by that natural order (chronological/numeric ascending) regardless of the query's row order; mixed or plain-text X values keep row order. Long X-axis labels SHALL be truncated to a fixed label width with the full value available in the tooltip.

For **pie**, the same two selectors SHALL be labeled Category (group-by/bucket columns) and Value (aggregate columns). The chart SHALL show at most the top 10 categories by value as slices; any remaining categories SHALL be merged into a single "Other" slice.

For **scatter**, both selectors SHALL be labeled X axis and Y axis and SHALL offer the result's numeric columns — the group-by/bucket and aggregate columns whose every value is numeric or date-like. Each result row (one group) SHALL render as one point, with the row's dimension values available in the point tooltip; scatter SHALL NOT re-order rows. The scatter type SHALL be offered only when the result has at least two numeric columns; otherwise it is hidden from the chart-type control.

Switching chart type SHALL keep a column pick that is valid for the new type's selector and SHALL fall back to that selector's first valid default otherwise.

Everywhere the chart names a column — selector options, in-chart axis titles, and point tooltips — a group-by/bucket column SHALL display by its schema display name when the executed entity defines one (raw name otherwise); aggregate and scalar-function columns display by their user-authored alias. The labels SHALL follow the executed query's entity, not the currently selected source.

#### Scenario: Chart columns display by their schema display name

- **WHEN** an aggregate result grouped by a column whose schema defines a display name is charted
- **THEN** the axis selector and the chart axis title show the display name instead of the raw column name
- **AND** aggregate columns keep their user-authored aliases

#### Scenario: Chart renders for an aggregate result

- **WHEN** the shown result came from an aggregate run grouped by one field and the user selects the Chart view
- **THEN** a chart renders with the group-by column on X and an aggregate column on Y
- **AND** the user can switch between bar, line, pie, and scatter types

#### Scenario: Pie buckets the long tail into Other

- **WHEN** an aggregate result has more than 10 category values and the user selects the pie type
- **THEN** the pie shows the top 10 categories by value as slices
- **AND** the remaining categories are merged into a single "Other" slice

#### Scenario: Scatter plots one point per group

- **WHEN** an aggregate result grouped by one field has two aggregate columns and the user selects the scatter type
- **THEN** each group renders as one point with one aggregate on X and the other on Y
- **AND** the point tooltip shows the group's dimension value

#### Scenario: Scatter requires two numeric columns

- **WHEN** the shown aggregate result has only one numeric column
- **THEN** the scatter type is not offered in the chart-type control

#### Scenario: Column picks survive a compatible type switch

- **WHEN** the user configured Category and Value on a pie and switches to the bar type
- **THEN** the same columns stay selected as X and Y

#### Scenario: Comparable X values are ordered on the axis

- **WHEN** a top-N-by-count aggregate result has time-bucket X values and the user opens the Chart view
- **THEN** the chart shows the buckets in chronological order along the X axis
- **AND** the table keeps the query's row order

#### Scenario: Chart hint for non-aggregate results

- **WHEN** the shown result came from a row-mode or SQL run and the user selects the Chart view
- **THEN** a hint explains that charts require an aggregate result with a group-by

#### Scenario: A dotted column name still shows its value

- **WHEN** a result row includes a column whose name contains a literal `.` (e.g. an enrichment projection) and the backend response carries a value for it
- **THEN** the Table view shows that value in the corresponding cell rather than leaving it blank

#### Scenario: A new run resets the chart configuration

- **GIVEN** a chart configuration chosen for the shown result
- **WHEN** a new result arrives from a run that did not follow a saved-query load
- **THEN** the chart configuration returns to its default

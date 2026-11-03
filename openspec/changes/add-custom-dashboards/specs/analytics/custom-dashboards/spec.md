## Purpose

Custom dashboards as addressable objects: a named page of widgets, each one a saved query rendered in its
own result view, laid out on a grid the user arranges, under one time range shared by the whole page.

## ADDED Requirements

### Requirement: A custom-dashboards flag gates every custom dashboard surface

The system SHALL expose an environment variable, `ANALYTICS_CUSTOM_DASHBOARDS_ENABLED`, read where the
other feature flags are initialized with the existing truthy helper, surfaced on the feature-flags model
alongside them, and declared in the environment template as a commented entry. Custom dashboards SHALL be
available only while the flag is truthy **and** `/dashboards` serves the analytics page; in every other
configuration the dashboard switcher, the `/dashboards/[id]` route and the query page's Add to dashboard
SHALL be absent, and `/dashboards/[id]` SHALL answer as not found.

#### Scenario: Flag on with the analytics page shows custom dashboards

- **GIVEN** the custom-dashboards flag resolves truthy and `/dashboards` serves the analytics page
- **WHEN** the user opens `/dashboards`
- **THEN** the dashboard switcher is shown in the page header

#### Scenario: Flag off leaves the page as it is

- **GIVEN** the custom-dashboards flag is unset
- **WHEN** the user opens `/dashboards`
- **THEN** no dashboard switcher is shown and the usage dashboard renders as before

#### Scenario: Flag off makes a dashboard address not found

- **GIVEN** the custom-dashboards flag is unset
- **WHEN** the user opens `/dashboards/<id>`
- **THEN** the route answers as not found

#### Scenario: The flag alone does not serve custom dashboards

- **GIVEN** the custom-dashboards flag resolves truthy but `/dashboards` serves the telemetry dashboard
- **WHEN** the user opens `/dashboards/<id>`
- **THEN** the route answers as not found

### Requirement: Dashboard and widget model

A custom dashboard SHALL carry an id, a name, an optional description, a visibility (Private or Public),
its owner, a time intent in the same shape a saved query stores (a relative period, or an absolute from–to
pair), an ordered list of widgets, a generation, and creation and modification timestamps. A widget SHALL
be part of its dashboard and SHALL NOT exist on its own: it SHALL carry an id unique within the dashboard,
exactly one query source, an optional title, an optional description, a row limit, and a placement of
column, row, width and height on a 12-column grid.

A widget's query source SHALL be either a **reference** to a saved query by id, or an **inline query**: a
name, a body (a structured query or a SQL statement), a result view and a chart configuration, held in the
widget itself. A reference SHALL hold no copy of the saved query; an inline query SHALL NOT follow any saved
query it was copied from. A widget with both sources or neither SHALL be refused.

The row limit SHALL always be stored as an explicit integer from 1 to 1000. A widget's width SHALL be
from 1 to 12, and column plus width SHALL NOT exceed 12.

#### Scenario: A widget shows its saved query's current state

- **GIVEN** a widget references a saved query
- **WHEN** the saved query's chart type is changed and saved on the query page, and the dashboard is
  reopened
- **THEN** the widget renders with the new chart type

#### Scenario: A widget with no query source is refused

- **WHEN** a dashboard is written with a widget that has neither a saved-query reference nor an inline query
- **THEN** the write is refused and the dashboard is unchanged

#### Scenario: A row limit outside the range is refused

- **WHEN** a dashboard is written with a widget whose row limit is 0 or 1001
- **THEN** the write is refused and the dashboard is unchanged

### Requirement: Dashboards server API layer

The system SHALL provide a server API for custom dashboards behind server actions that authenticate the
caller like every other Analytics action. It SHALL list dashboards (id, name, description and
modification timestamp, without widgets), read one dashboard with its widgets, create a dashboard,
replace a whole dashboard, and delete one. Every change to a dashboard or any of its widgets SHALL be one
replace of the whole dashboard; there SHALL be no operation that writes a single widget.

Dashboards SHALL be stored by the Analytics service, so every server instance and every restart sees the
same dashboards. A replace SHALL carry the generation the caller last read and SHALL be refused when the
stored dashboard has moved on, so two editors never silently overwrite each other. A write the service
refuses SHALL show the service's own message in an error notification. Server actions SHALL return the
standard `{ success, data?, errorHeader?, errorMessage? }` shape.

#### Scenario: Adding a widget writes the whole dashboard

- **WHEN** a widget is added to a dashboard
- **THEN** the dashboard is written once, with its complete widget list including the new widget

#### Scenario: A stale replace is refused

- **GIVEN** a dashboard was read at one generation and has since been saved by someone else
- **WHEN** the first caller saves their copy
- **THEN** the save is refused, an error notification says the dashboard was changed elsewhere, and the
  editor keeps the caller's unsaved layout

#### Scenario: A dashboard is read in one request

- **WHEN** a dashboard page opens
- **THEN** the dashboard and all of its widgets arrive in one read

### Requirement: Private and Public dashboards

A dashboard SHALL be Private or Public. A Private dashboard SHALL be visible to and writable by its owner
only; a Public dashboard SHALL be visible to every caller who can open the Analytics Dashboards page and
writable only by a caller the service allows to publish, the permission that also guards writing a common
saved query. A new dashboard SHALL be Private, unless the caller may create only Public ones. Changing a dashboard's visibility, in either direction,
SHALL require that permission. A dashboard the caller may not see SHALL be answered as not found,
identically to one that does not exist, and SHALL NOT be listed. With authentication disabled no owner is
known and every dashboard SHALL be visible and writable, as the service does for saved queries.

What the caller may do — write a dashboard, publish it, create a Private or a Public one — SHALL be taken
from what the service reports for that caller with the dashboard and the list, and SHALL NOT be inferred
from the caller's roles. Create dashboard SHALL be offered only to a caller who may create a dashboard,
and Add to dashboard SHALL offer it only to one who may create a Private one. The create modal SHALL offer
the visibility only to a caller who may create both, and Edit details only to one who may publish. On a dashboard the caller may not write, Edit layout, Edit details and Delete SHALL be absent
rather than offered and refused.

Making a dashboard Public SHALL turn every widget that references a **personal** saved query into an inline
copy of that query — its name, body, result view and chart configuration — and SHALL give an untitled
widget the query's name as its title, because other viewers could not read the personal query. A widget
that references a common saved query SHALL keep its reference. Before the change is written, a
confirmation SHALL name each personal query that will be copied and state that its text becomes visible to
everyone who can open the dashboard. Making a dashboard Private SHALL leave inline copies as they are.
Adding a personal saved query to a Public dashboard, from Add widget or from a query page's Add to
dashboard, SHALL store it as an inline copy for the same reason. Once that pair is picked — a personal
query and a Public dashboard — the modal SHALL show a warning banner beneath the field just chosen, before
the add, stating that the query is copied, that its text becomes visible to everyone who can open the
dashboard, and that later changes to the query do not reach the widget. A common query, or a Private
dashboard, SHALL show no banner. Add to dashboard SHALL list only the dashboards the caller may write.

#### Scenario: A caller who may create no dashboard is not offered one

- **GIVEN** the service reports that the caller may create neither a Private nor a Public dashboard
- **WHEN** the caller opens the dashboard switcher
- **THEN** the dashboards are listed and Create dashboard is absent

#### Scenario: Another user's private dashboard is not found

- **GIVEN** a Private dashboard owned by another user
- **WHEN** the caller opens its address
- **THEN** the route answers as not found and the switcher does not offer it

#### Scenario: Publishing copies personal queries

- **GIVEN** a Private dashboard with one widget on a personal saved query and one on a common saved query
- **WHEN** a caller who may publish makes it Public and confirms
- **THEN** the confirmation named the personal query before the write
- **AND** the first widget now holds an inline copy titled with the query's name
- **AND** the second widget still references the common query

#### Scenario: Adding a personal query to a public dashboard warns before the add

- **GIVEN** a Public dashboard and a personal saved query
- **WHEN** a caller who may publish picks that query in Add widget, or that dashboard in the query's Add to dashboard
- **THEN** a warning banner beneath the chosen field says the query is copied and its text becomes visible to
  every viewer of the dashboard
- **AND** picking a common query, or a Private dashboard, shows no banner

#### Scenario: A viewer cannot edit a public dashboard

- **GIVEN** a Public dashboard
- **WHEN** a caller the service does not allow to write it opens it
- **THEN** Edit layout, Edit details and Delete are not offered

### Requirement: A widget never shows data its viewer may not read

Every widget SHALL run its query with the viewing caller's own credentials, so the service applies that
caller's table access, sensitive-column clearance and row policies. A dashboard SHALL NOT store any query
result, and no result SHALL be reused across callers.

A widget whose saved query the viewer cannot read, or whose run the service refuses for lack of access,
SHALL show one placeholder, identical in both cases, stating that the widget is not available to the
viewer. The placeholder SHALL NOT show the saved query's name, any figure, or a Retry control, and SHALL keep
the widget's own title and description, which the dashboard's author wrote. Any other failure SHALL keep
the error state with Retry. When every widget of a dashboard is unavailable, the dashboard SHALL show one
message saying so in place of its grid, and SHALL remain listed.

#### Scenario: An unreadable query shows the placeholder

- **GIVEN** a widget whose saved query the viewer cannot read
- **WHEN** the dashboard loads
- **THEN** the widget shows the not-available placeholder with no Retry and no query name

#### Scenario: A dashboard with nothing to show says so

- **GIVEN** a dashboard none of whose widgets the viewer can read
- **WHEN** the dashboard loads
- **THEN** one dashboard-level message replaces the grid

### Requirement: Create a dashboard

Creating a dashboard SHALL open a modal with a **required** name and an optional description. A blank
name SHALL block submission; a name already in use SHALL NOT. The new dashboard SHALL start with no
widgets and with the time intent the usage dashboard opens with. On success the modal SHALL close and the
browser SHALL navigate to the new dashboard in edit mode; on failure an error notification SHALL be shown
and the modal SHALL stay open with the entered values intact.

#### Scenario: Blank name blocks creation

- **WHEN** the user leaves the name empty in the create modal
- **THEN** the create control is unavailable

#### Scenario: A created dashboard opens empty in edit mode

- **WHEN** the user submits the create modal with a name
- **THEN** the browser navigates to the new dashboard's address
- **AND** the dashboard is in edit mode and shows its empty state

### Requirement: Rename and delete a dashboard

A custom dashboard's header SHALL offer Edit details (name, description and default compare, in the create
modal's field set) and Delete. Delete SHALL ask for confirmation naming the dashboard; on confirmation the dashboard
SHALL be deleted, a success notification shown, and the browser SHALL navigate to `/dashboards`.
Cancelling SHALL leave the dashboard as it was. Deleting a dashboard SHALL NOT delete the saved queries
its widgets reference.

#### Scenario: Delete returns to the built-in dashboard

- **WHEN** the user deletes a custom dashboard and confirms
- **THEN** the browser is on `/dashboards` showing the usage dashboard
- **AND** the deleted dashboard is no longer offered by the switcher

#### Scenario: Delete keeps the saved queries

- **WHEN** a dashboard with widgets is deleted
- **THEN** every saved query its widgets referenced is still listed on the queries page

### Requirement: View mode and edit mode

A custom dashboard SHALL open in view mode, in which widgets can be neither moved nor resized. Its header
SHALL offer one actions menu holding Edit details, Edit layout and Delete dashboard. Edit layout SHALL
switch to edit mode, in which widgets can be added, removed, moved, resized and retitled, and the menu
SHALL be replaced by Add widget and Cancel. Once the draft differs from the stored dashboard, Cancel SHALL
be replaced by Discard and Save. Cancel SHALL return to view mode without confirmation. Discard SHALL ask
for confirmation and restore the stored dashboard. Save SHALL write the whole dashboard and return to view
mode; on failure the editor SHALL stay in edit mode with the draft intact.

#### Scenario: View mode cannot be rearranged

- **GIVEN** a dashboard in view mode
- **WHEN** the user drags a widget
- **THEN** the widget does not move

#### Scenario: Edit mode without changes offers only Cancel

- **WHEN** the user chooses Edit layout and changes nothing
- **THEN** Cancel is offered, Save and Discard are not, and Cancel returns to view mode without asking

#### Scenario: Discard restores the stored layout

- **WHEN** the user moves a widget in edit mode, discards and confirms
- **THEN** the widget is back in its stored place and the dashboard is in view mode

### Requirement: Widgets are laid out on a 12-column grid that packs upwards

The grid SHALL have 12 columns and SHALL pack widgets upwards, so removing a widget closes the gap below
it. In edit mode widgets SHALL be moved by dragging and resized by dragging their corner. Below a 768px
viewport the grid SHALL show one column in placement order (top to bottom, then left to right) and edit
mode SHALL be unavailable.

#### Scenario: A removed widget's gap closes

- **GIVEN** a widget directly below another one in edit mode
- **WHEN** the upper widget is removed
- **THEN** the lower widget moves up into its place

#### Scenario: A narrow viewport stacks widgets

- **WHEN** a dashboard is shown in a viewport narrower than 768px
- **THEN** widgets are stacked in one column and Edit layout is unavailable

### Requirement: Layout changes are reachable without a pointer

In edit mode each widget's menu SHALL offer Move up, Move down, and a size of Small, Medium or Large, which
set the widget's width and height to 4×3, 6×4 and 12×4 grid units respectively; dragging a corner SHALL not
shrink a widget below Small. A Single value widget SHALL instead always take the Extra small size, 3×2 grid
units, SHALL offer no size in its menu and SHALL not be resized by its corner; a widget switched to Single
value SHALL take that size, and a widget switched away from it SHALL take Medium. Move up and Move
down SHALL swap the widget with its neighbour in placement order. The menu SHALL be reachable by keyboard
and each item SHALL have an accessible name. Move up SHALL be unavailable on the first widget and Move
down on the last.

#### Scenario: Move down by keyboard

- **GIVEN** a dashboard in edit mode with two widgets
- **WHEN** the user opens the first widget's menu with the keyboard and activates Move down
- **THEN** the first widget now follows the second in placement order

#### Scenario: Size preset

- **WHEN** the user picks Large in a widget's menu
- **THEN** the widget spans all 12 columns

#### Scenario: A single value keeps its own size

- **WHEN** the user switches a widget's view to Single value
- **THEN** the widget takes 3×2 grid units and its menu offers no size

### Requirement: Add a widget from a dashboard

In edit mode a dashboard SHALL offer Add widget, which opens a modal with a **Source** choice — Saved
query (the default) or SQL — an optional title, an optional description, and a **Row count** field. Saved
query SHALL show a **required** picker listing personal and common saved queries; SQL SHALL show a
**required** SQL statement field — a SQL editor that highlights, formats and completes keywords as the query
builder's SQL view does — and SHALL require a title, since no query name can head the widget. A SQL
statement SHALL be stored as the widget's inline query in the table view, and SHALL be judged composite or
not exactly as a SQL saved query is. Once a saved query is picked, the modal and Edit settings SHALL show a
read-only preview of its body — the SQL statement of a SQL query, or the structured body of any other —
beside its result view. The Row
count label SHALL carry an info hint stating the allowed range, 1 to 1000. Picking a saved query SHALL
fill the field with the page limit that query was saved with, capped at 1000, or with 100 when it has
none, unless the user has already edited the field. The field SHALL accept whole numbers only, and SHALL show an error for a value outside 1 to 1000 once the
field loses focus or on submission. An emptied Row count SHALL be stored as 100. The new widget SHALL be
placed at column 0 below the lowest widget, with the Medium size. The addition SHALL be part of the
draft and SHALL be persisted by Save.

#### Scenario: A widget is added at the bottom

- **WHEN** the user adds a widget for a saved query
- **THEN** the new widget appears below every existing widget, at the left edge, in the Medium size

#### Scenario: Row count starts from the query's own limit

- **GIVEN** a saved query saved with a page limit of 10
- **WHEN** the user picks it in Add widget
- **THEN** Row count shows 10

#### Scenario: Row count out of range blocks the add

- **WHEN** the user enters 1001 in Row count and leaves the field
- **THEN** the field shows its range error and the add control is unavailable

#### Scenario: Emptied row count falls back to the default

- **WHEN** the user clears Row count and adds the widget
- **THEN** the widget is stored with a row limit of 100

#### Scenario: The range is stated on the label

- **WHEN** the user focuses the info hint next to the Row count label
- **THEN** the hint states that the allowed range is 1 to 1000

### Requirement: Widget settings and removal

In edit mode each widget's menu SHALL offer Edit settings (title, description, View, and Row count with the
same rules as Add widget, plus the SQL statement of an inline query) and Remove. In both modes a widget that
references a saved query SHALL offer Open query, which navigates to that saved query's page; a widget with
an inline query SHALL NOT. A widget without a title SHALL be headed by its saved query's name. A widget's description
SHALL be shown under its title; a Single value widget, whose card has no room for it, SHALL offer it as an info
hint beside its title instead. A dashboard's description SHALL be shown under the dashboard's controls.

#### Scenario: A widget's description is shown

- **WHEN** a widget has a description
- **THEN** its card shows the description under the title

#### Scenario: Untitled widget uses the query name

- **WHEN** a widget has no title
- **THEN** its header shows the referenced saved query's name

#### Scenario: Open query navigates to the saved query

- **WHEN** the user activates Open query on a widget
- **THEN** the browser navigates to that saved query's page

### Requirement: A widget renders its saved query's result view

A widget SHALL render the referenced saved query's result with that query's stored result view — the
result table or the chart — and its stored chart configuration, re-deriving unset chart axes from the
result as the query page does. Each widget SHALL request its data independently, so one slow or failing
widget does not hold up or blank the others. While its data loads a widget SHALL show a loading state;
an empty result SHALL show an empty state; a failure SHALL show an error state in the widget with a Retry
control, and SHALL NOT raise a page notification. A saved query that no longer exists or cannot be read
SHALL show the not-available placeholder instead, as stated under data access.

#### Scenario: Chart query renders as a chart

- **WHEN** a widget references a saved query stored in the chart view
- **THEN** the widget shows the chart with the stored chart type and axis columns

#### Scenario: A failing widget does not affect the others

- **GIVEN** a dashboard with two widgets, one of whose queries fails
- **WHEN** the dashboard loads
- **THEN** the failing widget shows its error state with Retry
- **AND** the other widget shows its result

#### Scenario: A deleted saved query shows the placeholder

- **GIVEN** a widget whose saved query has been deleted
- **WHEN** the dashboard loads
- **THEN** the widget shows the not-available placeholder and its menu still offers Remove in edit mode

### Requirement: The dashboard's time range governs its widgets

A custom dashboard's header SHALL show the same period selector as the usage dashboard, initialised from
the dashboard's stored time intent. Every widget whose query takes a time range SHALL be run over the
selected range, which SHALL replace the saved query's own time intent. In view mode a range change SHALL
re-run the widgets and SHALL NOT be saved; in edit mode it SHALL be part of the draft and persisted by
Save.

A query takes a time range when it is a structured query, or a SQL query whose statement translates to a
single structured query. For those the range SHALL be applied as on the query page — bounds on the first
temporal field of the query's entity — and the widget's row limit SHALL be the page limit of the request.

#### Scenario: A range change re-runs widgets without saving

- **GIVEN** a dashboard in view mode stored with the last 7 days
- **WHEN** the user selects the last 24 hours
- **THEN** every widget that takes a time range is re-run over the last 24 hours
- **AND** reopening the dashboard shows the last 7 days again

#### Scenario: A single-entity SQL query follows the range

- **GIVEN** a widget references a SQL saved query over one entity without a join or a subquery
- **WHEN** the dashboard's range changes
- **THEN** the widget is re-run over the new range with at most its row limit of rows

### Requirement: A dashboard compares against an earlier period

A custom dashboard's header SHALL offer the same Compare selector as the usage dashboard — Off, Previous
period, Previous month, Previous year — beside the period selector. A dashboard SHALL store its compare
choice; a dashboard stored without one SHALL compare Off. The create modal and Edit details SHALL offer a
Default compare field with the same choices, Off by default, which sets the stored choice; saving Edit details
SHALL apply the new choice at once. The header's compare choice SHALL follow the period selector's persistence
rule: transient in view mode, part of the draft in edit mode.

While compare is on, a widget whose query takes a time range and whose view is Single value, Time series,
Table, or the query's own view when that is a table SHALL also run its query over the compared window,
computed as on the usage dashboard. A Single value widget SHALL show the change against the compared value;
a Time series widget SHALL draw the compared window as a second, dashed line aligned bucket by bucket; a
table SHALL show each aggregate figure with its change badge beside it, drawn by the usage breakdown's own
measure cell, against the compared row with the same dimension values, and no badge for a row the compared
window lacks. Share, Activity heatmap, a chart, and composite SQL widgets SHALL show only the current
window. The widget's "A rise is" setting SHALL colour the badges of Single value and table views.

A chart, donut or share whose category value is empty SHALL name that category "(no value)" rather than
leave its label blank, on a widget and on the query page alike.

#### Scenario: Compare is off on a new dashboard

- **WHEN** the user creates a dashboard leaving Default compare unchanged
- **THEN** its Compare selector shows Off and no widget runs a second request

#### Scenario: Edit details sets the compare a dashboard opens with

- **WHEN** the user sets Default compare to Previous period in Edit details, saves, and reopens the dashboard
- **THEN** its Compare selector shows Previous period

#### Scenario: A table shows each figure's change

- **WHEN** compare is on and a widget shows a table grouped by a dimension
- **THEN** each aggregate cell shows its figure with a change badge against the matching compared row

#### Scenario: A single value shows its change

- **GIVEN** a Single value widget on a dashboard comparing against the previous period
- **WHEN** the dashboard loads
- **THEN** the widget shows its value and its change against the previous period

### Requirement: A widget offers only the views its result fits

A widget SHALL have a view: the query's own view (the default — its stored table or chart), Table,
Single value, Time series, Share or Activity heatmap. Edit settings SHALL offer a View picker listing only
the views the widget's latest result fits, judged from the executed query's dimension and aggregate
columns:

- Table and the query's own view fit every result.
- Single value fits one row with no dimension column and at least one aggregate column; it shows one
  aggregate — the one chosen in Edit settings, by default the first — as the usage dashboard's KPI card:
  the widget title (or the column's label), the figure, its trend over the range as a sparkline, and while
  comparing the change badge and the compared value. The badge is coloured by the widget's "A rise is"
  setting — good news (the default) or bad news.

A Single value or Share widget SHALL have a Unit setting — Number (the default), Money, Percent (the
figure is already a percentage) or Duration (milliseconds) — that writes its figures the way the usage
dashboard writes the matching measure. Money SHALL also take a currency, US dollars by default, whose sign
prefixes the figure.
- Time series fits exactly one dimension column, of a date-time value, and at least one aggregate column;
  it plots the first aggregate over that column in time order. A lone line is named by its column; only
  beside a compared line is it named the current period.
- Share fits exactly one dimension column that is not a date-time value and at least one aggregate column;
  it shows the first aggregate as the usage dashboard's donut: its largest five values with the rest folded
  into Others, the total in the ring, and a legend stating each slice's figure and share.
- Activity heatmap fits exactly one date-time dimension column and at least one aggregate column; it sums
  the first aggregate by day and hour of day over the calendar week (Monday to Sunday) holding the end of
  the dashboard range, whatever range is selected — the usage dashboard's heatmap grid, a row for every day
  and hours still to come left empty.

Every widget SHALL be framed by the usage dashboard's card, and the Single value, Time series, Share and
Activity heatmap views SHALL be drawn by the usage dashboard's own KPI card, line chart, donut and heatmap
grid, so a widget and the matching usage dashboard block look the same.

A composite SQL widget SHALL offer only Table and the query's own view. A widget whose stored view no
longer fits its result SHALL render the query's own view. Add widget and Add to dashboard SHALL create a
widget with the query's own view.

#### Scenario: Views that do not fit are not offered

- **GIVEN** a widget whose result has one text dimension and one aggregate
- **WHEN** the user opens its settings
- **THEN** the View picker offers the query's own view, Table and Share, and not Single value, Time series
  or Activity heatmap

#### Scenario: A view that stopped fitting falls back

- **GIVEN** a widget stored with the Time series view
- **WHEN** its saved query no longer groups by a date-time column
- **THEN** the widget renders the query's own view

### Requirement: A composite SQL widget runs as written and says so

A SQL query whose statement does not translate to a single structured query (a join, a subquery or a
derived table) SHALL run as written: the dashboard's range and the widget's row limit SHALL NOT be
applied to it. The widget's header SHALL carry an info hint saying that it uses the time range and row
limit written in its query rather than the dashboard's. In the widget's settings the Row count field SHALL
be unavailable and its info hint SHALL say the row count is set by the query's LIMIT. Whether a query is
composite SHALL be determined each time the dashboard loads, because the saved query can change after the
widget was added.

#### Scenario: Composite SQL is marked

- **GIVEN** a widget references a SQL saved query with a join
- **WHEN** the dashboard loads
- **THEN** the widget header shows the info hint about its own time range
- **AND** a dashboard range change does not re-run that widget

#### Scenario: Composite SQL row count is not editable

- **GIVEN** a widget references a composite SQL saved query
- **WHEN** the user opens its settings in edit mode
- **THEN** Row count is unavailable and its hint names the query's LIMIT

### Requirement: An empty dashboard invites the first widget

A dashboard with no widgets SHALL show an empty state. In edit mode the empty state SHALL offer Add
widget; in view mode it SHALL offer Edit layout.

#### Scenario: Empty dashboard in view mode

- **WHEN** the user opens a dashboard with no widgets in view mode
- **THEN** the empty state offers Edit layout

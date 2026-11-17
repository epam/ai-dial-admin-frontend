## ADDED Requirements

### Requirement: Query page layout

The Query Builder SHALL be rendered by two pages: the draft builder (`app/[lang]/queries/page.tsx`) and
a saved query's page (`app/[lang]/queries/[id]/page.tsx`). Both SHALL be laid out to the right of the
Source panel specified in `analytics/source-panel`, as one column holding, top to bottom: the page
heading with its description and actions, the view switcher row with the Run action, the builder area,
and the results area. When the assistant is enabled its panel SHALL sit to the right of that column.

The heading SHALL show the saved query's name, or the draft's table name. Under it the page SHALL show
a description when there is one — the saved query's description, or the draft table's description —
on one line, with a control that expands it to its full text when it does not fit. A page with no
description SHALL show no description line.

The builder area SHALL sit above the results area, separated from it by a handle the user can drag, or
move with the keyboard, to change the builder area's height. The height SHALL stay within a minimum
that keeps one row of chips visible and a maximum that leaves the results area usable, and SHALL be
remembered in the browser across reloads. The handle SHALL carry an accessible name and expose its
value.

The builder SHALL be reachable both through a saved query and as a draft with no stored query behind
it. On both pages the breadcrumbs SHALL show the Queries section only; a saved query's identifier SHALL
NOT appear as a breadcrumb. The page SHALL offer no control that switches its source.

Base form controls SHALL come from the DIAL UI Kit and tabular results SHALL be displayed with the
app's grid stack.

#### Scenario: A saved query renders the layout

- **WHEN** the user opens a saved query
- **THEN** the query's name is shown as the heading
- **AND** the view switcher with Run, the builder area and the results area are shown one under another
- **AND** no rail is shown beside the results

#### Scenario: A draft renders the same layout

- **WHEN** the user opens the draft builder
- **THEN** the draft's table name is shown as the heading
- **AND** the view switcher, the builder area and the results area are shown as on a saved query

#### Scenario: A description is shown under the heading

- **WHEN** the draft's table has a description
- **THEN** the description is shown on one line under the heading

#### Scenario: A long description expands

- **WHEN** the description does not fit one line and the user activates its expand control
- **THEN** the full description is shown

#### Scenario: No description means no line

- **WHEN** the page's table or query has no description
- **THEN** no description line and no expand control are shown

#### Scenario: The builder area is resized

- **WHEN** the user drags the handle between the builder area and the results
- **THEN** the builder area's height follows, within its minimum and maximum
- **AND** the results area takes the remaining height

#### Scenario: The height is remembered

- **WHEN** the user resizes the builder area and reloads the page
- **THEN** the builder area has the height the user left it at

#### Scenario: The handle works from the keyboard

- **WHEN** the handle has focus and the user presses an arrow key
- **THEN** the builder area's height changes by one step

#### Scenario: The breadcrumbs omit the query id

- **WHEN** the user opens a saved query
- **THEN** the breadcrumbs show the Queries section and no identifier

### Requirement: Query page actions

The heading row SHALL carry the page's own actions, right-aligned, and a saved query SHALL show one of
two sets. While the page holds no unsaved changes: Delete and Edit, each only when the caller may write
the query, and Duplicate. While it holds unsaved changes: Discard, and a Save control that opens a menu
offering Save and Save as a new query; Delete, Edit and Duplicate SHALL NOT be shown then, since they
act on the stored query while the page shows something else. A caller who may not write the query SHALL
be offered Save as a new query as an action of its own in place of the Save menu. Duplicate and Save as
a new query are specified in `analytics/saved-queries`. On a draft the actions SHALL be Reset and Save
as query, as specified by the draft requirement.

The Run primary action SHALL sit in the view switcher row. Run SHALL be disabled until a schema is
loaded, and in the SQL view while the editor is empty.

A Copy action SHALL be offered in the SQL view only, beside Run, and SHALL copy the SQL editor text.
The Builder view SHALL offer no Copy action.

The page SHALL NOT contain a source selector, and SHALL NOT contain a time filter outside the builder
area: the period is a chip.

#### Scenario: Actions of a saved query

- **WHEN** the user opens a saved query they may write
- **THEN** the heading row shows the Delete, Edit and Duplicate actions
- **AND** the view switcher row shows Run

#### Scenario: Save and Discard appear with unsaved changes

- **WHEN** the page holds unsaved changes
- **THEN** the heading row shows Discard and the Save control in place of Delete, Edit and Duplicate
- **AND** the Save control offers Save and Save as a new query

#### Scenario: Actions of a draft

- **WHEN** the user opens the draft builder
- **THEN** the heading row shows Save as query
- **AND** the view switcher row shows Run

#### Scenario: Copy is offered in the SQL view only

- **WHEN** the SQL view is shown
- **THEN** a Copy action is offered beside Run
- **WHEN** the Builder view is shown
- **THEN** no Copy action is offered

#### Scenario: No time filter outside the builder area

- **WHEN** either query page is shown
- **THEN** the only period control is the Period chip in the builder area

### Requirement: The view switcher offers Builder and SQL

The view switcher SHALL offer two mutually exclusive views via a `SegmentedControl`: **Builder** and
**SQL**. There SHALL be no JSON view, and the assistant SHALL NOT be a view: it is a panel beside the
builder, as specified in "The assistant is a collapsible panel beside the builder". Selecting a view
SHALL change the content of the builder area without a page reload, and the current view SHALL be
indicated. The switcher SHALL NOT be shown before a schema is loaded.

#### Scenario: Two views

- **WHEN** the schema has loaded
- **THEN** the view switcher offers Builder and SQL only, whether or not the assistant is enabled

#### Scenario: No JSON view

- **WHEN** the view switcher is shown
- **THEN** it offers no JSON view

#### Scenario: Switcher hidden before a schema loads

- **WHEN** no schema has been loaded yet
- **THEN** the view switcher is not shown

### Requirement: The assistant is a collapsible panel beside the builder

When `featureFlags.queryAssistantEnabled` is `true` and a schema is loaded, the page SHALL show the
assistant as a panel at the right edge of the query page, beside the heading, the builder area and the
results, which stay visible and usable while it is open. When the flag is `false` the page SHALL show
neither the panel nor its collapsed control.

The panel SHALL start collapsed. Collapsed, it SHALL be a narrow vertical control carrying a spark icon
and the label Ask AI, exposing its collapsed state; activating it SHALL open the panel. Open, the panel
SHALL hold the assistant — its heading, suggestions, prompt and transcript — and a control that
collapses it. Whether the panel is open SHALL be remembered in the browser and applied after mount, so
the server render and the first client render agree.

On a viewport narrower than the tablet breakpoint the open panel SHALL be laid over the page content
instead of beside it.

#### Scenario: The panel is offered when the assistant is enabled

- **WHEN** the schema has loaded and `queryAssistantEnabled` is `true`
- **THEN** the collapsed Ask AI control is shown at the right edge of the page

#### Scenario: No panel without the assistant

- **WHEN** `queryAssistantEnabled` is `false`
- **THEN** neither the Ask AI control nor the panel is shown

#### Scenario: Opening the panel keeps the builder in place

- **WHEN** the user activates the collapsed Ask AI control
- **THEN** the assistant is shown in the panel
- **AND** the view switcher, the builder area and the results stay visible

#### Scenario: The panel state is remembered

- **WHEN** the user opens the panel and reloads the page
- **THEN** the panel is open again

### Requirement: The builder is a bar of chips

In the Builder view the builder area SHALL show the query as a bar of chips that wraps onto further
rows as it grows. Each chip SHALL state one part of the query in words and SHALL be a control that
opens a popup editing that part. The bar SHALL hold, in this order: the Period chip, the Limit chip,
the Filter chips in the order they were added, the Aggregate chip, the Show columns chip, the Sort
chips in the order they were added, and the Add control.

The Add control SHALL open a menu offering Filter, Aggregate, Show columns, and Sort. Choosing an entry
SHALL open that part's popup in its adding form, which carries a control that returns to the menu. An
entry whose part the query can hold only once — Aggregate, Show columns — SHALL be unavailable while
that chip is present. Show columns SHALL be unavailable while the Aggregate chip is present, and the
Show columns chip SHALL be removed when an Aggregate chip is applied, because an aggregate query's
columns are its group-bys and its metric.

A popup SHALL edit a copy of the part: nothing in the query SHALL change until the user activates
Apply, and Cancel, Escape, or a click outside the popup SHALL close it leaving the query as it was.
Apply SHALL be unavailable while the popup's required fields are not all set. The popup of a chip that
can be removed — Filter, Aggregate, Show columns, Sort — SHALL offer Remove when it was opened from the
chip, which deletes that part and its chip; the adding form SHALL NOT offer Remove. The Period and
Limit chips SHALL NOT be removable.

A popup SHALL be a dialog named by its title, SHALL move focus into itself when it opens and SHALL
return focus to the control that opened it when it closes. A chip SHALL expose that it opens a popup
and whether that popup is open.

Applying, removing, or resetting a part SHALL NOT run the query; the shown result stays until the user
runs again.

#### Scenario: A fresh draft shows Period, Limit and Add

- **WHEN** a draft is opened on a table with a temporal column
- **THEN** the bar shows the Period chip, the Limit chip and the Add control, in that order

#### Scenario: The Add menu offers the four parts

- **WHEN** the user opens the Add control
- **THEN** a menu offers Filter, Aggregate, Show columns, and Sort

#### Scenario: Adding opens the part's popup with a way back

- **WHEN** the user chooses Filter in the Add menu
- **THEN** the Add filter popup opens
- **AND** it offers a control that returns to the Add menu
- **AND** it offers no Remove

#### Scenario: Apply adds the chip

- **WHEN** the user fills the Add filter popup and activates Apply
- **THEN** the popup closes and a Filter chip stating the condition is shown before the Add control

#### Scenario: Cancel leaves the query unchanged

- **WHEN** the user changes a value in a chip's popup and activates Cancel
- **THEN** the popup closes and the chip states what it stated before

#### Scenario: Apply waits for the required fields

- **WHEN** a popup's required field is not set
- **THEN** Apply is unavailable

#### Scenario: A chip's popup removes its part

- **WHEN** the user opens a Filter chip's popup and activates Remove
- **THEN** the chip is gone and the query no longer carries that condition

#### Scenario: Aggregate and Show columns are added once

- **WHEN** the bar already holds an Aggregate chip
- **THEN** the Add menu's Aggregate and Show columns entries are unavailable

#### Scenario: Applying an aggregate drops the shown columns

- **WHEN** the bar holds a Show columns chip and the user applies an Aggregate
- **THEN** the Show columns chip is removed

#### Scenario: Editing does not run the query

- **WHEN** the user applies a change in a popup while a result is shown
- **THEN** the shown result is unchanged until the user runs the query

#### Scenario: Focus follows the popup

- **WHEN** the user opens a chip's popup and closes it
- **THEN** focus moved into the popup on opening and returns to the chip on closing

### Requirement: The Period chip bounds the query in time

The Period chip SHALL be a query control: its range SHALL serialize into the structured query's filter
as `ge`/`le` predicates on the source's automatically detected timestamp field (the first
temporal-typed field of the loaded schema). The serialized query — as translated for the SQL view and
executed by Run — SHALL include these predicates; nothing is added invisibly at execution time. The
time predicates SHALL NOT be shown as Filter chips — the Period chip is their editor. When the schema
has no temporal field, the Period chip SHALL NOT be shown, no time predicates SHALL be serialized and
the query runs without a time bound. SQL text SHALL never be modified by the period.

The chip SHALL state the selected preset by its label, or a custom range by its two dates. Its popup
SHALL offer the preset periods as a list, marking the selected one, and a custom range, set either by
picking days on a calendar or by typing the two dates into the Start and End fields as year, month and
day. The calendar and the fields SHALL show the same range: a range picked on the calendar SHALL be
written into the fields, and a range typed into the fields SHALL be highlighted on the calendar.
Applying a preset or a complete custom range SHALL replace the period; Apply SHALL be unavailable for a
custom range while either date is missing or unreadable, while the end precedes the start, and while
the end lies after today.

A **preset** period SHALL serialize as a **relative** bound rather than as two instants: the lower
bound SHALL compare the timestamp field against a call subtracting the preset's own unit and amount
from the current instant, and the upper bound against the current instant itself. The body then carries
the moving window on its own, so a translated, exported, or directly executed body returns the last N
units at the moment it runs instead of the window its author happened to be looking at. Because the
current instant is read where the query is evaluated rather than from the browser, a relative bound
also removes the clock skew an instant resolved client-side carries.

A **custom** range SHALL serialize as two absolute instants: it names one specific interval, which is
what the user asked for.

Both the subtraction and the current-instant call SHALL be named by the served function catalog, and
the frontend SHALL verify they are served before emitting them. When the catalog serves neither — it
failed to load, or a deployment's catalog does not carry them — a preset SHALL serialize absolutely,
exactly as a custom range does, rather than emit a call the service would reject and take the whole
query down.

When a structured query is loaded into the builder — from a stored query, from translated SQL, or from
an assistant message — a matching `ge` + `le` predicate pair on the timestamp field SHALL be lifted
into the Period chip: a **relative** pair whose subtracted unit and amount match an offered preset
SHALL be lifted as that preset, and an **absolute** pair SHALL be lifted as a custom range. A time
condition in any other shape is not something the Period chip can own; whether the chips can show it
at all is decided by the representability rule.

The **persisted** body is the one exception, and it is deliberate: the structured body written to a
saved query SHALL be serialized without the time bound, and the authored range SHALL be stored
separately as time intent (see **Saving persists authored intent, not a resolved range**). Serializing
the range into a persisted body would freeze the saved query to the day it was authored.

#### Scenario: The period serializes into the query

- **WHEN** the Period chip holds a range and the schema has a temporal field
- **THEN** the serialized query's filter includes `ge` and `le` predicates on that field
- **AND** no Filter chip shows them

#### Scenario: A preset period serializes as a relative bound

- **WHEN** the user applies a preset period of 30 minutes and the schema has a temporal field
- **THEN** the serialized query's filter includes a `ge` predicate comparing that field against a call subtracting 30 minutes from the current instant
- **AND** an `le` predicate comparing it against the current instant

#### Scenario: A preset period's body stays current when re-run later

- **WHEN** a body serialized from a preset period is executed again some time after it was produced
- **THEN** it bounds the results by the preset's span measured from the moment of that execution
- **AND** no instant from the moment of authoring appears in the body

#### Scenario: A custom range serializes as instants

- **WHEN** the user applies a custom range
- **THEN** the serialized query's filter includes `ge` and `le` predicates carrying that range's two absolute instants
- **AND** no relative call is emitted

#### Scenario: The chip states the period

- **WHEN** the two-day preset is selected
- **THEN** the Period chip states that preset's label
- **WHEN** a custom range is applied
- **THEN** the Period chip states the range's two dates

#### Scenario: A half-picked range cannot be applied

- **WHEN** the user has typed only a start date in the Period popup
- **THEN** Apply is unavailable

#### Scenario: A typed range is applied

- **WHEN** the user types a start date and a later end date, neither after today, and activates Apply
- **THEN** the Period chip states the range's two dates

#### Scenario: A picked range fills the date fields

- **WHEN** the user picks two days on the calendar
- **THEN** the Start and End fields show those two dates

#### Scenario: A relative pair lifts back to its preset

- **WHEN** a loaded query holds a `ge`/`le` pair on the timestamp field whose lower bound subtracts 2 days from the current instant and whose upper bound is the current instant
- **THEN** the Period chip shows the 2-day preset rather than a custom range
- **AND** no Filter chip shows the pair

#### Scenario: An absolute pair lifts back to a custom range

- **WHEN** a loaded query holds a `ge`/`le` pair of two absolute instants on the timestamp field
- **THEN** the Period chip shows that custom range

#### Scenario: A catalog without the relative functions falls back to instants

- **WHEN** the served function catalog carries neither the subtraction nor the current-instant function and a preset period is selected
- **THEN** the serialized query's filter carries that preset's resolved instants as absolute values
- **AND** the query runs

#### Scenario: No temporal field

- **WHEN** the loaded schema has no temporal-typed field
- **THEN** no Period chip is shown
- **AND** the serialized query contains no time predicates and the run is not time-bounded

#### Scenario: SQL runs are not modified

- **WHEN** the user runs a query from the SQL view
- **THEN** the executed SQL is exactly the editor text

#### Scenario: The persisted body carries no time bound

- **WHEN** the user saves a query whose Period chip holds a range and whose schema has a temporal field
- **THEN** the persisted structured body contains no `ge`/`le` predicate on the timestamp field
- **AND** the range is carried as the saved query's time intent instead

### Requirement: The Limit chip sets rows and offset

The Limit chip SHALL always be present in the Builder view and SHALL state the number of rows the query
returns. Its popup SHALL offer two whole-number fields, Rows and Offset. Rows SHALL be at least 1 and
Offset at least 0; Apply SHALL be unavailable while either is not a whole number in range. The query
SHALL serialize offset paging with those two values and without a requested total. A new draft SHALL
start at 25 rows and offset 0.

#### Scenario: The chip states the row limit

- **WHEN** a fresh draft is shown
- **THEN** the Limit chip states 25 rows

#### Scenario: Applying new values changes the page

- **WHEN** the user sets Rows to 100 and Offset to 50 and activates Apply
- **THEN** the chip states 100 rows
- **AND** the serialized query pages by offset with limit 100 and offset 50

#### Scenario: Invalid values cannot be applied

- **WHEN** Rows is empty, zero or not a whole number
- **THEN** Apply is unavailable

### Requirement: A Filter chip holds one condition

A Filter chip SHALL hold one condition — a column, an operator, and a value — and SHALL state it as
column, operator and value. The query SHALL combine all Filter chips with AND, and SHALL carry no
filter when there are none.

The popup SHALL offer:

- **Column** — the fields of the schema that the service accepts in a comparison, searchable by
  name.
- **Operator** — equals, does not equal, contains, does not contain, less than, greater than, at most,
  at least, in list, is empty, and is not empty. The two containment operators SHALL NOT be offered for
  an enum column. Changing the column to one that does not offer the selected operator SHALL reset the
  operator to equals.
- **Value** — shaped by the column and the operator: the column's values as a choice for an enum
  column; true or false as a choice for a boolean column; otherwise a text field. With "in list" the
  value SHALL be several values — several choices for an enum column, a comma-separated list otherwise.
  With "is empty" and "is not empty" no value SHALL be offered.

The value SHALL be typed by its column: the popup SHALL NOT ask for a value type. "Is empty" and "is
not empty" SHALL serialize as the null comparison the service reads as `IS NULL` and `IS NOT NULL`.

Apply SHALL be unavailable until a column is chosen and, for an operator that takes one, a value is
given.

#### Scenario: A filter is added

- **WHEN** the user chooses a column, the operator equals and a value, and activates Apply
- **THEN** a Filter chip states that column, operator and value
- **AND** the serialized query's filter carries that comparison

#### Scenario: Several filters are combined with AND

- **WHEN** the bar holds two Filter chips
- **THEN** the serialized query's filter requires both conditions

#### Scenario: An enum column offers its values

- **WHEN** the chosen column is an enum column
- **THEN** the value is chosen from that column's values
- **AND** the operators contains and does not contain are not offered

#### Scenario: A boolean column offers true and false

- **WHEN** the chosen column is a boolean column
- **THEN** the value is chosen between true and false

#### Scenario: In list takes several values

- **WHEN** the operator is in list on a text column and the user enters two values separated by a comma
- **THEN** the chip states both values
- **AND** the serialized comparison carries a list of the two

#### Scenario: Is empty takes no value

- **WHEN** the operator is is empty
- **THEN** no value field is shown and Apply is available once a column is chosen
- **AND** the serialized comparison is the null comparison

#### Scenario: Changing the column resets an operator it does not offer

- **WHEN** the operator is contains and the user changes the column to an enum column
- **THEN** the operator becomes equals

#### Scenario: A filter is edited

- **WHEN** the user opens a Filter chip, changes its value and activates Apply
- **THEN** the chip states the new value

### Requirement: The Aggregate chip groups rows and computes one measure

A query SHALL be an aggregate query exactly when the bar holds the Aggregate chip, and a row query
otherwise; there SHALL be no separate mode control. The chip SHALL state its function, the function's
column when it has one, the group-by columns, and the time bucket when one is set.

The popup SHALL offer:

- **Group by** — required; a field the service accepts as a grouping key.
- **Secondary group by** — optional, added by an "add secondary grouping" control and removable by a
  control beside it; a field other than the first group-by. At most one.
- **Function** — required; the aggregate functions of the served catalog, by their labels. Where the
  catalog's counting function supports distinct, the list SHALL also offer its distinct form as an
  entry of its own.
- **The function's column** — shown, and required, when the chosen function needs a column, under a
  label naming the function; a field the service accepts as that function's argument. A function that
  counts rows SHALL show no column field. The distinct count SHALL require a column.
- Any further argument the catalog declares for the function SHALL be offered as the catalog describes
  it — its allowed values or its numeric bounds — and SHALL be required unless the catalog marks it
  optional.

The serialized query SHALL carry the group-by columns as its grouping keys and output columns, and the
measure as an output column under a derived, unique name. The chips SHALL NOT offer a HAVING condition,
a second measure, or a renamed output column.

#### Scenario: An aggregate is added

- **WHEN** the user chooses a group-by column and the counting function and activates Apply
- **THEN** the Aggregate chip states the function and the group-by column
- **AND** the serialized query is an aggregate query grouped by that column with that measure

#### Scenario: A function that needs a column asks for it

- **WHEN** the user chooses the averaging function
- **THEN** a column field labelled with that function is shown
- **AND** Apply is unavailable until a column is chosen

#### Scenario: Counting rows asks for no column

- **WHEN** the user chooses the counting function
- **THEN** no column field is shown

#### Scenario: The distinct count is its own entry

- **WHEN** the served counting function supports distinct
- **THEN** the Function list offers a distinct count entry
- **AND** choosing it requires a column

#### Scenario: A secondary grouping is added and removed

- **WHEN** the user adds a secondary grouping, chooses a column and activates Apply
- **THEN** the query is grouped by both columns
- **WHEN** the user reopens the chip, removes the secondary grouping and activates Apply
- **THEN** the query is grouped by the first column only

#### Scenario: The secondary grouping differs from the first

- **WHEN** the user picks the secondary group-by column
- **THEN** the first group-by column is not offered

#### Scenario: Removing the chip returns to a row query

- **WHEN** the user removes the Aggregate chip
- **THEN** the serialized query is a row query with no grouping

#### Scenario: The functions come from the catalog

- **WHEN** the served catalog carries an aggregate function
- **THEN** the Function list offers it by its label
- **AND** no function absent from the catalog is offered

### Requirement: A temporal group-by can be split by period

When the first group-by column is a temporal field and the served catalog carries the time-binning
function, the Aggregate popup SHALL offer **Split by period** under the group-by: none, a list of
preset bucket sizes, and Custom. The presets SHALL be limited to those whose unit the catalog's binning
function allows. When the group-by column is not temporal, or the catalog does not serve the binning
function, Split by period SHALL NOT be shown and the column SHALL be grouped as it is.

Choosing a preset SHALL group by the column binned to that size. Choosing Custom SHALL show a Period
field taking an amount and a unit as text; Apply SHALL be unavailable until the text names a whole
amount of at least 1 and a unit the catalog's binning function allows. Choosing none SHALL group by the
column unbinned.

A binned group-by SHALL serialize as the catalog's binning function over the column with the chosen
amount and unit, and the chip SHALL state the bucket size after the column.

#### Scenario: A temporal group-by offers Split by period

- **WHEN** the first group-by column is a timestamp column and the catalog serves the binning function
- **THEN** Split by period is offered, with none selected

#### Scenario: A preset bucket bins the column

- **WHEN** the user chooses the 15-minute preset and activates Apply
- **THEN** the serialized query groups by the column binned to 15 minutes
- **AND** the Aggregate chip states the 15-minute bucket after the column

#### Scenario: A custom bucket is entered as text

- **WHEN** the user chooses Custom and enters an amount and an allowed unit
- **THEN** Apply becomes available and the query groups by the column binned to that size

#### Scenario: A custom bucket the catalog cannot bin is refused

- **WHEN** the Period text names no whole amount, or a unit the binning function does not allow
- **THEN** Apply is unavailable

#### Scenario: A non-temporal group-by is not split

- **WHEN** the first group-by column is a text column
- **THEN** Split by period is not shown

#### Scenario: A catalog without the binning function offers no split

- **WHEN** the served catalog does not carry the time-binning function
- **THEN** Split by period is not shown for a temporal group-by

### Requirement: The Show columns chip picks the columns of a row query

The Show columns chip SHALL hold the columns a row query returns and SHALL state how many are chosen.
A row query with no Show columns chip SHALL request no explicit columns, which returns the service's
default projection.

The popup SHALL list the schema's fields as a tree grouped by tag, each field with a checkbox, a
sensitive field with its marker; fields without a tag SHALL be listed after the groups. A group
SHALL carry a checkbox that selects or clears all its fields, a count of how many of its fields are
selected, and SHALL be collapsible. An entry above the tree SHALL select or clear every field. A
checkbox over a partly selected set SHALL show the mixed state. Every field the service accepts in a
projection SHALL be offered, including those it accepts nowhere else.

Apply SHALL be unavailable while no field is selected: to return to the default projection the user
removes the chip. The serialized query SHALL request the selected fields in schema order.

#### Scenario: Columns are chosen

- **WHEN** the user selects three fields and activates Apply
- **THEN** the Show columns chip states three columns
- **AND** the serialized query requests those three fields

#### Scenario: No chip means the default projection

- **WHEN** a row query has no Show columns chip
- **THEN** the serialized query requests no explicit columns

#### Scenario: A group selects all its fields

- **WHEN** the user checks a tag group whose fields are not all selected
- **THEN** every field of that group is selected and the group's count shows all of them

#### Scenario: A partly selected group shows the mixed state

- **WHEN** some but not all fields of a group are selected
- **THEN** the group's checkbox shows the mixed state and its count shows how many are selected

#### Scenario: Nothing selected cannot be applied

- **WHEN** no field is selected in the popup
- **THEN** Apply is unavailable

#### Scenario: Removing the chip restores the default projection

- **WHEN** the user removes the Show columns chip
- **THEN** the serialized query requests no explicit columns

### Requirement: A Sort chip holds one sort key

A Sort chip SHALL hold one sort key — a field and a direction — and SHALL state both. The query SHALL
sort by the Sort chips in the order they appear in the bar.

The popup SHALL offer **Field** and **Direction** (ascending, descending). In a row query the fields
SHALL be the schema fields the service accepts as a sort key; in an aggregate query they SHALL be the
query's group-by columns and its measure. A field already used by another Sort chip SHALL NOT be
offered. Apply SHALL be unavailable until a field is chosen. The chips SHALL NOT offer where nulls sort.

Removing or changing the Aggregate chip SHALL remove every Sort chip whose field the query no longer
returns.

#### Scenario: A sort key is added

- **WHEN** the user chooses a field and descending and activates Apply
- **THEN** a Sort chip states the field and the direction
- **AND** the serialized query sorts by that field descending

#### Scenario: Sort keys keep their order

- **WHEN** the bar holds two Sort chips
- **THEN** the serialized query sorts by the first chip's key and then by the second's

#### Scenario: An aggregate query sorts by its own columns

- **WHEN** the bar holds an Aggregate chip and the user opens the Add sort popup
- **THEN** the offered fields are the group-by columns and the measure

#### Scenario: A used field is not offered again

- **WHEN** a Sort chip already sorts by a field
- **THEN** the Add sort popup does not offer that field

#### Scenario: A sort the query no longer returns is dropped

- **WHEN** the query sorts by the measure and the user removes the Aggregate chip
- **THEN** that Sort chip is removed

### Requirement: Chip popups offer a field only where the service accepts it

A field whose type is `map` SHALL NOT be offered as a Filter column, a group-by, or a sort key: the
service refuses a comparison, a grouping key and an ordering over a map. A field the schema marks
projection-only SHALL be offered in Show columns only. Both SHALL be offered in Show columns, and a
map field SHALL be offered as a function's column where the catalog declares an expression argument.

#### Scenario: A map field is not a filter column

- **WHEN** the schema has a map field and the user opens the Add filter popup
- **THEN** that field is not offered as a column

#### Scenario: A map field is not a group-by or a sort key

- **WHEN** the schema has a map field
- **THEN** the Aggregate popup's group-by lists and the Sort popup's field list do not offer it

#### Scenario: A projection-only field is offered in Show columns

- **WHEN** the schema marks a field projection-only
- **THEN** the Show columns popup offers it
- **AND** the Filter, Aggregate and Sort popups do not

### Requirement: The SQL view is an editor over its own buffer

In the SQL view the builder area SHALL show a SQL code editor filling it, with SQL syntax highlighting,
and SHALL NOT show the chips. The Query Builder SHALL keep the SQL editor text as its own buffer.

Entering the SQL view SHALL seed the editor by translating the current builder query — including the
period — to SQL via `POST /v1/queries/translate` through a server action, when the buffer is empty or
still matches the last generated text; the seed is asynchronous and the editor SHALL show a loading
affordance while the translation is in flight. When the translation is rejected (`400` — a query the
SQL subset cannot express), the failure SHALL surface via the app's error-notification convention and
the editor SHALL be left empty (with Run disabled), rather than being seeded with a locally generated
or partial statement. User-edited SQL SHALL never be overwritten by a re-seed.

#### Scenario: The SQL view hides the chips

- **WHEN** the user selects the SQL view
- **THEN** a SQL editor is shown in the builder area
- **AND** no chip is shown

#### Scenario: SQL text is highlighted

- **WHEN** the user types a SQL statement in the SQL editor
- **THEN** the statement is rendered with SQL syntax highlighting

#### Scenario: Entering SQL translates the builder query via the backend

- **WHEN** the user opens the SQL view without prior SQL edits
- **THEN** the current builder query is sent to `POST /v1/queries/translate`
- **AND** the editor is pre-filled with the returned SQL, auto-formatted for readability (see "SQL editor auto-formatting")

#### Scenario: A non-expressible query surfaces a translate error

- **WHEN** the user opens the SQL view for a query the SQL subset cannot express and the backend responds `400`
- **THEN** an error notification is shown with the backend's message
- **AND** the SQL editor is left empty and Run is disabled

#### Scenario: Edited SQL survives the assistant panel

- **WHEN** the user edits SQL, opens the assistant panel, and collapses it
- **THEN** the SQL editor shows the edited text unchanged
- **AND** the edited text is not re-translated over

### Requirement: Switching from SQL to the Builder is guarded

The SQL view can hold a query the chips cannot show. When the user switches to the Builder view with an
edited SQL buffer, the SQL SHALL first be translated to the structured DSL via
`POST /v1/queries/translate-sql`. If the translation succeeds and the resulting query is representable
by the chips, the builder SHALL be hydrated from that query and the view SHALL switch with no
confirmation and no data loss. If the translation fails (`400` — parse failure or an unsupported
construct) or the resulting query is not representable by the chips, a confirmation popup (danger
variant) SHALL warn that switching will drop the current query and reset the builder to its starting
point. Confirming SHALL discard the SQL, reset the builder state to its initial defaults for the page's
table, and switch to the Builder view. Cancelling SHALL keep the user in the view they were in with the
query intact. Switching to the Builder SHALL NOT prompt when nothing would be lost (empty or unedited
generated SQL; SQL that translates to a representable query).

The guard SHALL follow the SQL buffer rather than the view being left: whenever the buffer holds SQL
the builder has not been hydrated from — including a message the assistant ran as raw SQL — selecting
the Builder view SHALL go through the same translation and, where it applies, the same confirmation.
While an assistant message's query is loading, the view switcher SHALL be disabled, so the user cannot
switch views before the loaded query has landed.

#### Scenario: Translatable SQL hydrates the builder without a prompt

- **WHEN** the user edits SQL that translates to a query the chips can show and selects the Builder view
- **THEN** no confirmation is shown
- **AND** the chips reflect the translated query
- **AND** the SQL buffer is cleared

#### Scenario: SQL the chips cannot show asks for confirmation

- **WHEN** the user edits SQL that the backend rejects, or that translates to a query the chips cannot show, and selects the Builder view
- **THEN** a confirmation popup warns that the current query will be dropped and the builder reset

#### Scenario: Confirming drops the SQL and resets the builder

- **WHEN** the confirmation popup is shown and the user confirms
- **THEN** the view switches to the Builder view
- **AND** the SQL is discarded
- **AND** the chips show the builder's initial defaults for the page's table

#### Scenario: Cancelling keeps the SQL

- **WHEN** the confirmation popup is shown and the user cancels
- **THEN** the user remains in the view they were in
- **AND** the SQL text is unchanged

#### Scenario: Going to the Builder after a raw-SQL message run asks for confirmation

- **WHEN** the user runs an assistant message whose SQL the chips cannot show and then selects the Builder view
- **THEN** the confirmation popup is shown instead of the chips showing their earlier query
- **AND** cancelling keeps the SQL view

#### Scenario: The view switcher waits for a message to load

- **WHEN** the user clicks Run on an assistant message and its query is still loading
- **THEN** the view switcher is disabled until loading finishes

### Requirement: A query the chips cannot show is held in the SQL view

The chips SHALL show a structured query only when every part of it is something a chip states. One
rule SHALL decide this for every way a query reaches the builder — a stored query, SQL translated on a
view switch, and an assistant message — and a query that fails it SHALL be held in the SQL view and
SHALL NOT seed the chips with a partial reading of it. A structured query is representable when all of
the following hold:

- **Filter** — absent, one comparison, or one AND of comparisons, once the pair the Period chip owns is
  lifted out. No OR, no NOT, no nested group.
- **Each comparison** — exactly two operands: a plain column on the left; on the right a value, a null,
  or, for "in list", a non-empty list of values of one type. No function call and no caller value on
  either side, and no column on the right.
- **Row query** — every output column is a plain, unrenamed field; no grouping keys; no HAVING.
- **Aggregate query** — one or two grouping keys and exactly one measure. The first key is a plain
  field or the catalog's binning function over a plain field with a literal amount and unit; the second
  is a plain field. The measure is a served aggregate function whose expression arguments are plain
  fields. No HAVING, no other output column.
- **Distinct** — not requested for the rows of the query; allowed on the measure only where the catalog
  says the function supports it.
- **Sort** — each key sorts with the default placement of nulls.
- **Paging** — offset paging, without a requested total.
- **Functions** — every function the query names is served by the catalog, with no more arguments than
  the catalog declares and a literal only where the catalog declares one.

#### Scenario: A flat AND of comparisons is shown as chips

- **WHEN** a loaded query's filter is an AND of two plain comparisons
- **THEN** the Builder view shows two Filter chips

#### Scenario: An OR is held in the SQL view

- **WHEN** a loaded query's filter combines two comparisons with OR
- **THEN** the query is held in the SQL view and no Filter chip is seeded from it

#### Scenario: A nested group is held in the SQL view

- **WHEN** a loaded query's filter holds a group inside its AND
- **THEN** the query is held in the SQL view

#### Scenario: A function operand is held in the SQL view

- **WHEN** a comparison's left or right operand is a function call
- **THEN** the query is held in the SQL view

#### Scenario: A HAVING is held in the SQL view

- **WHEN** an aggregate query carries a HAVING condition
- **THEN** the query is held in the SQL view

#### Scenario: Two measures are held in the SQL view

- **WHEN** an aggregate query computes two measures
- **THEN** the query is held in the SQL view

#### Scenario: Three grouping keys are held in the SQL view

- **WHEN** an aggregate query groups by three columns
- **THEN** the query is held in the SQL view

#### Scenario: A binned first key is shown as a split

- **WHEN** an aggregate query's first grouping key is the catalog's binning function over a timestamp column with a literal amount and unit
- **THEN** the Aggregate chip shows that column split by that period

#### Scenario: A computed column in a row query is held in the SQL view

- **WHEN** a row query's output holds a function call or a renamed column
- **THEN** the query is held in the SQL view

#### Scenario: Cursor paging or a requested total is held in the SQL view

- **WHEN** a query pages by cursor, carries no page, or requests a total
- **THEN** the query is held in the SQL view

#### Scenario: A non-default nulls placement is held in the SQL view

- **WHEN** a sort key places nulls first or last explicitly
- **THEN** the query is held in the SQL view

#### Scenario: A query using an unserved function is held in the SQL view

- **WHEN** a query names a function the served catalog does not carry
- **THEN** the query is held in the SQL view

#### Scenario: A stored query the chips cannot show does not seed the chips

- **WHEN** a saved query whose structured body the chips cannot show is opened
- **THEN** the Builder view's chips are not seeded from it

### Requirement: Running an assistant message loads its query and executes it

Clicking a message's Run action SHALL translate that message's SQL into a structured query and, when
the chips can show it, hydrate the builder state so the Builder and SQL views both reflect it; when the
chips cannot show it (or translation fails), the raw SQL SHALL remain runnable and visible in the SQL
view instead. In the same action, the system SHALL execute the query (via the structured or SQL
execution path, matching whichever form was loaded) and show the result in the results area. The view
SHALL switch to the one that shows the loaded query — Builder for a query the chips can show, SQL
otherwise — and the assistant panel SHALL stay open. The message whose Run was most recently
clicked SHALL have its Run action disabled to indicate it is the currently loaded query (see "Each
assistant message with extracted SQL offers inline Run and Copy") — no separate visual badge is used.

#### Scenario: A query the chips can show loads and runs

- **WHEN** the user clicks Run on a message whose query the chips can show
- **THEN** the Builder view is selected with its chips showing that query, the query executes, and the
  result appears in the results area

#### Scenario: A query the chips cannot show still runs via SQL

- **WHEN** the user clicks Run on a message whose query the chips cannot show (or translation fails)
- **THEN** the SQL view is selected with the raw SQL in its editor, and the query still executes via the
  SQL path

#### Scenario: Running an earlier message updates which query is loaded

- **WHEN** a later message's Run was previously clicked and the user then clicks an earlier message's
  Run
- **THEN** the earlier message's Run action becomes disabled, the later message's Run action becomes
  enabled again, and the Builder and SQL views reflect the earlier query instead

### Requirement: Run and Copy do not depend on the assistant panel

The view switcher row SHALL show its Run action whether the assistant panel is open or collapsed, and
its Copy action in the SQL view only. A message's own Run and Copy actions on the transcript are
specified in "Each assistant message with extracted SQL offers inline Run and Copy".

#### Scenario: Run stays available with the panel open

- **WHEN** the assistant panel is open
- **THEN** the view switcher row shows the Run action

#### Scenario: Copy follows the view, not the panel

- **WHEN** the assistant panel is open and the Builder view is selected
- **THEN** the view switcher row shows no Copy action

### Requirement: The AI conversation lasts as long as the page

The AI conversation and which of its messages is the loaded query SHALL persist while the user switches
views, resizes the builder area, or collapses the assistant panel, and SHALL be shown unchanged when the
panel is opened again. A conversation belongs to the page it was held on: opening another table's draft
or another saved query starts with an empty conversation, and a reply still in flight for a page that
was left SHALL NOT appear on the next one.

#### Scenario: Reopening the panel shows the same conversation

- **WHEN** the user has run a message, collapses the assistant panel, and opens it again
- **THEN** the earlier messages are shown and the run message's Run action is still disabled

#### Scenario: A new reply after reopening is runnable

- **WHEN** the user reopens the panel after running a message and sends a new request whose reply
  carries SQL
- **THEN** the new reply's Run action is enabled

#### Scenario: Another page starts an empty conversation

- **WHEN** the user holds a conversation on one draft and opens a draft on another table
- **THEN** the assistant panel of the new page shows no messages

#### Scenario: A send that fails in transit

- **WHEN** the request for a reply fails in transit
- **THEN** a failure notification is shown and the prompt and Send remain usable

### Requirement: The builder opens as a draft on a table held by the page

The Analytics group SHALL provide the Query Builder at `/queries` as a **draft**: a builder on one
queryable table with no stored query behind it. The page SHALL be an `async` server component gated by
the same Analytics access check the other Analytics pages use, resolving to a 403 page when access is
denied. A draft SHALL be runnable, and its result exportable, without being saved.

The draft's table SHALL be the table last picked in the Source panel, as specified in
`analytics/source-panel`, and the first queryable table when none was picked. The address SHALL stay
`/queries` whatever the table: the table is not part of the address. The picked table SHALL be held for
as long as the user stays within the Queries pages, so returning to the draft from a saved query SHALL
show the table picked before; reloading the page SHALL return the draft to the first queryable table.
The page heading SHALL show the draft's table name.

The first queryable table's schema SHALL be read on the server with the page. The schema of a table
picked afterwards SHALL be read when it is picked; while it is being read the builder SHALL show a
loading indicator in place of the draft, and a schema that cannot be read SHALL leave the draft on that
table with the schema-load failure state.

A draft SHALL start from the builder's defaults for its table. Its state SHALL live in the page only:
reloading the page, or leaving and returning, SHALL start the draft again from those defaults.

In place of the saved query's own actions, a draft's heading row SHALL offer **Save as query**, and
SHALL offer **Reset** while the draft differs from its starting state. Reset SHALL ask for confirmation
and, on confirmation, SHALL return the draft to its starting state for the same table. A draft SHALL
NOT offer Edit, Save, Discard or Delete, because there is no stored query for them to act on. Saving a
draft is specified in `analytics/saved-queries`.

#### Scenario: The menu item opens a draft

- **WHEN** the user opens `/queries` without having picked a table
- **THEN** the builder is shown on the first queryable table
- **AND** the heading shows that table's name

#### Scenario: A picked table becomes the draft's table

- **WHEN** the user picks a table in the Source panel
- **THEN** the builder is shown on that table with its fields available
- **AND** the address is `/queries` with no query parameter

#### Scenario: The picked table is kept across a saved query

- **WHEN** the user picks a table, opens a saved query, and returns to `/queries`
- **THEN** the draft is shown on the table picked before

#### Scenario: A reload returns to the first table

- **WHEN** the user picks a table other than the first and reloads the page
- **THEN** the builder is shown on the first queryable table

#### Scenario: A draft runs without being saved

- **WHEN** the user runs a draft
- **THEN** the result is shown
- **AND** no saved query was created

#### Scenario: A draft does not survive a reload

- **WHEN** the user changes a draft and reloads the page
- **THEN** the draft is back at the builder's defaults

#### Scenario: A draft offers Save as query

- **WHEN** a draft is open
- **THEN** the heading row offers Save as query
- **AND** it offers neither Edit nor Delete

#### Scenario: Reset appears once the draft has changed

- **WHEN** the user changes anything a saved query would store — a filter, the time period, the result view
- **THEN** the heading row offers Reset

#### Scenario: Reset returns the draft to its starting state

- **WHEN** the user activates Reset and confirms
- **THEN** the draft shows the builder's defaults for the same table
- **AND** Reset is no longer offered

#### Scenario: Access denied

- **WHEN** a caller without Analytics access opens `/queries`
- **THEN** the page resolves to the 403 page

## REMOVED Requirements

### Requirement: Query Builder layout and view switcher

**Reason**: The layout is no longer a results area with a rail beside it, and the switcher no longer
offers a JSON view.

**Migration**: See "Query page layout" and "The view switcher offers Builder and SQL".

### Requirement: Query Builder toolbar

**Reason**: The in-page toolbar is dissolved: the time filter becomes the Period chip, the page actions
move to the heading row, and Run moves to the view switcher row.

**Migration**: See "Query page actions" and "The Period chip bounds the query in time".

### Requirement: Time range is part of the structured query

**Reason**: The rule is unchanged in substance, but its control is now a chip and its wording was bound
to the toolbar, the JSON view and the Filters tree.

**Migration**: See "The Period chip bounds the query in time".

### Requirement: Query builder rail with collapse

**Reason**: The rail is removed; the builder sits above the results in a resizable area.

**Migration**: See "Query page layout".

### Requirement: Builder sections use section blocks with categorized field dropdowns and collapsible items

**Reason**: The form sections are replaced by chips with popups.

**Migration**: See "The builder is a bar of chips".

### Requirement: Query mode and DISTINCT

**Reason**: There is no mode control: the Aggregate chip's presence makes the query an aggregate one.
The chips never request distinct rows.

**Migration**: See "The Aggregate chip groups rows and computes one measure". Write a query that needs
distinct rows in the SQL view.

### Requirement: Filter (WHERE) builder with nested groups

**Reason**: Filters are single conditions combined with AND. Nested groups, OR and NOT, function
operands, caller values and a value-type picker are not part of the chips.

**Migration**: See "A Filter chip holds one condition". Write a filter that needs grouping, a function
or a caller value in the SQL view.

### Requirement: Row-mode projection

**Reason**: The projection is picked in the Show columns chip, as plain fields only.

**Migration**: See "The Show columns chip picks the columns of a row query". Write a computed column in
the SQL view.

### Requirement: Aggregate-mode group by, time buckets, and metrics

**Reason**: Aggregation is one chip with at most two group-bys and one measure, and a time bucket is
offered as a control of its own over the catalog's binning function.

**Migration**: See "The Aggregate chip groups rows and computes one measure" and "A temporal group-by
can be split by period". Write a query that needs more keys, more measures or a scalar grouping key in
the SQL view.

### Requirement: Aggregate-mode HAVING builder

**Reason**: The chips have no HAVING condition.

**Migration**: Write a query that filters on a measure in the SQL view.

### Requirement: Sort keys

**Reason**: Sort keys are chips of a field and a direction; where nulls sort is not offered.

**Migration**: See "A Sort chip holds one sort key". Write an explicit nulls placement in the SQL view.

### Requirement: Paging

**Reason**: Paging is the Limit chip: rows and offset. Disabling the page, cursor paging and a
requested total are not offered.

**Migration**: See "The Limit chip sets rows and offset".

### Requirement: JSON view and copy

**Reason**: The JSON view is removed. The structured query is an internal form; SQL is the written
form the page offers.

**Migration**: Use the SQL view to read or write the query as text. Copy is offered there — see "Query
page actions".

### Requirement: Aggregate validation warnings

**Reason**: A chip cannot be applied half-filled, so the states those warnings described cannot be
reached.

**Migration**: See "The builder is a bar of chips": Apply waits for the required fields.

### Requirement: SQL view shows only a SQL editor

**Reason**: Its wording was bound to the rail and the form sections.

**Migration**: See "The SQL view is an editor over its own buffer".

### Requirement: SQL view state is an independent buffer

**Reason**: Merged with the SQL view's editor requirement, without the JSON view.

**Migration**: See "The SQL view is an editor over its own buffer".

### Requirement: Switching from a written mode to the Builder is guarded

**Reason**: SQL is the only written view left, and "representable" now means what the chips can show.

**Migration**: See "Switching from SQL to the Builder is guarded".

### Requirement: Switching from the SQL view to JSON translates the SQL buffer

**Reason**: There is no JSON view to switch to.

**Migration**: None needed.

### Requirement: A query the visual builder cannot hold stays in the written views

**Reason**: The representability rule is rewritten for chips, and the only written view is SQL.

**Migration**: See "A query the chips cannot show is held in the SQL view".

### Requirement: Query Builder rail offers an AI view when the assistant is enabled

**Reason**: The rail is removed and the switcher has no Form or JSON entries.

**Migration**: See "The assistant is a collapsible panel beside the builder".

### Requirement: Running a message's query loads it into the builder and executes it

**Reason**: Its wording named the JSON view and an in-place entity switch that no longer exists.

**Migration**: See "Running an assistant message loads its query and executes it".

### Requirement: Toolbar Run and Copy are not shown in the AI view

**Reason**: There is no toolbar, entity selector or toolbar time filter.

**Migration**: See "Run and Copy do not depend on the assistant panel".

### Requirement: The AI conversation outlives leaving the AI view

**Reason**: Its wording named the rail, the JSON view and an in-place entity switch.

**Migration**: See "The AI conversation lasts as long as the page".

### Requirement: A map field is offered only where the service accepts it

**Reason**: Its wording named the form's positions.

**Migration**: See "Chip popups offer a field only where the service accepts it".

### Requirement: A projection-only field is offered only as a row-mode projection

**Reason**: Its wording named the form's positions.

**Migration**: See "Chip popups offer a field only where the service accepts it".

### Requirement: The builder opens as a draft without a stored query

**Reason**: The draft's table is no longer named by a `table` query parameter; the page holds the
picked table instead, so the address of the draft is always `/queries`.

**Migration**: See "The builder opens as a draft on a table held by the page".

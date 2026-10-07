## MODIFIED Requirements

### Requirement: Status is sortable, and filtered from a filter button

The Status column header SHALL show its name and a sort control. Its place in the filter row SHALL
hold a filter button that opens a checkbox list of the fixed status values, and SHALL NOT hold a
free-text input: a status is a fixed value, so typing into it cannot express the filter the operator
wants.

The filter button SHALL be the only way to filter Status. No free-text or operator-based entry SHALL
be reachable for this column by any route, including AG Grid's own column-menu filter — a status
value is never discovered by typing it, only by picking it from the list.

The checkbox list SHALL offer exactly the status values the system can display — `PENDING`,
`COMPLETED`, `RUNNING`, `FAILED`, `CANCELLING`, `CANCELLED` — each labelled the same way its own status
indicator is labelled elsewhere in the app, plus a control to select or clear every value at once.

Selecting one or more values SHALL narrow the list to rows whose status matches any of the selected
values. Clearing every selection SHALL remove the filter entirely, returning the list to its
unfiltered state — the same state a column with no active filter is in.

A filter row holding only its filter button SHALL centre that button, horizontally and vertically,
rather than leaving it against the edge of the cell where an input would have ended.

#### Scenario: Status offers a filter button rather than an input

- **WHEN** the runs list renders its headers and filter row
- **THEN** the Status header shows the label `Status` and a sort control
- **AND** the filter row shows a filter button under Status, with no free-text input beside it
- **AND** that button is centred in its cell

#### Scenario: Picking statuses narrows by any of them

- **WHEN** the operator opens the Status filter button and checks `FAILED` and `CANCELLED`
- **THEN** the list shows only runs whose status is `FAILED` or `CANCELLED`

#### Scenario: Clearing the selection removes the filter

- **WHEN** the operator has one or more statuses checked and then clears every checkbox
- **THEN** the list returns to showing runs of every status, as if Status had never been filtered

#### Scenario: No free-text route exists onto the Status column

- **WHEN** the operator interacts with the Status column's header or filter row by any means the grid
  exposes
- **THEN** no free-text input or operator picker (equals, contains, or otherwise) is reachable for
  that column

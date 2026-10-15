## Purpose

Defines the layout and composition of the Method tab on the Test Suite create/edit page for
deployment-based test suites: the endpoint header, the per-request Dynamic Configuration section, and
the extracted response fields grid, all scoped to whichever request is selected in the request chain.

## Requirements

### Requirement: Method tab layout
For a deployment-based test suite, the Method tab SHALL render a left "Requests" sidebar alongside a
main content column. The main column shows, top to bottom: the endpoint header (method/path tag, "Edit
request" action, Try out button), the Dynamic Configuration section, and the extracted response fields
section — all scoped to whichever request is selected in the sidebar. Renaming a request happens only
through the Requests sidebar (see its Rename action below); the main column does not show a separate
request-name field.

#### Scenario: Default layout for a single-request suite
- **WHEN** a deployment-based test suite has no additional requests
- **THEN** the Method tab shows the Requests sidebar next to the endpoint header, Dynamic
  Configuration, and extracted response fields sections, in that order

#### Scenario: Layout for a multi-request chain
- **WHEN** a deployment-based test suite has additional requests
- **THEN** the Method tab shows the same main-column section order for whichever request is currently
  selected in the Requests sidebar

### Requirement: Requests sidebar
The Requests sidebar SHALL list every request in the chain, each labeled with its name, or a numbered
"Request N" fallback (1-based) when unnamed, and SHALL highlight the currently selected request. It
SHALL show an "Add" action and an info affordance whose tooltip explains that requests run in order and
later requests can use earlier outputs. The sidebar SHALL be collapsible independently of the main
content column.

#### Scenario: Selecting a request from the sidebar
- **WHEN** the user clicks a request row in the sidebar
- **THEN** the main content column updates to show that request's endpoint, Dynamic Configuration, and
  extracted response fields

#### Scenario: Adding a request opens the edit wizard immediately
- **WHEN** the user clicks "Add" in the Requests sidebar
- **THEN** a new, unconfigured request is appended to the chain and selected
- **THEN** the "Edit request" wizard opens immediately for that new request, without requiring a
  separate click on "Edit request"

### Requirement: Per-request actions menu
Each request row SHALL reveal a "more actions" menu on hover (or when it holds focus), offering
"Rename" and, for every request except the first, "Delete" — each with an icon. The first request's row
SHALL only offer "Rename".

#### Scenario: Menu appears on hover
- **WHEN** the user hovers a request row (or moves keyboard focus to its actions button)
- **THEN** the row's "more actions" trigger becomes visible

#### Scenario: Renaming a request
- **WHEN** the user chooses "Rename" from a row's actions menu
- **THEN** a confirmation modal opens with a "Name" input pre-filled with that request's current name
- **WHEN** the user edits the name and confirms
- **THEN** the request's name is updated to the entered value and the modal closes
- **WHEN** the user cancels the modal instead
- **THEN** the request's name is left unchanged

#### Scenario: Deleting a request
- **WHEN** the user chooses "Delete" from a row's actions menu for a request other than the first
- **THEN** that request is removed from the chain

#### Scenario: The first request cannot be deleted
- **WHEN** the user opens the first request's actions menu
- **THEN** no "Delete" option is shown, only "Rename"

### Requirement: Dynamic Configuration section on the Method tab
The Method tab SHALL show a Dynamic Configuration section, under a static "Dynamic configuration"
heading, listing the template variables detected in the currently selected request's
body/headers/parameters, each with an Attribute/Constant binding control. The section's fields (not its
heading) SHALL be scoped to the currently selected request in the chain, matching the scoping already
used by the endpoint header and extracted response fields section. It SHALL render as a plain bordered
section (title plus fields) — not as a collapsible accordion.

#### Scenario: Dynamic Configuration reflects the selected request
- **WHEN** the user selects a different request in the Requests sidebar
- **THEN** the Dynamic Configuration section shows the template variables and bindings of the newly
  selected request, not of request #0
- **THEN** the section's heading stays "Dynamic configuration", unchanged by the selection

#### Scenario: Binding a variable to a test case column
- **WHEN** the user sets a variable's binding to "Attribute"
- **THEN** a dropdown lists the dataset's test case columns, each showing its name, data type, and
  description
- **WHEN** the user picks one of those columns
- **THEN** the selected request's `inputBindings` are updated with that column reference
- **THEN** the change is propagated via the tab's `onChange` callback like any other Method tab edit

#### Scenario: Binding a variable to a constant value
- **WHEN** the user sets a variable's binding to "Constant" and enters a literal value
- **THEN** the selected request's `inputBindings` are updated with that constant value

### Requirement: Extracted response fields section
The Method tab SHALL show an "Extracted response fields" section for the currently selected request,
in a plain bordered box, listing the response-field extraction grid (display name, JSON path, data
type) with its "Add" and "JSONata Expression Reference" actions. It SHALL NOT show a method/path
schema switcher or a request/response schema editing view — those live in the "Edit request" wizard.

#### Scenario: Section shows only the extracted-fields grid
- **WHEN** the user views the Method tab
- **THEN** the "Extracted response fields" section shows the fields grid directly, with no tabs for
  switching to a request or response schema view

### Requirement: Dynamic Configuration removed from the Test Cases tab
The Test Cases tab SHALL NOT render a Dynamic Configuration / template variable binding section. Editing
template variable bindings is only available from the Method tab.

#### Scenario: Test Cases tab has no binding section
- **WHEN** the user opens the Test Cases tab of a deployment-based test suite
- **THEN** no Dynamic Configuration section is shown on that tab

### Requirement: JSONata Expression popup layout
Activating the JSON Path cell of a row in the "Extracted response fields" grid SHALL open a "JSONata
Expression" popup, up to 1200px wide, with dividers under its header and above its footer. The popup
body SHALL show two side-by-side columns: a "Reference fields" panel on the left and a "JSONata
Expression" editor panel on the right, each under its own label. The footer SHALL show "Cancel" and
"Apply" actions. The popup SHALL NOT show a textarea or a floating suggestion list for the expression.

#### Scenario: Opening the popup
- **WHEN** the user opens the JSON Path cell of an extracted field that already has an expression
- **THEN** the popup shows the "Reference fields" panel expanded on the left and the field's current
  expression in the "JSONata Expression" editor on the right

#### Scenario: Popup for a column without a response schema
- **WHEN** the selected request's response schema has no object properties
- **THEN** the "Reference fields" panel shows the "No schema properties to display" empty state
- **THEN** the editor stays usable for typing an expression by hand

### Requirement: JSONata Expression editor
The "JSONata Expression" panel SHALL host a code editor with line numbers and JSONata syntax
highlighting. The editor SHALL NOT show automatic hints: no completion list while typing, no parameter
hints, no hover tooltips, and Enter and Tab SHALL NOT accept a suggestion. Editing the text SHALL update
the draft expression and SHALL discard any data type previously chosen from the tree, leaving the
column's own data type unchanged on Apply.

#### Scenario: Typing an expression
- **WHEN** the user types in the editor
- **THEN** the draft expression follows the editor text
- **THEN** a data type previously taken from a tree node is no longer applied

#### Scenario: No hints while typing
- **WHEN** the user types `$` or a partial word in the editor
- **THEN** no completion list or tooltip appears
- **THEN** pressing Enter inserts a line break instead of accepting a suggestion

### Requirement: Reference fields tree
The "Reference fields" panel SHALL list the response schema's top-level properties as tree rows. Each
row SHALL show the property name and a bordered tag with its data type; a row whose property has nested
properties or array items SHALL also show a chevron button on its left, and children SHALL be indented
under their parent. Hovering a row SHALL highlight it, and the most recently clicked row SHALL stay
highlighted as the selected row. The chevron button SHALL expand and collapse the row without changing
the expression.

#### Scenario: Expanding a node with the chevron
- **WHEN** the user clicks the chevron button of a row that has children
- **THEN** the row's children appear indented beneath it
- **THEN** the expression in the editor and the selected row are unchanged

#### Scenario: Picking a node
- **WHEN** the user clicks the name or tag of a row
- **THEN** the editor text is replaced by that node's full path (for example `usage.completion_tokens`
  for the `completion_tokens` child of `usage`)
- **THEN** the row becomes the selected row
- **THEN** the data type applied on Apply is the node's data type
- **THEN** if the row has children, it also toggles between expanded and collapsed

#### Scenario: Selection does not follow typing
- **WHEN** the user picks a node and then edits the expression in the editor
- **THEN** the previously picked row stays highlighted

### Requirement: Reference fields panel collapse
The "Reference fields" panel SHALL end with a footer holding an icon button that collapses it. When
collapsed, the panel SHALL shrink to a narrow rail showing the "Reference fields" label rotated, with an
icon button at the bottom that expands it again, and the editor SHALL take the freed width. The panel
SHALL start expanded every time the popup opens, and its state SHALL NOT be remembered between openings.
Both buttons SHALL have an accessible name and expose whether the panel is expanded; the tree SHALL be
neither focusable nor announced while the panel is collapsed.

#### Scenario: Collapsing the panel
- **WHEN** the user clicks the collapse button in the panel footer
- **THEN** the tree is replaced by the narrow rail with the rotated "Reference fields" label
- **THEN** the editor expands to the full width of the popup body
- **THEN** the draft expression and the selected row are preserved

#### Scenario: Expanding the panel again
- **WHEN** the panel is collapsed and the user clicks the expand button on the rail
- **THEN** the tree is shown again with its previous expansion state and selected row

#### Scenario: Collapse state is not remembered
- **WHEN** the user collapses the panel, closes the popup, and opens it again
- **THEN** the panel is expanded

#### Scenario: Keyboard access while collapsed
- **WHEN** the panel is collapsed and the user tabs through the popup
- **THEN** focus never lands on a tree row or chevron button

### Requirement: Applying and cancelling the JSONata expression
"Apply" SHALL be disabled while the draft expression is empty. Applying SHALL write the draft expression
to the row's JSON Path and, when the draft came from a tree node, also set the row's data type from that
node; it SHALL then close the popup. "Cancel" and closing the popup SHALL discard the draft, leaving the
row unchanged, and the next opening SHALL start from the row's saved expression.

#### Scenario: Apply is disabled for an empty expression
- **WHEN** the editor is empty
- **THEN** "Apply" is disabled

#### Scenario: Applying a picked node
- **WHEN** the user picks the `total_tokens` node under `usage` and clicks "Apply"
- **THEN** the row's JSON Path becomes `usage.total_tokens`, its data type becomes that node's type, and
  the popup closes

#### Scenario: Applying a typed expression
- **WHEN** the user types an expression by hand and clicks "Apply"
- **THEN** the row's JSON Path becomes the typed expression and its data type is left unchanged

#### Scenario: Cancelling discards the draft
- **WHEN** the user edits the expression and clicks "Cancel"
- **THEN** the popup closes and the row keeps its previous JSON Path and data type
- **WHEN** the user opens the popup again
- **THEN** the editor shows the row's saved expression

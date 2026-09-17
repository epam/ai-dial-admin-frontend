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

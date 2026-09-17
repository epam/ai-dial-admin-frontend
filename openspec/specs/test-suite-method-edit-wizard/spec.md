## Purpose

Defines the two-step "Edit request" wizard that lets a user change a deployment-based test suite
request's method and configure its body/headers/parameters, replacing the single-step Change Method
confirmation popup.

## Requirements

### Requirement: Wizard entry point
The Method tab's endpoint header SHALL show an "Edit request" action. Activating it SHALL open a
two-step wizard scoped to the currently selected request in the chain, starting at step 1 ("Methods").
The wizard SHALL be disabled while the Try-out sidebar is open, same as today's Change Method action.
The wizard SHALL also open automatically, for the newly added request, when the user clicks "Add" in
the Requests sidebar — see `test-suite-method-tab`'s "Adding a request opens the edit wizard
immediately" scenario.

#### Scenario: Opening the wizard for an existing request
- **WHEN** the user clicks "Edit request" on the Method tab
- **THEN** the wizard opens on step 1 ("Methods"), pre-selecting the request's current method/path if it
  matches an available option

#### Scenario: Opening the wizard for a newly added request
- **WHEN** the user clicks "Add" in the Requests sidebar
- **THEN** the wizard opens on step 1 ("Methods") for the new, unconfigured request

#### Scenario: Wizard disabled during Try-out
- **WHEN** the Try-out sidebar is open
- **THEN** the "Edit request" action is disabled with a tooltip explaining why

### Requirement: Step 1 — Methods
Step 1 SHALL show the existing method picker (grouped "Chat interface" and "Other" options generated
from the selected deployment) and, for the highlighted method, its parameters, request schema, and
response schema. A warning SHALL be shown that changing the method may reset existing configuration.
The footer SHALL show Cancel and Next; Next SHALL be disabled until a valid method/path is selected.

#### Scenario: Selecting a method enables Next
- **WHEN** the user selects a method from the list
- **THEN** its parameters/request schema/response schema are shown
- **THEN** the Next button becomes enabled

#### Scenario: Cancel discards all wizard changes
- **WHEN** the user clicks Cancel on step 1
- **THEN** the wizard closes and the request is left unchanged, matching today's Change Method modal
  cancel behavior

### Requirement: Step 2 — Configuration
Step 2 SHALL show the selected method/path, a JSONata mode toggle, the content-type selector, and a
tabbed editor (Body, Headers, Parameters) for the request template — the same editing surface as
today's inline `RequestTemplate` component, relocated into this step. A "Variable references" action
SHALL drill into the template-variable syntax reference in place, within the same step's content area.
The footer SHALL show Back, Cancel, and Save.

#### Scenario: Navigating back to Methods
- **WHEN** the user clicks Back on step 2
- **THEN** the wizard returns to step 1 with the previously selected method still selected

#### Scenario: Editing the request body
- **WHEN** the user edits the request body template on step 2
- **THEN** a "Reset to default" action becomes available to revert the body to the method's default
  template

#### Scenario: Viewing variable reference syntax
- **WHEN** the user clicks "Variable references" on step 2
- **THEN** the wizard header swaps its "Edit request" title for a back button and a "View variable
  references" title
- **THEN** the variable-syntax reference content is shown in place of the step's editing surface, and
  the footer (Back/Cancel/Save) is hidden while it is shown

#### Scenario: Returning from variable references to step 2
- **WHEN** the user clicks the back button shown while viewing variable references
- **THEN** the wizard header and footer return to their normal step 2 state, and the request
  template editing surface is shown again with its prior edits intact

#### Scenario: Saving applies all wizard changes
- **WHEN** the user clicks Save on step 2
- **THEN** the selected request's method, path, and request template (body/headers/parameters) are
  updated in one change, propagated via the Method tab's `onChange` callback
- **THEN** the wizard closes

#### Scenario: Cancel on step 2 discards all wizard changes
- **WHEN** the user clicks Cancel on step 2
- **THEN** the wizard closes and neither the method selection from step 1 nor any body/header/parameter
  edits from step 2 are applied to the request

### Requirement: Configuration step indicates completeness for a new request
When the wizard was opened for a newly added request (via "Add" in the Requests sidebar), the step
indicator SHALL show step 2 ("Configuration") as not yet complete until the user has visited it at
least once. When the wizard was opened via "Edit request" on an existing, already-configured request,
step 2 SHALL show as complete from the start. In both cases, Save SHALL remain governed solely by step
1's method/path validity, never by whether step 2 has been visited.

#### Scenario: New request shows Configuration as incomplete until visited
- **WHEN** the wizard is opened for a newly added request and the user has not yet navigated to step 2
- **THEN** the step indicator shows step 2 without a completed mark

#### Scenario: Visiting Configuration marks it complete
- **WHEN** the user navigates to step 2 at least once
- **THEN** the step indicator subsequently shows step 2 as complete, including after navigating back to
  step 1

#### Scenario: Editing an existing request shows Configuration as already complete
- **WHEN** the wizard is opened via "Edit request" on an existing request
- **THEN** the step indicator shows step 2 as complete without requiring the user to visit it first

### Requirement: Layout containment while scrolling
The wizard SHALL have a fixed body height matching its design and SHALL NOT let its header or
footer action buttons scroll out of view: only the body — the step indicator and the active step's
content — scrolls when that content overflows. On step 1, the method list SHALL remain fully visible
and independently scrollable from the selected method's detail panel, so a long detail panel does not
push the list (or the list's own scroll position) around. The "changing the method" warning on step 1
SHALL remain pinned below the method list/detail panels, not scrolling away with them.

#### Scenario: Footer stays visible while step content scrolls
- **WHEN** the active step's content is taller than the visible wizard body
- **THEN** the content scrolls internally
- **THEN** the header and the Cancel/Next/Back/Save footer remain visible and do not scroll

#### Scenario: Method list and detail panel scroll independently
- **WHEN** the selected method's parameters/schema detail panel is taller than the visible area
- **THEN** the detail panel scrolls on its own without moving or hiding the method list beside it

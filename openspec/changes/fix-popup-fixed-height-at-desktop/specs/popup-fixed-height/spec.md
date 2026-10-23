## ADDED Requirements

### Requirement: Fixed-height popups keep their height at desktop widths
A `Popup` that is given a fixed height SHALL render at that height at viewport widths of 768px and above,
regardless of how much content it holds or whether the content is loading. The height SHALL be passed as
a breakpoint-prefixed class (`md:h-[…]`) so it replaces the ui-kit's `md:h-auto`.

#### Scenario: Add Metric while the list loads
- **WHEN** an admin opens Add Metric on a test suite and the metric list is still loading
- **THEN** the modal shows at its fixed height with the spinner inside it

#### Scenario: Add Metric after the list loads
- **WHEN** the metric list finishes loading
- **THEN** the modal height is unchanged from the loading state

#### Scenario: JSON mode toggled
- **WHEN** an admin selects a metric, clicks Next and switches JSON mode on
- **THEN** the modal height is unchanged and the JSON editor is fully visible

#### Scenario: Run value viewer
- **WHEN** an admin expands the Request or Response value in the Run details panel
- **THEN** the modal opens at its fixed height with the value visible below the header

#### Scenario: Narrow viewport
- **WHEN** the viewport is narrower than 768px
- **THEN** the popup follows the ui-kit's mobile layout, unaffected by the fixed height

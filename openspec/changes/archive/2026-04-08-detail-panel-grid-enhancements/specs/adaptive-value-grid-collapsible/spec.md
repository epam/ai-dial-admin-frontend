## ADDED Requirements

### Requirement: AdaptiveValueGrid is always collapsible

`AdaptiveValueGrid` SHALL render its title row as an interactive toggle button. No prop controls this — the behaviour is unconditional for all instances of the component.

The component SHALL start in a collapsed state (entries hidden) on every mount. The collapsed/expanded state is local to each instance and is not shared or persisted.

The title row SHALL display a right-pointing chevron icon (`IconChevronRight`) when collapsed and a downward-pointing chevron (`IconChevronDown`) when expanded, consistent with the existing `Accordion` component icon pattern.

The toggle button SHALL meet WCAG AA accessibility requirements: it SHALL have `role="button"` (or be a `<button>` element), respond to keyboard activation (Enter/Space), and carry an accessible label derived from the section title.

#### Scenario: Grid renders with only title visible on initial mount

- **WHEN** `AdaptiveValueGrid` is rendered with a non-empty `entries` array
- **THEN** only the title row (with chevron icon) is visible; no entry rows are rendered

#### Scenario: Clicking the title expands the entries

- **WHEN** the user clicks the title toggle button while the grid is collapsed
- **THEN** all entry rows become visible and the chevron points downward

#### Scenario: Clicking the title again collapses the entries

- **WHEN** the user clicks the title toggle button while the grid is expanded
- **THEN** all entry rows are hidden and the chevron points right

#### Scenario: Empty grid still returns null

- **WHEN** `AdaptiveValueGrid` is rendered with an empty `entries` array
- **THEN** the component renders nothing (returns `null`), even though collapsible is active

#### Scenario: Toggle is keyboard accessible

- **WHEN** the title toggle button has keyboard focus and the user presses Enter or Space
- **THEN** the grid toggles between collapsed and expanded states

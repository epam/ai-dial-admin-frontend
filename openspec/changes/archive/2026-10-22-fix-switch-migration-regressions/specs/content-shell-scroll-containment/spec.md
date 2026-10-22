## ADDED Requirements

### Requirement: Content shell does not scroll on control focus
The application content shell (`Content` root container) SHALL clip its overflow without being scrollable, so that focusing a visually hidden control inside it, such as the `sr-only` input of a `Switch`, never changes the shell's scroll offset.

#### Scenario: Toggling a switch keeps the scroll position
- **GIVEN** a page inside the shell scrolled away from the top, such as the Features tab of a Model or Application, the Containers startup probe, or the toolset detail page
- **WHEN** the user clicks a switch
- **THEN** the page stays at the same scroll position and the content below it remains rendered

#### Scenario: Shell cannot be scrolled programmatically
- **WHEN** a descendant of the shell receives focus or `scrollIntoView` is called on it
- **THEN** the shell's own `scrollTop` and `scrollLeft` remain `0`

#### Scenario: Toolset detail page renders after enabling Forward per request key
- **GIVEN** a toolset detail page under Entities or AI Gateway
- **WHEN** the user turns "Forward per request key" on
- **THEN** the properties and controls of the page remain visible

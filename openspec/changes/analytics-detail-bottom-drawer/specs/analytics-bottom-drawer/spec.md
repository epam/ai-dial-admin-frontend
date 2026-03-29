## ADDED Requirements

### Requirement: Bottom drawer displays when detail mode is "drawer"

The system SHALL display the bottom drawer panel when the detail mode is "drawer" and a test case row is selected. The drawer SHALL NOT be visible when the detail mode is "sidebar".

#### Scenario: Drawer visible in drawer mode
- **WHEN** the detail mode is "drawer" and a row is selected in the analytics grid
- **THEN** the bottom drawer is displayed at the bottom of the viewport with default height (380px)

#### Scenario: Drawer hidden in sidebar mode
- **WHEN** the detail mode is "sidebar"
- **THEN** the bottom drawer is not rendered

#### Scenario: Row click in drawer mode updates active detail
- **WHEN** the drawer is open and the user clicks a different row in the Analytics grid
- **THEN** the drawer updates to show the newly selected test case's data without closing

### Requirement: Drawer is resizable via drag handle

The system SHALL render a drag handle at the top edge of the drawer. The user SHALL be able to drag the handle vertically to resize the drawer between 120px minimum and `window.innerHeight - 100px` maximum.

#### Scenario: User drags resize handle upward
- **WHEN** the user presses and drags the resize handle upward
- **THEN** the drawer height increases, and the cursor changes to `ns-resize` during the drag

#### Scenario: User drags below minimum height
- **WHEN** the user drags the resize handle so the computed height would be below 120px
- **THEN** the drawer height stays at 120px

### Requirement: Drawer can be collapsed and expanded

The system SHALL provide a Collapse button in the drawer toolbar. Collapsing SHALL reduce the drawer to its toolbar bar only (approximately 34px). Clicking the Collapse button again SHALL restore the previous height.

#### Scenario: Collapse the drawer
- **WHEN** the user clicks the Collapse button
- **THEN** the drawer body and resize handle are hidden, leaving only the toolbar visible

#### Scenario: Expand a collapsed drawer
- **WHEN** the user clicks the Collapse button on a collapsed drawer
- **THEN** the drawer restores to its previous height with body and resize handle visible

### Requirement: Drawer can be closed

The system SHALL provide a Close button (X) in the drawer toolbar. Closing SHALL hide the drawer and clear the pinned test case selection, but SHALL preserve the detail mode as "drawer" so the next row click reopens the drawer.

#### Scenario: Close the drawer
- **WHEN** the user clicks the Close button
- **THEN** the drawer is hidden, pinned ID is cleared, but detail mode remains "drawer"

### Requirement: Main grid adjusts for drawer

The system SHALL add padding-bottom to the analytics grid container equal to the drawer's current height when the drawer is open. This SHALL prevent the drawer from obscuring grid content.

#### Scenario: Drawer open adjusts grid padding
- **WHEN** the drawer is open with height 380px
- **THEN** the analytics grid container has `padding-bottom: 380px`

#### Scenario: Drawer closed removes padding
- **WHEN** the drawer is closed or detail mode is "sidebar"
- **THEN** the analytics grid container has no additional padding-bottom

### Requirement: Drawer renders via portal

The system SHALL render the bottom drawer via `createPortal` to `document.body` to avoid layout conflicts with the existing grid components.

#### Scenario: Drawer renders outside component tree
- **WHEN** the drawer is open
- **THEN** the drawer DOM node is a direct child of `document.body`, not nested inside the analytics grid

### Requirement: Pin a test case for comparison

The system SHALL provide a Pin button in the drawer toolbar. Pinning SHALL lock the current active test case as a reference column. After pinning, clicking another row adds it as a second comparison column alongside the pinned case.

#### Scenario: Pin the active test case
- **WHEN** the user clicks the Pin button and no test case is currently pinned
- **THEN** the active test case becomes pinned, a badge shows the pinned case name, and the Pin button is replaced by the badge

#### Scenario: Unpin a test case
- **WHEN** the user clicks the pinned case badge (with X)
- **THEN** the pinned case is cleared and the Pin button reappears

#### Scenario: Navigate with pinned case
- **WHEN** a test case is pinned and the user clicks a different row in the grid
- **THEN** the drawer shows the pinned case in the first column and the newly clicked case in the second column

### Requirement: View toggle between Table and Pivot

The system SHALL provide Table and Pivot toggle buttons in the drawer toolbar. The active view SHALL be visually distinguished. Switching views SHALL preserve the active and pinned selections.

#### Scenario: Switch from Table to Pivot
- **WHEN** the user clicks the Pivot button
- **THEN** the comparison area switches to Pivot layout and the Pivot button shows as active

#### Scenario: Switch from Pivot to Table
- **WHEN** the user clicks the Table button
- **THEN** the comparison area switches to Table layout and the Table button shows as active

### Requirement: Drawer toolbar includes mode switcher

The drawer toolbar SHALL include a "Switch to Sidebar" button (as defined in `analytics-detail-view-switcher` spec) that closes the drawer and opens the sidebar for the same selected test case.

#### Scenario: Switch to sidebar from drawer
- **WHEN** the user clicks the "Switch to Sidebar" button in the drawer toolbar
- **THEN** the drawer closes and the sidebar opens with the same active test case

### Requirement: Keyboard accessibility

The drawer toolbar buttons, view toggles, and close/collapse controls SHALL be keyboard-focusable and activatable via Enter/Space. The Escape key SHALL close the drawer when it has focus.

#### Scenario: Close drawer with Escape
- **WHEN** the drawer is open and the user presses Escape while focus is within the drawer
- **THEN** the drawer closes

#### Scenario: Toggle view with keyboard
- **WHEN** the user focuses the Pivot button and presses Enter
- **THEN** the view switches to Pivot mode

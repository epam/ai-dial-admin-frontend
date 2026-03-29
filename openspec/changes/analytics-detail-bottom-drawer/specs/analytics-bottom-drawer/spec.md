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

#### Scenario: Re-click same row in drawer mode closes drawer
- **WHEN** the drawer is open showing a test case and the user clicks the same row again
- **THEN** the drawer closes (pinned and field selector state are cleared), detail mode remains "drawer"

### Requirement: Drawer shows loading state while fetching detail data

The system SHALL display a loading indicator inside the drawer body while `getTestCaseRunResultDetails()` (server action from `src/app/[lang]/runs/actions.ts`) is in progress. The toolbar SHALL remain visible during loading.

#### Scenario: Loading on first open
- **WHEN** the drawer opens for a newly selected row and detail data has not loaded yet
- **THEN** the drawer body shows a `DialLoader` spinner; the toolbar is visible with the test case name

#### Scenario: Loading on row switch
- **WHEN** the user clicks a different row while the drawer is open
- **THEN** the comparison area shows a loading indicator while the new detail is fetched; previously loaded pinned data remains visible

### Requirement: Drawer handles fetch errors gracefully

When `getTestCaseRunResultDetails()` returns `null` or the fetch fails, the system SHALL display an error state in the drawer body. The drawer SHALL remain open and functional (user can click another row or close).

#### Scenario: Detail fetch returns null
- **WHEN** `getTestCaseRunResultDetails(resultId)` returns `null`
- **THEN** the drawer body shows an error message indicating the result could not be loaded

#### Scenario: Detail fetch for pinned case fails
- **WHEN** the pinned case detail fetch fails but the active case loaded successfully
- **THEN** the drawer shows only the active case column and displays a warning about the pinned case

### Requirement: Drawer is resizable via drag handle

The system SHALL render a drag handle at the top edge of the drawer. The user SHALL be able to drag the handle vertically to resize the drawer between 200px minimum and `window.innerHeight - 100px` maximum. The resize handle SHALL also support keyboard-driven resize: Arrow Up/Down adjusts height by 20px, Shift+Arrow by 100px.

#### Scenario: User drags resize handle upward
- **WHEN** the user presses and drags the resize handle upward
- **THEN** the drawer height increases, and the cursor changes to `ns-resize` during the drag

#### Scenario: User drags below minimum height
- **WHEN** the user drags the resize handle so the computed height would be below 200px
- **THEN** the drawer height stays at 200px

#### Scenario: Resize via keyboard
- **WHEN** the resize handle is focused and the user presses Arrow Up
- **THEN** the drawer height increases by 20px (clamped to max)

#### Scenario: Resize via keyboard with Shift
- **WHEN** the resize handle is focused and the user presses Shift+Arrow Down
- **THEN** the drawer height decreases by 100px (clamped to min 200px)

### Requirement: Drawer can be collapsed and expanded

The system SHALL provide a Collapse button in the drawer toolbar. Collapsing SHALL reduce the drawer to its toolbar bar only (approximately 34px). Clicking the Collapse button again SHALL restore the previous height.

#### Scenario: Collapse the drawer
- **WHEN** the user clicks the Collapse button
- **THEN** the drawer body and resize handle are hidden, leaving only the toolbar visible at ~34px height

#### Scenario: Expand a collapsed drawer
- **WHEN** the user clicks the Collapse button on a collapsed drawer
- **THEN** the drawer restores to its previous height with body and resize handle visible

### Requirement: Drawer can be closed

The system SHALL provide a Close button (X) in the drawer toolbar. Closing SHALL hide the drawer and clear the pinned test case selection, but SHALL preserve the detail mode as "drawer" so the next row click reopens the drawer. Field selector state (visibility, order) SHALL also be reset on close.

#### Scenario: Close the drawer
- **WHEN** the user clicks the Close button
- **THEN** the drawer is hidden, pinned ID and field selector state are cleared, but detail mode remains "drawer"

### Requirement: Main grid adjusts padding-bottom for drawer's current height

The system SHALL add padding-bottom to the analytics grid container equal to the drawer's **current rendered height** when the drawer is open. This includes tracking collapsed state.

#### Scenario: Drawer open at full height
- **WHEN** the drawer is open with height 380px
- **THEN** the analytics grid container has `padding-bottom: 380px`

#### Scenario: Drawer collapsed
- **WHEN** the drawer is collapsed to ~34px
- **THEN** the analytics grid container has `padding-bottom: 34px`

#### Scenario: Drawer closed or sidebar mode
- **WHEN** the drawer is closed or detail mode is "sidebar"
- **THEN** the analytics grid container has no additional padding-bottom

### Requirement: Drawer renders via portal

The system SHALL render the bottom drawer via `createPortal` to `document.body` to avoid layout conflicts with the existing grid and sidebar components.

#### Scenario: Drawer renders outside component tree
- **WHEN** the drawer is open
- **THEN** the drawer DOM node is a direct child of `document.body`, not nested inside the analytics grid, with `z-40` (below notifications at `z-[100]` and fullscreen modals at `z-50`)

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

#### Scenario: Active and pinned are the same row
- **WHEN** a test case is pinned and the user clicks the same row that is pinned
- **THEN** the drawer shows only a single column for that test case (no duplicate columns)

#### Scenario: Unpin returns to single-column view
- **WHEN** a test case is pinned and the user unpins it
- **THEN** the drawer shows only the active test case in a single column (no comparison)

#### Scenario: Grid data refreshes while case is pinned
- **WHEN** the analytics grid data refreshes (e.g., new computation) and the pinned result ID no longer exists
- **THEN** the pinned case is automatically cleared and a single-column view of the active case is shown

Note: `Analytics.tsx` triggers this by calling `useDrawerPanel.clearPinIfMissing(resultIds)` whenever the grid `results` state updates, passing the current array of valid result IDs.

### Requirement: View toggle between Table and Pivot

The system SHALL provide Table and Pivot toggle buttons in the drawer toolbar. The active view SHALL be visually distinguished. Switching views SHALL preserve the active and pinned selections.

#### Scenario: Switch from Table to Pivot
- **WHEN** the user clicks the Pivot button
- **THEN** the comparison area switches to Pivot layout and the Pivot button shows as active

#### Scenario: Switch from Pivot to Table
- **WHEN** the user clicks the Table button
- **THEN** the comparison area switches to Table layout and the Table button shows as active

### Requirement: Drawer toolbar includes mode switcher

The drawer toolbar SHALL include a "Switch to Sidebar" button that closes the drawer and triggers `sidebar.showSidebar()` with the current active test case's `resultId`.

#### Scenario: Switch to sidebar from drawer
- **WHEN** the user clicks the "Switch to Sidebar" button in the drawer toolbar
- **THEN** the drawer closes and `sidebar.showSidebar()` is called with the active test case

### Requirement: Keyboard accessibility

The drawer toolbar buttons, view toggles, and close/collapse controls SHALL be keyboard-focusable and activatable via Enter/Space. The Escape key SHALL close the drawer when it has focus.

#### Scenario: Close drawer with Escape
- **WHEN** the drawer is open and the user presses Escape while focus is within the drawer and no inner overlay (e.g., tooltip, dropdown, FullscreenViewer modal) is open
- **THEN** the drawer closes

Note: The Escape handler must check whether a `FullscreenViewer` modal is currently open (via its context) before closing the drawer. If a fullscreen modal is open, Escape closes the modal first; a second Escape closes the drawer.

#### Scenario: Toggle view with keyboard
- **WHEN** the user focuses the Pivot button and presses Enter
- **THEN** the view switches to Pivot mode

### Requirement: Drawer shows empty state when all fields are hidden

The system SHALL display an empty state message in the comparison area when all fields are hidden via the field selector.

#### Scenario: All fields hidden
- **WHEN** the user unchecks all fields or hides all sections via the field selector
- **THEN** the comparison area displays a message: "No fields visible. Use the Fields panel to show fields."

### Requirement: Drawer shows progressive loading for pinned data

When the drawer has a pinned case and the user clicks a new row, the system SHALL show the pinned column data immediately while loading the new active case data.

#### Scenario: Active case loading with pinned data visible
- **WHEN** the user clicks a new row while a pinned case is loaded
- **THEN** the pinned column displays its data, the active column shows a loading indicator, and the toolbar updates with the new case name

### Requirement: Drawer cleans up on navigation away

The system SHALL close the drawer and remove its portal DOM node when `Analytics.tsx` unmounts (e.g., user navigates to a different tab or page). The `useDetailMode` hook's cleanup effect SHALL handle both sidebar teardown (`sidebar.closeSidebar()`) and drawer teardown.

#### Scenario: Navigate away while drawer is open
- **WHEN** the drawer is open and the user navigates away from the Analytics tab
- **THEN** the drawer portal is removed from `document.body` and no orphaned DOM nodes remain

#### Scenario: Navigate away while drawer is collapsed
- **WHEN** the drawer is collapsed and the user navigates away
- **THEN** the collapsed drawer portal is also removed

## RENAMED Requirements

- FROM: `### Requirement: A bound test suite opens in a new browser tab`
- TO: `### Requirement: A bound test suite opens through its name link`

## MODIFIED Requirements

### Requirement: A bound test suite opens through its name link
Clicking a test suite's name link in the Test Suites tab SHALL open that test suite's detail page in the same tab; Cmd/Ctrl-click and middle-click SHALL open it in a new browser tab, leaving the dataset page open. A click elsewhere in the row SHALL NOT navigate. The context menu at the end of each row SHALL contain only the "Open in new tab" option, which opens the detail page in a new tab; that menu SHALL NOT offer run, duplicate or delete.

#### Scenario: Clicking the name
- **WHEN** the user clicks a test suite's name link
- **THEN** `/test-suites/{id}` opens in the same tab

#### Scenario: A modified click on the name
- **WHEN** the user Cmd/Ctrl-clicks or middle-clicks a test suite's name link
- **THEN** `/test-suites/{id}` opens in a new browser tab
- **AND** the dataset page stays on the Test Suites tab

#### Scenario: Clicking a row
- **WHEN** the user clicks a test suite row outside its name link
- **THEN** no navigation occurs

#### Scenario: Context menu option
- **WHEN** the user opens the three-dot menu of a row and chooses "Open in new tab"
- **THEN** the test suite opens in a new browser tab

#### Scenario: Context menu is not a click-through
- **WHEN** the user clicks the three-dot menu button itself
- **THEN** no new tab opens until an option is chosen

#### Scenario: Context menu content
- **WHEN** the user opens the three-dot menu of a row
- **THEN** "Open in new tab" is the only option

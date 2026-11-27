## ADDED Requirements

### Requirement: File-manager row menus are revealed on row hover
Every row of a file-manager list, and of the Select document modal, SHALL show its three-dot actions menu when the row is hovered, with the menu's actions available. The app's stylesheet SHALL emit the file-manager library's hover-reveal utilities so that the app's `!important` base utilities do not keep the button hidden.

#### Scenario: Hover reveals the menu in a list
- **WHEN** an admin hovers a row in AI Gateway > Applications or Artifacts > Files
- **THEN** the row's three-dot button becomes visible and clickable

#### Scenario: Menu opens
- **WHEN** an admin clicks the revealed three-dot button
- **THEN** the row's actions are listed

#### Scenario: Select document modal
- **WHEN** an admin hovers a row on the Public tab of the Select document modal
- **THEN** the row's three-dot button becomes visible

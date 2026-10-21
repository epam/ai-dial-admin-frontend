## MODIFIED Requirements

### Requirement: Assets > Skills menu entry
The system SHALL have a `Skills` menu item in the Assets section of the admin menu, directly after
`Files` (the last existing Assets entry), linking to the `/skills` route.

#### Scenario: Skills follows Files in the Assets section
- **WHEN** the Assets section of the menu renders
- **THEN** `Skills` appears immediately after `Files`, as the last Assets entry

#### Scenario: Selecting Skills navigates to its list
- **WHEN** a user selects `Skills` from the Assets menu
- **THEN** the app navigates to `/skills`

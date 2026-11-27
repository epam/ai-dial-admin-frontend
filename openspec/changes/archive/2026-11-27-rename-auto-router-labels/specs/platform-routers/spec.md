## MODIFIED Requirements

### Requirement: AI Gateway > Routers menu entry
The system SHALL show an `Auto Routers` menu item in the AI Gateway section of the admin menu, directly after
`Toolsets` and before `Translators`, linking to `/platform-routers`, with an icon distinct from
the AI Gateway group icon and from the `Routes` entry's icon.

#### Scenario: Routers follows Toolsets in AI Gateway
- **WHEN** the AI Gateway section of the menu renders
- **THEN** `Auto Routers` appears immediately after `Toolsets` and before `Translators`

### Requirement: Every router string is localized
The system SHALL render every user-facing router string through the i18n layer, with its key in the
matching i18n enum and its text in `en.ts`, and SHALL NOT hardcode display text. This covers the menu label
and the AI Gateway group description, breadcrumbs, create, update, duplicate, and delete notifications and
modal titles, bulk-delete labels, list empty-state title and description, field labels, placeholders and
validation errors for `mode`, the decision settings, and the schema picker, and tab labels. Frontend-owned
references to the router entity SHALL use `Auto Router` or `Auto Routers`, with sentence-appropriate casing.

#### Scenario: Menu and group description mention routers
- **WHEN** the AI Gateway menu group renders
- **THEN** the `Auto Routers` label and the group description (which names auto routers among the entities it holds) come from i18n

#### Scenario: Empty list shows localized guidance
- **WHEN** a user opens `/platform-routers` with no routers
- **THEN** the localized empty-state title and description name auto routers

#### Scenario: Notifications and modals use router wording
- **WHEN** a user creates, updates, or deletes a router
- **THEN** frontend-owned notification and modal text name an Auto Router, not a Route, translator or model

#### Scenario: Decision field errors are localized
- **WHEN** a user enters an out-of-range `timeoutMs` or `maxDecisions`
- **THEN** the field error text comes from i18n

#### Scenario: Duplicate and bulk-delete wording
- **WHEN** a user duplicates a router or opens the bulk-delete confirmation for routers
- **THEN** the frontend-owned dialog text identifies the entity as an Auto Router or Auto Routers

#### Scenario: Core error text remains verbatim
- **WHEN** Core rejects a router write with a validation message naming a router
- **THEN** the existing error notification shows that message verbatim and retains the user's draft

#### Scenario: Other frontend descriptions identify auto routers
- **WHEN** a frontend-owned description elsewhere in the app refers to the router entity, including the session deployment description
- **THEN** it uses auto router terminology without changing the names of other entities

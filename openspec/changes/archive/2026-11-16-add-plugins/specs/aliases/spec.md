## MODIFIED Requirements

### Requirement: AI Gateway > Aliases menu entry
The system SHALL add an `Aliases` item to the AI Gateway group of the admin menu, directly after `Plugins`,
linking to the `/assets-aliases` route. The label SHALL come from i18n (`MenuI18nKey.PlatformAliases`). The item SHALL
NOT be offered to a caller in unit mode.

#### Scenario: Aliases follows Plugins in AI Gateway
- **WHEN** the AI Gateway group of the menu renders for a full admin
- **THEN** `Aliases` appears immediately after `Plugins` and before `Routes`

#### Scenario: Unit mode does not offer Aliases
- **WHEN** the menu renders for a caller in unit mode
- **THEN** no `Aliases` item is shown

#### Scenario: Breadcrumb and title use the menu label
- **WHEN** a user opens `/assets-aliases` or an alias detail view
- **THEN** the list title and the breadcrumb root show the `Aliases` label, and the detail breadcrumb ends in a non-link segment for the alias

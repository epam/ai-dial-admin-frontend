## MODIFIED Requirements

### Requirement: Global Firewall popup exposes "View in Activity Audit" link in its footer

The `GlobalWhitelist` modal SHALL render a custom footer containing a "View in Activity Audit" `GhostButton` link on the left and the existing Cancel and Apply (or Close, when read-only) buttons on the right. The link SHALL be visible whenever the popup is open, regardless of the popup's loading state, read-only state, or validation state of the domain list. The link label SHALL be resolved via a new i18n key `DeploymentsI18nKey.ViewInActivityAudit`.

#### Scenario: Link renders in footer when popup is open
- **WHEN** the user opens the Global Firewall popup from the Images list header
- **THEN** the popup footer SHALL display a "View in Activity Audit" link on the left
- **AND** the existing Cancel and Apply buttons SHALL render on the right (unchanged labels, unchanged enable/disable semantics)

#### Scenario: Link remains visible in read-only mode
- **WHEN** the popup is opened with `disabled` prop true
- **THEN** the "View in Activity Audit" link SHALL still render and be clickable
- **AND** the right-hand button SHALL show "Close" instead of "Apply" (existing behavior)

#### Scenario: Link is independent of domain-list validation
- **WHEN** the domain list contains a validation error that disables the Apply button
- **THEN** the "View in Activity Audit" link SHALL remain enabled and clickable

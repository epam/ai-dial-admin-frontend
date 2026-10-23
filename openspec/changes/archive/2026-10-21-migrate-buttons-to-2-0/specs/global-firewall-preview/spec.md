## MODIFIED Requirements

### Requirement: Global Firewall tab shows domain list

When the import preview response contains a non-null `globalImageBuildDomainWhitelist` field, a "Global Firewall" tab SHALL appear in the tab bar.

#### Scenario: Global Firewall tab appears when whitelist present
- **WHEN** the import preview response has `globalImageBuildDomainWhitelist` with a non-null value
- **THEN** a "Global Firewall" tab SHALL appear (no counter — single resource)

#### Scenario: Global Firewall tab absent when no whitelist
- **WHEN** the import preview response has `globalImageBuildDomainWhitelist` as null or absent
- **THEN** no "Global Firewall" tab SHALL appear

#### Scenario: Tab content shows merged domain list
- **WHEN** user selects the "Global Firewall" tab
- **THEN** `DeploymentConfigurationGrid` SHALL render a heading "Global domain whitelist" (`DeploymentsI18nKey.GlobalWhitelist`)
- **AND** below it, a `DomainList` component showing domains from `globalImageBuildDomainWhitelist.next`
- **AND** a `GhostButton` with `IconReplace` icon labeled "Compare changes"

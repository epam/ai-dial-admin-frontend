# Global Firewall Import Preview

## Purpose

Adds a dedicated "Global Firewall" tab to the deployment import preview showing the domain whitelist entries that will be merged on import. Includes a "Compare changes" button that opens `GlobalFirewallCompareModal` — a Before/After diff popup using `GridView` with `DIFF_ROW_CLASS_RULES` for row highlighting.

## ADDED Requirements

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
- **AND** a `DialGhostButton` with `IconReplace` icon labeled "Compare changes"

### Requirement: Compare changes opens Before/After diff popup

The "Compare changes" button SHALL open `GlobalFirewallCompareModal` showing the Before/After domain whitelist comparison using AG Grid tables.

#### Scenario: Compare changes button opens modal
- **WHEN** user clicks the "Compare changes" button
- **THEN** `GlobalFirewallCompareModal` SHALL open as a `DialPopup` (size Lg, 800px height, with dividers)

#### Scenario: Modal header shows action and resource type
- **WHEN** the modal is open
- **THEN** the header SHALL show "Changes" (`ImportI18nKey.Changes`)
- **AND** below the header, `LabelledText` SHALL show Action (capitalized, e.g., "Update") and Resource type ("Global Firewall")

#### Scenario: Modal shows Before/After grids with diff highlighting
- **WHEN** the modal is open
- **THEN** a "Global domain whitelist" heading SHALL appear with `DiffLegend` showing the added count
- **AND** a Before column SHALL show a `GridView` with `DOMAIN_COLUMN` containing `prev` domains
- **AND** an After column SHALL show a `GridView` with `DOMAIN_COLUMN` containing `next` domains
- **AND** both grids SHALL use `DIFF_ROW_CLASS_RULES` for row styling
- **AND** domains present in After but not in Before SHALL have `DiffStatus.ADDED` and render with `ag-new-row ag-new-border` CSS classes

#### Scenario: Close compare popup
- **WHEN** user clicks the close button (X) on the modal
- **THEN** the modal SHALL close and the Global Firewall tab content SHALL remain visible

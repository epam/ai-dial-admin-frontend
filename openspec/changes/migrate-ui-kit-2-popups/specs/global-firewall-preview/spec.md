## MODIFIED Requirements

### Requirement: Compare changes opens Before/After diff popup

The "Compare changes" button SHALL open `GlobalFirewallCompareModal` showing the Before/After domain whitelist comparison using AG Grid tables.

#### Scenario: Compare changes button opens modal
- **WHEN** user clicks the "Compare changes" button
- **THEN** `GlobalFirewallCompareModal` SHALL open as a `Popup` (size Lg, 800px height, with dividers)

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

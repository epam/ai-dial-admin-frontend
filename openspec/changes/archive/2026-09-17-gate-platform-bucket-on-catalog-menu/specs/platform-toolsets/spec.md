## MODIFIED Requirements

### Requirement: Platform bucket shown above public in the Assets Toolsets grid
The system SHALL display a `platform` bucket as a top-level node in the existing
`Assets ▸ Toolsets` grid (`/assets-toolsets`), positioned above the `public` bucket, using the same
`BaseAssetList` instance the public toolsets list already uses — but only when the Catalog
menu group is not disabled, i.e. when `DISABLE_MENU_ITEMS` does not contain `catalog`
(case-insensitive). When the Catalog menu group is disabled, the system SHALL NOT list or display the
`platform` bucket in this grid: no `platform` list request is issued on mount, refresh, or
folder-picker load, and the grid renders only the `public` tree, using the same single-root behavior
as every other assets view. No new menu entry and no new top-level list route SHALL be introduced for
this bucket.

#### Scenario: Platform bucket appears above public on first load
- **WHEN** the user navigates to `/assets-toolsets` with no `catalog` entry in `DISABLE_MENU_ITEMS`
- **THEN** the grid shows a `platform` top-level node above the `public` top-level node, both fetched
  and rendered in the same tree

#### Scenario: Platform bucket skipped when Catalog is disabled
- **WHEN** the user navigates to `/assets-toolsets` with `DISABLE_MENU_ITEMS` containing `catalog`
- **THEN** the grid shows only the `public` tree — no `platform` top-level node is rendered
- **AND** no `platform` bucket list request is issued (on mount and on every refresh of the tree)

#### Scenario: No separate platform toolsets list page exists
- **WHEN** the user looks for a platform toolsets entry in the sidebar navigation
- **THEN** no such entry exists — platform toolsets are reachable only through the existing
  `/assets-toolsets` grid

# tabbed-asset-listings Specification

## Purpose
The shared listing shell for every platform entity, Assets Applications and Assets Toolsets: one header (title, count, Create), a tab row for the sources that exist (Public, Platform, config.json) with count badges, and a body per source (the single-root file manager for Public, flat grids for Platform and config.json). Also covers the entity picker, which offers the same tabs and reports each selection with its source. Created by archiving change `tabbed-asset-listings`.
## Requirements
### Requirement: Asset listings share one header, tab row and body

The system SHALL render every platform entity listing, the Assets Applications listing and the Assets Toolsets
listing with the same layout: a header row, a tab row, then the active tab's body. The header SHALL show the page
title and an optional count after the title in `dial-small-text text-secondary`. The tab row SHALL show the tabs and,
at its end, a Create button when the active tab allows creating. The page SHALL work with a single file-manager root, `public/`; `platform/` and `file/` SHALL
NOT appear as roots, folders or tree nodes anywhere in the file manager.

#### Scenario: Listing shows header, tabs and body

- **WHEN** a user opens `/platform-models`
- **THEN** the page shows the title, the tab row, and the active tab's grid, in that order

#### Scenario: No platform or file root in the file manager

- **WHEN** a user browses the Public tab of Assets Applications
- **THEN** the folder tree contains only the `public/` tree and no `platform` or `file` node

### Requirement: Tabs are shown only for sources that exist

The system SHALL offer a **Public** tab only for Assets Applications and Assets Toolsets, a **Platform** tab for
every listing, and a **config.json** tab only where DIAL Core exposes a config-file type for the view. Keys SHALL
have no config.json tab. A listing with exactly one available tab SHALL render no tab row. For a caller in unit
mode, Assets Applications and Assets Toolsets SHALL offer the Public tab only and render no tab row.

#### Scenario: Applications shows three tabs

- **WHEN** an admin opens `/assets-applications`
- **THEN** the tabs are Public, Platform and config.json, in that order

#### Scenario: Models shows two tabs

- **WHEN** an admin opens `/platform-models`
- **THEN** the tabs are Platform and config.json

#### Scenario: Keys has no tab row

- **WHEN** a user opens `/platform-keys`
- **THEN** no tab row is rendered and the Platform grid is shown directly

#### Scenario: Unit user sees Public only

- **WHEN** a unit-mode user opens `/assets-applications`
- **THEN** no tab row is rendered and the Public file manager is shown

### Requirement: Default tab

The system SHALL select **Public** by default on Assets Applications and Assets Toolsets, and **Platform** by
default on every other listing. The selected tab SHALL be mirrored to a `tab` query parameter, so a reload, a deep
link or a return from a detail page restores the same tab; an unknown or unavailable `tab` value SHALL fall back to
the default.

#### Scenario: Applications opens on Public

- **WHEN** an admin opens `/assets-applications` with no `tab` parameter
- **THEN** the Public tab is selected

#### Scenario: Returning from a detail page restores the tab

- **WHEN** a user opens an application from the config.json tab and navigates back
- **THEN** the config.json tab is selected

#### Scenario: Unavailable tab falls back

- **WHEN** a user opens `/platform-keys?tab=file`
- **THEN** the Platform grid is shown

### Requirement: Platform and config.json tabs show a count badge

The system SHALL show the number of entities after the tab label for the Platform and config.json tabs, loaded when
the listing mounts so the badge is visible before the tab is opened. The Public tab SHALL show no badge. A failed
load SHALL show no badge for that tab and SHALL follow the listing's established request-error notification
behavior, and SHALL NOT be shown as a count of zero.

#### Scenario: Badges are shown before a tab is opened

- **WHEN** an admin opens `/assets-applications` with 4 platform applications and 2 config-file applications
- **THEN** the Platform tab shows 4 and the config.json tab shows 2 while the Public tab is selected

#### Scenario: A failed config.json read shows no badge

- **WHEN** the config-file names request fails
- **THEN** the config.json tab shows no badge and the error notification is shown

### Requirement: Header count follows the source rule

The system SHALL show `{n} {entities}` after the title only on listings with no Public tab, where `n` is the
Platform count plus the config.json count (the Platform count alone for Keys). Assets Applications and Assets
Toolsets SHALL show no count after the title. The count SHALL NOT change when the selected tab changes.

#### Scenario: Models shows the combined count

- **WHEN** an admin opens `/platform-models` with 5 platform and 3 config-file models
- **THEN** the header shows `8` models

#### Scenario: Applications shows no header count

- **WHEN** an admin opens `/assets-applications`
- **THEN** no count is shown after the title

#### Scenario: Keys shows the platform count

- **WHEN** a user opens `/platform-keys` with 6 keys
- **THEN** the header shows `6` keys

### Requirement: Create button follows the active tab

The system SHALL show the Create button at the end of the tab row only while the Platform tab is active, and SHALL hide it for a
read-only admin. It SHALL NOT be shown on the Public tab, which keeps the file manager's own Import / Folder /
Entity dropdown, nor on the config.json tab, which is read-only. On Platform-only listings (no tab row) the
Create button SHALL still be shown at the end of the (otherwise empty) tab row.

#### Scenario: Platform tab offers Create

- **WHEN** an admin selects the Platform tab on `/assets-toolsets`
- **THEN** the tab row shows the Create button and activating it opens the create modal for a platform toolset

#### Scenario: Public tab has no Create button

- **WHEN** an admin selects the Public tab
- **THEN** the tab row shows no Create button and the file manager's Create dropdown still offers Import, Folder and Entity

#### Scenario: config.json tab is read-only

- **WHEN** an admin selects the config.json tab
- **THEN** the tab row shows no Create button and no row offers a mutating action

### Requirement: Public tab is the single-root file manager

The system SHALL render the Public tab with the existing file manager restricted to the `public/` root, keeping its
current toolbar, row actions, move, import, export and folder behavior. The folder tree SHALL NOT render its own
title above the tree.

#### Scenario: Tree has no duplicate title

- **WHEN** the Public tab of Assets Toolsets is shown
- **THEN** the folder tree starts with the `public` folder and no heading repeats the page title

### Requirement: Platform tab is a flat grid

The system SHALL render the Platform tab as a flat grid of entities with no folder tree, no folder-create,
rename-folder or move-to-folder control, and the row actions the entity already offers on the platform bucket
(create, duplicate where supported, delete, open in new tab; no selection column, no bulk actions). Policies and Policy Assignments SHALL
list every record as a row with a **Cost object** column, and SHALL NOT render cost-object
folders as rows or offer to delete a folder.

#### Scenario: Entities are direct rows

- **WHEN** a user opens the Platform tab of `/platform-routes`
- **THEN** all routes are shown as direct grid rows with no folder-expand affordance

#### Scenario: Policy rows show their cost object

- **WHEN** Core holds `daily-cap` and `team-a/team-cap` and a user opens the Platform tab of `/platform-policies`
- **THEN** two rows are shown, and `team-cap` has `team-a` in its Cost object column while `daily-cap` has an empty Cost object cell

### Requirement: config.json tab is a read-only flat grid

The system SHALL render the config.json tab as a flat grid with a name column and an open-in-new-tab row action,
and SHALL offer no create, import, export, delete, duplicate, rename, move or selection-mutation action. A row SHALL
open the existing config-file detail route per `config-file-entity-views`.

#### Scenario: Only name and open are offered

- **WHEN** a user opens the row action menu on a config.json row
- **THEN** only open-in-new-tab is offered

### Requirement: The entity picker offers the same tabs

The system SHALL render the entity picker used for selecting Applications (role limits) with the same tab rules as
the listing: a Public tree, and Platform and config.json flat grids, where a tab is offered only for sources that
exist for the caller. Public tree selection SHALL offer only entities, never grouping folders. The picker SHALL
report each selection with its source. Selecting a name on the Platform tab and the config.json tab SHALL count as
the same selection, because both store the bare name.

#### Scenario: Picker shows the three sources

- **WHEN** an admin opens Add applications on a role
- **THEN** the popup shows the Public, Platform and config.json tabs and each tab allows selecting entities

#### Scenario: The same name on two flat tabs is one selection

- **WHEN** an admin selects `assistant` on the Platform tab and opens the config.json tab, which also lists `assistant`
- **THEN** `assistant` is shown as selected there and applying adds one entry

#### Scenario: Selection survives tab switches

- **WHEN** an admin selects one entity on the Public tab, switches to Platform, selects another, and applies
- **THEN** both entities are reported, each with its source


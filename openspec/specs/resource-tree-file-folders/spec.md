# resource-tree-file-folders Specification

## Purpose
Org unit folders on the folder trees of the toolsets, applications, skills, projects, conversations and prompts listings: which trees and paths add them, units only, the dedupe rule, when units are re-read and a built tree rebuilt, and failure isolation — created by archiving change `show-file-folders-in-resource-trees`, reworked by `units-from-org-units-in-resource-trees`.

## Requirements

### Requirement: Resource trees include org unit folders
When a folder under `public/` is loaded on the toolsets, applications, skills, projects, conversations or prompts listing, the tree SHALL contain the union of that resource type's folders and the folder of every org unit that is a direct child of the loaded path, deduplicated by path. When both sources contain a folder, the resource type's own node SHALL be kept. Unit folders SHALL arrive in the same load as the type's own folders, so a unit that has no content of the type can be expanded and its children loaded like any other folder. Unit folders SHALL be derived from the org-units list the application already holds, and loading a folder SHALL NOT read the Files listing.

#### Scenario: Unit with no content of the type
- **WHEN** `public/` is loaded on the toolsets listing and unit `public/Acme/` has no toolsets
- **THEN** `Acme` appears in the toolsets folder tree next to the toolset folders

#### Scenario: Nested unit under a folder that has content
- **GIVEN** `public/Acme/` holds toolsets and `public/Acme/Risk/` is a unit without toolsets
- **WHEN** `public/Acme/` is loaded
- **THEN** `Risk` appears under `Acme` next to its toolset folders

#### Scenario: Unit in both sources
- **WHEN** `public/Shared/` is a unit and the prompts listing also contains it
- **THEN** the tree shows `Shared` once, with the prompts node's fields

#### Scenario: Expanding a unit-only folder
- **GIVEN** `public/Acme/` appears in the prompts tree only because it is a unit
- **WHEN** the user expands it
- **THEN** the prompts listing for that path is requested and its nested folders merge with the units directly below it

#### Scenario: Unit folder with no items of the type
- **WHEN** the user opens a unit folder and the type's listing returns no rows
- **THEN** the folder is shown empty and is not reported as a load failure

#### Scenario: No Files read
- **WHEN** any folder under `public/` is loaded on one of the six listings
- **THEN** no Files folder read is made

### Requirement: Only units are added
Only org unit folders SHALL be added to a resource tree. A folder that exists in Files but is not a unit SHALL NOT appear on a tree because of Files. File items, including the `.dial_folder` marker, SHALL NOT appear in the tree or in a folder's cached items, and the item grid SHALL keep listing only the resource type's own items.

#### Scenario: Files-only folder that is not a unit
- **WHEN** Files has folder `public/Handbook/` that is not a unit and the prompts listing has no such folder
- **THEN** `Handbook` does not appear in the prompts tree

#### Scenario: Marker is never a row
- **WHEN** a unit's folder holds a `.dial_folder` marker in Files
- **THEN** the unit folder appears in the tree and the marker itself does not

### Requirement: Scope of unit folders
Unit folders SHALL be added only for the six listings above and only for paths under `public/`. The Files listing, the models, keys, roles, routes, interceptors, translators, catalog schemas and app runners trees SHALL load exactly as before. The Applications and Toolsets `platform` root and the synthetic config-file roots SHALL NOT receive unit folders.

#### Scenario: Other trees are unchanged
- **WHEN** a folder is loaded on the models listing
- **THEN** no unit folders are added and the org-units list is not awaited

#### Scenario: Applications platform root
- **WHEN** the Applications listing loads its `platform` root
- **THEN** no unit folders are added, and the `public` root is loaded with its units merged

### Requirement: Units are re-read when a listing opens
Opening a listing of a route that has an org-unit namespace SHALL re-read the org units once. Expanding or selecting a folder inside an open listing SHALL NOT re-read them. A folder load that starts while the re-read is in flight SHALL wait for its result, so the first tree built after opening reflects the fresh units. Once Core has answered that org units are unavailable, later listing opens SHALL NOT repeat the request until the page is reloaded.

#### Scenario: Returning to a listing
- **WHEN** the user opens toolsets, then applications, then toolsets again
- **THEN** the org units are read on each of the three openings

#### Scenario: Opening a subfolder
- **GIVEN** the toolsets listing is open
- **WHEN** the user expands or selects a subfolder
- **THEN** the org units are not read again

#### Scenario: First load waits for units
- **WHEN** a listing opens and its first folder load starts while the units read is still running
- **THEN** the tree shows the units from that read, without a second load

#### Scenario: Listing without a unit namespace
- **WHEN** the user opens a listing whose route has no org-unit namespace
- **THEN** no re-read is made beyond the one-time load that unit icons already use

#### Scenario: Org units unavailable
- **GIVEN** the org-units read has answered 404 or 403
- **WHEN** the user opens another unit-aware listing
- **THEN** no org-units request is made

### Requirement: A built tree follows the set of units
When the set of unit folders differs from the set a listing's tree was built from, the tree SHALL be rebuilt: its cached folders and rows are dropped, the user's selected folder is kept, and the listing reloads the root, or the chain down to a nested selected folder, the next time it is shown. The reloaded tree opens as a freshly loaded one does: the root, or the chain down to the selected folder. A change that leaves the set of unit folders unchanged, such as a display-name rename, SHALL NOT rebuild the tree. A listing that is not mounted SHALL NOT fetch in the background because of a change.

#### Scenario: Unit created while the tree is cached
- **GIVEN** the toolsets tree was built before unit `public/New/` existed
- **WHEN** the listing is opened again and the units read returns `public/New/`
- **THEN** the tree is rebuilt and shows `New`

#### Scenario: Selected nested folder survives
- **GIVEN** the user had `public/Acme/Tools/` selected
- **WHEN** the tree is rebuilt because the unit set changed
- **THEN** the chain down to `public/Acme/Tools/` is reloaded and that folder stays selected

#### Scenario: Rename does not rebuild
- **WHEN** a unit's display name changes and its folder does not
- **THEN** the tree is not rebuilt

#### Scenario: Unmounted listing
- **WHEN** the unit set changes while the prompts listing is not open
- **THEN** no prompts folder request is made until the listing is opened

### Requirement: Org unit failures are isolated
When org units are switched off in Core, forbidden, or the read fails or throws, no unit folders SHALL be added from that read, and the resource type's own listing SHALL load as it does without units: neither its rows, its error state nor its timing SHALL depend on the units outcome. A failed re-read SHALL keep the units from the last successful read. A failure of the type's own listing SHALL keep its existing fetch-error behavior regardless of the units.

#### Scenario: Org units disabled in Core
- **WHEN** Core answers 404 to the org-units read
- **THEN** every listing shows only the type's own folders and no error is shown

#### Scenario: Units read fails after a success
- **GIVEN** the units were read successfully once
- **WHEN** a later read fails
- **THEN** the unit folders from the last successful read are still used

#### Scenario: Units read fails on first use
- **WHEN** the first read fails
- **THEN** the tree shows the type's own folders and no error is reported

#### Scenario: Type listing fails
- **WHEN** the type's own listing fails
- **THEN** the folder context reports its usual fetch error, even if units are available

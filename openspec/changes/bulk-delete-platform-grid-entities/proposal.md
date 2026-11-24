# Proposal

## Why

PR #5511 replaced the Platform file-manager views with flat grids but left them without multi-selection or bulk delete. Administrators must now delete entities one at a time, even though the existing deletion actions and confirmation popup already support multiple rows.

## What Changes

- Add a leading checkbox column to writable Platform listing grids and to both the Platform and Public flat grids for Aliases. Match File Manager selection-control visibility, hover styling and checkbox/header icons. When at least one entity is selected, show a File Manager-style bottom actions panel with the selection count and Delete.
- Open a confirmation popup listing every selected entity before deletion. Reuse the existing Platform confirmation and deletion paths, preserving each entity's actual resource path and bucket.
- Propose that the header checkbox select filtered rows, that a later filter not silently remove selected entities from the confirmation, and that switching listing tabs clear the selection. These selection details remain open to revision during design.
- Preserve read-only behavior for config.json and read-only administrators. Keep existing single-row actions and entity-picker selection behavior.
- Refresh the affected list and counts after success or failure, and surface failures: existing per-item deletion can stop after some entities have already been deleted and is not atomic.

## Non-goals

- Changing the Public file managers for Applications and Toolsets, or adding folder deletion to flat grids.
- Changing entity pickers, config.json data, or unrelated grids.
- Adding a backend bulk endpoint, atomic deletion, or changing existing per-entity deletion contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tabbed-asset-listings`: Replace the Platform grid's no-selection/no-bulk-action rule with listing selection, confirmation and bulk deletion, including partial-failure refresh behavior.
- `aliases`: Specify and exercise the existing bulk-delete requirement on both writable source grids, keeping deletion in the active bucket and leaving alias targets untouched.

## Impact

- `TabbedAssetList` coordinates the active grid's selection, bottom actions panel and Delete action.
- `FlatAssetGrid` is shared with the entity picker; listing selection must not alter picker interactions. Existing `MULTI_ROW_SELECTION`, `DeletePlatformAssetsModal`, and `use-platform-asset-actions` provide patterns to reuse.
- Existing Core deletion actions remain in use. Their per-item failure behavior means a failure can follow successful deletions; the refreshed grid must reflect the actual outcome.
- Update affected OpenSpec requirements and add tests for selection, permissions, source isolation, confirmation, and partial failure.

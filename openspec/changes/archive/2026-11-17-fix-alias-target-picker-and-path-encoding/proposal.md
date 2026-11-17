## Why

Two alias bugs from the 0.24 test pass (#5568, #5569). Creating an alias whose Public application target sits in a
folder with a space in its name fails: Core's `AliasService.toTargetResource` hands `target.path` to
`ResourceDescriptorFactory.fromAnyUrl`, which treats everything after `type/bucket/` as an already-encoded path, so
`Code Apps ALS` is rejected as "Invalid alias target". Separately, the target picker's Platform and config.json grids
render entity names as links (which open the entity instead of picking it) and their empty state advertises a Create
button the user cannot use there.

## What Changes

- `toAliasTargetPath` percent-encodes each segment of a Public pick's path (`QA/Code Apps ALS/app__1.0.0` →
  `QA/Code%20Apps%20ALS/app__1.0.0`), keeping `/` separators. `parseAliasTargetPath` decodes the reference, so the
  stored value round-trips and the Target tab shows the readable path.
- In select mode (the entity picker), `FlatAssetGrid` renders the name column without a link: plain text, the radio
  (single) or checkbox (multi) selection column as the only control. No new renderer; `DisplayNameCellRenderer`
  already has a no-href branch.
- Empty state in `FlatAssetGrid`: the description (which names the Create/import button) is dropped wherever the
  user cannot create — every picker grid, and the config.json tab on the listing page. The Platform listing tab
  keeps it.
- The alias `TargetField` keeps its read-only input plus "Select target" button; it is deliberately not changed to
  look like the Test Suites field.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `aliases`: Public target paths are stored percent-encoded and shown decoded; the empty-state scenario no longer
  names a Create button where creation is unavailable.
- `tabbed-asset-listings`: picker grids show names as plain text with a selection control; the empty state omits the
  create hint in the picker and on the config.json tab.

## Non-goals

- Restyling the Target field like Test Suites.
- Changing Platform/config.json targets (stored by bare name, no encoding needed).
- `getApplicationLimitKey` (Roles) builds a Public key from the raw tree path the same way and may have the same
  defect; check it separately.

## Impact

- `utils/aliases/target.ts` (+ its spec), `components/Assets/FlatAssetGrid/FlatAssetGrid.tsx`,
  `components/Assets/FlatAssetGrid/columns.tsx`, `getEmptyStateContent` callers.
- Shared by every picker and listing using `FlatAssetGrid` (role Add applications, alias target, Platform and
  config.json tabs of every tabbed listing); the empty-state change reaches all of them.
- No API or dependency change; Core already accepts the encoded form.

## Why

Lists rendered through `<FileManager>` — every `BaseAssetList` view (Applications, Toolsets, Prompts,
Conversations, Skills, the eight Platform views) plus Files — forget the column widths an operator drags,
and keep their filters only in `sessionStorage`, so closing the tab loses them. Entity lists built on
`BaseEntityList` remember both in `localStorage` and restore them on reload. Following #5077 (wider default
Name column), operators who widen a column on an asset list expect it to stay wide, the same as on every
other list.

## What Changes

- FileManager lists persist, per list, to `localStorage` under the same `gridColumnsState<view>` entry and
  `GridModel` shape entity grids use:
  - widths the operator dragged — never a width the grid computed (fit-to-width, flex, autosize)
  - column order
  - sort (`sort`, `sortIndex`, `sortType`)
  - filters
- Stored state is restored on reload, survives closing the tab, and applies across every folder of the
  same list.
- In compact view the stored order is ignored, so the list keeps leading with Name.
- The persistence logic in `AgGridWrapper` moves into a shared hook, so entity grids and FileManager lists
  share one implementation of "remember only what the operator chose". Entity-grid behavior is unchanged.
- **Removed:** the `sessionStorage` filter entry `assetListFilter_<view>` and its constant. Filters saved
  there are not migrated; an open tab loses them once.

## Non-goals

- A "reset to default" control for FileManager lists — deferred to a follow-up (button next to "Create").
- Persisting column visibility or pinning: FileManager has no columns panel, and the file-manager library
  owns which columns are shown.
- Persisting state for grids that mount `DialFileManager` directly — the delete-assets modal and the
  public-file picker.
- Per-folder state.

## Capabilities

### New Capabilities

- `asset-list-grid-state`: which grid state a FileManager list remembers across reloads, how it is keyed,
  what is never stored, and how compact view treats a stored order.

### Modified Capabilities

None. `grid-column-selection` and `entity-list-name-column` already describe the entity-grid rules; this
change keeps them as they are and reuses their "computed widths are not remembered" rule by reference.

## Impact

- `components/Grid/AgGridWrapper.tsx` — persistence moved into a new
  `components/Grid/hooks/use-grid-state-persistence.ts`; shared helpers in `components/Grid/utils.ts`. Every
  entity grid that passes a `storageKey` runs through the refactored code, so the existing
  `AgGridWrapper` persistence and sizing suites are the regression gate.
- `components/Common/FileManager/FileManager.tsx`, `constants.ts` — sessionStorage code removed, hook wired
  in through `additionalGridOptions`, which `@epam/ai-dial-react-file-manager` passes through to the grid.
- No API, server-action, or dependency changes. New `localStorage` keys: `gridColumnsState/<asset-route>`;
  asset routes never collide with entity routes.

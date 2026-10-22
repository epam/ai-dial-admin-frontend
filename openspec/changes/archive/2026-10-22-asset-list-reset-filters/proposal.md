## Why

The file-manager lists (every asset list and Files) now remember the operator's filters across reloads, but
there is no way to clear them in one step: the operator must reopen each column's filter and clear it. The
entity lists already offer a "Reset filters" button in their header for exactly this.

## What Changes

- Every file-manager list shows a **Reset filters** button in its header toolbar, immediately before the
  Create (Add on Files) button. It reuses the entity lists' `ResetFiltersButton`.
- The button is shown only while at least one filter is applied; clicking it clears the filters.
- It clears filters only. The stored column widths, order and sort stay, and the stored filters become empty.
- Bump `@epam/ai-dial-react-file-manager` to `^0.4.0-dev.12`, which exposes `toolbarOptions.additionalButtons`
  (the library toolbar had no slot for host controls), and `@epam/ai-dial-ui-kit` to `^0.16.0-dev.19`, the
  version the file manager is built against.

### Non-goals

- Resetting widths, order or sort. The earlier idea of a button that clears the whole stored grid entry is
  dropped; the entity `ColumnsPanel` reset is a different control for a different concern.
- Changing the entity lists' `ResetFiltersButton`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `asset-list-grid-state`: adds the requirement that a file-manager list offers a reset-filters control in its
  header while filters are applied, and that it leaves the other stored state untouched.

## Impact

- `components/Common/FileManager/FileManager.tsx`: passes `ResetFiltersButton` through
  `toolbarOptions.additionalButtons`.
- `package.json` / `package-lock.json`: the two dependency bumps above.
- No server, route or i18n changes: `ButtonsI18nKey.ResetFilters` already exists.

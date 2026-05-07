## Why

The Admin UI uses a custom `onCellClicked` handler on AG Grid rows that calls `router.push()` unconditionally for every click, regardless of modifier keys. Ctrl+Click, Cmd+Click, and middle-click all navigate the current tab instead of opening a new one. Additionally, `AgGridWrapper` suppresses the native browser right-click context menu (`preventDefaultOnContextMenu={true}` + custom `CellContextMenu`) — the custom menu only offers "Copy" with no way to open the entity in a new tab.

This slows down QA and Admin workflows: users cannot open multiple entities side-by-side without losing their current list with applied filters.

## What Changes

- **`EntityListView.tsx` modifier-key guard**: `onCellClicked` checks for `ctrlKey`, `metaKey`, or middle-button on **any** cell (except the Actions column) and calls `window.open(getUrnForEntity(route, e.data), '_blank')` instead of `router.push()`. Clicking any cell with a modifier opens the entity in a new tab.
- **`CellContextMenu` — "Open in new tab" item**: The custom right-click menu receives an optional `href` and renders an "Open in new tab" item when present. `AgGridWrapper` receives an optional `getHref` prop to supply the URL per right-clicked row; `EntityListView` passes `getHref={(data) => getUrnForEntity(route, data)}`.

## Non-goals

- No changes to the existing "Open in new tab" action button in the Actions column
- No changes to bulk-select / multi-row operations
- No changes to Files/Prompts/Assets folder tree navigation (different navigation path, separate concern)
- No changes to detail-view text fields or grid cell text selection

## Capabilities

### New Capabilities
- `open-in-new-tab-modifier-click`: Ctrl/Cmd/middle-click on any entity list cell opens the entity in a new tab
- `open-in-new-tab-context-menu`: Right-click context menu in entity lists includes "Open in new tab"

## Impact

- **Components**: `EntityListView.tsx` (modifier-key guard, extracted `onCellClicked` utility), `Grid/CellContextMenu/CellContextMenu.tsx` (add "Open in new tab" item), `Grid/AgGridWrapper.tsx` (add `getHref` prop), `ListView` and `GridView` (thread `getHref` prop)
- **Behavior**: Ctrl/Cmd/middle-click on any cell opens the entity in a new tab. Right-click shows custom menu with "Copy" and "Open in new tab". Plain left-click navigation unchanged.
- **Session preservation**: Opening in a new tab leaves filters/sorting in the original tab intact

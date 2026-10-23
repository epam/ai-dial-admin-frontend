## MODIFIED Requirements

### Requirement: Grid stays mounted with in-grid no-rows overlay

The Usage Log grids SHALL keep `AgGridWrapper` mounted at all times so column filter UI (popup + floating filter inputs) survives data refetches. The empty-state UI SHALL render INSIDE the grid via AG-Grid's `noRowsOverlayComponent` (rendering `NoDataContent`), not by replacing the grid with `NoDataContent` at the `GridView` level.

The list SHALL pass a `getIsEmptyData` callback that always returns `false`, so `GridView`'s existing empty-data swap is never triggered. The list SHALL NOT pass `overlayNoRowsTemplate` (HTML string) — it uses the React `noRowsOverlayComponent` overlay instead, with the per-tab title passed via `noRowsOverlayComponentParams` so the overlay component reference stays stable.

#### Scenario: Empty result keeps the filter row visible

- **WHEN** the user-selected range or applied filters yield zero rows
- **THEN** the grid header (column titles + floating-filter inputs) remains rendered
- **AND** the `noRowsOverlayComponent` shows `NoDataContent` with the per-tab `emptyDataTitle` over the empty grid body
- **AND** clicking column filter funnels still opens the popup filter with its current state
- **AND** clearing or changing a filter triggers a new fetch and the grid re-populates without remounting

#### Scenario: First fetch on mount

- **WHEN** the Usage Log mounts and the first fetch is in flight
- **THEN** the grid is mounted with empty `rowData`
- **AND** the AG-Grid loading overlay is shown (not the no-rows overlay)
- **AND** when the response arrives, `rowData` is set atomically

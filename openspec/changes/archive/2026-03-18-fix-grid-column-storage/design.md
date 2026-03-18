# Design: Unified grid column storage

## Current state (broken)

```
┌──────────────────────┐     ┌──────────────────────────┐
│      GridView        │     │     AgGridWrapper         │
│                      │     │                           │
│ toggleVisibility()───┼──▶ COLUMNS_KEY (hide only)     │
│                      │     │                           │
│ passes columnDefs────┼──▶ useEffect                   │
│                      │     │  ├─ reads GRID_COLUMNS_KEY│
│                      │     │  │  (stale hide!)         │
│                      │     │  ├─ updateGridOptions ✓   │
│                      │     │  └─ applyColumnState ✗    │
│                      │     │     (overwrites hide)     │
└──────────────────────┘     └──────────────────────────┘
```

## Target state (fixed)

```
┌──────────────────────┐     ┌──────────────────────────┐
│      GridView        │     │     AgGridWrapper         │
│                      │     │                           │
│ toggleVisibility()───┼──▶ GRID_COLUMNS_KEY            │
│  (updates hide in    │     │  (single source of truth) │
│   unified store)     │     │                           │
│                      │     │                           │
│ passes columnDefs────┼──▶ useEffect                   │
│                      │     │  ├─ reads GRID_COLUMNS_KEY│
│                      │     │  │  (correct hide ✓)      │
│                      │     │  ├─ updateGridOptions ✓   │
│                      │     │  └─ applyColumnState ✓    │
└──────────────────────┘     └──────────────────────────┘
```

## Key decisions

### GridView reads visibility from GRID_COLUMNS_KEY on init

Instead of `getColumnVisibilityFromStorage()` reading `COLUMNS_KEY`, GridView will call `getColumnsStateFromStorage()` and extract `hide` from the column state entries. If no stored state exists, fall back to `columnDefs` defaults.

### GridView writes visibility to GRID_COLUMNS_KEY on toggle

When user toggles a column, GridView:
1. Updates `currentColDefs` (existing behavior)
2. Reads current `GridModel` from `GRID_COLUMNS_KEY`
3. Updates the `hide` field for the toggled column in `model.columns`
4. Writes back to `GRID_COLUMNS_KEY`

This keeps sort/filter/width intact while updating visibility.

### New utility: `updateColumnVisibilityInStorage`

```ts
updateColumnVisibilityInStorage(
  storageKey: string,
  colDefs: ColDef[]
): void
```

Reads the existing `GridModel`, patches `hide` for each column, and saves back. Replaces `saveColumnVisibilityToStorage`.

### New utility: `getColumnVisibilityFromGridState`

```ts
getColumnVisibilityFromGridState(
  storageKey: string,
  columnDefs: ColDef[]
): ColDef[]
```

Reads `GridModel` from storage, applies stored `hide` values to `columnDefs`. Returns `columnDefs` unchanged if no stored state. Replaces `getColumnVisibilityFromStorage`.

### Edge case: first visit (no stored state)

`getColumnsStateFromStorage` already returns defaults when storage is empty. GridView falls back to `columnDefs` as-is — same behavior as today.

### Edge case: column set changes (new columns added/removed)

GridView already handles this (line 65: checks `columnDefs.length > storageColumns.length`). The same logic applies — if stored columns don't match current columns, reset to defaults.

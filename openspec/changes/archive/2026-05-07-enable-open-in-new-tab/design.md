## Context

`EntityListView.tsx` (lines 58–63) calls `router.push()` for every cell click with no modifier-key check. Because `AgGridWrapper` also suppresses the native context menu (`preventDefaultOnContextMenu={true}` + custom `CellContextMenu`), the only way to open an entity in a new tab is the dedicated "Open in new tab" action button in the Actions column. The custom menu only has "Copy".

The existing `getUrnForEntity` and `onOpenInNewTab` utilities already compute entity URLs correctly. All gaps are in the event-handling layer.

## Goals / Non-Goals

**Goals:**
- Ctrl+Click / Cmd+Click on any entity cell (except Actions column) opens detail in a new tab
- Middle-click on any entity cell opens detail in a new tab
- Right-clicking any entity cell shows custom context menu with "Copy" (existing) and "Open in new tab" (new)
- Plain left-click same-tab navigation is unchanged

**Non-Goals:**
- No native browser context menu restoration (custom menu is intentional)
- No changes to Files/Prompts/Assets tree navigation
- No changes to detail-view fields
- No changes to grid cell text selection behavior

## Decisions

### 1. Modifier-key guard in `onCellClicked` (extracted utility)

**Decision**: Extract the handler to `EntityListView/utils/on-cell-clicked.ts` and update `EntityListView.tsx` to use it:

```typescript
// EntityListView/utils/on-cell-clicked.ts
export const onCellClicked = (
  e: CellClickedEvent,
  route: ApplicationRoute,
  push: (url: string) => void,
): void => {
  if (e.colDef.field === ACTIONS_COLUMN_CEL_ID) return;
  const event = e.event as MouseEvent | undefined;
  if (event?.ctrlKey || event?.metaKey || event?.button === 1) {
    window.open(getUrnForEntity(route, e.data), '_blank');
    return;
  }
  push(getUrnForEntity(route, e.data));
};
```

**Why extract**: Pure function (no hooks/JSX) — project convention is to extract these into utils files with tests. Makes the handler directly testable without mounting AG Grid.

**Why `window.open`**: Works for any cell click, not just a specifically decorated primary column. No new cell renderer required.

### 2. CellContextMenu — "Open in new tab" item

**Decision**: Add optional `href?: string` to `ContextMenuPosition`. When present, render an "Open in new tab" menu item above "Copy".

```typescript
export interface ContextMenuPosition {
  x: number;
  y: number;
  value: string;
  href?: string;
}
```

`handleOpenInNewTab` calls `window.open(position.href, '_blank')` then `onClose()`.

Uses `ActionMenuOperationI18nKey.Open_in_new_tab` (already exists) and `IconExternalLink` from `@tabler/icons-react`.

**Why extend the custom menu**: The custom menu intentionally replaces the native browser menu for consistent styling. Adding "Open in new tab" to it is the minimal, consistent fix — no need to restore the native menu.

### 3. AgGridWrapper — `getHref` prop

**Decision**: Add optional `getHref?: (data: unknown) => string | undefined` to `AgGridProps`. Compute `href: getHref?.(event.data)` inside `onCellContextMenu` and attach to `ContextMenuPosition`.

Grids that don't set `getHref` (analytics, imports, etc.) show only "Copy" — no behavior change.

### 4. Prop threading: ListView and GridView

`getHref` flows: `EntityListView` → `ListView` → `GridView` → `AgGridWrapper`. All optional.

## Component Structure

```
EntityListView
├── gridOptions.onCellClicked: (e) => onCellClicked(e, route, router.push)
│   (extracted to EntityListView/utils/on-cell-clicked.ts)
│
└── <ListView getHref={(data) => getUrnForEntity(route, data)}>
    └── <GridView getHref={...}>
        └── <AgGridWrapper getHref={...}>
            ├── onCellContextMenu → setContextMenu({ ..., href: getHref?.(data) })
            └── <CellContextMenu position={{ ..., href }}>
                ├── [Open in new tab]  (when href present)
                └── [Copy]
```

## User Flows

```
Plain left-click:
  onCellClicked → no modifier → router.push()
  Result: same-tab navigation ✓ (unchanged)

Ctrl+Click / Cmd+Click:
  onCellClicked → ctrlKey/metaKey → window.open(url, '_blank')
  Result: new tab opens, original tab stays ✓

Middle-click:
  onCellClicked → button===1 → window.open(url, '_blank')
  Result: new tab opens ✓

Right-click:
  onCellContextMenu → setContextMenu({ value, href: getHref(data) })
  Custom menu: [Open in new tab] [Copy]
  User clicks "Open in new tab" → window.open(href, '_blank')
  Result: new tab opens ✓
```

## Risks / Trade-offs

- **`window.open` popup blocker**: Cell click events are user gestures — no issue expected.
- **Middle-click reliability**: AG Grid's `onCellClicked` may not fire for middle-button in all browsers. If this proves unreliable in testing, adding `<a>` tags selectively can be revisited.

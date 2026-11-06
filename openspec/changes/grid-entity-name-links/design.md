## Context

See proposal.md — Why. Every entity list opens its details page from a click in any cell:

- `EntityListView` and most lists wire `onCellClicked` to `EntityListView/utils/on-cell-clicked.ts`, which
  skips only the actions column and calls `navigateEntityUrl` (`router.push`, or `window.open` when
  ctrl/meta/middle is held).
- `TablesView`, `PipelinesView` and `SessionsList` wire their own `onCellClicked` (Sessions also
  `onCellKeyDown` for Enter); `TestSuites/Runs` and `Datasets/TestSuites` call `onOpenInNewTab`, so a plain
  click always opens a new tab.
- The Assets lists pass `onTableFileClick` to `@epam/ai-dial-react-file-manager`; it fires for file rows
  only (folders are opened by the package itself), and `usePointerClickModifier` recovers ctrl/meta
  because that callback carries no event.
- `AgGridWrapper` feeds `getHref` into `useCellContextMenu` (row right-click menu: Copy, Open in new tab)
  and marks rows static (no hover) when a grid has no `getHref`, row/cell click handler or selection.
- No grid cell renders an anchor today; `DisplayNameCellRenderer` renders plain text with an icon.

Activity Audit grids are out of scope and keep their wiring.

## Goals / Non-Goals

**Goals:** one way to render a name link in any grid cell; remove row/cell-click navigation from every
in-scope list; keep folder navigation, row hover and the row context menu.

**Non-Goals:** changing `@epam/ai-dial-react-file-manager`; changing row action menus; Activity Audit.

## Decisions

### D1. A shared `EntityLinkCell` renders the name as `next/link`

A small presentational component in `components/Grid/CellRenderers/` renders its children inside
`next/link` (`prefetch={false}`, as the menu links do, so a long grid does not prefetch every row) with the
link token classes (`text-accent`, underline on hover and `focus-visible`, the a11y focus ring). The
link's accessible name is its visible text (the display name). Name renderers take an optional `href`
through `cellRendererParams` / a getter:

- `DisplayNameCellRenderer`, `TitleSubtitleCellRenderer`, `SessionCellRenderer` and the Tables name
  renderer wrap only the title text in `EntityLinkCell` when an href is given; the icon/avatar and the
  subtitle stay outside the link.
- Plain-field name columns (Images, Publications, Queries, Pipelines, test suites, datasets, metrics,
  App Runners) get a `LinkCellRenderer` that renders the formatted value as an `EntityLinkCell`.

The href comes from the URL builders the lists already use (`getUrnForEntity(route, row)`,
`tableDetailHref`, `pipelineDetailHref`, `sessionDetailHref`), so the link and the context menu's "Open in
new tab" always open the same address.

*Alternatives:* ui-kit `LinkButton` — a `<button>`, so no native new tab, no address in the status bar, no
middle-click; rejected. Keep `onCellClicked` but limit it to the name column — still not a link
(no keyboard focus, no native new tab, modifier tracking kept); rejected.

### D2. Row and cell click handlers that navigate are removed

`onCellClicked` navigation is deleted from `EntityListView`, `ListView/Evaluation`, `ContainersList`,
`ImagesList`, `Publications/List`, `QueriesList`, `TablesView`, `PipelinesView`, `SessionsList`
(and its Enter `onCellKeyDown`), `TestSuites/Runs` and `Datasets/TestSuites`. `onCellClicked`,
`navigateEntityUrl` and `shouldOpenInNewTab` stay only while Activity Audit uses them; whatever is left
unused after the change is deleted.

### D3. Lists keep `getHref`, so hover and the row context menu stay

Every in-scope list keeps (or, for Tables, Pipelines, Sessions, Runs tab and dataset Test Suites, gains)
`getHref`. That keeps the row right-click menu's "Open in new tab" for a click outside the link and keeps
the row interactive in `AgGridWrapper`'s hover rule, which satisfies the hover requirement without a new
flag. The hover rule's meaning becomes "the row offers something" rather than "the row navigates"; the
condition in `AgGridWrapper` is unchanged.

### D4. Assets: link in our renderer, no `onTableFileClick`

`getAssetNameColumn` passes the item's href (built like `handleGridItemClick` builds its URL today,
including `configFile=true` on the file root except Catalog Schemas) to `DisplayNameCellRenderer`;
folder rows keep the package's own renderer and folder navigation. `BaseAssetList` stops passing
`onTableFileClick`, so a file-row click no longer navigates, and `usePointerClickModifier` loses its only
caller and is deleted. The package's own "Open in new tab" row action (`onOpenInNewTab`) stays.

### D5. Keyboard inside the grid

A focusable link inside an AG Grid cell is reached by moving focus into the cell and then Tab, and Enter
activates it natively. `AgGridWrapper`'s `suppressKeyboardEvent` suppresses only arrows and select-all, so
Enter reaches the link. The name cell must not set `suppressKeyboardEvent` for Enter.

## Risks / Trade-offs

- [Users used to clicking anywhere on the row find nothing happens] → the name is visibly a link (accent
  colour, pointer, underline on hover); the row right-click menu still offers "Open in new tab".
- [A link inside a cell competes with AG Grid's own cell focus and click handling] → no list keeps a
  navigating `onCellClicked`, so a link click does nothing else; unit tests assert the link's `href`.
- [Long names: a link that truncates] → the link wraps the existing `EllipsisTooltip` text, so the
  tooltip still exposes the full name.
- [Prefetching on large grids] → `prefetch={false}`.

## Migration Plan

Frontend only, no data migration. Ship per list group (see tasks) or as one PR; rollback is a revert.

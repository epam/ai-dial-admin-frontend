## Context

See proposal.md — Why. Single-run already ships bottom-default drawer, cell→scroll, and `PivotValueCell` + `FullscreenValueViewer`. Compare still defaults to right/table, uses Display table/pivot toggle, and opens `FullscreenDiffViewer` from pivot cells.

## Goals / Non-Goals

**Goals:**
- Align Compare row-detail open/position/view-mode with single-run patterns.
- Wire grid cell focus through to compare pivot scroll.
- Reuse shared popup cell UX for compare primary/secondary value cells.

**Non-Goals:**
- Redesign table-mode overflow → diff viewer.
- Change compare grid Display (column tree) panel.

## Decisions

### 1. Default and preserve bottom position

- Initialize `detailPosition` to `SidebarPosition.Bottom`.
- `closeRowDetail` clears selection and closes sidebar but does **not** reset position to Right (preserves last mode; initial is Bottom).
- Alternatives: always force Bottom on every open — rejected; header switcher must still work.

### 2. Single-value popup for pivot cells

- Pivot cell click opens `FullscreenValueViewer` with that cell’s raw value and field label (Figma).
- Table mode keeps `FullscreenDiffViewer` for overflow/diff.
- Alternatives: keep two-pane diff on pivot click — rejected; contradicts Figma and single-run.

### 3. Extend shared mapper and PivotValueCell

- Compare grid colIds use `cmp_` / `delta_` / `extracted_` prefixes — extend `mapGridColToPivotField` (or a thin compare wrapper that strips prefixes then delegates).
- Parameterize `PivotValueCell` with explicit `raw` / `isFailed` so secondary-run cells reuse the same component; pass compare highlight classes via `className`.
- Extract `scrollPivotToField` to a shared util under `Details/RowDetails` if Compare importing from `View/RowDetails` is awkward; otherwise import from the existing export.

### 4. View mode locked to position

- Remove Display segmented control; render Pivot when `position === Bottom`, Table when `Right`.
- Drop independent `viewMode` state in `CompareRowDetailPanel`.

## Risks / Trade-offs

- [Risk] Compare colId mapping misses edge cases → Mitigation: unit tests covering status/http/duration/cmp_/delta_/extracted_/grid-only.
- [Risk] Cell + row click double-open → Mitigation: `cellClickHandledRef` pattern from `ExtractionResult`.
- [Risk] Extending `PivotValueCell` breaks single-run → Mitigation: default `raw` to `field.primaryRaw`; keep existing props optional.

## Migration Plan

No data migration. Deploy with Compare UI change only; no feature flag.

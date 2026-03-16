## Context

`SelectRunnerModal` passes `runners` data to `GridView` only via `onGridReady` callback, not as a `rowData` prop. However, `GridView` checks `rowData == null || rowData.length === 0` to decide whether to show the "No Data" placeholder or the AG Grid. Since `rowData` is never passed, the grid never renders and `onGridReady` never fires — creating a dead path.

All other `GridView` usages in the app either:
- Pass `rowData` directly as a prop, or
- Use `onGridReady` without `emptyDataProps` (so the grid always renders)

`SelectRunnerModal` is the only component combining `onGridReady`-based data loading with `emptyDataProps`, which triggers the bug.

## Goals / Non-Goals

**Goals:**
- Make `SelectRunnerModal` pass `runners` as `rowData` to `GridView` so the grid renders and displays templates
- Keep the pre-selection logic (selecting the previously chosen runner)

**Non-Goals:**
- Changing `GridView` empty-data evaluation logic
- Modifying the data fetching in `Templates.tsx`

## Decisions

### Decision 1: Pass `runners` as `rowData` and `columnDefs` directly to GridView

**Choice**: Pass `runners` and `BASE_COLUMNS` as props to `GridView` instead of setting them in `onGridReady`. Use `onGridReady` only for pre-selecting the previously chosen row.

**Rationale**: This aligns with how every other `GridView` consumer works. The grid data is available at render time (passed as a prop from `Templates`), so there's no need for deferred loading via `onGridReady`.

## Risks / Trade-offs

- **[No risk]**: This is a straightforward alignment with existing patterns. No behavioral changes beyond fixing the empty list.

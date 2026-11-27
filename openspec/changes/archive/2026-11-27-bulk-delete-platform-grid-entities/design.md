# Design

## Context

See `proposal.md` for motivation. `TabbedAssetList` owns each flat source's `useFlatAssets` result and renders the active source's `FlatAssetGrid`; the grid owns row actions and `usePlatformAssetActions`, including `DeletePlatformAssetsModal`. The same grid also serves entity pickers, whose selection semantics differ from listing selection. The header owns Create and the active grid API, but not the grid's modal state.

The existing multi-row configuration selects filtered rows. Flat data is loaded into the client; no server-side select-all token is involved. The shared `bulkDeleteAssets` helper issues individual Core delete requests and stops at the first failure. Existing actions can therefore partially succeed. `useFlatAssets.refetch` is owned by the listing shell, reports read failures, and omits the source count on a failed read.

## Goals / Non-Goals

**Goals:** Keep selection, deletion and refresh scoped to the source where deletion started, including when an operation finishes after a tab switch. Preserve existing picker, row-action and read-only behavior.

**Non-Goals:** New Core APIs, atomic deletion, or a common selection store across unrelated listings.

## Decisions

### D1. Keep grid selection in the listing and expose intent to the shell

Enable the UI kit Grid's multi-selection in `FlatAssetGrid` for writable listing mode, separately from its existing AG Grid picker modes. Reuse the file manager's kit checkbox and header rendering, visibility and hover states. Forward the kit selection mode through `GridView` and `AgGridWrapper` without changing other callers. Report selected listing rows to `TabbedAssetList`, which renders a bottom actions panel with the count, a clear-selection control, and Delete. The file manager's panel is not a public standalone export, so mirror its layout with shared controls. The shell passes a bulk-delete intent back to the active grid, which opens its existing confirmation/action path. Use one source-scoped coordination mechanism rather than duplicating deletion state in the shell and grid.

The kit uses filtered select-all. Leave its selection uncontrolled and synchronously read AG Grid selection events, including hidden rows; the kit's debounced callback and controlled-selection effect otherwise race with API and row-data events. A grid class activates the kit's existing all-visible style while any row is selected. Stable row IDs let AG Grid reconcile selection on refreshed data. The selection column stays first with saved layouts, and its controls remain visible on hover or focus with no selection, and continuously visible with a selection. The kit's existing icons and theme tokens match the file manager; no global native-checkbox overrides are changed.

The shell clears listing selection when sources change or the panel's clear control is activated; it must not modify picker selection. Select-all acts on filtered rows, while a previously selected row remains selected when hidden by a subsequent filter. The confirmation uses the entire selection, not just displayed rows. The `getRowId` passed by `FlatAssetGrid` is currently forwarded by `AgGridWrapper` only for live data; do not assume it stabilizes ordinary listing selection across row-data replacements. Ensure stable path identity or explicitly reconcile selection after refresh, and test the actual wrapper behavior.

Alternative: move all modal and deletion state into the shell. Rejected because it duplicates the existing row-action flow and makes the shell responsible for entity-specific actions. Using picker mode for listings is also rejected: it suppresses row actions and changes cross-tab selection.

### D2. Confirm an immutable source-scoped snapshot

At activation, pass a snapshot of the selected `AssetListItem` rows to `onOpenDelete`; `DeletePlatformAssetsModal` already renders an unfiltered grid of those rows. Use their stored paths rather than display names, including policy cost-object paths and Alias bucket paths. Cancel leaves selection intact and performs no request. Confirm uses the existing per-view bulk action mapping; prevent duplicate confirmation while the request is running. Existing row-level Delete continues to pass a one-row snapshot.

Alternative: derive deletion targets from the current visible grid on confirm. Rejected because filter or selection changes could silently change what the user approved, and names alone do not identify a source or cost object.

### D3. Refresh after both outcomes without implying atomicity

Capture the original source's `refetch` callback when the operation starts. On a successful response, show existing success notifications, refresh that source and clear the completed selection. On an unsuccessful response or rejected request, show an error and refresh the same source without a full-success notification. A failed refresh follows `useFlatAssets` load-error behavior, including an unavailable count rather than a false refreshed count. Do not assume the failed action identifies exactly which earlier rows succeeded; reconcile or clear stale selections after the refresh instead of reporting an invented per-row result.

The parent-owned source hook must remain reachable if the user changes tabs while deletion is in flight; do not refresh whichever source happens to be active later. Preserve the existing Core and server-action contracts, including policy fail-fast behavior and existing etag handling; do not promise rollback or transactional deletion.

Alternative: refresh only on success, as today. Rejected because a partial failure leaves already-deleted rows and counts stale. A new atomic backend endpoint is out of scope.

### D4. Preserve accessibility and existing permissions

Show selection and Delete only when the listing is writable; config.json and read-only admins have neither. Use existing accessible checkbox/grid and danger confirmation controls, localized labels and keyboard access. The checkbox must not make the entity name link or row-action menu unusable. Keep toast announcements through the existing notification container; avoid adding duplicate live announcements.

Alternative: show disabled destructive controls everywhere. Rejected in favor of the existing Create and row-action permission pattern and the config.json read-only contract.

## Risks / Trade-offs

- [Hidden selected rows can be surprising] → The confirmation lists the complete snapshot, including rows hidden by filters.
- [Identical names or nested policy paths] → Select and delete by the full source-specific resource path; display sufficient context in the confirmation to distinguish entries.
- [Refresh or tab-switch race] → Refetch the source captured at confirmation, never an implicitly active source, and test the operation completing after a tab change.
- [Shared grid regressions] → Cover picker single/multi selection, read-only sources, single-row actions and column ordering in addition to listing bulk selection.
- [Partial failure cannot be rolled back] → Show the returned error and refresh; do not claim all selected entities were removed.

## Migration Plan

Frontend-only rollout with existing Core operations; no data migration or new dependency. Saved grid layouts must still put the new selection column first. Roll back by reverting the frontend change; previously completed deletes remain deleted.

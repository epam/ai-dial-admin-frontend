# Tasks

## 1. Listing selection and toolbar

- [x] 1.1 Enable writable listing multi-selection in `apps/ai-dial-admin/src/components/Assets/FlatAssetGrid/FlatAssetGrid.tsx` without changing picker modes; verify filtered select-all, retained hidden selection, read-only gating, row actions and leading column order in `FlatAssetGrid/tests/FlatAssetGrid.spec.tsx`.
- [x] 1.2 Coordinate source-scoped selection and the bottom actions panel with selected count, Delete, and clear-selection controls in `apps/ai-dial-admin/src/components/Assets/TabbedAssetList/TabbedAssetList.tsx`; verify the panel and source transitions in `TabbedAssetList/tests/TabbedAssetList.spec.tsx` and `BulkActionsPanel.spec.tsx`.
- [x] 1.3 Handle selection identity across row-data updates using actual `apps/ai-dial-admin/src/components/Grid/AgGridWrapper.tsx` behavior; verify path identity, saved column order, and picker single/multi-selection remain correct with focused grid tests, including at least one real grid render.
- [x] 1.4 Add or update unit/component tests for all code introduced or changed in this group; run the affected `FlatAssetGrid`, `TabbedAssetList`, grid-wrapper and picker test files from `apps/ai-dial-admin/`.
- [x] 1.5 Match selection checkbox, hover, visibility and header icons to `ai-dial-react-file-manager`; verify no-selection hover/focus and selected states without changing picker or unrelated grid styling.

## 2. Confirmation and deletion outcomes

- [x] 2.1 Wire the toolbar action to an immutable selected-row snapshot in `FlatAssetGrid` and `apps/ai-dial-admin/src/components/Assets/Modals/DeletePlatformAssetsModal.tsx`; verify all selected rows, including filtered-out rows and distinguishable policy cost objects, are listed, Cancel sends no request, and row-level delete still works.
- [x] 2.2 Update `apps/ai-dial-admin/src/components/Assets/FlatAssetGrid/use-platform-asset-actions.ts` to refresh the originating source after success, failure or rejection, report the appropriate notifications, and prevent duplicate submission; verify success, partial failure, rejected request and failed refresh with focused action tests.
- [x] 2.3 Preserve source paths for Public and Platform Aliases, Platform Applications/Toolsets, and nested Policies/Policy Assignments; verify selected paths and buckets in action/confirmation tests, including same-name aliases in both buckets and a delete completing after a source switch.
- [x] 2.4 Add or update unit/component tests for all code introduced or changed in this group; run the affected `use-platform-asset-actions`, `DeletePlatformAssetsModal`, listing and source-specific test files from `apps/ai-dial-admin/`.

## 3. Final quality checks

- [x] 3.1 Run `openspec validate bulk-delete-platform-grid-entities`, `npm run lint`, `npm run lint:specs`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs`, and `npm run test`; resolve failures or report any environmental blockers with their output. Strict OpenSpec validation currently warns about the existing long Platform-grid requirement, which must remain whole in this delta.

The automated browser-verification task was offered and declined for this change.

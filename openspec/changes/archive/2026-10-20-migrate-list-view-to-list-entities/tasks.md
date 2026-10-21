## 1. Images list

- [x] 1.1 In `components/Images/List/ImagesList.tsx`, replace `ListView` with `ListEntities` per the design's prop mapping (`rowData`, `listLabel`, `emptyDataProps`, `storageKey` unchanged, `isMainListView`, `isEnableColumnPanel`); remove `showColumnsPanel`, `toggleColumnsPanel`, the `window` click listener, and `gridApi`/`onGridReady` if unused afterwards
- [x] 1.2 In `components/Images/List/HeaderButtons.tsx`, remove the `ResetFiltersButton` and Columns button, the `toggleColumnsPanel`/`gridApi` props and the now-unused imports

## 2. Entity lists

- [x] 2.1 In `components/EntityListView/EntityListView.tsx` (`BaseEntityList`), replace `ListView` with `ListEntities` (`rowData`, `listLabel`, `emptyDataProps`, `storageKey={route}`, `isMainListView`, `isEnableColumnPanel={showColumnsButton}`, `getHref` unchanged); remove the columns-panel state, `gridApi` state, click listener and `onGridReady` if unused
- [x] 2.2 In `components/EntityListView/HeaderButtons/HeaderButtons.tsx`, remove the `ResetFiltersButton` and Columns button and the `gridApi`, `toggleColumnsPanel`, `showColumnsButton` props; keep Create and Modals

## 3. Activity audit

- [x] 3.1 In `components/ActivityAudit/List/List.tsx`, replace `ListView` with `ListEntities` per design decision 5: page mode passes `listLabel` with Refresh as `children`, and the view select / time filter / system-rollback row moves into `toolbar`; embedded mode (`entity` set) has no `listLabel`, so its time filter, Reset filters and Refresh row moves into `toolbar`; keep `key`, `storageKey` and `isMainListView`, and leave `isEnableColumnPanel` off
- [x] 3.2 Remove the Audit-owned `ResetFiltersButton` and the `gridApi` state it needed (page mode now gets Reset from the shell's header; in embedded mode it stays in the toolbar row, fed by `onGridReady` — keep `gridApi` only if still required there)

## 4. Remove the legacy shell

- [x] 4.1 Confirm with a repo-wide search that nothing imports `components/ListView/ListView`, then delete `ListView.tsx`
- [x] 4.2 Update docs or specs that name `ListView` as the list shell, if any (`openspec/specs/**`, `docs/**`)

## 5. Tests

- [x] 5.1 Update `EntityListView/tests/EntityListView.spec.tsx` and `EntityListView/HeaderButtons/tests/HeaderButtons.spec.tsx` to the new props and behaviour (Create button still gated by `isReadOnlyAdmin`/`createEntity`; Columns/Reset no longer rendered by `HeaderButtons`)
- [x] 5.2 Add or update specs for `ImagesList` and `Images/List/HeaderButtons` covering the title, Add/Global firewall actions, and that the Columns toggle comes from `ListEntities`
- [x] 5.3 Run the list specs that render through `BaseEntityList` (Models, Keys, Roles, Applications, Adapters, Interceptors, Routes, Files) and fix any that referenced the removed props

- [x] 5.4 Update `ActivityAudit/List/tests/List.spec.tsx` for the new shell: page-mode title heading and Refresh action, embedded mode without a heading and with its time filter, Reset filters and Refresh, and the system-rollback button gating (Config view, not read-only)

## 6. Quality checks

- [x] 6.1 Run `npm run lint`, `npm run format`, `npm run typecheck`, `npm run typecheck:specs` and `npm run test`; all at zero

<!-- No browser-verification task: this change adds no spec scenarios (no capability's requirements change). Whether to add a spec-browser-verify task for the visual parity check is left to the user. -->

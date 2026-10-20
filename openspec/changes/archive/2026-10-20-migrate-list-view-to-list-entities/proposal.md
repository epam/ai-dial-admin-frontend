## Why

Two list shells coexist: the legacy `ListView` and `ListEntities` (`components/ListView/List.tsx`), which already owns the columns-panel state, the "Columns" button and `ResetFiltersButton`. `ListView` has three consumers left (`BaseEntityList`, `ImagesList`, `ActivityAudit`), and each re-implements what `ListEntities` provides: a `showColumnsPanel` state, a `window` click listener to close the panel, and duplicated Columns / Reset buttons in their header-button components. Recent work (#5107) moved the Analytics lists across; this finishes the job for the entity lists so the shell can be removed.

## What Changes

- Migrate `EntityListView/EntityListView.tsx` (`BaseEntityList`, which backs Models, Keys, Roles, Applications, Adapters, Interceptors, Routes, etc.) from `ListView` to `ListEntities`.
- Migrate `Images/List/ImagesList.tsx` the same way.
- Migrate `ActivityAudit/List/List.tsx` (page mode and embedded mode) using the shell's `toolbar` slot.
- Delete `ListView.tsx` once no consumer remains.
- Prop mapping: `data` → `rowData`, `title` → `listLabel`, `emptyDataTitle` → `emptyDataProps={{ title }}`, `view`/`storageKey` → `storageKey`, plus `isMainListView` (keeps the `py-4 px-6` padding) and `isEnableColumnPanel`.
- Remove the consumer-owned `showColumnsPanel` state, `toggleColumnsPanel`, and the `window` click listener from both lists.
- Remove the duplicated Columns and `ResetFiltersButton` buttons from `EntityListView/HeaderButtons/HeaderButtons.tsx` and `Images/List/HeaderButtons.tsx`; drop the `gridApi`, `toggleColumnsPanel` and `showColumnsButton` props they no longer need.
- Update the affected specs (`EntityListView.spec`, `HeaderButtons.spec`, list specs).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This is a structural refactor: the visible behaviour of entity and image lists (title, columns panel, reset-filters, create/add buttons, empty state, column persistence key) is preserved. Small intentional differences are recorded in `design.md`.

## Impact

- Code: `components/EntityListView/**`, `components/Images/List/**`, and their tests. Every entity list that renders through `BaseEntityList` is affected visually, so each needs a visual check.
- No API, server action, dependency, or i18n changes.
- Shared component `ListEntities` is unchanged; `ListView.tsx` is removed.

## Non-goals

- Changing `ListEntities` itself; Audit is fitted to its existing slots.
- Renaming `ListEntities` to `ListView` (the existing `TODO` in `List.tsx`).

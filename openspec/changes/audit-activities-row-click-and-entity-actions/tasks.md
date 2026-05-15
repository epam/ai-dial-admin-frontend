## 1. Update ActivityAuditList — row click and entity tab actions

- [x] 1.1 In `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx`: add `openInNewTabForEntity` callback that calls `window.open(getAuditActivityHref(entity, entityType, activity?.activityId), '_blank')` when `entity` is defined
- [x] 1.2 Rewrite `onCellClicked` in `List.tsx`: for entity tab (`entity` defined) call `openInNewTabForEntity(e.data)` instead of `saveAuditTabReturn + router.push`; for standalone call `openInNewTab(e.data)` instead of `router.push(getUrnForEntity(...))`
- [x] 1.3 In `List.tsx` `columnDefs` useMemo: change the `entity` branch from returning bare `ACTIVITY_AUDIT_COLUMNS` to calling `getActivityAuditColumns(t, openInNewTabForEntity, isReadOnlyAdmin ? undefined : onOpenConfirmationModal, void 0, true)`
- [x] 1.4 Remove `usePathname` import and usage from `List.tsx`
- [x] 1.5 Remove `saveAuditTabReturn` import and call from `List.tsx`

## 2. Remove initialAuditTab from EntityAudit

- [x] 2.1 In `apps/ai-dial-admin/src/components/EntityTabs/Audit/EntityAudit.tsx`: remove `initialAuditTab` from the `Props` interface and component destructuring; revert `useState` to `useState(initialAuditTab ?? tabs[0].id)` → `useState(tabs[0].id)`

## 3. Revert PR #3306 changes in entity View.tsx files (10 files)

- [x] 3.1 `apps/ai-dial-admin/src/components/Adapter/View/View.tsx` — remove `usePathname`, `readAndClearAuditTabReturn` import, `savedTabs` state, revert `activeTab` init to `EntityViewTab.Properties`, remove `initialAuditTab` from TabsContent props
- [x] 3.2 `apps/ai-dial-admin/src/components/ApplicationRunners/View/View.tsx` — same removals as 3.1
- [x] 3.3 `apps/ai-dial-admin/src/components/Applications/View/View.tsx` — same removals as 3.1
- [x] 3.4 `apps/ai-dial-admin/src/components/InterceptorTemplates/View/View.tsx` — same removals as 3.1
- [x] 3.5 `apps/ai-dial-admin/src/components/Interceptors/View/View.tsx` — same removals as 3.1
- [x] 3.6 `apps/ai-dial-admin/src/components/Keys/View/View.tsx` — same removals as 3.1
- [x] 3.7 `apps/ai-dial-admin/src/components/Models/View/View.tsx` — same removals as 3.1
- [x] 3.8 `apps/ai-dial-admin/src/components/Roles/View/View.tsx` — same removals as 3.1
- [x] 3.9 `apps/ai-dial-admin/src/components/Routes/View/View.tsx` — same removals as 3.1
- [x] 3.10 `apps/ai-dial-admin/src/components/Toolsets/View/View.tsx` — same removals as 3.1

## 4. Revert PR #3306 changes in entity TabsContent.tsx files (10 files)

- [x] 4.1 `apps/ai-dial-admin/src/components/Adapter/View/TabsContent.tsx` — remove `initialAuditTab` from `Props` interface, destructured params, and `EntityAudit` JSX
- [x] 4.2 `apps/ai-dial-admin/src/components/ApplicationRunners/View/TabsContent.tsx` — same as 4.1
- [x] 4.3 `apps/ai-dial-admin/src/components/Applications/View/TabsContent.tsx` — same as 4.1
- [x] 4.4 `apps/ai-dial-admin/src/components/InterceptorTemplates/View/TabsContent.tsx` — same as 4.1
- [x] 4.5 `apps/ai-dial-admin/src/components/Interceptors/View/TabsContent.tsx` — same as 4.1
- [x] 4.6 `apps/ai-dial-admin/src/components/Keys/View/TabsContent.tsx` — same as 4.1
- [x] 4.7 `apps/ai-dial-admin/src/components/Models/View/TabsContent.tsx` — same as 4.1
- [x] 4.8 `apps/ai-dial-admin/src/components/Roles/View/TabsContent.tsx` — same as 4.1
- [x] 4.9 `apps/ai-dial-admin/src/components/Routes/View/TabsContent.tsx` — same as 4.1
- [x] 4.10 `apps/ai-dial-admin/src/components/Toolsets/View/TabsContent.tsx` — same as 4.1

## 5. Delete audit-tab-return utility and its test

- [x] 5.1 ~~Delete `apps/ai-dial-admin/src/utils/audit-tab-return.ts`~~ — SKIPPED: file still imported by `Containers/View/ContainerView.tsx` and `Images/View/ImageView.tsx` (PR #3316), cannot delete
- [x] 5.2 ~~Delete `apps/ai-dial-admin/src/utils/tests/audit-tab-return.spec.ts`~~ — SKIPPED: tests cover functions still used by Containers/Images views

## 6. Revert PR #3316 initialAuditTab from Containers/Images

- [x] 6.1 `apps/ai-dial-admin/src/components/Containers/View/ContainerView.tsx` — remove `usePathname`, `readAndClearAuditTabReturn`, `savedTabs` state, revert `activeTab` to `EntityViewTab.Properties`, remove `initialAuditTab` from TabsContent JSX
- [x] 6.2 `apps/ai-dial-admin/src/components/Containers/View/TabsContent.tsx` — remove `initialAuditTab` from Props, destructuring, and EntityAudit JSX
- [x] 6.3 `apps/ai-dial-admin/src/components/Images/View/ImageView.tsx` — same removals as 6.1
- [x] 6.4 `apps/ai-dial-admin/src/components/Images/View/TabsContent.tsx` — same removals as 6.2

## 7. Cursor pointer for clickable rows

- [x] 7.1 Add `.ag-activity-row-clickable { cursor: pointer; }` CSS class to `apps/ai-dial-admin/src/scss/ag-grid.scss`
- [x] 7.2 Add `rowClassRules` to `gridOptions` in `List.tsx` — apply `ag-activity-row-clickable` to rows that are not parent rows (children.length > 0) and not non-clickable deployment rows

## 8. Selected row highlight

- [x] 8.1 Add `.ag-activity-row-selected` CSS class to `ag-grid.scss` (same appearance as hover state)
- [x] 8.2 In `List.tsx`: add `highlightedActivityIdRef` ref; in `onCellClicked` set ref and call `gridApi?.redrawRows()`; in `onOpenConfirmationModal` set ref and call `gridApi?.redrawRows()`; add `rowClassRules` entry to highlight the matching row

## 9. Quality checks

- [x] 9.1 Run `npm run lint` from the repo root and fix any issues
- [x] 9.2 Run `npm run test` from `apps/ai-dial-admin/` and confirm all tests pass

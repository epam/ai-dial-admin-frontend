## 1. EntityListView — modifier-key guard (extracted utility)

- [x] 1.1 Create `apps/ai-dial-admin/src/components/EntityListView/utils/on-cell-clicked.ts`
  - Pure function `onCellClicked(e, route, push)` with modifier-key guard
  - Guards ACTIONS_COLUMN_CEL_ID, ctrlKey, metaKey, button===1
- [x] 1.2 Update `EntityListView.tsx` to use `onCellClicked(e, route, router.push)` and pass `getHref={(data) => getUrnForEntity(route, data)}` to `<ListView>`

## 2. CellContextMenu — "Open in new tab" item

- [x] 2.1 Add `href?: string` to `ContextMenuPosition` interface
- [x] 2.2 Add `handleOpenInNewTab` handler: `window.open(position.href, '_blank')` then `onClose()`
- [x] 2.3 Render "Open in new tab" item (with `IconExternalLink`) above "Copy" when `position.href` is defined

## 3. AgGridWrapper — getHref prop

- [x] 3.1 Add optional `getHref?: (data: unknown) => string | undefined` to `AgGridProps`
- [x] 3.2 Compute `href: getHref?.(event.data)` inside `onCellContextMenu`, add `getHref` to dependency array

## 4. Prop threading: ListView and GridView

- [x] 4.1 Add optional `getHref` prop to `GridView`, thread through to `AgGridWrapper`
- [x] 4.2 Add optional `getHref` prop to `ListView`, thread through to `GridView`

## 5. Unit Tests

- [x] 5.1 Create `apps/ai-dial-admin/src/components/Grid/CellContextMenu/tests/CellContextMenu.spec.tsx`
  - "Open in new tab" renders when `position.href` is defined
  - "Open in new tab" absent when `position.href` is absent
  - Clicking "Open in new tab" calls `window.open(href, '_blank')` and `onClose`

- [x] 5.2 Create `apps/ai-dial-admin/src/components/EntityListView/utils/tests/on-cell-clicked.spec.ts`
  - Calls `router.push()` on plain left-click
  - Calls `window.open(url, '_blank')` on ctrlKey / metaKey / button===1
  - Does nothing for ACTIONS_COLUMN_CEL_ID

## 6. Quality Checks

- [x] 6.1 Run `npm run lint` from repo root and fix any issues
- [x] 6.2 Run `npm run format:write` from repo root
- [x] 6.3 Run `npm run test` from `apps/ai-dial-admin/` and ensure all tests pass

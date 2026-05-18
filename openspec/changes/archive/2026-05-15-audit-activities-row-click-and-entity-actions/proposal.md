## Why

The audit activities grid currently navigates in-place when a row is clicked, which disrupts the user's context (for the standalone list it leaves the page; for the entity audit tab it navigates away and requires a session-storage workaround added in PR #3306 to restore the correct tab on return). Opening details always in a new tab is a better UX pattern for audit inspection, and it makes the #3306 breadcrumb-return mechanism entirely unnecessary.

Additionally, the entity audit tab grid is missing the action column (open in new tab, rollback) that exists on the standalone list, creating inconsistency.

## What Changes

- **Row click always opens in new tab** — `onCellClicked` in `ActivityAuditList` will use `window.open` for both the standalone page and the entity audit tab, replacing all `router.push` calls for row navigation.
- **Entity audit tab gets action column** — The grid rendered inside `EntityAudit` will gain the same action column as the main list: "open in new tab" (entity-scoped URL) and "rollback" (read-only admins excluded).
- **Revert PR #3306** — Remove the `audit-tab-return` session-storage mechanism: delete `audit-tab-return.ts` and its spec, remove `initialAuditTab` prop from `EntityAudit` and all entity `View.tsx`/`TabsContent.tsx` files (10 entity pairs: Adapter, ApplicationRunners, Applications, InterceptorTemplates, Interceptors, Keys, Models, Roles, Routes, Toolsets).

## Capabilities

### New Capabilities

- `audit-row-open-in-new-tab`: Row click in the audit activities grid (both standalone and entity tab) always opens the activity detail in a new browser tab.
- `entity-audit-action-column`: The entity audit tab grid includes an action column with "open in new tab" and "rollback" operations, consistent with the standalone list.

### Modified Capabilities

- `audit-tab-return-state`: The #3306 tab-return mechanism is fully removed. This capability is deleted, not modified.

## Impact

- **`ActivityAudit/List/List.tsx`** — core change: `onCellClicked` rewrite, new `openInNewTabForEntity` callback, updated `columnDefs` for entity case, remove `usePathname` + `saveAuditTabReturn`.
- **`EntityTabs/Audit/EntityAudit.tsx`** — remove `initialAuditTab` prop (keep `viewMode`).
- **10× entity `View.tsx` files** — revert `readAndClearAuditTabReturn`, `savedTabs`, `usePathname` additions.
- **10× entity `TabsContent.tsx` files** — remove `initialAuditTab` prop threading.
- **`utils/audit-tab-return.ts` + spec** — deleted.
- No API changes. No new dependencies.

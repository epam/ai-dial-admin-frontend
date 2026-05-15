## Context

`ActivityAuditList` (`components/ActivityAudit/List/List.tsx`) serves dual roles:
1. **Standalone page** — rendered at `/activity-audit`, no `entity` prop.
2. **Entity audit tab** — rendered inside `EntityAudit` with an `entity` + `entityType` prop.

`onCellClicked` currently uses `router.push` for both cases, navigating the user away from the current page. For the entity tab, PR #3306 added a session-storage mechanism (`audit-tab-return.ts`) to restore the correct tab after the user navigated back via breadcrumbs. With row clicks always opening a new tab, the user never leaves the entity page, making this workaround redundant.

The entity tab grid currently omits the action column (it returns bare `ACTIVITY_AUDIT_COLUMNS` without the `ACTION_COLUMN` wrapper), while the standalone grid includes "open in new tab" and "rollback" actions.

The entity-scoped detail URL differs from the standalone URL:
- Standalone: `/activity-audit/{activityId}`
- Entity tab: `/{entityRoute}/{entityName}/{activityId}` (via `getAuditActivityHref`)

## Goals / Non-Goals

**Goals:**
- Row click in `ActivityAuditList` always opens the detail view in a new browser tab.
- Entity audit tab grid has an action column matching the standalone list: "open in new tab" + "rollback" (hidden for read-only admins).
- All code introduced by PR #3306 is removed (`audit-tab-return.ts`, `initialAuditTab` prop, `readAndClearAuditTabReturn` in 10 View.tsx files).

**Non-Goals:**
- Changing the deployments view row-click behavior beyond what's needed to use `window.open`.
- Adding actions to the entity tab beyond "open in new tab" and "rollback".
- Changing rollback confirmation modal behavior.

## Decisions

### Decision 1: Separate `openInNewTabForEntity` callback

The entity tab uses a different URL pattern than the standalone list (`getAuditActivityHref` vs `onOpenInNewTab`). Rather than overloading the existing `openInNewTab` callback with entity awareness, a dedicated `openInNewTabForEntity` callback is introduced. It calls `window.open(getAuditActivityHref(entity, entityType, activity?.activityId), '_blank')` directly and is only defined when `entity` is present.

**Alternative considered**: Pass entity context into the existing `openInNewTab` callback. Rejected — it would conflate two different URL-building paths and make the callback harder to reason about.

### Decision 2: Reuse `getActivityAuditColumns` for entity tab

The entity tab `columnDefs` branch will switch from returning bare `ACTIVITY_AUDIT_COLUMNS` to calling `getActivityAuditColumns(t, openInNewTabForEntity, onOpenConfirmationModal, void 0, true)`. This reuses the existing column-building utility and ensures the entity tab's action column stays in sync with the standalone list automatically.

**Alternative considered**: A new `getEntityAuditColumns` utility. Rejected — duplication with no benefit; `getActivityAuditColumns` already accepts `isSingleEntity` to suppress hierarchy-related columns.

### Decision 3: `onCellClicked` uses `window.open` for entity tab, existing `openInNewTab` for standalone

For entity tab row clicks, `window.open(href, '_blank')` is called directly (no intermediate callback needed — the action column button already covers that). For standalone row clicks, the existing `openInNewTab(e.data)` callback is reused (it already calls `onOpenInNewTab` → `window.open`).

The `saveAuditTabReturn` call and `usePathname` import are dropped in this same change.

### Decision 4: Full delete of `audit-tab-return.ts`

The module becomes entirely unused after this change. Deleting it (and its spec) is cleaner than leaving dead code. No other consumers exist.

## Risks / Trade-offs

- **Popup blockers** — `window.open` called from a click handler is generally allowed by browsers as a user-initiated action, but some aggressive blockers may still intercept it. This is the same risk already present for the standalone list's "open in new tab" button, which users haven't flagged. Acceptable.
- **Middle-click / keyboard shortcuts** — Row click now always triggers `window.open`. Users who rely on middle-click or Ctrl+click to manually open in a new tab will still get the same result (a second tab). No regression.
- **Revert scope** — 20 files touched for the #3306 revert (10 View.tsx + 10 TabsContent.tsx). The changes are mechanical (remove 2–3 lines per file), but the breadth increases review surface. Mitigated by clear task breakdown.
- **`getAuditActivityHref` returning empty string** — If `entityType` is not covered by `auditResourceRoute`, the function returns `''`. The `openInNewTabForEntity` callback guards against this with an `if (href)` check, so clicking "open in new tab" silently does nothing for those rows. This matches existing behavior (the button's `disabled` predicate already hides it for parent rows with children; no-op for unsupported types is acceptable).

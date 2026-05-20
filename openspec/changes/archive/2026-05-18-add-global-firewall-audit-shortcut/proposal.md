## Why

The Global Firewall popup (`GlobalWhitelist` modal, opened from the Images list header) shows the domain whitelist but offers no way to inspect *who changed what, when*. Today the user has to navigate to `/activity-audit`, switch to the Deployments view, and manually filter by Resource type — and that manual filter is currently broken (typing "Global" matches zero rows because the column displays a localized label while the server filters by the raw enum value `ImageBuildDomainWhitelist`). This change adds a one-click "View in Activity Audit" shortcut from the popup footer that lands the user on the audit page already scoped to Global Firewall activities, and fixes the underlying filter behavior so the same lookup also works when typed manually.

## What Changes

- **Add "View in Activity Audit" link to the Global Firewall popup footer.** Replace `DialConfirmationPopup`'s default footer with a custom `footer` slot that places a `DialGhostButton` link on the left and re-renders the existing Cancel / Apply buttons on the right (the kit's default buttons disappear when a custom `footer` is provided).
- **Add a sessionStorage handoff for "open audit list pre-scoped".** New helper module `src/utils/audit-list-preselect.ts` exporting `saveAuditListPreselect(value)` and `readAndClearAuditListPreselect()` — single key `audit-list-preselect`, one-shot read-and-clear, mirrors the existing `audit-tab-return.ts` pattern. Contract is a single literal string `'global-firewall'` (no schema beyond that) to keep the audit list dumb.
- **Wire `ActivityAuditList` to consume the preselect on mount.** When `readAndClearAuditListPreselect()` returns `'global-firewall'`, the initial view SHALL be `Deployments`, and once `gridApi` is ready the component SHALL call `setFilterModel({ resourceType: { type: 'equals', filter: 'ImageBuildDomainWhitelist' } })` — server-side `getRows` re-fires automatically and AG Grid persists the filter in its existing localStorage bucket.
- **Fix the Resource type column filter to match formatted labels.** Build a reverse map from `getFormattedResourceType` over all `ActivityAuditResourceType` values. In the request-filter transform (`getGridFilters` / `getRequestFilters` in `src/components/ActivityAudit/List/utils.tsx`), intercept the `resourceType` column's freetext filter and expand it into an `in` filter listing every raw enum value whose formatted label matches the user's input. The column's `filterValueGetter` becomes consistent with what the server actually does. Display untouched.
- **Add new i18n key** `DeploymentsI18nKey.ViewInActivityAudit` for the link label.

## Capabilities

### New Capabilities
- `global-firewall-audit-shortcut`: One-click navigation from the Global Firewall popup to Activity Audit with the Deployments view selected and the Resource type filter pre-applied to `ImageBuildDomainWhitelist`; plus the server-side request transform that makes the Resource type freetext filter match the column's formatted label so the same lookup works for users typing manually.

### Modified Capabilities
<!-- None. The existing `activity-audit-deployments-view` capability defines the formatted-label *display* for `Resource type`; this change adds *filter behavior* aligned with that display, but the existing display contract is untouched. The new capability owns the filter behavior end-to-end. -->

## Impact

- **Affected files:**
  - `apps/ai-dial-admin/src/components/Deployments/Modals/GlobalWhitelist.tsx` — add `footer` prop content
  - `apps/ai-dial-admin/src/utils/audit-list-preselect.ts` *(new)*
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/List.tsx` — read preselect on mount, set view + filter
  - `apps/ai-dial-admin/src/components/ActivityAudit/List/utils.tsx` — extend `getGridFilters` (or add a focused helper) to expand `resourceType` filter via reverse label map
  - `apps/ai-dial-admin/src/constants/i18n.ts` + `apps/ai-dial-admin/src/locales/en.ts` — new `DeploymentsI18nKey.ViewInActivityAudit` entry
  - `apps/ai-dial-admin/src/components/ActivityAudit/EntityGrid/utils.ts` (or wherever `getFormattedResourceType` lives) — expose iteration over all `ActivityAuditResourceType` values, or build the reverse map adjacent to it
- **No backend changes.** Existing `POST /api/v1/activities` already accepts `eq` and `in` filters on `resourceType`.
- **No new dependencies.** Uses existing AG Grid `setFilterModel` API and standard sessionStorage.
- **No data migration.** sessionStorage key is ephemeral and read-once.
- **Cross-feature risk:** the Resource type filter transform also affects the Config view (same column, same backend contract). Manual filtering on the Config view will become more lenient (matches localized labels) — this is a strict improvement and the only observable diff is that previously-empty filter results may now return rows. No regression vector — existing exact-enum-string matches still match because the transform falls through to the original payload when no labels match.
- **No breaking changes** to existing APIs or stored grid state. Existing localStorage filter snapshots remain valid; the transform sits inside the request serializer.

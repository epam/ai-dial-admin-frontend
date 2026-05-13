## Why

When a user navigates from an entity's Audit → Activities sub-tab into an activity detail page and then clicks the entity breadcrumb to return, the entity page resets to the default Properties tab — discarding the user's navigation context. This forces an extra two clicks (Audit tab → Activities sub-tab) every time to get back to where they were.

## What Changes

- When navigating from the Activities list into an activity detail page, save the active main tab (`Audit`) and active audit sub-tab (`Activities`) to `sessionStorage`, keyed by entity path.
- When the entity view mounts, read from `sessionStorage` for that entity path and restore the saved tabs if present, then clear the stored value.
- No URL changes, no new routes, no changes to breadcrumb link generation.

## Capabilities

### New Capabilities

- `audit-tab-return-state`: Preserve and restore entity tab + audit sub-tab state when returning from a 3rd-level activity detail page to a 2nd-level entity detail page via breadcrumb navigation.

### Modified Capabilities

<!-- No existing spec-level behavior changes -->

## Impact

- `src/components/ActivityAudit/List/List.tsx` — write to sessionStorage before `router.push()` to activity detail.
- Entity View components (`Adapter/View/View.tsx`, `Models/View/View.tsx`, `Applications/View/View.tsx`, and peers) — read from sessionStorage on mount and initialize to saved tabs.
- `src/components/EntityTabs/Audit/EntityAudit.tsx` — read from sessionStorage on mount for the audit sub-tab.
- Scope is intentionally narrow: only the Audit → Activities → activity detail → back path. No other tabs or navigation paths are affected.

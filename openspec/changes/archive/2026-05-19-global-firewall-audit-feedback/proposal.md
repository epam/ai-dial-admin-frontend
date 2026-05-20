## Why

Two follow-up issues surfaced after the Global Firewall audit shortcut shipped (`global-firewall-audit-shortcut`):

1. On an audit-detail page for a global-firewall activity, the header still renders the "Resource identifier" external-link icon that exists for container activities. Global-firewall (`IMAGE_BUILD_DOMAIN_WHITELIST`) has no entry in the `auditResourceRoute` map, so clicking the icon goes nowhere — a dead control.
2. The localStorage-backed preselect handoff between the Global Firewall modal and the new audit tab races in production: occasionally the `localStorage.setItem` write has not committed across the renderer-process boundary by the time the new tab reads it, so the filter is never applied. The same `storage`-event broadcast that makes localStorage cross-tab also makes any listener-based fix leak the preselect into unrelated audit tabs.

## What Changes

- Add `IMAGE_BUILD_DOMAIN_WHITELIST` to the existing exclusion chain in `ActivityAudit/View/Header/Header.tsx`, so the "open in new tab" icon is suppressed for global-firewall activities (matching how `SYSTEM_PROPERTIES` and `ADMIN_PROPERTIES` are already suppressed).
- Switch the audit-list preselect handoff from `localStorage` to `sessionStorage` in `utils/audit-list-preselect.ts` (three calls: `setItem`, `getItem`, `removeItem`). `sessionStorage` is per–browsing-context and is atomically cloned into a `window.open`-created child tab at spawn time, so the cross-process commit race that affects `localStorage` does not apply, and there is no broadcast to other tabs that could consume the value sideways.
- Add a single-line comment on the `window.open(ApplicationRoute.ActivityAudit, '_blank')` call in `Deployments/Modals/GlobalWhitelist.tsx` noting that adding `noopener` would sever sessionStorage inheritance and silently break the preselect handoff.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `activity-audit-deployments-detail`: the "Resource identifier chip navigates to the container's edit page" requirement is narrowed — the chip icon is also suppressed for `IMAGE_BUILD_DOMAIN_WHITELIST` activities, alongside the existing `SYSTEM_PROPERTIES` / `ADMIN_PROPERTIES` cases.
- `global-firewall-audit-shortcut`: the preselect handoff storage is changed from `localStorage` to `sessionStorage`. The semantics of "write before open, read on mount, clear after applying" are unchanged, but the cross-tab visibility contract is removed (sessionStorage is per-tab; the new tab inherits a copy from the opener at spawn).

## Non-goals

- No change to the modal's footer link, its label, or its visibility rules.
- No change to the audit list's view-selection or filter-application logic, including the StrictMode-safe "read on mount, clear after apply" split.
- No change to the Resource type filter transform (single-match `eq` rewrite).
- No backend changes; no API changes; no new dependencies.
- Does not address the `IMAGE_BUILD_DOMAIN_WHITELIST`-shaped resource ID being shown at all in the header — only the dead navigation icon is removed. If product wants to also hide the ID text, that's a separate change.

## Impact

- Code:
  - `apps/ai-dial-admin/src/components/ActivityAudit/View/Header/Header.tsx` — one added clause in the existing exclusion chain.
  - `apps/ai-dial-admin/src/utils/audit-list-preselect.ts` — three identifier swaps (`localStorage` → `sessionStorage`).
  - `apps/ai-dial-admin/src/components/Deployments/Modals/GlobalWhitelist.tsx` — short comment on the `window.open` call.
- Tests:
  - Update unit tests for `audit-list-preselect.ts` if they assert against `localStorage` directly.
  - Update any component tests for `ActivityAuditList` / `GlobalWhitelist` that mock or assert on `localStorage` for the preselect key.
- No API / data-model / dependency impact.
- Operational: existing values in users' `localStorage['audit-list-preselect']` (if any leftover from before this change) will be ignored harmlessly after deployment; the new flow neither reads nor writes the old key.

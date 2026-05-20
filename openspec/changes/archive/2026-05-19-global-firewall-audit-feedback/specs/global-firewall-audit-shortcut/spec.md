## MODIFIED Requirements

### Requirement: Clicking the link writes a preselect flag and opens the audit list in a new tab

When the "View in Activity Audit" link is clicked, the popup SHALL write the `AuditListPreselect.GlobalFirewall` enum value to `sessionStorage` under the key `audit-list-preselect` and SHALL open the `/activity-audit` route in a **new browser tab** via `window.open(ApplicationRoute.ActivityAudit, '_blank')`. The popup in the originating tab SHALL remain open — the link does not interrupt the user's current popup workflow. `sessionStorage` is per–browsing-context and is **not** shared across unrelated tabs; the new tab inherits a copy of the originating tab's session storage as part of the `window.open` spawn (per HTML5 session-storage cloning), so the new tab's `ActivityAuditList` reads the key on mount and clears it from the new tab's own session storage after applying the filter. The originating tab keeps its own copy in its own session storage, but never reads it again and it is discarded automatically when that tab closes; no manual cleanup is required.

The `window.open` call MUST NOT be passed `'noopener'` (and any future refactor to a link element MUST NOT carry `rel="noopener"`), because the new tab's session-storage inheritance depends on the opener relationship being intact. A code comment at the call site SHALL note this constraint to prevent silent breakage in future refactors.

#### Scenario: Link writes preselect flag before opening the new tab
- **WHEN** the user clicks "View in Activity Audit"
- **THEN** at the moment `window.open` is called, `sessionStorage.getItem('audit-list-preselect')` in the originating tab SHALL be `'global-firewall'`
- **AND** `window.open` SHALL be called with `ApplicationRoute.ActivityAudit` and target `'_blank'`
- **AND** `window.open` SHALL NOT be passed `'noopener'`

#### Scenario: Originating popup stays open
- **WHEN** the user clicks "View in Activity Audit"
- **THEN** the popup in the originating tab SHALL remain open
- **AND** `onClose` SHALL NOT be invoked

#### Scenario: New tab inherits the preselect and clears its own copy after applying
- **GIVEN** the user has clicked the link and the new tab has applied the filter
- **THEN** the new tab observes `sessionStorage.getItem('audit-list-preselect')` returning `null`
- **AND** the originating tab still observes its own `sessionStorage.getItem('audit-list-preselect')` returning `'global-firewall'` until that tab is closed (session-storage scopes are independent after the spawn-time clone)

#### Scenario: Unrelated already-open audit tab is not affected
- **GIVEN** the user already had `/activity-audit` open in a separate, unrelated tab (Tab C) opened before clicking the link
- **WHEN** the user clicks "View in Activity Audit" in the modal
- **THEN** Tab C's audit list SHALL NOT receive the preselect, SHALL NOT apply the Global Firewall filter, and SHALL NOT observe any storage change for the preselect key (Tab C has its own session-storage scope)

### Requirement: Audit list reads the preselect on mount and clears it only after the filter is applied

The `ActivityAuditList` component SHALL read the `audit-list-preselect` `sessionStorage` key during component mount (in a `useState` lazy initializer) **without clearing it**, and SHALL clear the key from `sessionStorage` inside the gridApi-ready effect, **after** `setFilterModel` has been called. This split is required for StrictMode safety: React's dev-mode mock-mount/unmount/remount cycle calls the lazy initializer twice on first arrival, and clearing on read would empty session storage during the discarded first mount — leaving the real (second) mount with nothing to consume. By deferring the clear until after the filter has been applied to a real `gridApi`, both mounts read the same value, the discarded first mount never reaches the apply step (gridApi never attaches before unmount), and the real second mount applies and then clears.

#### Scenario: Fresh navigation with preselect set
- **GIVEN** `sessionStorage['audit-list-preselect']` is `'global-firewall'` at first paint of the new tab (inherited from the opener at spawn)
- **WHEN** the user lands on `/activity-audit`
- **THEN** `ActivityAuditList` SHALL read the value during mount via the lazy initializer (without clearing)
- **AND** the value SHALL remain in `sessionStorage` until the gridApi-ready effect applies the filter
- **AND** once the filter has been applied, the value SHALL be removed from `sessionStorage`

#### Scenario: No preselect on fresh navigation
- **GIVEN** `sessionStorage['audit-list-preselect']` is absent
- **WHEN** the user navigates to `/activity-audit`
- **THEN** `ActivityAuditList` SHALL behave exactly as it does today (Config view default, no preset filter)

#### Scenario: Preselect is one-shot per apply
- **GIVEN** the user has just landed on `/activity-audit` via the Global Firewall popup link, and the filter has been applied
- **WHEN** the user refreshes the page
- **THEN** the audit list SHALL NOT re-apply the preselect (the key was cleared after the apply)
- **AND** the grid's own localStorage-persisted filter state SHALL drive the view (standard AG Grid behavior)

#### Scenario: Unrecognized stored value is ignored and not cleared
- **GIVEN** `sessionStorage['audit-list-preselect']` contains a value that is not in the supported set (e.g. an old version or a manual edit)
- **WHEN** the user navigates to `/activity-audit`
- **THEN** the audit list SHALL behave as if no preselect were set (Config view, no preset filter)
- **AND** the unrecognized value SHALL remain in `sessionStorage` (the consumer does not clear values it does not understand)

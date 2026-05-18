## ADDED Requirements

### Requirement: Global Firewall popup exposes "View in Activity Audit" link in its footer

The `GlobalWhitelist` modal SHALL render a custom footer containing a "View in Activity Audit" `DialGhostButton` link on the left and the existing Cancel and Apply (or Close, when read-only) buttons on the right. The link SHALL be visible whenever the popup is open, regardless of the popup's loading state, read-only state, or validation state of the domain list. The link label SHALL be resolved via a new i18n key `DeploymentsI18nKey.ViewInActivityAudit`.

#### Scenario: Link renders in footer when popup is open
- **WHEN** the user opens the Global Firewall popup from the Images list header
- **THEN** the popup footer SHALL display a "View in Activity Audit" link on the left
- **AND** the existing Cancel and Apply buttons SHALL render on the right (unchanged labels, unchanged enable/disable semantics)

#### Scenario: Link remains visible in read-only mode
- **WHEN** the popup is opened with `disabled` prop true
- **THEN** the "View in Activity Audit" link SHALL still render and be clickable
- **AND** the right-hand button SHALL show "Close" instead of "Apply" (existing behavior)

#### Scenario: Link is independent of domain-list validation
- **WHEN** the domain list contains a validation error that disables the Apply button
- **THEN** the "View in Activity Audit" link SHALL remain enabled and clickable

### Requirement: Clicking the link writes a preselect flag and opens the audit list in a new tab

When the "View in Activity Audit" link is clicked, the popup SHALL write the `AuditListPreselect.GlobalFirewall` enum value to `localStorage` under the key `audit-list-preselect` and SHALL open the `/activity-audit` route in a **new browser tab** via `window.open(ApplicationRoute.ActivityAudit, '_blank')`. The popup in the originating tab SHALL remain open — the link does not interrupt the user's current popup workflow. `localStorage` is shared across all tabs of the same origin, so the new tab's `ActivityAuditList` reads the key on mount and clears it after applying the filter; the originating tab observes the cleared state automatically and requires no manual cleanup.

#### Scenario: Link writes preselect flag before opening the new tab
- **WHEN** the user clicks "View in Activity Audit"
- **THEN** at the moment `window.open` is called, `localStorage.getItem('audit-list-preselect')` SHALL be `'global-firewall'`
- **AND** `window.open` SHALL be called with `ApplicationRoute.ActivityAudit` and target `'_blank'`

#### Scenario: Originating popup stays open
- **WHEN** the user clicks "View in Activity Audit"
- **THEN** the popup in the originating tab SHALL remain open
- **AND** `onClose` SHALL NOT be invoked

#### Scenario: New tab clears the preselect on mount, originating tab observes the cleared state
- **GIVEN** the user has clicked the link and the new tab has applied the filter
- **THEN** both the new tab and the originating tab observe `localStorage.getItem('audit-list-preselect')` returning `null`

### Requirement: Audit list reads the preselect on mount and clears it only after the filter is applied

The `ActivityAuditList` component SHALL read the `audit-list-preselect` localStorage key during component mount (in a `useState` lazy initializer) **without clearing it**, and SHALL clear the key from localStorage inside the gridApi-ready effect, **after** `setFilterModel` has been called. This split is required for StrictMode safety: React's dev-mode mock-mount/unmount/remount cycle calls the lazy initializer twice on first arrival, and clearing on read would empty localStorage during the discarded first mount — leaving the real (second) mount with nothing to consume. By deferring the clear until after the filter has been applied to a real `gridApi`, both mounts read the same value, the discarded first mount never reaches the apply step (gridApi never attaches before unmount), and the real second mount applies and then clears.

#### Scenario: Fresh navigation with preselect set
- **GIVEN** `localStorage['audit-list-preselect']` is `'global-firewall'`
- **WHEN** the user navigates to `/activity-audit`
- **THEN** `ActivityAuditList` SHALL read the value during mount via the lazy initializer (without clearing)
- **AND** the value SHALL remain in `localStorage` until the gridApi-ready effect applies the filter
- **AND** once the filter has been applied, the value SHALL be removed from `localStorage`

#### Scenario: No preselect on fresh navigation
- **GIVEN** `localStorage['audit-list-preselect']` is absent
- **WHEN** the user navigates to `/activity-audit`
- **THEN** `ActivityAuditList` SHALL behave exactly as it does today (Config view default, no preset filter)

#### Scenario: Preselect is one-shot per apply
- **GIVEN** the user has just landed on `/activity-audit` via the Global Firewall popup link, and the filter has been applied
- **WHEN** the user refreshes the page
- **THEN** the audit list SHALL NOT re-apply the preselect (the key was cleared after the apply)
- **AND** the grid's own localStorage-persisted filter state SHALL drive the view (standard AG Grid behavior)

#### Scenario: Unrecognized stored value is ignored and not cleared
- **GIVEN** `localStorage['audit-list-preselect']` contains a value that is not in the supported set (e.g. an old version or a manual edit)
- **WHEN** the user navigates to `/activity-audit`
- **THEN** the audit list SHALL behave as if no preselect were set (Config view, no preset filter)
- **AND** the unrecognized value SHALL remain in `localStorage` (the consumer does not clear values it does not understand)

### Requirement: Preselect selects the Deployments view and applies a Global Firewall Resource type filter

When the audit list reads a `'global-firewall'` preselect, the initial view SHALL be `ActivityAuditView.Deployments` (overriding the default of `ActivityAuditView.Config`), and once the AG Grid `gridApi` is available the component SHALL call `gridApi.setFilterModel(...)` with a `resourceType` text filter whose `type` is `'contains'` and whose `filter` value is the localized formatted label produced by `getFormattedResourceType(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, t)`. The `setFilterModel` call SHALL fire exactly once per consumed preselect, even across re-renders.

#### Scenario: Initial view is Deployments
- **GIVEN** the preselect was `'global-firewall'`
- **WHEN** `ActivityAuditList` first renders
- **THEN** the View dropdown SHALL show `Deployments` as the selected option
- **AND** the grid SHALL use the deployment-manager backend datasource (`getDeploymentActivities`)

#### Scenario: Filter chip applied after grid ready
- **GIVEN** the preselect was `'global-firewall'`
- **WHEN** `gridApi` becomes available
- **THEN** the Resource type column SHALL display a filter chip whose text reads the localized "Global firewall" label
- **AND** the grid SHALL fetch only activities matching the Global Firewall resource type

#### Scenario: Preselect does not re-apply on subsequent view changes
- **GIVEN** the preselect was consumed, the filter was applied, and the user switched the View dropdown to `Config`
- **WHEN** the user switches back to `Deployments`
- **THEN** the filter SHALL NOT be re-applied automatically
- **AND** the column's filter state SHALL reflect whatever the user (or grid persistence) has set

### Requirement: Resource type column filter matches the formatted label when a single enum matches

The Activity Audit list SHALL transform the user's `contains` freetext input on the Resource type column into a server-side `eq` filter whenever the input matches the localized formatted label (produced by `getFormattedResourceType(value, t)`) of exactly one `ActivityAuditResourceType` enum value as a case-insensitive substring. The transform SHALL apply identically in both the Config view and the Deployments view, since both share the same column definition. When zero enum labels match, or when more than one enum's label matches the input, the original `contains` filter SHALL pass through unchanged. Operators other than `contains` SHALL pass through unchanged so that exact raw-enum matches continue to work.

**Known limitation (multi-match):** When the user's input matches multiple enum labels (e.g. "container" → 4 container-type enums), the original `contains` filter passes through to the backend. The backend `co` operator runs `LIKE '%value%'` against the raw enum string (stored as `@Enumerated(EnumType.STRING)`); since the raw enums share no substring with the localized labels, the user sees zero rows. This is the same broken UX as the original bug for multi-match inputs. Fixing it requires backend support for an `in` operator (or `or` semantics for repeated same-column filters) in `FilterOperatorDto` + `PageEntityMapper`, which is out of scope for this change.

#### Scenario: Typing a substring matching exactly one label sends an eq filter
- **GIVEN** the user is on the Deployments view of the audit list
- **WHEN** the user types `"GLO"` into the Resource type column's filter input
- **THEN** the request SHALL include `{ column: 'resourceType', operator: 'eq', value: 'ImageBuildDomainWhitelist' }` (the only enum whose formatted label "Global firewall" contains "GLO")
- **AND** Global Firewall activities SHALL appear in the grid (assuming the backend has any in the active time range)

#### Scenario: Case-insensitive single-match
- **WHEN** the user types `"global"` (lowercase) or `"GLOBAL"` (uppercase)
- **THEN** the request SHALL include `{ column: 'resourceType', operator: 'eq', value: 'ImageBuildDomainWhitelist' }` (identical to the mixed-case "Global" case)

#### Scenario: Multi-match input passes through original payload (known limitation — returns 0 rows on backend)
- **WHEN** the user types `"container"` into the Resource type filter (matching four enum labels: "Adapter container", "Application container", "Interceptor container", "MCP container")
- **THEN** the request SHALL retain the original `{ column: 'resourceType', operator: 'co', value: 'container' }` payload (frontend passthrough)
- **AND** the backend SHALL run `LOWER(resource_type) LIKE '%container%'` against the raw enum string and return **zero rows** because no raw enum (`AdapterDeployment`, `ApplicationDeployment`, etc.) contains the substring "container"
- **NOTE** This is a documented limitation; a future change adding an `in` operator to the backend `FilterOperatorDto` will replace this passthrough with a multi-enum match.

#### Scenario: Equals operator passes through unchanged
- **WHEN** the user uses the column's `equals` operator with input `"ImageBuildDomainWhitelist"` (the raw enum value)
- **THEN** the request SHALL be `{ column: 'resourceType', operator: 'eq', value: 'ImageBuildDomainWhitelist' }`
- **AND** matching activities SHALL appear

#### Scenario: No matching labels falls through to original payload
- **WHEN** the user types `"zzz"` into the Resource type filter and no formatted label contains it
- **THEN** the request SHALL retain the original `{ column: 'resourceType', operator: 'co', value: 'zzz' }` payload
- **AND** the grid SHALL show zero rows (existing behavior)

#### Scenario: Filter transform applies in Config view too
- **GIVEN** the user is on the Config view of the audit list
- **WHEN** the user types a substring matching exactly one Config-view formatted label (e.g. `"Global"` matches the label of `GlobalSettings`)
- **THEN** the request SHALL include an `eq` filter against the corresponding raw enum value
- **AND** the grid SHALL fetch matching rows

#### Scenario: Non-resourceType filters are untouched
- **WHEN** the user filters by another column (e.g. `activityType`, `resourceId`)
- **THEN** the transform SHALL NOT affect that column's filter payload

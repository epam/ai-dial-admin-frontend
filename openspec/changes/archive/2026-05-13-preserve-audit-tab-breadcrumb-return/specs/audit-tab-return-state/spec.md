## ADDED Requirements

### Requirement: Save audit tab state before navigating to activity detail

When a user clicks an activity row in the Activities list within an entity's Audit tab, the system SHALL save the current entity path, main tab (Audit), and audit sub-tab (Activities) to sessionStorage before navigating to the activity detail page.

#### Scenario: Row click triggers sessionStorage write

- **WHEN** a user clicks an activity row in the `ActivityAuditList` component while viewing an entity detail page (i.e., `entity` prop is non-null)
- **THEN** the system SHALL write `{ mainTab: EntityViewTab.Audit, auditTab: EntityViewTab.Activities }` to sessionStorage under the key `audit-tab-return:<currentEntityPath>` before calling `router.push`

#### Scenario: No write for standalone activity audit page

- **WHEN** a user clicks an activity row in the `ActivityAuditList` component on the standalone activity audit page (i.e., `entity` prop is null)
- **THEN** the system SHALL NOT write anything to sessionStorage

---

### Requirement: Restore audit tab state on entity page mount

When an entity detail page mounts, the system SHALL check sessionStorage for a saved tab state keyed by the current pathname and, if found, restore the main tab and audit sub-tab accordingly.

#### Scenario: Returning from activity detail via breadcrumb restores Audit main tab

- **WHEN** a user navigates back to an entity detail page (e.g., `/en/adapters/my-adapter`) after having viewed an activity detail page
- **AND** a sessionStorage entry exists for key `audit-tab-return:/en/adapters/my-adapter`
- **THEN** the entity View SHALL initialize `activeTab` to `EntityViewTab.Audit` instead of `EntityViewTab.Properties`

#### Scenario: Returning from activity detail via breadcrumb restores Activities sub-tab

- **WHEN** the same sessionStorage entry is found on entity page mount
- **THEN** the `EntityAudit` component SHALL initialize its `activeTab` to `EntityViewTab.Activities` instead of the first tab in the list

#### Scenario: No stored state — default tab behavior is unchanged

- **WHEN** a user navigates to an entity detail page with no matching sessionStorage entry
- **THEN** the entity View SHALL initialize `activeTab` to `EntityViewTab.Properties` and `EntityAudit` SHALL initialize to its first available tab, preserving existing behavior

---

### Requirement: Clear sessionStorage entry on read

The system SHALL remove the sessionStorage entry immediately upon reading it on entity page mount, ensuring it is consumed exactly once.

#### Scenario: Entry is removed after restoration

- **WHEN** the entity View reads a stored tab state from sessionStorage on mount
- **THEN** the entry SHALL be deleted from sessionStorage before the first render completes
- **AND** a subsequent mount of the same entity page (e.g., via refresh or back-forward navigation) SHALL NOT restore the tab state again

---

### Requirement: Audit tab return utility is SSR-safe

The sessionStorage read/write utility SHALL guard against access in non-browser environments.

#### Scenario: Utility called during server-side rendering

- **WHEN** the utility is invoked in an environment where `window` is not defined
- **THEN** it SHALL return `null` (for reads) or silently no-op (for writes) without throwing

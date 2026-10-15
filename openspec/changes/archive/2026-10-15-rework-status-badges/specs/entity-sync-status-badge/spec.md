## Purpose

Defines the Core sync badge shown in an entity's header: the four sync states, how each looks, its diff
action, and where it sits relative to the validity badge. It is a standalone feature built on the generic
status badge and can be removed without affecting any other status.

## ADDED Requirements

### Requirement: Sync badge states
The system SHALL show the entity's Core sync state as a status badge with these states, taken from the
entity's sync status:

| Sync status | Label | Tone | Leading | Trailing |
|---|---|---|---|---|
| in progress | Sync in progress | `info` | spinner | diff button |
| fully synced | Synced | `success` | none | none |
| unknown | Sync Unavailable | `neutral` | none | info glyph |
| in progress too long | Out of sync | `error` | none | diff button |

The label SHALL NOT be rendered in upper case. A missing or unrecognised sync status SHALL render no
badge. The info glyph for Sync Unavailable SHALL be a 14px, non-interactive, decorative icon: it SHALL be
hidden from assistive technology and SHALL NOT have a tooltip.

#### Scenario: Sync in progress
- **WHEN** the sync status is in progress
- **THEN** an info-toned badge "Sync in progress" with a spinner is shown, followed by a diff button

#### Scenario: Synced
- **WHEN** the sync status is fully synced
- **THEN** a success-toned badge "Synced" is shown with no leading indicator and no trailing element

#### Scenario: Sync unavailable
- **WHEN** the sync status is unknown
- **THEN** a neutral-toned badge "Sync Unavailable" is shown followed by a 14px info glyph
- **THEN** hovering or focusing the glyph shows nothing

#### Scenario: Out of sync
- **WHEN** the sync status is in progress too long
- **THEN** an error-toned badge "Out of sync" is shown, followed by a diff button

#### Scenario: No status yet
- **WHEN** the sync status has not been fetched, or is missing
- **THEN** no badge is rendered

### Requirement: Sync diff button
The diff button SHALL be shown for the in-progress and out-of-sync states only. It SHALL be a button with
an accessible name, and activating it SHALL open the Core sync diff modal for that entity. The modal SHALL
show the entity's sync state with the same badge and states as the header, without a diff button.

#### Scenario: Open the diff modal
- **WHEN** the user activates the diff button on an out-of-sync entity
- **THEN** the diff modal opens

#### Scenario: Button is named
- **WHEN** a screen reader reaches the diff button
- **THEN** it announces a name, not an unlabelled button

#### Scenario: Modal badge has no button
- **WHEN** the diff modal shows the entity's sync state
- **THEN** it renders the same badge for that state and no diff button inside the modal

#### Scenario: Synced and unavailable have no diff
- **WHEN** the sync status is fully synced or unknown
- **THEN** no diff button is shown

### Requirement: Sync badge sits beside the validity badge
The sync badge SHALL render in the header status row, in the same row as the validity badge and after it,
with the spacing defined by the header status row. It SHALL NOT render on its own row. Where the sync
badge applies but no validity badge does, it SHALL render alone in the row.

#### Scenario: Beside validity
- **WHEN** an entity has both a validity badge and a sync status
- **THEN** the sync badge is in the same row, to the right of the validity badge

#### Scenario: Without validity
- **WHEN** an entity has a sync status and no validity badge
- **THEN** the sync badge renders alone in the row above the id

### Requirement: Sync badge availability and refresh
The sync badge SHALL be shown only when the Admin API is enabled and the entity's view supports a sync
status lookup. It SHALL fetch the status when the header mounts, SHALL refetch every 60 seconds while the
status is not a settled one (fully synced, unknown, or in progress too long), and SHALL clear and refetch
after the entity is saved. While the status has not loaded, the badge's space SHALL be reserved so the
header does not shift when it appears.

#### Scenario: Admin API disabled
- **WHEN** the Admin API is disabled
- **THEN** no sync badge is rendered

#### Scenario: View without sync support
- **WHEN** an entity's view has no sync status lookup
- **THEN** no sync badge is rendered

#### Scenario: Polling while unsettled
- **WHEN** the status is in progress
- **THEN** it is refetched every 60 seconds until it becomes fully synced, unknown, or in progress too long

#### Scenario: Refresh after save
- **WHEN** the entity is saved
- **THEN** the shown status is cleared and fetched again

#### Scenario: No layout shift
- **WHEN** the sync status is still loading
- **THEN** the badge's slot is reserved and the header does not move when the badge appears

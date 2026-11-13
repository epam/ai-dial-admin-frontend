## ADDED Requirements

### Requirement: The Enrichment routes tab saves independently of Core global settings

The System Properties page SHALL offer an **Enrichment routes** tab after Sessions source when Analytics is
enabled. The tab SHALL read and save the application-route allowlist against the analytics service, as
specified by `analytics/app-routes`, and SHALL NOT read or write DIAL Core's global-settings object.

The tab's unsaved-changes state, Save and Discard SHALL be its own: saving the allowlist SHALL NOT send a
global-settings write or a Sessions source write, and saving any other tab SHALL NOT send an allowlist write.
A failure on one store SHALL NOT be reported as a failure of another.

The allowlist SHALL be read when the tab is first opened, not when the page loads. Where Analytics is
disabled, the tab SHALL NOT be offered and no allowlist request SHALL be made.

A tab holding an invalid row SHALL carry the page's accessible error status, as every other invalid tab does.

#### Scenario: Saving the allowlist touches no other store

- **WHEN** the operator changes the allowlist and saves
- **THEN** one write is sent to `v1/settings/app-routes`
- **AND** no write is sent to `v1/settings/platform/global` or to `v1/settings/sessions-source`

#### Scenario: Saving another tab does not write the allowlist

- **WHEN** the operator saves a change to the Sessions source
- **THEN** no write is sent to `v1/settings/app-routes`

#### Scenario: The allowlist is not read until its tab is opened

- **WHEN** the System Properties page is opened on its first tab
- **THEN** no request is made for the allowlist

#### Scenario: An invalid row marks the tab

- **WHEN** the allowlist holds an invalid row and another tab is active
- **THEN** the Enrichment routes tab has an accessible error status

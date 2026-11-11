## ADDED Requirements

### Requirement: The Sessions source tab saves independently of Core global settings

The System Properties page SHALL offer a **Sessions source** tab alongside Global Interceptors and Rate Limit
Schedule when Analytics is enabled. The tab SHALL read and save the Sessions source setting against the analytics
service, as specified by `analytics/sessions-source`, and SHALL NOT read or write DIAL Core's global-settings
object.

The tab's unsaved-changes state, Save and Discard SHALL be its own: saving the Sessions source SHALL NOT send a
global-settings write, and saving global interceptors or the rate-limit schedule SHALL NOT send a Sessions source
write. A failure on one store SHALL NOT be reported as a failure of the other.

Where Analytics is disabled, the tab SHALL NOT be offered and no request SHALL be made to the analytics service.

#### Scenario: Saving the Sessions source does not touch Core settings

- **WHEN** the operator changes the Sessions source and saves
- **THEN** one write is sent to the analytics service
- **AND** no write is sent to `v1/settings/platform/global`

#### Scenario: Saving interceptors does not touch the Sessions source

- **WHEN** the operator saves a change to global interceptors
- **THEN** no write is sent to the analytics service

#### Scenario: The tab is absent without Analytics

- **WHEN** Analytics is disabled and System Properties is opened
- **THEN** no Sessions source tab is offered

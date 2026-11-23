## MODIFIED Requirements

### Requirement: The global-settings singleton has one owner
The system SHALL expose reads and writes of DIAL Core's global-settings singleton (`v1/settings/platform/global`) — the unconditional read used by `getGlobalInterceptors`, and the etag-conditional read/write the System Properties page uses — from a single client (`SettingsApi`), which reaches Core through the SDK. No other client SHALL address this resource.

#### Scenario: System properties are read and written through SettingsApi
- **WHEN** the System Properties page reads or updates global settings
- **THEN** the request goes through `SettingsApi`, conditional on the given etag (`If-None-Match` for reads with a real etag and none for `DEFAULT_ETAG`, `If-Match` for writes)

#### Scenario: The unconditional read used for global interceptors is unaffected
- **WHEN** `getGlobalInterceptors` reads the global-settings blob
- **THEN** it uses `SettingsApi.globalSettings`, with no etag header, exactly as before this change

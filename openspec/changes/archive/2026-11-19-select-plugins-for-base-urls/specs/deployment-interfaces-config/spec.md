## MODIFIED Requirements

### Requirement: Passthrough mode shows the base_url input
When an interface row's `mode` is `passthrough`, the row SHALL show its base-URL control and hide any translator-selection control. On platform models, the control SHALL offer Url and Plugin choices; on other entity surfaces it SHALL remain the existing `base_url` text input. The interface's explicit base URL SHALL take precedence over the model's base URL, and an absent interface value SHALL retain the existing model-level fallback and requiredness behavior.

#### Scenario: Switching back to passthrough restores the base_url input
- **WHEN** an admin switches a `translator`-mode row back to `passthrough`
- **THEN** the row shows its base-URL control and no translator selector

#### Scenario: A platform model interface uses a plugin
- **WHEN** an admin selects `dial-plugin://example` on a platform model's passthrough interface and saves
- **THEN** the interface's existing `base_url` field carries `dial-plugin://example` and the interface mode remains `passthrough`

#### Scenario: An empty interface inherits the model plugin
- **WHEN** a platform model has `dial-plugin://example` as its base URL and its passthrough interface has no base URL
- **THEN** the interface remains valid and saves without its own base-URL field

#### Scenario: Other interface surfaces remain unchanged
- **WHEN** an admin edits a passthrough interface on an application or interceptor
- **THEN** the existing URL input is shown without a plugin selector

## ADDED Requirements

### Requirement: Plugin-served passthrough interfaces reject override paths
On a platform model, the system SHALL validate each passthrough interface's effective base URL: use its own URL when present, otherwise the model's URL. If the effective URL is a `dial-plugin://` URL and the interface has nonempty `overridePaths`, the system SHALL show an actionable localized error and prevent save until the conflict is resolved. It SHALL preserve the paths rather than clearing them automatically and SHALL recompute validity when the model URL, interface URL, interface mode, or paths change.

#### Scenario: An interface plugin conflicts with override paths
- **WHEN** an admin selects a plugin for a passthrough interface with existing override paths
- **THEN** the paths remain present, an error is shown and save is blocked

#### Scenario: An inherited plugin conflicts with override paths
- **WHEN** a passthrough interface with override paths has no own base URL and the admin changes the model base URL to a plugin
- **THEN** the interface shows an error and save is blocked without removing its paths

#### Scenario: An HTTP override avoids the inherited conflict
- **WHEN** the model base URL names a plugin but a passthrough interface has its own HTTP base URL and valid override paths
- **THEN** the plugin-specific override-path error is not shown for that interface

#### Scenario: Resolving the conflict clears the error
- **WHEN** the admin removes all conflicting override paths or changes the effective URL to HTTP
- **THEN** the plugin-specific error clears and that validation no longer blocks save

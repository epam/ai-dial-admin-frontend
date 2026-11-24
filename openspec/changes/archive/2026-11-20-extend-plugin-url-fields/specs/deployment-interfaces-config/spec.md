## MODIFIED Requirements

### Requirement: Passthrough mode shows the base_url input
When an interface row's `mode` is `passthrough`, the row SHALL show its base-URL control and hide any translator-selection control. On platform models and routers, the control SHALL offer Url and Plugin choices; on other entity surfaces it SHALL remain the existing `base_url` text input. The interface's explicit base URL SHALL take precedence over its entity's base URL, and an absent interface value SHALL retain the existing fallback and requiredness behavior.

#### Scenario: Switching back to passthrough restores the base_url input
- **WHEN** an admin switches a `translator`-mode row back to `passthrough`
- **THEN** the row shows its base-URL control and no translator selector

#### Scenario: A platform model or router interface uses a plugin
- **WHEN** an admin selects `dial-plugin://example` on a platform model or router passthrough interface and saves
- **THEN** the interface's existing `base_url` field carries that reference and the interface mode remains `passthrough`

#### Scenario: An empty interface inherits the entity plugin
- **WHEN** a platform model or router has `dial-plugin://example` as its base URL and its passthrough interface has no base URL
- **THEN** the interface remains valid and saves without its own base-URL field

#### Scenario: Other interface passthrough surfaces remain unchanged
- **WHEN** an admin edits a passthrough interface on an application or interceptor
- **THEN** the existing URL input is shown without a plugin selector

### Requirement: Custom translator reveals inline base_url and out controls
Selecting `Custom` in the translator selector SHALL reveal an additional line with a `base_url` control and an `out` select listing the available interface types excluding `Custom` and excluding the interface type the row itself is configured for — a translator cannot translate an interface into itself. On platform models and routers, the base-URL control SHALL offer the existing Url and Plugin choices with the caller's available plugin options. On other surfaces it SHALL retain the existing URL-only control. The translator's existing inline object and `out` value SHALL be retained; the system SHALL NOT introduce a new persisted mode. The existing field validation, read-only behavior, save/discard flow, and success/error notification behavior for the owning entity SHALL apply.

#### Scenario: Custom reveals base_url and out
- **WHEN** an admin selects `Custom` in the translator selector
- **THEN** a base-URL control and an `out` select appear on the next line, with no `in` control shown

#### Scenario: Custom translator is stored inline
- **WHEN** an admin fills in `base_url` and `out` for a `Custom` translator and saves
- **THEN** the interface's `translator` value is saved as an inline object containing `baseUrl` and `out`, not a name reference

#### Scenario: Plugin options reach model and router custom translators
- **WHEN** an admin opens a custom translator on a platform model or router
- **THEN** its Plugin selector offers the available plugin instances from the existing Core option sources

#### Scenario: Other custom translators remain URL-only
- **WHEN** an admin opens a custom translator on an application or interceptor
- **THEN** the existing URL input is shown without a plugin selector

#### Scenario: Selecting a plugin retains the inline translator
- **WHEN** an admin selects `dial-plugin://example` for a model or router custom translator and saves
- **THEN** the inline translator retains its chosen `out` and its base URL is saved as that reference through the owning entity's existing mapping

#### Scenario: out excludes Custom and the row's own interface type
- **WHEN** an admin opens the `out` select on an interface row of type `X`
- **THEN** the options list the remaining three interface types and include neither a `Custom` entry nor `X` itself

## ADDED Requirements

### Requirement: Plugin-served passthrough interfaces reject override paths
On a platform model or router, the system SHALL validate each passthrough interface's effective base URL: use its own URL when present, otherwise the entity's URL. If the effective URL is a `dial-plugin://` URL and the interface has nonempty `overridePaths`, the system SHALL show an actionable localized error and prevent save until the conflict is resolved. It SHALL preserve the paths rather than clearing them automatically and SHALL recompute validity when the entity URL, interface URL, interface mode, or paths change.

#### Scenario: An interface plugin conflicts with override paths
- **WHEN** an admin selects a plugin for a passthrough interface with existing override paths
- **THEN** the paths remain present, an error is shown and save is blocked

#### Scenario: An inherited plugin conflicts with override paths
- **WHEN** a passthrough interface with override paths has no own base URL and the admin changes its model or router base URL to a plugin
- **THEN** the interface shows an error and save is blocked without removing its paths

#### Scenario: An HTTP override avoids the inherited conflict
- **WHEN** the entity base URL names a plugin but a passthrough interface has its own HTTP base URL and valid override paths
- **THEN** the plugin-specific override-path error is not shown for that interface

#### Scenario: Resolving the conflict clears the error
- **WHEN** the admin removes all conflicting override paths or changes the effective URL to HTTP
- **THEN** the plugin-specific error clears and that validation no longer blocks save

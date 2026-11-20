## MODIFIED Requirements

### Requirement: Router interfaces
The system SHALL render the Interfaces section on the Properties tab with the four types `openaiChatCompletions`, `openaiResponses`, `anthropicMessages`, and `openaiEmbeddings`. The router's `baseUrl` SHALL make each interface's own `base_url` optional. Router passthrough interface base URLs SHALL offer the Url and Plugin choices and SHALL retain the explicit-interface-over-entity fallback and plugin override-path validation.

#### Scenario: Add offers four types
- **WHEN** a router has no interface and the user activates "+ Add"
- **THEN** the dropdown lists all four interface types

#### Scenario: Interface base URL falls back to the router base URL
- **WHEN** a router has a `baseUrl` and an interface row has no base URL
- **THEN** the row raises no required-field error

#### Scenario: Passthrough interface selects a plugin
- **WHEN** an admin selects a plugin for a router passthrough interface and saves
- **THEN** the router's interface carries the plugin reference in its existing base URL and remains in passthrough mode

## ADDED Requirements

### Requirement: Router base URL supports plugin selection
The router Properties `baseUrl` SHALL offer Url and Plugin choices using the existing plugin option sources and validation. It SHALL remain optional and use the existing Core router resource field and save/discard flow. Config-file and read-only routers SHALL remain non-mutating; existing success and error notifications SHALL remain unchanged, including Core validation messages and retained drafts on rejection.

#### Scenario: Router saves a plugin base URL
- **WHEN** an admin selects `dial-plugin://example` as a router's base URL and saves
- **THEN** the router resource's existing `baseUrl` contains that reference and reload displays it

#### Scenario: Read-only router displays its reference
- **WHEN** an admin opens a read-only or config-file router with a plugin base URL
- **THEN** the reference is visible and cannot be edited

#### Scenario: Router save is rejected
- **WHEN** Core rejects a router save after the base URL changes
- **THEN** the existing error notification shows Core's message and the user's draft remains available

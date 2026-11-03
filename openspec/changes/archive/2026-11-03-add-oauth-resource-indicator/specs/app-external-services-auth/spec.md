## ADDED Requirements

### Requirement: OAuth authorization redirect carries the resource indicator
The OAuth authorization URL SHALL include `resource` as a query parameter, alongside the existing ones, when the auth settings of the Assets toolset or application external service being signed in to carry a non-empty `resource`. When `resource` is absent or blank, the authorization URL SHALL be unchanged.

#### Scenario: Assets toolset sign-in with a resource
- **WHEN** the user signs in to an Assets toolset whose OAuth settings have `resource` set
- **THEN** the redirect to the authorization endpoint includes `resource=<value>`

#### Scenario: External service sign-in with a resource
- **WHEN** the user signs in to an application external service whose OAuth settings have `resource` set
- **THEN** the redirect to the authorization endpoint includes `resource=<value>`

#### Scenario: No resource configured
- **WHEN** the OAuth settings have no `resource` or a blank one
- **THEN** the authorization URL contains no `resource` parameter

#### Scenario: Legacy Toolsets unaffected
- **WHEN** the user signs in to a legacy (config) toolset
- **THEN** the authorization URL is unchanged

## MODIFIED Requirements

### Requirement: Viewing an application's Parameters tab resolves an Asset-origin runner's scheme through Core

The Parameters tab SHALL resolve the currently-selected App Runner's scheme through the shared origin-aware resolver whenever it loads or reloads the scheme. An Asset-origin runner (one created through `Assets > App Runners`) SHALL read its Core resource content by metadata storage path and resolve through Core's `getResolvedRunnerSchema` using the content's declared `$id`, regardless of `DIAL_ADMIN_API_URL`. A Config-origin runner, or a runner without an explicit origin, SHALL resolve through the Admin Backend's `getResolvedApplicationScheme` when `DIAL_ADMIN_API_URL` is configured and through Core's `getResolvedRunnerSchema` when that variable is absent or empty.

#### Scenario: Generated form renders for an Asset-origin runner's application

- **WHEN** a user opens the Parameters tab of an application whose selected App Runner was created through `Assets > App Runners` and declares a configuration schema
- **AND** selects the "Generated form" view
- **THEN** the configuration form renders using that runner's resolved schema, instead of showing "No Configuration Scheme"

#### Scenario: Asset-origin runner resolution ignores Admin Backend availability

- **WHEN** the Parameters tab loads an Asset-origin runner while `DIAL_ADMIN_API_URL` is configured or absent
- **THEN** it reads the runner content and resolves the schema through Core
- **AND** it does not require an Admin Backend request

#### Scenario: Config-origin runner uses the Admin Backend when available

- **WHEN** the Parameters tab loads an application whose selected App Runner comes from `Entities > Application Runners` while `DIAL_ADMIN_API_URL` is configured
- **THEN** the scheme is resolved through the Admin Backend's resolved-schema read

#### Scenario: Config-origin runner falls back to Core without the Admin Backend

- **WHEN** the Parameters tab loads an application whose selected Config-origin App Runner has a configuration schema while `DIAL_ADMIN_API_URL` is absent or empty
- **THEN** the scheme is resolved through Core's resolved-schema read
- **AND** the generated configuration form can use the returned schema

#### Scenario: Failed selected resolver retains the unresolved runner fallback

- **WHEN** the resolver selected by runner origin and `DIAL_ADMIN_API_URL` availability fails while the Parameters tab loads
- **THEN** the Parameters tab uses the unresolved runner as its schema fallback

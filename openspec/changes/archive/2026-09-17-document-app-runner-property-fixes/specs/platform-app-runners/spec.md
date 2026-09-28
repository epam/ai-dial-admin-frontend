## ADDED Requirements

### Requirement: Viewing an application's Parameters tab resolves an Asset-origin runner's scheme through Core
The Parameters tab SHALL resolve the currently-selected App Runner's scheme by the runner's origin,
matching the branching the App Runner picker already applies at selection time: an Asset-origin
runner (one created through `Assets > App Runners`) SHALL resolve via `getResolvedRunnerSchema`
(Core's resolved-schema read), while any other runner SHALL resolve via `getResolvedApplicationScheme`
(the admin-BE's resolved-schema read). This applies whenever the Parameters tab loads or reloads its
scheme for the application's currently-selected runner, not only at selection time.

#### Scenario: Generated form renders for an Asset-origin runner's application
- **WHEN** a user opens the Parameters tab of an application whose selected App Runner was created
  through `Assets > App Runners` and declares a configuration schema
- **AND** selects the "Generated form" view
- **THEN** the configuration form renders using that runner's resolved schema, instead of showing
  "No Configuration Scheme"

#### Scenario: Admin-BE-origin runners are unaffected
- **WHEN** a user opens the Parameters tab of an application whose selected App Runner comes from
  `Entities > Application Runners`
- **THEN** the scheme is resolved via the admin-BE's resolved-schema read, unchanged from current
  behavior


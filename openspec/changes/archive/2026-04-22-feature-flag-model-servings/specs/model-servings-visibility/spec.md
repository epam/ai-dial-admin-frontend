## ADDED Requirements

### Requirement: Feature flags expose NIM and HF Model Servings visibility

The system SHALL expose two environment variables, `NIM_ENABLED` and `HF_ENABLED`, whose values are surfaced at runtime on the `FeatureFlags` object as `nimEnabled: boolean` and `hfEnabled: boolean`. A flag MUST be `true` only when the corresponding environment variable is present and resolves truthy per the existing `isValueTruthy` helper; otherwise it MUST be `false`.

#### Scenario: Flag is true when env var is explicitly truthy

- **WHEN** `process.env.NIM_ENABLED` is set to `'true'` and the root layout initializes `FeatureFlags`
- **THEN** `featureFlags.nimEnabled` is `true`
- **AND** the same semantics apply to `HF_ENABLED` → `hfEnabled`

#### Scenario: Flag defaults to false when env var is unset

- **WHEN** neither `process.env.NIM_ENABLED` nor `process.env.HF_ENABLED` is set
- **THEN** `featureFlags.nimEnabled` is `false`
- **AND** `featureFlags.hfEnabled` is `false`

#### Scenario: Flag is false when env var is falsy

- **WHEN** `process.env.NIM_ENABLED` is set to `'false'`, `''`, `'0'`, or any value that `isValueTruthy` treats as falsy
- **THEN** `featureFlags.nimEnabled` is `false`

### Requirement: Model Servings Create dropdown filters rows by flag

The "Create" dropdown rendered on the Model Servings list page SHALL include the "HF Model Serving" row only when `featureFlags.hfEnabled` is `true`, and the "NIM Model Serving" row only when `featureFlags.nimEnabled` is `true`. Rows for other Deployments sections (MCP, Adapter, Application, Interceptor) MUST NOT be affected by these flags.

#### Scenario: Both flags enabled shows both rows

- **WHEN** both `featureFlags.hfEnabled` and `featureFlags.nimEnabled` are `true`
- **AND** the user opens the Create dropdown on the Model Servings list
- **THEN** both "HF Model Serving" and "NIM Model Serving" rows are present

#### Scenario: Only HF enabled shows only HF row

- **WHEN** `featureFlags.hfEnabled` is `true` and `featureFlags.nimEnabled` is `false`
- **AND** the user opens the Create dropdown on the Model Servings list
- **THEN** only the "HF Model Serving" row is present

#### Scenario: Only NIM enabled shows only NIM row

- **WHEN** `featureFlags.nimEnabled` is `true` and `featureFlags.hfEnabled` is `false`
- **AND** the user opens the Create dropdown on the Model Servings list
- **THEN** only the "NIM Model Serving" row is present

#### Scenario: Both flags disabled produces an empty dropdown

- **WHEN** both flags are `false`
- **AND** the user opens the Create dropdown on the Model Servings list (if it is rendered at all)
- **THEN** no rows for HF or NIM are present

### Requirement: Model Servings navigation entry is hidden when neither flag is enabled

The left-navigation menu configuration SHALL include the "Model Servings" entry within the Deployments group only when at least one of `featureFlags.nimEnabled` or `featureFlags.hfEnabled` is `true`. Other Deployments group entries (MCP, Adapter, Application, Interceptor, Images) MUST NOT be affected by these flags.

#### Scenario: At least one flag enabled shows the nav entry

- **WHEN** `featureFlags.nimEnabled` is `true` or `featureFlags.hfEnabled` is `true`
- **AND** the Deployments menu group is rendered
- **THEN** the "Model Servings" menu item is present

#### Scenario: Both flags disabled hides the nav entry

- **WHEN** both `featureFlags.nimEnabled` and `featureFlags.hfEnabled` are `false`
- **AND** the Deployments menu group is rendered
- **THEN** the "Model Servings" menu item is absent from that group

### Requirement: Direct navigation to Model Servings route redirects home when neither flag is enabled

The server component that renders `/[lang]/model-servings` SHALL, when both `NIM_ENABLED` and `HF_ENABLED` evaluate falsy at request time, redirect the user to the application home route (`ApplicationRoute.Home`) before issuing any backend request for containers.

#### Scenario: Bookmarked URL redirects when both flags disabled

- **WHEN** a user navigates to `/<lang>/model-servings` and both flags are disabled
- **THEN** the server issues an HTTP redirect to `ApplicationRoute.Home`
- **AND** no call is made to the containers API

#### Scenario: Route renders normally when at least one flag is enabled

- **WHEN** a user navigates to `/<lang>/model-servings` and at least one of `NIM_ENABLED` or `HF_ENABLED` is truthy
- **THEN** the page renders the Model Servings list as it does today

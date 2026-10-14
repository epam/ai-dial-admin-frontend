## Purpose
Define the Model Servings visibility capability: a single feature flag (`HF_ENABLED`) that gates the "HF Model Serving" row of the Model Servings Create dropdown, the presence of the Model Servings navigation entry, and direct-URL access to the Model Servings route.

## Requirements

### Requirement: Feature flag exposes HF Model Servings visibility

The system SHALL expose an environment variable `HF_ENABLED`, whose value is surfaced at runtime on the `FeatureFlags` object as `hfEnabled: boolean`. The flag MUST be `true` only when the environment variable is present and resolves truthy per the existing `isValueTruthy` helper; otherwise it MUST be `false`.

#### Scenario: Flag is true when env var is explicitly truthy

- **WHEN** `process.env.HF_ENABLED` is set to `'true'` and the root layout initializes `FeatureFlags`
- **THEN** `featureFlags.hfEnabled` is `true`

#### Scenario: Flag defaults to false when env var is unset

- **WHEN** `process.env.HF_ENABLED` is not set
- **THEN** `featureFlags.hfEnabled` is `false`

#### Scenario: Flag is false when env var is falsy

- **WHEN** `process.env.HF_ENABLED` is set to `'false'`, `''`, `'0'`, or any value that `isValueTruthy` treats as falsy
- **THEN** `featureFlags.hfEnabled` is `false`

### Requirement: Model Servings Create dropdown filters rows by flag

The "Create" dropdown rendered on the Model Servings list page SHALL include the "HF Model Serving" row only when `featureFlags.hfEnabled` is `true`. Rows for other Deployments sections (MCP, Adapter, Application, Interceptor) MUST NOT be affected by this flag.

#### Scenario: Flag enabled shows the HF row

- **WHEN** `featureFlags.hfEnabled` is `true`
- **AND** the user opens the Create dropdown on the Model Servings list
- **THEN** the "HF Model Serving" row is present

#### Scenario: Flag disabled produces an empty dropdown

- **WHEN** `featureFlags.hfEnabled` is `false`
- **AND** the user opens the Create dropdown on the Model Servings list (if it is rendered at all)
- **THEN** no "HF Model Serving" row is present

### Requirement: Model Servings navigation entry is hidden when the flag is disabled

The left-navigation menu configuration SHALL include the "Model Servings" entry within the Deployments group only when `featureFlags.hfEnabled` is `true`. Other Deployments group entries (MCP, Adapter, Application, Interceptor, Images) MUST NOT be affected by this flag.

#### Scenario: Flag enabled shows the nav entry

- **WHEN** `featureFlags.hfEnabled` is `true`
- **AND** the Deployments menu group is rendered
- **THEN** the "Model Servings" menu item is present

#### Scenario: Flag disabled hides the nav entry

- **WHEN** `featureFlags.hfEnabled` is `false`
- **AND** the Deployments menu group is rendered
- **THEN** the "Model Servings" menu item is absent from that group

### Requirement: Direct navigation to Model Servings route redirects home when the flag is disabled

The server component that renders `/[lang]/model-servings` SHALL, when `HF_ENABLED` evaluates falsy at request time, redirect the user to the application home route (`ApplicationRoute.Home`) before issuing any backend request for containers.

#### Scenario: Bookmarked URL redirects when the flag is disabled

- **WHEN** a user navigates to `/<lang>/model-servings` and `HF_ENABLED` is disabled
- **THEN** the server issues an HTTP redirect to `ApplicationRoute.Home`
- **AND** no call is made to the containers API

#### Scenario: Route renders normally when the flag is enabled

- **WHEN** a user navigates to `/<lang>/model-servings` and `HF_ENABLED` is truthy
- **THEN** the page renders the Model Servings list as it does today
- **AND** the containers list request uses `?type=INFERENCE`

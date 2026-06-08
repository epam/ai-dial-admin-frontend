## ADDED Requirements

### Requirement: Feature-flag-gated menu groups compose independently

The left-navigation menu configuration SHALL hide each feature-flag-gated menu group based solely on its own flag, independent of the state of any other group's flag. Disabling one group MUST NOT cause another disabled group to reappear, and MUST NOT hide a group whose flag is enabled. Today two groups are flag-gated: the Deployments group is hidden when `featureFlags.deploymentsEnabled` is `false` (sourced from `DEPLOYMENTS_ENABLED`), and the Evaluation group is hidden when `featureFlags.evaluationEnabled` is `false` (sourced from `DIAL_EVAL_API_URL` being absent).

#### Scenario: Both group flags enabled

- **WHEN** `featureFlags.deploymentsEnabled` is `true` and `featureFlags.evaluationEnabled` is `true`
- **THEN** the Deployments group and the Evaluation group are both present in the menu

#### Scenario: Deployments disabled, Evaluation enabled

- **WHEN** `featureFlags.deploymentsEnabled` is `false` and `featureFlags.evaluationEnabled` is `true`
- **THEN** the Deployments group is absent
- **AND** the Evaluation group is present

#### Scenario: Deployments enabled, Evaluation disabled

- **WHEN** `featureFlags.deploymentsEnabled` is `true` and `featureFlags.evaluationEnabled` is `false`
- **THEN** the Evaluation group is absent
- **AND** the Deployments group is present

#### Scenario: Both group flags disabled (regression case from issue #3589)

- **WHEN** `featureFlags.deploymentsEnabled` is `false` and `featureFlags.evaluationEnabled` is `false`
- **THEN** the Deployments group is absent
- **AND** the Evaluation group is absent

### Requirement: DEPLOYMENTS_ENABLED=false hides the Deployments group and all its sub-items

When `DEPLOYMENTS_ENABLED` resolves falsy (per `isValueTruthy`), the entire Deployments menu group — including every sub-item (Model Servings, MCP Containers, Interceptor Containers, Adapter Containers, Application Containers, Images) — SHALL be absent from the sidebar without requiring any entry in `DISABLE_MENU_ITEMS`. This behavior MUST hold regardless of whether the Evaluation group is also hidden.

#### Scenario: Deployments hidden via env flag alone

- **WHEN** the app is configured with `DEPLOYMENTS_ENABLED=false` and `DIAL_EVAL_API_URL` is unset (Evaluation also disabled)
- **AND** `DISABLE_MENU_ITEMS` contains no Deployments-related entries
- **THEN** the Deployments group and all of its sub-items are absent from the sidebar navigation

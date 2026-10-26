## MODIFIED Requirements

### Requirement: Per-tab validation banner
A `ValidationBanner` component SHALL render inside the active tab's content area (between `Tabs` and the grid) whenever `validationSummary.errorsByTab[selectedTab] > 0`. The banner MUST render nothing for tabs that have no failures and for the Global Firewall tab. The message SHALL be composed of two i18n keys: `ImportI18nKey.ValidationBannerHeading` (rendered with `dial-small-semi-text`, interpolating `{count}`) followed by `ImportI18nKey.ValidationBannerHelp` (rendered with `dial-small-text`). The component uses `Notification` with `NotificationVariant.Error`.

#### Scenario: Banner appears on the active tab when that tab has errors
- **WHEN** the active tab's failure count is `2`
- **THEN** the banner is visible inside that tab's content area, rendered as a `Notification` whose message contains the heading text (semi-bold, with the count interpolated) and the help text (regular weight)

#### Scenario: Banner is hidden when active tab has no errors
- **WHEN** the active tab's failure count is `0`
- **THEN** no banner element is rendered

#### Scenario: Switching tabs swaps the banner
- **WHEN** the user switches from a clean tab to a tab with failures (or vice versa)
- **THEN** the banner is rendered or removed accordingly, reflecting only the newly-active tab's count

### Requirement: Per-tab error indicator via `TabItem.status`
Each `TabItem` for an artifact tab SHALL set `status: TabStatus.Error` when its error count (computed via `COMPONENT_TYPE_TO_TAB_ID`) is greater than zero. The Global Firewall tab SHALL set `status: TabStatus.Error` when one or more `GLOBAL_DOMAIN_WHITELIST` errors are present in the preview response, and no `status` otherwise. A tab with a status SHALL also pass a translated `statusLabel`, so the state reaches assistive tech in the interface language. The visual rendering of the indicator is provided by `Tabs` from `@epam/ai-dial-ui-kit` (a coloured icon after the label) and MUST NOT be reimplemented.

#### Scenario: Tab with errors is marked as an error
- **WHEN** `errorsByTab.MCP_CONTAINER === 5`
- **THEN** the `MCP_CONTAINER` `TabItem` has `status: TabStatus.Error` and a translated `statusLabel`, and the `Tabs` rendering surfaces the error icon next to the label and the status text in the tab's accessible name

#### Scenario: Global Firewall tab is marked as an error when a domain fails
- **WHEN** the preview response includes at least one `GLOBAL_DOMAIN_WHITELIST` error
- **THEN** the Global Firewall `TabItem` has `status: TabStatus.Error` and the error icon is surfaced next to its label

#### Scenario: Global Firewall tab has no status when no domain fails
- **WHEN** the preview response includes no `GLOBAL_DOMAIN_WHITELIST` error
- **THEN** the Global Firewall `TabItem` has no `status`

### Requirement: Admin Config Import path unaffected
The admin Config Import path (`isDeployments === false`) SHALL remain untouched. `ConfigurationGrid` and `getConfigurationPreview` MUST NOT change behavior. No banner, State column, tab indicator, or Configuration step status driven by `validationErrors` is added to the admin path.

#### Scenario: Admin import preview unchanged
- **WHEN** the user opens Config Import with `configScope` set to admin (not deployments)
- **THEN** the preview renders exactly as before this change: no validation banner, no State column, no `TabItem.status` driven by validation errors, no Configuration step error status

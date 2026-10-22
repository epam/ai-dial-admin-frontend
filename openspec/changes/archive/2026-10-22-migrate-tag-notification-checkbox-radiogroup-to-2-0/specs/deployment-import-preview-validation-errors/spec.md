## MODIFIED Requirements

### Requirement: Per-tab validation banner
A `ValidationBanner` component SHALL render inside the active tab's content area (between `DialTabs` and the grid) whenever `validationSummary.errorsByTab[selectedTab] > 0`. The banner MUST render nothing for tabs that have no failures and for the Global Firewall tab. The message SHALL be composed of two i18n keys: `ImportI18nKey.ValidationBannerHeading` (rendered with `dial-small-semi-text`, interpolating `{count}`) followed by `ImportI18nKey.ValidationBannerHelp` (rendered with `dial-small-text`). The component uses `Notification` with `NotificationVariant.Error`.

#### Scenario: Banner appears on the active tab when that tab has errors
- **WHEN** the active tab's failure count is `2`
- **THEN** the banner is visible inside that tab's content area, rendered as a `Notification` whose message contains the heading text (semi-bold, with the count interpolated) and the help text (regular weight)

#### Scenario: Banner is hidden when active tab has no errors
- **WHEN** the active tab's failure count is `0`
- **THEN** no banner element is rendered

#### Scenario: Switching tabs swaps the banner
- **WHEN** the user switches from a clean tab to a tab with failures (or vice versa)
- **THEN** the banner is rendered or removed accordingly, reflecting only the newly-active tab's count


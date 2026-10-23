## MODIFIED Requirements

### Requirement: Stop button appearance
The Stop button SHALL be rendered as a `OutlinedButton` with the `IconPlayerPause` icon (from `@tabler/icons-react`, matching the container stop button) sized via `BASE_BUTTON_ICON_PROPS`, and labelled with `t(ButtonsI18nKey.Stop)`.

#### Scenario: Stop button styling matches container stop button
- **WHEN** the Stop button is rendered
- **THEN** it SHALL use `OutlinedButton`, display the `IconPlayerPause` icon sized via `BASE_BUTTON_ICON_PROPS`, and show the label `t(ButtonsI18nKey.Stop)`

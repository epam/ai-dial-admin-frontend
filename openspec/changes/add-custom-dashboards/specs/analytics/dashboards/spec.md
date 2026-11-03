## ADDED Requirements

### Requirement: The Dashboards header switches between the built-in dashboard and custom ones

While custom dashboards are available, the Dashboards page header SHALL offer a dashboard switcher. Its
first option SHALL be the built-in usage dashboard, followed by every custom dashboard by name, followed
by a separator and **Create dashboard**, which is always offered. The switcher SHALL show the dashboard
currently open. `/dashboards` SHALL keep rendering the usage dashboard and SHALL remain the default
destination of the Dashboards menu item; picking a custom dashboard SHALL navigate to
`/dashboards/[id]`, and picking the built-in one SHALL navigate to `/dashboards`. Create dashboard SHALL
open the create modal of `analytics/custom-dashboards` without changing the open dashboard.

The usage dashboard SHALL be unchanged by the switcher: it SHALL NOT be editable, SHALL NOT be offered
as a target of Add to dashboard, and its controls, requests and Compare behave as before.

#### Scenario: The usage dashboard is the default

- **GIVEN** custom dashboards are available
- **WHEN** the user opens Dashboards from the menu
- **THEN** the usage dashboard renders and the switcher shows it as selected

#### Scenario: Picking a custom dashboard navigates to it

- **WHEN** the user picks a custom dashboard in the switcher
- **THEN** the browser navigates to that dashboard's address and it renders

#### Scenario: Create dashboard is always offered

- **GIVEN** no custom dashboard exists yet
- **WHEN** the user opens the switcher
- **THEN** it offers the usage dashboard and Create dashboard

#### Scenario: No switcher without custom dashboards

- **GIVEN** the custom-dashboards flag is unset
- **WHEN** the user opens `/dashboards`
- **THEN** the header shows no switcher

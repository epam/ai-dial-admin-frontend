## ADDED Requirements

### Requirement: Add a saved query to a dashboard from its page

While custom dashboards are available, a query page SHALL offer **Add to dashboard** in the builder
toolbar's actions area whenever the page holds no unsaved changes; while it holds unsaved changes the
actions area shows Save and Discard instead and SHALL NOT offer Add to dashboard. Add to dashboard SHALL
be offered for every saved query the caller can read, structured or SQL.

Activating it SHALL open a modal with a **required** dashboard picker and an optional widget title. The
picker SHALL list custom dashboards only — never the built-in usage dashboard — and SHALL always end
with **Create dashboard**, which creates a dashboard from a name entered in the same modal and selects
it. Submission SHALL append one widget referencing the query to the chosen dashboard, at column 0 below
its lowest widget, in the Medium size, with the query's own page limit as its row limit (capped at 1000, or 100 when the
query has none), and SHALL write the whole dashboard once.
Adding a query that is already on the dashboard SHALL add a second widget.

On success the modal SHALL close, the browser SHALL stay on the query page, and a success notification
SHALL carry a link to the dashboard; activating the link SHALL navigate there. On failure an error
notification SHALL be shown and the modal SHALL stay open with its values intact.

#### Scenario: Add to dashboard is offered on a saved query without edits

- **GIVEN** custom dashboards are available
- **WHEN** the user opens a saved query's page and makes no edits
- **THEN** Add to dashboard is offered in the toolbar's actions area

#### Scenario: Add to dashboard is absent while edits are unsaved

- **WHEN** the user edits a saved query on its page
- **THEN** Save and Discard are offered and Add to dashboard is not

#### Scenario: The picker lists custom dashboards only

- **WHEN** the user opens the Add to dashboard modal
- **THEN** the picker lists custom dashboards and Create dashboard
- **AND** does not list the usage dashboard

#### Scenario: The widget lands at the bottom of the dashboard

- **WHEN** the user adds the query to a dashboard that already has widgets
- **THEN** a success notification links to that dashboard
- **AND** on that dashboard the new widget is below every other widget, in the Medium size, with a row
  limit of 100

#### Scenario: Add to dashboard is absent without custom dashboards

- **GIVEN** the custom-dashboards flag is unset
- **WHEN** the user opens a saved query's page
- **THEN** Add to dashboard is not offered

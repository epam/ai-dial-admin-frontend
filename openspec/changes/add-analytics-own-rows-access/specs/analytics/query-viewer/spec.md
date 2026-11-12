## ADDED Requirements

### Requirement: An empty result over a row-restricted table says so

When a run returns no rows and the query's source is a table for which `GET /v1/tables/{name}` of the analytics-data-access-service reports `permissions.rows_restricted = true`, the result area's empty state SHALL add a hint that no rows match the user's access, beside the usual empty-result text. The hint SHALL state only that access limits the rows; the limit itself SHALL NOT be shown or requested.

The hint SHALL NOT be shown when the source reports `rows_restricted` as false or omits it, when the source's permissions cannot be read — which SHALL produce no notification — or for a SQL-view run, whose source tables the viewer does not attribute. A result that has rows SHALL be unaffected.

#### Scenario: A confined caller's empty result carries the hint

- **GIVEN** a query whose source table reports `permissions.rows_restricted = true`
- **WHEN** the run returns no rows
- **THEN** the empty state shows the usual empty-result text and a hint that no rows match the user's access

#### Scenario: An unconfined caller's empty result is unchanged

- **GIVEN** a query whose source table reports `rows_restricted = false` or omits it
- **WHEN** the run returns no rows
- **THEN** only the usual empty-result text is shown

#### Scenario: Unreadable permissions leave the empty state unchanged

- **GIVEN** the source table's permissions cannot be read
- **WHEN** the run returns no rows
- **THEN** only the usual empty-result text is shown and no notification appears

#### Scenario: A SQL-view run carries no hint

- **WHEN** a SQL-view run returns no rows
- **THEN** only the usual empty-result text is shown

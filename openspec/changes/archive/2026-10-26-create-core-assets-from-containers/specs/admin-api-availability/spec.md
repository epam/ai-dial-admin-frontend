## ADDED Requirements

### Requirement: Container detail pages skip admin-backend calls without the admin API

The `/containers/[id]` and `/model-servings/[id]` pages SHALL NOT issue any admin-backend request
when `DIAL_ADMIN_API_URL` is unset. This includes the existing-entity name lists the admin-backend
create option uses. Their Deployment Manager and Core requests SHALL be unaffected.

#### Scenario: Container page without the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user opens `/<lang>/containers/<id>` for an adapter,
  interceptor, application or MCP container
- **THEN** the page renders and no request is sent to the admin backend

#### Scenario: Model Serving page without the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is unset and a user opens `/<lang>/model-servings/<id>`
- **THEN** the page renders and no request is sent to the admin backend

#### Scenario: Container page with the admin API

- **WHEN** `DIAL_ADMIN_API_URL` is set and a user opens a container detail page
- **THEN** the admin-backend entity name list is fetched as today

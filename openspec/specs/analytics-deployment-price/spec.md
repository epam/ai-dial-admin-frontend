### Requirement: Money card uses price field
The Money card on the Analytics dashboard SHALL use `sum(price)` instead of `sum(deployment_price)` so that the total matches the sum of rows in the consumption breakdown tables.

#### Scenario: Money card total matches breakdown sum
- **WHEN** the Analytics dashboard loads with data
- **THEN** the Money card value SHALL equal the sum of the "Price" column across all rows in the entity consumption table

### Requirement: Entity consumption table shows deployment price
The entity consumption breakdown table SHALL display a "Deployment Price" column that shows `sum(deployment_price)` grouped by deployment.

#### Scenario: Deployment price column visible in entity table
- **WHEN** the entity consumption table renders
- **THEN** a "Deployment Price" column SHALL be visible after the "Price" column
- **THEN** each row SHALL display the summed `deployment_price` for that deployment

### Requirement: Project consumption table shows deployment price
The project consumption breakdown table SHALL display a "Deployment Price" column that shows `sum(deployment_price)` grouped by project.

#### Scenario: Deployment price column visible in project table
- **WHEN** the project consumption table renders
- **THEN** a "Deployment Price" column SHALL be visible after the "Price" column
- **THEN** each row SHALL display the summed `deployment_price` for that project

### Requirement: Deployment price column formatting
The "Deployment Price" column SHALL use the same price formatting as the existing "Price" column (dollar sign prefix, Big.js precision).

#### Scenario: Deployment price displays with dollar formatting
- **WHEN** a deployment price value of 45.30 is returned
- **THEN** it SHALL display as "$45.30"

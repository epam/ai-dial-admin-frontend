# test-suite-method-lookup Specification

## Purpose

Defines how test-suite method selection obtains complete deployment details before presenting the
methods supported by the selected target.

## Requirements

### Requirement: Method picker uses the type-agnostic deployment lookup

When the shared Methods picker opens for a selected deployment target, the system SHALL load the
full deployment with exactly one eval-framework `GET /api/v1/deployments/all/{id}` request, where
everything after `/all/` is the deployment ID. The picker SHALL NOT use the typed
`GET /api/v1/deployments/{type}/{id}` endpoint for this lookup.

#### Scenario: Create Test Suite method selection

- **WHEN** a user reaches the Methods step while creating a deployment test suite
- **THEN** the system SHALL request the selected deployment through
  `GET /api/v1/deployments/all/{id}`
- **AND** SHALL build the selectable method groups from the returned deployment details

#### Scenario: Change Method selection

- **WHEN** a user opens the Change Method modal for a deployment test suite
- **THEN** the shared picker SHALL request the selected deployment through
  `GET /api/v1/deployments/all/{id}`
- **AND** SHALL build the selectable method groups from the returned deployment details

### Requirement: Existing method-picker behavior remains compatible

The type-agnostic lookup response SHALL be consumed as the existing full Deployment contract. The
picker SHALL preserve its loading state, route-derived methods, interface-gated methods, saved
selection, and create-time default selection behavior. A missing deployment SHALL preserve the
existing empty method state and SHALL NOT add a notification.

#### Scenario: Full deployment returned

- **WHEN** the by-ID endpoint returns a deployment containing `routes` and `interfaces`
- **THEN** the picker SHALL offer the same method groups and selections it would derive from those
  deployment details before the migration

#### Scenario: Deployment is missing

- **WHEN** the by-ID endpoint returns no deployment
- **THEN** loading SHALL finish with no deployment-derived methods and no new notification

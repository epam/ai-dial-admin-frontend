## MODIFIED Requirements

### Requirement: Entity-level base_url field
Platform models, platform applications, and asset applications SHALL each render a `base_url` (asset surfaces use snake_case `base_url`; the field name follows the same `isAsset` casing convention `InterfacesField` already uses) endpoint control in their Properties view, positioned between the `Override Name` field and the `Interfaces` section. The platform model control SHALL offer Url and Plugin choices, validate the active value according to its source, and write the existing model `baseUrl` field. Platform applications and asset applications SHALL retain their existing URL input and validation. Empty entity-level base URLs SHALL remain optional and omitted from the save payload.

#### Scenario: Field appears between Override Name and Interfaces
- **WHEN** an admin opens the Properties view of a platform model, a platform application, or an asset application
- **THEN** a base-URL control is visible immediately after `Override Name` and before the `Interfaces` section

#### Scenario: Invalid URL is rejected
- **WHEN** an admin enters a non-URL value into an entity's URL-mode base-URL field
- **THEN** the field shows a validation error and the entity cannot be saved until it is corrected or cleared

#### Scenario: Empty base_url is valid
- **WHEN** an admin leaves the entity's base-URL field blank
- **THEN** no validation error is shown and the field is omitted from the save payload

#### Scenario: A platform model references a plugin
- **WHEN** an admin selects `dial-plugin://example` for the platform model's base URL and saves
- **THEN** the existing model `baseUrl` carries that value and reload opens the field in Plugin mode

#### Scenario: Application URL controls remain unchanged
- **WHEN** an admin opens the entity-level base URL for a platform or asset application
- **THEN** it remains the existing URL input without a plugin selector

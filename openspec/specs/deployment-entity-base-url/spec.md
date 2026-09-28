# deployment-entity-base-url Specification

## Purpose

Defines the entity-level `base_url`, upstream-level `baseUrl`, and entity-level default-headers
fields that apply above and independently of any per-interface configuration.

## Requirements

### Requirement: Entity-level base_url field
Platform models, platform applications, and asset applications SHALL each render a `base_url` (asset
surfaces use snake_case `base_url`; the field name follows the same `isAsset` casing convention
`InterfacesField` already uses) endpoint input in their Properties view, positioned between the
`Override Name` field and the `Interfaces` section. The field SHALL be validated as a URL using the same
validation `InterfaceRow`'s per-interface `base_url` input already uses.

#### Scenario: Field appears between Override Name and Interfaces
- **WHEN** an admin opens the Properties view of a platform model, a platform application, or an asset
  application
- **THEN** a `base_url` input is visible immediately after `Override Name` and before the `Interfaces`
  section

#### Scenario: Invalid URL is rejected
- **WHEN** an admin enters a non-URL value into the entity's `base_url` field
- **THEN** the field shows a validation error and the entity cannot be saved until it is corrected or
  cleared

#### Scenario: Empty base_url is valid
- **WHEN** an admin leaves the entity's `base_url` field blank
- **THEN** no validation error is shown and the field is omitted from the save payload

### Requirement: Upstream-level baseUrl field
Each upstream row (`UpstreamEndpoints`/`Endpoint`) SHALL render a `baseUrl` input on the same line as the
upstream's `Key` input, ordered `Base Url` before `Key`, on platform models, platform applications, and
asset applications. This field is independent of the upstream's existing `endpoint` field — it is
the root url an interface entry with no `endpoint` of its own falls back to, matching DIAL Core's
`Upstream.baseUrl`.

#### Scenario: Base Url renders before Key on the same line
- **WHEN** an admin expands an upstream row on a platform model, platform application, or asset
  application
- **THEN** a `Base Url` input appears on the same line as, and to the left of, the `Key` input

#### Scenario: Base Url and endpoint are independent
- **WHEN** an admin sets an upstream's `baseUrl` without setting its `endpoint`
- **THEN** both values are retained independently in the upstream's saved state, with no value copied
  from one field to the other

### Requirement: Entity default headers editor
Platform models, platform applications, and asset applications SHALL each render a key-value editor for
`default_headers`/`defaultHeaders`, built on the shared, non-imperative key-value grid component, with
its own "Add" control placed below the grid.

#### Scenario: Adding a header row
- **WHEN** an admin clicks the default-headers grid's "Add" button
- **THEN** a new empty key/value row appears in the grid, without requiring an external toolbar or ref
  handle to trigger it

#### Scenario: Removing a header row
- **WHEN** an admin deletes a row from the default-headers grid
- **THEN** that key/value pair is removed from the entity's `default_headers`/`defaultHeaders` value

#### Scenario: Empty header rows are not persisted
- **WHEN** an admin adds a header row and saves without filling in a key
- **THEN** that empty row is omitted from the save payload

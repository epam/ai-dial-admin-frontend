## MODIFIED Requirements

### Requirement: Resolved parameters are read from DIAL Core

The system SHALL read a runner's resolved parameter schema from DIAL Core's `GET /v1/application_type_schemas/schema?id={$id}`, passing the runner's own `$id` (URL-encoded once for the query string) as the `id` query parameter. Core performs the external-schema download declared by `dial:applicationTypeSchemaEndpoint` and the merge itself.

This replaces the previous behaviour where the `id` parameter was the canonical config-map key `schemas/platform/{name}` — DIAL Core PR #1813 changed the key to the schema's `$id` field.

#### Scenario: Parameters read targets Core with the runner's $id

- **WHEN** the Parameters tab loads for an asset runner whose `$id` is `https://mydial.epam.com/custom_application_schemas/qq`
- **THEN** the request goes to Core's `application_type_schemas/schema` route with `id` set to `https%3A%2F%2Fmydial.epam.com%2Fcustom_application_schemas%2Fqq` (the `$id` URL-encoded once)
- **AND** the request does NOT use `schemas/platform/` as a prefix in the `id` parameter

#### Scenario: External schema resolution is not reimplemented in the frontend

- **WHEN** a runner declares `dial:applicationTypeSchemaEndpoint`
- **THEN** the frontend does not fetch that URL itself; the resolved schema returned by Core is used as-is

#### Scenario: A freshly created runner is immediately resolvable

- **WHEN** a runner is created and its Parameters tab is opened straight afterwards
- **THEN** Core resolves it, because the blob write is folded into the merged config synchronously

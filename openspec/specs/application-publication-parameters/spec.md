# application-publication-parameters Specification

## Purpose

Defines the schema-driven, human-readable Parameters presentation for application resources reviewed through publication approval requests.

## Requirements

### Requirement: Application publication Parameters use all available schema sources

The system SHALL supply an application publication detail view with normalized application-runner options from the Admin API when `DIAL_ADMIN_API_URL` is configured, or from DIAL Core config schemas when it is not configured. The system SHALL also include available platform runners in those options. It SHALL preserve each option's identity, origin, and path required by the existing schema resolver, and SHALL NOT require `DIAL_ADMIN_API_URL` to render an otherwise retrievable publication.

#### Scenario: Core-only deployment loads a publication's schema options

- **WHEN** a reviewer opens an application publication while `DIAL_ADMIN_API_URL` is not configured
- **THEN** the detail view obtains config schema options from DIAL Core, includes platform runners, and does not call the Admin API scheme-list endpoint

#### Scenario: Admin-enabled deployment retains Admin scheme loading

- **WHEN** a reviewer opens an application publication while `DIAL_ADMIN_API_URL` is configured
- **THEN** the detail view obtains the Admin-backed scheme options and provides the normalized combined options to the publication view

### Requirement: Application publication Parameters resolve the resource-declared schema

When an application publication resource carries `application_type_schema_id`, the system SHALL use that identifier to select its normalized runner option before attempting source-based or editor-based matching. It SHALL resolve the selected option through the existing schema resolver so config-backed and platform-backed options retain their respective resolution behavior. An entity without `application_type_schema_id` SHALL retain the existing source-based lookup.

#### Scenario: Publication configuration is shown from its declared schema

- **WHEN** a reviewer opens an application publication whose resource has an `application_type_schema_id` matching an available normalized option
- **THEN** the Parameters tab renders the existing read-only generated configuration form, including the publication's configured models, tools, and other schema-defined values

#### Scenario: Source-based application resolution remains available

- **WHEN** the Parameters tab receives an application entity without `application_type_schema_id`
- **THEN** it continues to resolve its schema through the existing source-based behavior

#### Scenario: Unavailable declared schema remains explicit

- **WHEN** an application publication resource carries an `application_type_schema_id` that has no available normalized option
- **THEN** the Parameters tab retains its existing no-configuration-schema state and does not synthesize a schema

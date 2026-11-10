## MODIFIED Requirements

### Requirement: File-root rows preserve existing detail source behavior

The system SHALL open a file-root row through its existing platform or asset detail route. Except for Catalog Schemas, the route SHALL append `configFile=true`, using `&` if a query string already exists. Applications and Toolsets SHALL use the bare `{id}` detail path with the flag and SHALL NOT carry a public-bucket `path` parameter. Catalog Schema file rows SHALL navigate to the ordinary encoded `$id` detail route without `configFile=true`, preserving its API-first/file-fallback resolver.

#### Scenario: A file-backed application opens the platform-shaped detail URL
- **WHEN** a user opens an application from the file root
- **THEN** the system navigates to `/assets-applications/{id}?configFile=true` without a `path` parameter

#### Scenario: Open in new tab preserves file source
- **WHEN** a user activates open-in-new-tab for a non-Catalog file row
- **THEN** the new tab URL includes `configFile=true` exactly as the row's name link does

#### Scenario: A Catalog Schema file row uses its existing fallback address
- **WHEN** a user opens a Catalog Schema from the file root
- **THEN** the system navigates to `/platform-catalog-schemas/{encoded-id}` without `configFile=true`


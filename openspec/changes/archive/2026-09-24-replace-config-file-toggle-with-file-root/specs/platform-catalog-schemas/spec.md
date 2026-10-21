## MODIFIED Requirements

### Requirement: Configuring a catalog schema requires no admin-backend call
Every field this surface reads or writes is owned by DIAL Core. The system SHALL NOT require any admin-backend request in order to list, view, create, edit, or delete an API-written catalog schema, or to list and view a file-defined catalog schema through the synthetic `file` root, so the surface remains usable when that service is unavailable.

#### Scenario: The surface is usable without the admin backend
- **WHEN** a user lists, opens, edits, and saves an API-written catalog schema while the admin backend is not configured
- **THEN** no admin-backend request is required for any of those operations

#### Scenario: File-defined schemas are listed without the admin backend
- **WHEN** a user opens the `file` root on `/platform-catalog-schemas` while the admin backend is not configured
- **THEN** the names are read from DIAL Core's config-file endpoint without an admin-backend request

### Requirement: File-declared schemas are discoverable through a read-only file root
This surface SHALL include a synthetic, flat `file` root beside its API-written `platform` root. The `file` root SHALL list configuration-file catalog schema names lazily, show name-only entries, and offer no mutating or folder action. It SHALL navigate rows to the existing ordinary encoded `$id` detail address without `configFile=true`.

The existing detail resolver SHALL read the API-written resource first and, when no resource exists, read the configuration-file population by `$id`; a file-defined result SHALL render read-only. The `file` root SHALL not alter this resolver or introduce a new detail route.

#### Scenario: File root exposes file-defined schemas
- **WHEN** a user opens the `file` root on `/platform-catalog-schemas`
- **THEN** configuration-file schema names appear as read-only, name-only rows

#### Scenario: File row preserves the fallback detail route
- **WHEN** a user opens a file-defined Catalog Schema row
- **THEN** the browser navigates to `/platform-catalog-schemas/{encoded-id}` without `configFile=true`, and the existing fallback renders the file-defined schema read-only

#### Scenario: File root has no mutation controls
- **WHEN** a user browses the Catalog Schemas `file` root
- **THEN** no create, delete, bulk-delete, duplicate, rename, move, drag-and-drop, or folder action is offered

## REMOVED Requirements

### Requirement: A file-declared schema is reachable at its own address, not through a list
**Reason**: File-defined Catalog Schemas must be discoverable in the shared FileManager as well as resolvable from a direct detail address.
**Migration**: Keep the existing API-first/file-fallback detail resolver and add the read-only `file` root; do not add a toggle or a new detail route.

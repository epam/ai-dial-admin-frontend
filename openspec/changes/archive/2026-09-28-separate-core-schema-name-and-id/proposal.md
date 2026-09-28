## Why

DIAL Core platform App Runner and Catalog Schema resources have two independent immutable values: the storage `name` used to address the resource and the declared `$id` used by Core to resolve schemas and by deployments to reference them. The console currently conflates them for some read, create, and write paths, causing migrated App Runners to replace their URI `$id` with the storage name and fail to save with Core's immutable-ID conflict.

## What Changes

- Preserve a platform App Runner's declared body `$id` when its Core storage name differs.
- Add separate required `name` and `$id` inputs to Platform App Runner and Catalog Schema create forms; create resources at the supplied storage name while storing the supplied declared `$id` in the schema body.
- Treat the loaded Core resource path as the authoritative address for platform schema updates and deletes, while retaining `$id` for schema display, Core resolved-schema reads, and deployment references.
- Prevent existing resources' declared `$id` from changing through both property forms and raw JSON editing.
- Clarify platform list, detail, route, and picker behavior so storage names are not substituted into `$id`-based references.
- Correct the Platform App Runners specification's obsolete Assets route/menu wording.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-app-runners`: Separate platform resource storage names from declared runner `$id` values across creation, display, routing, updates, deletion, and references.
- `platform-catalog-schemas`: Separate platform resource storage names from declared schema `$id` values across creation, display, routing, updates, deletion, and references.
- `application-source`: Preserve declared platform App Runner `$id` values when selecting, resolving, and storing an application source.
- `catalog-properties-editing`: Preserve declared Catalog Schema `$id` values when selecting, opening, and storing a deployment's schema reference.

## Impact

- Affects Core resource adapters and server actions for `schemas/platform` and `catalog_schemas/platform`, plus their create modals, list/detail navigation, JSON editors, and regression tests.
- Aligns the console with DIAL Core's API contract: storage resource path/name addresses CRUD, while schema body `$id` is the immutable runtime identity used by `application_type_schema_id` and `catalog_schema_id`.
- Does not alter the admin-backend-backed Entities > Application Runners contract, which has no separate Core storage name.

## Non-goals

- Change DIAL Core or admin-backend API contracts.
- Fetch schema content per metadata-list row to display declared `$id` values.
- Add a rename workflow for platform schema storage names.
- Change config-file resource behavior, which remains read-only.

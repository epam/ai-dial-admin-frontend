## MODIFIED Requirements

### Requirement: Applications Schema panel owns runner-scheme side-effects

When source `$type === 'schema'` for a `DialApplication`, the `AppRunners` component SHALL own runner-selection side-effects, resolving the selected runner's scheme through the shared `resolveAppRunnerScheme` helper rather than calling a resolver inline:

1. On runner selection, it resolves the picked runner via `resolveAppRunnerScheme(runner)`:
   - For a `Config`-origin runner, this fetches the resolved application scheme via `getResolvedApplicationScheme(runner.$id)`.
   - For a `Platform`-origin runner, this fetches the resource content by its Core metadata storage path and calls `getResolvedRunnerSchema` with that content's declared `$id`. A metadata-list storage name or encoded resource reference MUST NOT be passed as the resolved-schema query id.
2. If the schema fetch succeeds, it derives default `applicationProperties` via `getSchemaDefaults(scheme)`.
3. It calls `onChange` once with the combined update: `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: resolvedId }, applicationProperties }`, where `resolvedId` is the declared content `$id` for a Platform-origin runner or the selected `$id` for a Config-origin runner.

If the schema fetch fails, the component SHALL fall back to using the non-resolved runner. If the Platform-origin content fetch itself fails, it SHALL fall back to the picker option as originally listed, so a transient failure does not block selection.

#### Scenario: Runner selection with successful schema fetch

- **WHEN** the user picks a Config-origin runner and `getResolvedApplicationScheme` returns a schema
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Platform runner selection resolves against its declared content id

- **WHEN** the user picks a Platform-origin runner whose metadata storage name differs from the `$id` stored in its content
- **THEN** the component fetches the runner content through its metadata storage path
- **AND** calls `getResolvedRunnerSchema` with the content's declared `$id`
- **AND** sets `entity.source.applicationTypeSchemaId` to the declared `$id`

#### Scenario: Platform runner selection with a failed content fetch

- **WHEN** the user picks a Platform-origin runner and the content fetch fails
- **THEN** the component falls back to the picker option's own value for both `getResolvedRunnerSchema` and `entity.source.applicationTypeSchemaId`

## ADDED Requirements

### Requirement: Platform runner resource references remain distinct from application schema ids

The system SHALL use the Platform App Runner's Core storage path only to fetch or navigate to the resource. It SHALL store the runner's declared raw `$id`, not `schemas/platform/{name}` or the storage name, in an asset application's `application_type_schema_id`.

#### Scenario: Application source stores the declared id

- **WHEN** an admin selects a Platform App Runner stored under `quickapps2` whose declared `$id` is `https://dial.example.com/custom_application_schemas/quickapps2`
- **THEN** the asset application's `application_type_schema_id` is `https://dial.example.com/custom_application_schemas/quickapps2`
- **AND** the storage name is retained only for resource retrieval and navigation

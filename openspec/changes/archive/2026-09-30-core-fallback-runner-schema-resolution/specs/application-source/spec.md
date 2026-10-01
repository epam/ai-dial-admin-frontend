## MODIFIED Requirements

### Requirement: Applications Schema panel owns runner-scheme side-effects

When source `$type === 'schema'` for a `DialApplication`, the `AppRunners` component SHALL own runner-selection side-effects, resolving the selected runner's scheme through the shared `resolveAppRunnerScheme` helper rather than calling a resolver inline:

1. On runner selection, it resolves the picked runner via `resolveAppRunnerScheme(runner)`:
   - For a `Config`-origin runner, or a runner without an explicit origin, when `DIAL_ADMIN_API_URL` is configured, this fetches the resolved application scheme through the Admin Backend via `getResolvedApplicationScheme(runner.$id)`.
   - For a `Config`-origin runner, or a runner without an explicit origin, when `DIAL_ADMIN_API_URL` is absent or empty, this fetches the resolved application scheme through Core via `getResolvedRunnerSchema(runner.$id)`.
   - For a `Platform`-origin runner, this fetches the resource content by its Core metadata storage path and calls `getResolvedRunnerSchema` with that content's declared `$id`. A metadata-list storage name or encoded resource reference MUST NOT be passed as the resolved-schema query id, and `DIAL_ADMIN_API_URL` MUST NOT alter this behavior.
2. If the schema fetch succeeds, it derives default `applicationProperties` via `getSchemaDefaults(scheme)`.
3. It calls `onChange` once with the combined update: `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: resolvedId }, applicationProperties }`, where `resolvedId` is the declared content `$id` for a Platform-origin runner or the selected `$id` for a Config-origin or originless runner.

If the selected schema fetch fails, the component SHALL fall back to using the non-resolved runner. If the Platform-origin content fetch itself fails, it SHALL fall back to the picker option as originally listed, so a transient failure does not block selection.

#### Scenario: Config runner selection with an available Admin Backend

- **WHEN** the user picks a Config-origin runner while `DIAL_ADMIN_API_URL` is configured and `getResolvedApplicationScheme` returns a schema
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Config runner selection without an Admin Backend

- **WHEN** the user picks a Config-origin runner while `DIAL_ADMIN_API_URL` is absent or empty and Core's `getResolvedRunnerSchema` returns a schema
- **THEN** Core's resolver is called with the runner id
- **AND** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Originless runner selection without an Admin Backend

- **WHEN** the user picks a runner without an explicit origin while `DIAL_ADMIN_API_URL` is absent or empty
- **THEN** Core's `getResolvedRunnerSchema` is called with the runner id
- **AND** the application update uses the returned resolved schema

#### Scenario: Config runner selection with a failed resolver

- **WHEN** the user picks a Config-origin runner and the resolver selected by `DIAL_ADMIN_API_URL` availability fails
- **THEN** the component derives defaults from the unresolved runner
- **AND** the runner selection remains usable

#### Scenario: Platform runner selection resolves against its declared content id

- **WHEN** the user picks a Platform-origin runner whose metadata storage name differs from the `$id` stored in its content
- **THEN** the component fetches the runner content through its metadata storage path
- **AND** calls `getResolvedRunnerSchema` with the content's declared `$id`
- **AND** sets `entity.source.applicationTypeSchemaId` to the declared `$id`

#### Scenario: Platform runner selection ignores Admin Backend availability

- **WHEN** the user picks a Platform-origin runner while `DIAL_ADMIN_API_URL` is configured or absent
- **THEN** the component resolves its schema through Core after reading its content
- **AND** it does not call `getResolvedApplicationScheme`

#### Scenario: Platform runner selection with a failed content fetch

- **WHEN** the content fetch for a selected Platform-origin runner fails
- **THEN** the component resolves through Core using the picker option's `$id`
- **AND** it falls back to the picker option if that resolver call fails

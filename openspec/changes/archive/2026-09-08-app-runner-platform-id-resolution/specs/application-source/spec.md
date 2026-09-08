## MODIFIED Requirements

### Requirement: Applications Schema panel owns runner-scheme side-effects

When source `$type === 'schema'` for a `DialApplication`, the `AppRunners` component SHALL own the runner-selection side-effects, resolving the selected runner's scheme through the shared `resolveAppRunnerScheme` helper rather than calling a resolver inline:

1. On runner selection, it resolves the picked runner via `resolveAppRunnerScheme(runner)`:
   - For a `Config`-origin runner (`AppRunnerOrigin.Config`), this fetches the resolved application scheme via `getResolvedApplicationScheme(runner.$id)` — unchanged from today.
   - For a `Platform`-origin runner (`AppRunnerOrigin.Platform`), this first fetches the runner's full content (`getRunner(path, DEFAULT_ETAG)`) and uses **that resource's own `$id`** — not the picker option's list-derived `$id` — to call `getResolvedRunnerSchema`. The list-derived `$id` MUST NOT be passed to `getResolvedRunnerSchema` directly, since it reflects the runner's id at creation time and can be stale if the runner's `$id` was edited afterwards through its content.
2. If the schema fetch succeeds, it derives default `applicationProperties` via `getSchemaDefaults(scheme)`.
3. It calls `onChange` once with the combined update: `{ ...entity, source: { $type: SCHEMA, applicationTypeSchemaId: resolvedId }, applicationProperties }`, where `resolvedId` is the runner id returned by `resolveAppRunnerScheme` — the corrected content `$id` for a `Platform`-origin runner, or the picked `$id` unchanged for a `Config`-origin one.

If the schema fetch fails, the component SHALL fall back to using the non-resolved runner (current behavior). If the `Platform`-origin content fetch itself fails, the component SHALL fall back to the picker option as originally listed (its list-derived `$id`), so a transient failure degrades to today's behavior rather than blocking selection.

#### Scenario: Runner selection with successful schema fetch

- **WHEN** the user picks a `Config`-origin runner and `getResolvedApplicationScheme` returns a schema
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is set to `getSchemaDefaults(schema)`

#### Scenario: Runner selection with fetch failure

- **WHEN** the user picks a `Config`-origin runner and `getResolvedApplicationScheme` fails
- **THEN** `entity.source.$type` is set to `SCHEMA`
- **AND** `entity.source.applicationTypeSchemaId` is set to the runner id
- **AND** `entity.applicationProperties` is derived from the unresolved runner

#### Scenario: Platform runner selection resolves against its content `$id`

- **WHEN** the user picks a `Platform`-origin runner whose picker-option `$id` (derived from its Core resource name) differs from the `$id` currently stored in its content
- **THEN** the component fetches the runner's content via `getRunner`
- **AND** calls `getResolvedRunnerSchema` with the content's `$id`, not the picker option's `$id`
- **AND** `entity.source.applicationTypeSchemaId` is set to the content's `$id`

#### Scenario: Platform runner selection with a failed content fetch

- **WHEN** the user picks a `Platform`-origin runner and the `getRunner` content fetch fails
- **THEN** the component falls back to the picker option's own `$id` for both `getResolvedRunnerSchema` and `entity.source.applicationTypeSchemaId`, matching today's behavior

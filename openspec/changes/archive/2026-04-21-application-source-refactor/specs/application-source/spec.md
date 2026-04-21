## Capability: application-source

Represents how a regular Application (`DialApplication`) specifies its source — either a direct endpoint/MCP configuration or a schema-backed application runner.

### API contract

`source` is a polymorphic field in `ApplicationDto`, discriminated by `$type`:

| `$type`     | Additional fields                          | Meaning                                      |
|-------------|---------------------------------------------|----------------------------------------------|
| `endpoints` | none                                        | App endpoint configured directly on the DTO |
| `schema`    | `applicationTypeSchemaId: string` (URI)     | App backed by an application runner schema   |

When `source` is omitted or `{ $type: 'endpoints' }`, the application uses a direct endpoint (`endpoint` / `mcp` fields).

### FE internal model

```ts
type ApplicationSource = ApplicationEndpointsSource | ApplicationSchemaSource;

interface ApplicationEndpointsSource { $type: 'endpoints'; }
interface ApplicationSchemaSource    { $type: 'schema'; applicationTypeSchemaId: string; }
```

`DialApplication.source` is optional. Absence is treated the same as `{ $type: 'endpoints' }`.

### Source type → UI mapping

| UI radio value       | `source` written to entity                                    |
|----------------------|---------------------------------------------------------------|
| `SourceType.ENDPOINTS` | `undefined` (cleared)                                       |
| `SourceType.APP_RUNNER` | `{ $type: 'schema', applicationTypeSchemaId: runnerId }`   |

### Validation

- When `source.$type === 'schema'`, `applicationTypeSchemaId` must be a non-empty string; the AppRunners dropdown handles this via existing required-field validation.
- When source type is ENDPOINTS, `source` is cleared from the entity before save.

### Scope boundary

This spec covers **regular Applications only** (`DialApplication` via `/api/v1/applications`).

`AssetApp` (via `assetsApi`) uses its own top-level `applicationTypeSchemaId` field and is unaffected.

`$type: 'container'` is not supported in this change.

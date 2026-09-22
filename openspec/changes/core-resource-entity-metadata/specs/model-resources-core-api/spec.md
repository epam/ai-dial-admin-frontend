# model-resources-core-api — `_metadata` status/warnings delta

## MODIFIED Requirements

### Requirement: Model resource GET surfaces Core's validity status and its warnings as read-only; update strips them before writing
DIAL Core's model resource GET injects a synthetic `status` field that has no backing property on the underlying `Model` entity, and it does so through two distinct projections: a resource read normally is projected with a valid status, while a resource recorded as invalid during the merged-config rebuild is projected with an invalid status and, for admin callers, an accompanying `validationWarnings` array naming the offending fields. The system SHALL surface both the status and, when present, the warnings as read-only inside the fetched model resource's `_metadata` object (see the `core-resource-entity-metadata` capability), and SHALL remove the whole `_metadata` object — which also holds the client-side-only path fields `path`/`folderId` — from the payload before sending any create/update request to Core. The model's own `name` is a real `Model` field inherited from `RoleBasedEntity`, served as content, and SHALL remain flat on the entity and round-trip on write. Echoing the raw GET body back verbatim as a PUT payload is unsupported and SHALL NOT be relied upon, since Core's model deserialization rejects unrecognized fields.

#### Scenario: Get includes status
- **WHEN** `getModel` fetches a model resource
- **THEN** the returned resource's `_metadata` includes a `status` field sourced from Core's GET
  response

#### Scenario: Get preserves validation warnings for an invalid model
- **WHEN** `getModel` fetches a model resource Core reports as invalid with validation warnings
- **THEN** the returned resource's `_metadata` carries both the invalid status and the warnings,
  rather than discarding the warnings

#### Scenario: Update omits status and warnings
- **WHEN** `updateModel` sends a request to Core
- **THEN** the request body includes neither a `status` nor a `validationWarnings` field, nor any
  `_metadata` object

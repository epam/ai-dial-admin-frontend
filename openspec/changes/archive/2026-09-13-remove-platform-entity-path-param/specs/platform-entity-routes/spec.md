## ADDED Requirements

### Requirement: Platform entity detail pages are addressed by the `[id]` segment alone

For the six flat platform entities (Models, App Runners, Interceptors, Routes, Roles, Keys), the
detail page URL SHALL use only the `[id]` path segment to identify the resource. No `?path=` query
parameter SHALL be appended. Because `parseEncodedFlatPath` guarantees `path === name` for all flat
resources, the two values are identical and the parameter carries no information beyond what `[id]`
already provides.

The `[id]` segment is the `encodeURIComponent`-encoded resource name (for app runners: the
`encodeURIComponent`-encoded `$id`). The page decodes it with `decodeURIComponent` to recover the
resource's path for the backend call.

#### Scenario: Opening a platform entity detail produces a clean URL

- **WHEN** the user opens a platform entity detail (by clicking a row, saving a new entity, or using open-in-new-tab)
- **THEN** the browser URL is `/<lang>/platform-<type>/<encodedName>` with no `?path=` appended

#### Scenario: A stale URL that still carries `?path=` opens the correct page

- **WHEN** a user navigates to `/<lang>/platform-models/<encodedName>?path=<anything>`
- **THEN** the system loads the entity identified by `[id]` and the `?path=` parameter is ignored

## REMOVED Requirements

### Requirement: A full-entity population can be read for a config-file type
**Reason**: The only consumers of `ConfigFileApi.list<T>` were the config-file-backed admin-grid lists
(`config-file-entity-views`), which have moved to a names-only list rendered from `listNames` alone (see
`config-file-entity-views`'s "The config-file-backed list shows only entity names"). The N+1 fetch this
method performed (one `getEntity` per name, to populate list columns) is no longer needed once the list
shows only a name column, so the method and the `ConfigFileListResult<T>` type it returned are removed
rather than kept unused.

**Migration**: Callers that listed a config-file type's full population should call `listNames` for the
name set, and `getEntity` individually for any specific entity's full body (as the covered detail pages
already do for the entity being viewed). No caller outside the six-now-seven list actions this
requirement's removal accompanies used `list`.

#### Scenario: `list` is no longer available
- **WHEN** a caller looks for a full-population config-file read
- **THEN** only `listNames` (names) and `getEntity` (one entity's full body) are available; there is no
  composite full-population method

## MODIFIED Requirements

### Requirement: Config-file reads are available for Models, Routes, Applications, and Toolsets
The system SHALL include `ConfigFileEntityType.Models`, `ConfigFileEntityType.Routes`,
`ConfigFileEntityType.Applications`, `ConfigFileEntityType.Toolsets`, and `ConfigFileEntityType.Schemas`
in `READABLE_CONFIG_FILE_TYPES`, making them accepted by `listNames` and `getEntity`.
`ConfigFileEntityType.Keys` SHALL remain excluded from the allow-list.

#### Scenario: Models, Routes, Applications, Toolsets, and Schemas are accepted
- **WHEN** `listNames` or `getEntity` is called for Models, Routes, Applications, Toolsets, or Schemas
- **THEN** the request proceeds normally

#### Scenario: Keys is still refused
- **WHEN** `listNames` or `getEntity` is called for the Keys type
- **THEN** the client refuses without issuing any request

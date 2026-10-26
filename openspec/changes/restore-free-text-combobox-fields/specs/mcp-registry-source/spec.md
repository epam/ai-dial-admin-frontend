## MODIFIED Requirements

### Requirement: MCP Server Name Field

The `McpServerNameField` SHALL be generalized to work with both containers and images. It SHALL accept callback props instead of directly importing container types and actions:

- `fetchServers: McpRegistryFetchFn` — the fetch function for autocomplete and freeform validation
- `onServerSelect: (server: McpServer) => void` — callback when a server is selected
- `serverName: string` — current server name value
- `onServerNameChange: (name: string) => void` — callback when server name text changes
- `isModal?: boolean` — layout mode
- `disabled?: boolean` — disabled state

- SHALL render a free-text field with suggestions (`AutocompleteInput`): any server name can be typed, and the typed text feeds the debounced autocomplete
- Autocomplete SHALL call `fetchServers({ search: value, limit: MCP_REGISTRY_PAGE_SIZE })` on input (debounce ~100ms, trigger after more than 2 characters) and SHALL show the first 5 returned servers. The backend filters page by page and stops after a fixed number of upstream pages, so `limit` also bounds how much of the registry is scanned; a page of 5 left most container searches with no match
- All autocomplete results SHALL be shown as suggestions without client-side filtering, each labelled with the server name and described by its version; an empty or failed answer SHALL clear the previous suggestions, and an answer for an earlier query SHALL NOT replace a later one's
- SHALL show a loading spinner in the field while an autocomplete search is in flight
- Picking a suggestion SHALL apply that server name and version; a typed name SHALL be committed — and go through Freeform Validation — when the user leaves the field or presses Enter with no suggestion highlighted
- SHALL maintain a server cache (`Map<string, McpServer>`) for instant pre-fill on autocomplete selection
- SHALL render a "Select from registry" button that opens the registry browser modal, aligned with the field whether or not an error shows below it
- SHALL validate server name against pattern `^[a-zA-Z0-9._-]+/[a-zA-Z0-9._-]+$`
- SHALL register validity with `SaveValidationContext` (field: `mcpServerName`)
- SHALL clear the suggestions when input has 2 or fewer characters

Container-specific logic (OCI package extraction, transport mapping, imageReference population) SHALL be handled by `ContainerSource`'s callbacks. The RUNNING status disabled check SHALL be applied only to the MCP server name field in `ContainerSource`, not globally.

#### Scenario: Container parent provides container-specific callbacks

- **WHEN** `McpServerNameField` is used in a container context
- **THEN** `ContainerSource` SHALL provide `fetchServers=getContainerMcpServers` and an `onServerSelect` that extracts OCI package info and populates container source fields

#### Scenario: Image parent provides image-specific callbacks

- **WHEN** `McpServerNameField` is used in an image context
- **THEN** `ImageMcpRegistry` SHALL provide `fetchServers=getImageMcpServers` and an `onServerSelect` that populates image source fields based on server capabilities

#### Scenario: Typed server name is committed on leave

- **WHEN** the user types `org/server` and leaves the field
- **THEN** the field SHALL show `org/server`
- **AND** Freeform Validation SHALL run for `org/server`

#### Scenario: Picked suggestion keeps its version

- **WHEN** the user picks the suggestion `org/server` described as `1.2.0`
- **THEN** the server `org/server` at version `1.2.0` SHALL be applied
- **AND** leaving the field afterwards SHALL NOT start a second lookup that drops the version

#### Scenario: Suggestions after three characters

- **WHEN** the user types `org`
- **THEN** the field SHALL show a loading spinner until `fetchServers` answers
- **AND** then the servers it returned for `org`, unfiltered

#### Scenario: A stale answer is dropped

- **WHEN** the answer for `nam` arrives after the answer for `names`
- **THEN** the field SHALL keep showing the suggestions for `names`

### Requirement: Freeform Validation

When user types a server name that is not in the local cache:

1. `imageReference` SHALL be cleared immediately
2. `mcpServerName` field SHALL be marked invalid (Save blocked, no error message shown)
3. A fetch SHALL be made to `fetchServers({ search: value, limit: MCP_REGISTRY_PAGE_SIZE })`, for the same scan-depth reason as the autocomplete
4. If exact name match found → `applyServer()` called, field becomes valid
5. If no exact match → error: "MCP server not found in registry"

#### Scenario: A typed name that is not in the registry

- **WHEN** the user types a server name that is not cached and the registry has no exact match
- **THEN** `imageReference` SHALL be cleared
- **AND** the field SHALL show "MCP server not found in registry" and block Save

#### Scenario: A typed name that is in the registry

- **WHEN** the registry returns an exact match for the typed name
- **THEN** the server SHALL be applied and the field SHALL become valid

#### Scenario: The lookup asks for a full registry page

- **WHEN** a typed name is committed
- **THEN** the lookup SHALL request `MCP_REGISTRY_PAGE_SIZE` servers, not 10

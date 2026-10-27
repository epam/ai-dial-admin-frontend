## MODIFIED Requirements

### Requirement: Server Details Sidebar

The MCP registry modal SHALL render an optional right-hand sidebar (`McpServerDetails`) that composes the shared `SidePanel` chrome. The sidebar SHALL:

- Compose `SidePanel` with `label={t(ContainersI18nKey.ServerDetails)}`, `isOpen`, and `onClose` props
- Be triggered by clicking a pinned utility column ("details icon") in `McpRegistryGrid`
- Be closable via the `SidePanel`'s close button
- Be decoupled from row selection — opening the sidebar SHALL NOT change the currently-selected server
- Share the modal's flex layout (`flex h-full bg-layer-2 py-4 px-6 gap-4`) and inherit `SidePanel`'s default `lg:w-[420px]` width at the large breakpoint

Sidebar content SHALL be composed from DIAL primitives, rendered as children of `SidePanel`:

| Slot | Content | Component |
|---|---|---|
| Chrome (outer + header + close) | Provided by parent | `SidePanel` |
| Title | `server.name` | `<h3 className="dial-h3">` |
| Description | `server.description` | `<p className="dial-small-text text-primary">` |
| Version | `server.version` | `LabelledText` |
| Last Update | `server.updatedAt` formatted via the same formatter as the grid column | `LabelledText` |
| Repository | `server.repository.url` as anchor with external-link icon | `LabelledText` with `children` |
| Remotes | `server.remotes[].type` as inline tag chips | Static markup or reuse of `TagsCellRenderer` |
| Full server.json | Pretty-printed `{ server, _meta }` payload | `CodeViewer` with `hideFullscreen` |
| Loading state | While the full-payload fetch is in flight for the JSON block | `Spinner` |
| Empty state | When the fetch returns no data | `NoDataContent` |

#### Scenario: Opening the sidebar

- **WHEN** the user clicks the details icon in a grid row
- **THEN** the sidebar SHALL appear immediately populated with the row's instant data (name, description, version, repository, remotes)
- **AND** a fetch to `getMcpServerVersion(server.name, server.version)` SHALL be initiated
- **AND** the JSON viewer block SHALL show a loader until the fetch resolves
- **AND** the grid's radio selection SHALL NOT change

#### Scenario: Closing the sidebar

- **WHEN** the user clicks the close button in the panel header
- **THEN** the sidebar SHALL hide
- **AND** any in-flight `getMcpServerVersion` request result SHALL be discarded for UI purposes
- **AND** the radio selection SHALL remain unchanged

#### Scenario: Sidebar opens for a row with missing optional fields

- **WHEN** the clicked row has no `repository`
- **THEN** the Repository block SHALL NOT be rendered
- **WHEN** the clicked row has no `remotes`
- **THEN** the Remotes block SHALL NOT be rendered

#### Scenario: JSON payload fetch fails

- **WHEN** `getMcpServerVersion` returns an error
- **THEN** the sidebar SHALL remain open showing the instant row data
- **AND** the JSON viewer section SHALL render `NoDataContent` with label `NoServerDetails`

#### Scenario: Reopening the sidebar for a different server

- **WHEN** the sidebar is open for server A and the user clicks the details icon for server B
- **THEN** the sidebar content SHALL update to server B's instant data
- **AND** a new fetch SHALL be initiated for server B
- **AND** the server A fetch result, if it arrives after, SHALL NOT overwrite server B's data

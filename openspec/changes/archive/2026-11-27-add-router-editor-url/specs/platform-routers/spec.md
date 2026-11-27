## MODIFIED Requirements

### Requirement: Router detail view tab set
The system SHALL render a router's detail view with the tabs `Properties`, `Features`, `Catalog`, and
`Roles`, in that order, and SHALL insert `Parameters` after `Features` only while the router has an app-type
schema selected, or while it has a non-empty `editorUrl` and the `UI` view is offered (see "Embedded router
UI"). The view SHALL NOT render an `Interceptors` or `Audit` tab. A
router opened from the `file` root SHALL be read from DIAL Core's config-file endpoint and rendered read-only,
with the ADMIN|CORE JSON format selector hidden.

#### Scenario: Detail view without a schema
- **WHEN** a user opens a router that has no `applicationTypeSchemaId` and no `editorUrl`
- **THEN** the tab list reads `Properties`, `Features`, `Catalog`, `Roles`

#### Scenario: Detail view with a schema
- **WHEN** a user opens a router that has an `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

#### Scenario: Detail view with an editor URL and no schema
- **WHEN** a user opens a router that has an `editorUrl` and no `applicationTypeSchemaId`
- **THEN** the tab list reads `Properties`, `Features`, `Parameters`, `Catalog`, `Roles`

#### Scenario: Clearing the editor URL removes the tab
- **WHEN** a user clears the `Editor URL` field of a router that has no schema
- **THEN** the `Parameters` tab disappears, and the view stays on or returns to `Properties`

#### Scenario: No Interceptors or Audit tab
- **WHEN** a user opens any router's detail view
- **THEN** no `Interceptors` and no `Audit` tab is shown

#### Scenario: File-defined router opens read-only
- **WHEN** a user opens a router from the `file` root
- **THEN** the system opens `/platform-routers/{id}?configFile=true`, reads it from the config-file
  endpoint, renders every field read-only, and shows no ADMIN|CORE format selector

### Requirement: Properties tab content
The system SHALL render the Properties tab with name, display name, display version, icon, description,
intro, `baseUrl`, `editorUrl`, `forwardAuthToken`, `maxRetryAttempts`, `overrideName`, `mode`, the app-type
schema picker, and the shared Interfaces editor. The tab SHALL NOT render `upstreams`, `limits`, `pricing`,
`interceptors`, `endpoint`, or `responsesEndpoint` controls, since Core rejects those fields on a router.
The `editorUrl` field SHALL be optional, SHALL apply the URL check the application `Editor URL` field
applies, and SHALL block save with a field error while the value fails it. An empty `editorUrl` field SHALL
be written as an absent `editorUrl`.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits `baseUrl`, saves, and reloads
- **THEN** the new `baseUrl` is stored on the router resource and shown again

#### Scenario: Editor URL persists
- **WHEN** a user enters a valid URL in `Editor URL`, saves, and reloads
- **THEN** the router resource has that `editorUrl` and the field shows it again

#### Scenario: Invalid editor URL blocks save
- **WHEN** a user enters a value in `Editor URL` that fails the URL check
- **THEN** the field shows an error and the save action is disabled

#### Scenario: Emptied editor URL is not written
- **WHEN** a user empties the `Editor URL` field of a router that had one, and saves
- **THEN** the saved router has no `editorUrl` field

#### Scenario: No fields of another deployment kind
- **WHEN** a user opens the Properties tab
- **THEN** no upstream, limits, pricing, interceptor, or endpoint control is present

#### Scenario: Router with no mode is shown as proxy
- **WHEN** a user opens a router whose stored content has no `mode`
- **THEN** the mode control shows `proxy`, and saving without touching it does not write a `mode` field

## ADDED Requirements

### Requirement: Embedded router UI
The router's `Parameters` tab SHALL offer a `UI` view that embeds the router's editor URL in an iframe, as
the Applications `Parameters` tab does. The editor URL SHALL resolve as for an application: the picked
app-type schema's `dial:applicationTypeEditorUrl` when it has one, otherwise the router's `editorUrl`. When
an editor URL resolves, the tab SHALL open in the `UI` view. The header save and discard actions SHALL act on
the iframe while it reports unsaved changes, and leaving the tab with unsaved iframe changes SHALL ask for
confirmation, as for applications. A successful iframe save SHALL show the router update notification; a
failed one SHALL show an error notification with the iframe's message. A router without a schema SHALL offer
the `UI` view only. The `UI` view SHALL NOT be offered to a read-only admin or for a router opened from the
`file` root.

#### Scenario: Router with an editor URL opens the UI view
- **WHEN** a user opens the `Parameters` tab of a router that has an `editorUrl`
- **THEN** the tab shows the `UI` view with an iframe loaded from that URL

#### Scenario: Schema editor URL takes precedence
- **WHEN** a router has an `editorUrl` and its picked schema declares a different
  `dial:applicationTypeEditorUrl`
- **THEN** the iframe loads the schema's URL

#### Scenario: Router without a schema offers only the UI view
- **WHEN** a user opens the `Parameters` tab of a router that has an `editorUrl` and no schema
- **THEN** no view selector, no table, and no add-property action is shown

#### Scenario: Router with a schema offers every view
- **WHEN** a user opens the `Parameters` tab of a router that has a schema and an `editorUrl`
- **THEN** the view selector offers `Table`, `Form`, and `UI`

#### Scenario: Header save goes to the iframe
- **WHEN** the iframe reports unsaved changes and the user activates the header save action
- **THEN** the save is sent to the iframe, and its success shows the router update notification

#### Scenario: Leaving the tab with unsaved iframe changes
- **WHEN** the iframe reports unsaved changes and the user switches to another tab
- **THEN** a confirmation modal asks whether to save or discard before the tab switches

#### Scenario: File-defined router has no UI view
- **WHEN** a user opens a router from the `file` root that has an `editorUrl` and a schema, and opens its
  `Parameters` tab
- **THEN** no iframe is rendered and the `UI` view is not offered

#### Scenario: Read-only router with only an editor URL has no Parameters tab
- **WHEN** a read-only admin, or a user on the `file` root, opens a router that has an `editorUrl` and no
  schema
- **THEN** the tab list reads `Properties`, `Features`, `Catalog`, `Roles`

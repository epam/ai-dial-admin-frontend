## ADDED Requirements

### Requirement: Platform-route writes preserve omitted upstream secrets
The system SHALL omit empty or unset upstream `key` and `secretExtraData` properties from every Assets > Routes create and update payload. It SHALL retain a non-empty key explicitly supplied while duplicating a Bearer-authenticated route. This preserves Core's stored write-only secret when an existing route is saved without re-entering it.

#### Scenario: An unchanged hidden Bearer key is omitted from an update
- **WHEN** an administrator saves an existing platform route whose Bearer upstream key is blank in the editor because Core omitted it from the read response
- **THEN** the route write payload contains no `key` property for that upstream

#### Scenario: A duplicate key is retained in the create payload
- **WHEN** an administrator supplies a replacement key for a Bearer upstream while duplicating a platform route
- **THEN** the route create payload contains that non-empty `key` value for the corresponding upstream

## MODIFIED Requirements

### Requirement: Properties tab content
The system SHALL render the route asset's Properties tab with paths, rewrite-path, methods, a response/upstreams output choice (status and body when response is selected, upstream endpoints otherwise), max-retry-attempts, order, and request/response attachment paths, composed from the same individual controls `Entities > Routes`' Properties tab uses.

For each upstream shown on this Assets > Routes surface, the system SHALL expose an authentication-type selector with `API_KEY` and `BEARER` values. An absent `authType` value SHALL render as `API_KEY` and remain eligible to be omitted from the write payload, relying on DIAL Core's default. The selector SHALL NOT be enabled by this requirement on other consumers of the shared upstream editor.

A new Bearer upstream, or an existing upstream whose authentication type changes from `API_KEY`/unset to `BEARER`, SHALL require a newly entered key before the route can be saved. An existing Bearer upstream that retains its authentication type SHALL remain saveable with an empty displayed key, because Core withholds that stored secret on read and restores an omitted secret during the write.

#### Scenario: Properties are editable and persist
- **WHEN** a user edits a Properties field and saves
- **THEN** the value is stored on the route resource and reappears on reload

#### Scenario: Output choice governs which fields are shown
- **WHEN** a user selects the "Response" output on a route
- **THEN** the status and body fields are shown and the upstream endpoints editor is hidden

#### Scenario: Upstream endpoints are shown when output is Upstreams
- **WHEN** a user selects the "Upstreams" output on a route
- **THEN** the upstream endpoints editor is shown and the status/body fields are hidden

#### Scenario: An absent authentication type uses Core's API-key default
- **WHEN** an administrator opens a platform route upstream with no stored `authType`
- **THEN** the authentication selector shows `API_KEY`
- **AND** saving without changing the selection does not require the field to be sent

#### Scenario: A route upstream can use Bearer authentication
- **WHEN** an administrator selects `BEARER` for a platform route upstream and supplies a key
- **THEN** saving writes `authType: "BEARER"` and the supplied key for that upstream

#### Scenario: A new Bearer upstream requires a key
- **WHEN** an administrator selects `BEARER` for a newly added platform route upstream without entering a key
- **THEN** the route cannot be saved and the key input reports its required validation error

#### Scenario: Changing an existing API-key upstream to Bearer requires a replacement key
- **WHEN** an administrator changes an existing upstream from `API_KEY` or an absent authentication type to `BEARER` without entering a key
- **THEN** the route cannot be saved and the key input reports its required validation error

#### Scenario: An unchanged Bearer upstream remains editable without revealing its key
- **WHEN** an administrator saves an existing platform route upstream that remains `BEARER` and whose key is blank because Core withheld it
- **THEN** the save is permitted without displaying or requiring the stored key

### Requirement: Route asset list offers a duplicate action

The system SHALL offer a `duplicate` row action for route assets. Activating it SHALL open the
shared `DuplicatePlatformAsset` modal, which for routes collects the new name and replacement keys for every `BEARER` upstream. It SHALL create a copy of the selected route under the new name without revealing or copying a stored source credential.

#### Scenario: Duplicate action opens a route-copy modal

- **WHEN** a user activates the duplicate row action on a route with no Bearer upstreams
- **THEN** a modal opens with only a name field (pre-filled with a copy-suffixed name) and no Display Name field

#### Scenario: Bearer upstreams require replacement keys in the duplicate modal

- **WHEN** a user activates duplicate for a route containing one or more `BEARER` upstreams
- **THEN** the modal shows one labelled password input for each affected upstream
- **AND** the source keys are not displayed or pre-filled
- **AND** the Duplicate action remains unavailable until every replacement key is non-empty

#### Scenario: Submitting creates a valid Bearer-route copy

- **WHEN** a user enters a valid name and replacement key for every Bearer upstream and submits the duplicate modal
- **THEN** a new route resource is created with the copied `authType` values and the newly entered Bearer keys
- **AND** the list refreshes to include it
- **AND** the system shows the existing creation-success notification and opens the created route detail view

#### Scenario: A failed duplicate remains on the list

- **WHEN** Core rejects a route duplicate request
- **THEN** the system shows Core's returned error notification
- **AND** the system does not navigate to the duplicate route detail URL

#### Scenario: Save is blocked until the name field is non-empty

- **WHEN** the duplicate modal opens with an empty name field
- **THEN** the submit button is disabled until the user enters a valid name

#### Scenario: A read-only admin is not offered the duplicate action

- **WHEN** a read-only admin views the route asset list
- **THEN** no duplicate action is offered in row menus

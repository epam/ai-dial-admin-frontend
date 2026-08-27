# AI DIAL Admin Frontend — Asset Keys

## Requirements

### Requirement: Menu entry under Assets section
The system SHALL display a "Keys" menu item in the Assets navigation group, positioned after "Roles".
The menu item SHALL be marked as preview (`isPreview: true`). It SHALL link to `/assets-keys`.

#### Scenario: Keys visible in Assets menu
- **WHEN** the user views the navigation sidebar
- **THEN** "Keys" appears in the Assets section after "Roles" and before "Applications"

### Requirement: Asset Keys listing page
The system SHALL render a flat file-manager list at `/assets-keys` using `BaseAssetList` with the
`platform` root folder. Keys are a flat platform-bucket resource — no folder creation, no nested
navigation.

#### Scenario: Listing displays keys from Core
- **WHEN** the user navigates to `/assets-keys`
- **THEN** the system fetches keys via `assetApi.list(token, ResourceType.PROJECT_KEY, path)` and
  displays them in the file-manager grid with Name, Author, Created time, and Updated time columns

#### Scenario: Empty state
- **WHEN** no keys exist in the platform bucket
- **THEN** the system displays an empty-state message

### Requirement: Create a key
The system SHALL allow creating a new key via the create modal. On creation, the system SHALL
generate a cryptographically random key secret client-side and include it in the PUT payload.
The generated key value SHALL be displayed to the user once (in the creation success flow) because
Core never returns it on subsequent reads.

#### Scenario: User creates a key
- **WHEN** the user opens the create modal and provides a name
- **THEN** the system generates a random secret, sends a PUT to Core with the `key` field populated,
  and on success displays the generated key value to the user for copying

#### Scenario: Key secret shown only at creation
- **WHEN** a key is successfully created
- **THEN** the generated key secret is shown to the user with a copy-to-clipboard action
- **WHEN** the user navigates away and returns to the key detail
- **THEN** the key secret is NOT displayed (Core does not return it on GET)

### Requirement: Key detail view
The system SHALL display a detail view at `/assets-keys/[id]` fetched via
`assetApi.getMergedWithEtag(token, ResourceType.PROJECT_KEY, path, etag)`. The view SHALL include
a Properties tab and a Roles tab.

#### Scenario: User opens a key detail
- **WHEN** the user clicks a key row in the listing
- **THEN** the system navigates to `/assets-keys/[id]?path=<encodedPath>` and renders the key
  detail with Properties and Roles tabs

### Requirement: Key properties editing
The Properties tab SHALL display and allow editing of:
- `project` (text field)
- `secured` (boolean toggle)
- `allowedIpAddressRanges` (list of IP address range strings)

The `key` field SHALL NOT be displayed in properties (it is write-only). The `expiresAt`,
`keyGeneratedAt`, and `projectContactPoint` fields are dropped (not in Core's model).

#### Scenario: Edit key properties
- **WHEN** the user modifies the `project` or `secured` fields
- **THEN** the Save button becomes enabled and the discard button appears

#### Scenario: Save key properties
- **WHEN** the user clicks Save
- **THEN** the system sends a PUT via `assetApi.put` with the modified fields (omitting `key`
  since it is preserved by Core's `mergePreservingOmittedSecrets`) and shows a success notification

### Requirement: Key roles editing
The Roles tab SHALL display the `roles` field — the list of role names this key grants to its
bearer when used for authentication. The user SHALL be able to add roles from the available roles
list and remove existing ones.

#### Scenario: View assigned roles
- **WHEN** the user opens the Roles tab
- **THEN** the system displays the key's `roles` array as a grid of role names

#### Scenario: Add a role
- **WHEN** the user clicks "Add" and selects one or more roles from the available roles modal
- **THEN** the selected role names are appended to `roles` and the view reflects the change

#### Scenario: Remove a role
- **WHEN** the user removes a role from the list
- **THEN** that role name is removed from `roles`

### Requirement: Key rotation
The system SHALL allow rotating a key's secret. Rotation generates a new random secret client-side
and sends it via PUT. Core revokes the old secret and registers the new one atomically.

#### Scenario: User rotates a key
- **WHEN** the user clicks the "Rotate" button and confirms
- **THEN** the system generates a new random secret, PUTs the key with the new `key` value, and
  on success displays the new secret to the user for copying

### Requirement: Delete a key
The system SHALL allow deleting a single key via the detail view header and bulk-deleting keys
from the listing.

#### Scenario: Delete from detail view
- **WHEN** the user clicks delete in the key detail header
- **THEN** the system calls `assetApi.delete(token, ResourceType.PROJECT_KEY, path, etag)` and
  navigates back to the listing on success

#### Scenario: Bulk delete from listing
- **WHEN** the user selects multiple keys and confirms bulk delete
- **THEN** the system calls `bulkDeleteAssets` for all selected paths

### Requirement: JSON editor
The system SHALL provide a JSON editor toggle (standard `JsonConfiguration` without format
switcher) that allows editing the raw key JSON.

#### Scenario: Toggle JSON editor
- **WHEN** the user enables the JSON editor
- **THEN** the properties/roles tabs are replaced by a Monaco JSON editor showing the key resource

### Requirement: Payload sanitization on write
On every PUT (create or update), the system SHALL strip read-only and derived fields from the
payload: `status`, `validationWarnings`, `path`, `folderId`, `author`, `createdAt`, `updatedAt`.

#### Scenario: Read-only fields stripped
- **WHEN** the system sends a PUT for a key
- **THEN** the payload does not contain `status`, `validationWarnings`, `path`, `folderId`,
  `author`, `createdAt`, or `updatedAt`

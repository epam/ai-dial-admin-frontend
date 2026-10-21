## MODIFIED Requirements

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
- **WHEN** the user clicks Save after editing properties only
- **THEN** the system sends a PUT via `assetApi.put` with the modified fields — the payload carries
  no `key` because the client never holds one in this flow (Core does not return it on reads), and
  Core's `mergePreservingOmittedSecrets` preserves the stored secret — and the system shows a
  success notification

### Requirement: JSON editor
The system SHALL provide a JSON editor toggle (standard `JsonConfiguration` without format
switcher) that allows editing the raw key JSON, including the `key` field: a key value entered in
raw JSON SHALL be included in the PUT payload as-is, making the JSON editor a manual alternative
to the Rotate flow.

#### Scenario: Toggle JSON editor
- **WHEN** the user enables the JSON editor
- **THEN** the properties/roles tabs are replaced by a Monaco JSON editor showing the key resource
  (without a `key` entry, since Core never returns it)

#### Scenario: Key value entered in raw JSON is sent on save
- **WHEN** the user adds or edits `"key": "<value>"` in the JSON editor and clicks Save
- **THEN** the PUT payload includes the entered `key` value, Core registers it as the new secret,
  and the system shows the standard update success notification

#### Scenario: No reveal step after a JSON-editor key save
- **WHEN** a save that included a `key` value succeeds
- **THEN** the system shows only the generic update notification — no reveal/copy step — because
  the user entered the value themselves (unlike rotation, where the client generates it)

#### Scenario: Null key in raw JSON is treated as absent
- **WHEN** the user enters `"key": null` in the JSON editor and clicks Save
- **THEN** the PUT payload carries no `key` property, and Core's
  `mergePreservingOmittedSecrets` preserves the stored secret

#### Scenario: Key disappears from the editor after save
- **WHEN** a save that included a `key` value succeeds and the view refreshes
- **THEN** the JSON editor reflects the re-read resource without a `key` entry (the field is
  write-only)

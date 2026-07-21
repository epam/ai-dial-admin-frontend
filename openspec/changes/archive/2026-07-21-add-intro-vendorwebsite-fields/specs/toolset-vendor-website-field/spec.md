## ADDED Requirements

### Requirement: `vendorWebsite` field on Toolset only
The system SHALL expose an optional `vendorWebsite` text field on Toolset entities only (regular and asset variants) — Model, Application, and Interceptor SHALL NOT show this field, matching the backend, where `vendorWebsite` exists solely on `ToolSet`/`ToolSetDto`/`ToolSetResourceDto`/Core's `ToolSet` config.

#### Scenario: Vendor website is editable on a regular Toolset
- **WHEN** a user opens a regular Toolset's properties view
- **THEN** a Vendor Website field is shown and editable

#### Scenario: Vendor website is editable on an Asset Toolset
- **WHEN** a user opens an Asset Toolset's properties view
- **THEN** a Vendor Website field is shown and editable, and saving routes through the same Core-direct path (`AssetApi`) already used for that entity's other fields — no admin-BE call is made for this field

#### Scenario: Vendor website is absent from Model, Application, and Interceptor forms
- **WHEN** a user opens a Model, Application, or Interceptor properties view
- **THEN** no Vendor Website field is shown

#### Scenario: Vendor website persists across save and reload
- **WHEN** a user sets a non-empty Vendor Website value on a Toolset and saves
- **THEN** reloading the Toolset shows the same Vendor Website value

#### Scenario: Empty vendor website is valid
- **WHEN** the Vendor Website field is left blank
- **THEN** the Toolset saves successfully with `vendorWebsite` absent or empty

### Requirement: `vendorWebsite` format validation
The system SHALL validate that a non-empty `vendorWebsite` value is a well-formed URL, using a plain URL-format check rather than the DIAL-endpoint-specific validation applied to fields like `viewerUrl`/`editorUrl`.

#### Scenario: Malformed vendor website is rejected before save
- **WHEN** a user enters a `vendorWebsite` value that is not a well-formed URL
- **THEN** a validation error is shown and the Save action for that Toolset is disabled

#### Scenario: Well-formed external URL is accepted
- **WHEN** a user enters a valid external URL (not necessarily matching DIAL endpoint conventions) as `vendorWebsite`
- **THEN** no validation error is shown

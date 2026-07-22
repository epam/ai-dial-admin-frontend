# toolset-vendor-website-field Specification

## Purpose
`vendorWebsite` field support (type, form control) for Toolset only — both regular and asset variants. Added by change `add-intro-vendorwebsite-fields`; URL-format validation removed as a follow-up fix (the field is a plain string, not a validated URL). `vendorWebsite` (camelCase, on `Toolset`) and `vendor_website` (snake_case, on `DialToolsetResource` — Core's wire format for resource entities) are two separate model fields, both fed by the same `VendorWebsiteControl` (a plain `DialInput`, no validation), mounted in `Toolsets/Properties/Properties.tsx` and `Assets/Toolsets/View/Properties.tsx` respectively.

## Requirements

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

### Requirement: `vendorWebsite` is a plain string field with no format validation
The system SHALL treat `vendorWebsite` as a plain, unvalidated string — it SHALL NOT apply URL-format validation or any other format check. Any non-empty value SHALL be accepted and saved as-is.

#### Scenario: Any non-empty string is accepted
- **WHEN** a user enters any non-empty text as `vendorWebsite`, whether or not it is a well-formed URL
- **THEN** no validation error is shown and the value saves successfully

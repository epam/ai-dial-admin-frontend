## ADDED Requirements

### Requirement: Toolset export builds a structured aggregate document directly against Core
The system SHALL build a `{ toolSets: AssetToolset[] }` document (the existing `ParsedAssets` shape) from selected toolset paths by fetching each toolset's merged content+metadata directly from DIAL Core and setting each toolset's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type. Exported toolsets SHALL include their `authSettings` exactly as stored, without redacting secrets, matching the admin BE's current export behavior.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportToolsets` is called with `fileType=json`
- **THEN** the response is the `{ toolSets: AssetToolset[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportToolsets` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `toolSets/toolSets.json`, holding the same `{ toolSets: AssetToolset[] }` document

#### Scenario: Secrets are not redacted from exported auth settings
- **WHEN** a toolset with OAuth `authSettings` (including `clientSecret`) is exported
- **THEN** the exported document includes those fields unredacted, matching the admin BE's current behavior

### Requirement: Toolset import resolves conflicts against Core's live state
The system SHALL check whether a toolset already exists at its resolved destination path directly against DIAL Core, and apply the caller-supplied conflict-resolution policy: `OVERRIDE` writes through regardless of an existing conflict; `SKIP` treats an existing conflict as a non-error skipped outcome rather than a failure. The system SHALL abort a multi-toolset import batch after a configured number of consecutive real failures, reusing the same circuit-breaker mechanism already built for files/prompts import.

#### Scenario: OVERRIDE writes through despite an existing toolset
- **WHEN** an incoming toolset targets a path where a toolset already exists and the policy is `OVERRIDE`
- **THEN** the import writes the incoming toolset to that path

#### Scenario: SKIP treats an existing toolset as a non-failure
- **WHEN** an incoming toolset targets a path where a toolset already exists and the policy is `SKIP`
- **THEN** that entry is reported as skipped, not as a failure, and does not count toward the consecutive-failure circuit breaker

#### Scenario: Consecutive failures abort the batch
- **WHEN** a toolset import hits the configured number of consecutive per-entry failures
- **THEN** the remaining entries in the batch are not attempted, and the response reflects the partial result

### Requirement: Zip import merges multiple JSON entries and rejects in-archive id collisions
The system SHALL unpack every `toolSets/*.json` entry from an uploaded zip archive (validating entry paths with the same path-traversal guard used for files/prompts import), merge their `{ toolSets: AssetToolset[] }` documents into one, and reject the archive if the same toolset id appears in more than one entry.

#### Scenario: Multiple JSON entries are merged into one import batch
- **WHEN** a zip archive contains more than one `toolSets/*.json` entry with disjoint toolset ids
- **THEN** all toolsets from every entry are imported as a single merged batch

#### Scenario: A duplicated toolset id across entries is rejected
- **WHEN** the same toolset id appears in more than one `toolSets/*.json` entry within the same archive
- **THEN** the import is rejected before any entry from that archive is written

### Requirement: Discovered-tools is a direct Core passthrough
The system SHALL fetch a toolset's discovered tools directly from DIAL Core, with no admin-BE involvement.

#### Scenario: Discovered tools are fetched from Core
- **WHEN** `getAssetTools` is called with a toolset path
- **THEN** the request is sent directly to DIAL Core's discovered-tools endpoint, not the admin BE

### Requirement: Sign-in/sign-out are direct Core passthroughs
The system SHALL forward toolset sign-in and sign-out requests directly to DIAL Core's toolset auth operations, using the same request body shape (`url`, `credentialsLevel`, `authenticationType`, plus `code`/`redirectUri` or `apiKey`) the admin BE forwarded unchanged.

#### Scenario: Sign-in is forwarded to Core
- **WHEN** `signInToolset` is called
- **THEN** the request is sent directly to DIAL Core's toolset sign-in operation, not the admin BE

#### Scenario: Sign-out is forwarded to Core
- **WHEN** `signOutToolset` is called
- **THEN** the request is sent directly to DIAL Core's toolset sign-out operation, not the admin BE

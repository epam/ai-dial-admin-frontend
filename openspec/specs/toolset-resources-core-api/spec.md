# toolset-resources-core-api Specification

## Purpose
Toolset-resource list, get, create, update, delete, bulk-delete, move, JSON/zip export, JSON/zip import, discovered-tools, sign-in/sign-out, and try-out-tool executed directly against DIAL Core via the shared `core-asset-client` (or, for try-out-tool, a direct MCP client session), replacing the admin-BE proxy for these operations, while the FE-facing `Toolset`/`AssetToolset` contract, routes, and server-action signatures stay identical — CRUD/move created by archiving change `migrate-toolset-resources-to-core`, import/export/discovery/auth completed by archiving change `migrate-toolset-auth-discovery-import-to-core`, try-out-tool completed by archiving change `migrate-toolset-tryout-tool-to-core`. Toolsets have zero remaining admin-BE dependency, except that `tryOutAssetTool` for `ResourceType.APPLICATION` still routes through the admin BE pending the applications migration.

## Requirements

### Requirement: Toolset resources served directly by DIAL Core
The system SHALL route toolset-resource list, get, create, update, delete, bulk-delete, and move operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/assets-toolsets` routes, `Toolsets/List`/`Toolsets/View` components, the server-action signatures in `assets-toolsets/actions.ts`, or the `Toolset`/`AssetToolset` models.

#### Scenario: Toolset-resource CRUD and move operations call Core
- **WHEN** any of `getToolsets`, `createToolset`, `getToolset`, `updateToolset`, `removeToolset`, `bulkDeleteToolsets`, `moveToolsets` runs
- **THEN** it calls DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the toolsets list page or a single toolset page renders
- **THEN** the data shape passed to `Toolsets/List`/`Toolsets/View` is identical to what the admin-BE path returned previously

### Requirement: Toolset-resource list has no default path or limit
The system SHALL NOT apply a default path or default limit to toolset-resource list reads — the caller's supplied path and limit (or absence thereof) pass through unchanged, matching the BE's `ToolSetResourceService`.

#### Scenario: Listing without an explicit path is not defaulted
- **WHEN** `getToolsets` is called without a path
- **THEN** no default path is substituted, unlike conversation and prompt list reads

### Requirement: Toolset-resource get resolves path via folder listing, then conditional GET
The system SHALL resolve a toolset's storage path by listing its folder and matching on `name` and `version`, then fetch that resolved path via the shared Core asset client's conditional GET.

#### Scenario: Get resolves by name and version
- **WHEN** `getToolset(folderId, name, version, etag)` is called
- **THEN** the folder is listed, the item matching both `name` and `version` is selected, and its resolved path is fetched with the supplied etag

### Requirement: Toolset-resource create rejects on conflict; update requires the current etag
The system SHALL create a toolset-resource with `If-None-Match: *` (rejecting if a resource already exists at that path) and SHALL update with `If-Match` set to the caller's etag.

#### Scenario: Create conflicts with an existing toolset
- **WHEN** `createToolset` targets a path that already exists in Core
- **THEN** the create request is rejected with a recognizable "already exists" error

#### Scenario: Update sends the caller's etag
- **WHEN** `updateToolset(toolset, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Toolset-resource delete and move preserve existing conditional/duplicate semantics
The system SHALL send `If-Match` for single toolset delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item; move SHALL preserve the existing duplicate-with-renamed-version behavior when a duplicate name is supplied.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removeToolset(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `moveToolsets` is called with a `duplicateName`
- **THEN** the destination path carries the duplicate name with the source's version suffix reapplied, unchanged from current behavior

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

### Requirement: Toolset try-out-tool runs a direct MCP client session against Core
The system SHALL invoke a toolset's tool directly against DIAL Core's MCP endpoint by opening a short-lived MCP client session (initialize handshake, then a single `callTool` request), authenticated with the admin bearer token, and SHALL close that session after the call completes or fails.

#### Scenario: Try-out-tool calls Core's MCP endpoint directly
- **WHEN** `tryOutAssetTool` is called for `ResourceType.TOOLSET`
- **THEN** an MCP client session is opened directly against DIAL Core's toolset MCP endpoint, not the admin BE

#### Scenario: The session is closed after a successful call
- **WHEN** a tool call completes successfully
- **THEN** the MCP client session is closed before the result is returned

#### Scenario: The session is closed after a failed call
- **WHEN** a tool call fails
- **THEN** the MCP client session is still closed, and a recognizable error response is returned

### Requirement: Try-out-tool preserves the existing request/response contract
The system SHALL accept the same `{ toolSetPath: { path }, callToolRequest: { name, arguments } }` request shape and return the same raw tool-call-result shape the admin BE previously returned, so no caller-side change is required.

#### Scenario: Request and response shapes are unchanged
- **WHEN** `tryOutAssetTool` is called with a toolset path and a `callToolRequest`
- **THEN** the response shape matches what the admin-BE-backed implementation previously returned

### Requirement: Application try-out-tool remains unaffected
The system SHALL continue routing `tryOutAssetTool` calls for `ResourceType.APPLICATION` through the admin BE, unchanged by this capability.

#### Scenario: Application resource type is unaffected
- **WHEN** `tryOutAssetTool` is called for `ResourceType.APPLICATION`
- **THEN** the request is still routed through the admin BE, not DIAL Core

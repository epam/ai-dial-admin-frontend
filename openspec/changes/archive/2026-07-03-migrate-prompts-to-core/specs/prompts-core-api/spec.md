## ADDED Requirements

### Requirement: Prompts served directly by DIAL Core
The system SHALL route prompt list, get, create, update, delete, bulk-delete, and move operations to DIAL Core unconditionally via the shared Core asset client — there is no admin-BE fallback and no feature flag for these operations. The cutover SHALL NOT change the `/prompts` routes, `PromptsList`/`PromptView` components, the server-action signatures in `prompts/actions.ts`, or the `DialPrompt` model.

#### Scenario: Prompt CRUD and move operations call Core
- **WHEN** any of `createPrompt`, `updatePrompt`, `getPrompts`, `getPrompt`, `removePrompt`, `bulkDeletePrompts`, `movePrompts` runs
- **THEN** it calls DIAL Core via the shared asset client, not the admin BE

#### Scenario: Contract unchanged
- **WHEN** the prompts list page or a single prompt page renders
- **THEN** the data shape passed to `PromptsList`/`PromptView` is identical to what the admin-BE path returned previously

### Requirement: Prompt list uses metadata defaults
The system SHALL list prompts via the shared Core asset client's metadata read, relying on that client's default path (`"public/"`) and default limit when the caller omits either.

#### Scenario: Listing without an explicit path
- **WHEN** `getPrompts` is called without a path
- **THEN** the underlying metadata read defaults to `"public/"`

### Requirement: Prompt get resolves path via folder listing, then conditional GET
The system SHALL resolve a prompt's storage path by listing its folder and matching on `name` and `version`, then fetch that resolved path via the shared Core asset client's conditional GET, returning the same `DialPrompt` shape and etag as before.

#### Scenario: Get resolves by name and version
- **WHEN** `getPrompt(folderId, name, version, etag)` is called
- **THEN** the folder is listed, the item matching both `name` and `version` is selected, and its resolved path is fetched with the supplied etag

### Requirement: Prompt create rejects on conflict; update requires the current etag
The system SHALL create a prompt with `If-None-Match: *` (rejecting if a resource already exists at that path) and SHALL update a prompt with `If-Match` set to the caller's etag, matching the admin BE's precondition semantics.

#### Scenario: Create conflicts with an existing prompt
- **WHEN** `createPrompt` targets a path that already exists in Core
- **THEN** the create request is rejected and the caller receives a recognizable "already exists" error, matching prior BE-backed behavior

#### Scenario: Update sends the caller's etag
- **WHEN** `updatePrompt(prompt, etag)` is called
- **THEN** the update request to Core includes `If-Match` set to that etag

### Requirement: Prompt delete and move preserve existing conditional/duplicate semantics
The system SHALL send `If-Match` for single prompt delete when a concrete etag is supplied and no conditional header when omitted; bulk delete SHALL remain unconditional per item; move SHALL preserve the existing duplicate-with-renamed-version behavior when a duplicate name is supplied.

#### Scenario: Single delete is conditional when an etag is present
- **WHEN** `removePrompt(path, etag)` is called with a concrete etag
- **THEN** the delete request to Core includes `If-Match` set to that etag

#### Scenario: Move with a duplicate name renames the version suffix
- **WHEN** `movePrompts` is called with a `duplicateName`
- **THEN** the destination path carries the duplicate name with the source's version suffix reapplied, unchanged from current behavior

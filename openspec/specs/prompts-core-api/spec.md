# prompts-core-api Specification

## Purpose
Prompt list, get, create, update, delete, bulk-delete, move, JSON/zip export, and JSON/zip import executed directly against DIAL Core via the shared `core-asset-client`, replacing the admin-BE proxy for these operations, while the FE-facing `DialPrompt` contract, routes, and server-action signatures stay identical — CRUD/move created by archiving change `migrate-prompts-to-core`, import/export completed by archiving change `migrate-prompts-import-export-to-core`. Prompts have zero remaining admin-BE dependency. Folder-rules propagation on import remains out of scope (the Create-Folder wizard that used to be its only reachable path has since been removed from the app entirely).

## Requirements

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

### Requirement: Prompt export builds a structured aggregate document directly against Core
The system SHALL build a `{ prompts: DialPrompt[] }` document (the existing `ParsedAssets` shape) from selected prompt paths by fetching each prompt's merged content+metadata directly from DIAL Core and setting each prompt's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportPrompts` is called with `fileType=json`
- **THEN** the response is the `{ prompts: DialPrompt[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportPrompts` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `prompts/prompts.json`, holding the same `{ prompts: DialPrompt[] }` document

### Requirement: Prompt import resolves conflicts against Core's live state
The system SHALL validate each incoming prompt's `id` against the prompt path shape, check whether a prompt already exists at its resolved destination path directly against DIAL Core, and apply the caller-supplied conflict-resolution policy: `OVERRIDE` writes through regardless of an existing conflict; `SKIP` treats an existing conflict as a non-error skipped outcome rather than a failure.

#### Scenario: OVERRIDE writes through despite an existing prompt
- **WHEN** an incoming prompt targets a path where a prompt already exists and the policy is `OVERRIDE`
- **THEN** the import writes the incoming prompt to that path

#### Scenario: SKIP treats an existing prompt as a non-failure
- **WHEN** an incoming prompt targets a path where a prompt already exists and the policy is `SKIP`
- **THEN** that entry is reported as skipped, not as a failure, and does not count toward the consecutive-failure circuit breaker

#### Scenario: An id that fails the path-shape check is rejected
- **WHEN** an incoming prompt's `id` does not match the expected prompt path shape
- **THEN** that entry is rejected before any write is attempted against Core

### Requirement: Prompt import preserves the consecutive-failure circuit breaker
The system SHALL abort a multi-prompt import batch after a configured number of consecutive real failures, reusing the same circuit-breaker mechanism already built for file import, rather than continuing to attempt every remaining entry.

#### Scenario: Consecutive failures abort the batch
- **WHEN** a prompt import hits the configured number of consecutive per-entry failures
- **THEN** the remaining entries in the batch are not attempted, and the response reflects the partial result

### Requirement: Zip import merges multiple JSON entries and rejects in-archive id collisions
The system SHALL unpack every `prompts/*.json` entry from an uploaded zip archive (validating entry paths with the same path-traversal guard used for file import), merge their `{ prompts: DialPrompt[] }` documents into one, and reject the archive if the same prompt id appears in more than one entry.

#### Scenario: Multiple JSON entries are merged into one import batch
- **WHEN** a zip archive contains more than one `prompts/*.json` entry with disjoint prompt ids
- **THEN** all prompts from every entry are imported as a single merged batch

#### Scenario: A duplicated prompt id across entries is rejected
- **WHEN** the same prompt id appears in more than one `prompts/*.json` entry within the same archive
- **THEN** the import is rejected before any entry from that archive is written

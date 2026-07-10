## ADDED Requirements

### Requirement: Prompt export builds a structured aggregate document directly against Core
The system SHALL build a `{ prompts: DialPrompt[] }` document (the existing `ParsedAssets` shape) from selected prompt paths by fetching each prompt's merged content+metadata directly from DIAL Core and setting each prompt's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportPrompts` is called with `fileType=json`
- **THEN** the response is the `{ prompts: DialPrompt[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportPrompts` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `prompts/prompts.json`, holding the same `PromptsExim` document

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

### Requirement: Zip preview is a client-side operation
The system SHALL derive the zip-preview grid's `{name, version, fileName}` rows by parsing the uploaded archive's `PromptsExim` document directly in the browser, without a round-trip to any server.

#### Scenario: Preview renders without a network call
- **WHEN** a user uploads a zip archive to the Create-Folder wizard's prompt-import review step
- **THEN** the preview rows are derived from a client-side parse of the archive's JSON contents, with no request sent to the admin BE or DIAL Core

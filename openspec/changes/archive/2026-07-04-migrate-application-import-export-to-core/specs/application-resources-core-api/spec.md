## ADDED Requirements

### Requirement: Application export builds a structured aggregate document directly against Core
The system SHALL build a `{ applications: AssetApp[] }` document (the existing `ParsedAssets` shape) from selected application paths by fetching each application's merged content+metadata directly from DIAL Core and setting each application's `id` to its Core-prefixed path — not a per-file zip archive, and not a new wire type.

#### Scenario: JSON export returns the aggregate document directly
- **WHEN** `exportApps` is called with `fileType=json`
- **THEN** the response is the `{ applications: AssetApp[] }` document built directly from DIAL Core content+metadata

#### Scenario: Zip export wraps the same document as a single entry
- **WHEN** `exportApps` is called with `fileType=archive`
- **THEN** the response is a zip archive containing exactly one entry, `applications/applications.json`, holding the same `{ applications: AssetApp[] }` document

### Requirement: Application import resolves conflicts against Core's live state
The system SHALL check whether an application already exists at its resolved destination path directly against DIAL Core, and apply the caller-supplied conflict-resolution policy: `OVERRIDE` writes through regardless of an existing conflict; `SKIP` treats an existing conflict as a non-error skipped outcome rather than a failure. The system SHALL abort a multi-application import batch after a configured number of consecutive real failures, reusing the same circuit-breaker mechanism already built for files/prompts/toolsets import.

#### Scenario: OVERRIDE writes through despite an existing application
- **WHEN** an incoming application targets a path where an application already exists and the policy is `OVERRIDE`
- **THEN** the import writes the incoming application to that path

#### Scenario: SKIP treats an existing application as a non-failure
- **WHEN** an incoming application targets a path where an application already exists and the policy is `SKIP`
- **THEN** that entry is reported as skipped, not as a failure, and does not count toward the consecutive-failure circuit breaker

#### Scenario: Consecutive failures abort the batch
- **WHEN** an application import hits the configured number of consecutive per-entry failures
- **THEN** the remaining entries in the batch are not attempted, and the response reflects the partial result

### Requirement: Zip import merges multiple JSON entries and rejects in-archive id collisions
The system SHALL unpack every `applications/*.json` entry from an uploaded zip archive (validating entry paths with the same path-traversal guard used for files/prompts/toolsets import), merge their `{ applications: AssetApp[] }` documents into one, and reject the archive if the same application id appears in more than one entry.

#### Scenario: Multiple JSON entries are merged into one import batch
- **WHEN** a zip archive contains more than one `applications/*.json` entry with disjoint application ids
- **THEN** all applications from every entry are imported as a single merged batch

#### Scenario: A duplicated application id across entries is rejected
- **WHEN** the same application id appears in more than one `applications/*.json` entry within the same archive
- **THEN** the import is rejected before any entry from that archive is written

## REMOVED Requirements

### Requirement: Validity state is sourced from the admin BE as a scoped Phase 1 dependency
**Reason**: The BE computes `validityState` via a fully admin-authored, BE-database-only `ApplicationTypeSchema` table with no seed data and no Core equivalent — there is no clean migration path short of bundling schemas client-side (losing admin editability) or keeping the BE dependency indefinitely. Confirmed with the user: dropped entirely rather than deferred. No component under `src/components/Assets/` reads `validityState`, so this has no observed UI impact.
**Migration**: `withValidityState` and its call site in `getApp` are removed. `validityState` is simply absent (`undefined`) on asset applications going forward; the field remains declared as optional on the shared `EntityValidityState`/`DialApplication` models used by unrelated entity types.

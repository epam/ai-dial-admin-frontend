## Why

Platform App Runners and Catalog Schemas are Core schema resources with a declared `$id` that is distinct from their storage name. Their create and duplicate experiences currently validate that identity inconsistently: users can discover a known collision only after a Core write, while the existing Platform App Runner duplicate flow already proves that an inline, submit-time check is practical.

## What Changes

- Standardize declared `$id` collision validation for Platform App Runner and Catalog Schema **Create** and **Duplicate** actions.
- Resolve a locally valid proposed `$id` only when the user activates Create or Duplicate; show the standard inline existing-ID error and block the action when the resource-specific Core resolver finds a match.
- Clear the resolved-ID error as soon as the user edits `$id`; preserve normal action behavior when the resolver finds no resource or fails.
- Preserve Core as the authoritative write-time collision check for concurrent changes and lookup outages.
- Preserve and cover the existing Platform App Runner duplicate behavior as part of the common contract.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-app-runners`: Platform App Runner creation and duplication consistently validate an occupied declared `$id` inline before invoking their Core-backed write path.
- `platform-catalog-schemas`: Catalog Schema creation and duplication consistently validate an occupied declared `$id` inline before invoking their Core-backed write path.

## Impact

- Shared create-modal orchestration and the Platform App Runner/Catalog Schema create-property paths.
- `DuplicatePlatformAsset` and its resource-specific resolver integrations.
- Existing `getResolvedRunnerSchema`, `getCatalogSchemaById`, `createRunner`, and `createCatalogSchema` server actions; their API contracts and final Core conflict handling remain unchanged.
- Focused component tests for each resource's Create and Duplicate flows, plus regression coverage for unchanged resource types.

## Non-goals

- Changing Core's `$id` uniqueness or immutability rules, storage-name validation, or the API contract.
- Validating on each keystroke, caching/reserving IDs, or replacing the Core write conflict response.
- Applying the pattern to legacy admin-backend Application Runners or unrelated platform asset types.

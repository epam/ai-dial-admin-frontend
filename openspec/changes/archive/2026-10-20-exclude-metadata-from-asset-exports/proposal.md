## Why

Assets exports currently serialize the frontend-only `_metadata` object from merged Core resource reads. This exposes internal identity and audit fields in both JSON and DIAL archive downloads, contrary to the intended portable resource-content format.

## What Changes

- Remove `_metadata` from each entity emitted by the shared Assets export builder before JSON download or DIAL archive serialization.
- Preserve the export `id` needed for import routing and all resource-content fields.
- Continue accepting existing exports that contain `_metadata`, stripping it before writes to Core.
- Update export regression coverage for prompts, asset applications, and asset toolsets.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `core-resource-entity-metadata`: Export documents no longer include the frontend-constructed `_metadata` object; import compatibility for documents that do include it remains unchanged.

## Impact

- Shared export shaping in `apps/ai-dial-admin/src/server/assets/exim.ts` and its focused unit tests.
- Type-specific export wrapper tests for prompts, asset applications, and asset toolsets.
- No Core API contract, archive format wrapper, UI modal, or global Export Config behavior changes.

## Non-goals

- Changing how merged detail reads expose `_metadata` to the frontend.
- Removing `_metadata` from unrelated backend-generated Export Config downloads.
- Altering the `id` field or other import-routing data in Assets export documents.

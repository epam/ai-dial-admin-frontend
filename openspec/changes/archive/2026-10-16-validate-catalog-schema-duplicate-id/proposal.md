## Why

Creating a Catalog Schema currently validates the declared `$id` only for local format constraints. An ID that already exists in DIAL Core therefore reaches the write request and surfaces only as a post-submit conflict notification, rather than as a correctable error in the Create modal.

## What Changes

- Preflight a locally valid declared Catalog Schema `$id` against DIAL Core when the user activates Create.
- Display the established duplicate-ID message inline beneath `$id`, block creation while it is present, and clear it when the user edits `$id`.
- Preserve the existing Core create path when the ID does not resolve or the preflight request fails; retain Core's conflict response as the authoritative concurrent-write safeguard.
- Reuse the submit-time, inline-error pattern introduced by `fix-platform-app-runner-duplicate-validation` for Platform App Runner duplication.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-catalog-schemas`: Creating a Catalog Schema validates an already-registered declared `$id` inline before attempting the Core write.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Platform/CatalogSchemas/CreateProperties.tsx` and its create-form orchestration.
- `apps/ai-dial-admin/src/app/[lang]/platform-catalog-schemas/actions.ts`, specifically the existing `getCatalogSchemaById` Core lookup.
- The shared `IdControl` external-error API and `SaveValidationContext` behavior are reused without changing other callers.
- Focused Catalog Schema create-form and action tests; no Core API contract, migration, or backend deployment change is required.

## Non-goals

- Changing Catalog Schema storage-name validation or resource naming.
- Validating on every `$id` keystroke, reserving IDs, or replacing Core's final conflict enforcement.
- Changing Platform App Runner creation or duplicate behavior, legacy Application Runners, or other asset create forms.

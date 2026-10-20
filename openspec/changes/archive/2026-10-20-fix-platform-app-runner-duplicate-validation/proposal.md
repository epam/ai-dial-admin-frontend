## Why

Duplicating a Platform App Runner retains its original Core storage `name`, so the cloned resource conflicts with the source rather than being written under a new storage key. The duplicate modal also permits a declared `$id` that already resolves in Core, deferring a predictable collision until the create request.

## What Changes

- Add a required Core storage Name field to the Platform App Runner duplicate form, initialized from the source name with a `-copy` suffix.
- Validate the proposed storage Name inline against existing Platform App Runner names and prevent duplication while it is invalid.
- Before creating a Platform App Runner duplicate, query Core for the proposed `$id`; display an inline ID-exists error and disable Duplicate if a schema is returned.
- Clear the resolved-ID error as soon as the user changes `$id`.
- Preserve duplicate behavior for all other platform asset types and preserve the existing Core create flow after validation succeeds.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `platform-app-runners`: Platform App Runner duplication now collects and validates both the Core storage name and the declared schema ID before creating the Core resource.

## Impact

- `apps/ai-dial-admin/src/components/Assets/Modals/DuplicatePlatformAsset.tsx`
- `apps/ai-dial-admin/src/components/BaseControls/Id/Id.tsx`, if extended to surface the asynchronous ID collision inline.
- `apps/ai-dial-admin/src/components/Assets/Modals/tests/DuplicatePlatformAsset.spec.tsx` and focused `IdControl` tests.
- Existing `getResolvedRunnerSchema` and `createRunner` Core-backed actions; the admin-BE-backed `Entities > Application Runners` surface is unaffected.

## Non-goals

- Altering duplicate behavior for Models, Routes, Roles, Interceptors, platform-bucket Applications, or Toolsets.
- Changing the Entity App Runners (`/application-runners`) modal, API client, or create behavior.
- Reserving a name or `$id` server-side; the Core write remains authoritative for concurrent operations.

## Why

Policy creation uses the entered cost object for the path, but does not place it in the policy body when the policy supplies subjects (#5467). Core requires each assignment's subject to be pinned exactly once across the policy and assignment; a cost object pinned in both is also rejected. Both create forms need room for optional subject rules without making either entity require subjects on its own.

## What Changes

- Split policy and assignment creation into **Details** and optional **Subjects** steps, using the shared subject editor and rule validation. Next requires valid details; Back preserves edits; Create requires valid rules as well.
- On policy creation only, put the selected folder cost object in the policy body when both a folder and subject rules are present. Otherwise omit it.
- Keep the assignment body and existing success and failure behavior unchanged. Core remains responsible for semantic validation across policy and assignment.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `platform-policies`: two-step creation, optional subjects, and the conditional policy-body cost object.
- `platform-policy-assignments`: two-step creation with optional subjects and unchanged assignment payload.

## Non-goals

- Changing policy or assignment updates, duplication, existing payload serialization outside policy creation, or Core validation.
- Automatically pinning a policy when subjects are added after creation.
- Requiring subjects on either form or checking the referenced policy's subjects in the client.

## Impact

A dedicated policy and assignment creation modal, the policy and assignment create properties, the shared subject editor and validation, and localized labels and hints are involved. The generic `CreateEntity` modal remains unchanged. Both resources are written directly to Core, not the admin backend; no API contract changes are required.

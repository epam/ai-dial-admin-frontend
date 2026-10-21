## Context

`Assets > App Runners` is the Platform App Runner surface. Its duplicate modal is shared with other flat platform asset types through `DuplicatePlatformAsset`, but App Runners uniquely carry two Core identities: the storage `name` used as the write target and the schema body's declared `$id`. The current runner branch changes only `$id`, retaining the source storage name and therefore colliding with the original Core resource.

The caller already supplies the platform asset names to the modal. For Platform App Runners these are Core storage names, so they can validate the new Name field directly. The existing `getResolvedRunnerSchema` server action resolves a declared `$id` against Core and can distinguish a known schema from an unresolved ID.

## Goals / Non-Goals

**Goals:**

- Create Platform App Runner duplicates under a distinct, valid Core storage name.
- Give inline validation feedback for storage-name and declared-ID collisions before the Core create action runs.
- Keep the current Core-backed create behavior and shared duplicate behavior for non-runner assets.
- Reuse the standard input and `SaveValidationContext` validity flow.

**Non-Goals:**

- Change the admin-BE-backed `Entities > Application Runners` duplicate modal.
- Change Models, Routes, Roles, Interceptors, platform Applications, or Toolsets in the shared modal.
- Reserve identifiers or remove Core's final conflict enforcement.

## Decisions

### Add Name only to the Platform App Runner branch

`DuplicatePlatformAsset` will conditionally render a required Name input only when `view === ApplicationRoute.PlatformAppRunners`. It will initialize the runner clone's storage name as `<source-name>-copy`; other `PlatformAsset` variants retain their current two-field or one-field forms unchanged.

The platform list's supplied `names` collection is the appropriate storage-name collection for the new field. Reusing it avoids adding cross-cutting list plumbing solely for this variant.

### Reuse `IdControl` for storage-name validation

The new Name input will use `IdControl` with a Name label and a separate validation field. It inherits the established required, length, character, and existing-name validation instead of duplicating it in the shared modal.

### Support submit-time declared-ID errors in `IdControl`

The modal needs to show a Core-resolved collision beneath the existing ID input. `IdControl` will gain an optional external error prop, following the established `DisplayNameControl` pattern. It will render the message and mark the configured validation field invalid. This addition remains opt-in, preserving every existing caller's behavior.

### Resolve declared ID only when Duplicate is activated

When a Platform App Runner form is otherwise valid and Duplicate is activated, the modal calls `getResolvedRunnerSchema` with the edited `$id`. A returned schema produces the existing-ID message and prevents the create callback; editing `$id` clears that state. A response without a schema proceeds through the existing `createRunner` callback.

This avoids Core traffic for each keystroke while retaining Core's write conflict response as the authoritative result for concurrent writes.

## Risks / Trade-offs

- [A concurrent write can occur after the pre-check] → `createRunner` remains authoritative and retains its normal failure behavior.
- [A transient lookup failure cannot prove an ID is unused] → Only a returned schema blocks duplication; the final Core create response still determines write success.
- [The optional `IdControl` extension is shared] → Keep it backward-compatible and add focused regression tests for its error state and recovery.
- [A legacy runner may lack a source storage name] → The required Name control prevents submitting an invalid blank storage key rather than deriving one from a URL `$id`.

## Migration Plan

No migration or backend deployment ordering is needed. This frontend-only change can be rolled back independently; existing Core resource validation remains in force.

## Open Questions

None.
